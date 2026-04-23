import { Hono } from 'hono'

const marketing = new Hono()

marketing.get('/campanhas', async (c) => {
  const db = (c.env as any).DB
  const { results } = await db.prepare('SELECT * FROM campanhas_marketing ORDER BY data_inicio DESC').bind().all()
  return c.json(results)
})

marketing.post('/campanhas', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  const r = await db.prepare('INSERT INTO campanhas_marketing (nome, canal, data_inicio, data_fim, orcamento, status, observacoes) VALUES (?,?,?,?,?,?,?)')
    .bind(d.nome, d.canal, d.data_inicio||null, d.data_fim||null, d.orcamento||0, d.status||'ativa', d.observacoes||null).run()
  return c.json({ success: true, id: r.meta.last_row_id })
})

marketing.put('/campanhas/:id', async (c) => {
  const db = (c.env as any).DB
  const d = await c.req.json()
  await db.prepare('UPDATE campanhas_marketing SET nome=?,canal=?,data_inicio=?,data_fim=?,orcamento=?,status=?,observacoes=? WHERE id=?')
    .bind(d.nome, d.canal, d.data_inicio||null, d.data_fim||null, d.orcamento||0, d.status||'ativa', d.observacoes||null, c.req.param('id')).run()
  return c.json({ success: true })
})

marketing.get('/origem/stats', async (c) => {
  const db = (c.env as any).DB
  const { results } = await db.prepare(`SELECT origem, COUNT(*) as total, SUM(CASE WHEN status='ativo' THEN 1 ELSE 0 END) as ativos FROM clientes GROUP BY origem ORDER BY total DESC`).bind().all()
  return c.json(results)
})

marketing.get('/funil', async (c) => {
  const db = (c.env as any).DB
  const prospectos = await db.prepare("SELECT COUNT(*) as total FROM clientes WHERE status='prospecto'").bind().first() as any
  const ativos = await db.prepare("SELECT COUNT(*) as total FROM clientes WHERE status='ativo'").bind().first() as any
  const comConsulta = await db.prepare('SELECT COUNT(DISTINCT cliente_id) as total FROM consultas').bind().first() as any
  const comTrabalho = await db.prepare('SELECT COUNT(DISTINCT cliente_id) as total FROM trabalhos').bind().first() as any
  const pagos = await db.prepare("SELECT COUNT(DISTINCT consulta_id) as total FROM transacoes WHERE categoria='consulta'").bind().first() as any
  return c.json({
    prospectos: prospectos?.total||0,
    ativos: ativos?.total||0,
    comConsulta: comConsulta?.total||0,
    comTrabalho: comTrabalho?.total||0,
    pagos: pagos?.total||0
  })
})

export { marketing as marketingRoutes }
