<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLoginModal } from '@/composables/useLoginModal'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useTreeStore } from '@/stores/tree'
import { googleLogin, sendMagicLink } from '@/api/auth'
import { X, CheckCircle, Mail } from 'lucide-vue-next'
import BrandLogo from '@/components/common/BrandLogo.vue'

const { t, locale } = useI18n()

const { visible, close } = useLoginModal()
const authStore = useAuthStore()

// 状态
const email = ref('')
const isLoading = ref(false)
const error = ref('')
const magicLinkSent = ref(false)

// Google 登录
const googleBtnRef = ref<HTMLDivElement>()
const googleReady = ref(false)

// 弹窗打开时重置状态 & 初始化 Google 按钮
watch(visible, async (v) => {
  if (v) {
    email.value = ''
    isLoading.value = false
    error.value = ''
    magicLinkSent.value = false
    await nextTick()
    initGoogleSignIn()
  }
})

// 登录成功后的通用处理
async function onLoginSuccess() {
  close()
  // 触发全量同步，将本地离线数据同步到云端
  const syncStore = useSyncStore()
  const treeStore = useTreeStore()
  await treeStore.loadFromDB()
  await syncStore.fullSync()
}

// Google 登录 — 使用 renderButton 覆盖层方案
let googleInitRetries = 0

function initGoogleSignIn() {
  // @ts-ignore
  const google = window.google
  if (!google?.accounts?.id) {
    // SDK 可能还在加载，重试几次
    if (googleInitRetries < 6 && visible.value) {
      googleInitRetries++
      setTimeout(() => initGoogleSignIn(), 500)
    }
    return
  }

  googleInitRetries = 0

  google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
  })

  if (googleBtnRef.value) {
    google.accounts.id.renderButton(googleBtnRef.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: 332,
      text: 'signin_with',
      shape: 'rectangular',
      locale: locale.value.replace('-', '_'),
    })
    googleReady.value = true
  }
}

async function handleGoogleCredential(response: { credential: string }) {
  isLoading.value = true
  error.value = ''
  try {
    const result = await googleLogin(response.credential)
    await authStore.setAuth(result.accessToken, result.user)
    await onLoginSuccess()
  } catch (err) {
    error.value = t('login.googleError')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

function handleGoogleFallback() {
  error.value = t('login.googleLoadError')
}

// GitHub 登录 — popup 窗口
let githubPopup: Window | null = null

function handleGithubLogin() {
  isLoading.value = true
  error.value = ''

  const width = 600
  const height = 700
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`

  githubPopup = window.open('/api/auth/github?popup=1', 'github-oauth', features)

  // 监听 popup 回传的 token
  window.addEventListener('message', handleGithubMessage)

  // 轮询检测 popup 是否被手动关闭
  const pollTimer = setInterval(() => {
    if (githubPopup && githubPopup.closed) {
      clearInterval(pollTimer)
      isLoading.value = false
      window.removeEventListener('message', handleGithubMessage)
    }
  }, 500)
}

async function handleGithubMessage(event: MessageEvent) {
  // 安全校验 origin
  if (event.origin !== window.location.origin) return
  if (event.data?.type !== 'github-auth') return

  window.removeEventListener('message', handleGithubMessage)

  const token = event.data.token
  if (token) {
    try {
      await authStore.handleToken(token)
      await onLoginSuccess()
    } catch (err) {
      error.value = t('login.githubError')
      console.error(err)
    }
  } else {
    error.value = event.data.error || t('login.githubErrorGeneric')
  }

  isLoading.value = false
}

// 邮箱魔法链接
async function handleMagicLink() {
  if (!email.value) {
    error.value = t('login.emailRequired')
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await sendMagicLink(email.value)
    magicLinkSent.value = true

    if (result._dev) {
      console.log('开发模式验证链接:', result._dev.verifyUrl)
    }
  } catch (err) {
    error.value = t('login.sendError')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 点击背景关闭
function handleBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('login-backdrop')) {
    close()
  }
}

// ESC 关闭
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="visible"
        class="login-backdrop"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <Transition name="modal" appear>
          <div v-if="visible" class="login-modal" role="dialog" :aria-label="t('login.ariaLabel')">
            <!-- 关闭按钮 -->
            <button class="modal-close" @click="close" :aria-label="t('common.close')">
              <X :size="16" />
            </button>

            <!-- Logo -->
            <header class="modal-header">
              <div class="modal-logo-icon" aria-hidden="true">
                <BrandLogo :size="40" />
              </div>
              <h2 class="modal-title">{{ t('login.title') }}</h2>
              <p class="modal-subtitle">{{ t('login.subtitle') }}</p>
            </header>

            <!-- 错误提示 -->
            <div v-if="error" class="modal-error" role="alert">
              {{ error }}
            </div>

            <!-- 魔法链接发送成功 -->
            <div v-if="magicLinkSent" class="modal-success" role="status">
              <CheckCircle :size="20" class="success-icon" aria-hidden="true" />
              <p>{{ t('login.magicLinkSent') }} {{ email }}</p>
              <p class="hint">{{ t('login.checkEmailHint') }}</p>
            </div>

            <template v-else>
              <!-- 社交登录 -->
              <section class="social-login">
                <div class="google-btn-wrapper">
                  <button
                    class="btn btn-google"
                    @click="handleGoogleFallback"
                    :disabled="isLoading"
                    :aria-label="t('login.googleAriaLabel')"
                  >
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    {{ t('login.googleBtn') }}
                  </button>
                  <div
                    ref="googleBtnRef"
                    class="google-btn-overlay"
                    :class="{ active: googleReady }"
                  ></div>
                </div>

                <button
                  class="btn btn-github"
                  @click="handleGithubLogin"
                  :disabled="isLoading"
                  :aria-label="t('login.githubAriaLabel')"
                >
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {{ t('login.githubBtn') }}
                </button>
              </section>

              <div class="divider" aria-hidden="true">
                <span>{{ t('login.or') }}</span>
              </div>

              <!-- 邮箱登录 -->
              <form class="email-login" @submit.prevent="handleMagicLink">
                <label for="login-modal-email" class="sr-only">{{ t('login.emailLabel') }}</label>
                <input
                  id="login-modal-email"
                  v-model="email"
                  type="email"
                  :placeholder="t('login.emailPlaceholder')"
                  autocomplete="email"
                  class="input"
                  :disabled="isLoading"
                  aria-required="true"
                />
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="isLoading || !email"
                >
                  <Mail :size="16" v-if="!isLoading" />
                  {{ isLoading ? t('login.sending') : t('login.sendMagicLink') }}
                </button>
              </form>
            </template>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.login-backdrop {
  position: fixed;
  inset: 0;
  background: var(--glass-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.login-modal {
  position: relative;
  background: var(--bg-elevated);
  border-radius: var(--radius-2xl);
  padding: var(--space-8) var(--space-6) var(--space-6);
  width: 100%;
  max-width: 380px;
  margin: var(--space-5);
  box-shadow: var(--shadow-xl);
  border: 0.5px solid var(--border-secondary);
}

@supports (backdrop-filter: blur(1px)) {
  .login-modal {
    background: var(--glass-bg-thick);
    backdrop-filter: blur(var(--glass-blur-heavy));
    -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  }
}

.modal-close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-fast) ease,
              background var(--duration-fast) ease;
}

.modal-close:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

/* ===================
   Header
   =================== */
.modal-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.modal-logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-3);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  color: var(--text-primary);
  letter-spacing: var(--letter-spacing-tight);
}

.modal-subtitle {
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
}

/* ===================
   Alerts
   =================== */
.modal-error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  text-align: center;
  font-size: var(--font-size-sm);
}

.modal-success {
  background: var(--color-success-bg);
  color: var(--color-success);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  text-align: center;
}

.success-icon {
  margin-bottom: var(--space-2);
}

.modal-success p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.modal-success .hint {
  font-size: var(--font-size-xs);
  margin-top: var(--space-2);
  opacity: 0.8;
}

/* ===================
   Social Login
   =================== */
.social-login {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast) ease;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn .icon {
  width: 18px;
  height: 18px;
}

.google-btn-wrapper {
  position: relative;
}

.google-btn-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.001;
  pointer-events: none;
  z-index: 1;
}

.google-btn-overlay.active {
  pointer-events: auto;
}

.google-btn-overlay :deep(div),
.google-btn-overlay :deep(iframe) {
  width: 100% !important;
  height: 100% !important;
}

.btn-google {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-input);
  width: 100%;
}

.btn-google:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-github {
  background: #1D1D1F;
  color: white;
}

.btn-github:hover:not(:disabled) {
  background: #000;
}

@media (prefers-color-scheme: dark) {
  .btn-github {
    background: #48484A;
  }
  .btn-github:hover:not(:disabled) {
    background: #636366;
  }
}

.btn-primary {
  background: var(--color-accent);
  color: var(--text-on-accent);
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

/* ===================
   Divider
   =================== */
.divider {
  display: flex;
  align-items: center;
  margin: var(--space-4) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 0.5px;
  background: var(--border-secondary);
}

.divider span {
  padding: 0 var(--space-4);
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

/* ===================
   Email Login
   =================== */
.email-login {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-input);
  outline: none;
  transition: border-color var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
}

.input:focus {
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.input:disabled {
  background: var(--bg-tertiary);
  opacity: 0.6;
}

/* ===================
   Transitions
   =================== */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity var(--duration-normal) ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.modal-leave-active {
  transition: all var(--duration-fast) ease-in;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Screen-reader only (a11y) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
