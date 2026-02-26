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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '../../stores/tree'
import VariableFillModal from '../../components/VariableFillModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { copyToClipboard } from '../../utils/clipboard'
import { colors, spacing, fontSize } from '../../utils/theme'

export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  // ===================
  // Store
  // ===================
  const getNode = useTreeStore(s => s.getNode)
  const updateNode = useTreeStore(s => s.updateNode)
  const deleteNode = useTreeStore(s => s.deleteNode)
  const toggleFavorite = useTreeStore(s => s.toggleFavorite)

  const node = getNode(id!)

  // ===================
  // 本地编辑状态
  // ===================
  const [title, setTitle] = useState(node?.title || '')
  const [content, setContent] = useState(node?.content || '')
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      Alert.alert('提示', '内容为空')
      return
    }
    const vars = extractVariables(content)
    if (vars.length > 0) {
      setShowVariableModal(true)
    } else {
      copyToClipboard(content)
    }
  }, [content])

  const handleToggleFavorite = useCallback(() => {
    if (id) toggleFavorite(id)
  }, [id, toggleFavorite])

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

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
        <Text style={styles.emptyText}>Prompt 不存在或已被删除</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>返回</Text>
        </Pressable>
      </View>
    )
  }

  // ===================
  // 计算属性
  // ===================
  const hasVars = content ? extractVariables(content).length > 0 : false
  const wordCount = content.length
  const createdDate = new Date(node.createdAt).toLocaleString('zh-CN')
  const updatedDate = new Date(node.updatedAt).toLocaleString('zh-CN')

  return (
    <>
      <Stack.Screen
        options={{
          title: title || '未命名 Prompt',
          headerBackTitle: '返回',
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
            placeholder="Prompt 标题"
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
            placeholder="在这里编写 Prompt 内容...\n\n使用 {{变量名}} 创建可填充变量"
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          {/* 变量提示 */}
          {hasVars && (
            <View style={styles.variableHint}>
              <Text style={styles.variableHintText}>
                🔤 检测到 {extractVariables(content).length} 个变量：
                {extractVariables(content).map(v => ` {{${v}}}`).join(',')}
              </Text>
            </View>
          )}

          {/* 元信息 */}
          <View style={styles.metaSection}>
            <Text style={styles.metaText}>字数：{wordCount}</Text>
            <Text style={styles.metaText}>创建：{createdDate}</Text>
            <Text style={styles.metaText}>更新：{updatedDate}</Text>
          </View>
        </ScrollView>

        {/* 底部操作栏 */}
        <View style={styles.bottomBar}>
          <Pressable style={styles.bottomBtn} onPress={handleCopy}>
            <Text style={styles.bottomBtnText}>
              {hasVars ? '🔤 填充变量并复制' : '📋 复制内容'}
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
        title="确认删除"
        message="此 Prompt 将被删除，此操作不可撤销。"
        confirmText="删除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
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
