import { db, getCachedStatement } from '../db/schema.js'
import { detectLang } from '../processing/detectLang.js'
import type { StackOverflowQuestionRaw, StoredDocument } from '../types.js'

const INSERT_SQL = `
  INSERT INTO documents (question_id, title, body, tag, created_utc, score, answer_count, link, lang)
  VALUES (@questionId, @title, @body, @tag, @createdUtc, @score, @answerCount, @link, @lang)
  ON CONFLICT(question_id) DO UPDATE SET
    title = excluded.title,
    body = excluded.body,
    tag = excluded.tag,
    created_utc = excluded.created_utc,
    link = excluded.link,
    lang = excluded.lang,
    processed_at = NULL,
    score = excluded.score,
    answer_count = excluded.answer_count
`

const SELECT_ALL_SQL = `
  SELECT id, question_id as questionId, title, body, tag, created_utc as createdUtc,
         score, answer_count as answerCount, link, lang
  FROM documents
`

const SELECT_BY_ID_SQL = `
  SELECT id, question_id as questionId, title, body, tag, created_utc as createdUtc,
         score, answer_count as answerCount, link, lang
  FROM documents WHERE id = ?
`

const MARK_PROCESSED_SQL = `UPDATE documents SET processed_at = datetime('now') WHERE id = ?`
const COUNT_DOCS_SQL = `SELECT COUNT(*) as count FROM documents`
const SELECT_IDS_SQL = `SELECT id FROM documents`

export function ingestQuestions(questions: StackOverflowQuestionRaw[]): number {
  const insertStmt = getCachedStatement(INSERT_SQL)
  const insertMany = db.transaction((items: StackOverflowQuestionRaw[]) => {
    for (const q of items) {
      const lang = detectLang(`${q.title} ${q.body}`)
      insertStmt.run({ ...q, lang })
    }
  })
  insertMany(questions)
  return questions.length
}

export function getAllDocuments(): StoredDocument[] {
  return getCachedStatement(SELECT_ALL_SQL).all() as StoredDocument[]
}

export function getDocumentById(id: number): StoredDocument | undefined {
  return getCachedStatement(SELECT_BY_ID_SQL).get(id) as StoredDocument | undefined
}

export function markProcessed(docId: number): void {
  getCachedStatement(MARK_PROCESSED_SQL).run(docId)
}

export function corpusSize(): number {
  const row = getCachedStatement(COUNT_DOCS_SQL).get() as { count: number }
  return row.count
}

export function getAllDocumentIds(): Set<number> {
  const rows = getCachedStatement(SELECT_IDS_SQL).all() as { id: number }[]
  return new Set(rows.map((row) => row.id))
}
