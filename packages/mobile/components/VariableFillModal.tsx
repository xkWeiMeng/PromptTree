import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { extractVariables, fillVariables } from '@prompttree/shared'
import { colors, spacing, fontSize } from '../utils/theme'
import { copyToClipboard } from '../utils/clipboard'

interface VariableFillModalProps {
  visible: boolean
  content: string
  onClose: () => void
}

export default function VariableFillModal({ visible, content, onClose }: VariableFillModalProps) {
  const variables = useMemo(() => extractVariables(content), [content])
  const [values, setValues] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  // 填充后的预览
  const filledContent = useMemo(
    () => fillVariables(content, values),
    [content, values]
  )

  const allFilled = useMemo(
    () => variables.every(v => values[v]?.trim()),
    [variables, values]
  )

  const handleValueChange = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleCopy = useCallback(async () => {
    await copyToClipboard(filledContent)
    onClose()
    // 重置
    setValues({})
    setShowPreview(false)
  }, [filledContent, onClose])

  const handleClose = useCallback(() => {
    onClose()
    setValues({})
    setShowPreview(false)
  }, [onClose])

  if (variables.length === 0) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 顶栏 */}
        <View style={styles.header}>
          <Pressable onPress={handleClose}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Text style={styles.headerTitle}>填充变量</Text>
          <Pressable onPress={handleCopy} disabled={!allFilled}>
            <Text style={[styles.doneText, !allFilled && styles.disabledText]}>
              复制
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 变量输入 */}
          <Text style={styles.sectionTitle}>
            {variables.length} 个变量需要填充
          </Text>
          {variables.map(name => (
            <View key={name} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{`{{${name}}}`}</Text>
              <TextInput
                style={styles.fieldInput}
                value={values[name] || ''}
                onChangeText={val => handleValueChange(name, val)}
                placeholder={`输入 ${name} 的值...`}
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
          ))}

          {/* 预览切换 */}
          <Pressable
            style={styles.previewToggle}
            onPress={() => setShowPreview(!showPreview)}
          >
            <Text style={styles.previewToggleText}>
              {showPreview ? '▼ 隐藏预览' : '▶ 查看预览'}
            </Text>
          </Pressable>

          {/* 预览区域 */}
          {showPreview && (
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>{filledContent}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  doneText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  disabledText: {
    color: colors.borderLight,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fieldInput: {
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    maxHeight: 120,
  },
  previewToggle: {
    paddingVertical: spacing.md,
  },
  previewToggleText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  previewBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
})
