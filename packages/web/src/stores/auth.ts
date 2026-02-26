import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@prompttree/shared'
import { getMetaValue, setMetaValue, clearAllData } from '@/db/operations'
import { META_KEYS } from '@/db'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // ===================
  // State
  // ===================
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const isLoading = ref(true)
  const isOfflineMode = ref(false)  // 离线模式

  // ===================
  // Getters
  // ===================
  const isLoggedIn = computed(() => !!accessToken.value && !!user.value)
  
  /** 是否可以访问应用（已登录或离线模式） */
  const canAccessApp = computed(() => isLoggedIn.value || isOfflineMode.value)

  // ===================
  // Actions
  // ===================

  /**
   * 初始化认证状态（从本地存储恢复）
   */
  async function init() {
    isLoading.value = true
    try {
      // 恢复离线模式状态
      const storedOfflineMode = await getMetaValue<boolean>('offlineMode')
      if (storedOfflineMode) {
        isOfflineMode.value = true
      }
      
      const storedToken = await getMetaValue<string>(META_KEYS.ACCESS_TOKEN)
      const storedUser = await getMetaValue<User>(META_KEYS.USER)
      
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

  /**
   * 进入离线模式
   */
  async function enterOfflineMode() {
    isOfflineMode.value = true
    await setMetaValue('offlineMode', true)
  }

  /**
   * 退出离线模式（登录后调用）
   */
  async function exitOfflineMode() {
    isOfflineMode.value = false
    await setMetaValue('offlineMode', false)
  }

  /**
   * 设置登录状态
   */
  async function setAuth(token: string, userData: User) {
    accessToken.value = token
    user.value = userData
    
    // 退出离线模式
    if (isOfflineMode.value) {
      await exitOfflineMode()
    }
    
    // 持久化
    await setMetaValue(META_KEYS.ACCESS_TOKEN, token)
    await setMetaValue(META_KEYS.USER, userData)
  }

  /**
   * 登出
   */
  async function logout() {
    accessToken.value = null
    user.value = null
    
    // 清除所有本地数据
    await clearAllData()
  }

  /**
   * 从 URL 处理 OAuth 回调的 token
   */
  async function handleTokenFromUrl(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      // 清除 URL 中的 token
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
      
      return handleToken(token)
    }
    
    return false
  }

  /**
   * 用 token 验证并设置登录状态（通用方法，供 URL 回调和 popup 复用）
   */
  async function handleToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        await setAuth(token, data.user)
        return true
      }
    } catch (err) {
      console.error('Failed to verify token:', err)
    }
    return false
  }

  /**
   * 检查登录状态（可用于刷新时验证 token）
   */
  async function checkAuth(): Promise<boolean> {
    if (!accessToken.value) return false
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${accessToken.value}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        user.value = data.user
        await setMetaValue(META_KEYS.USER, data.user)
        return true
      } else {
        // Token 无效，清除状态
        await logout()
        return false
      }
    } catch (err) {
      console.error('Failed to check auth:', err)
      return false
    }
  }

  /**
   * 更新用户资料（昵称/头像）
   */
  async function updateProfile(data: { displayName?: string; avatarUrl?: string | null }): Promise<boolean> {
    try {
      const res = await authApi.updateProfile(data)
      if (res.success && res.user) {
        user.value = res.user
        await setMetaValue(META_KEYS.USER, res.user)
        return true
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
    return false
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
    handleTokenFromUrl,
    handleToken,
    checkAuth,
    updateProfile,
    enterOfflineMode,
    exitOfflineMode
  }
})
