// ========================================
// 核心类型定义
// ========================================

/** 节点类型 */
export type NodeType = 'folder' | 'prompt'

/** 树节点（扁平存储） */
export interface TreeNode {
  id: string
  parentId: string | null
  type: NodeType
  title: string
  content: string           // Prompt 内容，文件夹为空
  isFavorite: boolean
  sortOrder: number
  collapsed: boolean        // 折叠状态
  createdAt: number         // Unix timestamp
  updatedAt: number
  deletedAt: number | null  // 软删除
  version: number           // 乐观锁版本
}

/** 带子节点的树节点（UI 渲染用） */
export interface TreeNodeWithChildren extends TreeNode {
  children: TreeNodeWithChildren[]
}

/** 用户信息 */
export interface User {
  id: string
  email: string
  displayName: string | null
  createdAt: number
  lastSyncAt: number
}

// ========================================
// 同步相关类型
// ========================================

/** 同步变更动作 */
export type SyncAction = 'upsert' | 'delete'

/** 单个变更项 */
export interface SyncChange {
  id: string
  action: SyncAction
  data?: TreeNode
}

/** 同步请求 */
export interface SyncRequest {
  lastSyncTime: number
  changes: SyncChange[]
}

/** 同步响应 */
export interface SyncResponse {
  serverTime: number
  changes: SyncChange[]
  conflicts?: SyncConflict[]
}

/** 同步冲突 */
export interface SyncConflict {
  nodeId: string
  localVersion: TreeNode
  serverVersion: TreeNode
}

// ========================================
// API 相关类型
// ========================================

/** API 响应包装 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/** 认证 Token */
export interface AuthTokens {
  accessToken: string
  expiresAt: number
}
