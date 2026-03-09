import type { TreeNode } from '@prompttree/shared'
import { apiRequest } from './client'

export interface ShareInfo {
  id: string
  nodeId: string
  nodeType: 'folder' | 'prompt'
  token: string
  link: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface ShareStats {
  readerCount: number
  readCount: number
}

export interface ShareContent {
  type: 'folder' | 'prompt'
  root: TreeNode
  nodes: TreeNode[]
}

export interface CreateShareResponse {
  success: boolean
  share: ShareInfo
  stats: ShareStats
}

export interface QueryMyShareResponse {
  success: boolean
  share: ShareInfo | null
  stats: ShareStats
}

export interface PublicShareResponse {
  success: boolean
  share: ShareInfo
  stats: ShareStats
  content: ShareContent
}

export async function createShare(nodeId: string): Promise<CreateShareResponse> {
  return apiRequest<CreateShareResponse>('POST', '/api/share', { nodeId })
}

export async function getMyShare(nodeId: string): Promise<QueryMyShareResponse> {
  return apiRequest<QueryMyShareResponse>('GET', `/api/share/mine/${encodeURIComponent(nodeId)}`)
}

export async function deleteShare(shareId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('DELETE', `/api/share/${encodeURIComponent(shareId)}`)
}

export async function getPublicShare(token: string, visitorId?: string): Promise<PublicShareResponse> {
  const query = visitorId ? `?vid=${encodeURIComponent(visitorId)}` : ''
  return apiRequest<PublicShareResponse>('GET', `/api/share/public/${encodeURIComponent(token)}${query}`)
}
