import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import HomeScreen from './components/HomeScreen'
import ResultsScreen from './components/ResultsScreen'
import DocumentView from './components/DocumentView'
import { mockResults, totalIndexedDocuments } from './data/mockResults'
import { searchApi, statsApi, ApiUnavailableError } from './lib/api'
import type { StackOverflowResult, RetrievalModel } from './types'
import loadingIcon from './assets/loading-icon.svg'

type View = 'home' | 'results' | 'document'

function demoSearch(query: string, model: RetrievalModel = 'tfidf'): StackOverflowResult[] {
  if (model === 'tfidf') {
    const rawTokens = query.toLowerCase().split(/\s+/).filter(Boolean)
    const positiveTokens = rawTokens.filter((t) => t !== 'and' && t !== 'or' && t !== 'not')
    const hasNot = rawTokens.includes('not')
    const notToken = hasNot ? rawTokens[rawTokens.indexOf('not') + 1] : null

    return mockResults
      .flatMap((result) => {
        const text = `${result.title} ${result.excerpt}`.toLowerCase()
        if (notToken && text.includes(notToken)) return []

        const matched: string[] = []
        let matchCount = 0
        for (const token of positiveTokens) {
          if (text.includes(token)) {
            matched.push(token)
            const occurrences = text.split(token).length - 1
            matchCount += occurrences
          }
        }

        if (matched.length === 0) return []
        const relevance = Math.min(100, Math.round((matchCount / Math.max(1, positiveTokens.length)) * 50))
        return [{ ...result, relevance: Math.max(relevance, result.relevance), matchedTerms: matched }]
      })
      .sort((a, b) => b.relevance - a.relevance)
  }

  // Modelo Booleano (fallback demo)
  const clauses: { operator: 'AND' | 'OR' | 'NOT'; term: string }[] = []
  let operator: 'AND' | 'OR' | 'NOT' = 'AND'
  for (const token of query.split(/\s+/)) {
    const upper = token.toUpperCase()
    if (upper === 'AND' || upper === 'OR' || upper === 'NOT') {
      operator = upper
    } else {
      clauses.push({ operator, term: token.toLowerCase() })
      operator = 'AND'
    }
  }

  return mockResults.flatMap((result) => {
    const text = `${result.title} ${result.excerpt}`.toLowerCase()
    let included = false
    const matchedTerms = new Set<string>()
    clauses.forEach((clause, index) => {
      const matches = text.includes(clause.term)
      if (index === 0) included = clause.operator === 'NOT' ? !matches : matches
      else if (clause.operator === 'AND') included = included && matches
      else if (clause.operator === 'OR') included = included || matches
      else included = included && !matches
      if (matches && clause.operator !== 'NOT') matchedTerms.add(clause.term)
    })
    return included ? [{ ...result, matchedTerms: [...matchedTerms] }] : []
  })
}

export default function App() {
  const [view, setView] = useState<View>('home')
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [parsedQuery, setParsedQuery] = useState<string | undefined>(undefined)
  const [results, setResults] = useState<StackOverflowResult[]>([])
  const [selectedResult, setSelectedResult] = useState<StackOverflowResult | null>(null)
  const [queryTimeMs, setQueryTimeMs] = useState(0)
  const [totalIndexed, setTotalIndexed] = useState(totalIndexedDocuments)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [retrievalModel, setRetrievalModel] = useState<RetrievalModel>('tfidf')

  useEffect(() => {
    statsApi()
      .then((stats) => {
        setTotalIndexed(stats.corpusSize)
        if (stats.retrievalModel) {
          setRetrievalModel(stats.retrievalModel)
        }
      })
      .catch(() => setIsDemoMode(true))
  }, [])

  const executeSearch = async (searchQuery: string, modelToUse: RetrievalModel) => {
    if (searchQuery.trim().length === 0 || isSearching) return
    const currentQuery = searchQuery.trim()
    setSearchError(null)
    setIsSearching(true)
    const searchStartedAt = Date.now()

    try {
      const response = await searchApi(currentQuery, modelToUse)
      setSubmittedQuery(currentQuery)
      setResults(response.results)
      setParsedQuery(response.parsedQuery)
      setQueryTimeMs(response.queryTimeMs)
      setTotalIndexed(response.totalIndexed)
      if (response.model) {
        setRetrievalModel(response.model)
      }
      setIsDemoMode(false)
      setView('results')
    } catch (error) {
      if (!(error instanceof ApiUnavailableError)) {
        setSearchError(error instanceof Error ? error.message : 'Não foi possível realizar a busca.')
        return
      }
      const start = performance.now()
      const found = demoSearch(currentQuery, modelToUse)
      setSubmittedQuery(currentQuery)
      setResults(found)
      setParsedQuery(undefined)
      setQueryTimeMs(Math.round(performance.now() - start))
      setTotalIndexed(totalIndexedDocuments)
      setIsDemoMode(true)
      setView('results')
    } finally {
      const remainingLoadingTime = 3000 - (Date.now() - searchStartedAt)
      if (remainingLoadingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingLoadingTime))
      }
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    executeSearch(query, retrievalModel)
  }

  const handleModelChange = (newModel: RetrievalModel) => {
    setRetrievalModel(newModel)
    if (submittedQuery) {
      executeSearch(submittedQuery, newModel)
    }
  }

  const handleLogoClick = () => setView('home')

  const handleViewDetails = (result: StackOverflowResult) => {
    setSelectedResult(result)
    setView('document')
  }

  const handleBackFromDocument = () => setView('results')

  const handleCorpusUpdated = (newTotal: number) => {
    setTotalIndexed(newTotal)
    setIsDemoMode(false)
  }

  return (
    <div className="relative min-h-screen bg-base bg-grid text-cream">
      <div className="crt-overlay" />
      {isSearching && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-base/95 text-cyan">
          <img src={loadingIcon} alt="" aria-hidden="true" className="h-28 w-auto animate-pulse" />
          <span className="font-pixel text-xs text-yellow">BUSCANDO...</span>
        </div>
      )}
      <Header onLogoClick={handleLogoClick} />

      <main>
        {searchError && (
          <p role="alert" className="mx-auto mt-4 max-w-3xl border-2 border-pink bg-panel2 p-4 font-mono text-sm text-cream">
            {searchError}
          </p>
        )}
        {view === 'home' && (
          <HomeScreen
            query={query}
            onQueryChange={setQuery}
            onSubmit={handleSearch}
            corpusSize={totalIndexed}
            isSearching={isSearching}
            isDemoMode={isDemoMode}
            retrievalModel={retrievalModel}
            onModelChange={setRetrievalModel}
            onCorpusUpdated={handleCorpusUpdated}
          />
        )}

        {view === 'results' && (
          <ResultsScreen
            query={query}
            submittedQuery={submittedQuery}
            onQueryChange={setQuery}
            onSubmit={handleSearch}
            results={results}
            totalIndexed={totalIndexed}
            queryTimeMs={queryTimeMs}
            isDemoMode={isDemoMode}
            isSearching={isSearching}
            parsedQuery={parsedQuery}
            retrievalModel={retrievalModel}
            onModelChange={handleModelChange}
            onViewDetails={handleViewDetails}
            onCorpusUpdated={handleCorpusUpdated}
          />
        )}

        {view === 'document' && selectedResult && (
          <DocumentView summary={selectedResult} onBack={handleBackFromDocument} />
        )}
      </main>

      <Footer />
    </div>
  )
}
