import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = { DB: D1Database }

const trabalhos = new Hono<{ Bindings: Bindings }>()

// 🔹 LISTAR
trabalhos.get('/', async (c) => {
  const db = c.env.DB
  const { status, cliente_id } = c.req.query()

  let q = `
    SELECT t.*, cl.nome as cliente_nome, u.nome as responsavel_nome
    FROM trabalhos t
    LEFT JOIN clientes cl ON t.cliente_id = cl.id
    LEFT JOIN usuarios u ON t.responsavel_id = u.id
    WHERE 1=1
  `

  const p: any[] = []

  if (status) {
    q += ' AND t.status = ?'
    p.push(status)
  }

  if (cliente_id) {
    q += ' AND t.cliente_id = ?'
    p.push(cliente_id)
  }

  q += ' ORDER BY t.data_inicio DESC'

  const { results } = await db.prepare(q).bind(...p).all()
  return c.json(results)
})

// 🔥 CRIAR TRABALHO
trabalhos.post('/', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()

  if (!d.cliente_id || !d.data_inicio) {
    return c.json({ error: 'Cliente e data são obrigatórios' }, 400)
  }

  const result = await db.prepare(`
    INSERT INTO trabalhos (
      cliente_id,
      tipo_trabalho_id,
      tipo_nome,
      data_inicio,
      data_fim_prevista,
      valor,
      status_pagamento,
      status,
      observacoes,
      responsavel_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    d.cliente_id,
    d.tipo_trabalho_id || null,
    d.tipo_nome || null,
    d.data_inicio,
    d.data_fim_prevista || null,
    d.valor || 0,
    d.status_pagamento || 'pendente',
    'em_andamento',
    d.observacoes || null,
    d.responsavel_id || null
  ).run()

  const newId = result.meta.last_row_id

  return c.json({ success: true, id: newId })
})

// 🔹 ATUALIZAR
trabalhos.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const d = await c.req.json()

  await db.prepare(`
    UPDATE trabalhos SET
      tipo_nome=?,
      data_inicio=?,
      data_fim_prevista=?,
      valor=?,
      status_pagamento=?,
      status=?,
      observacoes=?,
      responsavel_id=?,
      atualizado_em=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    d.tipo_nome || null,
    d.data_inicio,
    d.data_fim_prevista || null,
    d.valor || 0,
    d.status_pagamento || 'pendente',
    d.status || 'em_andamento',
    d.observacoes || null,
    d.responsavel_id || null,
    id
  ).run()

  return c.json({ success: true })
})

// 🔹 DELETAR
trabalhos.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  await db.prepare('DELETE FROM trabalhos WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

export { trabalhos as trabalhosRoutes }