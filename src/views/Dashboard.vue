<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchOverviewV2, fetchGrowthTrend, fetchArticles, fetchTrafficSummary, fetchPostMarkers } from '@/api'
import { useCreatorStore } from '@/store/creator'
import type { OverviewStatsV2, GrowthTrend, Article, TrafficSummary, PostMarker } from '@/types'
import VChart from 'vue-echarts'
import { InfoFilled } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, FunnelChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  FunnelChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
])

const router = useRouter()
const { currentCreatorId } = useCreatorStore()

const overview = ref<OverviewStatsV2 | null>(null)
const trend = ref<GrowthTrend | null>(null)
const articles = ref<Article[]>([])
const traffic = ref<TrafficSummary | null>(null)
const postMarkers = ref<PostMarker[]>([])
const loading = ref(true)

// 同期比較: week or month
const period = ref<'week' | 'month'>('week')

async function loadData() {
  loading.value = true
  const [o, t, a, tr, pm] = await Promise.all([
    fetchOverviewV2(period.value),
    fetchGrowthTrend(),
    fetchArticles(),
    fetchTrafficSummary(period.value),
    fetchPostMarkers(),
  ])
  overview.value = o
  trend.value = t
  articles.value = a
  traffic.value = tr
  postMarkers.value = pm
  loading.value = false
}

onMounted(loadData)
watch(currentCreatorId, loadData)

// 切換 period 時重新載入
async function switchPeriod(p: 'week' | 'month') {
  period.value = p
  overview.value = await fetchOverviewV2(p)
  traffic.value = await fetchTrafficSummary(p)
}

const formatNum = (n: number) => n.toLocaleString('zh-TW')
const formatPct = (n: number) => (n * 100).toFixed(1) + '%'

const TODAY = new Date('2026-04-07')
const daysSincePublished = (dateStr: string) => {
  const d = new Date(dateStr)
  const diff = Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  return `${diff} 天前`
}

const periodLabel = computed(() => period.value === 'week' ? 'vs 上週' : 'vs 上月')

// 漏斗圖
const funnelOption = computed(() => {
  if (!overview.value) return {}
  const data = [
    { value: overview.value.reachComparison.current, name: '總觸及人數', itemStyle: { color: '#3b82f6' } },
    { value: overview.value.clicksComparison.current, name: '點擊人數', itemStyle: { color: '#10b981' } },
    { value: overview.value.interactionsComparison.current, name: '互動人數', itemStyle: { color: '#f59e0b' } },
  ]
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) =>
        `${p.name}<br/>${formatNum(p.value)} 人 (${formatPct(p.value / (overview.value?.reachComparison.current || 1))})`,
    },
    series: [{
      type: 'funnel',
      left: '10%',
      top: 20,
      bottom: 20,
      width: '80%',
      minSize: '40%',
      label: {
        show: true,
        position: 'inside',
        formatter: (p: any) => `${p.name}\n${formatNum(p.value)}`,
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
      },
      labelLine: { show: false },
      data,
    }],
  }
})

// 追蹤者成長圖 + 發文標記
const followersChartOption = computed(() => {
  if (!trend.value) return {}
  const markerData = postMarkers.value
    .filter(m => {
      const dateStr = m.date.slice(5)
      return trend.value!.followers.some(p => p.date.slice(5) === dateStr)
    })
    .map(m => ({
      xAxis: m.date.slice(5),
      label: { show: false },
    }))

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const dateStr = params[0]?.axisValue
        const marker = postMarkers.value.find(m => m.date.slice(5) === dateStr)
        let html = `${dateStr}<br/>`
        for (const p of params) {
          html += `${p.seriesName}: ${formatNum(p.value)}<br/>`
        }
        if (marker) {
          html += `<br/>📝 發文: ${marker.title.slice(0, 20)}...`
        }
        return html
      },
    },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trend.value.followers.map(p => p.date.slice(5)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#9ca3af' },
    },
    series: [{
      name: '追蹤者',
      data: trend.value.followers.map(p => p.value),
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#3b82f6', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' },
          ],
        },
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', color: '#d1d5db', width: 1 },
        label: { show: false },
        data: markerData,
      },
    }],
  }
})

// 流量來源橫條圖
const trafficColors: Record<string, string> = {
  recommend: '#3b82f6',
  search: '#10b981',
  profile: '#8b5cf6',
  following: '#f59e0b',
  news: '#ef4444',
  other: '#9ca3af',
}

const trafficChartOption = computed(() => {
  if (!traffic.value) return {}
  const sources = traffic.value.sources
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0]
        return `${p.name}: ${formatNum(p.value)} 人 (${sources[p.dataIndex].percent}%)`
      },
    },
    grid: { left: 100, right: 40, top: 10, bottom: 10 },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: sources.map(s => s.label).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6b7280', fontSize: 13 },
    },
    series: [{
      type: 'bar',
      data: sources.map(s => ({
        value: s.count,
        itemStyle: { color: trafficColors[s.source] || '#9ca3af', borderRadius: [0, 4, 4, 0] },
      })).reverse(),
      barWidth: 20,
      label: {
        show: true,
        position: 'right',
        formatter: (p: any) => {
          const src = sources[sources.length - 1 - p.dataIndex]
          return `${formatNum(p.value)} (${src.percent}%)`
        },
        color: '#6b7280',
        fontSize: 12,
      },
    }],
  }
})

// 近期文章
const timeRange = ref<'7' | '30' | '90'>('30')
const daysSince = (dateStr: string) => {
  const d = new Date(dateStr)
  return Math.max(1, Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)))
}
const recentArticles = computed(() => {
  const days = parseInt(timeRange.value)
  return articles.value
    .filter(a => daysSince(a.publishedAt) <= days)
    .slice(0, 5)
})
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <!-- 同期比較切換 -->
    <div class="range-bar">
      <span class="range-label">比較區間：</span>
      <el-radio-group :model-value="period" size="default" @update:model-value="switchPeriod">
        <el-radio-button value="week">本週 vs 上週</el-radio-button>
        <el-radio-button value="month">本月 vs 上月</el-radio-button>
      </el-radio-group>
    </div>

    <!-- KPI 卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card reach" shadow="never">
        <div class="stat-label">
          總觸及人數
          <el-tooltip content="不重複用戶看到你的文章標題的人數" placement="top">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="stat-value">{{ overview ? formatNum(overview.reachComparison.current) : '-' }}</div>
        <div class="stat-meta">
          <span :class="overview && overview.reachComparison.changePercent >= 0 ? 'positive' : 'negative'">
            {{ overview ? (overview.reachComparison.changePercent >= 0 ? '↑' : '↓') : '' }}
            {{ overview ? Math.abs(overview.reachComparison.changePercent) + '%' : '-' }}
          </span>
          {{ periodLabel }}
        </div>
      </el-card>

      <el-card class="stat-card clicks" shadow="never">
        <div class="stat-label">
          點擊人數
          <el-tooltip content="點擊進入文章全文的不重複用戶數" placement="top">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="stat-value">{{ overview ? formatNum(overview.clicksComparison.current) : '-' }}</div>
        <div class="stat-meta">
          <span :class="overview && overview.clicksComparison.changePercent >= 0 ? 'positive' : 'negative'">
            {{ overview ? (overview.clicksComparison.changePercent >= 0 ? '↑' : '↓') : '' }}
            {{ overview ? Math.abs(overview.clicksComparison.changePercent) + '%' : '-' }}
          </span>
          {{ periodLabel }}
        </div>
      </el-card>

      <el-card class="stat-card interactions" shadow="never">
        <div class="stat-label">
          互動人數
          <el-tooltip content="按表情、留言、分享、打賞的不重複用戶數" placement="top">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="stat-value">{{ overview ? formatNum(overview.interactionsComparison.current) : '-' }}</div>
        <div class="stat-meta">
          <span :class="overview && overview.interactionsComparison.changePercent >= 0 ? 'positive' : 'negative'">
            {{ overview ? (overview.interactionsComparison.changePercent >= 0 ? '↑' : '↓') : '' }}
            {{ overview ? Math.abs(overview.interactionsComparison.changePercent) + '%' : '-' }}
          </span>
          {{ periodLabel }}
        </div>
      </el-card>

      <el-card class="stat-card followers" shadow="never">
        <div class="stat-label">
          追蹤者
          <el-tooltip content="目前追蹤你的不重複用戶總數" placement="top">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="stat-value">{{ overview ? formatNum(overview.followersComparison.current) : '-' }}</div>
        <div class="stat-meta">
          <span :class="overview && overview.followersComparison.changePercent >= 0 ? 'positive' : 'negative'">
            {{ overview ? (overview.followersComparison.changePercent >= 0 ? '↑' : '↓') : '' }}
            {{ overview ? Math.abs(overview.followersComparison.changePercent) + '%' : '-' }}
          </span>
          {{ periodLabel }}
        </div>
      </el-card>
    </div>

    <!-- 漏斗 + 追蹤者趨勢 -->
    <div class="two-col">
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">內容表現漏斗</span>
            <el-tag type="info" size="small">{{ period === 'week' ? '本週' : '本月' }}</el-tag>
          </div>
        </template>
        <v-chart :option="funnelOption" style="height: 320px" autoresize />
      </el-card>

      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">追蹤者成長趨勢</span>
            <el-tag type="info" size="small">近 30 天</el-tag>
          </div>
        </template>
        <v-chart :option="followersChartOption" style="height: 320px" autoresize />
      </el-card>
    </div>

    <!-- 流量來源 -->
    <el-card class="chart-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">流量來源</span>
          <el-tag type="info" size="small">{{ period === 'week' ? '本週' : '本月' }}</el-tag>
        </div>
      </template>
      <v-chart :option="trafficChartOption" style="height: 220px" autoresize />
    </el-card>

    <!-- 近期文章 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 12px">
            <span class="card-title">近期文章表現</span>
            <el-radio-group v-model="timeRange" size="small">
              <el-radio-button value="7">7 天</el-radio-button>
              <el-radio-button value="30">30 天</el-radio-button>
              <el-radio-button value="90">90 天</el-radio-button>
            </el-radio-group>
          </div>
          <el-button text type="primary" @click="$router.push('/articles')">
            查看全部 →
          </el-button>
        </div>
      </template>
      <el-table :data="recentArticles" :show-header="true" stripe>
        <el-table-column prop="title" label="標題" min-width="280">
          <template #default="{ row }">
            <div class="article-title clickable" @click="router.push(`/articles/${row.id}`)">
              {{ row.title }}
            </div>
            <div class="article-date">
              {{ row.publishedAt }} · {{ daysSincePublished(row.publishedAt) }}
              <el-tag
                v-for="st in row.stockTags"
                :key="st.code"
                size="small"
                type="warning"
                effect="plain"
                style="margin-left: 6px"
              >
                {{ st.code }} {{ st.name }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column width="110" align="right">
          <template #header>
            觸及
            <el-tooltip content="看過此篇文章的不重複用戶數" placement="top">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">{{ formatNum(row.reach) }}</template>
        </el-table-column>
        <el-table-column width="110" align="right">
          <template #header>
            點擊
            <el-tooltip content="點擊人數 ÷ 觸及人數" placement="top">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div>{{ formatNum(row.clicks) }}</div>
            <div class="rate">{{ formatPct(row.clicks / row.reach) }}</div>
          </template>
        </el-table-column>
        <el-table-column width="110" align="right">
          <template #header>
            互動
            <el-tooltip content="互動人數 ÷ 觸及人數" placement="top">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div>{{ formatNum(row.interactions) }}</div>
            <div class="rate">{{ formatPct(row.interactions / row.reach) }}</div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.range-bar {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
}

.range-label {
  font-size: 14px;
  color: #6b7280;
  margin-right: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
}
.stat-card.reach { border-left-color: #3b82f6; }
.stat-card.clicks { border-left-color: #10b981; }
.stat-card.interactions { border-left-color: #f59e0b; }
.stat-card.followers { border-left-color: #8b5cf6; }

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-icon {
  font-size: 13px;
  color: #c0c4cc;
  cursor: help;
  transition: color 0.2s;
}
.info-icon:hover { color: #909399; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.stat-meta {
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
}

.positive { color: #10b981; font-weight: 600; }
.negative { color: #ef4444; font-weight: 600; }

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card,
.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.article-title {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  margin-bottom: 2px;
}

.article-title.clickable {
  cursor: pointer;
  transition: color 0.2s;
}
.article-title.clickable:hover {
  color: #3b82f6;
}

.article-date {
  font-size: 12px;
  color: #9ca3af;
}

.rate {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}
</style>
