import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = { DB: D1Database }
const equipe = new Hono<{ Bindings: Bindings }>()

// 🔹 LISTAR EQUIPE
equipe.get('/', async (c) => {
  const db = c.env.DB

  const { results } = await db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM consultas WHERE atendente_id = u.id) as total_consultas_atendidas,
      (SELECT COUNT(*) FROM trabalhos WHERE responsavel_id = u.id) as total_trabalhos
    FROM usuarios u
    ORDER BY u.nome
  `).all()

  return c.json(
    (results as any[]).map((r) => {
      const { senha_hash, ...safe } = r
      return safe
    })
  )
})

// 🔹 BUSCAR 1
equipe.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  const u = await db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .bind(id)
    .first() as any

  if (!u) return c.json({ error: 'Não encontrado' }, 404)

  const { senha_hash, ...safe } = u
  return c.json(safe)
})

// 🔹 CRIAR
equipe.post('/', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()

  if (!d.nome || !d.email) {
    return c.json({ error: 'Nome e email são obrigatórios' }, 400)
  }

  const existing = await db
    .prepare('SELECT id FROM usuarios WHERE email = ?')
    .bind(d.email)
    .first()

  if (existing) {
    return c.json({ error: 'Email já cadastrado' }, 409)
  }

  const r = await db.prepare(`
    INSERT INTO usuarios (
      nome,
      email,
      senha_hash,
      perfil,
      nome_templo,
      ativo
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    d.nome,
    d.email,
    d.senha || '123456',
    d.perfil || 'atendente',
    d.nome_templo || null,
    1
  ).run()

  return c.json({ success: true, id: r.meta.last_row_id })
})

// 🔹 ATUALIZAR
equipe.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const d = await c.req.json()

  if (!d.nome || !d.email) {
    return c.json({ error: 'Nome e email são obrigatórios' }, 400)
  }

  if (d.senha) {
    await db.prepare(`
      UPDATE usuarios SET
        nome=?,
        email=?,
        senha_hash=?,
        perfil=?,
        ativo=?,
        nome_templo=?,
        atualizado_em=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      d.nome,
      d.email,
      d.senha,
      d.perfil || 'atendente',
      d.ativo ?? 1,
      d.nome_templo || null,
      id
    ).run()
  } else {
    await db.prepare(`
      UPDATE usuarios SET
        nome=?,
        email=?,
        perfil=?,
        ativo=?,
        nome_templo=?,
        atualizado_em=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      d.nome,
      d.email,
      d.perfil || 'atendente',
      d.ativo ?? 1,
      d.nome_templo || null,
      id
    ).run()
  }

  return c.json({ success: true })
})

// 🔹 DESATIVAR
equipe.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')

  await db.prepare(`
    UPDATE usuarios
    SET ativo = 0
    WHERE id = ?
  `).bind(id).run()

  return c.json({ success: true })
})

export { equipe as equipeRoutes }