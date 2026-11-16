export type Lang = 'en' | 'pt'
export type RetrievalModel = 'tfidf' | 'boolean'

export interface StackOverflowQuestionRaw {
  questionId: string
  title: string
  body: string
  tag: string
  tags?: string[]
  createdUtc: number
  score: number
  answerCount: number
  link: string
}

export interface StoredDocument {
  id: number
  questionId: string
  title: string
  body: string
  tag: string
  createdUtc: number
  score: number
  answerCount: number
  link: string
  lang: Lang
  docNorm?: number
}

export interface SearchResultItem {
  id: string
  title: string
  tag: string
  excerpt: string
  date: string
  comments: number
  score: number
  relevance: number
  similarityScore?: number
  url: string
  matchedTerms: string[]
}

export interface SearchResponse {
  query: string
  parsedQuery: string
  model: RetrievalModel
  resultsFound: number
  queryTimeMs: number
  totalIndexed: number
  results: SearchResultItem[]
}
