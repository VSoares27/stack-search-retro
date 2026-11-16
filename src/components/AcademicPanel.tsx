import { useEffect, useState } from 'react'
import { statsApi } from '../lib/api'
import type { RetrievalModel } from '../types'

interface AcademicPanelProps {
  lastQuery?: string
  lastParsedQuery?: string
  lastResultsFound?: number
  retrievalModel?: RetrievalModel
  onModelChange?: (model: RetrievalModel) => void
}

interface PanelData {
  corpusSize: number
  vocabularySize: number
  topTerms: { term: string; documentFreq: number; idf?: number }[]
  retrievalModel?: RetrievalModel
}

export default function AcademicPanel({
  lastQuery,
  lastParsedQuery,
  lastResultsFound,
  retrievalModel = 'tfidf',
  onModelChange,
}: AcademicPanelProps) {
  const [data, setData] = useState<PanelData | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    statsApi()
      .then(setData)
      .catch(() => setUnavailable(true))
  }, [])

  if (unavailable) return null

  const isTfidf = retrievalModel === 'tfidf'

  return (
    <div className="border-4 border-ink bg-panel p-4 shadow-pixel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-pixel text-[10px] text-cyan">PIPELINE DE RECUPERAÇÃO DE INFORMAÇÃO (RI)</p>

        {onModelChange && (
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-[11px] text-cream/70">Modelo:</span>
            <button
              onClick={() => onModelChange('tfidf')}
              className={`border-2 border-ink px-2 py-0.5 font-pixel text-[9px] transition-colors ${
                isTfidf ? 'bg-yellow text-ink font-bold' : 'bg-panel2 text-cream hover:bg-panel2/80'
              }`}
            >
              TF-IDF (VETORIAL)
            </button>
            <button
              onClick={() => onModelChange('boolean')}
              className={`border-2 border-ink px-2 py-0.5 font-pixel text-[9px] transition-colors ${
                !isTfidf ? 'bg-pink text-cream font-bold' : 'bg-panel2 text-cream hover:bg-panel2/80'
              }`}
            >
              BOOLEANO
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PipelineStep label="CORPUS" value={data ? `${data.corpusSize} docs` : '...'} />
        <PipelineStep label="VOCABULARY" value={data ? `${data.vocabularySize} termos` : '...'} />
        <PipelineStep
          label="MODELO RI"
          value={isTfidf ? 'TF-IDF (Cosine)' : 'Booleano'}
          highlight={isTfidf ? 'text-yellow' : 'text-pink'}
        />
        <PipelineStep
          label="RESULTS"
          value={lastResultsFound !== undefined ? `${lastResultsFound} docs` : '—'}
        />
      </div>

      <div className="mt-3 border-t-2 border-ink/20 pt-2 font-mono text-[11px] text-cream/80">
        {isTfidf ? (
          <p>
            <span className="text-yellow font-bold">Fórmula TF-IDF Vetorial:</span>{' '}
            <span className="text-cyan">cos(q, d) = (q · d) / (||q|| · ||d||)</span>, com{' '}
            <span className="text-cream/70">TF = 1 + ln(f)</span> e{' '}
            <span className="text-cream/70">IDF = ln(1 + N/DF)</span>.
          </p>
        ) : (
          <p>
            <span className="text-pink font-bold">Modelo Booleano Estrito:</span>{' '}
            Combinações lógicas de conjuntos exatos através de{' '}
            <span className="text-cyan">AND (Interseção)</span>,{' '}
            <span className="text-cyan">OR (União)</span> e{' '}
            <span className="text-cyan">NOT (Diferença)</span>.
          </p>
        )}
        {lastParsedQuery && (
          <p className="mt-1 truncate text-cream/60" title={lastParsedQuery}>
            <span className="text-cream/40">Consulta Interpretada:</span> {lastParsedQuery}
          </p>
        )}
      </div>

      {data && data.topTerms.length > 0 && (
        <div className="mt-3 border-t-2 border-ink/20 pt-2">
          <p className="mb-2 font-mono text-[10px] text-cream/60">
            Termos mais frequentes no vocabulário (Document Frequency & IDF):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.topTerms.map((t) => (
              <span
                key={t.term}
                className="border-2 border-ink bg-panel2 px-1.5 py-0.5 font-mono text-[10px] text-cream"
                title={`DF: ${t.documentFreq} documentos${t.idf ? ` | IDF: ${t.idf.toFixed(2)}` : ''}`}
              >
                {t.term}{' '}
                <span className="text-cyan">
                  (DF: {t.documentFreq}
                  {t.idf ? ` / IDF: ${t.idf.toFixed(1)}` : ''})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PipelineStep({
  label,
  value,
  truncate,
  highlight,
}: {
  label: string
  value: string
  truncate?: boolean
  highlight?: string
}) {
  return (
    <div className="border-2 border-ink bg-ink px-2 py-2">
      <p className="font-pixel text-[8px] text-yellow">{label}</p>
      <p
        className={`mt-1 font-mono text-xs ${highlight ?? 'text-cream'} ${truncate ? 'truncate' : ''}`}
        title={value}
      >
        {value}
      </p>
    </div>
  )
}
