import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT ?? 3001),
  dbPath: process.env.DB_PATH ?? './data/retrova.db',
  stackExchange: {
    key: process.env.STACKEXCHANGE_KEY ?? '',
    userAgent: process.env.STACKEXCHANGE_USER_AGENT ?? 'retrova:v1.0.0 (academic-ir-project)',
  },
}
