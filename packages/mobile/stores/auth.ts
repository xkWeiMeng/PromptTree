import { create } from 'zustand'
import type { User } from '@prompttree/shared'
import { META_KEYS } from '../db/index'
import * as dbOps from '../db/operations'
import { getApiBaseUrl } from '../api/config'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoggedIn: boolean
  isLoading: boolean
  isOfflineMode: boolean
}

interface AuthActions {
  /** 使用 token 登录并拉取用户信息 */
  login: (token: string) => Promise<boolean>
  /** 直接设置认证状态 */
  setAuth: (token: string, user: User) => void
  /** 登出并清理本地数据 */
  logout: () => void
  /** 应用启动时恢复认证状态 */
  checkAuth: () => Promise<void>
  /** 更新用户信息 */
  setUser: (user: User) => void
  /** 进入离线模式 */
  enterOfflineMode: () => void
  /** 退出离线模式 */
  exitOfflineMode: () => void
  /** 处理回调 token */
  handleToken: (token: string) => Promise<boolean>
}

interface MeResponse {
  success?: boolean
  user?: User
}

type FetchUserStatus = 'ok' | 'unauthorized' | 'error'

interface FetchUserResult {
  user: User | null
  status: FetchUserStatus
}

async function fetchCurrentUser(token: string): Promise<FetchUserResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.ok) {
      const data = await res.json() as MeResponse
      return {
        user: data.user ?? null,
        status: data.user ? 'ok' : 'error'
      }
    }

    if (res.status === 401 || res.status === 403) {
      return { user: null, status: 'unauthorized' }
    }

    console.error(`获取用户信息失败: HTTP ${res.status}`)
    return { user: null, status: 'error' }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return { user: null, status: 'error' }
  }
}

function parseStoredUser(raw: string | null): User | null {
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch (error) {
    console.error('解析本地用户信息失败:', error)
    return null
  }
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  accessToken: null,
  isLoggedIn: false,
  isLoading: true,
  isOfflineMode: false,

  setAuth: (token, user) => {
    dbOps.setMetaValue(META_KEYS.ACCESS_TOKEN, token)
    dbOps.setMetaValue(META_KEYS.USER, JSON.stringify(user))
    dbOps.setMetaValue(META_KEYS.OFFLINE_MODE, '0')

    set({
      accessToken: token,
      user,
      isLoggedIn: true,
      isOfflineMode: false,
      isLoading: false
    })
  },

  login: async (token) => {
    return get().handleToken(token)
  },

  handleToken: async (token) => {
    const result = await fetchCurrentUser(token)
    if (!result.user) return false

    get().setAuth(token, result.user)
    return true
  },

  logout: () => {
    const locale = dbOps.getMetaValue(META_KEYS.LOCALE)
    const themeMode = dbOps.getMetaValue(META_KEYS.THEME_MODE)

    dbOps.clearAllData()
    if (locale) {
      dbOps.setMetaValue(META_KEYS.LOCALE, locale)
    }
    if (themeMode) {
      dbOps.setMetaValue(META_KEYS.THEME_MODE, themeMode)
    }

    set({
      user: null,
      accessToken: null,
      isLoggedIn: false,
      isOfflineMode: false,
      isLoading: false
    })
  },

  checkAuth: async () => {
    set({ isLoading: true })

    try {
      const token = dbOps.getMetaValue(META_KEYS.ACCESS_TOKEN)
      const storedUser = parseStoredUser(dbOps.getMetaValue(META_KEYS.USER))
      const isOfflineMode = dbOps.getMetaValue(META_KEYS.OFFLINE_MODE) === '1'

      if (!token) {
        set({
          user: null,
          accessToken: null,
          isLoggedIn: false,
          isOfflineMode,
          isLoading: false
        })
        return
      }

      const fetchResult = await fetchCurrentUser(token)

      if (fetchResult.user) {
        dbOps.setMetaValue(META_KEYS.USER, JSON.stringify(fetchResult.user))
        set({
          accessToken: token,
          user: fetchResult.user,
          isLoggedIn: true,
          isOfflineMode: false,
          isLoading: false
        })
        return
      }

      if (fetchResult.status === 'unauthorized') {
        dbOps.deleteMetaValue(META_KEYS.ACCESS_TOKEN)
        dbOps.deleteMetaValue(META_KEYS.USER)

        set({
          user: null,
          accessToken: null,
          isLoggedIn: false,
          isOfflineMode,
          isLoading: false
        })
        return
      }

      if (storedUser) {
        console.warn('当前网络不可用，使用本地缓存账号继续访问')
        set({
          accessToken: token,
          user: storedUser,
          isLoggedIn: true,
          isOfflineMode: false,
          isLoading: false
        })
        return
      }

      set({
        user: null,
        accessToken: null,
        isLoggedIn: false,
        isOfflineMode,
        isLoading: false
      })
    } catch (error) {
      console.error('恢复认证状态失败:', error)
      const isOfflineMode = dbOps.getMetaValue(META_KEYS.OFFLINE_MODE) === '1'
      set({
        user: null,
        accessToken: null,
        isLoggedIn: false,
        isOfflineMode,
        isLoading: false
      })
    }
  },

  setUser: (user) => {
    dbOps.setMetaValue(META_KEYS.USER, JSON.stringify(user))
    set({ user })
  },

  enterOfflineMode: () => {
    dbOps.setMetaValue(META_KEYS.OFFLINE_MODE, '1')
    set({ isOfflineMode: true })
  },

  exitOfflineMode: () => {
    dbOps.setMetaValue(META_KEYS.OFFLINE_MODE, '0')
    set({ isOfflineMode: false })
  }
}))
