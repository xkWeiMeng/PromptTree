import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from './guards'
import i18n from '@/i18n'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // =================== 根路径重定向（语言检测） ===================
    {
      path: '/',
      name: 'root',
      component: () => import('@/views/LandingPage.vue'),
      meta: { requiresAuth: false, isPublic: true, title: '' }
    },

    // =================== 带 locale 前缀的官网（公开页面） ===================
    {
      path: '/:locale(en|zh-CN|zh-TW|ja|ko)',
      name: 'landing',
      component: () => import('@/views/LandingPage.vue'),
      meta: { requiresAuth: false, isPublic: true, title: '' }
    },
    {
      path: '/:locale(en|zh-CN|zh-TW|ja|ko)/features',
      name: 'features',
      component: () => import('@/views/FeaturesPage.vue'),
      meta: { requiresAuth: false, isPublic: true, titleKey: 'features.pageTitle' }
    },
    {
      path: '/:locale(en|zh-CN|zh-TW|ja|ko)/docs',
      name: 'docs',
      component: () => import('@/views/DocsPage.vue'),
      meta: { requiresAuth: false, isPublic: true, titleKey: 'docs.pageTitle' }
    },
    {
      path: '/:locale(en|zh-CN|zh-TW|ja|ko)/docs/:slug',
      name: 'doc-detail',
      component: () => import('@/views/DocDetailPage.vue'),
      meta: { requiresAuth: false, isPublic: true }
    },
    {
      path: '/:locale(en|zh-CN|zh-TW|ja|ko)/blog',
      name: 'blog',
      component: () => import('@/views/BlogPage.vue'),
      meta: { requiresAuth: false, isPublic: true, titleKey: 'blog.pageTitle' }
    },
    {
      path: '/:locale(en|zh-CN|zh-TW|ja|ko)/blog/:slug',
      name: 'blog-post',
      component: () => import('@/views/BlogPostPage.vue'),
      meta: { requiresAuth: false, isPublic: true }
    },

    // =================== 分享页（公开访问） ===================
    {
      path: '/share/:token',
      name: 'shared',
      component: () => import('@/views/SharedView.vue'),
      meta: { requiresAuth: false, isPublic: true, titleKey: 'share.pageTitle' }
    },

    // =================== 应用（不加 locale 前缀） ===================
    {
      path: '/app',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true, titleKey: 'app.workspace' }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false, titleKey: 'login.title' }
    },

    // =================== 管理后台（仅本机访问） ===================
    {
      path: '/admin',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLogin.vue'),
      meta: { requiresAuth: false, isPublic: true, title: 'Admin' }
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      meta: { requiresAuth: false, isPublic: true, isAdmin: true, title: 'Admin Dashboard' }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/admin/AdminUsers.vue'),
      meta: { requiresAuth: false, isPublic: true, isAdmin: true, title: 'Admin Users' }
    },
    {
      path: '/admin/content',
      name: 'admin-content',
      component: () => import('@/views/admin/AdminContent.vue'),
      meta: { requiresAuth: false, isPublic: true, isAdmin: true, title: 'Admin Content' }
    },

    // =================== 旧路由兼容重定向 ===================
    {
      path: '/features',
      redirect: () => ({ name: 'features', params: { locale: (i18n.global.locale as any).value || 'en' } })
    },
    {
      path: '/docs',
      redirect: () => ({ name: 'docs', params: { locale: (i18n.global.locale as any).value || 'en' } })
    },
    {
      path: '/docs/:slug',
      redirect: (to) => ({ name: 'doc-detail', params: { locale: (i18n.global.locale as any).value || 'en', slug: to.params.slug } })
    },
    {
      path: '/blog',
      redirect: () => ({ name: 'blog', params: { locale: (i18n.global.locale as any).value || 'en' } })
    },
    {
      path: '/blog/:slug',
      redirect: (to) => ({ name: 'blog-post', params: { locale: (i18n.global.locale as any).value || 'en', slug: to.params.slug } })
    }
  ]
})

// 注册路由守卫
setupRouterGuards(router)

// 路由切换时更新页面标题（SEO）+ Google Analytics 页面跟踪
router.afterEach((to) => {
  const t = i18n.global.t
  const titleKey = to.meta.titleKey as string | undefined
  if (titleKey) {
    document.title = `${t(titleKey)} - PromptTree`
  } else {
    document.title = `PromptTree — ${t('seo.siteDesc')}`
  }

  // GA4: 手动发送 page_view 事件（初始配置已禁用自动 pageview）
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: to.fullPath,
      page_title: document.title,
      page_location: window.location.origin + to.fullPath
    })
  }
})

export default router
