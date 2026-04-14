// ============================================
// 資料結構定義
// 未來串接 CMoney API 時，API 回傳格式必須符合這些 interface
// ============================================

/** 創作者基本資訊 */
export interface Creator {
  id: string
  name: string
  avatar: string
  level: 'general' | 'advanced' | 'columnist' // 一般 / 進階 / 專欄作家
  joinedAt: string
  bio?: string
}

/** 股標 — 發文時選擇關聯的股票（最多 5 個） */
export interface StockTag {
  /** 股票代號 */
  code: string
  /** 股票名稱 */
  name: string
}

/** 文章 — 以漏斗概念設計（類似 IG 洞察報告） */
export interface Article {
  id: string
  title: string
  publishedAt: string
  /** 漏斗第 1 層：總觸及人數（不重複用戶數） */
  reach: number
  /** 漏斗第 2 層：點擊人數（展開全文或進入全文頁都算，不重複用戶數） */
  clicks: number
  /** 漏斗第 3 層：互動人數（表情符號、留言、分享，不重複用戶數） */
  interactions: number
  /** 股標（最多 5 個，可為空） */
  stockTags: StockTag[]
}

/** 漏斗比率計算 helper */
export interface ArticleFunnelRates {
  /** 點擊率 = 點擊人數 / 觸及人數 */
  clickRate: number
  /** 互動率 = 互動人數 / 觸及人數 */
  interactionRate: number
  /** 深度互動率 = 互動人數 / 點擊人數 */
  deepInteractionRate: number
}

/** 總覽統計卡片 */
export interface OverviewStats {
  /** 總文章數 */
  totalArticles: number
  /** 總觸及人數（近 30 天，不重複） */
  totalReach: number
  /** 總點擊人數（近 30 天，不重複） */
  totalClicks: number
  /** 總互動人數（近 30 天，不重複） */
  totalInteractions: number
  /** 追蹤者數 */
  followers: number
  /** 追蹤者成長 vs 上週 (%) */
  followersGrowth: number
  /** 平均點擊率（點擊/觸及） */
  avgClickRate: number
  /** 平均互動率（互動/觸及） */
  avgInteractionRate: number
}

/** 時間序列資料點 */
export interface TrendPoint {
  date: string
  value: number
}

/** 成長趨勢資料 */
export interface GrowthTrend {
  followers: TrendPoint[]
  views: TrendPoint[]
  engagement: TrendPoint[]
}

/** 意見反饋（許願池） */
export interface Feedback {
  id: string
  /** 類型：功能許願 / Bug 回報 / 其他建議 */
  category: 'feature' | 'bug' | 'other'
  title: string
  description: string
  submittedAt: string
  /** 票數（其他創作者可以投同意） */
  votes: number
  /** 狀態 */
  status: 'pending' | 'planning' | 'in_progress' | 'done'
}

// ============================================
// v2 新增：同期比較、流量來源、文章詳情、發文標記
// ============================================

/** 單一指標的同期比較 */
export interface PeriodComparison {
  current: number
  previous: number
  /** ((current - previous) / previous) * 100 */
  changePercent: number
}

/** 總覽統計 v2 — 加入同期比較 */
export interface OverviewStatsV2 extends OverviewStats {
  reachComparison: PeriodComparison
  clicksComparison: PeriodComparison
  interactionsComparison: PeriodComparison
  followersComparison: PeriodComparison
  period: 'week' | 'month'
}

/** 流量來源 — 對應中台 entry_page 分群 */
export interface TrafficSource {
  /** 分群 key，對應 entry_page 歸類 */
  source: 'recommend' | 'search' | 'profile' | 'following' | 'news' | 'other'
  /** 中文顯示名稱 */
  label: string
  count: number
  percent: number
}

/** 整體流量來源摘要 */
export interface TrafficSummary {
  sources: TrafficSource[]
  period: 'week' | 'month'
}

/** 互動分類 — 對應中台 interaction_type */
export interface EngagementBreakdown {
  /** 表情按讚 */
  emoji: number
  /** 留言 */
  comment: number
  /** 分享 */
  share: number
  /** 打賞 */
  donate: number
}

/** 文章詳情 — 單篇文章的深度數據 */
export interface ArticleDetail extends Article {
  /** 每日指標 (發佈後逐日) */
  dailyMetrics: { date: string; reach: number; clicks: number; interactions: number }[]
  /** 流量來源 */
  trafficSources: TrafficSource[]
  /** 互動分類 */
  engagementBreakdown: EngagementBreakdown
  /** 平均閱讀時長 (秒)，對應中台 trans_forum_article_reads.duration */
  avgReadDuration?: number
}

/** 發文標記 — 趨勢圖上標記發文時間點 */
export interface PostMarker {
  date: string
  articleId: string
  title: string
}
