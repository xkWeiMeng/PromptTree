import { Hono } from 'hono'
import * as jose from 'jose'
import { signJWT, getJWTExpiresAt } from '../utils/jwt'
import { validateGoogleAuthPayload, validateMagicLinkPayload, validateRegisterPayload, validatePasswordLoginPayload } from '../utils/validation'
import { hashPassword, verifyPassword } from '../utils/password'
import { sendVerificationEmail } from '../utils/email'
import * as usersRepo from '../db/users'
import * as magicLinksRepo from '../db/magic-links'

const auth = new Hono()

// ===================
// Google 一键登录
// ===================

auth.post('/google', async (c) => {
  const body = await c.req.json()
  const validation = validateGoogleAuthPayload(body)
  
  if (!validation.success) {
    return c.json({ success: false, error: validation.error }, 400)
  }
  
  const { idToken } = validation.data!
  
  try {
    // 验证 Google id_token
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    if (!GOOGLE_CLIENT_ID) {
      return c.json({ success: false, error: 'Google OAuth not configured' }, 500)
    }
    
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
    
    // 查找或创建用户
    const user = usersRepo.findOrCreateByGoogleId({
      googleId,
      email,
      displayName: name,
      avatarUrl: picture
    })
    
    // 签发本地 JWT
    const accessToken = await signJWT({ userId: user.id, email: user.email || undefined })
    const expiresAt = getJWTExpiresAt()
    
    return c.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      },
      accessToken,
      expiresAt
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return c.json({ success: false, error: 'Invalid Google token' }, 401)
  }
})

// ===================
// GitHub OAuth
// ===================

auth.get('/github', async (c) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return c.json({ success: false, error: 'GitHub OAuth not configured' }, 500)
  }
  
  const redirectUri = `${process.env.BASE_URL}/api/auth/github/callback`
  // 将 popup 标记编码到 state 中，回调时据此决定响应方式
  const popup = c.req.query('popup') === '1'
  const stateData = JSON.stringify({ nonce: Math.random().toString(36).substring(2), popup })
  const state = Buffer.from(stateData).toString('base64url')
  
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`
  return c.redirect(url)
})

auth.get('/github/callback', async (c) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const code = c.req.query('code')
  const stateParam = c.req.query('state')
  
  // 解析 state 中的 popup 标记
  let isPopup = false
  try {
    if (stateParam) {
      const stateData = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
      isPopup = stateData.popup === true
    }
  } catch { /* ignore parse errors */ }

  // 辅助函数：根据模式返回重定向或 postMessage HTML
  const respond = (params: { token?: string; error?: string }) => {
    if (isPopup) {
      const data = params.token
        ? `{ type: 'github-auth', token: '${params.token}' }`
        : `{ type: 'github-auth', error: '${params.error || 'unknown'}' }`
      return c.html(`<!DOCTYPE html><html><body><script>
        window.opener && window.opener.postMessage(${data}, '${frontendUrl}');
        window.close();
      </script><p>登录处理中，窗口将自动关闭...</p></body></html>`)
    }
    if (params.token) {
      return c.redirect(`${frontendUrl}/login?token=${params.token}`)
    }
    return c.redirect(`${frontendUrl}/login?error=${params.error}`)
  }
  
  if (!code) {
    return respond({ error: 'no_code' })
  }
  
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    return respond({ error: 'not_configured' })
  }
  
  try {
    // 1. 用 code 换取 access_token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    })
    
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
    
    if (!tokenData.access_token) {
      console.error('GitHub token error:', tokenData)
      return respond({ error: 'token_failed' })
    }
    
    // 2. 获取用户信息
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PromptTree-App'
      }
    })
    
    const githubUser = await userRes.json() as {
      id: number
      login: string
      email: string | null
      name: string | null
      avatar_url: string
    }
    
    // 3. 如果邮箱为空，尝试获取邮箱列表
    let email = githubUser.email
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PromptTree-App'
        }
      })
      const emails = await emailsRes.json() as { email: string; primary: boolean; verified: boolean }[]
      const primaryEmail = emails.find(e => e.primary && e.verified)
      email = primaryEmail?.email || null
    }
    
    // 4. 查找或创建用户
    const user = usersRepo.findOrCreateByGithubId({
      githubId: githubUser.id.toString(),
      email: email || undefined,
      displayName: githubUser.name || githubUser.login,
      avatarUrl: githubUser.avatar_url
    })
    
    // 5. 签发 JWT
    const accessToken = await signJWT({ userId: user.id, email: user.email || undefined })
    
    // 6. 返回 token（popup 用 postMessage，普通模式用重定向）
    return respond({ token: accessToken })
    
  } catch (error) {
    console.error('GitHub callback error:', error)
    return respond({ error: 'callback_failed' })
  }
})

// ===================
// 邮箱注册（密码 + 邮箱验证）
// ===================

auth.post('/register', async (c) => {
  const body = await c.req.json()
  const validation = validateRegisterPayload(body)

  if (!validation.success) {
    return c.json({ success: false, error: validation.error }, 400)
  }

  const { email, password, displayName } = validation.data!

  try {
    // 检查邮箱是否已被注册
    const existing = usersRepo.findByEmail(email)
    if (existing) {
      // 如果已有用户且已设置密码，说明已注册
      if (existing.password_hash) {
        return c.json({ success: false, error: 'EMAIL_EXISTS' }, 409)
      }
      // 已有用户但没有密码（之前通过 OAuth 或魔法链接注册），允许设置密码
      const passwordHash = await hashPassword(password)
      usersRepo.setPassword(existing.id, passwordHash)
      if (displayName) {
        usersRepo.updateProfile(existing.id, { displayName })
      }
      // 如果邮箱未验证，发送验证邮件
      if (!existing.email_verified) {
        const magicLink = magicLinksRepo.create(email)
        const verifyUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${magicLink.token}`
        const emailSent = await sendVerificationEmail(email, verifyUrl)

        if (process.env.NODE_ENV !== 'production') {
          return c.json({
            success: true,
            message: 'Password set. Please verify your email.',
            _dev: { token: magicLink.token, verifyUrl }
          })
        }
      }
      return c.json({ success: true, message: 'Password set. Please verify your email.' })
    }

    // 创建新用户
    const passwordHash = await hashPassword(password)
    const user = usersRepo.create({
      email,
      passwordHash,
      emailVerified: false,
      displayName: displayName || email.split('@')[0]
    })

    // 创建验证链接并发送邮件
    const magicLink = magicLinksRepo.create(email)
    const verifyUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${magicLink.token}`
    const emailSent = await sendVerificationEmail(email, verifyUrl)

    if (process.env.NODE_ENV !== 'production') {
      return c.json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        _dev: { token: magicLink.token, verifyUrl }
      })
    }

    return c.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    })
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ success: false, error: 'Registration failed' }, 500)
  }
})

// ===================
// 密码登录
// ===================

auth.post('/login', async (c) => {
  const body = await c.req.json()
  const validation = validatePasswordLoginPayload(body)

  if (!validation.success) {
    return c.json({ success: false, error: validation.error }, 400)
  }

  const { email, password } = validation.data!

  try {
    const user = usersRepo.findByEmail(email)

    if (!user || !user.password_hash) {
      return c.json({ success: false, error: 'INVALID_CREDENTIALS' }, 401)
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return c.json({ success: false, error: 'INVALID_CREDENTIALS' }, 401)
    }

    // 检查邮箱是否已验证
    if (!user.email_verified) {
      return c.json({ success: false, error: 'EMAIL_NOT_VERIFIED' }, 403)
    }

    // 签发 JWT
    const accessToken = await signJWT({ userId: user.id, email: user.email || undefined })
    const expiresAt = getJWTExpiresAt()

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      },
      accessToken,
      expiresAt
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, error: 'Login failed' }, 500)
  }
})

// ===================
// 邮箱验证（注册激活）
// ===================

auth.get('/verify-email', async (c) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const token = c.req.query('token')

  if (!token) {
    return c.redirect(`${frontendUrl}/app?error=no_token`)
  }

  const magicLink = magicLinksRepo.verify(token)

  if (!magicLink) {
    return c.redirect(`${frontendUrl}/app?error=invalid_or_expired_token`)
  }

  // 标记链接已使用
  magicLinksRepo.markUsed(token)

  // 标记用户邮箱已验证
  const user = usersRepo.findByEmail(magicLink.email)
  if (user) {
    usersRepo.setEmailVerified(user.id)

    // 签发 JWT 让用户自动登录
    const accessToken = await signJWT({ userId: user.id, email: user.email || undefined })
    return c.redirect(`${frontendUrl}/app?token=${accessToken}&verified=1`)
  }

  return c.redirect(`${frontendUrl}/app?error=user_not_found`)
})

// ===================
// 重新发送验证邮件
// ===================

auth.post('/resend-verification', async (c) => {
  const body = await c.req.json()
  const { email } = body as { email?: string }

  if (!email || typeof email !== 'string') {
    return c.json({ success: false, error: 'email is required' }, 400)
  }

  const user = usersRepo.findByEmail(email)
  if (!user) {
    // 不泄露用户是否存在
    return c.json({ success: true, message: 'If the email is registered, a verification link has been sent.' })
  }

  if (user.email_verified) {
    return c.json({ success: false, error: 'EMAIL_ALREADY_VERIFIED' }, 400)
  }

  const magicLink = magicLinksRepo.create(email)
  const verifyUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${magicLink.token}`
  await sendVerificationEmail(email, verifyUrl)

  if (process.env.NODE_ENV !== 'production') {
    return c.json({
      success: true,
      message: 'Verification email sent.',
      _dev: { token: magicLink.token, verifyUrl }
    })
  }

  return c.json({ success: true, message: 'Verification email sent.' })
})

// ===================
// 邮箱魔法链接
// ===================

auth.post('/magic-link', async (c) => {
  const body = await c.req.json()
  const validation = validateMagicLinkPayload(body)
  
  if (!validation.success) {
    return c.json({ success: false, error: validation.error }, 400)
  }
  
  const { email } = validation.data!
  
  // 创建魔法链接
  const magicLink = magicLinksRepo.create(email)
  
  // TODO: 发送邮件
  // 开发阶段：直接返回 token 用于测试
  const verifyUrl = `${process.env.BASE_URL}/api/auth/verify?token=${magicLink.token}`
  
  // 生产环境应该发送邮件而不是返回 token
  if (process.env.NODE_ENV === 'production') {
    // await sendEmail(email, verifyUrl)
    return c.json({ 
      success: true, 
      message: 'Magic link sent to your email'
    })
  }
  
  // 开发环境：返回 token 用于测试
  return c.json({ 
    success: true, 
    message: 'Magic link sent',
    // 仅开发环境返回
    _dev: {
      token: magicLink.token,
      verifyUrl,
      expiresAt: magicLink.expires_at
    }
  })
})

auth.get('/verify', async (c) => {
  const token = c.req.query('token')
  
  if (!token) {
    return c.redirect('/?error=no_token')
  }
  
  // 验证魔法链接
  const magicLink = magicLinksRepo.verify(token)
  
  if (!magicLink) {
    return c.redirect('/?error=invalid_or_expired_token')
  }
  
  // 标记为已使用
  magicLinksRepo.markUsed(token)
  
  // 查找或创建用户
  const user = usersRepo.findOrCreateByEmail(magicLink.email)
  
  // 签发 JWT
  const accessToken = await signJWT({ userId: user.id, email: user.email || undefined })
  
  // 重定向到前端
  return c.redirect(`/?token=${accessToken}`)
})

// ===================
// 用户信息
// ===================

auth.get('/me', async (c) => {
  // 从中间件获取用户 ID
  const userId = c.get('userId') as string
  
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }
  
  const user = usersRepo.findById(userId)
  
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404)
  }
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    }
  })
})

// ===================
// 更新用户资料
// ===================

auth.patch('/me', async (c) => {
  const userId = c.get('userId') as string

  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json()

  // 验证输入
  const { displayName, avatarUrl } = body as { displayName?: string; avatarUrl?: string | null }

  if (displayName !== undefined) {
    if (typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.trim().length > 50) {
      return c.json({ success: false, error: 'displayName must be a string between 1 and 50 characters' }, 400)
    }
  }

  if (avatarUrl !== undefined && avatarUrl !== null) {
    if (typeof avatarUrl !== 'string' || avatarUrl.length > 2048) {
      return c.json({ success: false, error: 'avatarUrl must be a valid URL string (max 2048 chars)' }, 400)
    }
    try {
      new URL(avatarUrl)
    } catch {
      return c.json({ success: false, error: 'avatarUrl must be a valid URL' }, 400)
    }
  }

  const updated = usersRepo.updateProfile(userId, {
    displayName: displayName?.trim(),
    avatarUrl
  })

  if (!updated) {
    return c.json({ success: false, error: 'User not found' }, 404)
  }

  return c.json({
    success: true,
    user: {
      id: updated.id,
      email: updated.email,
      displayName: updated.display_name,
      avatarUrl: updated.avatar_url,
      createdAt: updated.created_at
    }
  })
})

export default auth
