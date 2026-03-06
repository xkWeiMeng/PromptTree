import { Hono } from 'hono'
import type { Context } from 'hono'
import { verifyJWT } from '../utils/jwt'
import * as nodesRepo from '../db/nodes'
import * as sharesRepo from '../db/shares'

const share = new Hono()

function getFrontendBaseUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:5173'
}

function toShareResponse(data: sharesRepo.Share) {
  return {
    id: data.id,
    nodeId: data.node_id,
    nodeType: data.node_type,
    token: data.token,
    link: `${getFrontendBaseUrl()}/share/${data.token}`,
    isActive: data.is_active === 1,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

async function getUserIdFromAuthHeader(c: Context): Promise<string | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const payload = await verifyJWT(token)
    return payload.userId
  } catch {
    return null
  }
}

function getVisitorId(c: Context): string {
  const queryVisitorId = c.req.query('vid')?.trim()
  if (queryVisitorId) {
    return queryVisitorId.slice(0, 128)
  }

  const visitorId = c.req.header('x-visitor-id')?.trim()
  if (visitorId) {
    return visitorId.slice(0, 128)
  }

  const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || forwardedFor || 'unknown'
  const userAgent = c.req.header('user-agent') || 'unknown'

  return `${ip}:${userAgent.slice(0, 128)}`
}

// ===================
// 私有接口（需登录）
// ===================

share.post('/', async (c) => {
  const userId = await getUserIdFromAuthHeader(c)
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json().catch(() => null)
  const nodeId = body?.nodeId

  if (typeof nodeId !== 'string' || nodeId.trim().length === 0) {
    return c.json({ success: false, error: 'nodeId is required' }, 400)
  }

  const node = nodesRepo.findById(nodeId, userId)
  if (!node || node.deleted_at !== null) {
    return c.json({ success: false, error: 'Node not found or not synced' }, 404)
  }

  let currentShare = sharesRepo.findActiveByUserAndNode(userId, nodeId)
  if (!currentShare) {
    currentShare = sharesRepo.create(userId, nodeId, node.type)
  }

  const stats = sharesRepo.getStats(currentShare.id)

  return c.json({
    success: true,
    share: toShareResponse(currentShare),
    stats
  })
})

share.get('/mine/:nodeId', async (c) => {
  const userId = await getUserIdFromAuthHeader(c)
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const nodeId = c.req.param('nodeId')
  const currentShare = sharesRepo.findActiveByUserAndNode(userId, nodeId)

  if (!currentShare) {
    return c.json({
      success: true,
      share: null,
      stats: { readerCount: 0, readCount: 0 }
    })
  }

  return c.json({
    success: true,
    share: toShareResponse(currentShare),
    stats: sharesRepo.getStats(currentShare.id)
  })
})

share.delete('/:shareId', async (c) => {
  const userId = await getUserIdFromAuthHeader(c)
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const shareId = c.req.param('shareId')
  const existing = sharesRepo.findByIdForUser(userId, shareId)
  if (!existing) {
    return c.json({ success: false, error: 'Share not found' }, 404)
  }

  const success = sharesRepo.deactivate(userId, shareId)
  if (!success) {
    return c.json({ success: false, error: 'Share not found' }, 404)
  }

  return c.json({ success: true })
})

// ===================
// 公开接口（免登录）
// ===================

share.get('/public/:token', async (c) => {
  const token = c.req.param('token')
  const publicShare = sharesRepo.findActiveByToken(token)

  if (!publicShare) {
    return c.json({ success: false, error: 'Share not found' }, 404)
  }

  const content = sharesRepo.getContent(publicShare)
  if (!content) {
    return c.json({ success: false, error: 'Shared content not found' }, 404)
  }

  const visitorId = getVisitorId(c)
  sharesRepo.recordRead(publicShare.id, visitorId)

  return c.json({
    success: true,
    share: toShareResponse(publicShare),
    stats: sharesRepo.getStats(publicShare.id),
    content
  })
})

export default share
