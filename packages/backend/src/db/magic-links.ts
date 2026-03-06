import { db } from './index'
import { generateToken, now } from '../utils/id'

// ===================
// 类型定义
// ===================

export interface MagicLink {
  token: string
  email: string
  expires_at: number
  used: number // 0 或 1
}

// 魔法链接有效期：30 分钟
const MAGIC_LINK_EXPIRY_MS = 30 * 60 * 1000

// ===================
// 预编译语句
// ===================

const findByTokenStmt = db.prepare<string>(`
  SELECT * FROM magic_links WHERE token = ?
`)

const findByEmailStmt = db.prepare(`
  SELECT * FROM magic_links WHERE email = @email AND used = 0 AND expires_at > @now
  ORDER BY expires_at DESC
  LIMIT 1
`)

const findRecentByEmailStmt = db.prepare(`
  SELECT * FROM magic_links WHERE email = @email AND expires_at > @minTime
  ORDER BY expires_at DESC
  LIMIT 1
`)

const insertStmt = db.prepare(`
  INSERT INTO magic_links (token, email, expires_at, used)
  VALUES (@token, @email, @expires_at, 0)
`)

const markUsedStmt = db.prepare<string>(`
  UPDATE magic_links SET used = 1 WHERE token = ?
`)

const cleanExpiredStmt = db.prepare<number>(`
  DELETE FROM magic_links WHERE expires_at < ? OR used = 1
`)

// ===================
// Repository 函数
// ===================

/**
 * 创建魔法链接
 */
export function create(email: string): MagicLink {
  const token = generateToken(48)
  const expires_at = now() + MAGIC_LINK_EXPIRY_MS
  
  const magicLink = {
    token,
    email,
    expires_at,
    used: 0
  }
  
  insertStmt.run(magicLink)
  return magicLink
}

/**
 * 根据 token 查找魔法链接
 */
export function findByToken(token: string): MagicLink | null {
  return findByTokenStmt.get(token) as MagicLink | null
}

/**
 * 验证魔法链接
 * 返回 null 表示无效或已过期
 */
export function verify(token: string): MagicLink | null {
  const magicLink = findByToken(token)
  
  if (!magicLink) {
    return null
  }
  
  // 检查是否已使用
  if (magicLink.used === 1) {
    return null
  }
  
  // 检查是否过期
  if (magicLink.expires_at < now()) {
    return null
  }
  
  return magicLink
}

/**
 * 标记为已使用
 */
export function markUsed(token: string): void {
  markUsedStmt.run(token)
}

/**
 * 清理过期的魔法链接
 */
export function cleanExpired(): number {
  const result = cleanExpiredStmt.run(now())
  return result.changes
}

/**
 * 获取邮箱最新的有效魔法链接（用于开发调试）
 */
export function getLatestForEmail(email: string): MagicLink | null {
  return findByEmailStmt.get({ email, now: now() }) as MagicLink | null
}

/**
 * 查找最近发送给某邮箱的链接（用于频率限制）
 * @param email 邮箱
 * @param withinMs 时间窗口（毫秒），默认 60s
 */
export function findRecentByEmail(email: string, withinMs = 60_000): MagicLink | null {
  // expires_at = created_at + 30min。通过 expires_at - 30min + withinMs > now 反推 created_at
  const minTime = now() + MAGIC_LINK_EXPIRY_MS - withinMs
  return findRecentByEmailStmt.get({ email, minTime }) as MagicLink | null
}
