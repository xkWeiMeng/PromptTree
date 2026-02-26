import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import type { TreeNode } from '@prompttree/shared'
import { getBreadcrumb } from '@prompttree/shared'
import { useTreeStore } from '../stores/tree'
import SearchBar from '../components/SearchBar'
import EmptyState from '../components/EmptyState'
import { colors, spacing, fontSize } from '../utils/theme'

export default function SearchScreen() {
  const router = useRouter()
  const nodes = useTreeStore(s => s.nodes)
  const [query, setQuery] = useState('')

  // 搜索过滤
  const results = useMemo(() => {
    if (!query) return []
    const lowerQ = query.toLowerCase()
    return nodes.filter(
      n =>
        !n.deletedAt &&
        (n.title.toLowerCase().includes(lowerQ) ||
          (n.content && n.content.toLowerCase().includes(lowerQ)))
    )
  }, [nodes, query])

  const handlePress = useCallback(
    (node: TreeNode) => {
      if (node.type === 'folder') {
        router.push(`/folder/${node.id}`)
      } else {
        router.push(`/prompt/${node.id}`)
      }
    },
    [router]
  )

  const renderItem = useCallback(
    ({ item }: { item: TreeNode }) => {
      const path = getBreadcrumb(nodes, item.id)
      const pathStr = path
        .slice(0, -1)
        .map(n => n.title || '未命名')
        .join(' > ')

      return (
        <Pressable style={styles.item} onPress={() => handlePress(item)}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemIcon}>
              {item.type === 'folder' ? '📁' : '📄'}
            </Text>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title || '未命名'}
            </Text>
          </View>
          {item.content && (
            <Text style={styles.itemPreview} numberOfLines={2}>
              {item.content.slice(0, 100)}
            </Text>
          )}
          {pathStr ? (
            <Text style={styles.itemPath} numberOfLines={1}>
              {pathStr}
            </Text>
          ) : null}
        </Pressable>
      )
    },
    [nodes, handlePress]
  )

  return (
    <>
      <Stack.Screen
        options={{
          title: '搜索',
          headerBackTitle: '返回',
        }}
      />
      <View style={styles.container}>
        <SearchBar onSearch={setQuery} />

        {query ? (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={
              results.length === 0 ? styles.emptyContainer : styles.listContent
            }
            ListEmptyComponent={
              <EmptyState
                icon="🔍"
                title="未找到结果"
                subtitle={`没有匹配 "${query}" 的内容`}
              />
            }
          />
        ) : (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>输入关键词搜索标题和内容</Text>
          </View>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
  },
  item: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  itemPreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 26,
    lineHeight: 18,
  },
  itemPath: {
    fontSize: fontSize.xs,
    color: colors.primaryLight,
    marginTop: 4,
    marginLeft: 26,
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
})
