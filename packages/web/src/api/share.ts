import { del, get, post } from './client'
import type { TreeNode } from '@prompttree/shared'

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

export interface DeleteShareResponse {
  success: boolean
}

export interface PublicShareResponse {
  success: boolean
  share: ShareInfo
  stats: ShareStats
  content: ShareContent
}

/**
 * 创建（或获取）分享链接
 */
export async function createShare(nodeId: string, options?: { expiresAt?: string }): Promise<CreateShareResponse> {
  return post<CreateShareResponse>('/share', { nodeId, ...options })
}

/**
 * 查询当前节点分享状态
 */
export async function getMyShare(nodeId: string): Promise<QueryMyShareResponse> {
  return get<QueryMyShareResponse>(`/share/mine/${encodeURIComponent(nodeId)}`)
}

/**
 * 取消分享
 */
export async function deleteShare(shareId: string): Promise<DeleteShareResponse> {
  return del<DeleteShareResponse>(`/share/${encodeURIComponent(shareId)}`)
}

/**
 * 读取公开分享内容（游客可访问）
 */
export async function getPublicShare(token: string, visitorId?: string): Promise<PublicShareResponse> {
  const query = visitorId ? `?vid=${encodeURIComponent(visitorId)}` : ''
  return get<PublicShareResponse>(`/share/public/${encodeURIComponent(token)}${query}`, false)
}
