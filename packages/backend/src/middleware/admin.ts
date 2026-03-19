import { Context, Next } from 'hono'

/**
 * Admin 安全中间件：双重校验
 * 1. Localhost IP 白名单 — 仅允许本机请求
 * 2. Admin Secret — 环境变量 ADMIN_SECRET，请求需携带 x-admin-secret header
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-admin-secret'

const ALLOWED_IPS = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
  'localhost',
])

function getClientIP(c: Context): string {
  // Hono node-server 传递的远程地址
  const remoteAddr = c.env?.incoming?.socket?.remoteAddress
    || c.req.header('x-real-ip')
    || ''
  return remoteAddr
}

export async function adminMiddleware(c: Context, next: Next) {
  // 1. Localhost IP 校验
  const clientIP = getClientIP(c)
  if (!ALLOWED_IPS.has(clientIP)) {
    console.warn(`[Admin] Blocked request from non-local IP: ${clientIP}`)
    return c.json({ error: 'Forbidden' }, 403)
  }

  // 2. Admin Secret 校验
  const secret = c.req.header('x-admin-secret')
  if (!secret || secret !== ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized: invalid admin secret' }, 401)
  }

  await next()
}
