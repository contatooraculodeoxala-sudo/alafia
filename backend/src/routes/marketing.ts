import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = { DB: D1Database }

const marketing = new Hono<{ Bindings: Bindings }>()

// 🔹 LISTAR CAMPANHAS
marketing.get('/campanhas', async (c) => {
  const db = c.env.DB

  const { results } = await db.prepare(`
    SELECT * FROM campanhas_marketing
    ORDER BY data_inicio DESC
  `).all()

  return c.json(results)
})

// 🔥 CRIAR CAMPANHA
marketing.post('/campanhas', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()

  // ✅ VALIDAÇÃO (evita erro silencioso)
  if (!d.nome || !d.canal) {
    return c.json({ error: 'Nome e canal são obrigatórios' }, 400)
  }

  const r = await db.prepare(`
    INSERT INTO campanhas_marketing (
      nome,
      canal,
      data_inicio,
      data_fim,
      orcamento,
      status,
      observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    d.nome,
    d.canal,
    d.data_inicio || null,
    d.data_fim || null,
    d.orcamento || 0,
    d.status || 'ativa',
    d.observacoes || null
  ).run()

  return c.json({ success: true, id: r.meta.last_row_id })
})

// 🔹 ATUALIZAR CAMPANHA
marketing.put('/campanhas/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const d = await c.req.json()

  if (!id) {
    return c.json({ error: 'ID inválido' }, 400)
  }

  await db.prepare(`
    UPDATE campanhas_marketing SET
      nome=?,
      canal=?,
      data_inicio=?,
      data_fim=?,
      orcamento=?,
      status=?,
      observacoes=?
    WHERE id=?
  `).bind(
    d.nome,
    d.canal,
    d.data_inicio || null,
    d.data_fim || null,
    d.orcamento || 0,
    d.status || 'ativa',
    d.observacoes || null,
    id
  ).run()

  return c.json({ success: true })
})

// 🔹 ESTATÍSTICAS POR ORIGEM
marketing.get('/origem/stats', async (c) => {
  const db = c.env.DB

  const { results } = await db.prepare(`
    SELECT origem,
      COUNT(*) as total,
      SUM(CASE WHEN status='ativo' THEN 1 ELSE 0 END) as ativos
    FROM clientes
    GROUP BY origem
    ORDER BY total DESC
  `).all()

  return c.json(results)
})

// 🔹 FUNIL DE VENDAS
marketing.get('/funil', async (c) => {
  const db = c.env.DB

  const prospectos = await db.prepare(`
    SELECT COUNT(*) as total FROM clientes WHERE status='prospecto'
  `).first() as any

  const ativos = await db.prepare(`
    SELECT COUNT(*) as total FROM clientes WHERE status='ativo'
  `).first() as any

  const comConsulta = await db.prepare(`
    SELECT COUNT(DISTINCT cliente_id) as total FROM consultas
  `).first() as any

  const comTrabalho = await db.prepare(`
    SELECT COUNT(DISTINCT cliente_id) as total FROM trabalhos
  `).first() as any

  const pagos = await db.prepare(`
    SELECT COUNT(DISTINCT consulta_id) as total
    FROM transacoes
    WHERE categoria='consulta'
  `).first() as any

  return c.json({
    prospectos: prospectos?.total || 0,
    ativos: ativos?.total || 0,
    comConsulta: comConsulta?.total || 0,
    comTrabalho: comTrabalho?.total || 0,
    pagos: pagos?.total || 0
  })
})

export { marketing as marketingRoutes }