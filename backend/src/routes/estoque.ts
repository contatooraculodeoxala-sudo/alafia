import { Hono } from 'hono'

const estoque = new Hono()

estoque.get('/', async (c) => {
  const db = (c.env as any).DB
  const { alerta } = c.req.query()
  let q = `SELECT e.*, cat.nome as categoria_nome FROM estoque e LEFT JOIN categorias_estoque cat ON e.categoria_id = cat.id WHERE 1=1`
  if (alerta === '1') q += ' AND e.quantidade <= e.quantidade_minima'
  q += ' ORDER BY cat.nome, e.nome'
  const { results } = await db.prepare(q).bind().all()
  return c.json(results)
})

estoque.get('/alertas', async (c) => {
  const db = (c.env as any).DB
  const { results } = await db.prepare(`SELECT e.*, cat.nome as categoria_nome FROM estoque e LEFT JOIN categorias_estoque cat ON e.categoria_id = cat.id WHERE e.quantidade <= e.quantidade_minima ORDER BY e.quantidade ASC`).bind().all()
  return c.json(results)
})

estoque.get('/categorias', async (c) => {
  const { results } = await (c.env as any).DB.prepare('SELECT * FROM categorias_estoque ORDER BY nome').bind().all()
  return c.json(results)
})

estoque.get('/:id', async (c) => {
  const db = (c.env as any).DB
  const item = await db.prepare('SELECT e.*, cat.nome as categoria_nome FROM estoque e LEFT JOIN categorias_estoque cat ON e.categoria_id = cat.id WHERE e.id = ?').bind(c.req.param('id')).first()
  if (!item) return c.json({ error: 'Não encontrado' }, 404)
  const { results: historico } = await db.prepare('SELECT m.*, u.nome as usuario_nome FROM movimentacoes_estoque m LEFT JOIN usuarios u ON m.usuario_id = u.id WHERE m.item_id = ? ORDER BY m.criado_em DESC LIMIT 50').bind(c.req.param('id')).all()
  return c.json({ ...item, historico })
})

estoque.post('/', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  const r = await db.prepare('INSERT INTO estoque (nome, categoria_id, quantidade, unidade, quantidade_minima, valor_unitario, fornecedor) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(d.nome, d.categoria_id||null, d.quantidade||0, d.unidade||'un', d.quantidade_minima||5, d.valor_unitario||0, d.fornecedor||null).run()
  return c.json({ success: true, id: r.meta.last_row_id })
})

estoque.put('/:id', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  await db.prepare('UPDATE estoque SET nome=?, categoria_id=?, quantidade_minima=?, unidade=?, valor_unitario=?, fornecedor=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?')
    .bind(d.nome, d.categoria_id||null, d.quantidade_minima||5, d.unidade||'un', d.valor_unitario||0, d.fornecedor||null, c.req.param('id')).run()
  return c.json({ success: true })
})

estoque.post('/:id/entrada', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const { quantidade, motivo, usuario_id } = await c.req.json()
  await db.prepare('UPDATE estoque SET quantidade = quantidade + ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?').bind(quantidade, id).run()
  await db.prepare('INSERT INTO movimentacoes_estoque (item_id, tipo, quantidade, motivo, usuario_id) VALUES (?, ?, ?, ?, ?)').bind(id, 'entrada', quantidade, motivo||'Entrada manual', usuario_id||null).run()
  const item = await db.prepare('SELECT nome, valor_unitario FROM estoque WHERE id = ?').bind(id).first() as any
  if (item) {
    await db.prepare('INSERT INTO transacoes (tipo, categoria, descricao, valor) VALUES (?, ?, ?, ?)')
      .bind('saida', 'estoque', `Compra: ${item.nome}`, quantidade * (item.valor_unitario||0)).run()
  }
  return c.json({ success: true })
})

estoque.post('/:id/saida', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const { quantidade, motivo, usuario_id } = await c.req.json()
  await db.prepare('UPDATE estoque SET quantidade = quantidade - ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?').bind(quantidade, id).run()
  await db.prepare('INSERT INTO movimentacoes_estoque (item_id, tipo, quantidade, motivo, usuario_id) VALUES (?, ?, ?, ?, ?)').bind(id, 'saida', quantidade, motivo||'Saída manual', usuario_id||null).run()
  return c.json({ success: true })
})

export { estoque as estoqueRoutes }
