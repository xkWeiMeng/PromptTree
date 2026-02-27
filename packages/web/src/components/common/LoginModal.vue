<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLoginModal } from '@/composables/useLoginModal'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useTreeStore } from '@/stores/tree'
import { googleLogin, loginWithPassword, register, resendVerification, sendMagicLink } from '@/api/auth'
import { X, CheckCircle, Mail, Eye, EyeOff, UserPlus, LogIn } from 'lucide-vue-next'
import BrandLogo from '@/components/common/BrandLogo.vue'

const { t, locale } = useI18n()

const { visible, close } = useLoginModal()
const authStore = useAuthStore()

// 模式：login | register
type ModalMode = 'login' | 'register'
const mode = ref<ModalMode>('login')

// 共享状态
const email = ref('')
const password = ref('')
const displayName = ref('')
const isLoading = ref(false)
const error = ref('')
const showPassword = ref(false)

// 成功状态
const registrationSuccess = ref(false)
const emailNotVerified = ref(false)

// Google 登录
const googleBtnRef = ref<HTMLDivElement>()
const googleReady = ref(false)

// 弹窗打开时重置状态 & 初始化 Google 按钮
watch(visible, async (v) => {
  if (v) {
    resetState()
    await nextTick()
    initGoogleSignIn()
  }
})

function resetState() {
  email.value = ''
  password.value = ''
  displayName.value = ''
  isLoading.value = false
  error.value = ''
  showPassword.value = false
  registrationSuccess.value = false
  emailNotVerified.value = false
  mode.value = 'login'
}

function switchMode(newMode: ModalMode) {
  mode.value = newMode
  error.value = ''
  registrationSuccess.value = false
  emailNotVerified.value = false
}

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

// 邮箱+密码登录
async function handlePasswordLogin() {
  if (!email.value || !password.value) {
    error.value = t('login.emailAndPasswordRequired')
    return
  }

  isLoading.value = true
  error.value = ''
  emailNotVerified.value = false

  try {
    const result = await loginWithPassword(email.value, password.value)
    await authStore.setAuth(result.accessToken, result.user)
    await onLoginSuccess()
  } catch (err: any) {
    if (err?.message?.includes('EMAIL_NOT_VERIFIED') || err?.status === 403) {
      emailNotVerified.value = true
      error.value = ''
    } else if (err?.message?.includes('INVALID_CREDENTIALS') || err?.status === 401) {
      error.value = t('login.invalidCredentials')
    } else {
      error.value = t('login.loginError')
    }
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 邮箱注册
async function handleRegister() {
  if (!email.value || !password.value) {
    error.value = t('login.emailAndPasswordRequired')
    return
  }

  if (password.value.length < 6) {
    error.value = t('login.passwordTooShort')
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await register(email.value, password.value, displayName.value || undefined)
    registrationSuccess.value = true

    if (result._dev) {
      console.log('开发模式验证链接:', result._dev.verifyUrl)
    }
  } catch (err: any) {
    if (err?.message?.includes('EMAIL_EXISTS') || err?.status === 409) {
      error.value = t('login.emailExists')
    } else {
      error.value = t('login.registerError')
    }
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 重新发送验证邮件
async function handleResendVerification() {
  if (!email.value) return

  isLoading.value = true
  error.value = ''

  try {
    await resendVerification(email.value)
    // 显示成功提示
    registrationSuccess.value = true
    emailNotVerified.value = false
  } catch (err) {
    error.value = t('login.sendError')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 邮箱魔法链接
const magicLinkSent = ref(false)

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
              <h2 class="modal-title">{{ mode === 'login' ? t('login.title') : t('login.registerTitle') }}</h2>
              <p class="modal-subtitle">{{ mode === 'login' ? t('login.subtitle') : t('login.registerSubtitle') }}</p>
            </header>

            <!-- 错误提示 -->
            <div v-if="error" class="modal-error" role="alert">
              {{ error }}
            </div>

            <!-- 邮箱未验证提示 -->
            <div v-if="emailNotVerified" class="modal-warning" role="alert">
              <p>{{ t('login.emailNotVerifiedHint') }}</p>
              <button class="btn-link" @click="handleResendVerification" :disabled="isLoading">
                {{ t('login.resendVerification') }}
              </button>
            </div>

            <!-- 注册成功 / 验证邮件已发送 -->
            <div v-if="registrationSuccess" class="modal-success" role="status">
              <CheckCircle :size="20" class="success-icon" aria-hidden="true" />
              <p>{{ t('login.registrationSuccess') }}</p>
              <p class="hint">{{ t('login.checkVerifyEmailHint') }}</p>
              <button class="btn-link" @click="switchMode('login')" style="margin-top: var(--space-3)">
                {{ t('login.goToLogin') }}
              </button>
            </div>

            <!-- 魔法链接发送成功 -->
            <div v-else-if="magicLinkSent" class="modal-success" role="status">
              <CheckCircle :size="20" class="success-icon" aria-hidden="true" />
              <p>{{ t('login.magicLinkSent') }} {{ email }}</p>
              <p class="hint">{{ t('login.checkEmailHint') }}</p>
            </div>

            <template v-else-if="!registrationSuccess">
              <!-- 登录模式 -->
              <template v-if="mode === 'login'">
                <!-- 邮箱密码登录 -->
                <form class="auth-form" @submit.prevent="handlePasswordLogin">
                  <div class="form-field">
                    <label for="login-email" class="sr-only">{{ t('login.emailLabel') }}</label>
                    <input
                      id="login-email"
                      v-model="email"
                      type="email"
                      :placeholder="t('login.emailPlaceholder')"
                      autocomplete="email"
                      class="input"
                      :disabled="isLoading"
                      aria-required="true"
                    />
                  </div>
                  <div class="form-field password-field">
                    <label for="login-password" class="sr-only">{{ t('login.passwordLabel') }}</label>
                    <input
                      id="login-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      :placeholder="t('login.passwordPlaceholder')"
                      autocomplete="current-password"
                      class="input"
                      :disabled="isLoading"
                      aria-required="true"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      @click="showPassword = !showPassword"
                      :aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
                      tabindex="-1"
                    >
                      <EyeOff :size="16" v-if="showPassword" />
                      <Eye :size="16" v-else />
                    </button>
                  </div>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="isLoading || !email || !password"
                  >
                    <LogIn :size="16" v-if="!isLoading" />
                    {{ isLoading ? t('login.loggingIn') : t('login.loginBtn') }}
                  </button>
                </form>

                <div class="divider" aria-hidden="true">
                  <span>{{ t('login.or') }}</span>
                </div>

                <!-- Google 登录 -->
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

                  <!-- 魔法链接 -->
                  <button
                    class="btn btn-magic-link"
                    @click="handleMagicLink"
                    :disabled="isLoading || !email"
                    :aria-label="t('login.sendMagicLink')"
                  >
                    <Mail :size="16" />
                    {{ t('login.sendMagicLink') }}
                  </button>
                </section>

                <!-- 切换到注册 -->
                <p class="mode-switch">
                  {{ t('login.noAccount') }}
                  <button class="btn-link" @click="switchMode('register')">{{ t('login.goToRegister') }}</button>
                </p>
              </template>

              <!-- 注册模式 -->
              <template v-else>
                <form class="auth-form" @submit.prevent="handleRegister">
                  <div class="form-field">
                    <label for="register-name" class="sr-only">{{ t('login.displayNameLabel') }}</label>
                    <input
                      id="register-name"
                      v-model="displayName"
                      type="text"
                      :placeholder="t('login.displayNamePlaceholder')"
                      autocomplete="name"
                      class="input"
                      :disabled="isLoading"
                    />
                  </div>
                  <div class="form-field">
                    <label for="register-email" class="sr-only">{{ t('login.emailLabel') }}</label>
                    <input
                      id="register-email"
                      v-model="email"
                      type="email"
                      :placeholder="t('login.emailPlaceholder')"
                      autocomplete="email"
                      class="input"
                      :disabled="isLoading"
                      aria-required="true"
                    />
                  </div>
                  <div class="form-field password-field">
                    <label for="register-password" class="sr-only">{{ t('login.passwordLabel') }}</label>
                    <input
                      id="register-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      :placeholder="t('login.passwordPlaceholderRegister')"
                      autocomplete="new-password"
                      class="input"
                      :disabled="isLoading"
                      aria-required="true"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      @click="showPassword = !showPassword"
                      :aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
                      tabindex="-1"
                    >
                      <EyeOff :size="16" v-if="showPassword" />
                      <Eye :size="16" v-else />
                    </button>
                  </div>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="isLoading || !email || !password"
                  >
                    <UserPlus :size="16" v-if="!isLoading" />
                    {{ isLoading ? t('login.registering') : t('login.registerBtn') }}
                  </button>
                </form>

                <!-- 切换到登录 -->
                <p class="mode-switch">
                  {{ t('login.hasAccount') }}
                  <button class="btn-link" @click="switchMode('login')">{{ t('login.goToLogin') }}</button>
                </p>
              </template>
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

.btn-magic-link {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-input);
  width: 100%;
}

.btn-magic-link:hover:not(:disabled) {
  background: var(--bg-hover);
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
   Auth Form
   =================== */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.form-field {
  position: relative;
}

.password-field {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) ease;
}

.password-toggle:hover {
  color: var(--text-secondary);
}

.input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-input);
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
}

.password-field .input {
  padding-right: var(--space-10, 40px);
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
   Warning Alert
   =================== */
.modal-warning {
  background: var(--color-warning-bg, #fff3cd);
  color: var(--color-warning, #856404);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  text-align: center;
  font-size: var(--font-size-sm);
}

.modal-warning p {
  margin: 0 0 var(--space-2);
}

@media (prefers-color-scheme: dark) {
  .modal-warning {
    background: rgba(255, 204, 0, 0.1);
    color: #ffd60a;
  }
}

/* ===================
   Mode Switch & Links
   =================== */
.mode-switch {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--space-4);
  margin-bottom: 0;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: 0;
  text-decoration: none;
  transition: color var(--duration-fast) ease;
}

.btn-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
