<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Keyboard } from 'lucide-vue-next'

const { t } = useI18n()

const visible = ref(false)

function open() {
  visible.value = true
}

function close() {
  visible.value = false
}

defineExpose({ open, close })

interface ShortcutItem {
  keys: string[]
  label: string
}

interface ShortcutCategory {
  title: string
  items: ShortcutItem[]
}

const categories: ShortcutCategory[] = [
  {
    title: 'shortcuts.navigation',
    items: [
      { keys: ['↑'], label: 'shortcuts.navUp' },
      { keys: ['↓'], label: 'shortcuts.navDown' },
      { keys: ['←'], label: 'shortcuts.navLeft' },
      { keys: ['→'], label: 'shortcuts.navRight' },
      { keys: ['Enter'], label: 'shortcuts.navEnter' }
    ]
  },
  {
    title: 'shortcuts.editing',
    items: [
      { keys: ['F2'], label: 'shortcuts.editRename' },
      { keys: ['Ctrl', 'C'], label: 'shortcuts.editCopy' },
      { keys: ['Ctrl', 'X'], label: 'shortcuts.editCut' },
      { keys: ['Ctrl', 'V'], label: 'shortcuts.editPaste' },
      { keys: ['Ctrl', 'Z'], label: 'shortcuts.editUndo' },
      { keys: ['Ctrl', 'H'], label: 'shortcuts.treeFindReplace' }
    ]
  },
  {
    title: 'shortcuts.treeOps',
    items: [
      { keys: ['Ctrl', 'N'], label: 'shortcuts.treeNew' },
      { keys: ['Ctrl', 'Shift', 'N'], label: 'shortcuts.treeNewFolder' },
      { keys: ['Delete'], label: 'shortcuts.treeDelete' },
      { keys: ['Ctrl', 'K'], label: 'shortcuts.treeSearch' },
      { keys: ['Ctrl', 'S'], label: 'shortcuts.treeSync' },
      { keys: ['Ctrl', 'Shift', 'C'], label: 'shortcuts.treeCopyVar' },
      { keys: ['Ctrl', 'Shift', 'O'], label: 'shortcuts.treeOutline' },
      { keys: ['Ctrl', 'Shift', 'M'], label: 'shortcuts.treeMindmap' },
      { keys: ['Ctrl', '?'], label: 'shortcuts.treeShortcuts' }
    ]
  }
]
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="shortcuts-overlay" @click.self="close">
        <div class="shortcuts-panel" role="dialog" :aria-label="t('shortcuts.panelTitle')">
          <div class="panel-header">
            <div class="header-left">
              <Keyboard :size="18" class="header-icon" />
              <h2>{{ t('shortcuts.panelTitle') }}</h2>
            </div>
            <button class="close-btn" :aria-label="t('common.close')" @click="close">
              <X :size="16" />
            </button>
          </div>
          <div class="panel-body">
            <div
              v-for="category in categories"
              :key="category.title"
              class="shortcut-category"
            >
              <h3>{{ t(category.title) }}</h3>
              <div class="shortcut-list">
                <div
                  v-for="item in category.items"
                  :key="item.label"
                  class="shortcut-item"
                >
                  <span class="shortcut-label">{{ t(item.label) }}</span>
                  <span class="shortcut-keys">
                    <kbd v-for="(key, idx) in item.keys" :key="idx">{{ key }}</kbd>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.shortcuts-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.shortcuts-panel {
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-modal);
  width: 520px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 0.5px solid var(--border-secondary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-icon {
  color: var(--color-accent);
}

.panel-header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--duration-fast) ease;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.panel-body {
  padding: var(--space-4) var(--space-5);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.shortcut-category h3 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.shortcut-item:hover {
  background: var(--bg-hover);
}

.shortcut-label {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.shortcut-keys {
  display: flex;
  gap: 4px;
  align-items: center;
}

.shortcut-keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--space-1);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-xs);
  font-family: inherit;
  color: var(--text-secondary);
  box-shadow: 0 1px 0 var(--border-secondary);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-normal) ease;
}

.modal-enter-active .shortcuts-panel,
.modal-leave-active .shortcuts-panel {
  transition: transform var(--duration-normal) var(--ease-out);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .shortcuts-panel {
  transform: scale(0.95);
}

.modal-leave-to .shortcuts-panel {
  transform: scale(0.95);
}
</style>
