import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { listApiKeys, createApiKey, revokeApiKey } from '@/api/api-keys'

function mockJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('api-keys api', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())

    const authStore = useAuthStore()
    authStore.accessToken = 'test-token'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('应该在获取 API Key 列表时携带 Authorization', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: true, keys: [] })
    )

    await listApiKeys()

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/api-keys',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    )
  })

  it('应该能够创建 API Key', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({
        success: true,
        key: {
          id: 'k1',
          name: 'My Key',
          keyPrefix: 'ptk_abcdef12',
          isActive: true,
          lastUsedAt: null,
          expiresAt: null,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        apiKey: 'ptk_example'
      })
    )

    const result = await createApiKey({ name: 'My Key' })

    expect(result.success).toBe(true)
    expect(result.apiKey).toBe('ptk_example')
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/api-keys',
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  it('应该能够吊销 API Key', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockJsonResponse({ success: true })
    )

    const result = await revokeApiKey('k1')

    expect(result.success).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/api-keys/k1',
      expect.objectContaining({
        method: 'DELETE'
      })
    )
  })
})
