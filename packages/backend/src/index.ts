import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import authRoutes from './routes/auth'
import syncRoutes from './routes/sync'
import { authMiddleware } from './middleware/auth'

const app = new Hono()

// 中间件
app.use('*', logger())
app.use('*', cors())

// 健康检查
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// 路由
app.route('/api/auth', authRoutes)
app.use('/api/sync/*', authMiddleware)
app.route('/api/sync', syncRoutes)

// 启动服务
const port = parseInt(process.env.PORT || '3000')

console.log(`🚀 Server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
