import { Hono } from 'hono'

const clientes = new Hono()

clientes.get('/', async (c) => {
  const db = (c.env as any).DB
  const { q, status } = c.req.query()

  let query = `SELECT * FROM clientes WHERE 1=1`
  const params: any[] = []

  if (q) {
    query += ' AND (nome LIKE ? OR telefone LIKE ?)'
    params.push(`%${q}%`, `%${q}%`)
  }

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }

  query += ' ORDER BY nome ASC'

  const { results } = await db.prepare(query).bind(...params).all()
  return c.json(results)
})

clientes.get('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')

  const cliente = await db
    .prepare('SELECT * FROM clientes WHERE id = ?')
    .bind(id)
    .first()

  if (!cliente) {
    return c.json({ error: 'Cliente não encontrado' }, 404)
  }

  return c.json(cliente)
})

clientes.post('/', async (c) => {
  const db = (c.env as any).DB
  const data = await c.req.json()

  const result = await db.prepare(`
    INSERT INTO clientes (
      nome,
      telefone,
      email,
      data_nascimento,
      instagram,
      origem,
      status,
      melhor_dia,
      melhor_horario,
      relato,
      observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.nome,
    data.telefone,
    data.email || null,
    data.data_nascimento || null,
    data.instagram || null,
    data.origem || 'direto',
    data.status || 'ativo',
    data.melhor_dia || null,
    data.melhor_horario || null,
    data.relato || data.relato_inicial || null,
    data.observacoes || null
  ).run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

clientes.put('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')
  const data = await c.req.json()

  await db.prepare(`
    UPDATE clientes SET
      nome=?,
      telefone=?,
      email=?,
      data_nascimento=?,
      instagram=?,
      origem=?,
      status=?,
      melhor_dia=?,
      melhor_horario=?,
      relato=?,
      observacoes=?
    WHERE id=?
  `).bind(
    data.nome,
    data.telefone,
    data.email || null,
    data.data_nascimento || null,
    data.instagram || null,
    data.origem || 'direto',
    data.status || 'ativo',
    data.melhor_dia || null,
    data.melhor_horario || null,
    data.relato || data.relato_inicial || null,
    data.observacoes || null,
    id
  ).run()

  return c.json({ success: true })
})

clientes.delete('/:id', async (c) => {
  const db = (c.env as any).DB
  const id = c.req.param('id')

  await db
    .prepare('UPDATE clientes SET status = ? WHERE id = ?')
    .bind('inativo', id)
    .run()

  return c.json({ success: true })
})

clientes.post('/publico/cadastro', async (c) => {
  const db = (c.env as any).DB
  const data = await c.req.json()

  const existing = await db
    .prepare('SELECT id FROM clientes WHERE telefone = ?')
    .bind(data.telefone)
    .first() as any

  if (existing) {
    await db.prepare(`
      UPDATE clientes SET
        nome=?,
        email=?,
        data_nascimento=?,
        relato=?,
        melhor_dia=?,
        melhor_horario=?
      WHERE id=?
    `).bind(
      data.nome,
      data.email || null,
      data.data_nascimento || null,
      data.relato || data.relato_inicial || null,
      data.melhor_dia || null,
      data.melhor_horario || null,
      existing.id
    ).run()

    return c.json({ success: true, id: existing.id, novo: false })
  }

  const result = await db.prepare(`
    INSERT INTO clientes (
      nome,
      telefone,
      email,
      data_nascimento,
      relato,
      melhor_dia,
      melhor_horario,
      origem,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'whatsapp', 'prospecto')
  `).bind(
    data.nome,
    data.telefone,
    data.email || null,
    data.data_nascimento || null,
    data.relato || data.relato_inicial || null,
    data.melhor_dia || null,
    data.melhor_horario || null
  ).run()

  return c.json({ success: true, id: result.meta.last_row_id, novo: true })
})

export { clientes as clientesRoutes }