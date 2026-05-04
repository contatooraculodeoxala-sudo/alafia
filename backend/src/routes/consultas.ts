import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = { DB: D1Database }
const consultas = new Hono<{ Bindings: Bindings }>()

// 🔹 LISTAR
consultas.get('/', async (c) => {
  const db = c.env.DB
  const { data, status, cliente_id } = c.req.query()

  let query = `
    SELECT co.*, 
           cl.nome as cliente_nome, 
           cl.telefone as cliente_telefone,
           u.nome as atendente_nome
    FROM consultas co
    LEFT JOIN clientes cl ON co.cliente_id = cl.id
    LEFT JOIN usuarios u ON co.atendente_id = u.id
    WHERE 1=1
  `

  const params: any[] = []

  if (data) {
    query += ' AND DATE(co.data_consulta) = ?'
    params.push(data)
  }

  if (status) {
    query += ' AND co.status_atendimento = ?'
    params.push(status)
  }

  if (cliente_id) {
    query += ' AND co.cliente_id = ?'
    params.push(cliente_id)
  }

  query += ' ORDER BY co.data_consulta DESC'

  const { results } = await db.prepare(query).bind(...params).all()
  return c.json(results)
})

// 🔹 HOJE
consultas.get('/hoje', async (c) => {
  const db = c.env.DB
  const hoje = new Date().toISOString().split('T')[0]

  const { results } = await db.prepare(`
    SELECT co.*, cl.nome as cliente_nome, cl.telefone as cliente_telefone
    FROM consultas co
    LEFT JOIN clientes cl ON co.cliente_id = cl.id
    WHERE DATE(co.data_consulta) = ?
    ORDER BY co.data_consulta ASC
  `).bind(hoje).all()

  return c.json(results)
})

// 🔹 TIPOS
consultas.get('/tipos/lista', async (c) => {
  const db = c.env.DB
  const { results } = await db
    .prepare('SELECT * FROM tipos_consulta WHERE ativo = 1')
    .all()
  return c.json(results)
})

consultas.post('/tipos/criar', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()

  const r = await db.prepare(`
    INSERT INTO tipos_consulta (nome, descricao, valor_padrao)
    VALUES (?, ?, ?)
  `).bind(
    d.nome,
    d.descricao || null,
    d.valor_padrao || 0
  ).run()

  return c.json({ success: true, id: r.meta.last_row_id })
})

// 🔹 BUSCAR 1
consultas.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const row = await db.prepare(`
    SELECT co.*, cl.nome as cliente_nome
    FROM consultas co
    LEFT JOIN clientes cl ON co.cliente_id = cl.id
    WHERE co.id = ?
  `).bind(id).first()

  if (!row) {
    return c.json({ error: 'Não encontrado' }, 404)
  }

  return c.json(row)
})

// 🔥 CRIAR CONSULTA (CORRIGIDO)
consultas.post('/', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()

  if (!d.cliente_id || !d.data_consulta) {
    return c.json({ error: 'Dados obrigatórios faltando' }, 400)
  }

  const result = await db.prepare(`
    INSERT INTO consultas (
      cliente_id,
      tipo_consulta_id,
      tipo_nome,
      data_consulta,
      valor,
      status_pagamento,
      status_atendimento,
      observacoes,
      proximo_contato,
      atendente_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    d.cliente_id,
    d.tipo_consulta_id || null,
    d.tipo_nome || null,
    d.data_consulta,
    d.valor || 0,
    d.status_pagamento || 'pendente',
    d.status_atendimento || 'agendado',
    d.observacoes || null,
    d.proximo_contato || null,
    d.atendente_id || null
  ).run()

  const newId = result.meta.last_row_id

  // 💰 financeiro
  if (d.valor > 0 && d.status_pagamento === 'pago') {
    await db.prepare(`
      INSERT INTO transacoes (tipo, categoria, descricao, valor, consulta_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'entrada',
      'consulta',
      `Consulta: ${d.tipo_nome || 'Geral'}`,
      d.valor,
      newId
    ).run()
  }

  // 📜 histórico
  await db.prepare(`
    INSERT INTO crm_historico (cliente_id, tipo, titulo, descricao)
    VALUES (?, ?, ?, ?)
  `).bind(
    d.cliente_id,
    'consulta',
    `Consulta agendada`,
    `Data: ${d.data_consulta}`
  ).run()

  return c.json({ success: true, id: newId })
})

// 🔥 UPDATE (CORRIGIDO)
consultas.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const d = await c.req.json()

  await db.prepare(`
    UPDATE consultas SET
      tipo_consulta_id=?,
      tipo_nome=?,
      data_consulta=?,
      valor=?,
      status_pagamento=?,
      status_atendimento=?,
      observacoes=?,
      proximo_contato=?,
      atendente_id=?,
      atualizado_em=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    d.tipo_consulta_id || null,
    d.tipo_nome || null,
    d.data_consulta,
    d.valor || 0,
    d.status_pagamento || 'pendente',
    d.status_atendimento || 'agendado',
    d.observacoes || null,
    d.proximo_contato || null,
    d.atendente_id || null,
    id
  ).run()

  return c.json({ success: true })
})

// 🔹 DELETE
consultas.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  await db.prepare(`
    UPDATE consultas
    SET status_atendimento = 'cancelado'
    WHERE id = ?
  `).bind(id).run()

  return c.json({ success: true })
})

export { consultas as consultasRoutes }