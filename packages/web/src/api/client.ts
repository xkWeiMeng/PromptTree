import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useLoginModal } from '@/composables/useLoginModal'
import { i18n } from '@/i18n'

const BASE_URL = '/api'

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 防止重复弹出登录过期提示
let isHandlingSessionExpiry = false

/**
 * 处理 401 登录过期：清除状态、提示用户重新登录
 */
export async function handleUnauthorized() {
  if (isHandlingSessionExpiry) return
  isHandlingSessionExpiry = true

  try {
    const authStore = useAuthStore()

    // 只有已登录用户才需要提示（游客/离线模式不处理）
    if (!authStore.accessToken) return

    // 清除过期的认证状态（保留本地数据，不调 clearAllData）
    authStore.accessToken = null
    authStore.user = null

    const toast = useToast()
    const loginModal = useLoginModal()

    toast.showWithAction(
      i18n.global.t('auth.sessionExpired'),
      'warning',
      i18n.global.t('auth.reLogin'),
      () => loginModal.open(),
      0 // 不自动消失
    )
  } finally {
    // 5 秒后重置标记，允许再次触发（防御性）
    setTimeout(() => {
      isHandlingSessionExpiry = false
    }, 5000)
  }
}

/**
 * 创建请求头
 */
function createHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  
  if (includeAuth) {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`
    }
  }
  
  return headers
}

/**
 * 处理响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // 401 表示 token 过期或无效，触发重新登录流程
    if (response.status === 401) {
      await handleUnauthorized()
    }

    const data = await response.json().catch(() => ({}))
    throw new ApiError(
      data.error || `HTTP ${response.status}`,
      response.status,
      data.code
    )
  }
  
  return response.json()
}

/**
 * GET 请求
 */
export async function get<T>(path: string, includeAuth = true): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: createHeaders(includeAuth)
  })
  
  return handleResponse<T>(response)
}

/**
 * POST 请求
 */
export async function post<T>(
  path: string, 
  body: unknown, 
  includeAuth = true
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: createHeaders(includeAuth),
    body: JSON.stringify(body)
  })
  
  return handleResponse<T>(response)
}

/**
 * DELETE 请求
 */
export async function del<T>(path: string, includeAuth = true): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: createHeaders(includeAuth)
  })
  
  return handleResponse<T>(response)
}

/**
 * PATCH 请求
 */
export async function patch<T>(
  path: string,
  body: unknown,
  includeAuth = true
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: createHeaders(includeAuth),
    body: JSON.stringify(body)
  })

  return handleResponse<T>(response)
}
