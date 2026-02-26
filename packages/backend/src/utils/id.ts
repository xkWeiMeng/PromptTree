import { randomUUID } from 'crypto'

/**
 * 生成 UUID v4
 */
export function generateId(): string {
  return randomUUID()
}

/**
 * 生成随机 token（用于魔法链接等）
 * @param length token 长度（默认 32）
 */
export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const randomBytes = new Uint8Array(length)
  crypto.getRandomValues(randomBytes)
  for (let i = 0; i < length; i++) {
    token += chars[randomBytes[i] % chars.length]
  }
  return token
}

/**
 * 获取当前 Unix 时间戳（毫秒）
 */
export function now(): number {
  return Date.now()
}
