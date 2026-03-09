// @ts-ignore __DEV__ is provided by React Native runtime
const isDev = typeof __DEV__ !== 'undefined' && __DEV__
declare const process: { env: Record<string, string | undefined> }

const DEFAULT_DEV_BASE_URL = 'http://localhost:3000'
const DEFAULT_PROD_BASE_URL = 'https://prompttree.yourdomain.com'

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

/**
 * 获取 API 基础地址：
 * 1) 优先 EXPO_PUBLIC_API_BASE_URL
 * 2) 开发环境回落 localhost
 * 3) 生产环境回落线上域名占位
 */
export function getApiBaseUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
  if (envBaseUrl) {
    return trimTrailingSlash(envBaseUrl)
  }

  return isDev ? DEFAULT_DEV_BASE_URL : DEFAULT_PROD_BASE_URL
}
