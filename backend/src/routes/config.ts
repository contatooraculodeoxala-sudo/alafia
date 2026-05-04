import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = { DB: D1Database }
const config = new Hono<{ Bindings: Bindings }>()

// 🔹 Buscar configurações
config.get('/', async (c) => {
  const db = c.env.DB

  const { results } = await db
    .prepare('SELECT chave, valor FROM configuracoes')
    .all()

  const obj: Record<string, string> = {}

  for (const r of results as any[]) {
    obj[r.chave] = r.valor
  }

  return c.json(obj)
})

// 🔹 Salvar configurações
config.put('/', async (c) => {
  const db = c.env.DB
  const data = await c.req.json()

  if (!data || typeof data !== 'object') {
    return c.json({ error: 'Dados inválidos' }, 400)
  }

  for (const [chave, valor] of Object.entries(data)) {
    await db.prepare(`
      INSERT INTO configuracoes (chave, valor)
      VALUES (?, ?)
      ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
    `).bind(chave, String(valor)).run()
  }

  return c.json({ success: true })
})

export { config as configRoutes }