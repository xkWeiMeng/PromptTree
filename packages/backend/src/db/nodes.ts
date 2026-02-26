import { db } from './index'
import { now } from '../utils/id'

// ===================
// 类型定义
// ===================

export interface Node {
  id: string
  user_id: string
  parent_id: string | null
  type: 'folder' | 'prompt'
  title: string
  content: string | null
  is_favorite: number // SQLite 存储为 0/1
  sort_order: number
  collapsed: number
  created_at: number
  updated_at: number
  deleted_at: number | null
  version: number
}

export interface NodeData {
  id: string
  parentId: string | null
  type: 'folder' | 'prompt'
  title: string
  content: string
  isFavorite: boolean
  sortOrder: number
  collapsed: boolean
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
}

export interface SyncNode {
  id: string
  action: 'upsert' | 'delete'
  data: NodeData
}

// ===================
// 预编译语句
// ===================

const findByUserIdStmt = db.prepare<string>(`
  SELECT * FROM nodes WHERE user_id = ? AND deleted_at IS NULL
  ORDER BY parent_id NULLS FIRST, sort_order ASC
`)

const findAllByUserIdStmt = db.prepare<string>(`
  SELECT * FROM nodes WHERE user_id = ?
  ORDER BY updated_at DESC
`)

const findByUserIdSinceStmt = db.prepare<[string, number]>(`
  SELECT * FROM nodes WHERE user_id = ? AND updated_at > ?
  ORDER BY updated_at ASC
`)

const findByIdStmt = db.prepare<[string, string]>(`
  SELECT * FROM nodes WHERE id = ? AND user_id = ?
`)

const insertStmt = db.prepare(`
  INSERT INTO nodes (
    id, user_id, parent_id, type, title, content,
    is_favorite, sort_order, collapsed,
    created_at, updated_at, deleted_at, version
  ) VALUES (
    @id, @user_id, @parent_id, @type, @title, @content,
    @is_favorite, @sort_order, @collapsed,
    @created_at, @updated_at, @deleted_at, @version
  )
`)

const updateStmt = db.prepare(`
  UPDATE nodes SET
    parent_id = @parent_id,
    type = @type,
    title = @title,
    content = @content,
    is_favorite = @is_favorite,
    sort_order = @sort_order,
    collapsed = @collapsed,
    updated_at = @updated_at,
    deleted_at = @deleted_at,
    version = @version
  WHERE id = @id AND user_id = @user_id
`)

const softDeleteStmt = db.prepare<[number, number, string, string]>(`
  UPDATE nodes SET deleted_at = ?, updated_at = ?, version = version + 1
  WHERE id = ? AND user_id = ?
`)

// ===================
// Repository 函数
// ===================

/**
 * 获取用户所有未删除的节点
 */
export function findByUserId(userId: string): Node[] {
  return findByUserIdStmt.all(userId) as Node[]
}

/**
 * 获取用户所有节点（包括已删除）
 */
export function findAllByUserId(userId: string): Node[] {
  return findAllByUserIdStmt.all(userId) as Node[]
}

/**
 * 获取指定时间后更新的节点
 */
export function findByUserIdSince(userId: string, since: number): Node[] {
  return findByUserIdSinceStmt.all(userId, since) as Node[]
}

/**
 * 根据 ID 查找节点
 */
export function findById(nodeId: string, userId: string): Node | null {
  return findByIdStmt.get(nodeId, userId) as Node | null
}

/**
 * 插入或更新节点
 * 返回结果：upserted 表示成功，conflict 表示版本冲突
 */
export function upsert(
  userId: string, 
  data: NodeData
): { result: 'inserted' | 'updated' | 'conflict'; node: Node } {
  const existing = findById(data.id, userId)
  
  const nodeRecord = {
    id: data.id,
    user_id: userId,
    parent_id: data.parentId,
    type: data.type,
    title: data.title,
    content: data.content || null,
    is_favorite: data.isFavorite ? 1 : 0,
    sort_order: data.sortOrder,
    collapsed: data.collapsed ? 1 : 0,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
    deleted_at: data.deletedAt,
    version: data.version
  }
  
  if (!existing) {
    // 新节点，直接插入
    insertStmt.run(nodeRecord)
    return { result: 'inserted', node: findById(data.id, userId)! }
  }
  
  // 版本冲突检测：Last Write Wins
  // 如果客户端 version 更大或 updatedAt 更新，则覆盖
  if (data.updatedAt >= existing.updated_at) {
    updateStmt.run(nodeRecord)
    return { result: 'updated', node: findById(data.id, userId)! }
  }
  
  // 服务端版本更新，返回冲突
  return { result: 'conflict', node: existing }
}

/**
 * 软删除节点
 */
export function softDelete(userId: string, nodeId: string): void {
  const timestamp = now()
  softDeleteStmt.run(timestamp, timestamp, nodeId, userId)
}

/**
 * 批量同步节点
 * 返回服务端变更列表
 */
export function batchSync(
  userId: string,
  lastSyncTime: number,
  changes: { id: string; action: 'upsert' | 'delete'; data?: NodeData }[]
): { serverChanges: SyncNode[]; conflicts: SyncNode[] } {
  const conflicts: SyncNode[] = []
  
  // 在事务中处理所有变更
  const syncTransaction = db.transaction(() => {
    for (const change of changes) {
      if (change.action === 'delete') {
        softDelete(userId, change.id)
      } else if (change.action === 'upsert' && change.data) {
        const result = upsert(userId, change.data)
        if (result.result === 'conflict') {
          conflicts.push({
            id: result.node.id,
            action: 'upsert',
            data: nodeToData(result.node)
          })
        }
      }
    }
  })
  
  syncTransaction()
  
  // 获取服务端自 lastSyncTime 以来的变更
  const serverNodes = findByUserIdSince(userId, lastSyncTime)
  const serverChanges: SyncNode[] = serverNodes.map(node => ({
    id: node.id,
    action: node.deleted_at ? 'delete' : 'upsert',
    data: nodeToData(node)
  }))
  
  return { serverChanges, conflicts }
}

/**
 * 将数据库节点转换为 API 格式
 */
export function nodeToData(node: Node): NodeData {
  return {
    id: node.id,
    parentId: node.parent_id,
    type: node.type,
    title: node.title,
    content: node.content || '',
    isFavorite: node.is_favorite === 1,
    sortOrder: node.sort_order,
    collapsed: node.collapsed === 1,
    createdAt: node.created_at,
    updatedAt: node.updated_at,
    deletedAt: node.deleted_at,
    version: node.version
  }
}

/**
 * 获取全量节点数据（用于全量同步）
 */
export function getFullSync(userId: string): NodeData[] {
  const nodes = findByUserId(userId)
  return nodes.map(nodeToData)
}
