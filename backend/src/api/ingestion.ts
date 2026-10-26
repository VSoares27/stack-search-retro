import { Router } from 'express'
import { fetchStackOverflowQuestions } from '../stackoverflow/stackoverflowClient.js'
import { ingestQuestions, corpusSize } from '../corpus/corpusManager.js'
import { buildInvertedIndex, vocabularySize, topVocabulary } from '../index/invertedIndex.js'

export const ingestionRouter = Router()

ingestionRouter.post('/ingest', async (req, res) => {
  try {
    const rawLimit = Number(req.body?.limit ?? 50)
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 50

    // Aceita tanto { tag: 'docker' } quanto { tags: ['docker', 'rust'] } ou { tags: 'docker,rust' }
    let tagsToProcess: string[] = []

    if (Array.isArray(req.body?.tags)) {
      tagsToProcess = req.body.tags.map((t: unknown) => String(t).trim().toLowerCase())
    } else if (typeof req.body?.tags === 'string' && req.body.tags.trim()) {
      tagsToProcess = req.body.tags.split(',').map((t: string) => t.trim().toLowerCase())
    } else if (typeof req.body?.tag === 'string' && req.body.tag.trim()) {
      tagsToProcess = [req.body.tag.trim().toLowerCase()]
    }

    tagsToProcess = tagsToProcess.filter((t) => t.length > 0)

    if (tagsToProcess.length === 0) {
      res.status(400).json({
        error: 'Informe pelo menos uma tag válida (ex.: { "tag": "docker", "limit": 50 } ou { "tags": ["python", "rust"] }).',
      })
      return
    }

    const tagResults: { tag: string; ingested: number; error?: string }[] = []
    let totalIngested = 0

    for (const tag of tagsToProcess) {
      try {
        const questions = await fetchStackOverflowQuestions(tag, limit)
        const count = ingestQuestions(questions)
        totalIngested += count
        tagResults.push({ tag, ingested: count })
      } catch (error) {
        tagResults.push({ tag, ingested: 0, error: (error as Error).message })
      }
      // Pequeno intervalo entre requisições
      if (tagsToProcess.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }

    const indexResult = buildInvertedIndex()

    res.json({
      success: true,
      tagsProcessed: tagResults,
      totalIngested,
      documentsProcessed: indexResult.documentsProcessed,
      vocabularySize: indexResult.vocabularySize,
      totalCorpus: corpusSize(),
    })
  } catch (error) {
    res.status(502).json({ error: (error as Error).message })
  }
})

ingestionRouter.get('/stats', (_req, res) => {
  res.json({
    corpusSize: corpusSize(),
    vocabularySize: vocabularySize(),
    topTerms: topVocabulary(10),
  })
})
