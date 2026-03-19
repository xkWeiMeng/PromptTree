<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAdminStore } from '@/stores/admin'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { Users, FileText, Folder, TrendingUp } from 'lucide-vue-next'

const adminStore = useAdminStore()

onMounted(async () => {
  await Promise.all([
    adminStore.loadOverview(),
    adminStore.loadDailyStats(30),
  ])
})

const stats = computed(() => adminStore.overview)
const daily = computed(() => adminStore.dailyStats)

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: '总用户数', value: stats.value.totalUsers, icon: Users, color: 'var(--apple-blue)' },
    { label: '今日活跃', value: stats.value.todayActiveUsers, icon: TrendingUp, color: 'var(--apple-green)' },
    { label: '今日新增', value: stats.value.todayNewUsers, icon: Users, color: 'var(--apple-orange)' },
    { label: '总 Prompt 数', value: stats.value.totalPrompts, icon: FileText, color: 'var(--apple-purple, #AF52DE)' },
    { label: '总文件夹数', value: stats.value.totalFolders, icon: Folder, color: 'var(--apple-teal, #5AC8FA)' },
    { label: '总节点数', value: stats.value.totalNodes, icon: FileText, color: 'var(--text-secondary)' },
  ]
})

// 趋势图：用 CSS 绘制简单柱状图
const chartMaxNewUsers = computed(() => Math.max(...daily.value.map(d => d.newUsers), 1))
const chartMaxActive = computed(() => Math.max(...daily.value.map(d => d.activeUsers), 1))
</script>

<template>
  <AdminLayout>
    <div class="dashboard">
      <h1 class="page-title">Dashboard</h1>

      <!-- 加载中 -->
      <div v-if="adminStore.isLoading && !stats" class="loading">加载中...</div>

      <!-- 统计卡片 -->
      <div v-if="stats" class="stat-cards">
        <div v-for="card in statCards" :key="card.label" class="stat-card">
          <div class="stat-card-icon" :style="{ background: card.color }">
            <component :is="card.icon" :size="18" />
          </div>
          <div class="stat-card-info">
            <div class="stat-card-value">{{ card.value.toLocaleString() }}</div>
            <div class="stat-card-label">{{ card.label }}</div>
          </div>
        </div>
      </div>

      <!-- 每日趋势 -->
      <div v-if="daily.length" class="chart-section">
        <h2 class="section-title">每日新增用户（近 30 天）</h2>
        <div class="bar-chart">
          <div
            v-for="d in daily"
            :key="d.date"
            class="bar-col"
            :title="`${d.date}\n新增: ${d.newUsers}`"
          >
            <div
              class="bar"
              :style="{ height: (d.newUsers / chartMaxNewUsers) * 100 + '%' }"
            ></div>
            <span v-if="daily.length <= 15" class="bar-label">{{ d.date.slice(5) }}</span>
          </div>
        </div>

        <h2 class="section-title">每日活跃用户（近 30 天）</h2>
        <div class="bar-chart bar-chart--active">
          <div
            v-for="d in daily"
            :key="d.date"
            class="bar-col"
            :title="`${d.date}\n活跃: ${d.activeUsers}`"
          >
            <div
              class="bar bar--active"
              :style="{ height: (d.activeUsers / chartMaxActive) * 100 + '%' }"
            ></div>
            <span v-if="daily.length <= 15" class="bar-label">{{ d.date.slice(5) }}</span>
          </div>
        </div>
      </div>

      <!-- 错误 -->
      <div v-if="adminStore.error" class="error-msg">{{ adminStore.error }}</div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.dashboard {
  max-width: 1100px;
}

.page-title {
  font-size: var(--font-size-2xl, 1.5rem);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-6);
}

.loading {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* ===================
   Stat Cards
   =================== */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04));
}

.stat-card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: white;
  flex-shrink: 0;
}

.stat-card-value {
  font-size: var(--font-size-xl, 1.25rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-card-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

/* ===================
   Chart Section
   =================== */
.chart-section {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 120px;
  padding: var(--space-3);
  background: var(--bg-elevated);
  border: 0.5px solid var(--border-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
  overflow: hidden;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  min-width: 4px;
}

.bar {
  width: 100%;
  max-width: 20px;
  min-height: 2px;
  background: var(--apple-orange);
  border-radius: 2px 2px 0 0;
  transition: height var(--duration-normal) ease;
}

.bar--active {
  background: var(--apple-green);
}

.bar-label {
  font-size: 9px;
  color: var(--text-tertiary);
  margin-top: 4px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.error-msg {
  padding: var(--space-3);
  background: var(--color-danger-bg, rgba(255, 59, 48, 0.1));
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}
</style>
