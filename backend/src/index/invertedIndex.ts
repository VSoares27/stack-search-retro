import { db, getCachedStatement } from '../db/schema.js'
import { preprocess } from '../processing/pipeline.js'
import { getAllDocuments, markProcessed, updateDocNorm } from '../corpus/corpusManager.js'
import type { StoredDocument } from '../types.js'

const UPSERT_TERM_SQL = `
  INSERT INTO terms (term, document_freq, idf) VALUES (?, 1, 0)
  ON CONFLICT(term) DO UPDATE SET document_freq = document_freq + 1
`

const INSERT_POSTING_SQL = `
  INSERT OR REPLACE INTO postings (term, doc_id, term_freq, tfidf) VALUES (?, ?, ?, 0)
`

const DELETE_ALL_POSTINGS_SQL = `DELETE FROM postings`
const DELETE_ALL_TERMS_SQL = `DELETE FROM terms`
const COUNT_TERMS_SQL = `SELECT COUNT(*) as count FROM terms`
const SELECT_ALL_TERMS_SQL = `SELECT term, document_freq as documentFreq FROM terms`
const UPDATE_TERM_IDF_SQL = `UPDATE terms SET idf = ? WHERE term = ?`
const SELECT_ALL_POSTINGS_SQL = `SELECT term, doc_id as docId, term_freq as termFreq FROM postings`
const UPDATE_POSTING_TFIDF_SQL = `UPDATE postings SET tfidf = ? WHERE term = ? AND doc_id = ?`

const POSTINGS_FOR_TERM_SQL = `SELECT doc_id as docId FROM postings WHERE term = ?`
const POSTINGS_WITH_TFIDF_SQL = `SELECT doc_id as docId, tfidf, term_freq as termFreq FROM postings WHERE term = ?`
const GET_TERM_IDF_SQL = `SELECT idf FROM terms WHERE term = ?`
const GET_DOC_NORM_SQL = `SELECT doc_norm as docNorm FROM documents WHERE id = ?`
const TOP_VOCABULARY_SQL = `
  SELECT term, document_freq as documentFreq, idf
  FROM terms
  ORDER BY document_freq DESC, idf DESC
  LIMIT ?
`

export function buildInvertedIndex(): { documentsProcessed: number; vocabularySize: number } {
  const documents = getAllDocuments()
  const N = documents.length

  const upsertTermStmt = getCachedStatement(UPSERT_TERM_SQL)
  const insertPostingStmt = getCachedStatement(INSERT_POSTING_SQL)
  const deleteAllPostingsStmt = getCachedStatement(DELETE_ALL_POSTINGS_SQL)
  const deleteAllTermsStmt = getCachedStatement(DELETE_ALL_TERMS_SQL)
  const updateTermIdfStmt = getCachedStatement(UPDATE_TERM_IDF_SQL)
  const updatePostingTfidfStmt = getCachedStatement(UPDATE_POSTING_TFIDF_SQL)

  // Executa toda a reconstrução em transação única de alta performance
  const transaction = db.transaction(() => {
    deleteAllPostingsStmt.run()
    deleteAllTermsStmt.run()

    // 1. Coleta e insere frequências de termos (TF) por documento
    for (const doc of documents) {
      const { terms } = preprocess(`${doc.title} ${doc.body}`, doc.lang)
      const tfMap = new Map<string, number>()

      for (const t of terms) {
        tfMap.set(t, (tfMap.get(t) ?? 0) + 1)
      }

      for (const [term, freq] of tfMap.entries()) {
        upsertTermStmt.run(term)
        insertPostingStmt.run(term, doc.id, freq)
      }
    }

    // 2. Calcula IDF para cada termo do vocabulário: IDF = ln(1 + N / DF)
    const termsRows = getCachedStatement(SELECT_ALL_TERMS_SQL).all() as { term: string; documentFreq: number }[]
    const idfMap = new Map<string, number>()

    for (const row of termsRows) {
      const idf = Math.log(1 + (N / Math.max(1, row.documentFreq)))
      idfMap.set(row.term, idf)
      updateTermIdfStmt.run(idf, row.term)
    }

    // 3. Calcula pesos TF-IDF nos postings e a norma Euclidiana ||d|| dos documentos
    // TF sublinear: TF = 1 + ln(f) se f > 0
    const postingsRows = getCachedStatement(SELECT_ALL_POSTINGS_SQL).all() as {
      term: string
      docId: number
      termFreq: number
    }[]

    const docNormSqMap = new Map<number, number>()

    for (const p of postingsRows) {
      const idf = idfMap.get(p.term) ?? 0
      const tf = p.termFreq > 0 ? 1 + Math.log(p.termFreq) : 0
      const tfidf = tf * idf

      updatePostingTfidfStmt.run(tfidf, p.term, p.docId)

      const currentSum = docNormSqMap.get(p.docId) ?? 0
      docNormSqMap.set(p.docId, currentSum + tfidf * tfidf)
    }

    // 4. Atualiza norma ||d|| de cada documento para normalização por Cosseno
    for (const doc of documents) {
      const sumSq = docNormSqMap.get(doc.id) ?? 0
      const norm = sumSq > 0 ? Math.sqrt(sumSq) : 1.0
      updateDocNorm(doc.id, norm)
      markProcessed(doc.id)
    }
  })

  transaction()

  const vocabCount = (getCachedStatement(COUNT_TERMS_SQL).get() as { count: number }).count
  return { documentsProcessed: N, vocabularySize: vocabCount }
}

export function getPostingsForTerm(term: string): Set<number> {
  const rows = getCachedStatement(POSTINGS_FOR_TERM_SQL).all(term) as { docId: number }[]
  return new Set(rows.map((r) => r.docId))
}

export function getPostingsWithTfidf(term: string): { docId: number; tfidf: number; termFreq: number }[] {
  return getCachedStatement(POSTINGS_WITH_TFIDF_SQL).all(term) as {
    docId: number
    tfidf: number
    termFreq: number
  }[]
}

export function getIdf(term: string): number {
  const row = getCachedStatement(GET_TERM_IDF_SQL).get(term) as { idf: number } | undefined
  return row?.idf ?? 0
}

export function getDocNorm(docId: number): number {
  const row = getCachedStatement(GET_DOC_NORM_SQL).get(docId) as { docNorm: number } | undefined
  return row?.docNorm ?? 1.0
}

export function vocabularySize(): number {
  return (getCachedStatement(COUNT_TERMS_SQL).get() as { count: number }).count
}

export function topVocabulary(limit = 20): { term: string; documentFreq: number; idf: number }[] {
  return getCachedStatement(TOP_VOCABULARY_SQL).all(limit) as {
    term: string
    documentFreq: number
    idf: number
  }[]
}
