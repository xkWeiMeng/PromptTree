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
  const openPrompt = useTreeStore(s => s.openPrompt)

  useEffect(() => {
    const id = createNode(parentId || null, 'prompt')
    openPrompt(id)
    router.replace(`/prompt/${id}`)
  }, [createNode, openPrompt, parentId, router])

  return null
}
