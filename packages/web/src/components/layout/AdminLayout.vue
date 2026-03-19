<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import {
  BarChart3, Users, FileText, LogOut, LayoutDashboard
} from 'lucide-vue-next'

const route = useRoute()
const adminStore = useAdminStore()

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: '用户管理', icon: Users },
  { path: '/admin/content', label: '内容看板', icon: FileText },
]

const currentPath = computed(() => route.path)

function handleLogout() {
  adminStore.logout()
  window.location.href = '/admin'
}
</script>

<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar">
      <div class="admin-sidebar-header">
        <BarChart3 :size="20" />
        <div class="header-text">
          <span>PromptTree Admin</span>
          <span v-if="adminStore.serverUrl" class="server-badge" :title="adminStore.serverUrl">
            {{ adminStore.serverUrl.replace(/^https?:\/\//, '') }}
          </span>
        </div>
      </div>

      <nav class="admin-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="admin-nav-item"
          :class="{ active: currentPath === item.path }"
        >
          <component :is="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="admin-sidebar-footer">
        <button class="admin-nav-item logout-btn" @click="handleLogout">
          <LogOut :size="16" />
          <span>退出管理</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="admin-main">
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--bg-primary);
}

.admin-sidebar {
  width: 220px;
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border-right: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.admin-sidebar-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-4);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  letter-spacing: var(--letter-spacing-tight);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.server-badge {
  font-size: 10px;
  font-weight: var(--font-weight-normal, 400);
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-nav {
  flex: 1;
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--duration-fast) ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.admin-nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.admin-nav-item.active {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.admin-sidebar-footer {
  padding: var(--space-2);
  border-top: 0.5px solid var(--border-secondary);
}

.logout-btn {
  color: var(--color-danger);
}

.logout-btn:hover {
  background: var(--color-danger-bg, rgba(255, 59, 48, 0.1));
  color: var(--color-danger);
}

.admin-main {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}
</style>
