import { env } from '../config/env.js'
import { fetchStackOverflowQuestions } from '../stackoverflow/stackoverflowClient.js'

const tag = process.argv[2] ?? 'python'
console.log('App Key da Stack Exchange: ' + (env.stackExchange.key ? 'configurada' : 'não configurada (usando cota anônima padrão)'))
console.log(`Testando coleta de perguntas com a tag [${tag}] no Stack Overflow...`)

try {
  const questions = await fetchStackOverflowQuestions(tag, 3)
  if (questions.length === 0) throw new Error('A API não retornou perguntas para essa tag.')
  console.log(`SUCESSO: ${questions.length} perguntas recebidas.`)
  for (const q of questions) {
    console.log(JSON.stringify({ id: q.questionId, tag: q.tag, title: q.title, score: q.score, answers: q.answerCount, url: q.link }))
  }
} catch (error) {
  console.error('FALHA:', error instanceof Error ? error.message : 'erro desconhecido')
  process.exitCode = 1
}

