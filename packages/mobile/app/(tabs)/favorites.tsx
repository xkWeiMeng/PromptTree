import React, { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import type { TreeNode } from '@prompttree/shared'
import { extractVariables } from '@prompttree/shared'
import { useTreeStore } from '../../stores/tree'
import { copyToClipboard, getPromptVariables } from '../../utils/clipboard'
import EmptyState from '../../components/EmptyState'
import { colors, spacing, fontSize } from '../../utils/theme'

export default function FavoritesScreen() {
  const router = useRouter()
  const getFavorites = useTreeStore(s => s.getFavorites)
  const toggleFavorite = useTreeStore(s => s.toggleFavorite)
  const nodes = useTreeStore(s => s.nodes) // trigger re-render

  const favorites = getFavorites()

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

  const handleCopy = useCallback(
    async (node: TreeNode) => {
      if (!node.content) {
        Alert.alert('提示', '内容为空')
        return
      }
      const vars = getPromptVariables(node.content)
      if (vars.length > 0) {
        router.push(`/prompt/${node.id}`)
      } else {
        await copyToClipboard(node.content)
      }
    },
    [router]
  )

  const renderItem = useCallback(
    ({ item }: { item: TreeNode }) => (
      <Pressable style={styles.item} onPress={() => handlePress(item)}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemIcon}>
            {item.type === 'folder' ? '📁' : '📄'}
          </Text>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title || (item.content ? item.content.slice(0, 20) : '未命名')}
            </Text>
            {item.content && (
              <Text style={styles.itemPreview} numberOfLines={2}>
                {item.content.slice(0, 80)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.itemActions}>
          {item.type === 'prompt' && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => handleCopy(item)}
            >
              <Text style={styles.actionBtnText}>📋</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.actionBtn}
            onPress={() => toggleFavorite(item.id)}
          >
            <Text style={styles.actionBtnText}>⭐</Text>
          </Pressable>
        </View>
      </Pressable>
    ),
    [handlePress, handleCopy, toggleFavorite]
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          favorites.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            icon="☆"
            title="还没有收藏"
            subtitle="长按节点可以添加收藏"
          />
        }
      />
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  itemPreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  actionBtnText: {
    fontSize: 18,
  },
})
