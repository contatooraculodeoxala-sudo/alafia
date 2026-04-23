import { Hono } from 'hono'

const equipe = new Hono()

equipe.get('/', async (c) => {
  const db = (c.env as any).DB
  const { results } = await db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM consultas WHERE atendente_id = u.id) as total_consultas_atendidas,
      (SELECT COUNT(*) FROM trabalhos WHERE responsavel_id = u.id) as total_trabalhos
    FROM usuarios u ORDER BY u.nome
  `).bind().all()
  return c.json(results.map((r: any) => { const { senha_hash, ...safe } = r; return safe }))
})

equipe.get('/:id', async (c) => {
  const db = (c.env as any).DB
  const u = await db.prepare('SELECT * FROM usuarios WHERE id = ?').bind(c.req.param('id')).first() as any
  if (!u) return c.json({ error: 'Não encontrado' }, 404)
  const { senha_hash, ...safe } = u
  return c.json(safe)
})

equipe.post('/', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  const existing = await db.prepare('SELECT id FROM usuarios WHERE email = ?').bind(d.email).first()
  if (existing) return c.json({ error: 'Email já cadastrado' }, 409)
  const r = await db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil, nome_templo) VALUES (?, ?, ?, ?, ?)').bind(d.nome, d.email, d.senha||'alafia123', d.perfil||'atendente', d.nome_templo||null).run()
  return c.json({ success: true, id: r.meta.last_row_id })
})

equipe.put('/:id', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  if (d.senha) {
    await db.prepare('UPDATE usuarios SET nome=?, email=?, senha_hash=?, perfil=?, ativo=?, nome_templo=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?')
      .bind(d.nome, d.email, d.senha, d.perfil, d.ativo??1, d.nome_templo||null, c.req.param('id')).run()
  } else {
    await db.prepare('UPDATE usuarios SET nome=?, email=?, perfil=?, ativo=?, nome_templo=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?')
      .bind(d.nome, d.email, d.perfil, d.ativo??1, d.nome_templo||null, c.req.param('id')).run()
  }
  return c.json({ success: true })
})

equipe.delete('/:id', async (c) => {
  await (c.env as any).DB.prepare('UPDATE usuarios SET ativo = 0 WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

export { equipe as equipeRoutes }
