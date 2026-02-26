import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTreeStore } from '../../stores/tree'

/**
 * 新建 Prompt 中转页
 * URL: /prompt/new?parentId=xxx
 * 创建新节点后立即跳转到编辑页
 */
export default function NewPromptScreen() {
  const { parentId } = useLocalSearchParams<{ parentId?: string }>()
  const router = useRouter()
  const createNode = useTreeStore(s => s.createNode)

  useEffect(() => {
    const id = createNode(parentId || null, 'prompt')
    router.replace(`/prompt/${id}`)
  }, [])

  return null
}
