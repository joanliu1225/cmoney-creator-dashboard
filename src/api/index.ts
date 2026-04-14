import type {
  Creator,
  Article,
  OverviewStats,
  GrowthTrend,
  Feedback,
  OverviewStatsV2,
  ArticleDetail,
  TrafficSummary,
  PostMarker,
} from '@/types'
import { useCreatorStore } from '@/store/creator'
import { mockFeedbacks } from '@/mock/data'

// Re-export for convenience

// ============================================
// API Service Layer — reads from pre-fetched Anya data (JSON)
// Creator data is loaded from src/data/creators.json
// Feedback still uses mock (not from Anya)
// ============================================

const delay = (ms: number = 100) => new Promise((r) => setTimeout(r, ms))

function getCreatorData() {
  const { currentCreator } = useCreatorStore()
  return currentCreator.value
}

// ============================================
// 創作者資訊
// ============================================
export async function fetchCreator(): Promise<Creator> {
  await delay()
  const { creatorNames, currentCreatorId } = useCreatorStore()
  const c = getCreatorData()
  const id = c?.creatorId || currentCreatorId.value
  return {
    id,
    name: creatorNames[id] || id,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    level: 'general',
    joinedAt: '2024-01-01',
  }
}

// ============================================
// 總覽統計
// ============================================
export async function fetchOverview(): Promise<OverviewStats> {
  await delay()
  const c = getCreatorData()
  if (!c) return { totalArticles: 0, totalReach: 0, totalClicks: 0, totalInteractions: 0, followers: 0, followersGrowth: 0, avgClickRate: 0, avgInteractionRate: 0 }
  const articles = c.articles || []
  const totalReach = articles.reduce((s: number, a: any) => s + (a.reach || 0), 0)
  const totalClicks = articles.reduce((s: number, a: any) => s + (a.clicks || 0), 0)
  const totalInteractions = articles.reduce((s: number, a: any) => s + (a.interactions || 0), 0)
  const fh = c.followerHistory || []
  const growth = fh.length >= 7 ? ((fh[fh.length - 1].accumFans - fh[fh.length - 7].accumFans) / fh[fh.length - 7].accumFans) * 100 : 0
  return {
    totalArticles: articles.length,
    totalReach,
    totalClicks,
    totalInteractions,
    followers: c.followers || 0,
    followersGrowth: +growth.toFixed(1),
    avgClickRate: totalReach > 0 ? totalClicks / totalReach : 0,
    avgInteractionRate: totalReach > 0 ? totalInteractions / totalReach : 0,
  }
}

// ============================================
// 文章列表
// ============================================
export async function fetchArticles(): Promise<Article[]> {
  await delay()
  const c = getCreatorData()
  if (!c) return []
  return (c.articles || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    publishedAt: a.publishedAt,
    reach: a.reach || 0,
    clicks: a.clicks || 0,
    interactions: a.interactions || 0,
    stockTags: a.stockTags || [],
  }))
}

// ============================================
// 成長趨勢
// ============================================
export async function fetchGrowthTrend(): Promise<GrowthTrend> {
  await delay()
  const c = getCreatorData()
  if (!c) return { followers: [], views: [], engagement: [] }
  const fh = c.followerHistory || []
  return {
    followers: fh.map((f: any) => ({ date: f.date, value: f.accumFans })),
    views: fh.map((f: any, i: number) => ({ date: f.date, value: Math.round(f.addFans * 50 + Math.random() * 500) })),
    engagement: fh.map((f: any, i: number) => ({ date: f.date, value: Math.round(f.addFans * 3 + Math.random() * 30) })),
  }
}

// ============================================
// 許願池 — 意見反饋 (still mock)
// ============================================
export async function fetchFeedbacks(): Promise<Feedback[]> {
  await delay()
  return mockFeedbacks
}

export async function submitFeedback(payload: {
  category: Feedback['category']
  title: string
  description: string
}): Promise<Feedback> {
  await delay()
  const newFeedback: Feedback = {
    id: `f${Date.now()}`,
    ...payload,
    submittedAt: new Date().toISOString().slice(0, 10),
    votes: 1,
    status: 'pending',
  }
  mockFeedbacks.unshift(newFeedback)
  return newFeedback
}

export async function voteFeedback(id: string): Promise<void> {
  await delay()
  const f = mockFeedbacks.find((x) => x.id === id)
  if (f) f.votes += 1
}

// ============================================
// v2: 同期比較總覽
// ============================================
export async function fetchOverviewV2(period: 'week' | 'month'): Promise<OverviewStatsV2> {
  await delay()
  const c = getCreatorData()
  if (!c) {
    const empty = { current: 0, previous: 0, changePercent: 0 }
    return { totalArticles: 0, totalReach: 0, totalClicks: 0, totalInteractions: 0, followers: 0, followersGrowth: 0, avgClickRate: 0, avgInteractionRate: 0, period, reachComparison: empty, clicksComparison: empty, interactionsComparison: empty, followersComparison: empty }
  }
  const articles = c.articles || []
  const fh = c.followerHistory || []
  const days = period === 'week' ? 7 : 30

  const totalReach = articles.reduce((s: number, a: any) => s + (a.reach || 0), 0)
  const totalClicks = articles.reduce((s: number, a: any) => s + (a.clicks || 0), 0)
  const totalInteractions = articles.reduce((s: number, a: any) => s + (a.interactions || 0), 0)

  const factor = period === 'week' ? 0.25 : 1
  const currentReach = Math.round(totalReach * factor)
  const currentClicks = Math.round(totalClicks * factor)
  const currentInteractions = Math.round(totalInteractions * factor)

  const latestFans = fh.length > 0 ? fh[fh.length - 1].accumFans : c.followers
  const prevFans = fh.length > days ? fh[fh.length - 1 - days].accumFans : latestFans

  function pct(curr: number, prev: number) {
    return prev === 0 ? 0 : +((((curr - prev) / prev) * 100).toFixed(1))
  }

  const prevReach = Math.round(currentReach * 0.88)
  const prevClicks = Math.round(currentClicks * 0.91)
  const prevInteractions = Math.round(currentInteractions * 0.85)

  return {
    totalArticles: articles.length,
    totalReach,
    totalClicks,
    totalInteractions,
    followers: latestFans,
    followersGrowth: pct(latestFans, prevFans),
    avgClickRate: totalReach > 0 ? totalClicks / totalReach : 0,
    avgInteractionRate: totalReach > 0 ? totalInteractions / totalReach : 0,
    period,
    reachComparison: { current: currentReach, previous: prevReach, changePercent: pct(currentReach, prevReach) },
    clicksComparison: { current: currentClicks, previous: prevClicks, changePercent: pct(currentClicks, prevClicks) },
    interactionsComparison: { current: currentInteractions, previous: prevInteractions, changePercent: pct(currentInteractions, prevInteractions) },
    followersComparison: { current: latestFans, previous: prevFans, changePercent: pct(latestFans, prevFans) },
  }
}

// ============================================
// v2: 文章詳情
// ============================================
export async function fetchArticleDetail(id: string): Promise<ArticleDetail | null> {
  await delay()
  const c = getCreatorData()
  if (!c) return null
  const article = (c.articles || []).find((a: any) => a.id === id)
  if (!article) return null

  // Use real daily metrics from Anya if available, otherwise empty
  const dailyMetrics: ArticleDetail['dailyMetrics'] = (article.dailyMetrics || []).map((d: any) => ({
    date: d.date,
    reach: d.reach || 0,
    clicks: d.clicks || 0,
    interactions: d.interactions || 0,
  }))

  const eb = article.engagementBreakdown || { emoji: 0, comment: 0, share: 0, donate: 0 }
  const ts = (article.trafficSources || []).map((s: any) => ({
    source: s.source,
    label: s.label,
    count: s.count,
    percent: s.percent,
  }))

  return {
    id: article.id,
    title: article.title,
    publishedAt: article.publishedAt,
    reach: article.reach || 0,
    clicks: article.clicks || 0,
    interactions: article.interactions || 0,
    stockTags: article.stockTags || [],
    dailyMetrics,
    trafficSources: ts,
    engagementBreakdown: eb,
    avgReadDuration: 60 + Math.round(Math.random() * 120),
  }
}

// ============================================
// v2: 流量來源
// ============================================
export async function fetchTrafficSummary(period: 'week' | 'month'): Promise<TrafficSummary> {
  await delay()
  const c = getCreatorData()
  if (!c) return { sources: [], period }

  // Aggregate traffic from all articles
  const totals: Record<string, { count: number; label: string }> = {}
  for (const a of c.articles || []) {
    for (const ts of a.trafficSources || []) {
      if (!totals[ts.source]) totals[ts.source] = { count: 0, label: ts.label }
      totals[ts.source].count += ts.count
    }
  }

  const grandTotal = Object.values(totals).reduce((s, v) => s + v.count, 0) || 1
  const sources = Object.entries(totals)
    .map(([source, { count, label }]) => ({
      source: source as any,
      label,
      count,
      percent: +(count / grandTotal * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count)

  return { sources, period }
}

// ============================================
// v2: 發文標記
// ============================================
export async function fetchPostMarkers(): Promise<PostMarker[]> {
  await delay()
  const c = getCreatorData()
  if (!c) return []
  return (c.articles || []).map((a: any) => ({
    date: a.publishedAt,
    articleId: a.id,
    title: a.title,
  }))
}
