const ADMIN_BASE = '/api/admin'
const ADMIN_SECRET_KEY = 'prompttree-admin-secret'

function getAdminSecret(): string {
  return localStorage.getItem(ADMIN_SECRET_KEY) || ''
}

export function setAdminSecret(secret: string) {
  localStorage.setItem(ADMIN_SECRET_KEY, secret)
}

export function clearAdminSecret() {
  localStorage.removeItem(ADMIN_SECRET_KEY)
}

export function hasAdminSecret(): boolean {
  return !!localStorage.getItem(ADMIN_SECRET_KEY)
}

async function adminFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${ADMIN_BASE}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: {
      'x-admin-secret': getAdminSecret(),
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  const json = await res.json()
  return json.data ?? json
}

// ===================
// API 函数
// ===================

export interface OverviewStats {
  totalUsers: number
  todayActiveUsers: number
  todayNewUsers: number
  totalNodes: number
  totalPrompts: number
  totalFolders: number
}

export interface DailyStats {
  date: string
  newUsers: number
  activeUsers: number
}

export interface AdminUser {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  github_id: string | null
  google_id: string | null
  created_at: number
  last_sync_at: number | null
  node_count: number
  prompt_count: number
  folder_count: number
}

export interface UserNode {
  id: string
  user_id: string
  parent_id: string | null
  type: 'folder' | 'prompt'
  title: string
  content: string | null
  is_favorite: number
  sort_order: number
  collapsed: number
  created_at: number
  updated_at: number
  deleted_at: number | null
  version: number
}

export interface RecentContent {
  id: string
  user_id: string
  user_email: string | null
  user_name: string | null
  type: 'folder' | 'prompt'
  title: string
  content: string | null
  created_at: number
  updated_at: number
}

export interface PaginatedUsers {
  users: AdminUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getOverviewStats(): Promise<OverviewStats> {
  return adminFetch<OverviewStats>('/stats/overview')
}

export async function getDailyStats(days = 30): Promise<DailyStats[]> {
  return adminFetch<DailyStats[]>('/stats/daily', { days: String(days) })
}

export async function getUsers(page = 1, pageSize = 20, search = ''): Promise<PaginatedUsers> {
  return adminFetch<PaginatedUsers>('/users', {
    page: String(page),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
  })
}

export async function getUserNodes(userId: string): Promise<UserNode[]> {
  return adminFetch<UserNode[]>(`/users/${userId}/nodes`)
}

export async function getRecentContent(limit = 50): Promise<RecentContent[]> {
  return adminFetch<RecentContent[]>('/content/recent', { limit: String(limit) })
}

/**
 * 验证 admin secret 是否有效（通过调用 overview API）
 */
export async function verifyAdminSecret(secret: string): Promise<boolean> {
  try {
    const res = await fetch(`${ADMIN_BASE}/stats/overview`, {
      headers: {
        'x-admin-secret': secret,
        'Content-Type': 'application/json',
      },
    })
    return res.ok
  } catch {
    return false
  }
}
