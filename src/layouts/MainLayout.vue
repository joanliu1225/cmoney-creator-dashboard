<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchCreator } from '@/api'
import { useCreatorStore } from '@/store/creator'
import type { Creator } from '@/types'

// 許願池 Google 表單連結（未來換成真實連結）
const FEEDBACK_FORM_URL = 'https://forms.gle/your-form-id'

const openFeedbackForm = () => {
  window.open(FEEDBACK_FORM_URL, '_blank', 'noopener')
}

const route = useRoute()
const creator = ref<Creator | null>(null)
const { allCreatorIds, creatorNames, currentCreatorId, setCreator } = useCreatorStore()

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/articles')) return '/articles'
  return path
})

const levelMap = {
  general: { label: '一般創作者', color: '#909399' },
  advanced: { label: '進階創作者', color: '#409EFF' },
  columnist: { label: '專欄作家', color: '#E6A23C' },
}

async function loadCreator() {
  creator.value = await fetchCreator()
}

onMounted(loadCreator)

watch(currentCreatorId, loadCreator)
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <span class="logo-icon">📊</span>
        <span class="logo-text">創作者後台</span>
      </div>

      <div class="creator-selector">
        <el-select
          :model-value="currentCreatorId"
          @update:model-value="setCreator"
          size="small"
          style="width: 100%"
        >
          <el-option
            v-for="id in allCreatorIds"
            :key="id"
            :label="creatorNames[id] || id"
            :value="id"
          />
        </el-select>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        background-color="#1f2937"
        text-color="#d1d5db"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>總覽</span>
        </el-menu-item>
        <el-menu-item index="/articles">
          <el-icon><Document /></el-icon>
          <span>文章表現</span>
        </el-menu-item>
        <el-menu-item index="/trends">
          <el-icon><TrendCharts /></el-icon>
          <span>成長趨勢</span>
        </el-menu-item>
        <el-menu-item index="feedback-external" @click="openFeedbackForm">
          <el-icon><ChatLineSquare /></el-icon>
          <span>許願池</span>
          <span class="external-mark">↗</span>
        </el-menu-item>
      </el-menu>

      <div v-if="creator" class="user-info">
        <el-avatar :src="creator.avatar" :size="40" />
        <div class="user-detail">
          <div class="user-name">{{ creator.name }}</div>
          <el-tag
            size="small"
            :style="{
              backgroundColor: levelMap[creator.level].color,
              color: '#fff',
              border: 'none',
            }"
          >
            {{ levelMap[creator.level].label }}
          </el-tag>
        </div>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-title">{{ route.meta.title }}</div>
        <div class="header-right">
          <el-button :icon="Bell" circle />
          <el-button :icon="Setting" circle />
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import { Bell, Setting } from '@element-plus/icons-vue'
export default { name: 'MainLayout' }
</script>

<style scoped>
.layout {
  height: 100vh;
}

.sidebar {
  background-color: #1f2937;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #374151;
}

.logo-icon {
  font-size: 24px;
}

.creator-selector {
  padding: 12px 16px;
  border-bottom: 1px solid #374151;
}

.creator-selector :deep(.el-select) {
  --el-select-bg-color: #374151;
  --el-select-border-color: #4b5563;
  --el-select-input-color: #d1d5db;
}

.menu {
  flex: 1;
  border-right: none;
}

.menu :deep(.el-menu-item) {
  height: 48px;
}

.external-mark {
  margin-left: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.menu :deep(.el-menu-item.is-active) {
  background-color: #374151 !important;
  border-left: 3px solid #3b82f6;
}

.user-info {
  padding: 16px;
  border-top: 1px solid #374151;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-detail {
  flex: 1;
}

.user-name {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.header-right {
  display: flex;
  gap: 8px;
}

.main {
  background-color: #f5f7fa;
  padding: 24px;
}
</style>
