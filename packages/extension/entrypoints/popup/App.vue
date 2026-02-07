<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')
const prompts = ref<any[]>([])

function handleSelect(prompt: any) {
  // TODO: 发送消息到 content script 填入
  console.log('Selected:', prompt)
}
</script>

<template>
  <div class="popup">
    <header class="header">
      <h1>PromptTree</h1>
    </header>
    
    <div class="search">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索 Prompt..."
      />
    </div>
    
    <div class="list">
      <div 
        v-for="prompt in prompts" 
        :key="prompt.id"
        class="item"
        @click="handleSelect(prompt)"
      >
        {{ prompt.title }}
      </div>
      
      <div v-if="prompts.length === 0" class="empty">
        暂无 Prompt
      </div>
    </div>
  </div>
</template>

<style>
.popup {
  width: 320px;
  min-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  color: #4f46e5;
}

.search {
  padding: 12px 16px;
}

.search input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.search input:focus {
  outline: none;
  border-color: #4f46e5;
}

.list {
  padding: 0 8px 8px;
}

.item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.item:hover {
  background: #f3f4f6;
}

.empty {
  padding: 40px 16px;
  text-align: center;
  color: #9ca3af;
}
</style>
