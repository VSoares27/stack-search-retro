import '../db/schema.js'
import { fetchStackOverflowQuestions } from '../stackoverflow/stackoverflowClient.js'
import { ingestQuestions, corpusSize } from '../corpus/corpusManager.js'
import { buildInvertedIndex, vocabularySize } from '../index/invertedIndex.js'

// Limite padrão solicitado: 50 perguntas por tag
const DEFAULT_LIMIT_PER_TAG = 150

// Tags padrão caso o usuário não passe nenhuma pela linha de comando
const DEFAULT_TAGS = ['python', 'javascript', 'reactjs', 'sql', 'algorithms']

function parseArgs(): { tags: string[]; limit: number } {
  const args = process.argv.slice(2)
  let limit = DEFAULT_LIMIT_PER_TAG
  const rawTags: string[] = []

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      const parsed = parseInt(arg.replace('--limit=', ''), 10)
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) limit = parsed
    } else if (arg.startsWith('--tags=')) {
      const parts = arg.replace('--tags=', '').split(',')
      rawTags.push(...parts)
    } else if (!arg.startsWith('--')) {
      rawTags.push(arg)
    }
  }

  const cleanTags = rawTags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)

  return {
    tags: cleanTags.length > 0 ? cleanTags : DEFAULT_TAGS,
    limit,
  }
}

async function main() {
  const { tags, limit } = parseArgs()

  console.log(`=== INGESTÃO LIVRE STACK OVERFLOW ===`)
  console.log(`Tags a coletar (${tags.length}): ${tags.map((t) => `[${t}]`).join(', ')}`)
  console.log(`Limite por tag: ${limit} perguntas`)
  console.log(`Total estimado: até ${tags.length * limit} perguntas\n`)

  let totalIngested = 0

  for (const tag of tags) {
    console.log(`Coletando até ${limit} perguntas com a tag [${tag}]...`)
    try {
      const questions = await fetchStackOverflowQuestions(tag, limit)
      const count = ingestQuestions(questions)
      totalIngested += count
      console.log(`  ✓ [${tag}]: ${count} perguntas coletadas e indexadas.`)
    } catch (err) {
      console.warn(`  ✗ [${tag}] Falha ao coletar:`, (err as Error).message)
    }
    // Breve intervalo para respeitar as boas práticas da API
    await new Promise((resolve) => setTimeout(resolve, 800))
  }

  console.log('\nReconstruindo vocabulário e índice invertido...')
  const result = buildInvertedIndex()

  console.log('--- Corpus do Stack Overflow atualizado ---')
  console.log(`Novas perguntas ingeridas: ${totalIngested}`)
  console.log(`Total de documentos no corpus: ${corpusSize()}`)
  console.log(`Termos únicos no vocabulário: ${vocabularySize()}`)
  console.log(`Documentos reindexados: ${result.documentsProcessed}`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Falha geral na ingestão:', error)
  process.exit(1)
})
