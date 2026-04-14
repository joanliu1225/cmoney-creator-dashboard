"""
Pydantic 模型 — 對應前端 src/types/index.ts
未來串接 CMoney 真實資料時，這層就是 API 合約 (data contract)。
"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# ============================================
# 創作者
# ============================================
class Creator(BaseModel):
    id: str
    name: str
    avatar: str
    level: Literal["general", "advanced", "columnist"]
    joined_at: str = Field(..., alias="joinedAt")
    bio: Optional[str] = None

    model_config = {"populate_by_name": True}


# ============================================
# 股標（最多 5 個，可為空）
# ============================================
class StockTag(BaseModel):
    code: str
    name: str


# ============================================
# 文章（IG 洞察報告風漏斗）
# ============================================
class Article(BaseModel):
    id: str
    title: str
    published_at: str = Field(..., alias="publishedAt")
    reach: int
    clicks: int
    interactions: int
    stock_tags: List[StockTag] = Field(default_factory=list, alias="stockTags")

    model_config = {"populate_by_name": True}


# ============================================
# 總覽統計卡片
# ============================================
class OverviewStats(BaseModel):
    total_articles: int = Field(..., alias="totalArticles")
    total_reach: int = Field(..., alias="totalReach")
    total_clicks: int = Field(..., alias="totalClicks")
    total_interactions: int = Field(..., alias="totalInteractions")
    followers: int
    followers_growth: float = Field(..., alias="followersGrowth")
    avg_click_rate: float = Field(..., alias="avgClickRate")
    avg_interaction_rate: float = Field(..., alias="avgInteractionRate")

    model_config = {"populate_by_name": True}


# ============================================
# 成長趨勢
# ============================================
class TrendPoint(BaseModel):
    date: str
    value: float


class GrowthTrend(BaseModel):
    followers: List[TrendPoint]
    views: List[TrendPoint]
    engagement: List[TrendPoint]


# ============================================
# 許願池意見反饋
# ============================================
FeedbackCategory = Literal["feature", "bug", "other"]
FeedbackStatus = Literal["pending", "planning", "in_progress", "done"]


class Feedback(BaseModel):
    id: str
    category: FeedbackCategory
    title: str
    description: str
    submitted_at: str = Field(..., alias="submittedAt")
    votes: int
    status: FeedbackStatus

    model_config = {"populate_by_name": True}


class FeedbackCreate(BaseModel):
    category: FeedbackCategory
    title: str
    description: str
