<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { state, handleConfirm, handleCancel } = useConfirm()

function handleBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('confirm-backdrop')) {
    handleCancel()
  }
}
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
          <div v-if="state.visible" class="confirm-dialog">
            <div class="confirm-body">
              <div class="confirm-icon" :class="state.options.type">
                {{ state.options.type === 'danger' ? '⚠️' : state.options.type === 'warning' ? '⚠️' : 'ℹ️' }}
              </div>
              <h3 class="confirm-title">{{ state.options.title }}</h3>
              <p class="confirm-message">{{ state.options.message }}</p>
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
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirm-dialog {
  background: var(--color-bg, #fff);
  border-radius: 12px;
  width: 100%;
  max-width: 280px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.confirm-body {
  padding: 20px 20px 16px;
}

.confirm-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.confirm-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text, #1f2937);
}

.confirm-message {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary, #6b7280);
  line-height: 1.5;
}

.confirm-footer {
  display: flex;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  border: none;
  background: transparent;
}

.btn-cancel {
  color: var(--color-primary, #4f46e5);
  border-right: 1px solid var(--color-border, #e5e7eb);
}

.btn-cancel:hover {
  background: var(--color-hover, #f3f4f6);
}

.btn-confirm {
  font-weight: 600;
}

.btn-confirm.info {
  color: var(--color-primary, #4f46e5);
}

.btn-confirm.warning {
  color: var(--color-warning, #f59e0b);
}

.btn-confirm.danger {
  color: var(--color-danger, #ef4444);
}

.btn-confirm:hover {
  background: var(--color-hover, #f3f4f6);
}

/* Transitions */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: all 0.2s ease-out;
}
.modal-leave-active {
  transition: all 0.15s ease-in;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
