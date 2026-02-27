<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

function handleAction(toast: typeof toasts.value[0]) {
  toast.onAction?.()
  dismiss(toast.id)
}
</script>

<template>
  <div class="toast-container">
    <Transition v-for="toast in toasts" :key="toast.id" name="toast">
      <div :class="['toast', `toast--${toast.type}`]">
        <span class="toast-icon">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ' }}
        </span>
        <span class="toast-msg">{{ toast.message }}</span>
        <button
          v-if="toast.actionText"
          class="toast-action"
          @click="handleAction(toast)"
        >
          {{ toast.actionText }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
}

.toast {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  pointer-events: auto;
}

.toast--success { background: #22c55e; }
.toast--error { background: #ef4444; }
.toast--info { background: #3b82f6; }
.toast--warning { background: #f59e0b; }

.toast-icon { font-weight: bold; }

.toast-action {
  background: rgba(255,255,255,0.25);
  border: none;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 4px;
  white-space: nowrap;
}
.toast-action:hover {
  background: rgba(255,255,255,0.4);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from { opacity: 0; transform: translateY(-8px); }
.toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
