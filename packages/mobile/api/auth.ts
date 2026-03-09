import type { User } from '@prompttree/shared'
import { apiRequest } from './client'

export interface MeResponse {
  success: boolean
  user: User
}

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

interface MobileAuthOptions {
  mobile?: boolean
}

export interface ResendVerificationResponse {
  success: boolean
  message: string
  _dev?: {
    token: string
    verifyUrl: string
  }
}

export async function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('GET', '/api/auth/me')
}

export async function updateProfile(payload: {
  displayName?: string
  avatarUrl?: string | null
}): Promise<MeResponse> {
  return apiRequest<MeResponse>('PATCH', '/api/auth/me', payload)
}

export async function sendMagicLink(
  email: string,
  options: MobileAuthOptions = {}
): Promise<MagicLinkResponse> {
  const mobile = options.mobile ?? true
  return apiRequest<MagicLinkResponse>('POST', '/api/auth/magic-link', { email, mobile })
}

export async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('POST', '/api/auth/login', { email, password })
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
  options: MobileAuthOptions = {}
): Promise<RegisterResponse> {
  const mobile = options.mobile ?? true
  return apiRequest<RegisterResponse>('POST', '/api/auth/register', { email, password, displayName, mobile })
}

export async function resendVerification(
  email: string,
  options: MobileAuthOptions = {}
): Promise<ResendVerificationResponse> {
  const mobile = options.mobile ?? true
  return apiRequest<ResendVerificationResponse>('POST', '/api/auth/resend-verification', { email, mobile })
}
