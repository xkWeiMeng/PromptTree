import { apiRequest } from './client'

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

export async function listApiKeys(): Promise<ListApiKeysResponse> {
  return apiRequest<ListApiKeysResponse>('GET', '/api/auth/api-keys')
}

export async function createApiKey(payload: {
  name?: string
  expiresAt?: number | null
}): Promise<CreateApiKeyResponse> {
  return apiRequest<CreateApiKeyResponse>('POST', '/api/auth/api-keys', payload)
}

export async function revokeApiKey(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('DELETE', `/api/auth/api-keys/${encodeURIComponent(id)}`)
}
