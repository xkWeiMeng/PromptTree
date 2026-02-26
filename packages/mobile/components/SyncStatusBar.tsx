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
import { colors, spacing, fontSize } from '../utils/theme'

export default function SyncStatusBar() {
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
            <Text style={styles.statusText}>同步中...</Text>
          </View>
        )
      case 'success': {
        const timeStr = lastSyncTime
          ? formatRelativeTime(lastSyncTime)
          : '刚刚'
        return (
          <View style={styles.row}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.statusText}>{timeStr}同步</Text>
          </View>
        )
      }
      case 'error':
        return (
          <Pressable style={styles.row} onPress={triggerSync}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>
              同步失败{errorMessage ? `：${errorMessage}` : ''}
            </Text>
            <Text style={styles.retryText}>重试</Text>
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

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const styles = StyleSheet.create({
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
    backgroundColor: '#fef2f2',
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
