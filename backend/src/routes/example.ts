import { Hono } from 'hono'

const exampleRoutes = new Hono()

// GET /api/hello
exampleRoutes.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Nxcode!',
    timestamp: Date.now()
  })
})

// POST /api/echo
exampleRoutes.post('/echo', async (c) => {
  const body = await c.req.json()
  return c.json({
    received: body,
    timestamp: Date.now()
  })
})

export { exampleRoutes }
