import { Router } from 'express'
import { env } from '../config/env.js'
import { parseQuery } from '../search/queryParser.js'
import { executeBooleanQuery } from '../search/booleanRetrieval.js'
import { executeTfidfQuery } from '../search/tfidfRetrieval.js'
import { getDocumentById, corpusSize, getAllDocuments } from '../corpus/corpusManager.js'
import type { SearchResponse, SearchResultItem, RetrievalModel } from '../types.js'

export const searchRouter = Router()

searchRouter.get('/search', (req, res) => {
  const start = performance.now()
  const rawQuery = String(req.query.q ?? '').trim()
  const requestedModel = String(req.query.method ?? req.query.model ?? env.retrievalModel).toLowerCase()
  const activeModel: RetrievalModel = requestedModel === 'boolean' ? 'boolean' : 'tfidf'

  const isMatchAll = rawQuery === '*' || rawQuery.toLowerCase() === 'all' || rawQuery.toLowerCase() === 'todos' || rawQuery === ''

  if (isMatchAll) {
    const allDocs = getAllDocuments()
    const results: SearchResultItem[] = allDocs.map((doc) => ({
      id: String(doc.id),
      title: doc.title,
      tag: doc.tag,
      excerpt: doc.body.slice(0, 220),
      date: new Date(doc.createdUtc * 1000).toISOString().slice(0, 10),
      comments: doc.answerCount,
      score: doc.score,
      relevance: 100,
      similarityScore: 1.0,
      url: doc.link,
      matchedTerms: [doc.tag],
    })).sort((a, b) => b.score - a.score)

    const response: SearchResponse = {
      query: rawQuery || '*',
      parsedQuery: 'TODOS OS DOCUMENTOS (MATCH ALL)',
      model: activeModel,
      resultsFound: results.length,
      queryTimeMs: Math.round(performance.now() - start),
      totalIndexed: corpusSize(),
      results,
    }

    res.json(response)
    return
  }

  // --- MODELO TF-IDF (VECTOR SPACE MODEL & COSSENO) ---
  if (activeModel === 'tfidf') {
    const tfidfResult = executeTfidfQuery(rawQuery)

    const results: SearchResultItem[] = tfidfResult.results
      .map((item) => {
        const doc = getDocumentById(item.docId)
        if (!doc) return null

        return {
          id: String(doc.id),
          title: doc.title,
          tag: doc.tag,
          excerpt: doc.body.slice(0, 220),
          date: new Date(doc.createdUtc * 1000).toISOString().slice(0, 10),
          comments: doc.answerCount,
          score: doc.score,
          relevance: item.relevance,
          similarityScore: item.similarityScore,
          url: doc.link,
          matchedTerms: item.matchedTerms,
        } as SearchResultItem
      })
      .filter((item): item is SearchResultItem => item !== null)
      .sort((a, b) => {
        if (b.relevance !== a.relevance) return b.relevance - a.relevance
        return b.score - a.score
      })

    const parsedDisplay = tfidfResult.queryWeights.length > 0
      ? tfidfResult.queryWeights.map((w) => `${w.term} (IDF: ${w.idf})`).join(' + ')
      : rawQuery

    const response: SearchResponse = {
      query: rawQuery,
      parsedQuery: `TF-IDF Vector: ${parsedDisplay}`,
      model: 'tfidf',
      resultsFound: results.length,
      queryTimeMs: Math.round(performance.now() - start),
      totalIndexed: corpusSize(),
      results,
    }

    res.json(response)
    return
  }

  // --- MODELO BOOLEANO (AND / OR / NOT) ---
  const parsed = parseQuery(rawQuery)
  let { docIds, matchedTermsByDoc } = executeBooleanQuery(parsed)

  // Fallback suave para busca booleana se AND estrito retornar vazio
  let displayParsedQuery = parsed.displayString
  if (docIds.size === 0 && parsed.clauses.length > 1 && !rawQuery.includes('NOT') && !rawQuery.includes('OR')) {
    const orQuery = parsed.clauses.map((c) => c.rawTerm).join(' OR ')
    const orParsed = parseQuery(orQuery)
    const orResult = executeBooleanQuery(orParsed)
    if (orResult.docIds.size > 0) {
      docIds = orResult.docIds
      matchedTermsByDoc = orResult.matchedTermsByDoc
      displayParsedQuery = `${parsed.displayString} (fallback OR)`
    }
  }

  const results: SearchResultItem[] = [...docIds]
    .map((docId) => {
      const doc = getDocumentById(docId)
      if (!doc) return null
      const matchedTerms = [...(matchedTermsByDoc.get(docId) ?? [])]
      const totalClauseTerms = parsed.clauses.filter((c) => c.operator !== 'NOT').length || 1
      const relevance = Math.min(100, Math.round((matchedTerms.length / totalClauseTerms) * 100))

      const item: SearchResultItem = {
        id: String(doc.id),
        title: doc.title,
        tag: doc.tag,
        excerpt: doc.body.slice(0, 220),
        date: new Date(doc.createdUtc * 1000).toISOString().slice(0, 10),
        comments: doc.answerCount,
        score: doc.score,
        relevance,
        url: doc.link,
        matchedTerms,
      }
      return item
    })
    .filter((item): item is SearchResultItem => item !== null)
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance
      return b.score - a.score
    })

  const response: SearchResponse = {
    query: rawQuery,
    parsedQuery: displayParsedQuery,
    model: 'boolean',
    resultsFound: results.length,
    queryTimeMs: Math.round(performance.now() - start),
    totalIndexed: corpusSize(),
    results,
  }

  res.json(response)
})
