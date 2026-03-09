import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import type { TreeNode } from '@prompttree/shared'
import { useI18n } from '../i18n'
import { useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

// ===================
// Props
// ===================

interface BreadcrumbProps {
  /** 面包屑路径节点列表（从根到当前） */
  path: TreeNode[]
  /** 点击某层级跳转 */
  onNavigate: (nodeId: string | null) => void
}

// ===================
// 组件
// ===================

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const { t } = useI18n()
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 根目录 */}
        <Pressable
          onPress={() => onNavigate(null)}
          hitSlop={8}
        >
          <Text style={[styles.item, path.length === 0 && styles.itemActive]}>
            🏠 {t('workspace.rootFolder')}
          </Text>
        </Pressable>

        {path.map((node, index) => {
          const isLast = index === path.length - 1
          return (
            <React.Fragment key={node.id}>
              <Text style={styles.separator}>›</Text>
              <Pressable
                onPress={() => {
                  if (!isLast) {
                    onNavigate(node.id)
                  }
                }}
                hitSlop={8}
              >
                <Text
                  style={[styles.item, isLast && styles.itemActive]}
                  numberOfLines={1}
                >
                  {node.title || t('common.untitled')}
                </Text>
              </Pressable>
            </React.Fragment>
          )
        })}
      </ScrollView>
    </View>
  )
}

// ===================
// 样式
// ===================

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  item: {
    fontSize: fontSize.sm,
    color: colors.primary,
    maxWidth: 120,
  },
  itemActive: {
    color: colors.text,
    fontWeight: '600',
  },
  separator: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginHorizontal: spacing.xs,
  },
})
