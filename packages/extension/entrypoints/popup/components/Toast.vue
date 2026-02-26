<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <div class="toast-container">
    <Transition v-for="toast in toasts" :key="toast.id" name="toast">
      <div :class="['toast', `toast--${toast.type}`]">
        <span class="toast-icon">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}
        </span>
        <span class="toast-msg">{{ toast.message }}</span>
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

.toast-icon { font-weight: bold; }

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from { opacity: 0; transform: translateY(-8px); }
.toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
