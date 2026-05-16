import { onMounted, onUnmounted, ref } from 'vue'
import type { TreeNode, TreeNodeWithChildren } from '@prompttree/shared'
import { useTreeStore } from '@/stores/tree'
import { useSyncStore } from '@/stores/sync'
import { useConfirm } from './useConfirm'
import { useToast } from './useToast'
import { i18n } from '@/i18n'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  action: () => void | Promise<void>
}

// Module-level state for copy/paste
const copiedNode = ref<TreeNode | null>(null)
const isCutOperation = ref(false)

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
 * 仅包含已展开的文件夹的子节点
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
  onUndo?: () => void
  onShowShortcuts?: () => void
  onFindReplace?: () => void
}) {
  const treeStore = useTreeStore()
  const syncStore = useSyncStore()
  const { confirmDanger } = useConfirm()

  /**
   * 删除选中节点的公共逻辑
   */
  async function deleteSelectedNode() {
    if (isEditing()) return
    
    const node = treeStore.selectedNode
    if (!node) return
    
    const confirmed = await confirmDanger(
      i18n.global.t('tree.deleteConfirmMsg', { name: node.title || i18n.global.t('common.untitled') }),
      i18n.global.t('tree.deleteConfirmTitle')
    )
    
    if (confirmed) {
      await treeStore.deleteNode(node.id)
      options?.onDelete?.()
    }
  }

  /**
   * 获取可见节点列表中当前选中节点的索引
   */
  function getVisibleNodesAndIndex(): { visibleNodes: TreeNodeWithChildren[], currentIndex: number } {
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
      description: 'Open global search',
      action: () => {
        options?.onSearch?.()
      }
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
      action: async () => { await syncStore.sync() }
    },
    {
      key: 'z',
      ctrl: true,
      description: 'Undo',
      action: () => {
        if (isEditing()) return
        options?.onUndo?.()
      }
    },
    {
      key: '/',
      ctrl: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        options?.onShowShortcuts?.()
      }
    },
    {
      key: 'h',
      ctrl: true,
      description: 'Find and Replace',
      action: () => {
        options?.onFindReplace?.()
      }
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
    {
      key: 'c',
      ctrl: true,
      description: 'Copy selected node',
      action: () => {
        if (isEditing()) return
        const node = treeStore.selectedNode
        if (!node) return
        copiedNode.value = { ...node }
        isCutOperation.value = false
        const toast = useToast()
        toast.success(i18n.global.t('tree.nodeCopied'))
      }
    },
    {
      key: 'x',
      ctrl: true,
      description: 'Cut selected node',
      action: () => {
        if (isEditing()) return
        const node = treeStore.selectedNode
        if (!node) return
        copiedNode.value = { ...node }
        isCutOperation.value = true
        const toast = useToast()
        toast.success(i18n.global.t('tree.nodeCut'))
      }
    },
    {
      key: 'v',
      ctrl: true,
      description: 'Paste copied node',
      action: async () => {
        if (isEditing()) return
        if (!copiedNode.value) return

        const selected = treeStore.selectedNode
        const parentId = selected
          ? (selected.type === 'folder' ? selected.id : selected.parentId)
          : null

        await treeStore.createNode({
          type: copiedNode.value.type,
          parentId,
          title: copiedNode.value.title,
          content: copiedNode.value.content || ''
        })

        if (isCutOperation.value) {
          await treeStore.deleteNode(copiedNode.value.id)
          copiedNode.value = null
          isCutOperation.value = false
        }
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
          // 没有选中项或已在顶部，选中第一个
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
          // 没有选中项，选中第一个
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
          // 当前是展开的文件夹，折叠它
          treeStore.toggleExpanded(node.id)
        } else if (node.parentId) {
          // 不是文件夹或已折叠，跳转到父节点
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
            // 当前是折叠的文件夹，展开它
            treeStore.toggleExpanded(node.id)
          } else {
            // 已展开，选中第一个子节点
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
      description: 'Open selected prompt',
      action: () => {
        if (isEditing()) return
        const node = treeStore.selectedNode
        if (!node) return
        
        if (node.type === 'prompt') {
          // 打开 prompt 编辑器
          treeStore.selectNode(node.id)
        } else if (node.type === 'folder') {
          // 文件夹则切换展开/折叠
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
      description: 'Close editor / Deselect',
      action: () => {
        if (isEditing()) return
        if (treeStore.viewMode === 'editor') {
          treeStore.closeEditor()
        } else {
          treeStore.selectNode(null)
        }
      }
    },
    {
      key: 'o',
      ctrl: true,
      shift: true,
      description: 'Toggle outline view',
      action: () => {
        treeStore.setViewMode(treeStore.viewMode === 'outline' ? 'welcome' : 'outline')
      }
    },
    {
      key: 'm',
      ctrl: true,
      shift: true,
      description: 'Toggle mind map view',
      action: () => {
        treeStore.setViewMode(treeStore.viewMode === 'mindmap' ? 'welcome' : 'mindmap')
      }
    }
  ]
  
  // 键盘事件处理
  function handleKeydown(e: KeyboardEvent) {
    for (const shortcut of shortcuts) {
      if (matchShortcut(e, shortcut)) {
        // 某些快捷键需要阻止默认行为
        if (shortcut.ctrl || shortcut.meta) {
          e.preventDefault()
        }
        // 方向键和功能键也需要阻止默认行为（防止页面滚动等）
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
