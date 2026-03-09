import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, Alert, StyleSheet, TextInput } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import type { TreeNode } from '@prompttree/shared'
import { getBreadcrumb } from '@prompttree/shared'
import { useTreeStore, type ViewMode } from '../../stores/tree'
import TreeList from '../../components/TreeList'
import Breadcrumb from '../../components/Breadcrumb'
import ActionSheet from '../../components/ActionSheet'
import FolderPicker from '../../components/FolderPicker'
import ConfirmDialog from '../../components/ConfirmDialog'
import WorkspaceModeSwitcher from '../../components/WorkspaceModeSwitcher'
import { copyPromptDirect, getPromptVariables } from '../../utils/clipboard'
import { useI18n } from '../../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../../utils/theme'

export default function HomeScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)

  // ===================
  // Store
  // ===================
  const loadNodes = useTreeStore(s => s.loadNodes)
  const nodes = useTreeStore(s => s.nodes)
  const selectedNodeId = useTreeStore(s => s.selectedNodeId)
  const currentFolderId = useTreeStore(s => s.currentFolderId)
  const viewMode = useTreeStore(s => s.viewMode)
  const createNode = useTreeStore(s => s.createNode)
  const deleteNode = useTreeStore(s => s.deleteNode)
  const toggleFavorite = useTreeStore(s => s.toggleFavorite)
  const moveNode = useTreeStore(s => s.moveNode)
  const setViewMode = useTreeStore(s => s.setViewMode)
  const openFolder = useTreeStore(s => s.openFolder)
  const openPrompt = useTreeStore(s => s.openPrompt)

  const selectedPrompt = nodes.find(node => node.id === selectedNodeId && node.type === 'prompt') ?? null

  // ===================
  // 本地状态
  // ===================
  const [actionSheetNode, setActionSheetNode] = useState<TreeNode | null>(null)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [movingNodeId, setMovingNodeId] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string>('')
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')

  // ===================
  // 初始化
  // ===================
  useEffect(() => {
    loadNodes()
  }, [loadNodes])

  useFocusEffect(
    useCallback(() => {
      setViewMode('welcome')
    }, [setViewMode])
  )

  // ===================
  // 面包屑
  // ===================
  const breadcrumbPath = currentFolderId
    ? getBreadcrumb(nodes, currentFolderId)
    : []

  // ===================
  // 导航
  // ===================
  const handleNavigateFolder = useCallback((id: string) => {
    openFolder(id)
  }, [openFolder])

  const handleSelectPrompt = useCallback((id: string) => {
    openPrompt(id)
    router.push(`/prompt/${id}`)
  }, [openPrompt, router])

  const handleBreadcrumbNavigate = useCallback((nodeId: string | null) => {
    openFolder(nodeId)
  }, [openFolder])

  const handleOpenSearch = useCallback(() => {
    router.push('/search')
  }, [router])

  const handleSwitchMode = useCallback((mode: ViewMode) => {
    if (mode === 'welcome') {
      setViewMode('welcome')
      return
    }

    if (mode === 'editor') {
      if (!selectedPrompt) {
        Alert.alert(t('workspace.selectPromptToEditTitle'), t('workspace.selectPromptToEditMessage'))
        return
      }
      openPrompt(selectedPrompt.id)
      router.push(`/prompt/${selectedPrompt.id}`)
      return
    }

    setViewMode(mode)
    router.push(mode === 'outline' ? '/outline' : '/mindmap')
  }, [openPrompt, router, selectedPrompt, setViewMode, t])

  // ===================
  // 操作
  // ===================
  const handleLongPress = useCallback((node: TreeNode) => {
    setActionSheetNode(node)
    setShowActionSheet(true)
  }, [])

  const handleCopy = useCallback(async (node: TreeNode) => {
    if (!node.content) {
      Alert.alert(t('workspace.contentEmptyTitle'), t('workspace.contentEmptyMessage'))
      return
    }
    const vars = getPromptVariables(node.content)
    if (vars.length > 0) {
      openPrompt(node.id)
      router.push(`/prompt/${node.id}`)
    } else {
      await copyPromptDirect(node.content, t)
    }
  }, [openPrompt, router, t])

  const handleDelete = useCallback((node: TreeNode) => {
    setDeleteTargetId(node.id)
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deleteTargetId) {
      deleteNode(deleteTargetId)
      if (deleteTargetId === currentFolderId) {
        openFolder(null)
      }
    }
    setShowDeleteConfirm(false)
    setDeleteTargetId('')
  }, [deleteTargetId, currentFolderId, deleteNode, openFolder])

  const handleNewFolder = useCallback(() => {
    const id = createNode(currentFolderId, 'folder')
    setRenameNodeId(id)
    setRenameText('')
    setShowNewMenu(false)
  }, [currentFolderId, createNode])

  const handleNewPrompt = useCallback(() => {
    const id = createNode(currentFolderId, 'prompt')
    setShowNewMenu(false)
    openPrompt(id)
    router.push(`/prompt/${id}`)
  }, [currentFolderId, createNode, openPrompt, router])

  const handleRename = useCallback(() => {
    if (actionSheetNode) {
      setRenameNodeId(actionSheetNode.id)
      setRenameText(actionSheetNode.title)
    }
  }, [actionSheetNode])

  const handleRenameSubmit = useCallback(() => {
    if (renameNodeId && renameText.trim()) {
      useTreeStore.getState().updateNode(renameNodeId, { title: renameText.trim() })
    }
    setRenameNodeId(null)
    setRenameText('')
  }, [renameNodeId, renameText])

  const handleMoveTo = useCallback(() => {
    if (actionSheetNode) {
      setMovingNodeId(actionSheetNode.id)
      setShowFolderPicker(true)
    }
  }, [actionSheetNode])

  const handleMoveSelect = useCallback((folderId: string | null) => {
    if (movingNodeId) {
      moveNode(movingNodeId, folderId)
    }
    setShowFolderPicker(false)
    setMovingNodeId('')
  }, [movingNodeId, moveNode])

  const handleToggleFavorite = useCallback(() => {
    if (actionSheetNode) {
      toggleFavorite(actionSheetNode.id)
    }
  }, [actionSheetNode, toggleFavorite])

  const handleActionCopy = useCallback(() => {
    if (actionSheetNode) {
      handleCopy(actionSheetNode)
    }
  }, [actionSheetNode, handleCopy])

  const handleActionDelete = useCallback(() => {
    if (actionSheetNode) {
      handleDelete(actionSheetNode)
    }
  }, [actionSheetNode, handleDelete])

  const handleActionNewFolder = useCallback(() => {
    if (actionSheetNode && actionSheetNode.type === 'folder') {
      const id = createNode(actionSheetNode.id, 'folder')
      setRenameNodeId(id)
      setRenameText('')
    }
  }, [actionSheetNode, createNode])

  const handleActionNewPrompt = useCallback(() => {
    if (actionSheetNode && actionSheetNode.type === 'folder') {
      const id = createNode(actionSheetNode.id, 'prompt')
      openPrompt(id)
      router.push(`/prompt/${id}`)
    }
  }, [actionSheetNode, createNode, openPrompt, router])

  // ===================
  // 渲染
  // ===================
  return (
    <View style={styles.container}>
      {/* 面包屑导航 */}
      <Breadcrumb
        path={breadcrumbPath}
        onNavigate={handleBreadcrumbNavigate}
      />

      <WorkspaceModeSwitcher
        mode={viewMode}
        hasSelectedPrompt={!!selectedPrompt}
        onSwitchMode={handleSwitchMode}
      />

      <View style={styles.workspaceActions}>
        <Pressable style={styles.searchButton} onPress={handleOpenSearch}>
          <Text style={styles.searchButtonText}>{t('workspace.searchWorkspace')}</Text>
        </Pressable>
        <View style={styles.modeEntryRow}>
          <Pressable style={styles.modeEntryBtn} onPress={() => handleSwitchMode('outline')}>
            <Text style={styles.modeEntryTitle}>{t('workspace.outlineTitle')}</Text>
            <Text style={styles.modeEntryDesc}>{t('workspace.outlineDesc')}</Text>
          </Pressable>
          <Pressable style={styles.modeEntryBtn} onPress={() => handleSwitchMode('mindmap')}>
            <Text style={styles.modeEntryTitle}>{t('workspace.mindmapTitle')}</Text>
            <Text style={styles.modeEntryDesc}>{t('workspace.mindmapDesc')}</Text>
          </Pressable>
        </View>
        {selectedPrompt ? (
          <Pressable style={styles.resumeButton} onPress={() => handleSwitchMode('editor')}>
            <Text style={styles.resumeLabel}>{t('workspace.resumeEditing')}</Text>
            <Text style={styles.resumeTitle} numberOfLines={1}>
              {selectedPrompt.title || t('common.untitledPrompt')}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.workspaceHint}>{t('workspace.selectPromptHint')}</Text>
        )}
      </View>

      {/* 重命名输入框 */}
      {renameNodeId && (
        <View style={styles.renameBar}>
          <TextInput
            style={styles.renameInput}
            value={renameText}
            onChangeText={setRenameText}
            placeholder={t('workspace.renamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={handleRenameSubmit}
            onBlur={handleRenameSubmit}
          />
        </View>
      )}

      {/* 树列表 */}
      <TreeList
        folderId={currentFolderId}
        onNavigateFolder={handleNavigateFolder}
        onSelectPrompt={handleSelectPrompt}
        onLongPress={handleLongPress}
        onCopy={handleCopy}
        onDelete={handleDelete}
      />

      {/* 新建按钮 */}
      <View style={styles.fabContainer}>
        {showNewMenu && (
          <View style={styles.fabMenu}>
            <Pressable style={styles.fabMenuItem} onPress={handleNewFolder}>
              <Text style={styles.fabMenuText}>📁 {t('tree.newFolder')}</Text>
            </Pressable>
            <Pressable style={styles.fabMenuItem} onPress={handleNewPrompt}>
              <Text style={styles.fabMenuText}>📄 {t('tree.newPrompt')}</Text>
            </Pressable>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={() => setShowNewMenu(!showNewMenu)}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      {/* ActionSheet */}
      <ActionSheet
        visible={showActionSheet}
        node={actionSheetNode}
        onClose={() => setShowActionSheet(false)}
        onNewFolder={handleActionNewFolder}
        onNewPrompt={handleActionNewPrompt}
        onRename={handleRename}
        onMoveTo={handleMoveTo}
        onToggleFavorite={handleToggleFavorite}
        onCopy={handleActionCopy}
        onDelete={handleActionDelete}
      />

      {/* 文件夹选择器 */}
      <FolderPicker
        visible={showFolderPicker}
        movingNodeId={movingNodeId}
        onSelect={handleMoveSelect}
        onClose={() => setShowFolderPicker(false)}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title={t('workspace.deleteTitle')}
        message={t('workspace.deleteMessage')}
        confirmText={t('common.delete')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  )
}

// ===================
// 样式
// ===================

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  workspaceActions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  searchButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  searchButtonText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  modeEntryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modeEntryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  modeEntryTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  modeEntryDesc: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  resumeButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryBg,
  },
  resumeLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  resumeTitle: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  workspaceHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  renameBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  renameInput: {
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    alignItems: 'flex-end',
  },
  fabMenu: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  fabMenuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  fabMenuText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabPressed: {
    backgroundColor: colors.primaryLight,
  },
  fabText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
    marginTop: -2,
  },
})
