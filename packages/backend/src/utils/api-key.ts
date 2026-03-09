import { createHash } from 'crypto'
import { generateToken } from './id'

const API_KEY_PREFIX = 'ptk'
const API_KEY_SECRET = process.env.API_KEY_SECRET
  || process.env.JWT_SECRET
  || 'dev-api-key-secret-change-in-production-at-least-32-chars'

export interface GeneratedApiKey {
  rawKey: string
  keyPrefix: string
  keyHash: string
}

/**
 * 生成 API Key（仅返回一次明文）
 */
export function generateApiKey(): GeneratedApiKey {
  const token = generateToken(40)
  const rawKey = `${API_KEY_PREFIX}_${token}`

  return {
    rawKey,
    keyPrefix: rawKey.slice(0, 12),
    keyHash: hashApiKey(rawKey)
  }
}

/**
 * 判断 token 是否为 API Key 形态
 */
export function isApiKeyToken(token: string): boolean {
  return token.startsWith(`${API_KEY_PREFIX}_`)
}

/**
 * API Key 哈希（数据库仅存 hash）
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256')
    .update(`${rawKey}:${API_KEY_SECRET}`)
    .digest('hex')
}
