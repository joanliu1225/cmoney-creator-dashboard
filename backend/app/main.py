"""
Creator Dashboard — FastAPI 後端
================================

【架構】
Vue 3 (Vite, port 5173)  ──HTTP──▶  FastAPI (uvicorn, port 8000)
                                          │
                                          ├─ /api/creator/me
                                          ├─ /api/creator/overview
                                          ├─ /api/creator/articles
                                          ├─ /api/creator/trends
                                          ├─ /api/feedbacks
                                          ├─ /api/feedbacks  (POST)
                                          └─ /api/feedbacks/{id}/vote

【啟動】
    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

【未來串接 CMoney 真實資料】
把 app/mock_data.py 換成真正去讀 DB / 內部 API 的 service 即可，
路由與 response schema 不需改動，前端也不需改動。
"""
from datetime import date
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .mock_data import (
    mock_articles,
    mock_creator,
    mock_feedbacks,
    mock_growth_trend,
    mock_overview,
)
from .models import (
    Article,
    Creator,
    Feedback,
    FeedbackCreate,
    GrowthTrend,
    OverviewStats,
)

app = FastAPI(
    title="Creator Dashboard API",
    description="股市爆料同學會 — 創作者後台 API",
    version="0.1.0",
)

# CORS：允許本機 Vite dev server + Vercel 前端呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://*.vercel.app",  # 之後部署用
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Health
# ============================================
@app.get("/")
def root():
    return {"service": "creator-dashboard-api", "status": "ok"}


# ============================================
# 創作者
# ============================================
@app.get("/api/creator/me", response_model=Creator)
def get_creator_me():
    return mock_creator


# ============================================
# 總覽統計
# ============================================
@app.get("/api/creator/overview", response_model=OverviewStats)
def get_overview():
    return mock_overview


# ============================================
# 文章列表
# ============================================
@app.get("/api/creator/articles", response_model=List[Article])
def get_articles():
    return mock_articles


# ============================================
# 成長趨勢
# ============================================
@app.get("/api/creator/trends", response_model=GrowthTrend)
def get_trends():
    return mock_growth_trend


# ============================================
# 許願池
# ============================================
@app.get("/api/feedbacks", response_model=List[Feedback])
def list_feedbacks():
    return mock_feedbacks


@app.post("/api/feedbacks", response_model=Feedback)
def create_feedback(payload: FeedbackCreate):
    new_id = f"f{len(mock_feedbacks) + 1:03d}"
    new_feedback = Feedback(
        id=new_id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        submittedAt=date.today().isoformat(),
        votes=1,
        status="pending",
    )
    mock_feedbacks.insert(0, new_feedback)
    return new_feedback


@app.post("/api/feedbacks/{feedback_id}/vote")
def vote_feedback(feedback_id: str):
    for f in mock_feedbacks:
        if f.id == feedback_id:
            f.votes += 1
            return {"id": feedback_id, "votes": f.votes}
    raise HTTPException(status_code=404, detail="Feedback not found")
