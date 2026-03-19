import type { Router, RouteLocationNormalized, NavigationGuardNext, RouteRecordNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isValidLocale, resolveLocale, saveLocalePreference, type SupportedLocale } from '@/utils/locale'
import { setLocale } from '@/i18n'

/**
 * 注册路由守卫
 */
export function setupRouterGuards(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore()

    // =================== 语言处理 ===================

    // 从路由参数中获取 locale
    const routeLocale = to.params.locale as string | undefined

    if (routeLocale && isValidLocale(routeLocale)) {
      // 路由中有合法的 locale 参数，切换语言
      await setLocale(routeLocale as SupportedLocale)
      saveLocalePreference(routeLocale as SupportedLocale)
    }

    // 根路径 '/' 需要重定向到带 locale 前缀的路径
    if (to.path === '/') {
      const locale = resolveLocale()
      await setLocale(locale)
      saveLocalePreference(locale)
      return next({ name: 'landing', params: { locale } })
    }

    // =================== 认证处理 ===================

    // 优先处理 URL 中的 token（OAuth 回调 / 邮箱验证），不论页面是否公开
    if (to.query.token) {
      // 确保 auth store 已初始化
      if (authStore.isLoading) {
        await authStore.init()
      }
      const success = await authStore.handleTokenFromUrl()
      if (success) {
        // 登录成功，跳转到工作台（保留 verified 标记）
        const query: Record<string, string> = {}
        if (to.query.verified) query.verified = '1'
        return next({ path: '/app', query })
      }
    }

    // 所有页面都初始化 auth（让公开页面也能感知登录状态）
    if (authStore.isLoading) {
      await authStore.init()
    }

    // 公开页面直接放行
    const isPublic = to.matched.some((record: RouteRecordNormalized) => record.meta.isPublic === true)

    // Admin 路由守卫：需要 admin secret
    const isAdminRoute = to.matched.some((record: RouteRecordNormalized) => record.meta.isAdmin === true)
    if (isAdminRoute) {
      const hasSecret = !!localStorage.getItem('prompttree-admin-secret')
      if (!hasSecret) {
        return next({ name: 'admin-login' })
      }
      return next()
    }

    if (isPublic) {
      return next()
    }
    
    // 如果是登录页
    if (to.name === 'login') {
      // 已登录或离线模式则跳转工作台
      if (authStore.canAccessApp) {
        return next({ name: 'home' })
      }
      // 没有 token 参数的直接访问，重定向到首页
      if (!to.query.token && !to.query.error) {
        const locale = resolveLocale()
        return next({ name: 'landing', params: { locale } })
      }
      return next()
    }
    
    // 需要认证的页面（如 /app）
    const requiresAuth = to.matched.some((record: RouteRecordNormalized) => record.meta.requiresAuth !== false)
    
    if (requiresAuth && !authStore.canAccessApp) {
      // 游客自动进入离线模式，直达编辑页
      await authStore.enterOfflineMode()
      return next()
    }
    
    next()
  })
}
