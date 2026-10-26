export interface StackOverflowResult {
  id: string
  title: string
  tag: string
  excerpt: string
  date: string
  comments: number // número de respostas/comentários
  score: number
  relevance: number
  url: string
  matchedTerms: string[]
}

// Alias para manter compatibilidade de código caso referenciado
export type RedditResult = StackOverflowResult

export interface SearchStats {
  totalIndexed: number
  queryTimeMs: number
  resultsFound: number
}

export type SortOption = 'relevance' | 'date' | 'score' | 'comments'

export interface FullDocument {
  id: string
  title: string
  body: string
  tag: string
  date: string
  comments: number
  score: number
  url: string
  lang: 'en' | 'pt'
  selftext?: string
}

export interface SearchApiResponse {
  query: string
  parsedQuery: string
  resultsFound: number
  queryTimeMs: number
  totalIndexed: number
  results: StackOverflowResult[]
}
