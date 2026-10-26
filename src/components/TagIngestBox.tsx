import { useState } from 'react'
import { ingestApi } from '../lib/api'

interface TagIngestBoxProps {
  onSuccess?: (totalCorpus: number) => void
  compact?: boolean
}

export default function TagIngestBox({ onSuccess, compact = false }: TagIngestBoxProps) {
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = tagInput.trim()
    if (!clean || loading) return

    setLoading(true)
    setStatusMessage('Consultando Stack Overflow API (50 perguntas)...')
    setIsError(false)

    try {
      const response = await ingestApi(clean, 50)
      const total = response.totalIngested
      setStatusMessage(`✓ Sucesso! ${total} perguntas indexadas. Total no corpus: ${response.totalCorpus}`)
      setTagInput('')
      if (onSuccess) {
        onSuccess(response.totalCorpus)
      }
    } catch (err) {
      setIsError(true)
      setStatusMessage(`Erro: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div className="border-4 border-ink bg-panel p-4 shadow-pixel">
        <p className="mb-2 font-pixel text-[10px] text-yellow">COLETAR TAG LIVRE (50)</p>
        <p className="mb-3 font-mono text-[11px] text-cream/70">
          Informe qualquer tag para buscar 50 perguntas no Stack Overflow.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="ex: docker, rust, c++"
            disabled={loading}
            className="border-2 border-ink bg-input px-3 py-1.5 font-mono text-xs text-cream outline-none focus:border-yellow"
          />
          <button
            type="submit"
            disabled={loading || !tagInput.trim()}
            className="border-2 border-ink bg-cyan px-3 py-1.5 font-pixel text-[9px] text-ink transition-transform active:translate-y-0.5 disabled:opacity-50"
          >
            {loading ? 'COLETANDO...' : '+ COLETAR 50 PERGUNTAS'}
          </button>
        </form>

        {statusMessage && (
          <p className={`mt-2 font-mono text-[10px] leading-tight ${isError ? 'text-pink' : 'text-yellow'}`}>
            {statusMessage}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-6 w-full border-2 border-ink/40 bg-panel2/60 p-4 text-left">
      <div className="flex items-center justify-between">
        <span className="font-pixel text-[9px] text-yellow">COLETA LIVRE POR TAGS</span>
        <span className="font-mono text-[10px] text-cyan">50 perguntas / tag</span>
      </div>

      <p className="mt-1 font-mono text-xs text-cream/70">
        Deseja indexar novas tecnologias? Digite qualquer tag do Stack Overflow (ex.: <span className="text-cyan">docker</span>, <span className="text-cyan">rust</span>, <span className="text-cyan">kubernetes</span>):
      </p>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="ex: docker, rust, typescript"
          disabled={loading}
          className="flex-1 border-2 border-ink bg-input px-3 py-2 font-mono text-xs text-cream outline-none focus:border-yellow"
        />
        <button
          type="submit"
          disabled={loading || !tagInput.trim()}
          className="border-2 border-ink bg-cyan px-4 py-2 font-pixel text-[9px] text-ink transition-transform active:translate-y-0.5 disabled:opacity-50"
        >
          {loading ? 'COLETANDO (50)...' : '+ COLETAR 50 PERGUNTAS'}
        </button>
      </form>

      {statusMessage && (
        <p className={`mt-2 font-mono text-xs ${isError ? 'text-pink' : 'text-yellow'}`}>
          {statusMessage}
        </p>
      )}
    </div>
  )
}

