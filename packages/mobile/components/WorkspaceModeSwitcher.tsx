import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { ViewMode } from '../stores/tree'
import { useI18n } from '../i18n'
import { useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

interface WorkspaceModeSwitcherProps {
  mode: ViewMode
  hasSelectedPrompt: boolean
  onSwitchMode: (mode: ViewMode) => void
}

export default function WorkspaceModeSwitcher({
  mode,
  hasSelectedPrompt,
  onSwitchMode,
}: WorkspaceModeSwitcherProps) {
  const { t } = useI18n()
  const styles = useThemedStyles(createStyles)
  const modeItems: Array<{ mode: ViewMode; label: string; icon: string }> = [
    { mode: 'welcome', label: t('modeSwitcher.welcome'), icon: '🏠' },
    { mode: 'editor', label: t('modeSwitcher.editor'), icon: '✏️' },
    { mode: 'outline', label: t('modeSwitcher.outline'), icon: '📋' },
    { mode: 'mindmap', label: t('modeSwitcher.mindmap'), icon: '🧠' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.tabGroup}>
        {modeItems.map(item => {
          const isActive = mode === item.mode
          const isDisabled = item.mode === 'editor' && !hasSelectedPrompt

          return (
            <Pressable
              key={item.mode}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                isDisabled && styles.tabDisabled,
              ]}
              disabled={isDisabled}
              onPress={() => onSwitchMode(item.mode)}
            >
              <Text style={styles.tabIcon}>{item.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <Text style={styles.hintText}>
        {hasSelectedPrompt ? t('modeSwitcher.selectedHint') : t('modeSwitcher.unselectedHint')}
      </Text>
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  tabGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  tabDisabled: {
    opacity: 0.45,
  },
  tabIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  hintText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
})
