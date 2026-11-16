import 'dotenv/config'

export type RetrievalModel = 'tfidf' | 'boolean'

function parseRetrievalModel(val?: string): RetrievalModel {
  const normalized = (val ?? '').trim().toLowerCase()
  if (normalized === 'boolean') return 'boolean'
  return 'tfidf'
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  dbPath: process.env.DB_PATH ?? './data/retrova.db',
  retrievalModel: parseRetrievalModel(process.env.RETRIEVAL_MODEL || process.env.SEARCH_METHOD),
  stackExchange: {
    key: process.env.STACKEXCHANGE_KEY ?? '',
    userAgent: process.env.STACKEXCHANGE_USER_AGENT ?? 'StackOverflow IR Project/1.0.0',
  },
}
