import type { ApiResponse, SyncRequest, SyncResponse, AuthTokens } from './types'

/**
 * API 客户端配置
 */
export interface ApiClientConfig {
  baseUrl: string
  getToken: () => string | null
  onUnauthorized?: () => void
}

/**
 * 创建 API 客户端
 */
export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getToken, onUnauthorized } = config
  
  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const token = getToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      })
      
      if (response.status === 401) {
        onUnauthorized?.()
        return { success: false, error: 'Unauthorized' }
      }
      
      if (!response.ok) {
        const error = await response.text()
        return { success: false, error }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  return {
    // 认证
    async sendMagicLink(email: string): Promise<ApiResponse<void>> {
      return request('POST', '/api/auth/magic-link', { email })
    },
    
    async verifyMagicLink(token: string): Promise<ApiResponse<AuthTokens>> {
      return request('GET', `/api/auth/verify?token=${token}`)
    },
    
    // 同步
    async sync(data: SyncRequest): Promise<ApiResponse<SyncResponse>> {
      return request('POST', '/api/sync', data)
    },
    
    async fullSync(): Promise<ApiResponse<SyncResponse>> {
      return request('GET', '/api/sync/full')
    }
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
