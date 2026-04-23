import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { clientesRoutes } from './routes/clientes'
import { consultasRoutes } from './routes/consultas'
import { trabalhosRoutes } from './routes/trabalhos'
import { estoqueRoutes } from './routes/estoque'
import { financeiroRoutes } from './routes/financeiro'
import { equipeRoutes } from './routes/equipe'
import { marketingRoutes } from './routes/marketing'
import { configRoutes } from './routes/config'

type Bindings = {
  DB?: D1Database
  CACHE?: KVNamespace
  STORAGE?: R2Bucket
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', logger())
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

app.get('/health', (c) => c.json({ status: 'ok', app: 'Alafia', timestamp: Date.now() }))

// Rotas públicas (sem autenticação)
app.route('/auth', authRoutes)

// Cadastro público de clientes (link inteligente)
app.route('/publico/clientes', clientesRoutes)

// Rotas protegidas
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Autenticação necessária' }, 401)
  await next()
})

app.route('/api/clientes', clientesRoutes)
app.route('/api/consultas', consultasRoutes)
app.route('/api/trabalhos', trabalhosRoutes)
app.route('/api/estoque', estoqueRoutes)
app.route('/api/financeiro', financeiroRoutes)
app.route('/api/equipe', equipeRoutes)
app.route('/api/marketing', marketingRoutes)
app.route('/api/config', configRoutes)

export default app
