import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = { DB: D1Database }
const financeiro = new Hono<{ Bindings: Bindings }>()

// 🔹 RESUMO
financeiro.get('/resumo', async (c) => {
  const db = c.env.DB
  const { periodo } = c.req.query()

  let filtroData = ''

  if (periodo === 'hoje') {
    filtroData = `AND DATE(data_transacao) = DATE('now')`
  } else if (periodo === 'semana') {
    filtroData = `AND data_transacao >= DATE('now', '-7 days')`
  } else if (periodo === 'mes') {
    filtroData = `AND strftime('%Y-%m', data_transacao) = strftime('%Y-%m', 'now')`
  }

  const entradas = await db.prepare(`
    SELECT COALESCE(SUM(valor),0) as total
    FROM transacoes
    WHERE tipo='entrada' ${filtroData}
  `).first() as any

  const saidas = await db.prepare(`
    SELECT COALESCE(SUM(valor),0) as total
    FROM transacoes
    WHERE tipo='saida' ${filtroData}
  `).first() as any

  const { results: porCategoria } = await db.prepare(`
    SELECT categoria, tipo, COALESCE(SUM(valor),0) as total
    FROM transacoes
    WHERE 1=1 ${filtroData}
    GROUP BY categoria, tipo
    ORDER BY total DESC
  `).all()

  return c.json({
    entradas: entradas?.total || 0,
    saidas: saidas?.total || 0,
    saldo: (entradas?.total || 0) - (saidas?.total || 0),
    porCategoria
  })
})

// 🔹 LISTAR TRANSAÇÕES
financeiro.get('/transacoes', async (c) => {
  const db = c.env.DB
  const { tipo, categoria, data_inicio, data_fim, limit } = c.req.query()

  let q = `
    SELECT t.*, u.nome as usuario_nome
    FROM transacoes t
    LEFT JOIN usuarios u ON t.usuario_id = u.id
    WHERE 1=1
  `

  const p: any[] = []

  if (tipo) {
    q += ' AND t.tipo = ?'
    p.push(tipo)
  }

  if (categoria) {
    q += ' AND t.categoria = ?'
    p.push(categoria)
  }

  if (data_inicio) {
    q += ' AND DATE(t.data_transacao) >= ?'
    p.push(data_inicio)
  }

  if (data_fim) {
    q += ' AND DATE(t.data_transacao) <= ?'
    p.push(data_fim)
  }

  const limite = limit ? Math.min(parseInt(limit), 500) : 200

  q += ` ORDER BY t.data_transacao DESC LIMIT ${limite}`

  const { results } = await db.prepare(q).bind(...p).all()

  return c.json(results)
})

// 🔥 CRIAR TRANSAÇÃO
financeiro.post('/transacoes', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()

  if (!d.tipo || !d.valor) {
    return c.json({ error: 'Tipo e valor são obrigatórios' }, 400)
  }

  const r = await db.prepare(`
    INSERT INTO transacoes (
      tipo,
      categoria,
      descricao,
      valor,
      data_transacao,
      usuario_id,
      comprovante_base64
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    d.tipo,
    d.categoria || 'geral',
    d.descricao || null,
    d.valor,
    d.data_transacao || new Date().toISOString(),
    d.usuario_id || null,
    d.comprovante_base64 || null
  ).run()

  return c.json({ success: true, id: r.meta.last_row_id })
})

// 🔹 RELATÓRIO MENSAL
financeiro.get('/relatorio/mensal', async (c) => {
  const db = c.env.DB
  const { ano } = c.req.query()

  const anoAtual = ano || new Date().getFullYear().toString()

  const { results } = await db.prepare(`
    SELECT strftime('%m', data_transacao) as mes,
      SUM(CASE WHEN tipo='entrada' THEN valor ELSE 0 END) as entradas,
      SUM(CASE WHEN tipo='saida' THEN valor ELSE 0 END) as saidas,
      SUM(CASE WHEN tipo='entrada' THEN valor ELSE -valor END) as lucro
    FROM transacoes
    WHERE strftime('%Y', data_transacao) = ?
    GROUP BY mes
    ORDER BY mes
  `).bind(anoAtual).all()

  return c.json(results)
})

// 🔹 RELATÓRIO GERAL (DASHBOARD)
financeiro.get('/relatorio/geral', async (c) => {
  const db = c.env.DB

  const totalClientes = await db.prepare('SELECT COUNT(*) as total FROM clientes').first() as any
  const clientesAtivos = await db.prepare("SELECT COUNT(*) as total FROM clientes WHERE status='ativo'").first() as any
  const totalConsultas = await db.prepare('SELECT COUNT(*) as total FROM consultas').first() as any
  const totalTrabalhos = await db.prepare('SELECT COUNT(*) as total FROM trabalhos').first() as any

  const receitaTotal = await db.prepare(`
    SELECT COALESCE(SUM(valor),0) as total
    FROM transacoes
    WHERE tipo='entrada'
  `).first() as any

  const despesasTotal = await db.prepare(`
    SELECT COALESCE(SUM(valor),0) as total
    FROM transacoes
    WHERE tipo='saida'
  `).first() as any

  const fechamentos = await db.prepare(`
    SELECT COUNT(*) as total
    FROM consultas
    WHERE status_atendimento='realizado'
  `).first() as any

  const taxaFechamento = totalConsultas?.total
    ? Math.round((fechamentos?.total / totalConsultas.total) * 100)
    : 0

  return c.json({
    totalClientes: totalClientes?.total || 0,
    clientesAtivos: clientesAtivos?.total || 0,
    totalConsultas: totalConsultas?.total || 0,
    totalTrabalhos: totalTrabalhos?.total || 0,
    receitaTotal: receitaTotal?.total || 0,
    despesasTotal: despesasTotal?.total || 0,
    lucroLiquido: (receitaTotal?.total || 0) - (despesasTotal?.total || 0),
    taxaFechamento
  })
})

export { financeiro as financeiroRoutes }