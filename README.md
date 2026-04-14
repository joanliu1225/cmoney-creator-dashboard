# 創作者管理後台 MVP

股市爆料同學會創作者後台原型，給主管提案 demo 使用。

## 技術棧

- **Vue 3** + **Vite** + **TypeScript**
- **Element Plus** — UI 元件庫
- **ECharts** (via vue-echarts) — 圖表
- **Pinia** — 狀態管理
- **Vue Router** — 路由
- **Axios** — HTTP 請求

## 快速啟動

```bash
npm install
npm run dev
```

開啟 http://localhost:5173

## 專案結構

```
src/
├── api/             # API service layer（含 mock/real 切換開關）
│   └── index.ts
├── mock/            # 假數據
│   └── data.ts
├── types/           # TypeScript 型別定義（= 未來 API 合約）
│   └── index.ts
├── layouts/         # 主要排版
│   └── MainLayout.vue
├── views/           # 頁面
│   ├── Dashboard.vue    # 總覽
│   ├── Articles.vue     # 文章表現
│   └── Trends.vue       # 成長趨勢
├── router/          # Vue Router 設定
├── stores/          # Pinia stores（目前未使用）
├── App.vue
├── main.ts
└── style.css
```

## 串接真實 API 的方法

1. 打開 `src/api/index.ts`
2. 把 `USE_MOCK` 改為 `false`
3. 設定 `API_BASE_URL` 為 CMoney 的 API 網址
4. 若需要認證，在 `apiClient` 加上 interceptor 帶 token

```typescript
// src/api/index.ts
const USE_MOCK = false // ← 切換這裡
const API_BASE_URL = 'https://api.cmoney.tw'
```

**前端程式碼完全不用改**，只要確保 API 回傳的資料格式符合 `src/types/index.ts` 的 interface 定義即可。

## 提案 demo 建議流程

1. 提前 10 分鐘 `npm run dev` 開好
2. 分享螢幕 → 開瀏覽器
3. 從「總覽」進入，展示數據卡片與成長圖
4. 切到「文章表現」，展示排行與洞察
5. 切到「成長趨勢」，展示時間區間切換
