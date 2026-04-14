import axios from 'axios'
import type { Creator, Article, OverviewStats, GrowthTrend, Feedback, OverviewStatsV2, ArticleDetail, TrafficSummary, PostMarker } from '@/types'
import {
  mockCreator,
  mockArticles,
  mockOverview,
  mockGrowthTrend,
  mockFeedbacks,
  generateOverviewComparison,
  generateArticleDetail,
  generateTrafficSummary,
  mockPostMarkers,
} from '@/mock/data'

// ============================================
// API Service Layer
//
// 【架構】Vue 3 (Vite) ──HTTP──▶ FastAPI (Python, port 8000)
//
// 【切換 mock / real 的方法】
//   1. 在專案根建立 .env.development，內容：
//        VITE_USE_MOCK=false
//        VITE_API_BASE_URL=http://localhost:8000
//   2. 啟動後端：cd backend && uvicorn app.main:app --reload --port 8000
//   3. 啟動前端：npm run dev
//
// 若 VITE_USE_MOCK 不存在或為 'true'，會走 mock 資料（不需後端也能 demo）
// ============================================

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 模擬 API 延遲，讓 loading 狀態看起來真實
const delay = (ms: number = 300) => new Promise((r) => setTimeout(r, ms))

// ============================================
// 創作者資訊
// ============================================
export async function fetchCreator(): Promise<Creator> {
  if (USE_MOCK) {
    await delay()
    return mockCreator
  }
  const { data } = await apiClient.get<Creator>('/api/creator/me')
  return data
}

// ============================================
// 總覽統計
// ============================================
export async function fetchOverview(): Promise<OverviewStats> {
  if (USE_MOCK) {
    await delay()
    return mockOverview
  }
  const { data } = await apiClient.get<OverviewStats>('/api/creator/overview')
  return data
}

// ============================================
// 文章列表
// ============================================
export async function fetchArticles(): Promise<Article[]> {
  if (USE_MOCK) {
    await delay()
    return mockArticles
  }
  const { data } = await apiClient.get<Article[]>('/api/creator/articles')
  return data
}

// ============================================
// 成長趨勢
// ============================================
export async function fetchGrowthTrend(): Promise<GrowthTrend> {
  if (USE_MOCK) {
    await delay()
    return mockGrowthTrend
  }
  const { data } = await apiClient.get<GrowthTrend>('/api/creator/trends')
  return data
}

// ============================================
// 許願池 — 意見反饋
// ============================================
export async function fetchFeedbacks(): Promise<Feedback[]> {
  if (USE_MOCK) {
    await delay()
    return mockFeedbacks
  }
  const { data } = await apiClient.get<Feedback[]>('/api/feedbacks')
  return data
}

export async function submitFeedback(payload: {
  category: Feedback['category']
  title: string
  description: string
}): Promise<Feedback> {
  if (USE_MOCK) {
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
  const { data } = await apiClient.post<Feedback>('/api/feedbacks', payload)
  return data
}

export async function voteFeedback(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay()
    const f = mockFeedbacks.find((x) => x.id === id)
    if (f) f.votes += 1
    return
  }
  await apiClient.post(`/api/feedbacks/${id}/vote`)
}

// ============================================
// v2: 同期比較總覽
// ============================================
export async function fetchOverviewV2(period: 'week' | 'month'): Promise<OverviewStatsV2> {
  if (USE_MOCK) {
    await delay()
    return generateOverviewComparison(period)
  }
  const { data } = await apiClient.get<OverviewStatsV2>('/api/creator/overview', { params: { period } })
  return data
}

// ============================================
// v2: 文章詳情
// ============================================
export async function fetchArticleDetail(id: string): Promise<ArticleDetail | null> {
  if (USE_MOCK) {
    await delay()
    return generateArticleDetail(id)
  }
  const { data } = await apiClient.get<ArticleDetail>(`/api/creator/articles/${id}/detail`)
  return data
}

// ============================================
// v2: 流量來源
// ============================================
export async function fetchTrafficSummary(period: 'week' | 'month'): Promise<TrafficSummary> {
  if (USE_MOCK) {
    await delay()
    return generateTrafficSummary(period)
  }
  const { data } = await apiClient.get<TrafficSummary>('/api/creator/traffic', { params: { period } })
  return data
}

// ============================================
// v2: 發文標記
// ============================================
export async function fetchPostMarkers(): Promise<PostMarker[]> {
  if (USE_MOCK) {
    await delay()
    return mockPostMarkers
  }
  const { data } = await apiClient.get<PostMarker[]>('/api/creator/post-markers')
  return data
}
