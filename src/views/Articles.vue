<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchArticles } from '@/api'
import { useCreatorStore } from '@/store/creator'
import type { Article } from '@/types'
import { InfoFilled, Promotion } from '@element-plus/icons-vue'

const router = useRouter()
const { currentCreatorId } = useCreatorStore()

const articles = ref<Article[]>([])
const loading = ref(true)
const sortBy = ref<'reach' | 'clickRate' | 'interactionRate' | 'dailyReach'>('clickRate')
const timeRange = ref<'7' | '30' | '90' | 'all'>('30')

async function loadData() {
  loading.value = true
  articles.value = await fetchArticles()
  loading.value = false
}

onMounted(loadData)
watch(currentCreatorId, loadData)

// 計算發佈至今的天數（數值）
const TODAY = new Date()
const daysSince = (dateStr: string) => {
  const d = new Date(dateStr)
  return Math.max(1, Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)))
}

// 依時間範圍過濾
const filteredArticles = computed(() => {
  if (timeRange.value === 'all') return articles.value
  const days = parseInt(timeRange.value)
  return articles.value.filter((a) => daysSince(a.publishedAt) <= days)
})

// 計算每篇文章的漏斗率 + 日均
const articlesWithRates = computed(() =>
  filteredArticles.value.map((a) => {
    const days = daysSince(a.publishedAt)
    return {
      ...a,
      clickRate: a.reach > 0 ? a.clicks / a.reach : 0,
      interactionRate: a.reach > 0 ? a.interactions / a.reach : 0,
      deepInteractionRate: a.clicks > 0 ? a.interactions / a.clicks : 0,
      dailyReach: Math.round(a.reach / days),
      dailyClicks: Math.round(a.clicks / days),
      daysLive: days,
    }
  })
)

const sortedArticles = computed(() => {
  return [...articlesWithRates.value].sort((a, b) => {
    const aVal = (a as any)[sortBy.value] ?? 0
    const bVal = (b as any)[sortBy.value] ?? 0
    return bVal - aVal
  })
})

const formatNum = (n: number) => n.toLocaleString('zh-TW')
const formatPct = (n: number) => (n * 100).toFixed(1) + '%'

const daysSincePublished = (dateStr: string) => {
  const diff = daysSince(dateStr)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  return `${diff} 天前`
}

// 找出最佳表現的文章
const bestPerformer = computed(() => {
  if (articlesWithRates.value.length === 0) return null
  return [...articlesWithRates.value].sort((a, b) => b.clickRate - a.clickRate)[0]
})
</script>

<template>
  <div v-loading="loading" class="articles-page">
    <!-- 最佳文章洞察 -->
    <el-card v-if="bestPerformer" class="insight-card" shadow="never">
      <div class="insight-content">
        <div class="insight-icon">💡</div>
        <div class="insight-text">
          <div class="insight-title">本月表現最佳</div>
          <div class="insight-desc">
            <strong>「{{ bestPerformer.title }}」</strong><br />
            觸及 {{ formatNum(bestPerformer.reach) }} 人，點擊率
            <strong>{{ formatPct(bestPerformer.clickRate) }}</strong
            >，互動率 <strong>{{ formatPct(bestPerformer.interactionRate) }}</strong
            >。<br />
            <span v-if="bestPerformer.stockTags.length > 0">
              這類標的（{{ bestPerformer.stockTags.map((t) => t.name).join('、') }}）可以考慮多寫。
            </span>
            <span v-else>這類型的文章可以考慮多寫。</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 工具列：時間範圍 + 排序 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">時間範圍：</span>
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button value="7">近 7 天</el-radio-button>
          <el-radio-button value="30">近 30 天</el-radio-button>
          <el-radio-button value="90">近 90 天</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
        </el-radio-group>
        <el-tooltip
          content="因為新發佈的文章曝光時間較短，建議用【日均】欄位來公平比較不同時期的文章表現。"
          placement="top"
        >
          <el-icon class="info-icon" style="margin-left: 6px"><InfoFilled /></el-icon>
        </el-tooltip>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Promotion">購買插文版位</el-button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">排序依據：</span>
        <el-radio-group v-model="sortBy" size="default">
          <el-radio-button value="reach">觸及人數</el-radio-button>
          <el-radio-button value="dailyReach">日均觸及</el-radio-button>
          <el-radio-button value="clickRate">點擊率</el-radio-button>
          <el-radio-button value="interactionRate">互動率</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 文章表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="sortedArticles" stripe>
        <el-table-column label="#" width="60" align="center">
          <template #default="{ $index }">
            <span class="rank" :class="{ 'rank-top': $index < 3 }">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="文章標題" min-width="280">
          <template #default="{ row }">
            <div class="article-title clickable" @click="router.push('/articles/' + row.id)">{{ row.title }}</div>
            <div class="article-meta">
              <span>{{ row.publishedAt }}</span>
              <span class="days-ago">· {{ daysSincePublished(row.publishedAt) }}</span>
              <template v-if="row.stockTags.length > 0">
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
              </template>
              <span v-else class="no-tag">· 未選股標</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column width="110" align="right" sortable prop="reach">
          <template #header>
            觸及
            <el-tooltip
              content="看過此篇文章的不重複用戶數。新發佈的文章曝光時間較短，數字會偏低，建議比較發佈時間相近的文章。"
              placement="top"
            >
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div class="metric-value">{{ formatNum(row.reach) }}</div>
            <div class="metric-sub">不重複用戶</div>
          </template>
        </el-table-column>

        <el-table-column width="110" align="right" sortable prop="dailyReach">
          <template #header>
            日均觸及
            <el-tooltip
              content="觸及人數 ÷ 發佈天數。用於公平比較不同發佈時間的文章表現。"
              placement="top"
            >
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div class="metric-value">{{ formatNum(row.dailyReach) }}</div>
            <div class="metric-sub">/ 天</div>
          </template>
        </el-table-column>

        <el-table-column width="120" align="right" sortable prop="clickRate">
          <template #header>
            點擊
            <el-tooltip
              content="點擊人數：點擊進入全文或展開全文的不重複用戶數。比率 = 點擊人數 ÷ 觸及人數。"
              placement="top"
            >
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div class="metric-value">{{ formatNum(row.clicks) }}</div>
            <div class="metric-sub">
              <el-tag
                size="small"
                :type="row.clickRate > 0.18 ? 'success' : row.clickRate > 0.12 ? 'warning' : 'info'"
              >
                {{ formatPct(row.clickRate) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column width="120" align="right" sortable prop="interactionRate">
          <template #header>
            互動
            <el-tooltip
              content="互動人數：按表情符號、留言或分享過此篇文章的不重複用戶數。比率 = 互動人數 ÷ 觸及人數。"
              placement="top"
            >
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <div class="metric-value">{{ formatNum(row.interactions) }}</div>
            <div class="metric-sub">
              <el-tag
                size="small"
                :type="row.interactionRate > 0.03 ? 'success' : row.interactionRate > 0.02 ? 'warning' : 'info'"
              >
                {{ formatPct(row.interactionRate) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.articles-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.insight-card {
  border: 1px solid #fbbf24;
  background-color: #fffbeb;
  border-radius: 8px;
}

.insight-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.insight-icon {
  font-size: 32px;
}

.insight-title {
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 4px;
}

.insight-desc {
  font-size: 14px;
  color: #78350f;
  line-height: 1.7;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #f3f4f6;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
}

.rank-top {
  background-color: #3b82f6;
  color: #fff;
}

.article-title {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  margin-bottom: 4px;
}

.article-title.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.article-title.clickable:hover {
  color: #3b82f6;
}

.article-meta {
  font-size: 12px;
  color: #9ca3af;
}

.days-ago {
  color: #6b7280;
  margin-left: 4px;
}

.no-tag {
  color: #cbd5e1;
  font-size: 12px;
  margin-left: 6px;
  font-style: italic;
}

.info-icon {
  font-size: 13px;
  color: #c0c4cc;
  cursor: help;
  margin-left: 2px;
  vertical-align: middle;
  transition: color 0.2s;
}

.info-icon:hover {
  color: #909399;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.metric-sub {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.conversion {
  color: #3b82f6;
  font-weight: 600;
  font-size: 15px;
}
</style>
