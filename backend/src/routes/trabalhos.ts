import { Hono } from 'hono'

const trabalhos = new Hono()

trabalhos.get('/', async (c) => {
  const db = (c.env as any).DB
  const { status, cliente_id } = c.req.query()
  let q = `SELECT t.*, cl.nome as cliente_nome, cl.telefone as cliente_telefone, u.nome as responsavel_nome
    FROM trabalhos t LEFT JOIN clientes cl ON t.cliente_id = cl.id LEFT JOIN usuarios u ON t.responsavel_id = u.id WHERE 1=1`
  const p: any[] = []
  if (status) { q += ' AND t.status = ?'; p.push(status) }
  if (cliente_id) { q += ' AND t.cliente_id = ?'; p.push(cliente_id) }
  q += ' ORDER BY t.data_inicio DESC'
  const { results } = await db.prepare(q).bind(...p).all()
  return c.json(results)
})

// Tipos de trabalho (before /:id to avoid route collision)
trabalhos.get('/tipos/lista', async (c) => {
  const { results } = await (c.env as any).DB.prepare('SELECT * FROM tipos_trabalho WHERE ativo = 1').bind().all()
  return c.json(results)
})

trabalhos.post('/tipos/criar', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  const r = await db.prepare('INSERT INTO tipos_trabalho (nome, descricao, valor_padrao, duracao_dias) VALUES (?, ?, ?, ?)').bind(d.nome, d.descricao||null, d.valor_padrao||0, d.duracao_dias||7).run()
  return c.json({ success: true, id: r.meta.last_row_id })
})

trabalhos.put('/tipos/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const d = await c.req.json()
  await db.prepare('UPDATE tipos_trabalho SET nome=?, descricao=?, valor_padrao=?, duracao_dias=? WHERE id=?')
    .bind(d.nome, d.descricao||null, d.valor_padrao||0, d.duracao_dias||7, id).run()
  return c.json({ success: true })
})

trabalhos.delete('/tipos/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  await db.prepare('UPDATE tipos_trabalho SET ativo=0 WHERE id=?').bind(id).run()
  return c.json({ success: true })
})

// Fotos top-level (before /:id to avoid route collision)
trabalhos.get('/fotos/:fotoId', async (c) => {
  const db = (c.env as any).DB
  const fotoId = c.req.param('fotoId')
  const foto = await db.prepare('SELECT * FROM trabalho_fotos WHERE id=?').bind(fotoId).first()
  if (!foto) return c.json({ error: 'Não encontrado' }, 404)
  return c.json(foto)
})

trabalhos.delete('/fotos/:fotoId', async (c) => {
  const db = (c.env as any).DB
  const fotoId = c.req.param('fotoId')
  await db.prepare('DELETE FROM trabalho_fotos WHERE id=?').bind(fotoId).run()
  return c.json({ success: true })
})

trabalhos.get('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const row = await db.prepare(`SELECT t.*, cl.nome as cliente_nome FROM trabalhos t LEFT JOIN clientes cl ON t.cliente_id = cl.id WHERE t.id = ?`).bind(id).first()
  if (!row) return c.json({ error: 'Não encontrado' }, 404)
  const { results: materiais } = await db.prepare(`SELECT tm.*, e.nome as item_nome, e.unidade FROM trabalho_materiais tm LEFT JOIN estoque e ON tm.item_id = e.id WHERE tm.trabalho_id = ?`).bind(id).all()
  return c.json({ ...row, materiais })
})

trabalhos.post('/', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  const result = await db.prepare(`INSERT INTO trabalhos (cliente_id, tipo_trabalho_id, tipo_nome, data_inicio, data_fim_prevista, valor, status_pagamento, status, observacoes, responsavel_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    d.cliente_id, d.tipo_trabalho_id||null, d.tipo_nome||null, d.data_inicio, d.data_fim_prevista||null,
    d.valor||0, d.status_pagamento||'pendente', 'em_andamento', d.observacoes||null, d.responsavel_id||null).run()
  const newId = result.meta.last_row_id
  if (d.valor > 0 && d.status_pagamento === 'pago') {
    await db.prepare('INSERT INTO transacoes (tipo, categoria, descricao, valor, trabalho_id) VALUES (?, ?, ?, ?, ?)')
      .bind('entrada', 'trabalho', `Trabalho: ${d.tipo_nome||'Espiritual'}`, d.valor, newId).run()
  }
  await db.prepare('INSERT INTO crm_historico (cliente_id, tipo, titulo, descricao) VALUES (?, ?, ?, ?)').bind(
    d.cliente_id, 'trabalho', `Trabalho iniciado: ${d.tipo_nome||'Espiritual'}`, `Início: ${d.data_inicio} | Valor: R$ ${d.valor}`
  ).run()
  return c.json({ success: true, id: newId })
})

trabalhos.put('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const d = await c.req.json()
  const antigo = await db.prepare('SELECT * FROM trabalhos WHERE id = ?').bind(id).first() as any
  const dataFimReal = d.status === 'finalizado' ? new Date().toISOString() : d.data_fim_real || null
  await db.prepare(`UPDATE trabalhos SET tipo_trabalho_id=?, tipo_nome=?, data_inicio=?, data_fim_prevista=?, data_fim_real=?, valor=?, valor_pago=?, status_pagamento=?, status=?, observacoes=?, responsavel_id=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(d.tipo_trabalho_id||null, d.tipo_nome||null, d.data_inicio, d.data_fim_prevista||null, dataFimReal,
    d.valor||0, d.valor_pago||0, d.status_pagamento||'pendente', d.status||'em_andamento',
    d.observacoes||null, d.responsavel_id||null, id).run()
  if (d.status_pagamento === 'pago' && antigo?.status_pagamento !== 'pago') {
    await db.prepare('INSERT INTO transacoes (tipo, categoria, descricao, valor, trabalho_id) VALUES (?, ?, ?, ?, ?)')
      .bind('entrada', 'trabalho', `Pagamento trabalho: ${d.tipo_nome||'Espiritual'}`, d.valor, id).run()
  }
  return c.json({ success: true })
})

trabalhos.post('/:id/materiais', async (c) => {
  const db = (c.env as any).DB
  const trabalhoId = c.req.param('id')
  const { item_id, quantidade, valor_unitario } = await c.req.json()
  await db.prepare('INSERT INTO trabalho_materiais (trabalho_id, item_id, quantidade, valor_unitario) VALUES (?, ?, ?, ?)').bind(trabalhoId, item_id, quantidade, valor_unitario||0).run()
  const item = await db.prepare('SELECT * FROM estoque WHERE id = ?').bind(item_id).first() as any
  if (item) {
    await db.prepare('UPDATE estoque SET quantidade = quantidade - ? WHERE id = ?').bind(quantidade, item_id).run()
    await db.prepare('INSERT INTO movimentacoes_estoque (item_id, tipo, quantidade, motivo, trabalho_id) VALUES (?, ?, ?, ?, ?)')
      .bind(item_id, 'saida', quantidade, `Uso em trabalho #${trabalhoId}`, trabalhoId).run()
    await db.prepare('INSERT INTO transacoes (tipo, categoria, descricao, valor, trabalho_id) VALUES (?, ?, ?, ?, ?)')
      .bind('saida', 'material', `Material: ${item.nome}`, quantidade * (valor_unitario||item.valor_unitario||0), trabalhoId).run()
  }
  return c.json({ success: true })
})

trabalhos.delete('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const row = await db.prepare('SELECT * FROM trabalhos WHERE id = ?').bind(id).first()
  if (!row) return c.json({ error: 'Não encontrado' }, 404)
  await db.prepare('DELETE FROM trabalho_materiais WHERE trabalho_id = ?').bind(id).run()
  await db.prepare('DELETE FROM trabalho_fotos WHERE trabalho_id = ?').bind(id).run()
  await db.prepare('DELETE FROM trabalhos WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

trabalhos.get('/:id/fotos', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const { results } = await db.prepare('SELECT * FROM trabalho_fotos WHERE trabalho_id=? ORDER BY criado_em DESC').bind(id).all()
  return c.json(results)
})

trabalhos.post('/:id/fotos', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const { foto_base64, descricao } = await c.req.json()
  const r = await db.prepare('INSERT INTO trabalho_fotos (trabalho_id, foto_base64, descricao) VALUES (?, ?, ?)').bind(id, foto_base64, descricao||null).run()
  return c.json({ success: true, id: r.meta.last_row_id })
})

export { trabalhos as trabalhosRoutes }
