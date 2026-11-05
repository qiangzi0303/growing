import type { RouteRecordRaw } from 'vue-router';
import type { RouteKey } from '@elegant-router/types';
import { businessPages } from '@/features/session/policy';
export function createConsoleRoutes(): RouteRecordRaw[] {
  return [
    { path: '/', name: 'root', redirect: '/home' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/_builtin/login/index.vue'),
      meta: { title: '登录', constant: true }
    },
    {
      path: '/session-error',
      name: 'session-error',
      component: () => import('@/views/console/session-error.vue'),
      meta: { title: '恢复会话', constant: true }
    },
    {
      path: '/403',
      name: '403',
      component: () => import('@/views/_builtin/403/index.vue'),
      meta: { title: '无权访问', constant: true }
    },
    {
      path: '/500',
      name: '500',
      component: () => import('@/views/_builtin/500/index.vue'),
      meta: { title: '服务暂不可用', constant: true }
    },
    {
      path: '/',
      component: () => import('@/layouts/base-layout/index.vue'),
      children: businessPages.map(page => ({
        path: page.path,
        name: page.name,
        component: page.name === 'home' ? () => import('@/views/home/index.vue')
          : page.name === 'students' ? () => import('@/views/students/index.vue')
          : page.name === 'student-detail' ? () => import('@/views/students/[id].vue')
          : page.name === 'reports' ? () => import('@/views/reports/index.vue')
          : page.name === 'members' ? () => import('@/views/members/index.vue')
          : page.name === 'member-detail' ? () => import('@/views/members/[id].vue')
          : page.name === 'rewards' ? () => import('@/views/rewards/index.vue')
          : page.name === 'account' ? () => import('@/views/account/index.vue')
          : () => import('@/views/console/pending.vue'),
        meta: {
          title: page.title,
          localIcon: 'activity',
          adminOnly: page.adminOnly,
          ...('hidden' in page ? { hideInMenu: true, activeMenu: (page.path.startsWith('/students/') ? 'students' : 'members') as RouteKey } : {})
        }
      }))
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/_builtin/404/index.vue'),
      meta: { title: '页面不存在', constant: true }
    }
  ];
}
