import React from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useSyncStore } from '../stores/sync'
import { useAuthStore } from '../stores/auth'
import { useI18n } from '../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

export default function SyncStatusBar() {
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const syncStatus = useSyncStore(s => s.syncStatus)
  const lastSyncTime = useSyncStore(s => s.lastSyncTime)
  const errorMessage = useSyncStore(s => s.errorMessage)
  const triggerSync = useSyncStore(s => s.triggerSync)

  // 未登录不显示
  if (!isLoggedIn) return null

  const getStatusContent = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <View style={styles.row}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>{t('sync.syncing')}</Text>
          </View>
        )
      case 'success': {
        const timeStr = lastSyncTime
          ? formatRelativeTime(lastSyncTime, t)
          : t('sync.justNow')
        return (
          <View style={styles.row}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.statusText}>{t('sync.syncedAgo', { time: timeStr })}</Text>
          </View>
        )
      }
      case 'error':
        return (
          <Pressable style={styles.row} onPress={triggerSync}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>
              {t('sync.error')}{errorMessage ? `: ${errorMessage}` : ''}
            </Text>
            <Text style={styles.retryText}>{t('sync.retry')}</Text>
          </Pressable>
        )
      default:
        return null
    }
  }

  const content = getStatusContent()
  if (!content) return null

  return <View style={styles.container}>{content}</View>
}

function formatRelativeTime(
  timestamp: number,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return t('sync.justNow')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t('sync.minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('sync.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  return t('sync.daysAgo', { n: days })
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  successIcon: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '700',
  },
  errorIcon: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '700',
    width: 16,
    height: 16,
    lineHeight: 16,
    textAlign: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    flex: 1,
  },
  retryText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
})
