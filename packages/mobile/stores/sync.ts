import { create } from 'zustand'
import { createSyncRequest, processSyncResponse } from '@prompttree/shared'
import * as dbOps from '../db/operations'
import { META_KEYS } from '../db/index'
import { apiClient } from '../api/client'
import { useTreeStore } from './tree'
import { useAuthStore } from './auth'

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
  /** 启动定时同步 */
  startPeriodicSync: (intervalMs?: number) => void
  /** 停止定时同步 */
  stopPeriodicSync: () => void
}

const SYNC_DEBOUNCE_MS = 2000
const DEFAULT_PERIODIC_SYNC_MS = 5 * 60 * 1000

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null
let periodicSyncTimer: ReturnType<typeof setInterval> | null = null

export const useSyncStore = create<SyncState & SyncActions>((set, get) => ({
  isSyncing: false,
  lastSyncTime: 0,
  syncStatus: 'idle',
  errorMessage: null,

  triggerSync: async () => {
    const authState = useAuthStore.getState()
    if (!authState.isLoggedIn || authState.isOfflineMode) return

    const { isSyncing } = get()
    if (isSyncing) return

    set({ isSyncing: true, syncStatus: 'syncing', errorMessage: null })

    try {
      const dirtyNodes = dbOps.getDirtyNodes()
      const allNodes = dbOps.getAllNodes()
      const lastSyncTime = get().lastSyncTime

      const syncRequest = createSyncRequest(
        dirtyNodes.length > 0 ? allNodes : [],
        lastSyncTime
      )

      const response = await apiClient.sync(syncRequest)

      if (!response.success || !response.data) {
        throw new Error(response.error || '同步失败')
      }

      const { newSyncTime } = processSyncResponse(allNodes, response.data)

      if (response.data.changes.length > 0) {
        const serverNodes = response.data.changes
          .filter(c => c.action === 'upsert' && c.data)
          .map(c => c.data!)
        dbOps.upsertNodes(serverNodes, false)
      }

      if (dirtyNodes.length > 0) {
        dbOps.clearDirtyFlags(dirtyNodes.map(n => n.id))
      }

      dbOps.setMetaValue(META_KEYS.LAST_SYNC_TIME, String(newSyncTime))

      set({
        lastSyncTime: newSyncTime,
        isSyncing: false,
        syncStatus: 'success'
      })

      useTreeStore.getState().loadNodes()
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败'
      console.error('同步失败:', message)
      set({
        isSyncing: false,
        syncStatus: 'error',
        errorMessage: message
      })
    }
  },

  fullSync: async () => {
    const authState = useAuthStore.getState()
    if (!authState.isLoggedIn || authState.isOfflineMode) return

    const { isSyncing } = get()
    if (isSyncing) return

    set({ isSyncing: true, syncStatus: 'syncing', errorMessage: null })

    try {
      const response = await apiClient.fullSync()

      if (!response.success || !response.data) {
        throw new Error(response.error || '全量同步失败')
      }

      dbOps.clearAllNodes()

      const serverNodes = response.data.changes
        .filter(c => c.action === 'upsert' && c.data)
        .map(c => c.data!)

      if (serverNodes.length > 0) {
        dbOps.upsertNodes(serverNodes, false)
      }

      const serverTime = response.data.serverTime
      dbOps.setMetaValue(META_KEYS.LAST_SYNC_TIME, String(serverTime))

      set({
        lastSyncTime: serverTime,
        isSyncing: false,
        syncStatus: 'success'
      })

      useTreeStore.getState().loadNodes()
    } catch (error) {
      const message = error instanceof Error ? error.message : '全量同步失败'
      console.error('全量同步失败:', message)
      set({
        isSyncing: false,
        syncStatus: 'error',
        errorMessage: message
      })
    }
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  restoreSyncTime: () => {
    const timeStr = dbOps.getMetaValue(META_KEYS.LAST_SYNC_TIME)
    if (!timeStr) return

    const time = Number(timeStr)
    if (!Number.isNaN(time)) {
      set({ lastSyncTime: time })
    }
  },

  startPeriodicSync: (intervalMs = DEFAULT_PERIODIC_SYNC_MS) => {
    if (periodicSyncTimer) {
      clearInterval(periodicSyncTimer)
    }

    periodicSyncTimer = setInterval(() => {
      const authState = useAuthStore.getState()
      if (authState.isLoggedIn && !authState.isOfflineMode) {
        void get().triggerSync()
      }
    }, intervalMs)
  },

  stopPeriodicSync: () => {
    if (!periodicSyncTimer) return
    clearInterval(periodicSyncTimer)
    periodicSyncTimer = null
  }
}))

/**
 * 节点变更后调用，防抖 2 秒触发同步
 */
export function scheduleDebouncedSync(): void {
  const authState = useAuthStore.getState()
  if (!authState.isLoggedIn || authState.isOfflineMode) return

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer)
  }

  syncDebounceTimer = setTimeout(() => {
    void useSyncStore.getState().triggerSync()
  }, SYNC_DEBOUNCE_MS)
}
