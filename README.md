# RETRØVA

**Stack Overflow Information Retrieval System** — projeto acadêmico da disciplina de
Recuperação da Informação.

Identidade visual Pixel Art / Retro Gaming; núcleo acadêmico real de
Recuperação da Informação (corpus → pré-processamento → vocabulário → índice invertido com frequências de termos e pesos TF-IDF → ranqueamento por similaridade de cosseno ou busca booleana).

> ⚠️ O Stack Overflow **não** é o motor de busca. A API do Stack Overflow / Stack Exchange é a fonte dos
> documentos (perguntas e respostas). Quem responde às consultas é o índice invertido e o
> motor de recuperação (TF-IDF / Vetorial ou Booleano) implementados no backend — nunca uma chamada direta em tempo de busca.

## Arquitetura

```
frontend (React + TS + Tailwind)
        │  fetch /api/search?q=...&method=tfidf, /api/stats, /api/document/:id
        ▼
backend (Node + Express + TS)
        │
        ├── stackoverflow/stackoverflowClient.ts → Coleta via Stack Exchange API v2.3
        ├── corpus/corpusManager.ts             → Persistência do corpus (SQLite)
        ├── processing/                         → Normalizer → Tokenizer → Stopwords → Stemmer
        ├── index/invertedIndex.ts              → Vocabulário (DF/IDF) + Índice Invertido (TF-IDF) + Normas ||d||
        └── search/                             
            ├── tfidfRetrieval.ts               → Vector Space Model (TF-IDF + Cosine Similarity)
            ├── booleanRetrieval.ts             → Modelo Booleano (AND / OR / NOT)
            └── queryParser.ts                  → Parser de sintaxe e operadores
```

## Configuração do Método de Busca (TF-IDF vs Booleano)

O projeto suporta tanto o **Modelo Vetorial TF-IDF** (padrão) quanto o **Modelo Booleano**:

1. **Configuração via Backend (`backend/.env`)**:
   ```env
   # 'tfidf' para Vector Space Model ou 'boolean' para Modelo Booleano
   RETRIEVAL_MODEL=tfidf
   ```

2. **Parâmetro de Consulta na API**:
   ```bash
   GET /api/search?q=python dictionary&method=tfidf
   GET /api/search?q=python AND dictionary NOT java&method=boolean
   ```

3. **Seletor Interativo no Frontend**:
   Você pode alternar entre os modelos na barra lateral de resultados e na tela inicial, comparando os resultados lado a lado.

## Fundamentação Matemática do TF-IDF (Modelo Vetorial)

- **Term Frequency (TF)**:
  Sublinear scaling para diminuir o impacto desproporcional de repetições:
  $$TF(t, d) = 1 + \ln(f_{t, d}) \quad \text{se } f_{t, d} > 0$$

- **Inverse Document Frequency (IDF)**:
  Com amortecimento para evitar zeros:
  $$IDF(t) = \ln\left(1 + \frac{N}{DF(t)}\right)$$

- **Similaridade de Cosseno (Cosine Similarity)**:
  Normaliza pelo tamanho dos documentos para não favorecer textos excessivamente longos:
  $$\cos(\vec{q}, \vec{d}) = \frac{\sum_{t \in q \cap d} w_{t, q} \cdot w_{t, d}}{\|\vec{q}\| \cdot \|\vec{d}\|}$$
  onde $\|\vec{d}\| = \sqrt{\sum w_{t, d}^2}$ é a norma Euclidiana pré-calculada do documento.

## Como rodar

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed     # popula o corpus localmente e gera índice com pesos TF-IDF
# ou npm run ingest -- python rust docker (para coletar perguntas reais via API do Stack Exchange)
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
| Vocabulário (DF & IDF)     | tabela `terms` + `backend/src/index/invertedIndex.ts` |
| Índice Invertido (TF & TF-IDF) | tabela `postings` + `backend/src/index/invertedIndex.ts` |
| Modelo Vetorial (TF-IDF + Cosseno) | `backend/src/search/tfidfRetrieval.ts`            |
| Busca Booleana (AND/OR/NOT)| `backend/src/search/queryParser.ts` + `booleanRetrieval.ts` |
| Painel acadêmico           | `GET /api/stats` + `src/components/AcademicPanel.tsx` |

## Estrutura de telas (frontend)

- **HomeScreen** — logo RETRØVA, seletor de modelo (TF-IDF / Booleano), campo de busca, tamanho do corpus e caixa de coleta livre por tags
- **ResultsScreen** — consulta interpretada, painel acadêmico com fórmula e pesos, seletor de modelo, filtros por Tag/Tópico, ordenação e cards com relevância/cosseno
- **DocumentView** — pergunta completa do corpus + link para o Stack Overflow original
