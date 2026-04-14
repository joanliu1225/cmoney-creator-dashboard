<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchArticleDetail } from '@/api'
import { useCreatorStore } from '@/store/creator'
import type { ArticleDetail } from '@/types'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart, FunnelChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'

use([CanvasRenderer, LineChart, PieChart, BarChart, FunnelChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const route = useRoute()
const router = useRouter()
const { currentCreatorId } = useCreatorStore()
const detail = ref<ArticleDetail | null>(null)
const loading = ref(true)

onMounted(async () => {
  const id = route.params.id as string
  detail.value = await fetchArticleDetail(id)
  loading.value = false
})

// When creator changes, article IDs are different — go back to articles list
watch(currentCreatorId, () => {
  router.push('/articles')
})

const formatNum = (n: number) => n.toLocaleString('zh-TW')
const formatPct = (n: number) => (n * 100).toFixed(1) + '%'

const clickRate = computed(() => detail.value ? detail.value.clicks / detail.value.reach : 0)
const interactionRate = computed(() => detail.value ? detail.value.interactions / detail.value.reach : 0)
const deepRate = computed(() => detail.value ? detail.value.interactions / detail.value.clicks : 0)

// 漏斗圖
const funnelOption = computed(() => {
  if (!detail.value) return {}
  const d = detail.value
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      type: 'funnel',
      left: '10%',
      width: '80%',
      top: 10,
      bottom: 10,
      min: 0,
      max: d.reach,
      sort: 'descending',
      gap: 4,
      label: { show: true, position: 'inside', formatter: '{b}\n{c}' },
      itemStyle: { borderWidth: 0 },
      data: [
        { value: d.reach, name: '觸及', itemStyle: { color: '#3b82f6' } },
        { value: d.clicks, name: '點擊', itemStyle: { color: '#10b981' } },
        { value: d.interactions, name: '互動', itemStyle: { color: '#f59e0b' } },
      ],
    }],
  }
})

// 每日趨勢
const dailyOption = computed(() => {
  if (!detail.value) return {}
  const m = detail.value.dailyMetrics
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['觸及', '點擊', '互動'], bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: m.map(d => d.date.slice(5)),
      axisLabel: { color: '#9ca3af' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#9ca3af' },
    },
    series: [
      { name: '觸及', type: 'line', smooth: true, symbol: 'none', data: m.map(d => d.reach), lineStyle: { color: '#3b82f6' }, itemStyle: { color: '#3b82f6' } },
      { name: '點擊', type: 'line', smooth: true, symbol: 'none', data: m.map(d => d.clicks), lineStyle: { color: '#10b981' }, itemStyle: { color: '#10b981' } },
      { name: '互動', type: 'line', smooth: true, symbol: 'none', data: m.map(d => d.interactions), lineStyle: { color: '#f59e0b' }, itemStyle: { color: '#f59e0b' } },
    ],
  }
})

// 流量來源甜甜圈
const trafficOption = computed(() => {
  if (!detail.value) return {}
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280']
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: detail.value.trafficSources.map((s, i) => ({
        value: s.count,
        name: s.label,
        itemStyle: { color: colors[i] },
      })),
    }],
  }
})

// 互動分類
const engagementOption = computed(() => {
  if (!detail.value) return {}
  const eb = detail.value.engagementBreakdown
  const items = [
    { name: '表情按讚', value: eb.emoji, color: '#f59e0b' },
    { name: '留言', value: eb.comment, color: '#3b82f6' },
    { name: '分享', value: eb.share, color: '#10b981' },
    { name: '打賞', value: eb.donate, color: '#ef4444' },
  ]
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 80, right: 40, top: 10, bottom: 10 },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: items.map(i => i.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6b7280', fontSize: 13 },
    },
    series: [{
      type: 'bar',
      data: items.map(i => ({ value: i.value, itemStyle: { color: i.color, borderRadius: [0, 4, 4, 0] } })),
      barWidth: 20,
      label: { show: true, position: 'right', formatter: '{c}', color: '#6b7280' },
    }],
  }
})

const daysLive = computed(() => {
  if (!detail.value) return 0
  const pub = new Date(detail.value.publishedAt)
  const today = new Date()
  return Math.max(1, Math.round((today.getTime() - pub.getTime()) / 86400000))
})
</script>

<template>
  <div v-loading="loading" class="detail-page">
    <!-- 返回導航 -->
    <div class="back-nav">
      <el-button text @click="router.push('/articles')">
        <span style="margin-right: 4px">←</span> 文章表現
      </el-button>
    </div>

    <template v-if="detail">
      <!-- 文章資訊 -->
      <el-card class="info-card" shadow="never">
        <h2 class="article-title">{{ detail.title }}</h2>
        <div class="article-meta">
          <span>{{ detail.publishedAt }}</span>
          <span class="meta-sep">·</span>
          <span>已發佈 {{ daysLive }} 天</span>
          <template v-if="detail.avgReadDuration">
            <span class="meta-sep">·</span>
            <span>平均閱讀 {{ Math.round(detail.avgReadDuration / 60) }} 分 {{ detail.avgReadDuration % 60 }} 秒</span>
          </template>
        </div>
        <div v-if="detail.stockTags.length" class="tag-row">
          <el-tag v-for="st in detail.stockTags" :key="st.code" size="small" type="warning" effect="plain">
            {{ st.code }} {{ st.name }}
          </el-tag>
        </div>
      </el-card>

      <!-- 4 KPI 卡片 -->
      <div class="kpi-grid">
        <el-card class="kpi-card" shadow="never">
          <div class="kpi-label">觸及人數</div>
          <div class="kpi-value">{{ formatNum(detail.reach) }}</div>
        </el-card>
        <el-card class="kpi-card" shadow="never">
          <div class="kpi-label">點擊 / 率</div>
          <div class="kpi-value">{{ formatNum(detail.clicks) }}</div>
          <div class="kpi-sub">{{ formatPct(clickRate) }}</div>
        </el-card>
        <el-card class="kpi-card" shadow="never">
          <div class="kpi-label">互動 / 率</div>
          <div class="kpi-value">{{ formatNum(detail.interactions) }}</div>
          <div class="kpi-sub">{{ formatPct(interactionRate) }}</div>
        </el-card>
        <el-card class="kpi-card" shadow="never">
          <div class="kpi-label">深度互動率</div>
          <div class="kpi-value">{{ formatPct(deepRate) }}</div>
          <div class="kpi-sub">互動 ÷ 點擊</div>
        </el-card>
      </div>

      <!-- 漏斗圖 -->
      <el-card class="chart-card" shadow="never">
        <div class="card-title">轉換漏斗</div>
        <v-chart :option="funnelOption" style="height: 200px" autoresize />
      </el-card>

      <!-- 雙欄：每日趨勢 + 流量來源 -->
      <div class="two-col">
        <el-card class="chart-card" shadow="never">
          <div class="card-title">每日表現</div>
          <v-chart :option="dailyOption" style="height: 260px" autoresize />
        </el-card>
        <el-card class="chart-card" shadow="never">
          <div class="card-title">流量來源</div>
          <v-chart :option="trafficOption" style="height: 260px" autoresize />
        </el-card>
      </div>

      <!-- 互動分類 -->
      <el-card class="chart-card" shadow="never">
        <div class="card-title">互動分類</div>
        <v-chart :option="engagementOption" style="height: 180px" autoresize />
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.back-nav {
  margin-bottom: -8px;
}

.info-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.article-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.article-meta {
  font-size: 13px;
  color: #9ca3af;
}

.meta-sep {
  margin: 0 6px;
}

.tag-row {
  margin-top: 10px;
  display: flex;
  gap: 6px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.kpi-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
}

.kpi-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
}

.kpi-sub {
  font-size: 13px;
  color: #10b981;
  margin-top: 2px;
}

.chart-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
</style>
