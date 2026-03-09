import { setMetaValue, getMetaValue, deleteMetaValue } from '../db/operations'
import { META_KEYS } from '../db/index'

/**
 * 持久化 token
 */
export function saveToken(token: string): void {
  setMetaValue(META_KEYS.ACCESS_TOKEN, token)
}

/**
 * 从 SQLite 恢复 token
 */
export function loadToken(): string | null {
  return getMetaValue(META_KEYS.ACCESS_TOKEN)
}

/**
 * 清除 token
 */
export function clearToken(): void {
  deleteMetaValue(META_KEYS.ACCESS_TOKEN)
}

/**
 * 持久化用户信息
 */
export function saveUser(user: object): void {
  setMetaValue(META_KEYS.USER, JSON.stringify(user))
}

/**
 * 恢复用户信息
 */
export function loadUser<T = object>(): T | null {
  const raw = getMetaValue(META_KEYS.USER)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * 清除用户信息
 */
export function clearUser(): void {
  deleteMetaValue(META_KEYS.USER)
}

/**
 * 构建 GitHub OAuth URL（用于跳转到浏览器登录）
 */
export function getGitHubOAuthUrl(baseUrl: string): string {
  return `${baseUrl}/api/auth/github`
}

/**
 * 从 Deep Link URL 中提取 token
 * prompttree://auth/callback?token=xxx 或 prompttree://?token=xxx
 */
function extractQueryParamFromUrl(url: string, key: string): string | null {
  try {
    const urlObj = new URL(url)
    const value = urlObj.searchParams.get(key)
    return value ? decodeURIComponent(value) : null
  } catch (error) {
    console.error('解析回调 URL 失败，尝试回退正则解析:', error)
    const match = url.match(new RegExp(`[?&]${key}=([^&]+)`))
    return match ? decodeURIComponent(match[1]) : null
  }
}

export function extractTokenFromUrl(url: string): string | null {
  return extractQueryParamFromUrl(url, 'token')
}

export function extractErrorFromUrl(url: string): string | null {
  return extractQueryParamFromUrl(url, 'error')
}
