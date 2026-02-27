import { onMounted, onUnmounted } from 'vue'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { useSyncStore } from '@/stores/sync'
import { useConfirm } from './useConfirm'
import i18n from '@/entrypoints/popup/i18n'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  action: () => void | Promise<void>
}

/**
 * 检查是否正在编辑（焦点在输入框）
 */
function isEditing(): boolean {
  const active = document.activeElement
  if (!active) return false

  const tagName = active.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' ||
    (active as HTMLElement).isContentEditable
}

/**
 * 检查快捷键是否匹配
 */
function matchShortcut(e: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const key = e.key.toLowerCase()
  const shortcutKey = shortcut.key.toLowerCase()

  // 支持 Ctrl 和 Meta(Cmd) 键互换
  const ctrlOrMeta = e.ctrlKey || e.metaKey
  const needsCtrlOrMeta = shortcut.ctrl || shortcut.meta

  return key === shortcutKey &&
    (needsCtrlOrMeta ? ctrlOrMeta : (!e.ctrlKey && !e.metaKey)) &&
    (shortcut.shift ? e.shiftKey : !e.shiftKey) &&
    (shortcut.alt ? e.altKey : !e.altKey)
}

/**
 * 将树形结构展平为可见节点列表（按显示顺序）
 */
function flattenVisibleNodes(
  roots: TreeNodeWithChildren[],
  expandedIds: Set<string>
): TreeNodeWithChildren[] {
  const result: TreeNodeWithChildren[] = []

  function traverse(nodes: TreeNodeWithChildren[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.type === 'folder' && expandedIds.has(node.id) && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }

  traverse(roots)
  return result
}

/**
 * 键盘快捷键组合式函数
 */
export function useKeyboard(options?: {
  onCreatePrompt?: () => void
  onCreateFolder?: () => void
  onDelete?: () => void
  onSearch?: () => void
  onCopyWithVariables?: () => void
}) {
  const treeStore = useTreeStore()
  const syncStore = useSyncStore()
  const { confirmDanger } = useConfirm()
  const t = i18n.global.t

  /**
   * 删除选中节点
   */
  async function deleteSelectedNode() {
    if (isEditing()) return

    const node = treeStore.selectedNode
    if (!node) return

    const confirmed = await confirmDanger(
      t('tree.deleteConfirmMsg', { name: node.title || t('common.untitled') }),
      t('tree.deleteConfirmTitle')
    )

    if (confirmed) {
      await treeStore.deleteNode(node.id)
      options?.onDelete?.()
    }
  }

  /**
   * 获取可见节点列表中当前选中节点的索引
   */
  function getVisibleNodesAndIndex(): { visibleNodes: TreeNodeWithChildren[]; currentIndex: number } {
    const visibleNodes = flattenVisibleNodes(treeStore.rootNodes, treeStore.expandedIds)
    const currentIndex = treeStore.selectedNodeId
      ? visibleNodes.findIndex(n => n.id === treeStore.selectedNodeId)
      : -1
    return { visibleNodes, currentIndex }
  }

  // 定义快捷键
  const shortcuts: KeyboardShortcut[] = [
    // =================== 全局快捷键 ===================
    {
      key: 'k',
      ctrl: true,
      description: 'Open search',
      action: () => options?.onSearch?.()
    },
    {
      key: 'n',
      ctrl: true,
      description: 'New Prompt',
      action: () => options?.onCreatePrompt?.()
    },
    {
      key: 'N',
      ctrl: true,
      shift: true,
      description: 'New Folder',
      action: () => options?.onCreateFolder?.()
    },
    {
      key: 's',
      ctrl: true,
      description: 'Force Sync',
      action: async () => { await syncStore.triggerSync() }
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      description: 'Copy prompt with variable fill',
      action: () => {
        if (isEditing()) return
        const node = treeStore.selectedNode
        if (!node || node.type !== 'prompt') return
        options?.onCopyWithVariables?.()
      }
    },
    // =================== 树形面板快捷键 ===================
    {
      key: 'ArrowUp',
      description: 'Select previous node',
      action: () => {
        if (isEditing()) return
        const { visibleNodes, currentIndex } = getVisibleNodesAndIndex()
        if (visibleNodes.length === 0) return

        if (currentIndex <= 0) {
          treeStore.selectNode(visibleNodes[0].id)
        } else {
          treeStore.selectNode(visibleNodes[currentIndex - 1].id)
        }
      }
    },
    {
      key: 'ArrowDown',
      description: 'Select next node',
      action: () => {
        if (isEditing()) return
        const { visibleNodes, currentIndex } = getVisibleNodesAndIndex()
        if (visibleNodes.length === 0) return

        if (currentIndex === -1) {
          treeStore.selectNode(visibleNodes[0].id)
        } else if (currentIndex < visibleNodes.length - 1) {
          treeStore.selectNode(visibleNodes[currentIndex + 1].id)
        }
      }
    },
    {
      key: 'ArrowLeft',
      description: 'Collapse folder',
      action: () => {
        if (isEditing()) return
        const node = treeStore.selectedNode
        if (!node) return

        if (node.type === 'folder' && treeStore.expandedIds.has(node.id)) {
          treeStore.toggleExpanded(node.id)
        } else if (node.parentId) {
          treeStore.selectNode(node.parentId)
        }
      }
    },
    {
      key: 'ArrowRight',
      description: 'Expand folder',
      action: () => {
        if (isEditing()) return
        const node = treeStore.selectedNode
        if (!node) return

        if (node.type === 'folder') {
          if (!treeStore.expandedIds.has(node.id)) {
            treeStore.toggleExpanded(node.id)
          } else {
            const children = treeStore.nodes.filter(
              n => n.parentId === node.id && n.deletedAt === null
            ).sort((a, b) => a.sortOrder - b.sortOrder)
            if (children.length > 0) {
              treeStore.selectNode(children[0].id)
            }
          }
        }
      }
    },
    {
      key: 'Enter',
      description: 'Open selected prompt / Toggle folder',
      action: () => {
        if (isEditing()) return
        const node = treeStore.selectedNode
        if (!node) return

        if (node.type === 'folder') {
          treeStore.toggleExpanded(node.id)
        }
      }
    },
    {
      key: 'F2',
      description: 'Rename selected node',
      action: () => {
        if (isEditing()) return
        const node = treeStore.selectedNode
        if (!node) return
        treeStore.startEditing(node.id)
      }
    },
    {
      key: 'Delete',
      description: 'Delete selected node',
      action: deleteSelectedNode
    },
    {
      key: 'Backspace',
      description: 'Delete selected node (Mac)',
      action: deleteSelectedNode
    },
    {
      key: 'Escape',
      description: 'Deselect',
      action: () => {
        if (isEditing()) return
        treeStore.selectNode(null)
      }
    },
  ]

  // 键盘事件处理
  function handleKeydown(e: KeyboardEvent) {
    for (const shortcut of shortcuts) {
      if (matchShortcut(e, shortcut)) {
        if (shortcut.ctrl || shortcut.meta) {
          e.preventDefault()
        }
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'f2'].includes(e.key.toLowerCase())) {
          if (!isEditing()) {
            e.preventDefault()
          }
        }
        shortcut.action()
        return
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    shortcuts
  }
}
