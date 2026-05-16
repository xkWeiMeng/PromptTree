<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Folder, FileText, Copy, Users, Loader2 } from 'lucide-vue-next'
import { getPublicShare, type ShareContent } from '@/api/share'
import { useHead, useToast } from '@/composables'
import { getOrCreateShareVisitorId } from '@/utils/share'

const route = useRoute()
const { t } = useI18n()
const toast = useToast()

const isLoading = ref(true)
const errorMessage = ref('')
const content = ref<ShareContent | null>(null)
const readerCount = ref(0)
const pageTitle = computed(() => content.value?.root.title || t('share.pageTitle'))

useHead({
  title: pageTitle,
  robots: 'noindex, nofollow'
})

const isFolderShare = computed(() => content.value?.type === 'folder')
const isPromptShare = computed(() => content.value?.type === 'prompt')

const nodeDepthMap = computed<Record<string, number>>(() => {
  if (!content.value) return {}

  const map: Record<string, number> = {}
  const nodes = content.value.nodes
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  for (const node of nodes) {
    let depth = 0
    let parentId = node.parentId
    while (parentId && nodeMap.has(parentId)) {
      depth += 1
      parentId = nodeMap.get(parentId)?.parentId ?? null
    }
    map[node.id] = depth
  }

  return map
})

async function copyPrompt(contentText: string) {
  try {
    await navigator.clipboard.writeText(contentText)
    toast.success(t('share.contentCopied'))
  } catch {
    toast.error(t('share.copyFailed'))
  }
}

async function loadPublicShare() {
  const token = String(route.params.token || '')
  if (!token) {
    errorMessage.value = t('share.invalidLink')
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const visitorId = getOrCreateShareVisitorId()
    const response = await getPublicShare(token, visitorId)
    content.value = response.content
    readerCount.value = response.stats.readerCount
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('share.loadFailed')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadPublicShare()
})
</script>

<template>
  <main class="shared-page">
    <section class="shared-container">
      <div v-if="isLoading" class="state loading" aria-live="polite">
        <Loader2 :size="18" class="animate-spin" />
        <span>{{ t('share.loading') }}</span>
      </div>

      <div v-else-if="errorMessage" class="state error" aria-live="polite" role="alert">
        <h2>{{ t('share.loadFailed') }}</h2>
        <p>{{ errorMessage }}</p>
      </div>

      <template v-else-if="content">
        <header class="shared-header">
          <h1>{{ content.root.title || t('common.untitled') }}</h1>
          <div class="shared-meta">
            <span class="meta-item">
              <Users :size="14" />
              {{ t('share.readerCount', { count: readerCount }) }}
            </span>
          </div>
        </header>

        <section v-if="isPromptShare" class="prompt-card">
          <div class="prompt-actions">
            <button class="copy-btn" @click="copyPrompt(content.root.content)">
              <Copy :size="14" />
              {{ t('common.copy') }}
            </button>
          </div>
          <pre class="prompt-content">{{ content.root.content }}</pre>
        </section>

        <section v-else-if="isFolderShare" class="folder-list">
          <article
            v-for="node in content.nodes"
            :key="node.id"
            class="folder-node"
            :style="{ '--depth': nodeDepthMap[node.id] }"
          >
            <div class="node-title">
              <component :is="node.type === 'folder' ? Folder : FileText" :size="14" />
              <span>{{ node.title || t('common.untitled') }}</span>
              <button
                v-if="node.type === 'prompt'"
                class="copy-btn small"
                @click="copyPrompt(node.content)"
              >
                <Copy :size="12" />
                {{ t('common.copy') }}
              </button>
            </div>
            <pre v-if="node.type === 'prompt'" class="node-content">{{ node.content }}</pre>
          </article>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.shared-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: var(--space-6) var(--space-4);
}

.shared-container {
  max-width: min(860px, 100% - var(--space-6));
  margin: 0 auto;
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--space-5);
}

.shared-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
}

.shared-meta {
  margin-top: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.prompt-card {
  margin-top: var(--space-4);
}

.prompt-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-2);
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  min-height: var(--touch-target-min, 44px);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border: 0.5px solid var(--border-secondary);
  background: var(--bg-secondary);
}

.copy-btn:hover {
  background: var(--bg-hover);
}

.copy-btn.small {
  margin-left: auto;
  font-size: var(--font-size-xs);
}

.prompt-content,
.node-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 0.5px solid var(--border-secondary);
  padding: var(--space-3);
}

.folder-list {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.folder-node {
  border-left: 1px solid var(--border-secondary);
  padding-left: calc(var(--depth, 0) * var(--node-depth-indent, 16px) + var(--space-2));
}

.node-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.node-content {
  margin-top: var(--space-1);
}

.state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--text-secondary);
}

.state.error h2 {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-lg);
}

.state.error p {
  margin: 0;
  font-size: var(--font-size-sm);
}

@media (max-width: 640px) {
  .shared-page {
    padding: var(--space-4) var(--space-2);
  }

  .shared-container {
    padding: var(--space-3);
    border-radius: var(--radius-lg);
  }

  .shared-header h1 {
    font-size: var(--font-size-lg);
  }

  .folder-node {
    --node-depth-indent: 12px;
  }

  .prompt-content,
  .node-content {
    font-size: var(--font-size-xs);
    padding: var(--space-2);
  }
}
</style>
