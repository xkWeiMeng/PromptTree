import { Hono } from 'hono'
import { validateSyncPayload } from '../utils/validation'
import { now } from '../utils/id'
import * as nodesRepo from '../db/nodes'
import * as usersRepo from '../db/users'

const sync = new Hono()

// ===================
// 增量同步
// ===================

sync.post('/', async (c) => {
  const userId = c.get('userId') as string
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const body = await c.req.json()
  const validation = validateSyncPayload(body)
  
  if (!validation.success) {
    return c.json({ error: validation.error }, 400)
  }
  
  const { lastSyncTime, changes } = validation.data!
  
  try {
    // 批量同步处理
    const { serverChanges, conflicts } = nodesRepo.batchSync(userId, lastSyncTime, changes)
    
    // 更新用户最后同步时间
    const serverTime = now()
    usersRepo.updateLastSync(userId, serverTime)
    
    return c.json({
      success: true,
      serverTime,
      changes: serverChanges,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    })
  } catch (error) {
    console.error('Sync error:', error)
    return c.json({ error: 'Sync failed' }, 500)
  }
})

// ===================
// 全量同步
// ===================

sync.get('/full', async (c) => {
  const userId = c.get('userId') as string
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    // 获取所有节点
    const nodes = nodesRepo.getFullSync(userId)
    
    // 更新用户最后同步时间
    const serverTime = now()
    usersRepo.updateLastSync(userId, serverTime)
    
    return c.json({
      success: true,
      serverTime,
      nodes
    })
  } catch (error) {
    console.error('Full sync error:', error)
    return c.json({ error: 'Full sync failed' }, 500)
  }
})

// ===================
// 单节点操作（可选 API）
// ===================

// 创建节点
sync.post('/node', async (c) => {
  const userId = c.get('userId') as string
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const data = await c.req.json()
  
  try {
    const result = nodesRepo.upsert(userId, data)
    
    return c.json({
      success: true,
      node: result.node,
      result: result.result
    })
  } catch (error) {
    console.error('Create node error:', error)
    return c.json({ error: 'Create node failed' }, 500)
  }
})

// 删除节点
sync.delete('/node/:id', async (c) => {
  const userId = c.get('userId') as string
  const nodeId = c.req.param('id')
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    nodesRepo.softDelete(userId, nodeId)
    
    return c.json({
      success: true
    })
  } catch (error) {
    console.error('Delete node error:', error)
    return c.json({ error: 'Delete node failed' }, 500)
  }
})

export default sync
