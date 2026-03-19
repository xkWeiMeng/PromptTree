import { Hono } from 'hono'
import * as adminRepo from '../db/admin'

const admin = new Hono()

// ===================
// 总览统计
// ===================

admin.get('/stats/overview', (c) => {
  try {
    const stats = adminRepo.getOverviewStats()
    return c.json({ success: true, data: stats })
  } catch (error) {
    console.error('Admin stats overview error:', error)
    return c.json({ error: 'Failed to get stats' }, 500)
  }
})

// ===================
// 每日趋势
// ===================

admin.get('/stats/daily', (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30', 10)
    const safeDays = Math.min(Math.max(days, 1), 365)
    const stats = adminRepo.getDailyStats(safeDays)
    return c.json({ success: true, data: stats })
  } catch (error) {
    console.error('Admin daily stats error:', error)
    return c.json({ error: 'Failed to get daily stats' }, 500)
  }
})

// ===================
// 用户列表
// ===================

admin.get('/users', (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10)
    const pageSize = parseInt(c.req.query('pageSize') || '20', 10)
    const search = c.req.query('search') || ''

    const safePage = Math.max(page, 1)
    const safePageSize = Math.min(Math.max(pageSize, 1), 100)

    const { users, total } = adminRepo.getUsers(safePage, safePageSize, search)
    return c.json({
      success: true,
      data: {
        users,
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.ceil(total / safePageSize),
      }
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return c.json({ error: 'Failed to get users' }, 500)
  }
})

// ===================
// 指定用户节点
// ===================

admin.get('/users/:id/nodes', (c) => {
  try {
    const userId = c.req.param('id')
    const nodes = adminRepo.getUserNodes(userId)
    return c.json({ success: true, data: nodes })
  } catch (error) {
    console.error('Admin user nodes error:', error)
    return c.json({ error: 'Failed to get user nodes' }, 500)
  }
})

// ===================
// 最近内容
// ===================

admin.get('/content/recent', (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50', 10)
    const safeLimit = Math.min(Math.max(limit, 1), 200)
    const content = adminRepo.getRecentContent(safeLimit)
    return c.json({ success: true, data: content })
  } catch (error) {
    console.error('Admin recent content error:', error)
    return c.json({ error: 'Failed to get recent content' }, 500)
  }
})

export default admin
