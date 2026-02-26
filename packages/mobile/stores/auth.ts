import { create } from 'zustand'
import type { User } from '@prompttree/shared'
import { META_KEYS } from '../db/index'
import * as dbOps from '../db/operations'

// ===================
// 类型定义
// ===================

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoggedIn: boolean
  isLoading: boolean
}

interface AuthActions {
  /** 使用 token 登录，获取用户信息 */
  login: (token: string) => void
  /** 登出，清除本地状态 */
  logout: () => void
  /** 应用启动时从本地存储恢复认证状态 */
  checkAuth: () => void
  /** 设置用户信息 */
  setUser: (user: User) => void
}

// ===================
// Store
// ===================

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // ===================
  // State
  // ===================
  user: null,
  accessToken: null,
  isLoggedIn: false,
  isLoading: true, // 初始为 true，等 checkAuth 完成

  // ===================
  // Actions
  // ===================

  login: (token) => {
    // 持久化 token
    dbOps.setMetaValue(META_KEYS.ACCESS_TOKEN, token)

    set({
      accessToken: token,
      isLoggedIn: true,
      isLoading: false,
    })
  },

  logout: () => {
    // 清除持久化数据
    dbOps.deleteMetaValue(META_KEYS.ACCESS_TOKEN)
    dbOps.deleteMetaValue(META_KEYS.USER)

    set({
      user: null,
      accessToken: null,
      isLoggedIn: false,
      isLoading: false,
    })
  },

  checkAuth: () => {
    try {
      const token = dbOps.getMetaValue(META_KEYS.ACCESS_TOKEN)
      const userJson = dbOps.getMetaValue(META_KEYS.USER)

      if (token) {
        const user = userJson ? (JSON.parse(userJson) as User) : null
        set({
          accessToken: token,
          user,
          isLoggedIn: true,
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('恢复认证状态失败:', error)
      set({ isLoading: false })
    }
  },

  setUser: (user) => {
    // 持久化用户信息
    dbOps.setMetaValue(META_KEYS.USER, JSON.stringify(user))
    set({ user })
  },
}))
