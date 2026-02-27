import { randomBytes, timingSafeEqual, scrypt as _scrypt } from 'crypto'
import { promisify } from 'util'

/**
 * 密码哈希工具（使用 scrypt，Node.js 原生支持，无需额外依赖）
 */

const scrypt = promisify(_scrypt)
const SALT_LENGTH = 16
const KEY_LENGTH = 64

/**
 * 对密码进行哈希
 * 返回格式: salt:hash (hex 编码)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':')
  if (!saltHex || !hashHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const storedKey = Buffer.from(hashHex, 'hex')
  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer
  return timingSafeEqual(storedKey, derivedKey)
}
