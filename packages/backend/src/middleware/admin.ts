import { Context, Next } from 'hono'

/**
 * Admin 安全中间件
 *
 * 安全策略：ADMIN_SECRET 强密钥校验
 * - 生产环境必须在 .env 中设置高强度 ADMIN_SECRET
 * - 请求需携带 x-admin-secret header
 * - 本中间件不做 IP 限制，因为典型场景是本地浏览器远程访问生产服务器
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-admin-secret'

export async function adminMiddleware(c: Context, next: Next) {
  const secret = c.req.header('x-admin-secret')
  if (!secret || secret !== ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized: invalid admin secret' }, 401)
  }

  await next()
}
