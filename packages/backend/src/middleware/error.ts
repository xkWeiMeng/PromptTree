import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

/**
 * 全局错误处理中间件
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (error) {
    console.error('Unhandled error:', error)
    
    // Hono HTTP 异常
    if (error instanceof HTTPException) {
      return c.json({
        error: error.message,
        code: `HTTP_${error.status}`
      }, error.status)
    }
    
    // 数据库错误
    if (error instanceof Error && error.message.includes('SQLITE')) {
      return c.json({
        error: 'Database error',
        code: 'DB_ERROR'
      }, 500)
    }
    
    // 通用错误
    if (error instanceof Error) {
      return c.json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
        code: 'INTERNAL_ERROR'
      }, 500)
    }
    
    // 未知错误
    return c.json({
      error: 'Unknown error',
      code: 'UNKNOWN_ERROR'
    }, 500)
  }
}

/**
 * 404 处理
 */
export async function notFoundHandler(c: Context) {
  return c.json({
    error: 'Not Found',
    code: 'NOT_FOUND'
  }, 404)
}

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 常用错误
 */
export const Errors = {
  Unauthorized: new AppError('Unauthorized', 'UNAUTHORIZED', 401),
  Forbidden: new AppError('Forbidden', 'FORBIDDEN', 403),
  NotFound: new AppError('Resource not found', 'NOT_FOUND', 404),
  ValidationFailed: (message: string) => new AppError(message, 'VALIDATION_FAILED', 400),
  Conflict: (message: string) => new AppError(message, 'CONFLICT', 409),
}
