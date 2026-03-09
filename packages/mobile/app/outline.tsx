import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native'
import { Stack, useRouter, useFocusEffect } from 'expo-router'
import type { TreeNodeWithChildren } from '@prompttree/shared'
import { useTreeStore, type ViewMode } from '../stores/tree'
import WorkspaceModeSwitcher from '../components/WorkspaceModeSwitcher'
import { useI18n } from '../i18n'
import { useTheme, useThemedStyles, spacing, fontSize, type ThemeColors } from '../utils/theme'

export default function OutlineScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const getRootTree = useTreeStore(s => s.getRootTree)
  const nodes = useTreeStore(s => s.nodes)
  const selectedNodeId = useTreeStore(s => s.selectedNodeId)
  const setViewMode = useTreeStore(s => s.setViewMode)
  const openNode = useTreeStore(s => s.openNode)
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const selectedPrompt = nodes.find(n => n.id === selectedNodeId && n.type === 'prompt') ?? null
  const treeData = useMemo(() => getRootTree(), [getRootTree, nodes])

  useFocusEffect(
    useCallback(() => {
      setViewMode('outline')
    }, [setViewMode])
  )

  const handleSwitchMode = useCallback((mode: ViewMode) => {
    if (mode === 'outline') return

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

    setViewMode('mindmap')
    router.replace('/mindmap')
  }, [openNode, router, selectedPrompt, setViewMode])

  const stats = useMemo(() => {
    const active = nodes.filter(n => !n.deletedAt)
    return {
      folders: active.filter(n => n.type === 'folder').length,
      prompts: active.filter(n => n.type === 'prompt').length,
      favorites: active.filter(n => n.isFavorite).length,
    }
  }, [nodes])

  const matchesQuery = useCallback((node: TreeNodeWithChildren, keyword: string): boolean => {
    if (!keyword) return true
    const q = keyword.toLowerCase()
    if (node.title.toLowerCase().includes(q)) return true
    if (node.content?.toLowerCase().includes(q)) return true
    return node.children.some(child => matchesQuery(child, keyword))
  }, [])

  const filterTree = useCallback((items: TreeNodeWithChildren[], keyword: string): TreeNodeWithChildren[] => {
    return items
      .filter(item => matchesQuery(item, keyword))
      .map(item => ({
        ...item,
        children: filterTree(item.children, keyword)
      }))
  }, [matchesQuery])

  const filteredTree = useMemo(() => {
    if (!query.trim()) return treeData
    return filterTree(treeData, query.trim())
  }, [filterTree, query, treeData])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const renderNode = useCallback((node: TreeNodeWithChildren, level: number): React.ReactNode => {
    const isFolder = node.type === 'folder'
    const hasChildren = node.children.length > 0
    const isExpanded = expandedIds.has(node.id)

    return (
      <View key={node.id}>
        <Pressable
          style={[styles.row, { paddingLeft: spacing.lg + level * 14 }]}
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
          <Text style={styles.rowIcon}>
            {isFolder ? (isExpanded ? '📂' : '📁') : '📄'}
          </Text>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {node.title || t('common.untitled')}
          </Text>
          {node.isFavorite && <Text style={styles.favorite}>⭐</Text>}
          {isFolder && hasChildren && (
            <Pressable
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation()
                toggleExpand(node.id)
              }}
            >
              <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>
            </Pressable>
          )}
        </Pressable>
        {isFolder && isExpanded && hasChildren && node.children.map(child => renderNode(child, level + 1))}
      </View>
    )
  }, [expandedIds, openNode, router, t, toggleExpand])

  return (
    <>
      <Stack.Screen options={{ title: t('outline.title') }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('outline.title')}</Text>
          <Text style={styles.stats}>
            {t('outline.stats', {
              folders: stats.folders,
              prompts: stats.prompts,
              favorites: stats.favorites
            })}
          </Text>
        </View>

        <WorkspaceModeSwitcher
          mode="outline"
          hasSelectedPrompt={!!selectedPrompt}
          onSwitchMode={handleSwitchMode}
        />

        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('outline.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
          />
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredTree.length > 0 ? (
            filteredTree.map(node => renderNode(node, 0))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {query.trim() ? t('outline.emptyNoMatch') : t('outline.emptyNoData')}
              </Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  stats: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  rowIcon: {
    marginRight: spacing.sm,
    fontSize: 17,
  },
  rowTitle: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  favorite: {
    marginRight: spacing.xs,
    fontSize: 14,
  },
  chevron: {
    fontSize: 14,
    color: colors.textSecondary,
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
