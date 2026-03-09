import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, Alert, StyleSheet, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router'
import type { TreeNode } from '@prompttree/shared'
import { getBreadcrumb } from '@prompttree/shared'
import { useTreeStore } from '../../stores/tree'
import TreeList from '../../components/TreeList'
import Breadcrumb from '../../components/Breadcrumb'
import ActionSheet from '../../components/ActionSheet'
import FolderPicker from '../../components/FolderPicker'
import ConfirmDialog from '../../components/ConfirmDialog'
import { copyPromptDirect, getPromptVariables } from '../../utils/clipboard'
import { useI18n } from '../../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../../utils/theme'

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)

  // ===================
  // Store
  // ===================
  const nodes = useTreeStore(s => s.nodes)
  const createNode = useTreeStore(s => s.createNode)
  const deleteNode = useTreeStore(s => s.deleteNode)
  const toggleFavorite = useTreeStore(s => s.toggleFavorite)
  const moveNode = useTreeStore(s => s.moveNode)
  const currentFolderId = useTreeStore(s => s.currentFolderId)
  const getNode = useTreeStore(s => s.getNode)
  const setViewMode = useTreeStore(s => s.setViewMode)
  const openFolder = useTreeStore(s => s.openFolder)
  const openPrompt = useTreeStore(s => s.openPrompt)

  // ===================
  // 当前文件夹
  // ===================
  const activeFolderId = currentFolderId ?? id ?? null
  const currentFolder = activeFolderId ? getNode(activeFolderId) : undefined

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

  // 路由参数变化时更新
  useEffect(() => {
    if (id) {
      openFolder(id)
    }
  }, [id, openFolder])

  useFocusEffect(
    useCallback(() => {
      setViewMode('welcome')
    }, [setViewMode])
  )

  // ===================
  // 面包屑
  // ===================
  const breadcrumbPath = activeFolderId ? getBreadcrumb(nodes, activeFolderId) : []

  // ===================
  // 导航
  // ===================
  const handleNavigateFolder = useCallback((folderId: string) => {
    openFolder(folderId)
  }, [openFolder])

  const handleSelectPrompt = useCallback((promptId: string) => {
    openPrompt(promptId)
    router.push(`/prompt/${promptId}`)
  }, [openPrompt, router])

  const handleBreadcrumbNavigate = useCallback((nodeId: string | null) => {
    if (nodeId === null) {
      openFolder(null)
      router.replace('/(tabs)')
    } else {
      openFolder(nodeId)
    }
  }, [openFolder, router])

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
      if (deleteTargetId === activeFolderId) {
        openFolder(null)
        router.replace('/(tabs)')
      }
    }
    setShowDeleteConfirm(false)
    setDeleteTargetId('')
  }, [activeFolderId, deleteTargetId, deleteNode, openFolder, router])

  const handleNewFolder = useCallback(() => {
    const newId = createNode(activeFolderId, 'folder')
    setRenameNodeId(newId)
    setRenameText('')
    setShowNewMenu(false)
  }, [activeFolderId, createNode])

  const handleNewPrompt = useCallback(() => {
    const newId = createNode(activeFolderId, 'prompt')
    setShowNewMenu(false)
    openPrompt(newId)
    router.push(`/prompt/${newId}`)
  }, [activeFolderId, createNode, openPrompt, router])

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
    if (actionSheetNode) toggleFavorite(actionSheetNode.id)
  }, [actionSheetNode, toggleFavorite])

  const handleActionCopy = useCallback(() => {
    if (actionSheetNode) handleCopy(actionSheetNode)
  }, [actionSheetNode, handleCopy])

  const handleActionDelete = useCallback(() => {
    if (actionSheetNode) handleDelete(actionSheetNode)
  }, [actionSheetNode, handleDelete])

  const handleActionNewFolder = useCallback(() => {
    if (actionSheetNode && actionSheetNode.type === 'folder') {
      const newId = createNode(actionSheetNode.id, 'folder')
      setRenameNodeId(newId)
      setRenameText('')
    }
  }, [actionSheetNode, createNode])

  const handleActionNewPrompt = useCallback(() => {
    if (actionSheetNode && actionSheetNode.type === 'folder') {
      const newId = createNode(actionSheetNode.id, 'prompt')
      openPrompt(newId)
      router.push(`/prompt/${newId}`)
    }
  }, [actionSheetNode, createNode, openPrompt, router])

  // ===================
  // 渲染
  // ===================
  return (
    <>
      <Stack.Screen
        options={{
          title: currentFolder?.title || t('common.untitledFolder'),
          headerBackTitle: t('common.back'),
        }}
      />
      <View style={styles.container}>
        {/* 面包屑 */}
        <Breadcrumb
          path={breadcrumbPath}
          onNavigate={handleBreadcrumbNavigate}
        />

        {/* 重命名 */}
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

        {/* 列表 */}
        <TreeList
          folderId={activeFolderId}
          onNavigateFolder={handleNavigateFolder}
          onSelectPrompt={handleSelectPrompt}
          onLongPress={handleLongPress}
          onCopy={handleCopy}
          onDelete={handleDelete}
        />

        {/* FAB */}
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
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
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
    </>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
