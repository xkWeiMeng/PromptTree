import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '../../stores/tree'
import { useAuthStore } from '../../stores/auth'
import { createShare, deleteShare, getMyShare } from '../../api/share'
import VariableFillModal from '../../components/VariableFillModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18n } from '../../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../../utils/theme'

export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t, locale } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)

  // ===================
  // Store
  // ===================
  const getNode = useTreeStore(s => s.getNode)
  const updateNode = useTreeStore(s => s.updateNode)
  const deleteNode = useTreeStore(s => s.deleteNode)
  const toggleFavorite = useTreeStore(s => s.toggleFavorite)
  const openPrompt = useTreeStore(s => s.openPrompt)
  const closeEditor = useTreeStore(s => s.closeEditor)
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const isOfflineMode = useAuthStore(s => s.isOfflineMode)

  const node = getNode(id!)

  useFocusEffect(
    useCallback(() => {
      if (id) openPrompt(id)
      return () => {
        const state = useTreeStore.getState()
        if (id && state.selectedNodeId === id && state.viewMode === 'editor') {
          closeEditor()
        }
      }
    }, [closeEditor, id, openPrompt])
  )

  // ===================
  // 本地编辑状态
  // ===================
  const [title, setTitle] = useState(node?.title || '')
  const [content, setContent] = useState(node?.content || '')
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // 防抖保存
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 同步 store 数据到本地状态
  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setContent(node.content)
    }
  }, [node?.id]) // 仅在 id 变化时同步

  // ===================
  // 自动保存
  // ===================
  const scheduleSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        if (id) {
          updateNode(id, { title: newTitle, content: newContent })
        }
      }, 1000)
    },
    [id, updateNode]
  )

  // 组件卸载时立刻保存
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        // 立即保存
        if (id) {
          useTreeStore.getState().updateNode(id, { title, content })
        }
      }
    }
  }, [id, title, content])

  const handleTitleChange = useCallback(
    (text: string) => {
      setTitle(text)
      scheduleSave(text, content)
    },
    [content, scheduleSave]
  )

  const handleContentChange = useCallback(
    (text: string) => {
      setContent(text)
      scheduleSave(title, text)
    },
    [title, scheduleSave]
  )

  // ===================
  // 操作
  // ===================
  const handleCopy = useCallback(() => {
    if (!content.trim()) {
      Alert.alert(t('workspace.contentEmptyTitle'), t('workspace.contentEmptyMessage'))
      return
    }
    const vars = extractVariables(content)
    if (vars.length > 0) {
      setShowVariableModal(true)
    } else {
      copyToClipboard(content)
    }
  }, [content, t])

  const handleToggleFavorite = useCallback(() => {
    if (id) toggleFavorite(id)
  }, [id, toggleFavorite])

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleShare = useCallback(async () => {
    if (!id || isSharing) return

    if (!isLoggedIn || isOfflineMode) {
      Alert.alert(t('workspace.noSyncAccessTitle'), t('workspace.noSyncAccessMessage'))
      return
    }

    setIsSharing(true)
    try {
      const existing = await getMyShare(id)

      if (existing.share) {
        Alert.alert(t('share.title'), existing.share.link, [
          {
            text: t('share.copyLink'),
            onPress: () => {
              void copyToClipboard(existing.share!.link)
            }
          },
          {
            text: t('share.stopSharing'),
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await deleteShare(existing.share!.id)
                  Alert.alert(t('share.stopped'))
                } catch (error) {
                  console.error('取消分享失败:', error)
                  Alert.alert(t('share.stopFailedTitle'), t('share.stopFailedMessage'))
                }
              })()
            }
          },
          { text: t('common.close'), style: 'cancel' }
        ])
        return
      }

      const created = await createShare(id)
      Alert.alert(t('share.createdTitle'), created.share.link, [
        {
          text: t('share.copyLink'),
          onPress: () => {
            void copyToClipboard(created.share.link)
          }
        },
        { text: t('common.close'), style: 'cancel' }
      ])
    } catch (error) {
      console.error('分享失败:', error)
      Alert.alert(t('share.failedTitle'), t('share.failedMessage'))
    } finally {
      setIsSharing(false)
    }
  }, [id, isLoggedIn, isOfflineMode, isSharing, t])

  const confirmDelete = useCallback(() => {
    if (id) {
      deleteNode(id)
      router.back()
    }
    setShowDeleteConfirm(false)
  }, [id, deleteNode, router])

  // ===================
  // 节点不存在
  // ===================
  if (!node) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('prompt.notFound')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </Pressable>
      </View>
    )
  }

  // ===================
  // 计算属性
  // ===================
  const variables = content ? extractVariables(content) : []
  const hasVars = variables.length > 0
  const wordCount = content.length
  const createdDate = new Date(node.createdAt).toLocaleString(locale)
  const updatedDate = new Date(node.updatedAt).toLocaleString(locale)

  return (
    <>
      <Stack.Screen
        options={{
          title: title || t('common.untitledPrompt'),
          headerBackTitle: t('common.back'),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={handleToggleFavorite} style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>
                  {node.isFavorite ? '⭐' : '☆'}
                </Text>
              </Pressable>
              <Pressable onPress={handleCopy} style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>📋</Text>
              </Pressable>
              {isLoggedIn && !isOfflineMode && (
                <Pressable onPress={handleShare} style={styles.headerBtn}>
                  <Text style={styles.headerBtnText}>{isSharing ? '…' : '🔗'}</Text>
                </Pressable>
              )}
              <Pressable onPress={handleDelete} style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>🗑️</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 标题 */}
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder={t('prompt.titlePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
          />

          {/* 分割线 */}
          <View style={styles.divider} />

          {/* 内容编辑 */}
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={handleContentChange}
            placeholder={t('prompt.contentPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          {/* 变量提示 */}
          {hasVars && (
            <View style={styles.variableHint}>
              <Text style={styles.variableHintText}>
                {t('prompt.variablesDetected', { count: variables.length })}
                {variables.map(v => ` {{${v}}}`).join(',')}
              </Text>
            </View>
          )}

          {/* 元信息 */}
          <View style={styles.metaSection}>
            <Text style={styles.metaText}>{t('prompt.charCount', { count: wordCount })}</Text>
            <Text style={styles.metaText}>{t('prompt.createdAt', { time: createdDate })}</Text>
            <Text style={styles.metaText}>{t('prompt.updatedAt', { time: updatedDate })}</Text>
          </View>
        </ScrollView>

        {/* 底部操作栏 */}
        <View style={styles.bottomBar}>
          <Pressable style={styles.bottomBtn} onPress={handleCopy}>
            <Text style={styles.bottomBtnText}>
              {hasVars ? t('prompt.copyWithVariables') : t('prompt.copyContent')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* 变量填充弹窗 */}
      <VariableFillModal
        visible={showVariableModal}
        content={content}
        onClose={() => setShowVariableModal(false)}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title={t('prompt.deleteTitle')}
        message={t('prompt.deleteMessage')}
        confirmText={t('common.delete')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  titleInput: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  contentInput: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    minHeight: 200,
    paddingVertical: spacing.sm,
  },
  variableHint: {
    backgroundColor: colors.primaryBg,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  variableHintText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    lineHeight: 20,
  },
  metaSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bottomBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bottomBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  headerBtnText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  backLink: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
})
