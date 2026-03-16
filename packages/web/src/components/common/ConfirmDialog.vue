<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { AlertTriangle, Info, AlertCircle } from 'lucide-vue-next'

const { state, handleConfirm, handleCancel } = useConfirm()

const modalRef = ref<HTMLElement | null>(null)

// 点击背景关闭
function handleBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('confirm-backdrop')) {
    handleCancel()
  }
}

// 焦点陷阱
function trapFocus(e: KeyboardEvent) {
  const focusable = modalRef.value?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  if (!focusable?.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

// 打开时聚焦第一个可交互元素
watch(() => state.visible, async (visible) => {
  if (visible) {
    await nextTick()
    const first = modalRef.value?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    first?.focus()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div 
        v-if="state.visible" 
        class="confirm-backdrop"
        @click="handleBackdropClick"
      >
        <Transition name="modal" appear>
          <div
            v-if="state.visible"
            ref="modalRef"
            class="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            @keydown.tab="trapFocus"
            @keydown.escape="handleCancel"
          >
            <div class="confirm-body">
              <div class="confirm-icon" :class="state.options.type">
                <AlertTriangle v-if="state.options.type === 'danger' || state.options.type === 'warning'" :size="24" />
                <Info v-else :size="24" />
              </div>
              <h3 id="confirm-title" class="confirm-title">{{ state.options.title }}</h3>
              <p id="confirm-message" class="confirm-message">{{ state.options.message }}</p>
            </div>
            
            <div class="confirm-footer">
              <button class="btn-cancel" @click="handleCancel">
                {{ state.options.cancelText }}
              </button>
              <button 
                class="btn-confirm" 
                :class="state.options.type"
                @click="handleConfirm"
              >
                {{ state.options.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: var(--glass-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  overscroll-behavior: contain;
}

.confirm-dialog {
  background: var(--bg-elevated);
  border-radius: var(--radius-modal);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 280px;
  margin: var(--space-5);
  overflow: hidden;
  border: 0.5px solid var(--border-secondary);
  text-align: center;
}

@supports (backdrop-filter: blur(1px)) {
  .confirm-dialog {
    background: var(--glass-bg-thick);
    backdrop-filter: blur(var(--glass-blur-heavy));
    -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  }
}

.confirm-body {
  padding: var(--space-5) var(--space-5) var(--space-4);
}

.confirm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  margin-bottom: var(--space-3);
}

.confirm-icon.danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.confirm-icon.warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.confirm-icon.info {
  background: var(--accent-bg-subtle);
  color: var(--color-accent);
}

.confirm-title {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.confirm-message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

.confirm-footer {
  display: flex;
  border-top: 0.5px solid var(--border-secondary);
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: var(--space-3);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-regular);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
  border: none;
  background: transparent;
}

.btn-cancel {
  color: var(--color-accent);
  border-right: 0.5px solid var(--border-secondary);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-confirm {
  font-weight: var(--font-weight-semibold);
}

.btn-confirm.info {
  color: var(--color-accent);
}

.btn-confirm.warning {
  color: var(--color-warning);
}

.btn-confirm.danger {
  color: var(--color-danger);
}

.btn-confirm:hover {
  background: var(--bg-hover);
}
</style>
