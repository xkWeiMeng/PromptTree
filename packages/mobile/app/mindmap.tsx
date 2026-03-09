import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import { Stack, useRouter, useFocusEffect } from 'expo-router'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { useTreeStore, type ViewMode } from '../stores/tree'
import WorkspaceModeSwitcher from '../components/WorkspaceModeSwitcher'
import { useI18n } from '../i18n'
import { useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

function findNode(nodes: TreeNodeWithChildren[], id: string): TreeNodeWithChildren | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const nested = findNode(node.children, id)
    if (nested) return nested
  }
  return null
}

export default function MindMapScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const styles = useThemedStyles(createStyles)
  const getRootTree = useTreeStore(s => s.getRootTree)
  const nodes = useTreeStore(s => s.nodes)
  const selectedNodeId = useTreeStore(s => s.selectedNodeId)
  const setViewMode = useTreeStore(s => s.setViewMode)
  const openNode = useTreeStore(s => s.openNode)
  const [rootId, setRootId] = useState<string | null>(null)

  const selectedPrompt = nodes.find(n => n.id === selectedNodeId && n.type === 'prompt') ?? null
  const treeData = useMemo(() => getRootTree(), [getRootTree, nodes])

  useFocusEffect(
    useCallback(() => {
      setViewMode('mindmap')
    }, [setViewMode])
  )

  const handleSwitchMode = useCallback((mode: ViewMode) => {
    if (mode === 'mindmap') return

    if (mode === 'welcome') {
      setViewMode('welcome')
      router.replace('/(tabs)')
      return
    }

    if (mode === 'editor') {
      if (!selectedPrompt) return
      openNode(selectedPrompt.id)
      router.push(`/prompt/${selectedPrompt.id}`)
      return
    }

    setViewMode('outline')
    router.replace('/outline')
  }, [openNode, router, selectedPrompt, setViewMode])

  const currentRoot = useMemo(() => {
    if (!rootId) return null
    return findNode(treeData, rootId)
  }, [rootId, treeData])

  const renderNode = useCallback((node: TreeNodeWithChildren, level: number): React.ReactNode => {
    const isFolder = node.type === 'folder'
    const variableCount = node.content ? (node.content.match(/\{\{[^}]+\}\}/g)?.length || 0) : 0

    return (
      <View key={node.id} style={[styles.nodeCard, { marginLeft: level * 18 }]}>
        <Pressable
          style={styles.nodeHeader}
          onPress={() => {
            if (isFolder) {
              openNode(node.id)
              router.replace('/(tabs)')
              return
            }
            openNode(node.id)
            router.push(`/prompt/${node.id}`)
          }}
        >
          <Text style={styles.nodeEmoji}>{isFolder ? '📁' : '📄'}</Text>
          <View style={styles.nodeMain}>
            <Text style={styles.nodeTitle} numberOfLines={1}>
              {node.title || t('common.untitled')}
            </Text>
            {node.content ? (
              <Text style={styles.nodePreview} numberOfLines={2}>
                {node.content}
              </Text>
            ) : null}
            <View style={styles.nodeMeta}>
              {node.isFavorite && <Text style={styles.metaItem}>{t('mindmap.metaFavorite')}</Text>}
              {variableCount > 0 && <Text style={styles.metaItem}>{t('mindmap.metaVariables', { count: variableCount })}</Text>}
              {isFolder && (
                <>
                  <Text style={styles.metaItem}>{t('mindmap.metaChildren', { count: node.children.length })}</Text>
                  <Pressable
                    hitSlop={6}
                    onPress={(event) => {
                      event.stopPropagation()
                      setRootId(node.id)
                    }}
                  >
                    <Text style={[styles.metaItem, styles.metaAction]}>
                      {rootId === node.id ? t('mindmap.focused') : t('mindmap.focus')}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Pressable>
        {node.children.map(child => renderNode(child, level + 1))}
      </View>
    )
  }, [openNode, rootId, router, t])

  const roots = currentRoot ? [currentRoot] : treeData

  return (
    <>
      <Stack.Screen options={{ title: t('mindmap.title') }} />
      <View style={styles.container}>
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={styles.toolbarTitle}>{t('mindmap.title')}</Text>
            <Text style={styles.toolbarSubTitle}>
              {currentRoot
                ? t('mindmap.currentScope', { name: currentRoot.title || t('common.untitledFolder') })
                : t('mindmap.globalScope')}
            </Text>
          </View>
          {rootId && (
            <Pressable style={styles.toolbarBtn} onPress={() => setRootId(null)}>
              <Text style={styles.toolbarBtnText}>{t('mindmap.backToGlobal')}</Text>
            </Pressable>
          )}
        </View>

        <WorkspaceModeSwitcher
          mode="mindmap"
          hasSelectedPrompt={!!selectedPrompt}
          onSwitchMode={handleSwitchMode}
        />

        <ScrollView style={styles.canvas} contentContainerStyle={styles.canvasContent}>
          {roots.length > 0 ? (
            roots.map(node => renderNode(node, 0))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('mindmap.empty')}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toolbarLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  toolbarTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  toolbarSubTitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  toolbarBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toolbarBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  canvas: {
    flex: 1,
  },
  canvasContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  nodeCard: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
  },
  nodeEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  nodeMain: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  nodePreview: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  nodeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  metaItem: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaAction: {
    color: colors.primary,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
})
