import { Context, Next } from 'hono'
import { verifyJWT } from '../utils/jwt'
import * as apiKeysRepo from '../db/api-keys'
import { isApiKeyToken } from '../utils/api-key'

function getBearerToken(c: Context): string | null {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7).trim()
  return token.length > 0 ? token : null
}

function getApiKeyToken(c: Context): string | null {
  const headerKey = c.req.header('x-api-key')?.trim()
  if (headerKey) {
    return headerKey
  }

  const bearerToken = getBearerToken(c)
  if (bearerToken && isApiKeyToken(bearerToken)) {
    return bearerToken
  }

  return null
}

export async function authMiddleware(c: Context, next: Next) {
  const bearerToken = getBearerToken(c)
  const apiKeyToken = getApiKeyToken(c)

  if (!bearerToken && !apiKeyToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (apiKeyToken) {
    const apiKey = apiKeysRepo.findActiveByRawKey(apiKeyToken)
    if (!apiKey) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    c.set('userId', apiKey.user_id)
    c.set('authType', 'api_key')
    c.set('apiKeyId', apiKey.id)
    await next()
    return
  }

  if (!bearerToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await verifyJWT(bearerToken)
    c.set('userId', payload.userId)
    c.set('authType', 'jwt')
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

export async function jwtOnlyMiddleware(c: Context, next: Next) {
  const bearerToken = getBearerToken(c)
  if (!bearerToken || isApiKeyToken(bearerToken)) {
    return c.json({ error: 'JWT required' }, 401)
  }

  try {
    const payload = await verifyJWT(bearerToken)
    c.set('userId', payload.userId)
    c.set('authType', 'jwt')
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
