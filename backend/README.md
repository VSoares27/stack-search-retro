# RETRØVA — Backend

Node + Express + TypeScript. Implementa o pipeline real de Recuperação da
Informação sobre um corpus de perguntas do Stack Overflow.

## Setup

```bash
cp .env.example .env
npm install
```

O Stack Overflow (via API do Stack Exchange v2.3) funciona de forma anônima para até 300 requisições/dia por IP. Se desejar limite de até 10.000 requisições/dia, você pode registrar uma aplicação em https://stackapps.com/apps/oauth/register e preencher a variável `STACKEXCHANGE_KEY` no `.env`.

## Popular o corpus

### 1. Seed Offline (Instantâneo)
```bash
npm run seed
```
Popula o SQLite (`data/retrova.db`) com 23 perguntas clássicas e abrangentes do Stack Overflow (Python, JavaScript, React, SQL, Git, Docker, Algoritmos) e reconstrói o vocabulário e índice invertido.

### 2. Ingestão Online (Coleta Real)
Para coletar dados novos diretamente via API do Stack Exchange:
```bash
npm run ingest
```

Isso coleta as tags configuradas em `src/scripts/ingest.ts` (ex.: `python`, `javascript`, `reactjs`, `sql`, `algorithms`), persiste no SQLite (`data/retrova.db`) e reconstrói o índice invertido do zero.

Você também pode disparar uma ingestão pontual via API, com o servidor rodando:

```bash
curl -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"tag": "python", "limit": 30}'
```

## Rodar o servidor

```bash
npm run dev
```

## Endpoints

- `GET /api/search?q=python AND async NOT threading` — busca booleana real sobre o índice invertido
- `GET /api/stats` — tamanho do corpus, vocabulário e termos mais frequentes
- `GET /api/document/:id` — documento completo do corpus (para a tela Document View)
- `POST /api/ingest` — coleta perguntas por tag e reconstrói o índice

## Testar Coleta Real

Execute dentro de `backend`:

```bash
npm run check:so -- python
```

O teste consulta a API pública do Stack Exchange para a tag informada e exibe até 3 perguntas coletadas com seus títulos e URLs.
