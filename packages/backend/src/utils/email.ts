import nodemailer from 'nodemailer'

// ===================
// 邮件发送工具
// ===================

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  })

  return transporter
}

/**
 * 发送邮箱验证/激活邮件
 */
export async function sendVerificationEmail(email: string, verifyUrl: string): Promise<boolean> {
  const t = getTransporter()

  if (!t) {
    console.warn('[Email] SMTP not configured, skipping email send')
    return false
  }

  const fromAddress = process.env.SMTP_FROM || 'noreply@prompttree.tech'

  try {
    await t.sendMail({
      from: `"PromptTree" <${fromAddress}>`,
      to: email,
      subject: 'Verify your PromptTree account',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 24px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#1d1d1f;">Welcome to PromptTree!</h2>
          <p style="color:#48484a;font-size:14px;line-height:1.6;">
            Please click the button below to verify your email address and activate your account.
          </p>
          <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#007AFF;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">
            Verify Email
          </a>
          <p style="color:#8e8e93;font-size:12px;line-height:1.5;">
            If you didn't create an account, you can safely ignore this email.<br/>
            This link will expire in 30 minutes.
          </p>
        </div>
      `
    })
    return true
  } catch (err) {
    console.error('[Email] Failed to send verification email:', err)
    return false
  }
}

/**
 * 发送魔法链接邮件
 */
export async function sendMagicLinkEmail(email: string, verifyUrl: string): Promise<boolean> {
  const t = getTransporter()

  if (!t) {
    console.warn('[Email] SMTP not configured, skipping email send')
    return false
  }

  const fromAddress = process.env.SMTP_FROM || 'noreply@prompttree.tech'

  try {
    await t.sendMail({
      from: `"PromptTree" <${fromAddress}>`,
      to: email,
      subject: 'Your PromptTree login link',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 24px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#1d1d1f;">Log in to PromptTree</h2>
          <p style="color:#48484a;font-size:14px;line-height:1.6;">
            Click the button below to log in to your account.
          </p>
          <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#007AFF;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">
            Log In
          </a>
          <p style="color:#8e8e93;font-size:12px;line-height:1.5;">
            If you didn't request this, you can safely ignore this email.<br/>
            This link will expire in 30 minutes.
          </p>
        </div>
      `
    })
    return true
  } catch (err) {
    console.error('[Email] Failed to send magic link email:', err)
    return false
  }
}
