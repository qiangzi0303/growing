import { watch } from 'vue';
import type { Router } from 'vue-router';
import { useAuthStore } from '@/store/modules/auth';
import { useRouteStore } from '@/store/modules/route';
import { businessPages, canVisit, landing, safeReturn } from '@/features/session/policy';
export function createRouteGuard(router: Router) {
  router.beforeEach(async to => {
    const auth = useAuthStore();
    if (!auth.initialized) await auth.initUserInfo();
    if (auth.restoreError?.status === 403 && to.name === '403') return true;
    if (auth.restoreError?.status === 403) return '/403';
    if (auth.restoreError && to.name !== 'session-error')
      return { path: '/session-error', query: { redirect: `/console${to.fullPath}` } };
    if (to.name === 'session-error') return true;
    const target = landing(auth.profile);
    if (target === '/' || target.startsWith('/?')) {
      window.location.replace(target);
      return false;
    }
    if (to.name === 'login') {
      if (!auth.isLogin) return true;
      return target === '/console/home' ? safeReturn(to.query.redirect).slice('/console'.length) : '/403';
    }
    if (to.meta.constant) return true;
    if (!auth.isLogin) return { path: '/login', query: { redirect: safeReturn(`/console${to.fullPath}`) } };
    if (!canVisit(auth.profile, to.path)) return '/403';
    await useRouteStore().initAuthRoute();
    return true;
  });
  watch(
    () => useAuthStore().sessionRevision,
    () => {
      useRouteStore().resetStore();
      if (!useAuthStore().isLogin && businessPages.some(p => p.name === router.currentRoute.value.name))
        void router.replace({
          path: '/login',
          query: { redirect: safeReturn(`/console${router.currentRoute.value.fullPath}`) }
        });
    },
    { flush: 'sync' }
  );
}
