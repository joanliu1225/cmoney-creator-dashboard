import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '總覽' },
        },
        {
          path: 'articles',
          name: 'articles',
          component: () => import('@/views/Articles.vue'),
          meta: { title: '文章表現' },
        },
        {
          path: 'articles/:id',
          name: 'article-detail',
          component: () => import('@/views/ArticleDetail.vue'),
          meta: { title: '文章詳情' },
        },
        {
          path: 'trends',
          name: 'trends',
          component: () => import('@/views/Trends.vue'),
          meta: { title: '成長趨勢' },
        },
      ],
    },
  ],
})

export default router
