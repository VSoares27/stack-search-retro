import type { SortOption, RetrievalModel } from '../types'
import StatsPanel from './StatsPanel'
import TagIngestBox from './TagIngestBox'

interface SidebarProps {
  tags: string[]
  activeTag: string | null
  onTagChange: (tag: string | null) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  totalIndexed: number
  resultsFound: number
  queryTimeMs: number
  retrievalModel?: RetrievalModel
  onModelChange?: (model: RetrievalModel) => void
  onCorpusUpdated?: (newTotal: number) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'date', label: 'Data' },
  { value: 'score', label: 'Votos (Score)' },
  { value: 'comments', label: 'Respostas' },
]

export default function Sidebar({
  tags,
  activeTag,
  onTagChange,
  sortBy,
  onSortChange,
  totalIndexed,
  resultsFound,
  queryTimeMs,
  retrievalModel = 'tfidf',
  onModelChange,
  onCorpusUpdated,
}: SidebarProps) {
  return (
    <aside className="space-y-5">
      <StatsPanel totalIndexed={totalIndexed} resultsFound={resultsFound} queryTimeMs={queryTimeMs} />

      {onModelChange && (
        <div className="border-4 border-ink bg-panel p-4 shadow-pixel">
          <p className="mb-3 font-pixel text-[10px] text-cyan">MÉTODO DE RECUPERAÇÃO</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onModelChange('tfidf')}
              aria-pressed={retrievalModel === 'tfidf'}
              className={`border-2 border-ink px-3 py-2 text-left font-mono text-xs transition-colors ${
                retrievalModel === 'tfidf'
                  ? 'bg-yellow text-ink font-bold'
                  : 'bg-panel2 text-cream hover:bg-panel2/70'
              }`}
            >
              {retrievalModel === 'tfidf' ? '▶ ' : ''}TF-IDF (Espaço Vetorial)
            </button>
            <button
              onClick={() => onModelChange('boolean')}
              aria-pressed={retrievalModel === 'boolean'}
              className={`border-2 border-ink px-3 py-2 text-left font-mono text-xs transition-colors ${
                retrievalModel === 'boolean'
                  ? 'bg-pink text-cream font-bold'
                  : 'bg-panel2 text-cream hover:bg-panel2/70'
              }`}
            >
              {retrievalModel === 'boolean' ? '▶ ' : ''}Booleano (AND/OR/NOT)
            </button>
          </div>
        </div>
      )}

      <div className="border-4 border-ink bg-panel p-4 shadow-pixel">
        <p className="mb-3 font-pixel text-[10px] text-cyan">ORDENAR POR</p>
        <div className="flex flex-col gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              aria-pressed={sortBy === opt.value}
              className={`border-2 border-ink px-3 py-2 text-left font-mono text-xs transition-colors
                ${
                  sortBy === opt.value
                    ? 'bg-yellow text-ink'
                    : 'bg-panel2 text-cream hover:bg-panel2/70'
                }`}
            >
              {sortBy === opt.value ? '▶ ' : ''}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-4 border-ink bg-panel p-4 shadow-pixel">
        <p className="mb-3 font-pixel text-[10px] text-cyan">TAG / TÓPICO</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onTagChange(null)}
            aria-pressed={activeTag === null}
            className={`border-2 border-ink px-3 py-2 text-left font-mono text-xs transition-colors
              ${activeTag === null ? 'bg-pink text-cream' : 'bg-panel2 text-cream hover:bg-panel2/70'}`}
          >
            Todas as Tags
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => onTagChange(t)}
              aria-pressed={activeTag === t}
              className={`border-2 border-ink px-3 py-2 text-left font-mono text-xs transition-colors
                ${activeTag === t ? 'bg-pink text-cream' : 'bg-panel2 text-cream hover:bg-panel2/70'}`}
            >
              [{t}]
            </button>
          ))}
        </div>
      </div>

      <TagIngestBox compact onSuccess={onCorpusUpdated} />
    </aside>
  )
}
