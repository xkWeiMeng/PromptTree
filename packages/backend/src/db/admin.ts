import { db } from './index'

// ===================
// 类型定义
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
  date: string        // YYYY-MM-DD
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

// ===================
// 辅助函数
// ===================

function todayStartMs(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

function daysAgoStartMs(days: number): number {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

// ===================
// 预编译语句
// ===================

const totalUsersStmt = db.prepare(`SELECT COUNT(*) as count FROM users`)

const todayNewUsersStmt = db.prepare(`
  SELECT COUNT(*) as count FROM users WHERE created_at >= ?
`)

const todayActiveUsersStmt = db.prepare(`
  SELECT COUNT(*) as count FROM users WHERE last_sync_at >= ?
`)

const totalNodesStmt = db.prepare(`
  SELECT COUNT(*) as count FROM nodes WHERE deleted_at IS NULL
`)

const totalPromptsStmt = db.prepare(`
  SELECT COUNT(*) as count FROM nodes WHERE deleted_at IS NULL AND type = 'prompt'
`)

const totalFoldersStmt = db.prepare(`
  SELECT COUNT(*) as count FROM nodes WHERE deleted_at IS NULL AND type = 'folder'
`)

const usersListStmt = db.prepare(`
  SELECT
    u.id, u.email, u.display_name, u.avatar_url,
    u.github_id, u.google_id, u.created_at, u.last_sync_at,
    COALESCE(n.node_count, 0) as node_count,
    COALESCE(n.prompt_count, 0) as prompt_count,
    COALESCE(n.folder_count, 0) as folder_count
  FROM users u
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) as node_count,
      SUM(CASE WHEN type = 'prompt' THEN 1 ELSE 0 END) as prompt_count,
      SUM(CASE WHEN type = 'folder' THEN 1 ELSE 0 END) as folder_count
    FROM nodes WHERE deleted_at IS NULL
    GROUP BY user_id
  ) n ON u.id = n.user_id
  ORDER BY u.created_at DESC
  LIMIT ? OFFSET ?
`)

const usersSearchStmt = db.prepare(`
  SELECT
    u.id, u.email, u.display_name, u.avatar_url,
    u.github_id, u.google_id, u.created_at, u.last_sync_at,
    COALESCE(n.node_count, 0) as node_count,
    COALESCE(n.prompt_count, 0) as prompt_count,
    COALESCE(n.folder_count, 0) as folder_count
  FROM users u
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) as node_count,
      SUM(CASE WHEN type = 'prompt' THEN 1 ELSE 0 END) as prompt_count,
      SUM(CASE WHEN type = 'folder' THEN 1 ELSE 0 END) as folder_count
    FROM nodes WHERE deleted_at IS NULL
    GROUP BY user_id
  ) n ON u.id = n.user_id
  WHERE u.email LIKE ? OR u.display_name LIKE ?
  ORDER BY u.created_at DESC
  LIMIT ? OFFSET ?
`)

const usersCountStmt = db.prepare(`SELECT COUNT(*) as count FROM users`)

const usersSearchCountStmt = db.prepare(`
  SELECT COUNT(*) as count FROM users WHERE email LIKE ? OR display_name LIKE ?
`)

const userNodesStmt = db.prepare(`
  SELECT id, user_id, parent_id, type, title, content, is_favorite, sort_order,
         collapsed, created_at, updated_at, deleted_at, version
  FROM nodes
  WHERE user_id = ? AND deleted_at IS NULL
  ORDER BY parent_id NULLS FIRST, sort_order ASC
`)

const recentContentStmt = db.prepare(`
  SELECT
    n.id, n.user_id, u.email as user_email, u.display_name as user_name,
    n.type, n.title, n.content, n.created_at, n.updated_at
  FROM nodes n
  LEFT JOIN users u ON n.user_id = u.id
  WHERE n.deleted_at IS NULL
  ORDER BY n.updated_at DESC
  LIMIT ?
`)

// ===================
// 查询函数
// ===================

/**
 * 总览统计
 */
export function getOverviewStats(): OverviewStats {
  const todayMs = todayStartMs()
  return {
    totalUsers: (totalUsersStmt.get() as any).count,
    todayActiveUsers: (todayActiveUsersStmt.get(todayMs) as any).count,
    todayNewUsers: (todayNewUsersStmt.get(todayMs) as any).count,
    totalNodes: (totalNodesStmt.get() as any).count,
    totalPrompts: (totalPromptsStmt.get() as any).count,
    totalFolders: (totalFoldersStmt.get() as any).count,
  }
}

/**
 * 每日趋势统计（最近 N 天）
 * 由于 SQLite 没有 generate_series，在应用层遍历日期
 */
export function getDailyStats(days: number = 30): DailyStats[] {
  const result: DailyStats[] = []

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = daysAgoStartMs(i)
    const dayEnd = daysAgoStartMs(i - 1)
    const dateStr = new Date(dayStart).toISOString().slice(0, 10)

    const newUsers = db.prepare(
      `SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at < ?`
    ).get(dayStart, dayEnd) as any

    const activeUsers = db.prepare(
      `SELECT COUNT(*) as count FROM users WHERE last_sync_at >= ? AND last_sync_at < ?`
    ).get(dayStart, dayEnd) as any

    result.push({
      date: dateStr,
      newUsers: newUsers.count,
      activeUsers: activeUsers.count,
    })
  }

  return result
}

/**
 * 用户列表（分页 + 搜索）
 */
export function getUsers(page: number, pageSize: number, search?: string): { users: AdminUser[]; total: number } {
  const offset = (page - 1) * pageSize

  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`
    const users = usersSearchStmt.all(pattern, pattern, pageSize, offset) as AdminUser[]
    const total = (usersSearchCountStmt.get(pattern, pattern) as any).count
    return { users, total }
  }

  const users = usersListStmt.all(pageSize, offset) as AdminUser[]
  const total = (usersCountStmt.get() as any).count
  return { users, total }
}

/**
 * 指定用户的节点树
 */
export function getUserNodes(userId: string) {
  return userNodesStmt.all(userId)
}

/**
 * 最近更新的内容
 */
export function getRecentContent(limit: number = 50): RecentContent[] {
  return recentContentStmt.all(limit) as RecentContent[]
}
