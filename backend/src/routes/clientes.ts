import { Hono } from 'hono'

const clientes = new Hono()

clientes.get('/', async (c) => {
  const db = (c.env as any).DB
  const { q, status } = c.req.query()
  let query = `SELECT c.*,
    (SELECT COUNT(*) FROM consultas WHERE cliente_id = c.id) as total_consultas,
    (SELECT MAX(data_consulta) FROM consultas WHERE cliente_id = c.id) as ultima_consulta,
    (SELECT COUNT(*) FROM trabalhos WHERE cliente_id = c.id AND status = 'em_andamento') as trabalhos_ativos
    FROM clientes c WHERE 1=1`
  const params: any[] = []
  if (q) { query += ' AND (c.nome LIKE ? OR c.telefone LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  if (status) { query += ' AND c.status = ?'; params.push(status) }
  query += ' ORDER BY c.nome ASC'
  const { results } = await db.prepare(query).bind(...params).all()
  return c.json(results)
})

clientes.get('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const cliente = await db.prepare('SELECT * FROM clientes WHERE id = ?').bind(id).first()
  if (!cliente) return c.json({ error: 'Cliente não encontrado' }, 404)
  const { results: consultas } = await db.prepare('SELECT * FROM consultas WHERE cliente_id = ? ORDER BY data_consulta DESC').bind(id).all()
  const { results: trabalhos } = await db.prepare('SELECT * FROM trabalhos WHERE cliente_id = ? ORDER BY data_inicio DESC').bind(id).all()
  const { results: historico } = await db.prepare('SELECT h.*, u.nome as usuario_nome FROM crm_historico h LEFT JOIN usuarios u ON h.usuario_id = u.id WHERE h.cliente_id = ? ORDER BY h.criado_em DESC').bind(id).all()
  return c.json({ ...cliente, consultas, trabalhos, historico })
})

clientes.post('/', async (c) => {
  const db = (c.env as any).DB
  const data = await c.req.json()
  const result = await db.prepare(`
    INSERT INTO clientes (nome, telefone, email, data_nascimento, foto_url, origem, status, observacoes, relato_inicial, melhor_dia, melhor_horario, instagram, criado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(data.nome, data.telefone, data.email||null, data.data_nascimento||null, data.foto_url||null,
    data.origem||'direto', data.status||'ativo', data.observacoes||null,
    data.relato_inicial||null, data.melhor_dia||null, data.melhor_horario||null,
    data.instagram||null, data.criado_por||null).run()
  const newId = result.meta.last_row_id
  if (newId) {
    await db.prepare('INSERT INTO crm_historico (cliente_id, tipo, titulo, descricao) VALUES (?, ?, ?, ?)').bind(
      newId, 'contato', 'Cadastro realizado', `Cliente cadastrado via ${data.origem||'direto'}`
    ).run()
  }
  return c.json({ success: true, id: newId })
})

clientes.put('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const data = await c.req.json()
  await db.prepare(`UPDATE clientes SET nome=?, telefone=?, email=?, data_nascimento=?, foto_url=?, origem=?, status=?, observacoes=?, relato_inicial=?, melhor_dia=?, melhor_horario=?, instagram=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(data.nome, data.telefone, data.email||null, data.data_nascimento||null, data.foto_url||null,
    data.origem||'direto', data.status||'ativo', data.observacoes||null,
    data.relato_inicial||null, data.melhor_dia||null, data.melhor_horario||null,
    data.instagram||null, id).run()
  return c.json({ success: true })
})

clientes.delete('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  await db.prepare('UPDATE clientes SET status = ? WHERE id = ?').bind('inativo', id).run()
  return c.json({ success: true })
})

clientes.post('/:id/historico', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const { tipo, titulo, descricao, usuario_id } = await c.req.json()
  await db.prepare('INSERT INTO crm_historico (cliente_id, tipo, titulo, descricao, usuario_id) VALUES (?, ?, ?, ?, ?)')
    .bind(id, tipo, titulo, descricao||null, usuario_id||null).run()
  return c.json({ success: true })
})

clientes.post('/publico/cadastro', async (c) => {
  const db = (c.env as any).DB
  const data = await c.req.json()
  const existing = await db.prepare('SELECT id FROM clientes WHERE telefone = ?').bind(data.telefone).first() as any
  if (existing) {
    await db.prepare(`UPDATE clientes SET nome=?, email=?, data_nascimento=?, relato_inicial=?, melhor_dia=?, melhor_horario=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(data.nome, data.email||null, data.data_nascimento||null, data.relato_inicial||null, data.melhor_dia||null, data.melhor_horario||null, existing.id).run()
    return c.json({ success: true, id: existing.id, novo: false })
  }
  const result = await db.prepare(`
    INSERT INTO clientes (nome, telefone, email, data_nascimento, relato_inicial, melhor_dia, melhor_horario, origem, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'whatsapp', 'prospecto')
  `).bind(data.nome, data.telefone, data.email||null, data.data_nascimento||null, data.relato_inicial||null, data.melhor_dia||null, data.melhor_horario||null).run()
  const newId = result.meta.last_row_id
  if (newId) {
    await db.prepare('INSERT INTO crm_historico (cliente_id, tipo, titulo, descricao) VALUES (?, ?, ?, ?)').bind(
      newId, 'contato', 'Auto-cadastro via link', 'Cliente preencheu o formulário de cadastro inteligente'
    ).run()
  }
  return c.json({ success: true, id: newId, novo: true })
})

export { clientes as clientesRoutes }
