<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAdminStore } from '@/stores/admin'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  Search, ChevronLeft, ChevronRight, X,
  Folder, FileText, Star
} from 'lucide-vue-next'
import type { AdminUser, UserNode } from '@/api/admin'

const adminStore = useAdminStore()

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 20

// 节点详情弹窗
const showNodeModal = ref(false)

onMounted(() => {
  adminStore.loadUsers(1, pageSize)
})

function handleSearch() {
  currentPage.value = 1
  adminStore.loadUsers(1, pageSize, searchQuery.value)
}

function goPage(page: number) {
  currentPage.value = page
  adminStore.loadUsers(page, pageSize, searchQuery.value)
}

function viewUserNodes(user: AdminUser) {
  adminStore.loadUserNodes(user)
  showNodeModal.value = true
}

function closeModal() {
  showNodeModal.value = false
  adminStore.clearSelectedUser()
}

function formatDate(ts: number | null): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN')
}

function authMethod(user: AdminUser): string {
  const methods: string[] = []
  if (user.google_id) methods.push('Google')
  if (user.github_id) methods.push('GitHub')
  if (user.email && !user.google_id && !user.github_id) methods.push('Email')
  return methods.join(' / ') || '-'
}

// 构建节点树
function buildTree(nodes: UserNode[]): (UserNode & { children: UserNode[] })[] {
  const map = new Map<string, UserNode & { children: UserNode[] }>()
  const roots: (UserNode & { children: UserNode[] })[] = []

  for (const n of nodes) {
    map.set(n.id, { ...n, children: [] })
  }
  for (const n of nodes) {
    const node = map.get(n.id)!
    if (n.parent_id && map.has(n.parent_id)) {
      map.get(n.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

// 展开/折叠
const expandedNodes = ref(new Set<string>())

function toggleExpand(nodeId: string) {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

// 重置搜索
watch(searchQuery, (val) => {
  if (!val) handleSearch()
})
</script>

<template>
  <AdminLayout>
    <div class="users-page">
      <h1 class="page-title">用户管理</h1>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索邮箱或昵称..."
            class="search-input"
            @keydown.enter="handleSearch"
          />
        </div>
        <button class="btn-search" @click="handleSearch">搜索</button>
      </div>

      <!-- 用户表格 -->
      <div class="table-wrap">
        <table class="user-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>邮箱</th>
              <th>登录方式</th>
              <th>节点数</th>
              <th>Prompt</th>
              <th>文件夹</th>
              <th>注册时间</th>
              <th>最后同步</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="adminStore.isLoading">
              <td colspan="9" class="table-empty">加载中...</td>
            </tr>
            <tr v-else-if="!adminStore.users.length">
              <td colspan="9" class="table-empty">暂无数据</td>
            </tr>
            <tr v-for="user in adminStore.users" :key="user.id">
              <td>
                <div class="user-cell">
                  <img
                    v-if="user.avatar_url"
                    :src="user.avatar_url"
                    class="user-avatar"
                    alt=""
                  />
                  <span v-else class="user-avatar-placeholder">{{ (user.display_name || user.email || '?')[0] }}</span>
                  <span class="user-name">{{ user.display_name || '-' }}</span>
                </div>
              </td>
              <td class="cell-email">{{ user.email || '-' }}</td>
              <td>{{ authMethod(user) }}</td>
              <td class="cell-num">{{ user.node_count }}</td>
              <td class="cell-num">{{ user.prompt_count }}</td>
              <td class="cell-num">{{ user.folder_count }}</td>
              <td class="cell-date">{{ formatDate(user.created_at) }}</td>
              <td class="cell-date">{{ formatDate(user.last_sync_at) }}</td>
              <td>
                <button class="btn-view" @click="viewUserNodes(user)">查看内容</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="adminStore.totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage <= 1"
          @click="goPage(currentPage - 1)"
        >
          <ChevronLeft :size="16" />
        </button>
        <span class="page-info">
          第 {{ currentPage }} / {{ adminStore.totalPages }} 页
          （共 {{ adminStore.totalUsers }} 人）
        </span>
        <button
          class="page-btn"
          :disabled="currentPage >= adminStore.totalPages"
          @click="goPage(currentPage + 1)"
        >
          <ChevronRight :size="16" />
        </button>
      </div>

      <!-- 用户节点弹窗 -->
      <Teleport to="body">
        <div v-if="showNodeModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>
                {{ adminStore.selectedUser?.display_name || adminStore.selectedUser?.email || '用户' }}
                的内容
              </h2>
              <button class="modal-close" @click="closeModal">
                <X :size="18" />
              </button>
            </div>
            <div class="modal-body">
              <div v-if="!adminStore.selectedUserNodes.length" class="empty-nodes">
                该用户暂无内容
              </div>
              <div v-else class="node-tree">
                <template v-for="node in buildTree(adminStore.selectedUserNodes)" :key="node.id">
                  <div class="tree-node-row" @click="toggleExpand(node.id)">
                    <Folder v-if="node.type === 'folder'" :size="14" class="node-icon folder-icon" />
                    <FileText v-else :size="14" class="node-icon prompt-icon" />
                    <Star v-if="node.is_favorite" :size="10" class="star-icon" />
                    <span class="node-title">{{ node.title || '(无标题)' }}</span>
                    <span v-if="node.children.length" class="node-badge">{{ node.children.length }}</span>
                  </div>
                  <div v-if="node.type === 'prompt' && expandedNodes.has(node.id)" class="node-content-preview">
                    {{ node.content?.slice(0, 300) || '(空内容)' }}
                    <span v-if="(node.content?.length || 0) > 300">...</span>
                  </div>
                  <!-- 子节点 -->
                  <div v-if="node.children.length && expandedNodes.has(node.id)" class="tree-children">
                    <div v-for="child in node.children" :key="child.id">
                      <div class="tree-node-row" @click="toggleExpand(child.id)">
                        <Folder v-if="child.type === 'folder'" :size="14" class="node-icon folder-icon" />
                        <FileText v-else :size="14" class="node-icon prompt-icon" />
                        <span class="node-title">{{ child.title || '(无标题)' }}</span>
                      </div>
                      <div v-if="child.type === 'prompt' && expandedNodes.has(child.id)" class="node-content-preview">
                        {{ (child as any).content?.slice(0, 300) || '(空内容)' }}
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AdminLayout>
</template>

<style scoped>
.users-page {
  max-width: 1200px;
}

.page-title {
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

/* ===================
   Search
   =================== */
.search-bar {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.search-input-wrap {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 20px);
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--color-accent);
}

.btn-search {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--text-on-accent);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.btn-search:hover {
  background: var(--color-accent-hover);
}

/* ===================
   Table
   =================== */
.table-wrap {
  overflow-x: auto;
  margin-bottom: var(--space-4);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.user-table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.user-table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 0.5px solid var(--border-secondary);
  color: var(--text-primary);
  vertical-align: middle;
}

.user-table tr:hover td {
  background: var(--bg-hover);
}

.table-empty {
  text-align: center;
  color: var(--text-tertiary);
  padding: var(--space-8) !important;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--bg-quaternary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
}

.user-name {
  white-space: nowrap;
}

.cell-email {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-num {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.cell-date {
  white-space: nowrap;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.btn-view {
  padding: var(--space-1) var(--space-2);
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-accent);
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;
}

.btn-view:hover {
  background: var(--bg-hover);
}

/* ===================
   Pagination
   =================== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* ===================
   Modal
   =================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90vw;
  max-width: 680px;
  max-height: 80vh;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  border: 0.5px solid var(--border-secondary);
  box-shadow: var(--shadow-lg, 0 8px 30px rgba(0, 0, 0, 0.15));
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 0.5px solid var(--border-secondary);
}

.modal-header h2 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.modal-close:hover {
  background: var(--bg-hover);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.empty-nodes {
  text-align: center;
  color: var(--text-tertiary);
  padding: var(--space-8);
}

/* ===================
   Node Tree
   =================== */
.node-tree {
  font-size: var(--font-size-sm);
}

.tree-node-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.tree-node-row:hover {
  background: var(--bg-hover);
}

.node-icon {
  flex-shrink: 0;
}

.folder-icon {
  color: var(--apple-blue);
}

.prompt-icon {
  color: var(--apple-orange);
}

.star-icon {
  color: var(--apple-orange);
}

.node-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.node-badge {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
}

.node-content-preview {
  margin-left: calc(14px + var(--space-2));
  padding: var(--space-2);
  margin-bottom: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

.tree-children {
  padding-left: var(--space-5);
}
</style>
