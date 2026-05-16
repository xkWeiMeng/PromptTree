<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight } from 'lucide-vue-next'

const STORAGE_KEY = 'prompttree-onboarding-dismissed'
const { t } = useI18n()

const visible = ref(false)
const currentTipIndex = ref(0)

const tips = [
  'onboarding.tip1',
  'onboarding.tip2',
  'onboarding.tip3'
]

onMounted(() => {
  const dismissed = localStorage.getItem(STORAGE_KEY)
  if (!dismissed) {
    visible.value = true
  }
})

function nextTip() {
  if (currentTipIndex.value < tips.length - 1) {
    currentTipIndex.value++
  } else {
    dismiss()
  }
}

function dismiss() {
  visible.value = false
  localStorage.setItem(STORAGE_KEY, '1')
}
</script>

<template>
  <Transition name="tip-fade">
    <div v-if="visible" class="onboarding-tip" role="alert" aria-live="polite">
      <div class="onboarding-tip__content">
        <span class="onboarding-tip__text">{{ t(tips[currentTipIndex]) }}</span>
        <span class="onboarding-tip__progress">{{ currentTipIndex + 1 }}/{{ tips.length }}</span>
      </div>
      <div class="onboarding-tip__actions">
        <button
          v-if="currentTipIndex < tips.length - 1"
          class="onboarding-tip__btn onboarding-tip__btn--next"
          @click="nextTip"
        >
          {{ t('onboarding.nextTip') }}
          <ChevronRight :size="14" />
        </button>
        <button
          class="onboarding-tip__btn onboarding-tip__btn--dismiss"
          @click="dismiss"
          :aria-label="t('onboarding.dismiss')"
        >
          <template v-if="currentTipIndex === tips.length - 1">{{ t('onboarding.dismiss') }}</template>
          <X v-else :size="14" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.onboarding-tip {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-tooltip);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 480px;
  width: calc(100% - var(--space-8));
}

@supports (backdrop-filter: blur(1px)) {
  .onboarding-tip {
    background: var(--glass-bg-thick);
    backdrop-filter: blur(var(--glass-blur-heavy));
    -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  }
}

.onboarding-tip__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.onboarding-tip__text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
}

.onboarding-tip__progress {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.onboarding-tip__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.onboarding-tip__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
  transition: background var(--duration-fast) ease;
}

.onboarding-tip__btn--next {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.onboarding-tip__btn--next:hover {
  background: var(--color-accent-hover);
}

.onboarding-tip__btn--dismiss {
  background: transparent;
  color: var(--text-tertiary);
}

.onboarding-tip__btn--dismiss:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Transition */
.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity var(--duration-normal) ease, transform var(--duration-normal) ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
