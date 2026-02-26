import { create } from 'zustand'
import type { TreeNode } from '@prompttree/shared'
import { createSyncRequest, processSyncResponse } from '@prompttree/shared'
import * as dbOps from '../db/operations'
import { META_KEYS } from '../db/index'
import { apiClient } from '../api/client'
import { useTreeStore } from './tree'

// ===================
// 类型定义
// ===================

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success'

interface SyncState {
  isSyncing: boolean
  lastSyncTime: number
  syncStatus: SyncStatus
  errorMessage: string | null
}

interface SyncActions {
  /** 增量同步 */
  triggerSync: () => Promise<void>
  /** 全量同步（首次登录 / 清除缓存后） */
  fullSync: () => Promise<void>
  /** 设置同步状态 */
  setSyncStatus: (status: SyncStatus) => void
  /** 从本地存储恢复 lastSyncTime */
  restoreSyncTime: () => void
}

// ===================
// 防抖定时器
// ===================
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null

// ===================
// Store
// ===================

export const useSyncStore = create<SyncState & SyncActions>((set, get) => ({
  // ===================
  // State
  // ===================
  isSyncing: false,
  lastSyncTime: 0,
  syncStatus: 'idle',
  errorMessage: null,

  // ===================
  // Actions
  // ===================

  /** 增量同步 */
  triggerSync: async () => {
    const { isSyncing } = get()
    if (isSyncing) return

    set({ isSyncing: true, syncStatus: 'syncing', errorMessage: null })

    try {
      // 1. 读取脏数据
      const dirtyNodes = dbOps.getDirtyNodes()
      const allNodes = dbOps.getAllNodes()
      const lastSyncTime = get().lastSyncTime

      // 2. 构建同步请求
      const syncRequest = createSyncRequest(
        dirtyNodes.length > 0 ? allNodes : [],
        lastSyncTime
      )

      // 3. 如果没有变更且 lastSyncTime > 0，仍然请求服务端变更
      const response = await apiClient.sync(syncRequest)

      if (!response.success || !response.data) {
        throw new Error(response.error || '同步失败')
      }

      // 4. 合并服务端变更
      const { nodes: mergedNodes, newSyncTime } = processSyncResponse(
        allNodes,
        response.data
      )

      // 5. 写回 SQLite
      if (response.data.changes.length > 0) {
        const serverNodeIds = response.data.changes
          .filter(c => c.action === 'upsert' && c.data)
          .map(c => c.data!)
        dbOps.upsertNodes(serverNodeIds, false)
      }

      // 6. 清除脏标记
      if (dirtyNodes.length > 0) {
        dbOps.clearDirtyFlags(dirtyNodes.map(n => n.id))
      }

      // 7. 更新 lastSyncTime
      const serverTime = newSyncTime
      dbOps.setMetaValue(META_KEYS.LAST_SYNC_TIME, String(serverTime))

      set({
        lastSyncTime: serverTime,
        isSyncing: false,
        syncStatus: 'success',
      })

      // 8. 刷新树状态
      useTreeStore.getState().loadNodes()
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败'
      console.error('同步失败:', message)
      set({
        isSyncing: false,
        syncStatus: 'error',
        errorMessage: message,
      })
    }
  },

  /** 全量同步 */
  fullSync: async () => {
    const { isSyncing } = get()
    if (isSyncing) return

    set({ isSyncing: true, syncStatus: 'syncing', errorMessage: null })

    try {
      const response = await apiClient.fullSync()

      if (!response.success || !response.data) {
        throw new Error(response.error || '全量同步失败')
      }

      // 清空本地节点，写入服务端数据
      dbOps.clearAllNodes()

      const serverNodes = response.data.changes
        .filter(c => c.action === 'upsert' && c.data)
        .map(c => c.data!)

      if (serverNodes.length > 0) {
        dbOps.upsertNodes(serverNodes, false)
      }

      // 更新 lastSyncTime
      const serverTime = response.data.serverTime
      dbOps.setMetaValue(META_KEYS.LAST_SYNC_TIME, String(serverTime))

      set({
        lastSyncTime: serverTime,
        isSyncing: false,
        syncStatus: 'success',
      })

      // 刷新树状态
      useTreeStore.getState().loadNodes()
    } catch (error) {
      const message = error instanceof Error ? error.message : '全量同步失败'
      console.error('全量同步失败:', message)
      set({
        isSyncing: false,
        syncStatus: 'error',
        errorMessage: message,
      })
    }
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  /** 从本地存储恢复 lastSyncTime */
  restoreSyncTime: () => {
    const timeStr = dbOps.getMetaValue(META_KEYS.LAST_SYNC_TIME)
    if (timeStr) {
      set({ lastSyncTime: Number(timeStr) })
    }
  },
}))

// ===================
// 防抖同步触发器
// ===================

/**
 * 节点变更后调用，防抖 3 秒触发同步
 */
export function scheduleDebouncedSync(): void {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer)
  }
  syncDebounceTimer = setTimeout(() => {
    useSyncStore.getState().triggerSync()
  }, 3000)
}
