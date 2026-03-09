import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

// ===================
// Props
// ===================

interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
}

// ===================
// 组件
// ===================

export default function EmptyState({ icon = '📭', title, subtitle }: EmptyStateProps) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}

// ===================
// 样式
// ===================

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: 60,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
})
