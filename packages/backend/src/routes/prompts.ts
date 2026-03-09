import { Hono } from 'hono'
import { generateId, now } from '../utils/id'
import * as nodesRepo from '../db/nodes'
import {
  validateCreatePromptPayload,
  validateUpdatePromptPayload,
  validateCreateFolderPayload,
  validateUUID
} from '../utils/validation'

const prompts = new Hono()

function ensureParentFolder(userId: string, parentId: string | null): { ok: true } | { ok: false; error: string } {
  if (!parentId) {
    return { ok: true }
  }

  const parent = nodesRepo.findById(parentId, userId)
  if (!parent || parent.deleted_at !== null) {
    return { ok: false, error: 'Parent folder not found' }
  }

  if (parent.type !== 'folder') {
    return { ok: false, error: 'parentId must reference a folder node' }
  }

  return { ok: true }
}

// ===================
// Prompt 接口
// ===================

prompts.get('/prompts', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const promptList = nodesRepo.findByUserId(userId)
    .filter((node) => node.type === 'prompt')
    .map(nodesRepo.nodeToData)

  return c.json({
    success: true,
    prompts: promptList
  })
})

prompts.get('/prompts/:id', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const promptId = c.req.param('id')
  if (!validateUUID(promptId)) {
    return c.json({ success: false, error: 'Invalid prompt id' }, 400)
  }

  const prompt = nodesRepo.findById(promptId, userId)
  if (!prompt || prompt.deleted_at !== null || prompt.type !== 'prompt') {
    return c.json({ success: false, error: 'Prompt not found' }, 404)
  }

  return c.json({
    success: true,
    prompt: nodesRepo.nodeToData(prompt)
  })
})

prompts.post('/prompts', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json().catch(() => null)
  const validation = validateCreatePromptPayload(body)
  if (!validation.success) {
    return c.json({ success: false, error: validation.error }, 400)
  }

  const payload = validation.data!
  const parentCheck = ensureParentFolder(userId, payload.parentId)
  if (!parentCheck.ok) {
    return c.json({ success: false, error: parentCheck.error }, 400)
  }

  const timestamp = now()
  const result = nodesRepo.upsert(userId, {
    id: generateId(),
    parentId: payload.parentId,
    type: 'prompt',
    title: payload.title,
    content: payload.content,
    isFavorite: payload.isFavorite,
    sortOrder: payload.sortOrder,
    collapsed: payload.collapsed,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    version: 1
  })

  return c.json({
    success: true,
    prompt: nodesRepo.nodeToData(result.node)
  }, 201)
})

prompts.patch('/prompts/:id', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const promptId = c.req.param('id')
  if (!validateUUID(promptId)) {
    return c.json({ success: false, error: 'Invalid prompt id' }, 400)
  }

  const prompt = nodesRepo.findById(promptId, userId)
  if (!prompt || prompt.deleted_at !== null || prompt.type !== 'prompt') {
    return c.json({ success: false, error: 'Prompt not found' }, 404)
  }

  const body = await c.req.json().catch(() => null)
  const validation = validateUpdatePromptPayload(body)
  if (!validation.success) {
    return c.json({ success: false, error: validation.error }, 400)
  }

  const payload = validation.data!
  const nextParentId = payload.parentId !== undefined ? payload.parentId : prompt.parent_id
  const parentCheck = ensureParentFolder(userId, nextParentId ?? null)
  if (!parentCheck.ok) {
    return c.json({ success: false, error: parentCheck.error }, 400)
  }

  const currentPrompt = nodesRepo.nodeToData(prompt)
  const result = nodesRepo.upsert(userId, {
    ...currentPrompt,
    title: payload.title ?? currentPrompt.title,
    content: payload.content ?? currentPrompt.content,
    parentId: nextParentId ?? null,
    isFavorite: payload.isFavorite ?? currentPrompt.isFavorite,
    sortOrder: payload.sortOrder ?? currentPrompt.sortOrder,
    collapsed: payload.collapsed ?? currentPrompt.collapsed,
    updatedAt: now(),
    version: prompt.version + 1
  })

  return c.json({
    success: true,
    prompt: nodesRepo.nodeToData(result.node)
  })
})

// ===================
// Folder 接口
// ===================

prompts.post('/folders', async (c) => {
  const userId = c.get('userId') as string
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json().catch(() => null)
  const validation = validateCreateFolderPayload(body)
  if (!validation.success) {
    return c.json({ success: false, error: validation.error }, 400)
  }

  const payload = validation.data!
  const parentCheck = ensureParentFolder(userId, payload.parentId)
  if (!parentCheck.ok) {
    return c.json({ success: false, error: parentCheck.error }, 400)
  }

  const timestamp = now()
  const result = nodesRepo.upsert(userId, {
    id: generateId(),
    parentId: payload.parentId,
    type: 'folder',
    title: payload.title,
    content: '',
    isFavorite: false,
    sortOrder: payload.sortOrder,
    collapsed: payload.collapsed,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    version: 1
  })

  return c.json({
    success: true,
    folder: nodesRepo.nodeToData(result.node)
  }, 201)
})

export default prompts
