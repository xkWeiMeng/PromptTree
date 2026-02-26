import { watch, onMounted, onUnmounted } from 'vue'
import { useTreeStore } from '@/stores/tree'
import { useSyncStore } from '@/stores/sync'
import { useAuthStore } from '@/stores/auth'
import { useToast } from './useToast'
import { useLoginModal } from './useLoginModal'
import { i18n } from '@/i18n'

// 模块级标记，防止重复弹出登录提示
let hasShownLoginHint = false

/**
 * 同步组合式函数
 * 监听数据变化并触发同步
 * 离线模式下只加载本地数据，不进行云端同步
 */
export function useSync() {
  const treeStore = useTreeStore()
  const syncStore = useSyncStore()
  const authStore = useAuthStore()
  
  // 监听节点变化，触发同步（仅登录用户）
  const stopWatch = watch(
    () => treeStore.nodes,
    () => {
      // 只有已登录用户才同步，离线模式不同步
      if (authStore.isLoggedIn && !authStore.isOfflineMode) {
        syncStore.triggerSync()
      }
    },
    { deep: true }
  )
  
  // 定期同步（每5分钟，仅登录用户）
  let syncInterval: ReturnType<typeof setInterval> | null = null
  let loginHintTimer: ReturnType<typeof setTimeout> | null = null
  
  onMounted(() => {
    // 加载本地数据（登录用户和离线模式都需要）
    if (authStore.canAccessApp) {
      treeStore.loadFromDB()
    }
    
    // 只有登录用户才进行云端同步
    if (authStore.isLoggedIn && !authStore.isOfflineMode) {
      syncStore.fullSync()
      
      // 设置定期同步
      syncInterval = setInterval(() => {
        if (authStore.isLoggedIn && !authStore.isOfflineMode) {
          syncStore.triggerSync()
        }
      }, 5 * 60 * 1000)
    }

    // 游客延迟 10 秒提示登录
    if (authStore.isOfflineMode && !authStore.isLoggedIn && !hasShownLoginHint) {
      loginHintTimer = setTimeout(() => {
        // 再次检查，避免用户在这 10 秒内已登录
        if (!authStore.isLoggedIn && !hasShownLoginHint) {
          hasShownLoginHint = true
          const toast = useToast()
          const loginModal = useLoginModal()
          toast.showWithAction(
            i18n.global.t('sync.loginHint'),
            'info',
            i18n.global.t('sync.goLogin'),
            () => loginModal.open(),
            0 // 不自动消失
          )
        }
      }, 10 * 1000)
    }
  })
  
  onUnmounted(() => {
    stopWatch()
    if (syncInterval) {
      clearInterval(syncInterval)
    }
    if (loginHintTimer) {
      clearTimeout(loginHintTimer)
    }
  })
  
  return {
    sync: () => syncStore.sync(),
    fullSync: () => syncStore.fullSync(),
    status: syncStore.status
  }
}
