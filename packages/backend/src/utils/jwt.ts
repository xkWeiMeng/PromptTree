import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-at-least-32-chars'
)

const JWT_ISSUER = 'prompttree'
const JWT_AUDIENCE = 'prompttree-app'
const JWT_EXPIRATION = '30d' // 30 天有效期

export interface JWTPayload {
  userId: string
  email?: string
}

/**
 * 签发 JWT
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  const jwt = await new jose.SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET)
  
  return jwt
}

/**
 * 验证 JWT
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  })
  
  if (!payload.sub) {
    throw new Error('Invalid token: missing subject')
  }
  
  return {
    userId: payload.sub,
    email: payload.email as string | undefined
  }
}

/**
 * 获取 JWT 过期时间（Unix 毫秒时间戳）
 */
export function getJWTExpiresAt(): number {
  return Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 天
}
