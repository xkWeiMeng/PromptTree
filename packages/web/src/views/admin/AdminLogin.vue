<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { getSavedServerUrl } from '@/api/admin'
import { Lock, AlertCircle, Server } from 'lucide-vue-next'

const router = useRouter()
const adminStore = useAdminStore()

const serverUrl = ref(getSavedServerUrl() || 'https://prompttree.tech')
const secret = ref('')
const isVerifying = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!serverUrl.value.trim()) {
    errorMsg.value = '请输入服务器地址'
    return
  }
  if (!secret.value.trim()) {
    errorMsg.value = '请输入管理密钥'
    return
  }

  isVerifying.value = true
  errorMsg.value = ''

  try {
    const ok = await adminStore.login(serverUrl.value.trim(), secret.value.trim())
    if (ok) {
      router.push('/admin/dashboard')
    } else {
      errorMsg.value = '密钥无效或服务器不可达'
    }
  } catch {
    errorMsg.value = '连接失败，请确认服务器地址和网络'
  } finally {
    isVerifying.value = false
  }
}

// 已认证直接跳转
if (adminStore.isAuthenticated) {
  router.replace('/admin/dashboard')
}
</script>

<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <div class="admin-login-icon">
        <Lock :size="32" />
      </div>
      <h1 class="admin-login-title">PromptTree Admin</h1>
      <p class="admin-login-desc">连接远程服务器，查看管理数据</p>

      <form class="admin-login-form" @submit.prevent="handleLogin">
        <label class="admin-label">
          <Server :size="14" />
          <span>服务器地址</span>
        </label>
        <input
          v-model="serverUrl"
          type="url"
          placeholder="https://prompttree.tech"
          class="admin-input"
          autocomplete="url"
        />

        <label class="admin-label">
          <Lock :size="14" />
          <span>管理密钥</span>
        </label>
        <input
          v-model="secret"
          type="password"
          placeholder="Admin Secret"
          class="admin-input"
          autocomplete="off"
          autofocus
        />

        <div v-if="errorMsg" class="admin-error">
          <AlertCircle :size="14" />
          <span>{{ errorMsg }}</span>
        </div>
        <button type="submit" class="admin-btn-primary" :disabled="isVerifying">
          {{ isVerifying ? '连接中...' : '连接服务器' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.admin-login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-secondary);
}

.admin-login-card {
  width: 100%;
  max-width: 380px;
  padding: var(--space-8);
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  border: 0.5px solid var(--border-secondary);
  box-shadow: var(--shadow-lg, 0 8px 30px rgba(0, 0, 0, 0.08));
  text-align: center;
}

.admin-login-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin: 0 auto var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.admin-login-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.admin-login-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

.admin-login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.admin-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}

.admin-input {
  width: 100%;
  padding: var(--space-3);
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--duration-fast) ease;
  box-sizing: border-box;
}

.admin-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}

.admin-error {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.admin-btn-primary {
  width: 100%;
  padding: var(--space-3);
  margin-top: var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--text-on-accent);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.admin-btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.admin-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
