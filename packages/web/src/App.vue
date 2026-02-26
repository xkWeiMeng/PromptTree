<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from '@/components/common/Toast.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoginModal from '@/components/common/LoginModal.vue'
</script>

<template>
  <RouterView />
  <!-- 全局通知组件 -->
  <Toast />
  <!-- 全局确认弹窗 -->
  <ConfirmDialog />
  <!-- 全局登录弹窗 -->
  <LoginModal />
</template>
