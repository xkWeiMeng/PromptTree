import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@prompttree/shared'
import { createApiClient } from '@prompttree/shared'
import * as storage from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {
  // ===================
  // State
  // ===================
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const isLoading = ref(true)
  const isOfflineMode = ref(false)

  // ===================
  // Getters
  // ===================
  const isLoggedIn = computed(() => !!accessToken.value && !!user.value)
  const canAccessApp = computed(() => isLoggedIn.value || isOfflineMode.value)

  // ===================
  // Actions
  // ===================

  /** 初始化认证状态（从 chrome.storage 恢复） */
  async function init() {
    isLoading.value = true
    try {
      const storedOffline = await storage.getOfflineMode()
      if (storedOffline) {
        isOfflineMode.value = true
      }

      const storedToken = await storage.getAccessToken()
      const storedUser = await storage.getUser()

      if (storedToken && storedUser) {
        accessToken.value = storedToken
        user.value = storedUser
      }
    } catch (err) {
      console.error('Failed to restore auth state:', err)
    } finally {
      isLoading.value = false
    }
  }

  /** 设置登录状态 */
  async function setAuth(token: string, userData: User) {
    accessToken.value = token
    user.value = userData

    if (isOfflineMode.value) {
      await exitOfflineMode()
    }

    await storage.setAccessToken(token)
    await storage.setUser(userData)
  }

  /** 登出 */
  async function logout() {
    accessToken.value = null
    user.value = null
    await storage.clearAllData()
  }

  /** 进入离线模式 */
  async function enterOfflineMode() {
    isOfflineMode.value = true
    await storage.setOfflineMode(true)
  }

  /** 退出离线模式 */
  async function exitOfflineMode() {
    isOfflineMode.value = false
    await storage.setOfflineMode(false)
  }

  /** 检查登录状态（验证 token） */
  async function checkAuth(): Promise<boolean> {
    if (!accessToken.value) return false

    try {
      const baseUrl = await storage.getApiBaseUrl()
      const api = createApiClient({
        baseUrl,
        getToken: () => accessToken.value,
        onUnauthorized: () => logout(),
      })

      // 使用 fetch 直接检查 /api/auth/me
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })

      if (response.ok) {
        const data = await response.json()
        user.value = data.user
        return true
      } else {
        await logout()
        return false
      }
    } catch {
      // 网络错误时不登出，可能是离线
      return false
    }
  }

  /** 发送 Magic Link */
  async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const baseUrl = await storage.getApiBaseUrl()
      const api = createApiClient({
        baseUrl,
        getToken: () => null,
      })

      const result = await api.sendMagicLink(email)
      return { success: result.success, error: result.error }
    } catch (err) {
      return { success: false, error: '网络错误，请稍后重试' }
    }
  }

  /** 验证 Magic Link Token */
  async function verifyMagicLink(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const baseUrl = await storage.getApiBaseUrl()
      const api = createApiClient({
        baseUrl,
        getToken: () => null,
      })

      const result = await api.verifyMagicLink(token)
      if (result.success && result.data) {
        // 验证成功后获取用户信息
        const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${result.data.accessToken}` },
        })
        if (meResponse.ok) {
          const meData = await meResponse.json()
          await setAuth(result.data.accessToken, meData.user)
          return { success: true }
        }
      }
      return { success: false, error: result.error || '验证失败' }
    } catch (err) {
      return { success: false, error: '网络错误，请稍后重试' }
    }
  }

  return {
    // State
    user,
    accessToken,
    isLoading,
    isOfflineMode,
    // Getters
    isLoggedIn,
    canAccessApp,
    // Actions
    init,
    setAuth,
    logout,
    enterOfflineMode,
    exitOfflineMode,
    checkAuth,
    sendMagicLink,
    verifyMagicLink,
  }
})
