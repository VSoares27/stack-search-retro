import { db, getCachedStatement } from '../db/schema.js'
import { preprocess } from '../processing/pipeline.js'
import { getAllDocuments, markProcessed } from '../corpus/corpusManager.js'
import type { StoredDocument } from '../types.js'

const UPSERT_TERM_SQL = `
  INSERT INTO terms (term, document_freq) VALUES (?, 1)
  ON CONFLICT(term) DO UPDATE SET document_freq = document_freq + 1
`

const INSERT_POSTING_SQL = `
  INSERT OR IGNORE INTO postings (term, doc_id) VALUES (?, ?)
`

const CLEAR_DOC_POSTINGS_SQL = `DELETE FROM postings WHERE doc_id = ?`
const DELETE_ALL_POSTINGS_SQL = `DELETE FROM postings`
const DELETE_ALL_TERMS_SQL = `DELETE FROM terms`
const COUNT_TERMS_SQL = `SELECT COUNT(*) as count FROM terms`
const POSTINGS_FOR_TERM_SQL = `SELECT doc_id as docId FROM postings WHERE term = ?`
const TOP_VOCABULARY_SQL = `SELECT term, document_freq as documentFreq FROM terms ORDER BY document_freq DESC LIMIT ?`

export function buildInvertedIndex(): { documentsProcessed: number; vocabularySize: number } {
  const upsertTermStmt = getCachedStatement(UPSERT_TERM_SQL)
  const insertPostingStmt = getCachedStatement(INSERT_POSTING_SQL)
  const clearDocPostingsStmt = getCachedStatement(CLEAR_DOC_POSTINGS_SQL)
  const deleteAllPostingsStmt = getCachedStatement(DELETE_ALL_POSTINGS_SQL)
  const deleteAllTermsStmt = getCachedStatement(DELETE_ALL_TERMS_SQL)

  function indexDocument(doc: StoredDocument): void {
    clearDocPostingsStmt.run(doc.id)

    const { terms } = preprocess(`${doc.title} ${doc.body}`, doc.lang)
    const uniqueTerms = new Set(terms)

    for (const term of uniqueTerms) {
      upsertTermStmt.run(term)
      insertPostingStmt.run(term, doc.id)
    }

    markProcessed(doc.id)
  }

  const documents = getAllDocuments()
  const indexAll = db.transaction((docs: StoredDocument[]) => {
    deleteAllPostingsStmt.run()
    deleteAllTermsStmt.run()
    for (const doc of docs) indexDocument(doc)
  })
  indexAll(documents)

  const vocabularySize = (getCachedStatement(COUNT_TERMS_SQL).get() as { count: number }).count
  return { documentsProcessed: documents.length, vocabularySize }
}

export function getPostingsForTerm(term: string): Set<number> {
  const rows = getCachedStatement(POSTINGS_FOR_TERM_SQL).all(term) as {
    docId: number
  }[]
  return new Set(rows.map((r) => r.docId))
}

export function vocabularySize(): number {
  return (getCachedStatement(COUNT_TERMS_SQL).get() as { count: number }).count
}

export function topVocabulary(limit = 20): { term: string; documentFreq: number }[] {
  return getCachedStatement(TOP_VOCABULARY_SQL).all(limit) as { term: string; documentFreq: number }[]
}
