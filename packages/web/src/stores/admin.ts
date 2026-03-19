import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as adminApi from '@/api/admin'
import type {
  OverviewStats, DailyStats, AdminUser, PaginatedUsers,
  UserNode, RecentContent,
} from '@/api/admin'

export const useAdminStore = defineStore('admin', () => {
  // ===================
  // State
  // ===================
  const isAuthenticated = ref(adminApi.hasAdminSecret())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Dashboard
  const overview = ref<OverviewStats | null>(null)
  const dailyStats = ref<DailyStats[]>([])

  // Users
  const usersData = ref<PaginatedUsers | null>(null)
  const selectedUser = ref<AdminUser | null>(null)
  const selectedUserNodes = ref<UserNode[]>([])

  // Content
  const recentContent = ref<RecentContent[]>([])

  // ===================
  // Getters
  // ===================
  const users = computed(() => usersData.value?.users ?? [])
  const totalUsers = computed(() => usersData.value?.total ?? 0)
  const totalPages = computed(() => usersData.value?.totalPages ?? 0)
  const currentPage = computed(() => usersData.value?.page ?? 1)

  // ===================
  // Actions
  // ===================

  async function login(secret: string): Promise<boolean> {
    const valid = await adminApi.verifyAdminSecret(secret)
    if (valid) {
      adminApi.setAdminSecret(secret)
      isAuthenticated.value = true
    }
    return valid
  }

  function logout() {
    adminApi.clearAdminSecret()
    isAuthenticated.value = false
    overview.value = null
    dailyStats.value = []
    usersData.value = null
    recentContent.value = []
  }

  async function loadOverview() {
    isLoading.value = true
    error.value = null
    try {
      overview.value = await adminApi.getOverviewStats()
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function loadDailyStats(days = 30) {
    try {
      dailyStats.value = await adminApi.getDailyStats(days)
    } catch (e: any) {
      error.value = e.message
    }
  }

  async function loadUsers(page = 1, pageSize = 20, search = '') {
    isLoading.value = true
    error.value = null
    try {
      usersData.value = await adminApi.getUsers(page, pageSize, search)
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function loadUserNodes(user: AdminUser) {
    selectedUser.value = user
    try {
      selectedUserNodes.value = await adminApi.getUserNodes(user.id)
    } catch (e: any) {
      error.value = e.message
    }
  }

  function clearSelectedUser() {
    selectedUser.value = null
    selectedUserNodes.value = []
  }

  async function loadRecentContent(limit = 50) {
    isLoading.value = true
    error.value = null
    try {
      recentContent.value = await adminApi.getRecentContent(limit)
    } catch (e: any) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    isAuthenticated,
    isLoading,
    error,
    overview,
    dailyStats,
    usersData,
    selectedUser,
    selectedUserNodes,
    recentContent,
    // Getters
    users,
    totalUsers,
    totalPages,
    currentPage,
    // Actions
    login,
    logout,
    loadOverview,
    loadDailyStats,
    loadUsers,
    loadUserNodes,
    clearSelectedUser,
    loadRecentContent,
  }
})
