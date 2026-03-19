<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '@/stores/admin'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { FileText, Folder, User, Clock } from 'lucide-vue-next'

const adminStore = useAdminStore()

const contentLimit = ref(50)
const expandedIds = ref(new Set<string>())

onMounted(() => {
  adminStore.loadRecentContent(contentLimit.value)
})

function loadMore() {
  contentLimit.value += 50
  adminStore.loadRecentContent(contentLimit.value)
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN')
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

const content = computed(() => adminStore.recentContent)
</script>

<template>
  <AdminLayout>
    <div class="content-page">
      <h1 class="page-title">内容看板</h1>
      <p class="page-desc">查看系统中最近更新的用户内容</p>

      <div v-if="adminStore.isLoading && !content.length" class="loading">加载中...</div>

      <div v-if="content.length" class="content-list">
        <div
          v-for="item in content"
          :key="item.id"
          class="content-card"
          @click="toggleExpand(item.id)"
        >
          <div class="content-card-header">
            <div class="content-type-icon">
              <Folder v-if="item.type === 'folder'" :size="16" class="folder-icon" />
              <FileText v-else :size="16" class="prompt-icon" />
            </div>
            <div class="content-card-info">
              <div class="content-title">{{ item.title || '(无标题)' }}</div>
              <div class="content-meta">
                <span class="meta-item">
                  <User :size="11" />
                  {{ item.user_name || item.user_email || item.user_id.slice(0, 8) }}
                </span>
                <span class="meta-item">
                  <Clock :size="11" />
                  {{ relativeTime(item.updated_at) }}
                </span>
                <span class="type-badge" :class="item.type">{{ item.type }}</span>
              </div>
            </div>
          </div>

          <!-- 展开内容预览 -->
          <div v-if="expandedIds.has(item.id) && item.type === 'prompt'" class="content-preview">
            <div class="preview-label">内容预览</div>
            <pre class="preview-text">{{ item.content || '(空内容)' }}</pre>
            <div class="preview-footer">
              <span>更新于 {{ formatDate(item.updated_at) }}</span>
              <span>创建于 {{ formatDate(item.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="content.length >= contentLimit" class="load-more">
        <button class="btn-load-more" @click="loadMore">加载更多</button>
      </div>

      <div v-if="!adminStore.isLoading && !content.length" class="empty">
        暂无内容
      </div>

      <div v-if="adminStore.error" class="error-msg">{{ adminStore.error }}</div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.content-page {
  max-width: 900px;
}

.page-title {
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.page-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

.loading {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* ===================
   Content List
   =================== */
.content-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.content-card {
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--duration-fast) ease;
}

.content-card:hover {
  border-color: var(--border-primary);
}

.content-card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
}

.content-type-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.folder-icon {
  color: var(--apple-blue);
}

.prompt-icon {
  color: var(--apple-orange);
}

.content-card-info {
  flex: 1;
  min-width: 0;
}

.content-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.type-badge {
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
}

.type-badge.prompt {
  background: rgba(255, 149, 0, 0.12);
  color: var(--apple-orange);
}

.type-badge.folder {
  background: rgba(0, 122, 255, 0.12);
  color: var(--apple-blue);
}

/* ===================
   Content Preview
   =================== */
.content-preview {
  padding: 0 var(--space-4) var(--space-4);
  margin-left: calc(16px + var(--space-3));
}

.preview-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-medium);
}

.preview-text {
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace);
}

.preview-footer {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-2);
  font-size: 10px;
  color: var(--text-tertiary);
}

/* ===================
   Load More / Empty
   =================== */
.load-more {
  text-align: center;
  margin-top: var(--space-4);
}

.btn-load-more {
  padding: var(--space-2) var(--space-6);
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.btn-load-more:hover {
  background: var(--bg-hover);
}

.empty {
  text-align: center;
  color: var(--text-tertiary);
  padding: var(--space-8);
  font-size: var(--font-size-sm);
}

.error-msg {
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--color-danger-bg, rgba(255, 59, 48, 0.1));
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}
</style>
