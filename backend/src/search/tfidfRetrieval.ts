import { preprocess } from '../processing/pipeline.js'
import { detectLang } from '../processing/detectLang.js'
import { getIdf, getPostingsWithTfidf, getDocNorm, getPostingsForTerm } from '../index/invertedIndex.js'

export interface TfidfMatchItem {
  docId: number
  similarityScore: number
  relevance: number
  matchedTerms: string[]
}

export interface TfidfRetrievalResult {
  results: TfidfMatchItem[]
  queryTerms: string[]
  queryWeights: { term: string; weight: number; idf: number }[]
  queryNorm: number
}

const BOOLEAN_KEYWORDS = new Set(['AND', 'OR'])

export function executeTfidfQuery(rawQuery: string): TfidfRetrievalResult {
  const lang = detectLang(rawQuery)
  const tokens = rawQuery.trim().split(/\s+/).filter(Boolean)

  const positiveTokens: string[] = []
  const negativeTokens: string[] = []
  let isNextNegative = false

  for (const token of tokens) {
    const upper = token.toUpperCase()
    if (upper === 'NOT') {
      isNextNegative = true
      continue
    }
    if (BOOLEAN_KEYWORDS.has(upper)) {
      continue
    }

    if (isNextNegative) {
      negativeTokens.push(token)
      isNextNegative = false
    } else {
      positiveTokens.push(token)
    }
  }

  // Preprocessa termos positivos da consulta
  const { terms: processedPositive } = preprocess(positiveTokens.join(' '), lang)
  // Preprocessa termos negativos (se houver operador NOT)
  const { terms: processedNegative } = preprocess(negativeTokens.join(' '), lang)

  // Conjunto de documentos a excluir por NOT
  const excludedDocIds = new Set<number>()
  for (const negTerm of processedNegative) {
    const postings = getPostingsForTerm(negTerm)
    for (const id of postings) {
      excludedDocIds.add(id)
    }
  }

  // Conta frequências dos termos na consulta
  const queryTf = new Map<string, number>()
  for (const term of processedPositive) {
    queryTf.set(term, (queryTf.get(term) ?? 0) + 1)
  }

  let queryNormSq = 0
  const queryWeights = new Map<string, number>()
  const queryWeightsDetails: { term: string; weight: number; idf: number }[] = []

  for (const [term, freq] of queryTf.entries()) {
    const idf = getIdf(term)
    if (idf > 0) {
      const tf = 1 + Math.log(freq)
      const wq = tf * idf
      queryWeights.set(term, wq)
      queryNormSq += wq * wq
      queryWeightsDetails.push({ term, weight: Number(wq.toFixed(4)), idf: Number(idf.toFixed(4)) })
    }
  }

  const queryNorm = queryNormSq > 0 ? Math.sqrt(queryNormSq) : 0

  if (queryNorm === 0 || queryWeights.size === 0) {
    return {
      results: [],
      queryTerms: processedPositive,
      queryWeights: queryWeightsDetails,
      queryNorm: 0,
    }
  }

  // Acumula produto escalar q · d
  const dotProducts = new Map<number, number>()
  const matchedTermsByDoc = new Map<number, Set<string>>()

  for (const [term, wq] of queryWeights.entries()) {
    const postings = getPostingsWithTfidf(term)
    for (const p of postings) {
      if (excludedDocIds.has(p.docId)) continue

      const currentDot = dotProducts.get(p.docId) ?? 0
      dotProducts.set(p.docId, currentDot + (wq * p.tfidf))

      if (!matchedTermsByDoc.has(p.docId)) {
        matchedTermsByDoc.set(p.docId, new Set())
      }
      matchedTermsByDoc.get(p.docId)!.add(term)
    }
  }

  // Normalização por Cosseno: CosineSim = (q · d) / (||q|| * ||d||)
  const results: TfidfMatchItem[] = []

  for (const [docId, dot] of dotProducts.entries()) {
    const docNorm = getDocNorm(docId) || 1.0
    const denom = queryNorm * docNorm
    const cosineSim = denom > 0 ? dot / denom : 0
    const boundedSim = Math.max(0, Math.min(1, cosineSim))
    const relevance = Math.min(100, Math.max(1, Math.round(boundedSim * 100)))

    results.push({
      docId,
      similarityScore: Number(boundedSim.toFixed(4)),
      relevance,
      matchedTerms: Array.from(matchedTermsByDoc.get(docId) ?? []),
    })
  }

  // Ordena por maior similaridade de cosseno (TF-IDF ranking)
  results.sort((a, b) => b.similarityScore - a.similarityScore)

  return {
    results,
    queryTerms: processedPositive,
    queryWeights: queryWeightsDetails,
    queryNorm: Number(queryNorm.toFixed(4)),
  }
}

