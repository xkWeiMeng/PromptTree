import { db } from './index'
import { generateId, now } from '../utils/id'

// ===================
// 类型定义
// ===================

export interface User {
  id: string
  email: string | null
  github_id: string | null
  google_id: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: number
  last_sync_at: number | null
}

export interface CreateUserInput {
  email?: string
  githubId?: string
  googleId?: string
  displayName?: string
  avatarUrl?: string
}

// ===================
// 预编译语句
// ===================

const findByIdStmt = db.prepare<string>(`
  SELECT * FROM users WHERE id = ?
`)

const findByEmailStmt = db.prepare<string>(`
  SELECT * FROM users WHERE email = ?
`)

const findByGoogleIdStmt = db.prepare<string>(`
  SELECT * FROM users WHERE google_id = ?
`)

const findByGithubIdStmt = db.prepare<string>(`
  SELECT * FROM users WHERE github_id = ?
`)

const insertStmt = db.prepare(`
  INSERT INTO users (id, email, github_id, google_id, display_name, avatar_url, created_at, last_sync_at)
  VALUES (@id, @email, @github_id, @google_id, @display_name, @avatar_url, @created_at, @last_sync_at)
`)

const updateLastSyncStmt = db.prepare<[number, string]>(`
  UPDATE users SET last_sync_at = ? WHERE id = ?
`)

const updateGoogleInfoStmt = db.prepare(`
  UPDATE users 
  SET display_name = COALESCE(@display_name, display_name),
      avatar_url = COALESCE(@avatar_url, avatar_url)
  WHERE id = @id
`)

const updateGithubInfoStmt = db.prepare(`
  UPDATE users 
  SET email = COALESCE(@email, email),
      display_name = COALESCE(@display_name, display_name),
      avatar_url = COALESCE(@avatar_url, avatar_url)
  WHERE id = @id
`)

const updateProfileStmt = db.prepare(`
  UPDATE users
  SET display_name = @display_name,
      avatar_url = @avatar_url
  WHERE id = @id
`)

// ===================
// Repository 函数
// ===================

/**
 * 根据 ID 查找用户
 */
export function findById(id: string): User | null {
  return findByIdStmt.get(id) as User | null
}

/**
 * 根据邮箱查找用户
 */
export function findByEmail(email: string): User | null {
  return findByEmailStmt.get(email) as User | null
}

/**
 * 根据 Google ID 查找用户
 */
export function findByGoogleId(googleId: string): User | null {
  return findByGoogleIdStmt.get(googleId) as User | null
}

/**
 * 根据 GitHub ID 查找用户
 */
export function findByGithubId(githubId: string): User | null {
  return findByGithubIdStmt.get(githubId) as User | null
}

/**
 * 创建新用户
 */
export function create(input: CreateUserInput): User {
  const id = generateId()
  const timestamp = now()
  
  const user = {
    id,
    email: input.email || null,
    github_id: input.githubId || null,
    google_id: input.googleId || null,
    display_name: input.displayName || null,
    avatar_url: input.avatarUrl || null,
    created_at: timestamp,
    last_sync_at: null
  }
  
  insertStmt.run(user)
  return user
}

/**
 * 更新用户最后同步时间
 */
export function updateLastSync(userId: string, timestamp: number): void {
  updateLastSyncStmt.run(timestamp, userId)
}

/**
 * 更新用户资料（昵称和头像）
 */
export function updateProfile(userId: string, input: { displayName?: string | null; avatarUrl?: string | null }): User | null {
  const user = findById(userId)
  if (!user) return null

  updateProfileStmt.run({
    id: userId,
    display_name: input.displayName !== undefined ? input.displayName : user.display_name,
    avatar_url: input.avatarUrl !== undefined ? input.avatarUrl : user.avatar_url
  })

  return findById(userId)
}

/**
 * 查找或创建 Google 用户
 */
export function findOrCreateByGoogleId(input: {
  googleId: string
  email: string
  displayName?: string
  avatarUrl?: string
}): User {
  let user = findByGoogleId(input.googleId)
  
  if (user) {
    // 更新用户信息（可能头像或昵称变了）
    updateGoogleInfoStmt.run({
      id: user.id,
      display_name: input.displayName || null,
      avatar_url: input.avatarUrl || null
    })
    return findById(user.id)!
  }
  
  // 检查是否有同邮箱的用户（可能之前用其他方式注册）
  const existingByEmail = findByEmail(input.email)
  if (existingByEmail) {
    // 关联 Google ID 到现有用户
    db.prepare('UPDATE users SET google_id = ? WHERE id = ?')
      .run(input.googleId, existingByEmail.id)
    return findById(existingByEmail.id)!
  }
  
  // 创建新用户
  return create({
    googleId: input.googleId,
    email: input.email,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl
  })
}

/**
 * 查找或创建 GitHub 用户
 */
export function findOrCreateByGithubId(input: {
  githubId: string
  email?: string
  displayName?: string
  avatarUrl?: string
}): User {
  let user = findByGithubId(input.githubId)
  
  if (user) {
    // 更新用户信息
    updateGithubInfoStmt.run({
      id: user.id,
      email: input.email || null,
      display_name: input.displayName || null,
      avatar_url: input.avatarUrl || null
    })
    return findById(user.id)!
  }
  
  // 如果有邮箱，检查是否有同邮箱的用户
  if (input.email) {
    const existingByEmail = findByEmail(input.email)
    if (existingByEmail) {
      db.prepare('UPDATE users SET github_id = ? WHERE id = ?')
        .run(input.githubId, existingByEmail.id)
      return findById(existingByEmail.id)!
    }
  }
  
  return create({
    githubId: input.githubId,
    email: input.email,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl
  })
}

/**
 * 查找或创建邮箱用户
 */
export function findOrCreateByEmail(email: string): User {
  let user = findByEmail(email)
  
  if (user) {
    return user
  }
  
  return create({ email })
}
