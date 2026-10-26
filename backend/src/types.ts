export type Lang = 'en' | 'pt'

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
  url: string
  matchedTerms: string[]
}

export interface SearchResponse {
  query: string
  parsedQuery: string
  resultsFound: number
  queryTimeMs: number
  totalIndexed: number
  results: SearchResultItem[]
}
