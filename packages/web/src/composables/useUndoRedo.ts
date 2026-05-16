import { ref, computed } from 'vue'
import type { TreeNode } from '@prompttree/shared'
import * as dbOps from '@/db/operations'
import { useTreeStore } from '@/stores/tree'
import { useToast } from './useToast'
import { i18n } from '@/i18n'

export interface UndoEntry {
  type: 'delete' | 'move' | 'update'
  nodeSnapshot: TreeNode
  parentId?: string | null
  sortOrder?: number
}

const MAX_HISTORY = 20
const undoStack = ref<UndoEntry[]>([])

export function useUndoRedo() {
  const canUndo = computed(() => undoStack.value.length > 0)

  function pushUndo(entry: UndoEntry) {
    undoStack.value.push(entry)
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }
  }

  async function undo() {
    const entry = undoStack.value.pop()
    if (!entry) return

    const treeStore = useTreeStore()
    const toast = useToast()

    // Restore the node snapshot
    await dbOps.upsertNode(entry.nodeSnapshot, true)
    await treeStore.loadFromDB()

    toast.success(i18n.global.t('common.undoSuccess'))
  }

  function clearHistory() {
    undoStack.value = []
  }

  return {
    canUndo,
    pushUndo,
    undo,
    clearHistory
  }
}
