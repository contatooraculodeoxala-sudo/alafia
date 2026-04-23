import { Hono } from 'hono'

const config = new Hono()

config.get('/', async (c) => {
  const db = (c.env as any).DB
  const { results } = await db.prepare('SELECT * FROM configuracoes').bind().all()
  const obj: Record<string, string> = {}
  results.forEach((r: any) => { obj[r.chave] = r.valor })
  return c.json(obj)
})

config.put('/', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  for (const [chave, valor] of Object.entries(d)) {
    await db.prepare('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)').bind(chave, valor as string).run()
  }
  return c.json({ success: true })
})

export { config as configRoutes }
