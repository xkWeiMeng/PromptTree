import { del, get, post } from './client'

export interface ApiKeyInfo {
  id: string
  name: string
  keyPrefix: string
  isActive: boolean
  lastUsedAt: number | null
  expiresAt: number | null
  createdAt: number
  updatedAt: number
}

export interface ListApiKeysResponse {
  success: boolean
  keys: ApiKeyInfo[]
}

export interface CreateApiKeyResponse {
  success: boolean
  key: ApiKeyInfo
  apiKey: string
}

export interface CreateApiKeyRequest {
  name?: string
  expiresAt?: number | null
}

/**
 * 获取当前用户 API Key 列表
 */
export async function listApiKeys(): Promise<ListApiKeysResponse> {
  return get<ListApiKeysResponse>('/auth/api-keys')
}

/**
 * 创建新的 API Key（仅返回一次明文）
 */
export async function createApiKey(payload: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  return post<CreateApiKeyResponse>('/auth/api-keys', payload)
}

/**
 * 吊销 API Key
 */
export async function revokeApiKey(id: string): Promise<{ success: boolean }> {
  return del<{ success: boolean }>(`/auth/api-keys/${id}`)
}
