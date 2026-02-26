import Dexie, { type Table } from 'dexie'
import type { TreeNode } from '@prompttree/shared'

/**
 * 本地节点（带脏标记）
 */
export interface LocalNode extends TreeNode {
  _dirty: boolean       // 是否有未同步的修改
  _pendingSync: boolean // 是否正在同步中
}

/**
 * 元数据存储
 */
export interface MetaRecord {
  key: string
  value: any
}

/**
 * PromptTree 本地数据库
 */
export class PromptTreeDB extends Dexie {
  nodes!: Table<LocalNode, string>
  meta!: Table<MetaRecord, string>

  constructor() {
    super('prompttree')
    
    this.version(1).stores({
      // 主键: id, 索引: parentId, type, isFavorite, updatedAt
      nodes: 'id, parentId, type, isFavorite, updatedAt, _dirty',
      // 键值对存储
      meta: 'key'
    })
  }
}

// 单例数据库实例
export const db = new PromptTreeDB()

// 元数据 key 常量
export const META_KEYS = {
  LAST_SYNC_TIME: 'lastSyncTime',
  ACCESS_TOKEN: 'accessToken',
  USER: 'user'
} as const
