import React, { useState, useCallback } from 'react'
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native'
import type { TreeNode } from '@prompttree/shared'
import { isAncestor } from '@prompttree/shared'
import { useTreeStore } from '../stores/tree'
import { useI18n } from '../i18n'
import { useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

// ===================
// Props
// ===================

interface FolderPickerProps {
  visible: boolean
  /** 正在移动的节点 ID（用于禁止移动到自身或子孙下） */
  movingNodeId: string
  onSelect: (folderId: string | null) => void
  onClose: () => void
}

// ===================
// 组件
// ===================

export default function FolderPicker({
  visible,
  movingNodeId,
  onSelect,
  onClose,
}: FolderPickerProps) {
  const { t } = useI18n()
  const styles = useThemedStyles(createStyles)
  const nodes = useTreeStore(s => s.nodes)
  const getChildren = useTreeStore(s => s.getChildren)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<TreeNode[]>([])

  /** 获取当前层级的文件夹列表（排除被移动的节点及其子孙） */
  const getFolders = useCallback(() => {
    const children = getChildren(currentFolderId)
    return children.filter(n => {
      if (n.type !== 'folder') return false
      if (n.id === movingNodeId) return false
      // 不能移动到自身子孙下
      if (isAncestor(nodes, movingNodeId, n.id)) return false
      return true
    })
  }, [currentFolderId, movingNodeId, nodes, getChildren])

  const folders = getFolders()

  /** 进入子文件夹 */
  const navigateInto = (folder: TreeNode) => {
    setBreadcrumb(prev => [...prev, folder])
    setCurrentFolderId(folder.id)
  }

  /** 返回上一层 */
  const navigateBack = () => {
    setBreadcrumb(prev => {
      const next = prev.slice(0, -1)
      setCurrentFolderId(next.length > 0 ? next[next.length - 1].id : null)
      return next
    })
  }

  /** 选择当前文件夹 */
  const handleSelect = () => {
    onSelect(currentFolderId)
    // 重置状态
    setCurrentFolderId(null)
    setBreadcrumb([])
  }

  /** 关闭并重置 */
  const handleClose = () => {
    setCurrentFolderId(null)
    setBreadcrumb([])
    onClose()
  }

  const currentTitle = breadcrumb.length > 0
    ? breadcrumb[breadcrumb.length - 1].title || t('common.untitled')
    : t('workspace.rootFolder')

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 头部 */}
          <View style={styles.header}>
            <Pressable onPress={handleClose}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{t('folderPicker.title')}</Text>
            <Pressable onPress={handleSelect}>
              <Text style={styles.confirmText}>{t('common.confirm')}</Text>
            </Pressable>
          </View>

          {/* 当前路径 */}
          <View style={styles.pathRow}>
            {breadcrumb.length > 0 && (
              <Pressable onPress={navigateBack} hitSlop={8}>
                <Text style={styles.backButton}>{t('folderPicker.back')}</Text>
              </Pressable>
            )}
            <Text style={styles.pathText}>📁 {currentTitle}</Text>
          </View>

          {/* 文件夹列表 */}
          <FlatList
            data={folders}
            keyExtractor={item => item.id}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('folderPicker.noSubfolders')}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.folderItem,
                  pressed && styles.folderItemPressed,
                ]}
                onPress={() => navigateInto(item)}
              >
                <Text style={styles.folderIcon}>📁</Text>
                <Text style={styles.folderName} numberOfLines={1}>
                  {item.title || t('common.untitledFolder')}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  )
}

// ===================
// 样式
// ===================

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  confirmText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginRight: spacing.md,
  },
  pathText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  folderItemPressed: {
    backgroundColor: colors.surface,
  },
  folderIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  folderName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  chevron: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
})
