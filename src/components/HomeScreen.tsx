import SearchBar from './SearchBar'
import SearchButton from './SearchButton'
import PixelFrame from './PixelFrame'
import TagIngestBox from './TagIngestBox'
import logo from '../assets/retrova-logo.png'
import type { RetrievalModel } from '../types'

interface HomeScreenProps {
  query: string
  onQueryChange: (value: string) => void
  onSubmit: () => void
  corpusSize: number
  isSearching: boolean
  isDemoMode: boolean
  retrievalModel?: RetrievalModel
  onModelChange?: (model: RetrievalModel) => void
  onCorpusUpdated?: (newTotal: number) => void
}

export default function HomeScreen({
  query,
  onQueryChange,
  onSubmit,
  corpusSize,
  isSearching,
  isDemoMode,
  retrievalModel = 'tfidf',
  onModelChange,
  onCorpusUpdated,
}: HomeScreenProps) {
  const isTfidf = retrievalModel === 'tfidf'

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <PixelFrame className="w-full max-w-2xl p-6 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <img
            src={logo}
            alt="RETRØVA"
            className="w-full max-w-md animate-floatY drop-shadow-[4px_4px_0_#0d0221]"
          />

          <p className="mt-4 font-mono text-sm text-cream/70 sm:text-base-sub">
            Stack Overflow Information Retrieval System
          </p>

          <p className="mt-1 font-pixel text-[9px] tracking-widest text-pink sm:text-[10px]">
            EXPLORE • SEARCH • DISCOVER
          </p>

          {/* Seletor de Modelo de RI (TF-IDF vs Booleano) */}
          {onModelChange && (
            <div className="mt-4 flex items-center gap-2 border-2 border-ink bg-panel px-3 py-1.5 shadow-pixelSm">
              <span className="font-pixel text-[8px] uppercase text-cream/60">Método RI:</span>
              <button
                type="button"
                onClick={() => onModelChange('tfidf')}
                className={`border-2 border-ink px-2.5 py-1 font-pixel text-[9px] transition-colors ${
                  isTfidf ? 'bg-yellow text-ink font-bold' : 'bg-panel2 text-cream hover:bg-panel2/80'
                }`}
              >
                ★ TF-IDF (VETORIAL)
              </button>
              <button
                type="button"
                onClick={() => onModelChange('boolean')}
                className={`border-2 border-ink px-2.5 py-1 font-pixel text-[9px] transition-colors ${
                  !isTfidf ? 'bg-pink text-cream font-bold' : 'bg-panel2 text-cream hover:bg-panel2/80'
                }`}
              >
                BOOLEANO
              </button>
            </div>
          )}

          <div className="mt-6 w-full">
            <SearchBar value={query} onChange={onQueryChange} onSubmit={onSubmit} autoFocus />
          </div>

          <div className="mt-5">
            <SearchButton onClick={onSubmit} disabled={isSearching || query.trim().length === 0} label={isSearching ? 'BUSCANDO...' : 'BUSCAR'} />
          </div>

          <p className="mt-6 font-mono text-xs leading-relaxed text-cream/60">
            {isTfidf ? (
              <>
                Pesquisa vetorial com ranqueamento <span className="text-yellow font-bold">TF-IDF</span> e normalização por cosseno.
                Digite termos livres (ex.: <span className="text-cyan-soft">python dictionary lookup</span> ou <span className="text-cyan-soft">docker container size NOT alpine</span>).
              </>
            ) : (
              <>
                Pesquisa com <span className="text-pink font-bold">Modelo Booleano</span> estrito.
                Digite uma consulta lógica (ex.: <span className="text-cyan-soft">python AND async NOT threading</span>) para operações de conjuntos no índice.
              </>
            )}
          </p>

          <p className="mt-3 font-mono text-[11px] text-cream/40">
            {isDemoMode ? 'Corpus de demonstração' : 'Corpus indexado'}: <span className="text-yellow">{corpusSize.toLocaleString('pt-BR')}</span> documentos
          </p>

          <TagIngestBox onSuccess={onCorpusUpdated} />
        </div>
      </PixelFrame>
    </div>
  )
}
