import { Hono } from 'hono'
import * as jose from 'jose'

const auth = new Hono()

// POST /api/auth/magic-link - 发送魔法链接
auth.post('/magic-link', async (c) => {
  const { email } = await c.req.json()
  // TODO: 生成 token，发送邮件
  return c.json({ success: true, message: 'Magic link sent' })
})

// GET /api/auth/verify - 验证魔法链接
auth.get('/verify', async (c) => {
  const token = c.req.query('token')
  // TODO: 验证 token，签发 JWT
  return c.json({ success: true, accessToken: '', expiresAt: Date.now() })
})

// POST /api/auth/google - Google 一键登录
auth.post('/google', async (c) => {
  const { idToken } = await c.req.json()
  
  try {
    // 验证 Google id_token
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    const JWKS = jose.createRemoteJWKSet(
      new URL('https://www.googleapis.com/oauth2/v3/certs')
    )
    
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: GOOGLE_CLIENT_ID
    })
    
    const { sub: googleId, email, name, picture } = payload as {
      sub: string
      email: string
      name?: string
      picture?: string
    }
    
    // TODO: 创建/更新用户，签发本地 JWT
    // const user = await findOrCreateUser({ googleId, email, name, picture })
    // const accessToken = await signJWT(user.id)
    
    return c.json({ 
      success: true, 
      user: { googleId, email, name, picture },
      accessToken: '',
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    })
  } catch (error) {
    return c.json({ success: false, error: 'Invalid Google token' }, 401)
  }
})

// GET /api/auth/github - GitHub OAuth 跳转
auth.get('/github', async (c) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${process.env.BASE_URL}/api/auth/github/callback`
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`
  return c.redirect(url)
})

// GET /api/auth/github/callback - GitHub OAuth 回调
auth.get('/github/callback', async (c) => {
  const code = c.req.query('code')
  // TODO: 换取 access token，获取用户信息，签发 JWT
  return c.redirect('/')
})

export default auth
