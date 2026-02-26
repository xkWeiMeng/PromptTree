import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { TreeNode } from '@prompttree/shared'
import { colors, spacing, fontSize } from '../utils/theme'

// ===================
// Props
// ===================

interface NodeItemProps {
  node: TreeNode
  onPress: (node: TreeNode) => void
  onLongPress?: (node: TreeNode) => void
}

// ===================
// 组件
// ===================

export default function NodeItem({ node, onPress, onLongPress }: NodeItemProps) {
  const isFolder = node.type === 'folder'

  /** 显示标题：空标题时取内容前20字符 */
  const displayTitle = node.title
    || (node.content ? node.content.slice(0, 20) + (node.content.length > 20 ? '...' : '') : '')
    || (isFolder ? '未命名文件夹' : '未命名 Prompt')

  /** 内容预览（仅 Prompt） */
  const preview = !isFolder && node.content
    ? node.content.slice(0, 50) + (node.content.length > 50 ? '...' : '')
    : null

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={() => onPress(node)}
      onLongPress={() => onLongPress?.(node)}
      delayLongPress={500}
    >
      {/* 图标 */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{isFolder ? '📁' : '📄'}</Text>
      </View>

      {/* 标题 + 预览 */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {displayTitle}
          </Text>
          {node.isFavorite && <Text style={styles.favorite}>⭐</Text>}
        </View>
        {preview && (
          <Text style={styles.preview} numberOfLines={1}>
            {preview}
          </Text>
        )}
      </View>

      {/* 右侧箭头（文件夹）或无 */}
      {isFolder && (
        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      )}
    </Pressable>
  )
}

// ===================
// 样式
// ===================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  favorite: {
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  chevronText: {
    fontSize: 22,
    color: colors.textTertiary,
    fontWeight: '300',
  },
})
