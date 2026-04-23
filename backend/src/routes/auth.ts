import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = { DB: D1Database; [k: string]: unknown }
const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/login', async (c) => {
  const { email, senha } = await c.req.json()
  const db = (c.env as any).DB
  const user = await db.prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1').bind(email).first() as any
  if (!user || user.senha_hash !== senha) {
    return c.json({ error: 'Email ou senha inválidos' }, 401)
  }
  const { senha_hash, ...safeUser } = user
  return c.json({ success: true, user: safeUser, token: `token_${user.id}_${Date.now()}` })
})

auth.post('/register', async (c) => {
  const { nome, email, senha, perfil, nome_templo } = await c.req.json()
  const db = (c.env as any).DB
  const existing = await db.prepare('SELECT id FROM usuarios WHERE email = ?').bind(email).first()
  if (existing) return c.json({ error: 'Email já cadastrado' }, 409)
  const result = await db.prepare(
    'INSERT INTO usuarios (nome, email, senha_hash, perfil, nome_templo) VALUES (?, ?, ?, ?, ?)'
  ).bind(nome, email, senha, perfil || 'atendente', nome_templo || null).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

auth.get('/me', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Não autenticado' }, 401)
  const userId = token.split('_')[1]
  const db = (c.env as any).DB
  const user = await db.prepare('SELECT id,nome,email,perfil,nome_templo FROM usuarios WHERE id = ?').bind(userId).first()
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404)
  return c.json(user)
})

export { auth as authRoutes }
