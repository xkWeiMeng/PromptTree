import React, { useCallback } from 'react'
import { FlatList, RefreshControl, StyleSheet } from 'react-native'
import type { TreeNode } from '@prompttree/shared'
import { useTreeStore } from '../stores/tree'
import NodeItem from './NodeItem'
import SwipeableRow from './SwipeableRow'
import EmptyState from './EmptyState'
import { useI18n } from '../i18n'
import { useTheme, useThemedStyles, type ThemeColors } from '../utils/theme'

// ===================
// Props
// ===================

interface TreeListProps {
  /** 当前文件夹 ID, null = 根目录 */
  folderId: string | null
  /** 点击文件夹进入下一层 */
  onNavigateFolder: (id: string) => void
  /** 点击 Prompt 查看详情 */
  onSelectPrompt: (id: string) => void
  /** 长按节点 */
  onLongPress?: (node: TreeNode) => void
  /** 右滑复制 */
  onCopy?: (node: TreeNode) => void
  /** 左滑删除 */
  onDelete?: (node: TreeNode) => void
  /** 是否正在刷新 */
  refreshing?: boolean
  /** 下拉刷新回调 */
  onRefresh?: () => void
}

// ===================
// 组件
// ===================

export default function TreeList({
  folderId,
  onNavigateFolder,
  onSelectPrompt,
  onLongPress,
  onCopy,
  onDelete,
  refreshing = false,
  onRefresh,
}: TreeListProps) {
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const getChildren = useTreeStore(s => s.getChildren)
  const selectedNodeId = useTreeStore(s => s.selectedNodeId)
  const children = getChildren(folderId)

  const handlePress = useCallback((node: TreeNode) => {
    if (node.type === 'folder') {
      onNavigateFolder(node.id)
    } else {
      onSelectPrompt(node.id)
    }
  }, [onNavigateFolder, onSelectPrompt])

  const renderItem = useCallback(({ item }: { item: TreeNode }) => {
    const isPrompt = item.type === 'prompt'

    return (
      <SwipeableRow
        onSwipeLeft={isPrompt && onCopy ? () => onCopy(item) : undefined}
        onSwipeRight={onDelete ? () => onDelete(item) : undefined}
      >
        <NodeItem
          node={item}
          onPress={handlePress}
          onLongPress={onLongPress}
          isSelected={selectedNodeId === item.id}
        />
      </SwipeableRow>
    )
  }, [handlePress, onLongPress, onCopy, onDelete, selectedNodeId])

  const keyExtractor = useCallback((item: TreeNode) => item.id, [])

  if (children.length === 0) {
    return (
      <EmptyState
        icon="📂"
        title={t('workspace.emptyTitle')}
        subtitle={t('workspace.emptySubtitle')}
      />
    )
  }

  return (
    <FlatList
      data={children}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    />
  )
}

// ===================
// 样式
// ===================

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
})
