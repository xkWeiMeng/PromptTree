import { db } from './index'
import { generateId, generateToken, now } from '../utils/id'
import * as nodesRepo from './nodes'

// ===================
// 类型定义
// ===================

export interface Share {
  id: string
  user_id: string
  node_id: string
  node_type: 'folder' | 'prompt'
  token: string
  is_active: number
  created_at: number
  updated_at: number
}

export interface ShareStats {
  readerCount: number
  readCount: number
}

export interface ShareContent {
  type: 'folder' | 'prompt'
  root: nodesRepo.NodeData
  nodes: nodesRepo.NodeData[]
}

// ===================
// 预编译语句
// ===================

const findByIdForUserStmt = db.prepare<[string, string]>(`
  SELECT * FROM shares
  WHERE id = ? AND user_id = ?
`)

const findActiveByUserNodeStmt = db.prepare<[string, string]>(`
  SELECT * FROM shares
  WHERE user_id = ? AND node_id = ? AND is_active = 1
  ORDER BY created_at DESC
  LIMIT 1
`)

const findActiveByTokenStmt = db.prepare<string>(`
  SELECT * FROM shares
  WHERE token = ? AND is_active = 1
  LIMIT 1
`)

const insertStmt = db.prepare(`
  INSERT INTO shares (
    id, user_id, node_id, node_type, token, is_active, created_at, updated_at
  ) VALUES (
    @id, @user_id, @node_id, @node_type, @token, @is_active, @created_at, @updated_at
  )
`)

const deactivateStmt = db.prepare<[number, number, string, string]>(`
  UPDATE shares
  SET is_active = ?, updated_at = ?
  WHERE id = ? AND user_id = ?
`)

const upsertReadStmt = db.prepare(`
  INSERT INTO share_reads (
    id, share_id, visitor_id, first_read_at, last_read_at, read_count
  ) VALUES (
    @id, @share_id, @visitor_id, @first_read_at, @last_read_at, 1
  )
  ON CONFLICT(share_id, visitor_id) DO UPDATE SET
    last_read_at = excluded.last_read_at,
    read_count = share_reads.read_count + 1
`)

const statsStmt = db.prepare<string>(`
  SELECT
    COUNT(*) AS reader_count,
    COALESCE(SUM(read_count), 0) AS read_count
  FROM share_reads
  WHERE share_id = ?
`)

// ===================
// Repository 函数
// ===================

/**
 * 查找用户在指定节点上的激活分享
 */
export function findActiveByUserAndNode(userId: string, nodeId: string): Share | null {
  return findActiveByUserNodeStmt.get(userId, nodeId) as Share | null
}

/**
 * 查找用户的指定分享
 */
export function findByIdForUser(userId: string, shareId: string): Share | null {
  return findByIdForUserStmt.get(shareId, userId) as Share | null
}

/**
 * 按 token 查找公开分享
 */
export function findActiveByToken(token: string): Share | null {
  return findActiveByTokenStmt.get(token) as Share | null
}

/**
 * 创建分享
 */
export function create(userId: string, nodeId: string, nodeType: 'folder' | 'prompt'): Share {
  const timestamp = now()

  // 令牌唯一约束冲突时重试
  for (let i = 0; i < 5; i++) {
    const share = {
      id: generateId(),
      user_id: userId,
      node_id: nodeId,
      node_type: nodeType,
      token: generateToken(16),
      is_active: 1,
      created_at: timestamp,
      updated_at: timestamp
    }

    try {
      insertStmt.run(share)
      return findByIdForUser(userId, share.id)!
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (!message.includes('shares.token')) {
        throw error
      }
    }
  }

  throw new Error('Failed to generate unique share token')
}

/**
 * 取消分享
 */
export function deactivate(userId: string, shareId: string): boolean {
  const timestamp = now()
  const result = deactivateStmt.run(0, timestamp, shareId, userId)
  return result.changes > 0
}

/**
 * 记录阅读行为
 */
export function recordRead(shareId: string, visitorId: string): void {
  const timestamp = now()

  upsertReadStmt.run({
    id: generateId(),
    share_id: shareId,
    visitor_id: visitorId,
    first_read_at: timestamp,
    last_read_at: timestamp
  })
}

/**
 * 获取分享统计
 */
export function getStats(shareId: string): ShareStats {
  const row = statsStmt.get(shareId) as { reader_count: number; read_count: number } | undefined

  return {
    readerCount: row?.reader_count ?? 0,
    readCount: row?.read_count ?? 0
  }
}

/**
 * 获取分享内容（实时模式）
 */
export function getContent(share: Share): ShareContent | null {
  const rootNode = nodesRepo.findById(share.node_id, share.user_id)
  if (!rootNode || rootNode.deleted_at !== null) {
    return null
  }

  const root = nodesRepo.nodeToData(rootNode)

  if (share.node_type === 'prompt') {
    return {
      type: 'prompt',
      root,
      nodes: [root]
    }
  }

  const allNodes = nodesRepo.findByUserId(share.user_id)
  const includedIds = new Set<string>([rootNode.id])
  let hasNewDescendant = true

  while (hasNewDescendant) {
    hasNewDescendant = false
    for (const node of allNodes) {
      if (node.parent_id && includedIds.has(node.parent_id) && !includedIds.has(node.id)) {
        includedIds.add(node.id)
        hasNewDescendant = true
      }
    }
  }

  const nodes = allNodes
    .filter((node) => includedIds.has(node.id))
    .map(nodesRepo.nodeToData)

  return {
    type: 'folder',
    root,
    nodes
  }
}
