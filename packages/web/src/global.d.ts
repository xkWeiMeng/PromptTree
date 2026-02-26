// Google Analytics gtag.js 全局类型声明
interface Window {
  dataLayer: unknown[]
  gtag: (...args: unknown[]) => void
}

// 扩展 Vue Router meta 类型
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    isPublic?: boolean
    title?: string
    titleKey?: string
  }
}
