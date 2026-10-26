# RETRØVA

**Stack Overflow Information Retrieval System** — projeto acadêmico da disciplina de
Recuperação da Informação.

Identidade visual Pixel Art / Retro Gaming; núcleo acadêmico real de
Recuperação da Informação (corpus → pré-processamento → índice invertido →
busca booleana).

> ⚠️ O Stack Overflow **não** é o motor de busca. A API do Stack Overflow / Stack Exchange é a fonte dos
> documentos (perguntas e respostas). Quem responde às consultas é o índice invertido e o
> executor de busca booleana implementados no backend — nunca uma chamada direta em tempo de busca.

## Arquitetura

```
frontend (React + TS + Tailwind)
        │  fetch /api/search, /api/stats, /api/document/:id
        ▼
backend (Node + Express + TS)
        │
        ├── stackoverflow/stackoverflowClient.ts → Coleta via Stack Exchange API v2.3
        ├── corpus/corpusManager.ts             → persistência do corpus (SQLite)
        ├── processing/                         → normalizer → tokenizer → stopwords → stemmer
        ├── index/invertedIndex.ts              → vocabulário + índice invertido (termo → docs)
        └── search/                             → queryParser (AND/OR/NOT) + booleanRetrieval
```

## Como rodar

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed     # popula o corpus localmente (offline, sem depender da API externa)
# ou npm run ingest (para coletar perguntas reais via API pública do Stack Exchange)
npm run dev      # sobe a API em http://localhost:3001
```

### 2. Frontend

```bash
cp .env.example .env   # aponta VITE_API_URL para o backend
npm install
npm run dev            # http://localhost:5173
```

Se o backend não estiver rodando, o frontend cai automaticamente em
**modo demonstração** (dados mockados), para nunca travar uma
apresentação por falta de conexão.

## Onde está cada conceito da disciplina

| Conceito                  | Onde                                              |
|---------------------------|----------------------------------------------------|
| Corpus                    | `backend/src/corpus/corpusManager.ts` + tabela `documents` |
| Tokenização                | `backend/src/processing/tokenizer.ts`             |
| Normalização                | `backend/src/processing/normalizer.ts`            |
| Stop words                 | `backend/src/processing/stopwords.ts` (EN + PT)   |
| Stemming                   | `backend/src/processing/stemmer.ts` (Porter EN/PT via `natural`) |
| Vocabulário                | tabela `terms` + `backend/src/index/invertedIndex.ts` |
| Índice invertido            | tabela `postings` + `backend/src/index/invertedIndex.ts` |
| Busca booleana (AND/OR/NOT) | `backend/src/search/queryParser.ts` + `booleanRetrieval.ts` |
| Painel acadêmico            | `GET /api/stats` + `src/components/AcademicPanel.tsx` |

## Estrutura de telas (frontend)

- **HomeScreen** — logo RETRØVA, campo de busca (aceita sintaxe booleana), tamanho do corpus
- **ResultsScreen** — consulta interpretada, painel acadêmico, filtros por Tag/Tópico, ordenação, cards de resultado com termos casados
- **DocumentView** — documento completo do corpus + link para a pergunta original no Stack Overflow
