<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2 } from 'lucide-vue-next'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}>(), {
  variant: 'secondary',
  size: 'md',
  disabled: false,
  loading: false
})

const classes = computed(() => [
  'base-btn',
  `base-btn--${props.variant}`,
  `base-btn--${props.size}`,
  { 'base-btn--loading': props.loading }
])

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <button
    :class="classes"
    :disabled="isDisabled"
    :aria-busy="loading"
  >
    <Loader2 v-if="loading" :size="14" class="base-btn__spinner" />
    <slot v-else />
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--duration-fast) ease,
              color var(--duration-fast) ease,
              transform var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
  white-space: nowrap;
}

.base-btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-ring);
}

.base-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.base-btn--sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  min-height: 28px;
}

.base-btn--md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  min-height: 36px;
}

.base-btn--lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-size-md);
  min-height: 44px;
}

/* Variants */
.base-btn--primary {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.base-btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.base-btn--secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 0.5px solid var(--border-secondary);
}

.base-btn--secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.base-btn--danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.base-btn--danger:hover:not(:disabled) {
  background: var(--color-danger);
  color: var(--text-on-accent);
}

.base-btn--ghost {
  background: transparent;
  color: var(--text-secondary);
}

.base-btn--ghost:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Loading spinner */
.base-btn__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
