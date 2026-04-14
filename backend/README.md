# Creator Dashboard — Backend (FastAPI)

股市爆料同學會 創作者後台的 Python 後端，提供前端 Vue 3 SPA 所需的所有 API。

## 為什麼用 FastAPI

- **快**：寫 endpoint 像寫 Python function 一樣自然
- **型別安全**：Pydantic 直接定義 schema，前端的 TypeScript interface 一一對應
- **自動文件**：跑起來後直接打開 http://localhost:8000/docs 就有 Swagger UI
- **未來好接 CMoney 內部資料**：只要把 `app/mock_data.py` 換成真的 service 即可

## 快速啟動

```bash
cd backend

# 1. 建虛擬環境（建議）
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# 2. 安裝套件
pip install -r requirements.txt

# 3. 啟動 dev server
uvicorn app.main:app --reload --port 8000
```

啟動後：

- API 根目錄：http://localhost:8000
- Swagger UI（互動式文件）：http://localhost:8000/docs
- ReDoc：http://localhost:8000/redoc

## 同時啟動前端 + 後端

開兩個 terminal：

```bash
# Terminal 1 — 後端
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — 前端
cd creator-dashboard-vue   # 即本專案根
npm run dev
```

前端會自動讀取 `.env.development` 裡的 `VITE_API_BASE_URL=http://localhost:8000` 去打後端。

## 切換 Mock / Real 資料

目前所有 endpoint 都從 `app/mock_data.py` 拿資料。
未來要接 CMoney 真實資料時，建議的步驟：

1. 在 `app/services/` 新增實際的 data access 模組（讀 DB 或呼叫 CMoney 內部 API）
2. 在 endpoint 改成呼叫 service 而不是直接 import mock data
3. 用環境變數 `USE_MOCK=true|false` 在 `main.py` 切換

## 部署

| 選項 | 適合場景 |
|---|---|
| 本機 + 簡報直接 share screen | demo 階段（最快） |
| Render / Railway / Fly.io | 公開 demo URL，免費方案夠用 |
| Vercel Python Functions | 跟前端一起部署在 Vercel |
| CMoney 內部機器 | 正式接內部資料時 |

## 資料合約 (Data Contract)

`app/models.py` 的 Pydantic 模型 = 前端 `src/types/index.ts` 的 TypeScript interface。
**任何欄位變動都必須兩邊同步**，否則前端會抓不到資料。
