import zlib from 'node:zlib'
import { env } from '../config/env.js'
import type { StackOverflowQuestionRaw } from '../types.js'

interface StackExchangeItem {
  question_id: number
  title: string
  body: string
  tags: string[]
  creation_date: number
  score: number
  answer_count: number
  link: string
  is_answered: boolean
}

interface StackExchangeResponse {
  items?: StackExchangeItem[]
  has_more?: boolean
  quota_remaining?: number
  quota_max?: number
  error_id?: number
  error_message?: string
  error_name?: string
}

export function decodeHtml(html: string): string {
  let decoded = html
  decoded = decoded
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  return decoded
}

export function cleanHtmlContent(htmlContent: string): string {
  const decoded = decodeHtml(htmlContent)
  return decoded
    .replace(/<pre><code>[\s\S]*?<\/code><\/pre>/gi, (codeBlock) => {
      // Preservar código mas retirar as tags
      return ' ' + codeBlock.replace(/<[^>]+>/g, ' ') + ' '
    })
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function decodeResponseText(response: Response): Promise<string> {
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Verifica explicitamente os magic bytes do formato gzip (0x1F, 0x8B)
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    try {
      return zlib.gunzipSync(buffer).toString('utf-8')
    } catch {
      // Fallback
    }
  }

  return buffer.toString('utf-8')
}

export async function fetchStackOverflowQuestions(
  tag: string,
  limit = 30,
  sort: 'votes' | 'creation' | 'activity' = 'votes',
): Promise<StackOverflowQuestionRaw[]> {
  const sanitizedTag = tag.trim().toLowerCase()
  if (!sanitizedTag) {
    throw new Error('A tag do Stack Overflow não pode ser vazia.')
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('O limite deve ser um inteiro entre 1 e 100.')
  }

  const params = new URLSearchParams({
    site: 'stackoverflow',
    tagged: sanitizedTag,
    sort,
    order: 'desc',
    pagesize: String(Math.min(limit, 100)),
    filter: 'withbody', // traz o corpo completo da pergunta
  })

  if (env.stackExchange.key) {
    params.set('key', env.stackExchange.key)
  }

  const url = `https://api.stackexchange.com/2.3/questions?${params.toString()}`

  const headers: Record<string, string> = {
    'User-Agent': env.stackExchange.userAgent,
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  }

  let response: Response
  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    throw new Error(`Falha na conexão com a API do Stack Exchange: ${(err as Error).message}`)
  }

  if (!response.ok) {
    throw new Error(`Falha na API do Stack Exchange (HTTP ${response.status})`)
  }

  const textBody = await decodeResponseText(response)
  let data: StackExchangeResponse
  try {
    data = JSON.parse(textBody) as StackExchangeResponse
  } catch {
    throw new Error('Falha ao decodificar resposta JSON da API do Stack Exchange.')
  }

  if (data.error_id) {
    throw new Error(`Erro retornado pela API do Stack Exchange: ${data.error_name} - ${data.error_message}`)
  }

  if (data.quota_remaining !== undefined) {
    console.log(`[Stack Exchange API] Cota restante: ${data.quota_remaining}/${data.quota_max ?? '10000'}`)
  }

  if (!data.items || data.items.length === 0) {
    return []
  }

  const questions: StackOverflowQuestionRaw[] = data.items.map((item) => ({
    questionId: String(item.question_id),
    title: decodeHtml(item.title),
    body: cleanHtmlContent(item.body),
    tag: item.tags?.[0] || sanitizedTag,
    tags: item.tags,
    createdUtc: item.creation_date,
    score: item.score,
    answerCount: item.answer_count,
    link: item.link,
  }))

  return questions.slice(0, limit)
}

