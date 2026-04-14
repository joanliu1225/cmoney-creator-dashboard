<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { fetchGrowthTrend, fetchPostMarkers } from '@/api'
import { useCreatorStore } from '@/store/creator'
import type { GrowthTrend, PostMarker } from '@/types'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
} from 'echarts/components'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, MarkLineComponent])

const { currentCreatorId } = useCreatorStore()

const trend = ref<GrowthTrend | null>(null)
const markers = ref<PostMarker[]>([])
const loading = ref(true)
const range = ref<'7d' | '30d'>('30d')

async function loadData() {
  loading.value = true
  const [t, m] = await Promise.all([fetchGrowthTrend(), fetchPostMarkers()])
  trend.value = t
  markers.value = m
  loading.value = false
}

onMounted(loadData)
watch(currentCreatorId, loadData)

const filteredTrend = computed(() => {
  if (!trend.value) return null
  const days = range.value === '7d' ? 7 : 30
  return {
    followers: trend.value.followers.slice(-days),
    views: trend.value.views.slice(-days),
    engagement: trend.value.engagement.slice(-days),
  }
})

const makeChartOption = (title: string, color: string, data: { date: string; value: number }[]) => {
  const dateStrs = data.map(p => p.date.slice(5))
  const markerData = markers.value
    .filter(m => dateStrs.includes(m.date.slice(5)))
    .map(m => ({ xAxis: m.date.slice(5), label: { show: false } }))

  return {
    title: { text: title, left: 0, textStyle: { fontSize: 14, color: '#6b7280' } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const dateStr = params[0]?.axisValue
        const marker = markers.value.find(m => m.date.slice(5) === dateStr)
        let html = `${dateStr}<br/>`
        for (const p of params) {
          html += `${p.seriesName}: ${p.value.toLocaleString('zh-TW')}<br/>`
        }
        if (marker) {
          html += `<br/>📝 發文: ${marker.title.slice(0, 20)}...`
        }
        return html
      },
    },
    grid: { left: 45, right: 20, top: 50, bottom: 30 },
    xAxis: {
      type: 'category',
      data: dateStrs,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#9ca3af' },
    },
    series: [
      {
        name: title,
        data: data.map((p) => p.value),
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '00' },
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
      },
    ],
  }
}

const followersOption = computed(() =>
  filteredTrend.value ? makeChartOption('追蹤者', '#3b82f6', filteredTrend.value.followers) : {}
)
const viewsOption = computed(() =>
  filteredTrend.value ? makeChartOption('瀏覽數', '#10b981', filteredTrend.value.views) : {}
)
const engagementOption = computed(() =>
  filteredTrend.value
    ? makeChartOption('互動數', '#f59e0b', filteredTrend.value.engagement)
    : {}
)

// 計算漲幅
const calcGrowth = (data?: { value: number }[]) => {
  if (!data || data.length < 2) return 0
  const first = data[0].value
  const last = data[data.length - 1].value
  return ((last - first) / first) * 100
}

const growthSummary = computed(() => {
  if (!filteredTrend.value) return null
  return {
    followers: calcGrowth(filteredTrend.value.followers),
    views: calcGrowth(filteredTrend.value.views),
    engagement: calcGrowth(filteredTrend.value.engagement),
  }
})
</script>

<template>
  <div v-loading="loading" class="trends-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">時間範圍：</span>
        <el-radio-group v-model="range" size="default">
          <el-radio-button value="7d">近 7 天</el-radio-button>
          <el-radio-button value="30d">近 30 天</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 漲幅摘要 -->
    <div v-if="growthSummary" class="summary-grid">
      <el-card class="summary-card" shadow="never">
        <div class="summary-label">追蹤者漲幅</div>
        <div class="summary-value" :class="{ positive: growthSummary.followers >= 0 }">
          {{ growthSummary.followers >= 0 ? '+' : '' }}{{ growthSummary.followers.toFixed(1) }}%
        </div>
      </el-card>
      <el-card class="summary-card" shadow="never">
        <div class="summary-label">瀏覽數漲幅</div>
        <div class="summary-value" :class="{ positive: growthSummary.views >= 0 }">
          {{ growthSummary.views >= 0 ? '+' : '' }}{{ growthSummary.views.toFixed(1) }}%
        </div>
      </el-card>
      <el-card class="summary-card" shadow="never">
        <div class="summary-label">互動數漲幅</div>
        <div class="summary-value" :class="{ positive: growthSummary.engagement >= 0 }">
          {{ growthSummary.engagement >= 0 ? '+' : '' }}{{ growthSummary.engagement.toFixed(1) }}%
        </div>
      </el-card>
    </div>

    <!-- 三張趨勢圖 -->
    <el-card class="chart-card" shadow="never">
      <v-chart :option="followersOption" style="height: 280px" autoresize />
    </el-card>

    <el-card class="chart-card" shadow="never">
      <v-chart :option="viewsOption" style="height: 280px" autoresize />
    </el-card>

    <el-card class="chart-card" shadow="never">
      <v-chart :option="engagementOption" style="height: 280px" autoresize />
    </el-card>
  </div>
</template>

<style scoped>
.trends-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.toolbar-label {
  font-size: 14px;
  color: #6b7280;
  margin-right: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.summary-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #ef4444;
}

.summary-value.positive {
  color: #10b981;
}

.chart-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
</style>
