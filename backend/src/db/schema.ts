import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { env } from '../config/env.js'

mkdirSync(dirname(env.dbPath), { recursive: true })

export const db = new Database(env.dbPath)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id   TEXT UNIQUE NOT NULL,
    title         TEXT NOT NULL,
    body          TEXT NOT NULL DEFAULT '',
    tag           TEXT NOT NULL,
    created_utc   INTEGER NOT NULL,
    score         INTEGER NOT NULL DEFAULT 0,
    answer_count  INTEGER NOT NULL DEFAULT 0,
    link          TEXT NOT NULL,
    lang          TEXT NOT NULL DEFAULT 'en',
    processed_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS terms (
    term           TEXT PRIMARY KEY,
    document_freq  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS postings (
    term    TEXT NOT NULL REFERENCES terms(term) ON DELETE CASCADE,
    doc_id  INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    PRIMARY KEY (term, doc_id)
  );

  CREATE INDEX IF NOT EXISTS idx_postings_term ON postings(term);
  CREATE INDEX IF NOT EXISTS idx_documents_tag ON documents(tag);
`)

const statementCache = new Map<string, Database.Statement>()
export function getCachedStatement(sql: string): Database.Statement {
  let stmt = statementCache.get(sql)
  if (!stmt) {
    stmt = db.prepare(sql)
    statementCache.set(sql, stmt)
  }
  return stmt
}
