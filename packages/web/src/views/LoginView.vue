<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useHead } from '@/composables'
import BrandLogo from '@/components/common/BrandLogo.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const status = ref<'loading' | 'error'>('loading')
const errorMessage = ref('')

useHead({
  title: t('login.title'),
  robots: 'noindex, nofollow'
})

onMounted(async () => {
  // 已登录则直接跳转工作台
  if (authStore.canAccessApp) {
    router.replace('/app')
    return
  }

  // 处理 OAuth 错误回调
  if (route.query.error) {
    status.value = 'error'
    const errorMap: Record<string, string> = {
      no_code: t('login.errorNoCode'),
      not_configured: t('login.errorNotConfigured'),
      token_failed: t('login.errorTokenFailed'),
      callback_failed: t('login.errorCallbackFailed')
    }
    errorMessage.value = errorMap[route.query.error as string] || t('login.errorDefault')
    // 几秒后跳转首页
    setTimeout(() => router.replace('/'), 3000)
    return
  }

  // 处理 token 参数（由路由守卫处理，这里做兜底）
  if (route.query.token) {
    const success = await authStore.handleTokenFromUrl()
    if (success) {
      router.replace('/app')
    } else {
      status.value = 'error'
      errorMessage.value = t('login.tokenFailed')
      setTimeout(() => router.replace('/'), 3000)
    }
    return
  }

  // 没有 token 也没有 error，直接跳转首页
  router.replace('/')
})
</script>

<template>
  <main class="login-callback" role="main">
    <div class="login-callback-card">
      <div class="logo-icon" aria-hidden="true">
        <BrandLogo :size="48" />
      </div>
      <template v-if="status === 'loading'">
        <p class="status-text">{{ t('login.processing') }}</p>
      </template>
      <template v-else-if="status === 'error'">
        <p class="error-text">{{ errorMessage }}</p>
        <p class="hint-text">{{ t('login.redirecting') }}</p>
      </template>
    </div>
  </main>
</template>

<style scoped>
.login-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-secondary);
}

.login-callback-card {
  text-align: center;
  padding: var(--space-8);
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.status-text {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.error-text {
  color: var(--color-danger);
  font-size: var(--font-size-md);
  margin-bottom: var(--space-2);
}

.hint-text {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}
</style>
