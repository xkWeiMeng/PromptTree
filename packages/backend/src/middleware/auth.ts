import { Context, Next } from 'hono'
import { verifyJWT } from '../utils/jwt'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.substring(7)
  
  try {
    const payload = await verifyJWT(token)
    c.set('userId', payload.userId)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
