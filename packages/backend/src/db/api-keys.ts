import { db } from './index'
import { generateId, now } from '../utils/id'
import { generateApiKey, hashApiKey } from '../utils/api-key'

// ===================
// 类型定义
// ===================

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_prefix: string
  key_hash: string
  is_active: number
  last_used_at: number | null
  expires_at: number | null
  created_at: number
  updated_at: number
}

export interface ApiKeyMeta {
  id: string
  user_id: string
  name: string
  key_prefix: string
  is_active: number
  last_used_at: number | null
  expires_at: number | null
  created_at: number
  updated_at: number
}

// ===================
// 预编译语句
// ===================

const insertStmt = db.prepare(`
  INSERT INTO api_keys (
    id, user_id, name, key_prefix, key_hash,
    is_active, last_used_at, expires_at, created_at, updated_at
  ) VALUES (
    @id, @user_id, @name, @key_prefix, @key_hash,
    @is_active, @last_used_at, @expires_at, @created_at, @updated_at
  )
`)

const listByUserIdStmt = db.prepare<string>(`
  SELECT
    id, user_id, name, key_prefix, is_active,
    last_used_at, expires_at, created_at, updated_at
  FROM api_keys
  WHERE user_id = ?
  ORDER BY created_at DESC
`)

const findByHashStmt = db.prepare<[string, number]>(`
  SELECT * FROM api_keys
  WHERE key_hash = ?
    AND is_active = 1
    AND (expires_at IS NULL OR expires_at > ?)
  LIMIT 1
`)

const revokeStmt = db.prepare<[number, string, string]>(`
  UPDATE api_keys
  SET is_active = 0, updated_at = ?
  WHERE id = ? AND user_id = ? AND is_active = 1
`)

const touchLastUsedStmt = db.prepare<[number, number, string]>(`
  UPDATE api_keys
  SET last_used_at = ?, updated_at = ?
  WHERE id = ?
`)

// ===================
// Repository 函数
// ===================

/**
 * 创建 API Key（仅返回一次明文）
 */
export function create(userId: string, input: { name: string; expiresAt: number | null }): { key: ApiKeyMeta; rawKey: string } {
  const generated = generateApiKey()
  const timestamp = now()
  const record = {
    id: generateId(),
    user_id: userId,
    name: input.name,
    key_prefix: generated.keyPrefix,
    key_hash: generated.keyHash,
    is_active: 1,
    last_used_at: null,
    expires_at: input.expiresAt,
    created_at: timestamp,
    updated_at: timestamp
  }

  insertStmt.run(record)

  return {
    key: {
      id: record.id,
      user_id: record.user_id,
      name: record.name,
      key_prefix: record.key_prefix,
      is_active: record.is_active,
      last_used_at: record.last_used_at,
      expires_at: record.expires_at,
      created_at: record.created_at,
      updated_at: record.updated_at
    },
    rawKey: generated.rawKey
  }
}

/**
 * 获取用户 API Key 元数据列表
 */
export function listByUserId(userId: string): ApiKeyMeta[] {
  return listByUserIdStmt.all(userId) as ApiKeyMeta[]
}

/**
 * 吊销 API Key
 */
export function revoke(userId: string, keyId: string): boolean {
  const result = revokeStmt.run(now(), keyId, userId)
  return result.changes > 0
}

/**
 * 用明文 API Key 查找有效 key（并更新最后使用时间）
 */
export function findActiveByRawKey(rawKey: string): ApiKey | null {
  const timestamp = now()
  const keyHash = hashApiKey(rawKey)
  const key = findByHashStmt.get(keyHash, timestamp) as ApiKey | null

  if (!key) {
    return null
  }

  touchLastUsedStmt.run(timestamp, timestamp, key.id)
  return key
}
