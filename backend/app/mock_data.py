"""
Mock 數據 — 之後串接 CMoney 真實資料時直接替換成 DB / 內部 API 呼叫即可。
與前端 src/mock/data.ts 的內容對齊。
"""
import random
from datetime import date, timedelta
from typing import List

from .models import (
    Article,
    Creator,
    Feedback,
    GrowthTrend,
    OverviewStats,
    StockTag,
    TrendPoint,
)


# ============================================
# 創作者
# ============================================
mock_creator = Creator(
    id="creator_001",
    name="股海老司機",
    avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=creator001",
    level="general",
    joinedAt="2024-03-15",
    bio="十年投資經驗，專注台股中小型股研究",
)


# ============================================
# 文章
# ============================================
mock_articles: List[Article] = [
    Article(
        id="a001",
        title="台積電 Q3 財報深度解析：先進製程擴產的隱憂與機會",
        publishedAt="2026-04-05",
        reach=12_430,
        clicks=2_312,
        interactions=342,
        stockTags=[
            StockTag(code="2330", name="台積電"),
            StockTag(code="2303", name="聯電"),
        ],
    ),
    Article(
        id="a002",
        title="聯發科技術突破！AI 晶片出貨翻倍，股價還有多少空間?",
        publishedAt="2026-04-03",
        reach=9_820,
        clicks=1_591,
        interactions=287,
        stockTags=[StockTag(code="2454", name="聯發科")],
    ),
    Article(
        id="a003",
        title="航運股反彈真的來了？從運價與 BDI 指數看後市",
        publishedAt="2026-04-01",
        reach=7_543,
        clicks=1_063,
        interactions=203,
        stockTags=[
            StockTag(code="2603", name="長榮"),
            StockTag(code="2609", name="陽明"),
            StockTag(code="2615", name="萬海"),
        ],
    ),
    Article(
        id="a004",
        title="存股族必看：2026 年高殖利率標的精選 10 檔",
        publishedAt="2026-03-28",
        reach=15_892,
        clicks=3_226,
        interactions=456,
        stockTags=[
            StockTag(code="2412", name="中華電"),
            StockTag(code="2882", name="國泰金"),
            StockTag(code="2308", name="台達電"),
            StockTag(code="1216", name="統一"),
            StockTag(code="2881", name="富邦金"),
        ],
    ),
    Article(
        id="a005",
        title="生技股爆發？從新藥審核進度判斷投資時機",
        publishedAt="2026-03-25",
        reach=4_221,
        clicks=376,
        interactions=98,
        stockTags=[],
    ),
    Article(
        id="a006",
        title="金融股遇到升息循環尾聲，該如何布局？",
        publishedAt="2026-03-22",
        reach=6_734,
        clicks=795,
        interactions=167,
        stockTags=[
            StockTag(code="2881", name="富邦金"),
            StockTag(code="2882", name="國泰金"),
        ],
    ),
    Article(
        id="a007",
        title="權值股輪動中，AI 題材還能撐多久？",
        publishedAt="2026-03-19",
        reach=8_102,
        clicks=1_086,
        interactions=221,
        stockTags=[
            StockTag(code="2330", name="台積電"),
            StockTag(code="2454", name="聯發科"),
            StockTag(code="3008", name="大立光"),
        ],
    ),
    Article(
        id="a008",
        title="散戶常犯的五個錯誤，你中了幾個？",
        publishedAt="2026-03-15",
        reach=11_567,
        clicks=1_989,
        interactions=378,
        stockTags=[],
    ),
    Article(
        id="a009",
        title="Fed 決策前夕，台股該多該空？",
        publishedAt="2026-03-12",
        reach=5_983,
        clicks=610,
        interactions=142,
        stockTags=[],
    ),
    Article(
        id="a010",
        title="從法人買賣超看產業輪動訊號",
        publishedAt="2026-03-08",
        reach=7_215,
        clicks=916,
        interactions=189,
        stockTags=[],
    ),
]


# ============================================
# 總覽
# ============================================
_total_reach = sum(a.reach for a in mock_articles)
_total_clicks = sum(a.clicks for a in mock_articles)
_total_interactions = sum(a.interactions for a in mock_articles)

mock_overview = OverviewStats(
    totalArticles=len(mock_articles),
    totalReach=_total_reach,
    totalClicks=_total_clicks,
    totalInteractions=_total_interactions,
    followers=2_156,
    followersGrowth=8.3,
    avgClickRate=_total_clicks / _total_reach,
    avgInteractionRate=_total_interactions / _total_reach,
)


# ============================================
# 成長趨勢
# ============================================
def _generate_trend(base: float, variance: float = 0.2) -> List[TrendPoint]:
    rng = random.Random(int(base))  # 固定種子確保 demo 可重現
    today = date(2026, 4, 7)
    current = base
    points: List[TrendPoint] = []
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        current = current * (1 + (rng.random() - 0.3) * variance * 0.1)
        points.append(TrendPoint(date=d.isoformat(), value=round(current)))
    return points


mock_growth_trend = GrowthTrend(
    followers=_generate_trend(1800, 0.15),
    views=_generate_trend(3500, 0.4),
    engagement=_generate_trend(280, 0.5),
)


# ============================================
# 許願池
# ============================================
mock_feedbacks: List[Feedback] = [
    Feedback(
        id="f001",
        category="feature",
        title="希望可以看到讀者的留言情緒分析",
        description="想知道留言是正面、負面還是中立，方便判斷內容方向。",
        submittedAt="2026-04-04",
        votes=23,
        status="planning",
    ),
    Feedback(
        id="f002",
        category="feature",
        title="加上文章內容的 AI 建議",
        description="希望可以根據歷史表現，自動建議改進方向。",
        submittedAt="2026-04-02",
        votes=18,
        status="pending",
    ),
    Feedback(
        id="f003",
        category="bug",
        title="圖片上傳有時候會失敗",
        description="大概 20% 機率會失敗，目前只能重試。",
        submittedAt="2026-03-30",
        votes=12,
        status="in_progress",
    ),
    Feedback(
        id="f004",
        category="feature",
        title="匯出數據成 Excel",
        description="希望可以匯出文章數據做自己的分析。",
        submittedAt="2026-03-28",
        votes=9,
        status="pending",
    ),
    Feedback(
        id="f005",
        category="other",
        title="文章排程發布",
        description="可以預約發佈時間，配合股市開盤節奏。",
        submittedAt="2026-03-25",
        votes=31,
        status="done",
    ),
]
