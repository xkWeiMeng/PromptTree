import React from 'react'
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import type { TreeNode } from '@prompttree/shared'
import { useI18n } from '../i18n'
import { useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

// ===================
// Props
// ===================

interface ActionSheetProps {
  visible: boolean
  node: TreeNode | null
  onClose: () => void
  onNewFolder?: () => void
  onNewPrompt?: () => void
  onRename?: () => void
  onMoveTo?: () => void
  onToggleFavorite?: () => void
  onCopy?: () => void
  onDelete?: () => void
}

// ===================
// 菜单项
// ===================

interface ActionItem {
  icon: string
  label: string
  onPress: () => void
  danger?: boolean
  show: boolean
}

// ===================
// 组件
// ===================

export default function ActionSheet({
  visible,
  node,
  onClose,
  onNewFolder,
  onNewPrompt,
  onRename,
  onMoveTo,
  onToggleFavorite,
  onCopy,
  onDelete,
}: ActionSheetProps) {
  const { t } = useI18n()
  const styles = useThemedStyles(createStyles)

  if (!node) return null

  const isFolder = node.type === 'folder'

  const actions: ActionItem[] = [
    {
      icon: '📁',
      label: t('tree.newSubFolder'),
      onPress: () => { onNewFolder?.(); onClose() },
      show: isFolder && !!onNewFolder,
    },
    {
      icon: '📄',
      label: t('tree.newPrompt'),
      onPress: () => { onNewPrompt?.(); onClose() },
      show: isFolder && !!onNewPrompt,
    },
    {
      icon: '✏️',
      label: t('tree.rename'),
      onPress: () => { onRename?.(); onClose() },
      show: !!onRename,
    },
    {
      icon: '📦',
      label: t('tree.moveTo'),
      onPress: () => { onMoveTo?.(); onClose() },
      show: !!onMoveTo,
    },
    {
      icon: node.isFavorite ? '💔' : '⭐',
      label: node.isFavorite ? t('tree.unfavorite') : t('tree.addFavorite'),
      onPress: () => { onToggleFavorite?.(); onClose() },
      show: !!onToggleFavorite,
    },
    {
      icon: '📋',
      label: t('tree.copyContent'),
      onPress: () => { onCopy?.(); onClose() },
      show: !isFolder && !!onCopy,
    },
    {
      icon: '🗑️',
      label: t('common.delete'),
      onPress: () => { onDelete?.(); onClose() },
      danger: true,
      show: !!onDelete,
    },
  ]

  const visibleActions = actions.filter(a => a.show)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          {/* 标题 */}
          <View style={styles.header}>
              <Text style={styles.headerIcon}>{isFolder ? '📁' : '📄'}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {node.title || t('common.untitled')}
              </Text>
            </View>

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 操作列表 */}
          {visibleActions.map((action, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.actionItem,
                pressed && styles.actionItemPressed,
              ]}
              onPress={action.onPress}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[
                styles.actionLabel,
                action.danger && styles.actionLabelDanger,
              ]}>
                {action.label}
              </Text>
            </Pressable>
          ))}

          {/* 取消按钮 */}
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.actionItemPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </Pressable>
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
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34, // Safe area
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  actionItemPressed: {
    backgroundColor: colors.surface,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: spacing.md,
    width: 28,
    textAlign: 'center',
  },
  actionLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  actionLabelDanger: {
    color: colors.danger,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
})
