import type {
  Creator,
  Article,
  OverviewStats,
  GrowthTrend,
  Feedback,
  OverviewStatsV2,
  TrafficSource,
  TrafficSummary,
  ArticleDetail,
  PostMarker,
  EngagementBreakdown,
} from '@/types'

// ============================================
// Mock 數據 — 之後串接真實 API 時可直接移除
// ============================================

export const mockCreator: Creator = {
  id: 'creator_001',
  name: '股海老司機',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator001',
  level: 'general',
  joinedAt: '2024-03-15',
  bio: '十年投資經驗，專注台股中小型股研究',
}

export const mockArticles: Article[] = [
  {
    id: 'a001',
    title: '台積電 Q3 財報深度解析：先進製程擴產的隱憂與機會',
    publishedAt: '2026-04-05',
    reach: 12_430,
    clicks: 2_312,
    interactions: 342,
    stockTags: [
      { code: '2330', name: '台積電' },
      { code: '2303', name: '聯電' },
    ],
  },
  {
    id: 'a002',
    title: '聯發科技術突破！AI 晶片出貨翻倍，股價還有多少空間?',
    publishedAt: '2026-04-03',
    reach: 9_820,
    clicks: 1_591,
    interactions: 287,
    stockTags: [{ code: '2454', name: '聯發科' }],
  },
  {
    id: 'a003',
    title: '航運股反彈真的來了？從運價與 BDI 指數看後市',
    publishedAt: '2026-04-01',
    reach: 7_543,
    clicks: 1_063,
    interactions: 203,
    stockTags: [
      { code: '2603', name: '長榮' },
      { code: '2609', name: '陽明' },
      { code: '2615', name: '萬海' },
    ],
  },
  {
    id: 'a004',
    title: '存股族必看：2026 年高殖利率標的精選 10 檔',
    publishedAt: '2026-03-28',
    reach: 15_892,
    clicks: 3_226,
    interactions: 456,
    stockTags: [
      { code: '2412', name: '中華電' },
      { code: '2882', name: '國泰金' },
      { code: '2308', name: '台達電' },
      { code: '1216', name: '統一' },
      { code: '2881', name: '富邦金' },
    ],
  },
  {
    id: 'a005',
    title: '生技股爆發？從新藥審核進度判斷投資時機',
    publishedAt: '2026-03-25',
    reach: 4_221,
    clicks: 376,
    interactions: 98,
    stockTags: [], // 未選股標
  },
  {
    id: 'a006',
    title: '金融股遇到升息循環尾聲，該如何布局？',
    publishedAt: '2026-03-22',
    reach: 6_734,
    clicks: 795,
    interactions: 167,
    stockTags: [
      { code: '2881', name: '富邦金' },
      { code: '2882', name: '國泰金' },
    ],
  },
  {
    id: 'a007',
    title: '權值股輪動中，AI 題材還能撐多久？',
    publishedAt: '2026-03-19',
    reach: 8_102,
    clicks: 1_086,
    interactions: 221,
    stockTags: [
      { code: '2330', name: '台積電' },
      { code: '2454', name: '聯發科' },
      { code: '3008', name: '大立光' },
    ],
  },
  {
    id: 'a008',
    title: '散戶常犯的五個錯誤，你中了幾個？',
    publishedAt: '2026-03-15',
    reach: 11_567,
    clicks: 1_989,
    interactions: 378,
    stockTags: [], // 未選股標（投資心法類）
  },
  {
    id: 'a009',
    title: 'Fed 決策前夕，台股該多該空？',
    publishedAt: '2026-03-12',
    reach: 5_983,
    clicks: 610,
    interactions: 142,
    stockTags: [],
  },
  {
    id: 'a010',
    title: '從法人買賣超看產業輪動訊號',
    publishedAt: '2026-03-08',
    reach: 7_215,
    clicks: 916,
    interactions: 189,
    stockTags: [],
  },
]

// 計算總覽數據（基於 mockArticles 匯總）
const totalReach = mockArticles.reduce((sum, a) => sum + a.reach, 0)
const totalClicks = mockArticles.reduce((sum, a) => sum + a.clicks, 0)
const totalInteractions = mockArticles.reduce((sum, a) => sum + a.interactions, 0)

export const mockOverview: OverviewStats = {
  totalArticles: mockArticles.length,
  totalReach,
  totalClicks,
  totalInteractions,
  followers: 2_156,
  followersGrowth: 8.3,
  avgClickRate: totalClicks / totalReach,
  avgInteractionRate: totalInteractions / totalReach,
}

// 產生過去 30 天的趨勢資料
function generateTrend(
  baseValue: number,
  variance: number = 0.2
): { date: string; value: number }[] {
  const result = []
  const today = new Date('2026-04-07')
  let current = baseValue
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    current = current * (1 + (Math.random() - 0.3) * variance * 0.1)
    result.push({
      date: d.toISOString().slice(0, 10),
      value: Math.round(current),
    })
  }
  return result
}

export const mockGrowthTrend: GrowthTrend = {
  followers: generateTrend(1800, 0.15),
  views: generateTrend(3500, 0.4),
  engagement: generateTrend(280, 0.5),
}

// ============================================
// v2 新增：同期比較、流量來源、文章詳情、發文標記
// ============================================

/** 產生同期比較的 overview 資料 */
export function generateOverviewComparison(period: 'week' | 'month'): OverviewStatsV2 {
  // 用 period 決定回看的資料範圍比例
  const factor = period === 'week' ? 0.25 : 1
  const currentReach = Math.round(totalReach * factor)
  const currentClicks = Math.round(totalClicks * factor)
  const currentInteractions = Math.round(totalInteractions * factor)
  const currentFollowers = 68_576 // 對齊中台 accum_fans_cnt

  // 上一期略低，模擬成長
  const prevReach = Math.round(currentReach * 0.88)
  const prevClicks = Math.round(currentClicks * 0.91)
  const prevInteractions = Math.round(currentInteractions * 0.85)
  const prevFollowers = currentFollowers - 312

  function pct(curr: number, prev: number) {
    return prev === 0 ? 0 : +((((curr - prev) / prev) * 100).toFixed(1))
  }

  return {
    ...mockOverview,
    followers: currentFollowers,
    period,
    reachComparison: { current: currentReach, previous: prevReach, changePercent: pct(currentReach, prevReach) },
    clicksComparison: { current: currentClicks, previous: prevClicks, changePercent: pct(currentClicks, prevClicks) },
    interactionsComparison: { current: currentInteractions, previous: prevInteractions, changePercent: pct(currentInteractions, prevInteractions) },
    followersComparison: { current: currentFollowers, previous: prevFollowers, changePercent: pct(currentFollowers, prevFollowers) },
  }
}

/** 發文標記 — 從 mockArticles 衍生 */
export const mockPostMarkers: PostMarker[] = mockArticles.map(a => ({
  date: a.publishedAt,
  articleId: a.id,
  title: a.title,
}))

/** 流量來源標籤對照 */
const trafficSourceLabels: Record<string, string> = {
  recommend: '推薦動態',
  search: '搜尋',
  profile: '個人主頁',
  following: '追蹤動態',
  news: '新聞',
  other: '其他',
}

/** 產生流量來源摘要 */
export function generateTrafficSummary(period: 'week' | 'month'): TrafficSummary {
  const base = period === 'week' ? 8500 : 35000
  const raw: { source: TrafficSource['source']; pct: number }[] = [
    { source: 'recommend', pct: 0.48 },
    { source: 'search', pct: 0.20 },
    { source: 'profile', pct: 0.13 },
    { source: 'following', pct: 0.10 },
    { source: 'news', pct: 0.06 },
    { source: 'other', pct: 0.03 },
  ]
  const sources: TrafficSource[] = raw.map(r => ({
    source: r.source,
    label: trafficSourceLabels[r.source],
    count: Math.round(base * r.pct),
    percent: +(r.pct * 100).toFixed(1),
  }))
  return { sources, period }
}

/** 產生單篇文章詳情 */
export function generateArticleDetail(articleId: string): ArticleDetail | null {
  const article = mockArticles.find(a => a.id === articleId)
  if (!article) return null

  // 每日指標：從發佈日開始，模擬衰減曲線
  const pubDate = new Date(article.publishedAt)
  const today = new Date('2026-04-07')
  const dayCount = Math.max(1, Math.round((today.getTime() - pubDate.getTime()) / 86400000))
  const days = Math.min(dayCount, 14) // 最多顯示 14 天

  const dailyMetrics: ArticleDetail['dailyMetrics'] = []
  let remainReach = article.reach
  let remainClicks = article.clicks
  let remainInteractions = article.interactions

  for (let i = 0; i < days; i++) {
    const d = new Date(pubDate)
    d.setDate(pubDate.getDate() + i)
    // 指數衰減：第 1 天最高，之後快速下降
    const weight = Math.exp(-i * 0.35)
    const dayReach = i === days - 1 ? remainReach : Math.round(article.reach * weight * 0.3)
    const dayClicks = i === days - 1 ? remainClicks : Math.round(article.clicks * weight * 0.3)
    const dayInteractions = i === days - 1 ? remainInteractions : Math.round(article.interactions * weight * 0.3)

    dailyMetrics.push({
      date: d.toISOString().slice(0, 10),
      reach: Math.max(0, dayReach),
      clicks: Math.max(0, dayClicks),
      interactions: Math.max(0, dayInteractions),
    })
    remainReach -= dayReach
    remainClicks -= dayClicks
    remainInteractions -= dayInteractions
  }

  // 流量來源（每篇文章略有不同）
  const seed = parseInt(articleId.replace(/\D/g, '') || '1')
  const trafficSources: TrafficSource[] = [
    { source: 'recommend', label: '推薦動態', count: Math.round(article.reach * 0.45), percent: 45 },
    { source: 'search', label: '搜尋', count: Math.round(article.reach * 0.22), percent: 22 },
    { source: 'profile', label: '個人主頁', count: Math.round(article.reach * 0.15), percent: 15 },
    { source: 'following', label: '追蹤動態', count: Math.round(article.reach * 0.11), percent: 11 },
    { source: 'news', label: '新聞', count: Math.round(article.reach * 0.05), percent: 5 },
    { source: 'other', label: '其他', count: Math.round(article.reach * 0.02), percent: 2 },
  ]

  // 互動分類 — 對應中台 interaction_type
  const engagementBreakdown: EngagementBreakdown = {
    emoji: Math.round(article.interactions * 0.60),
    comment: Math.round(article.interactions * 0.22),
    share: Math.round(article.interactions * 0.10),
    donate: Math.round(article.interactions * 0.08),
  }

  return {
    ...article,
    dailyMetrics,
    trafficSources,
    engagementBreakdown,
    avgReadDuration: 45 + (seed % 10) * 15, // 45 ~ 180 秒
  }
}

// ============================================
// 許願池 — 意見反饋
// ============================================
export const mockFeedbacks: Feedback[] = [
  {
    id: 'f001',
    category: 'feature',
    title: '希望可以看到讀者的留言情緒分析',
    description: '想知道留言是正面、負面還是中立，方便判斷內容方向。',
    submittedAt: '2026-04-04',
    votes: 23,
    status: 'planning',
  },
  {
    id: 'f002',
    category: 'feature',
    title: '加上文章內容的 AI 建議',
    description: '希望可以根據歷史表現，自動建議改進方向。',
    submittedAt: '2026-04-02',
    votes: 18,
    status: 'pending',
  },
  {
    id: 'f003',
    category: 'bug',
    title: '圖片上傳有時候會失敗',
    description: '大概 20% 機率會失敗，目前只能重試。',
    submittedAt: '2026-03-30',
    votes: 12,
    status: 'in_progress',
  },
  {
    id: 'f004',
    category: 'feature',
    title: '匯出數據成 Excel',
    description: '希望可以匯出文章數據做自己的分析。',
    submittedAt: '2026-03-28',
    votes: 9,
    status: 'pending',
  },
  {
    id: 'f005',
    category: 'other',
    title: '文章排程發布',
    description: '可以預約發佈時間，配合股市開盤節奏。',
    submittedAt: '2026-03-25',
    votes: 31,
    status: 'done',
  },
]
