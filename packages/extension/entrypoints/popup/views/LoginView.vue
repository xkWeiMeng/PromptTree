<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const step = ref<'email' | 'verify'>('email')
const email = ref('')
const verifyToken = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

async function handleSendMagicLink() {
  if (!email.value.trim()) return
  isLoading.value = true
  errorMsg.value = ''
  const result = await authStore.sendMagicLink(email.value.trim())
  isLoading.value = false
  if (result.success) {
    step.value = 'verify'
  } else {
    errorMsg.value = result.error || '发送失败'
  }
}

async function handleVerify() {
  if (!verifyToken.value.trim()) return
  isLoading.value = true
  errorMsg.value = ''
  const result = await authStore.verifyMagicLink(verifyToken.value.trim())
  isLoading.value = false
  if (!result.success) {
    errorMsg.value = result.error || '验证失败'
  }
}

async function handleOfflineMode() {
  await authStore.enterOfflineMode()
}
</script>

<template>
  <div class="login-view">
    <div class="login-header">
      <h1>🌳 PromptTree</h1>
      <p class="login-subtitle">Prompt 管理与一键填入</p>
    </div>

    <div class="login-body">
      <!-- 邮箱输入步骤 -->
      <template v-if="step === 'email'">
        <div class="form-item">
          <label>邮箱地址</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            @keydown.enter="handleSendMagicLink"
          />
        </div>
        <button
          class="btn btn--primary btn--full"
          :disabled="isLoading || !email.trim()"
          @click="handleSendMagicLink"
        >
          {{ isLoading ? '发送中...' : '📧 发送登录链接' }}
        </button>
      </template>

      <!-- 验证步骤 -->
      <template v-if="step === 'verify'">
        <p class="verify-hint">登录链接已发送到 <strong>{{ email }}</strong>，请从邮件中复制验证码：</p>
        <div class="form-item">
          <label>验证码</label>
          <input
            v-model="verifyToken"
            type="text"
            placeholder="粘贴验证码..."
            @keydown.enter="handleVerify"
          />
        </div>
        <button
          class="btn btn--primary btn--full"
          :disabled="isLoading || !verifyToken.trim()"
          @click="handleVerify"
        >
          {{ isLoading ? '验证中...' : '✓ 验证登录' }}
        </button>
        <button class="btn btn--link" @click="step = 'email'">← 重新发送</button>
      </template>

      <!-- 错误信息 -->
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <!-- 分隔线 -->
      <div class="divider"><span>或</span></div>

      <!-- 离线模式 -->
      <button class="btn btn--secondary btn--full" @click="handleOfflineMode">
        📡 离线使用
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-header h1 {
  font-size: 22px;
  margin: 0 0 4px;
  color: var(--color-primary, #4f46e5);
}

.login-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary, #9ca3af);
}

.login-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-item label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
}

.form-item input {
  padding: 8px 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: var(--color-bg, #fff);
  color: var(--color-text, #1f2937);
}

.form-item input:focus {
  border-color: var(--color-primary, #4f46e5);
}

.verify-hint {
  font-size: 13px;
  color: var(--color-text, #1f2937);
  line-height: 1.5;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  text-align: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--full { width: 100%; }

.btn--primary {
  background: var(--color-primary, #4f46e5);
  color: #fff;
}

.btn--primary:hover:not(:disabled) { opacity: 0.9; }

.btn--secondary {
  background: var(--color-bg, #fff);
  border-color: var(--color-border, #e5e7eb);
  color: var(--color-text, #1f2937);
}

.btn--secondary:hover { background: var(--color-hover, #f3f4f6); }

.btn--link {
  background: none;
  border: none;
  color: var(--color-primary, #4f46e5);
  font-size: 12px;
  padding: 4px;
  cursor: pointer;
}

.btn--link:hover { text-decoration: underline; }

.error-msg {
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  color: #ef4444;
  font-size: 12px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
  color: var(--color-text-secondary, #9ca3af);
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border, #e5e7eb);
}
</style>
