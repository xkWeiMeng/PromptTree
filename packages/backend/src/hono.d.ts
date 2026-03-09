import 'hono'

declare module 'hono' {
  interface ContextVariableMap {
    userId?: string
    authType?: 'jwt' | 'api_key'
    apiKeyId?: string
  }
}
