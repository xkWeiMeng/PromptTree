import { createApiClient, computeLocalChanges, processSyncResponse } from '@prompttree/shared'
import {
  getNodes,
  setNodes,
  getDirtyNodes,
  markPendingSync,
  clearDirty,
  getAccessToken,
  getLastSyncTime,
  setLastSyncTime,
  getApiBaseUrl,
  getOfflineMode,
  type LocalNode
} from '@/utils/storage'

const ALARM_SYNC = 'prompttree-sync'
const SYNC_INTERVAL_MINUTES = 5

export default defineBackground(() => {
  console.log('[PromptTree] background script loaded')

  // =================== 定时同步 (chrome.alarms) ===================
  browser.alarms.create(ALARM_SYNC, { periodInMinutes: SYNC_INTERVAL_MINUTES })

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_SYNC) {
      await backgroundSync()
    }
  })

  // =================== 快捷键 ===================
  browser.commands.onCommand.addListener((command) => {
    if (command === 'open-popup') {
      // Manifest V3: action.openPopup() 仅部分浏览器支持
      // 作为回退，发消息给当前 tab 的 content script
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]?.id) {
          browser.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_QUICK_INSERT' }).catch(() => {})
        }
      })
    }
  })

  // =================== 消息处理 ===================
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'SYNC_NOW':
        backgroundSync().then((result) => {
          sendResponse(result)
          // 通知所有 popup
          broadcastMessage({ type: 'SYNC_COMPLETE', success: result.success })
        })
        return true

      case 'GET_SYNC_STATUS':
        getDirtyNodes().then((dirty) => {
          sendResponse({ pendingCount: dirty.length })
        })
        return true

      default:
        return false
    }
  })

  // =================== 安装/更新 ===================
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('[PromptTree] extension installed')
    }
  })
})

// =================== 后台同步逻辑 ===================
async function backgroundSync(): Promise<{ success: boolean; error?: string }> {
  try {
    const offlineMode = await getOfflineMode()
    if (offlineMode) return { success: true }

    const token = await getAccessToken()
    if (!token) return { success: false, error: 'not_authenticated' }

    const baseUrl = await getApiBaseUrl()
    const api = createApiClient(baseUrl, token)

    const allNodes = await getNodes()
    const dirtyNodes = allNodes.filter(n => n._dirty)
    if (dirtyNodes.length === 0) return { success: true }

    // 标记为 pendingSync
    const pendingIds = dirtyNodes.map(n => n.id)
    await markPendingSync(pendingIds)

    const lastSyncTime = await getLastSyncTime()
    const changes = computeLocalChanges(dirtyNodes.map(({ _dirty, _pendingSync, ...node }) => node))

    const response = await api.sync({
      lastSyncTime,
      changes
    })

    if (response.success && response.data) {
      // 处理服务端返回
      const currentNodes = await getNodes()
      const plainNodes = currentNodes.map(({ _dirty, _pendingSync, ...node }) => node)
      const merged = processSyncResponse(plainNodes, response.data)

      // 构建新的 LocalNode 数组
      const updatedNodes: LocalNode[] = merged.map(node => ({
        ...node,
        _dirty: false,
        _pendingSync: false
      }))

      await setNodes(updatedNodes)

      if (response.data.serverTime) {
        await setLastSyncTime(response.data.serverTime)
      }

      // 清除已同步节点的 dirty 标记
      await clearDirty(pendingIds)

      return { success: true }
    }

    return { success: false, error: response.error || 'sync_failed' }
  } catch (err) {
    console.error('[PromptTree] background sync error:', err)
    return { success: false, error: String(err) }
  }
}

// =================== 工具函数 ===================
function broadcastMessage(message: Record<string, unknown>) {
  browser.runtime.sendMessage(message).catch(() => {
    // popup 未打开时会报错，忽略
  })
}
