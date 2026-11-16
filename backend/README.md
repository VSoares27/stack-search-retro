# RETRØVA — Backend

Node + Express + TypeScript. Implementa o pipeline real de Recuperação da
Informação sobre um corpus de perguntas do Stack Overflow, com suporte aos modelos **TF-IDF (Vector Space Model)** e **Booleano**.

## Setup

```bash
cp .env.example .env
npm install
```

### Configurações no `.env`:

```env
# Modelo padrão de recuperação ('tfidf' ou 'boolean')
RETRIEVAL_MODEL=tfidf

# Chave opcional do Stack Exchange (aumenta limite para 10.000 requisições/dia)
STACKEXCHANGE_KEY=
STACKEXCHANGE_USER_AGENT=StackOverflow IR Project/1.0.0

PORT=3001
DB_PATH=./data/retrova.db
```

## Popular o corpus e construir o índice TF-IDF

### 1. Seed Offline (Instantâneo)
```bash
npm run seed
```
Popula o SQLite (`data/retrova.db`) com perguntas clássicas do Stack Overflow, computa frequências de termos ($TF$), frequência inversa nos documentos ($IDF$), pesos $TF \times IDF$ e a norma Euclidiana de cada documento.

### 2. Ingestão Online (Coleta Real com 50 perguntas por tag)
```bash
# Coletar tags específicas
npm run ingest -- docker rust kubernetes

# Ou tags padrão
npm run ingest
```

## Endpoints

- `GET /api/search?q=python dictionary&method=tfidf` — busca vetorial ranqueada por TF-IDF e Similaridade de Cosseno (padrão)
- `GET /api/search?q=python AND dictionary NOT java&method=boolean` — busca booleana por álgebra de conjuntos
- `GET /api/stats` — tamanho do corpus, vocabulário com DF/IDF e modelo ativo
- `GET /api/document/:id` — documento completo do corpus
- `POST /api/ingest` — coleta perguntas por tag (`{"tag": "rust", "limit": 50}`) e reconstrói o índice
