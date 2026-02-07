import { Context, Next } from 'hono'
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production')

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.substring(7)
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
