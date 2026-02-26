import { db } from './index'
import type { TreeNode } from '@prompttree/shared'

// ===================
// 类型定义
// ===================

/** SQLite 行数据（所有值均为原始类型） */
interface NodeRow {
  id: string
  parentId: string | null
  type: string
  title: string
  content: string
  isFavorite: number
  sortOrder: number
  collapsed: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  version: number
  _dirty: number
}

// ===================
// 行/对象转换
// ===================

/** 将 SQLite 行转换为 TreeNode */
function rowToNode(row: NodeRow): TreeNode {
  return {
    id: row.id,
    parentId: row.parentId,
    type: row.type as 'folder' | 'prompt',
    title: row.title,
    content: row.content,
    isFavorite: row.isFavorite === 1,
    sortOrder: row.sortOrder,
    collapsed: row.collapsed === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    version: row.version,
  }
}

// ===================
// 节点查询
// ===================

/** 获取所有节点（含已删除） */
export function getAllNodes(): TreeNode[] {
  const rows = db.getAllSync('SELECT * FROM nodes') as NodeRow[]
  return rows.map(rowToNode)
}

/** 获取所有未删除的节点 */
export function getActiveNodes(): TreeNode[] {
  const rows = db.getAllSync(
    'SELECT * FROM nodes WHERE deletedAt IS NULL'
  ) as NodeRow[]
  return rows.map(rowToNode)
}

/** 获取子节点 */
export function getChildNodes(parentId: string | null): TreeNode[] {
  const rows = parentId === null
    ? db.getAllSync(
        'SELECT * FROM nodes WHERE parentId IS NULL AND deletedAt IS NULL ORDER BY sortOrder'
      ) as NodeRow[]
    : db.getAllSync(
        'SELECT * FROM nodes WHERE parentId = ? AND deletedAt IS NULL ORDER BY sortOrder',
        [parentId]
      ) as NodeRow[]
  return rows.map(rowToNode)
}

/** 获取收藏节点 */
export function getFavoriteNodes(): TreeNode[] {
  const rows = db.getAllSync(
    'SELECT * FROM nodes WHERE isFavorite = 1 AND deletedAt IS NULL ORDER BY updatedAt DESC'
  ) as NodeRow[]
  return rows.map(rowToNode)
}

/** 根据 ID 获取节点 */
export function getNodeById(id: string): TreeNode | null {
  const row = db.getFirstSync(
    'SELECT * FROM nodes WHERE id = ?',
    [id]
  ) as NodeRow | null
  return row ? rowToNode(row) : null
}

/** 获取待同步（脏）节点 */
export function getDirtyNodes(): TreeNode[] {
  const rows = db.getAllSync(
    'SELECT * FROM nodes WHERE _dirty = 1'
  ) as NodeRow[]
  return rows.map(rowToNode)
}

// ===================
// 节点写入
// ===================

/** 插入或更新节点 */
export function upsertNode(node: TreeNode, dirty = true): void {
  db.runSync(
    `INSERT OR REPLACE INTO nodes
      (id, parentId, type, title, content, isFavorite, sortOrder, collapsed, createdAt, updatedAt, deletedAt, version, _dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      node.id,
      node.parentId,
      node.type,
      node.title,
      node.content,
      node.isFavorite ? 1 : 0,
      node.sortOrder,
      node.collapsed ? 1 : 0,
      node.createdAt,
      node.updatedAt,
      node.deletedAt,
      node.version,
      dirty ? 1 : 0,
    ]
  )
}

/** 批量插入或更新节点 */
export function upsertNodes(nodes: TreeNode[], dirty = false): void {
  db.execSync('BEGIN TRANSACTION')
  try {
    for (const node of nodes) {
      upsertNode(node, dirty)
    }
    db.execSync('COMMIT')
  } catch (error) {
    db.execSync('ROLLBACK')
    throw error
  }
}

/** 软删除节点（及其所有子孙） */
export function softDeleteNode(id: string): void {
  const now = Date.now()
  // 使用递归 CTE 查找所有子孙节点
  db.runSync(
    `UPDATE nodes SET deletedAt = ?, updatedAt = ?, _dirty = 1
     WHERE id IN (
       WITH RECURSIVE descendants(id) AS (
         SELECT id FROM nodes WHERE id = ?
         UNION ALL
         SELECT n.id FROM nodes n JOIN descendants d ON n.parentId = d.id
       )
       SELECT id FROM descendants
     )`,
    [now, now, id]
  )
}

/** 清除脏标记 */
export function clearDirtyFlags(ids: string[]): void {
  if (ids.length === 0) return
  const placeholders = ids.map(() => '?').join(',')
  db.runSync(
    `UPDATE nodes SET _dirty = 0 WHERE id IN (${placeholders})`,
    ids
  )
}

/** 清空所有节点 */
export function clearAllNodes(): void {
  db.runSync('DELETE FROM nodes')
}

// ===================
// 元数据操作
// ===================

/** 读取元数据 */
export function getMetaValue(key: string): string | null {
  const row = db.getFirstSync(
    'SELECT value FROM meta WHERE key = ?',
    [key]
  ) as { value: string | null } | null
  return row?.value ?? null
}

/** 写入元数据 */
export function setMetaValue(key: string, value: string): void {
  db.runSync(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
    [key, value]
  )
}

/** 删除元数据 */
export function deleteMetaValue(key: string): void {
  db.runSync('DELETE FROM meta WHERE key = ?', [key])
}
