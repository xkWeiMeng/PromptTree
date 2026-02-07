import { Hono } from 'hono'

const sync = new Hono()

// POST /api/sync - 增量同步
sync.post('/', async (c) => {
  // TODO: 实现同步逻辑
  return c.json({ serverTime: Date.now(), changes: [] })
})

// GET /api/sync/full - 全量拉取
sync.get('/full', async (c) => {
  // TODO: 实现全量拉取
  return c.json({ serverTime: Date.now(), changes: [] })
})

export default sync
