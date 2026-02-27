import { post, get, patch } from './client'
import type { User } from '@prompttree/shared'

export interface LoginResponse {
  success: boolean
  user: User
  accessToken: string
  expiresAt: number
}

export interface MagicLinkResponse {
  success: boolean
  message: string
  _dev?: {
    token: string
    verifyUrl: string
    expiresAt: number
  }
}

export interface RegisterResponse {
  success: boolean
  message: string
  _dev?: {
    token: string
    verifyUrl: string
  }
}

/**
 * Google 登录
 */
export async function googleLogin(idToken: string): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/google', { idToken }, false)
}

/**
 * 跳转到 GitHub 登录
 */
export function githubLogin(): void {
  window.location.href = '/api/auth/github'
}

/**
 * 发送魔法链接
 */
export async function sendMagicLink(email: string): Promise<MagicLinkResponse> {
  return post<MagicLinkResponse>('/auth/magic-link', { email }, false)
}

/**
 * 邮箱+密码注册
 */
export async function register(email: string, password: string, displayName?: string): Promise<RegisterResponse> {
  return post<RegisterResponse>('/auth/register', { email, password, displayName }, false)
}

/**
 * 邮箱+密码登录
 */
export async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/login', { email, password }, false)
}

/**
 * 重新发送验证邮件
 */
export async function resendVerification(email: string): Promise<{ success: boolean; message: string }> {
  return post<{ success: boolean; message: string }>('/auth/resend-verification', { email }, false)
}

/**
 * 获取当前用户信息
 */
export async function getMe(): Promise<{ success: boolean; user: User }> {
  return get<{ success: boolean; user: User }>('/auth/me')
}

/**
 * 更新用户资料
 */
export async function updateProfile(data: { displayName?: string; avatarUrl?: string | null }): Promise<{ success: boolean; user: User }> {
  return patch<{ success: boolean; user: User }>('/auth/me', data)
}
