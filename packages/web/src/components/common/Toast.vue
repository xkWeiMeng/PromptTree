<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { markRaw, onMounted, onBeforeUnmount, type Component } from 'vue'

const { toasts, remove } = useToast()

// 图标映射
const iconMap: Record<string, Component> = {
  success: markRaw(CheckCircle),
  error: markRaw(XCircle),
  warning: markRaw(AlertTriangle),
  info: markRaw(Info)
}

function toastRole(type: string) {
  return type === 'error' ? 'alert' : 'status'
}

function toastLive(type: string) {
  return type === 'error' ? 'assertive' : 'polite'
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && toasts.value.length > 0) {
    remove(toasts.value[toasts.value.length - 1].id)
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
          :role="toastRole(toast.type)"
          :aria-live="toastLive(toast.type)"
          @click="remove(toast.id)"
        >
          <component :is="iconMap[toast.type]" :size="18" class="toast-icon" />
          <span class="toast-message">{{ toast.message }}</span>
          <button
            v-if="toast.action"
            class="toast-action"
            @click.stop="toast.action.handler(); remove(toast.id)"
          >
            {{ toast.action.label }}
          </button>
          <button class="toast-close" aria-label="Dismiss notification" @click.stop="remove(toast.id)">
            <X :size="12" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-5);
  right: var(--space-5);
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 400px;
  pointer-events: auto;
  cursor: pointer;
  border: 0.5px solid var(--border-secondary);
  transition: transform var(--duration-fast) ease,
              opacity var(--duration-fast) ease;
}

@supports (backdrop-filter: blur(1px)) {
  .toast {
    background: var(--glass-bg-thick);
    backdrop-filter: blur(var(--glass-blur-heavy));
    -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  }
}

.toast:hover {
  transform: translateX(-4px);
}

.toast-icon {
  flex-shrink: 0;
}

.toast.success .toast-icon {
  color: var(--color-success);
}

.toast.error .toast-icon {
  color: var(--color-danger);
}

.toast.warning .toast-icon {
  color: var(--color-warning);
}

.toast.info .toast-icon {
  color: var(--color-accent);
}

.toast-message {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
}

.toast-action {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: background var(--duration-fast) ease;
  white-space: nowrap;
}

.toast-action:hover {
  background: var(--accent-bg-subtle);
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-fast) ease,
              background var(--duration-fast) ease;
}

.toast-close:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform var(--duration-normal) var(--ease-out);
}
</style>
