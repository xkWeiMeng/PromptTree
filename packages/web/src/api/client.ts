import { useAuthStore } from '@/stores/auth'

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
