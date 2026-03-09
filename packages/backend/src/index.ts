import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import authRoutes from './routes/auth'
import syncRoutes from './routes/sync'
import shareRoutes from './routes/share'
import promptsRoutes from './routes/prompts'
import { authMiddleware, jwtOnlyMiddleware } from './middleware/auth'
import { errorHandler, notFoundHandler } from './middleware/error'

const app = new Hono()

// 全局中间件
app.use('*', errorHandler)
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://prompttree.tech', 'https://www.prompttree.tech'],
  credentials: true
}))

// 健康检查
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

// 需要 JWT 的用户信息接口（必须在 route 注册之前，确保中间件先执行）
app.use('/api/auth/me', jwtOnlyMiddleware)

// 认证路由（公开路由 + 受保护的 /me）
app.route('/api/auth', authRoutes)

// 同步路由（仅允许 JWT）
app.use('/api/sync/*', jwtOnlyMiddleware)
app.route('/api/sync', syncRoutes)

// Prompt/文件夹开放接口（支持 JWT 或 API Key）
app.use('/api/prompts', authMiddleware)
app.use('/api/prompts/*', authMiddleware)
app.use('/api/folders', authMiddleware)
app.use('/api/folders/*', authMiddleware)
app.route('/api', promptsRoutes)

// 分享路由（公开访问 + 私有接口）
app.route('/api/share', shareRoutes)

// 404 处理
app.notFound(notFoundHandler)

// 启动服务
const port = parseInt(process.env.PORT || '3000')

console.log('')
console.log('🚀 PromptTree Backend')
console.log(`   Server: http://localhost:${port}`)
console.log(`   Health: http://localhost:${port}/api/health`)
console.log('')

serve({
  fetch: app.fetch,
  port
})
