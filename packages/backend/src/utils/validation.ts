/**
 * 输入验证工具
 */

// ===================
// 类型定义
// ===================

export interface NodeChange {
  id: string
  action: 'upsert' | 'delete'
  data?: {
    id: string
    parentId: string | null
    type: 'folder' | 'prompt'
    title: string
    content: string
    isFavorite: boolean
    sortOrder: number
    collapsed: boolean
    createdAt: number
    updatedAt: number
    deletedAt: number | null
    version: number
  }
}

export interface SyncRequest {
  lastSyncTime: number
  changes: NodeChange[]
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
}

// ===================
// 验证函数
// ===================

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证 UUID 格式
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * 验证同步请求体
 */
export function validateSyncPayload(data: unknown): ValidationResult<SyncRequest> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' }
  }

  const body = data as Record<string, unknown>

  // lastSyncTime 必须是数字
  if (typeof body.lastSyncTime !== 'number') {
    return { success: false, error: 'lastSyncTime must be a number' }
  }

  // changes 必须是数组
  if (!Array.isArray(body.changes)) {
    return { success: false, error: 'changes must be an array' }
  }

  // 验证每个 change
  for (let i = 0; i < body.changes.length; i++) {
    const change = body.changes[i]
    
    if (!change || typeof change !== 'object') {
      return { success: false, error: `changes[${i}] must be an object` }
    }

    if (!change.id || typeof change.id !== 'string') {
      return { success: false, error: `changes[${i}].id must be a string` }
    }

    if (!['upsert', 'delete'].includes(change.action)) {
      return { success: false, error: `changes[${i}].action must be 'upsert' or 'delete'` }
    }

    // upsert 操作需要 data
    if (change.action === 'upsert') {
      const validData = validateNodeData(change.data, i)
      if (!validData.success) {
        return validData as ValidationResult<SyncRequest>
      }
    }
  }

  return {
    success: true,
    data: {
      lastSyncTime: body.lastSyncTime,
      changes: body.changes as NodeChange[]
    }
  }
}

/**
 * 验证节点数据
 */
function validateNodeData(data: unknown, index: number): ValidationResult<unknown> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: `changes[${index}].data must be an object` }
  }

  const node = data as Record<string, unknown>

  // 必填字段检查
  const requiredFields = ['id', 'type', 'title', 'updatedAt', 'version']
  for (const field of requiredFields) {
    if (node[field] === undefined) {
      return { success: false, error: `changes[${index}].data.${field} is required` }
    }
  }

  // type 必须是 folder 或 prompt
  if (!['folder', 'prompt'].includes(node.type as string)) {
    return { success: false, error: `changes[${index}].data.type must be 'folder' or 'prompt'` }
  }

  return { success: true }
}

/**
 * 验证 Google 登录请求
 */
export function validateGoogleAuthPayload(data: unknown): ValidationResult<{ idToken: string }> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' }
  }

  const body = data as Record<string, unknown>

  if (!body.idToken || typeof body.idToken !== 'string') {
    return { success: false, error: 'idToken is required and must be a string' }
  }

  return { success: true, data: { idToken: body.idToken } }
}

/**
 * 验证魔法链接请求
 */
export function validateMagicLinkPayload(data: unknown): ValidationResult<{ email: string }> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' }
  }

  const body = data as Record<string, unknown>

  if (!body.email || typeof body.email !== 'string') {
    return { success: false, error: 'email is required and must be a string' }
  }

  if (!validateEmail(body.email)) {
    return { success: false, error: 'Invalid email format' }
  }

  return { success: true, data: { email: body.email } }
}

/**
 * 验证注册请求
 */
export function validateRegisterPayload(data: unknown): ValidationResult<{ email: string; password: string; displayName?: string }> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' }
  }

  const body = data as Record<string, unknown>

  if (!body.email || typeof body.email !== 'string') {
    return { success: false, error: 'email is required' }
  }

  if (!validateEmail(body.email)) {
    return { success: false, error: 'Invalid email format' }
  }

  if (!body.password || typeof body.password !== 'string') {
    return { success: false, error: 'password is required' }
  }

  if (body.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' }
  }

  if (body.password.length > 128) {
    return { success: false, error: 'Password must be at most 128 characters' }
  }

  const displayName = body.displayName && typeof body.displayName === 'string' ? body.displayName.trim() : undefined

  return { success: true, data: { email: body.email, password: body.password, displayName } }
}

/**
 * 验证密码登录请求
 */
export function validatePasswordLoginPayload(data: unknown): ValidationResult<{ email: string; password: string }> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' }
  }

  const body = data as Record<string, unknown>

  if (!body.email || typeof body.email !== 'string') {
    return { success: false, error: 'email is required' }
  }

  if (!body.password || typeof body.password !== 'string') {
    return { success: false, error: 'password is required' }
  }

  return { success: true, data: { email: body.email, password: body.password } }
}
