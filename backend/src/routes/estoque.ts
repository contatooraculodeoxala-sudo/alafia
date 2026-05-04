import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = { DB: D1Database }
const estoque = new Hono<{ Bindings: Bindings }>()

// 🔹 LISTAR
estoque.get('/', async (c) => {
  const db = c.env.DB
  const { alerta } = c.req.query()

  let query = `
    SELECT e.*, cat.nome as categoria_nome
    FROM estoque e
    LEFT JOIN categorias_estoque cat ON e.categoria_id = cat.id
    WHERE 1=1
  `

  if (alerta === '1') {
    query += ' AND e.quantidade <= e.quantidade_minima'
  }

  query += ' ORDER BY cat.nome, e.nome'

  const { results } = await db.prepare(query).all()
  return c.json(results)
})

// 🔹 ALERTAS
estoque.get('/alertas', async (c) => {
  const db = c.env.DB

  const { results } = await db.prepare(`
    SELECT e.*, cat.nome as categoria_nome
    FROM estoque e
    LEFT JOIN categorias_estoque cat ON e.categoria_id = cat.id
    WHERE e.quantidade <= e.quantidade_minima
    ORDER BY e.quantidade ASC
  `).all()

  return c.json(results)
})

// 🔹 CATEGORIAS
estoque.get('/categorias', async (c) => {
  const db = c.env.DB

  const { results } = await db
    .prepare('SELECT * FROM categorias_estoque ORDER BY nome')
    .all()

  return c.json(results)
})

// 🔹 BUSCAR 1
estoque.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const item = await db.prepare(`
    SELECT e.*, cat.nome as categoria_nome
    FROM estoque e
    LEFT JOIN categorias_estoque cat ON e.categoria_id = cat.id
    WHERE e.id = ?
  `).bind(id).first()

  if (!item) {
    return c.json({ error: 'Não encontrado' }, 404)
  }

  const { results: historico } = await db.prepare(`
    SELECT m.*, u.nome as usuario_nome
    FROM movimentacoes_estoque m
    LEFT JOIN usuarios u ON m.usuario_id = u.id
    WHERE m.item_id = ?
    ORDER BY m.criado_em DESC
    LIMIT 50
  `).bind(id).all()

  return c.json({ ...item, historico })
})

// 🔥 CRIAR ITEM
estoque.post('/', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()

  if (!d.nome) {
    return c.json({ error: 'Nome é obrigatório' }, 400)
  }

  const r = await db.prepare(`
    INSERT INTO estoque (
      nome,
      categoria_id,
      quantidade,
      unidade,
      quantidade_minima,
      valor_unitario,
      fornecedor
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    d.nome,
    d.categoria_id || null,
    d.quantidade || 0,
    d.unidade || 'un',
    d.quantidade_minima || 5,
    d.valor_unitario || 0,
    d.fornecedor || null
  ).run()

  return c.json({ success: true, id: r.meta.last_row_id })
})

// 🔹 ATUALIZAR ITEM
estoque.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const d = await c.req.json()

  if (!d.nome) {
    return c.json({ error: 'Nome é obrigatório' }, 400)
  }

  await db.prepare(`
    UPDATE estoque SET
      nome=?,
      categoria_id=?,
      quantidade_minima=?,
      unidade=?,
      valor_unitario=?,
      fornecedor=?,
      atualizado_em=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    d.nome,
    d.categoria_id || null,
    d.quantidade_minima || 5,
    d.unidade || 'un',
    d.valor_unitario || 0,
    d.fornecedor || null,
    id
  ).run()

  return c.json({ success: true })
})

// 🔥 ENTRADA DE ESTOQUE
estoque.post('/:id/entrada', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { quantidade, motivo, usuario_id } = await c.req.json()

  if (!quantidade || quantidade <= 0) {
    return c.json({ error: 'Quantidade inválida' }, 400)
  }

  await db.prepare(`
    UPDATE estoque
    SET quantidade = quantidade + ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(quantidade, id).run()

  await db.prepare(`
    INSERT INTO movimentacoes_estoque (
      item_id, tipo, quantidade, motivo, usuario_id
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    id,
    'entrada',
    quantidade,
    motivo || 'Entrada manual',
    usuario_id || null
  ).run()

  const item = await db.prepare(`
    SELECT nome, valor_unitario
    FROM estoque
    WHERE id = ?
  `).bind(id).first() as any

  if (item && item.valor_unitario) {
    await db.prepare(`
      INSERT INTO transacoes (tipo, categoria, descricao, valor)
      VALUES (?, ?, ?, ?)
    `).bind(
      'saida',
      'estoque',
      `Compra: ${item.nome}`,
      quantidade * item.valor_unitario
    ).run()
  }

  return c.json({ success: true })
})

// 🔥 SAÍDA DE ESTOQUE
estoque.post('/:id/saida', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const { quantidade, motivo, usuario_id } = await c.req.json()

  if (!quantidade || quantidade <= 0) {
    return c.json({ error: 'Quantidade inválida' }, 400)
  }

  await db.prepare(`
    UPDATE estoque
    SET quantidade = quantidade - ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(quantidade, id).run()

  await db.prepare(`
    INSERT INTO movimentacoes_estoque (
      item_id, tipo, quantidade, motivo, usuario_id
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    id,
    'saida',
    quantidade,
    motivo || 'Saída manual',
    usuario_id || null
  ).run()

  return c.json({ success: true })
})

export { estoque as estoqueRoutes }