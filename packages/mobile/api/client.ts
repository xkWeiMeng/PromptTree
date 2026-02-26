import { createApiClient } from '@prompttree/shared'
import { useAuthStore } from '../stores/auth'

// ===================
// 配置
// ===================

// 开发环境使用局域网 IP（Expo Go 无法访问 localhost）
// 生产环境使用线上域名
// @ts-ignore __DEV__ 由 React Native 运行时提供
const API_BASE_URL = typeof __DEV__ !== 'undefined' && __DEV__
  ? 'http://192.168.1.100:3000' // TODO: 替换为实际局域网 IP
  : 'https://prompttree.yourdomain.com'

// ===================
// API 客户端实例
// ===================

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    console.warn('Token 已过期，需要重新登录')
    useAuthStore.getState().logout()
  },
})

/**
 * 获取 API 客户端（供登录页等需要动态获取的场景使用）
 */
export function getApiClient() {
  return apiClient
}

/**
 * 获取 API 基础 URL
 */
export function getApiBaseUrl() {
  return API_BASE_URL
}

/**
 * 通用 HTTP 请求（供登录等需要直接请求的场景使用）
 */
export async function apiRequest<T = any>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}
