import type { SearchApiResponse, FullDocument, RetrievalModel } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export class ApiUnavailableError extends Error {}

export async function searchApi(query: string, method?: RetrievalModel): Promise<SearchApiResponse> {
  let response: Response
  const params = new URLSearchParams({ q: query })
  if (method) {
    params.set('method', method)
  }

  try {
    response = await fetch(`${API_BASE}/api/search?${params.toString()}`, { signal: AbortSignal.timeout(10000) })
  } catch {
    throw new ApiUnavailableError('Backend do RETRØVA não respondeu.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `Erro na busca (HTTP ${response.status}).`)
  }

  return response.json()
}

export interface StatsApiResponse {
  corpusSize: number
  vocabularySize: number
  topTerms: { term: string; documentFreq: number; idf?: number }[]
  retrievalModel?: RetrievalModel
}

export async function statsApi(): Promise<StatsApiResponse> {
  const response = await fetch(`${API_BASE}/api/stats`, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new ApiUnavailableError('Não foi possível obter estatísticas do backend.')
  return response.json()
}

export async function documentApi(id: string): Promise<FullDocument> {
  const response = await fetch(`${API_BASE}/api/document/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new ApiUnavailableError('Documento não disponível (backend offline ou fora do corpus).')
  return response.json()
}

export interface IngestApiResponse {
  success: boolean
  tagsProcessed: { tag: string; ingested: number; error?: string }[]
  totalIngested: number
  documentsProcessed: number
  vocabularySize: number
  totalCorpus: number
}

export async function ingestApi(tags: string | string[], limit = 50): Promise<IngestApiResponse> {
  const response = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags, limit }),
    signal: AbortSignal.timeout(60000),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `Erro na ingestão (HTTP ${response.status}).`)
  }

  return response.json()
}
