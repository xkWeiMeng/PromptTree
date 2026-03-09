import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native'
import { useRouter, Stack, useFocusEffect } from 'expo-router'
import type { TreeNode } from '@prompttree/shared'
import { getBreadcrumb } from '@prompttree/shared'
import { useTreeStore } from '../stores/tree'
import { copyToClipboard, getPromptVariables } from '../utils/clipboard'
import SearchBar from '../components/SearchBar'
import EmptyState from '../components/EmptyState'
import SwipeableRow from '../components/SwipeableRow'
import ActionSheet from '../components/ActionSheet'
import FolderPicker from '../components/FolderPicker'
import ConfirmDialog from '../components/ConfirmDialog'
import { useI18n } from '../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

export default function SearchScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)

  const nodes = useTreeStore(s => s.nodes)
  const selectedNodeId = useTreeStore(s => s.selectedNodeId)
  const currentFolderId = useTreeStore(s => s.currentFolderId)
  const setViewMode = useTreeStore(s => s.setViewMode)
  const openNode = useTreeStore(s => s.openNode)
  const openPrompt = useTreeStore(s => s.openPrompt)
  const createNode = useTreeStore(s => s.createNode)
  const updateNode = useTreeStore(s => s.updateNode)
  const deleteNode = useTreeStore(s => s.deleteNode)
  const moveNode = useTreeStore(s => s.moveNode)
  const toggleFavorite = useTreeStore(s => s.toggleFavorite)

  const [query, setQuery] = useState('')
  const [actionSheetNode, setActionSheetNode] = useState<TreeNode | null>(null)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [movingNodeId, setMovingNodeId] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState('')
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')

  useFocusEffect(
    useCallback(() => {
      setViewMode('welcome')
    }, [setViewMode])
  )

  const results = useMemo(() => {
    if (!query) return []
    const lowerQ = query.toLowerCase()
    return nodes.filter(
      n =>
        !n.deletedAt &&
        (n.title.toLowerCase().includes(lowerQ) ||
          (n.content && n.content.toLowerCase().includes(lowerQ)))
    )
  }, [nodes, query])

  const handlePress = useCallback((node: TreeNode) => {
    openNode(node.id)
    if (node.type === 'folder') {
      router.replace('/(tabs)')
      return
    }
    router.push(`/prompt/${node.id}`)
  }, [openNode, router])

  const handleCopy = useCallback(async (node: TreeNode) => {
    if (!node.content) {
      Alert.alert(t('workspace.contentEmptyTitle'), t('workspace.contentEmptyMessage'))
      return
    }

    const vars = getPromptVariables(node.content)
    if (vars.length > 0) {
      openPrompt(node.id)
      router.push(`/prompt/${node.id}`)
      return
    }

    await copyToClipboard(node.content)
  }, [openPrompt, router, t])

  const handleLongPress = useCallback((node: TreeNode) => {
    setActionSheetNode(node)
    setShowActionSheet(true)
  }, [])

  const handleDelete = useCallback((node: TreeNode) => {
    setDeleteTargetId(node.id)
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteTargetId) return

    deleteNode(deleteTargetId)
    if (deleteTargetId === currentFolderId) {
      openNode(null)
    }
    setShowDeleteConfirm(false)
    setDeleteTargetId('')
  }, [currentFolderId, deleteNode, deleteTargetId, openNode])

  const handleRename = useCallback(() => {
    if (!actionSheetNode) return
    setRenameNodeId(actionSheetNode.id)
    setRenameText(actionSheetNode.title)
  }, [actionSheetNode])

  const handleRenameSubmit = useCallback(() => {
    if (renameNodeId && renameText.trim()) {
      updateNode(renameNodeId, { title: renameText.trim() })
    }
    setRenameNodeId(null)
    setRenameText('')
  }, [renameNodeId, renameText, updateNode])

  const handleMoveTo = useCallback(() => {
    if (!actionSheetNode) return
    setMovingNodeId(actionSheetNode.id)
    setShowFolderPicker(true)
  }, [actionSheetNode])

  const handleMoveSelect = useCallback((folderId: string | null) => {
    if (movingNodeId) {
      moveNode(movingNodeId, folderId)
    }
    setShowFolderPicker(false)
    setMovingNodeId('')
  }, [moveNode, movingNodeId])

  const handleToggleFavorite = useCallback(() => {
    if (!actionSheetNode) return
    toggleFavorite(actionSheetNode.id)
  }, [actionSheetNode, toggleFavorite])

  const handleActionCopy = useCallback(() => {
    if (!actionSheetNode) return
    void handleCopy(actionSheetNode)
  }, [actionSheetNode, handleCopy])

  const handleActionDelete = useCallback(() => {
    if (!actionSheetNode) return
    handleDelete(actionSheetNode)
  }, [actionSheetNode, handleDelete])

  const handleActionNewFolder = useCallback(() => {
    if (!actionSheetNode || actionSheetNode.type !== 'folder') return
    const id = createNode(actionSheetNode.id, 'folder')
    setRenameNodeId(id)
    setRenameText('')
  }, [actionSheetNode, createNode])

  const handleActionNewPrompt = useCallback(() => {
    if (!actionSheetNode || actionSheetNode.type !== 'folder') return
    const id = createNode(actionSheetNode.id, 'prompt')
    openPrompt(id)
    router.push(`/prompt/${id}`)
  }, [actionSheetNode, createNode, openPrompt, router])

  const renderItem = useCallback(({ item }: { item: TreeNode }) => {
    const path = getBreadcrumb(nodes, item.id)
    const pathStr = path
      .slice(0, -1)
      .map(n => n.title || t('common.untitled'))
      .join(' > ')

    return (
      <SwipeableRow
        onSwipeLeft={item.type === 'prompt' ? () => void handleCopy(item) : undefined}
        onSwipeRight={() => handleDelete(item)}
      >
        <Pressable
          style={[
            styles.item,
            selectedNodeId === item.id && styles.itemSelected,
          ]}
          onPress={() => handlePress(item)}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={500}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemIcon}>
              {item.type === 'folder' ? '📁' : '📄'}
            </Text>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title || t('common.untitled')}
            </Text>
            {item.isFavorite && <Text style={styles.favorite}>⭐</Text>}
          </View>
          {item.content && (
            <Text style={styles.itemPreview} numberOfLines={2}>
              {item.content.slice(0, 100)}
            </Text>
          )}
          {pathStr ? (
            <Text style={styles.itemPath} numberOfLines={1}>
              {pathStr}
            </Text>
          ) : null}
        </Pressable>
      </SwipeableRow>
    )
  }, [handleCopy, handleDelete, handleLongPress, handlePress, nodes, selectedNodeId, t])

  return (
    <>
      <Stack.Screen
        options={{
          title: t('search.title'),
          headerBackTitle: t('common.back'),
        }}
      />
      <View style={styles.container}>
        <SearchBar onSearch={setQuery} />

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

        {query ? (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={
              results.length === 0 ? styles.emptyContainer : styles.listContent
            }
            ListEmptyComponent={
              <EmptyState
                icon="🔍"
                title={t('search.noResultTitle')}
                subtitle={t('search.noResultSubtitle', { query })}
              />
            }
          />
        ) : (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>{t('search.hint')}</Text>
          </View>
        )}

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

        <FolderPicker
          visible={showFolderPicker}
          movingNodeId={movingNodeId}
          onSelect={handleMoveSelect}
          onClose={() => setShowFolderPicker(false)}
        />

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
  listContent: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
  },
  item: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  itemSelected: {
    backgroundColor: colors.primaryBg,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  favorite: {
    marginLeft: spacing.xs,
  },
  itemPreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 26,
    lineHeight: 18,
  },
  itemPath: {
    fontSize: fontSize.xs,
    color: colors.primaryLight,
    marginTop: 4,
    marginLeft: 26,
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
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
})
