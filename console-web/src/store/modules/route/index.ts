import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { RouteKey, LastLevelRouteKey } from '@elegant-router/types';
import { router } from '@/router';
import { SetupStoreId } from '@/enum';
import { localStg } from '@/utils/storage';
import { businessPages, canVisit } from '@/features/session/policy';
import { useAuthStore } from '../auth';
import { useTabStore } from '../tab';
import { getBreadcrumbsByRoute, getSelectedMenuKeyPathByKey, transformMenuToSearchMenus } from './shared';
export const useRouteStore = defineStore(SetupStoreId.Route, () => {
  const routeHome = ref<LastLevelRouteKey>('home');
  const isInitAuthRoute = ref(false);
  const menus = computed<App.Global.Menu[]>(() =>
    businessPages
      .filter(p => !('hidden' in p) && canVisit(useAuthStore().profile, p.path))
      .map(p => ({
        key: p.name,
        label: useAuthStore().profile?.role === 'Parent' && p.name === 'home' ? '孩子概况'
          : useAuthStore().profile?.role === 'Parent' && p.name === 'students' ? '我的孩子' : p.title,
        routeKey: p.name as RouteKey,
        routePath: p.path as App.Global.Menu['routePath']
      }))
  );
  const searchMenus = computed(() => transformMenuToSearchMenus(menus.value));
  const cacheRoutes = ref<RouteKey[]>([]);
  const excludeCacheRoutes = ref<RouteKey[]>([]);
  const breadcrumbs = computed(() => getBreadcrumbsByRoute(router.currentRoute.value, menus.value));
  function resetStore() {
    localStg.remove('globalTabs');
    isInitAuthRoute.value = false;
    cacheRoutes.value = [];
    useTabStore().resetStore();
  }
  async function initAuthRoute() {
    isInitAuthRoute.value = true;
    useTabStore().initHomeTab();
  }
  function getSelectedMenuKeyPath(key: string) {
    return getSelectedMenuKeyPathByKey(key, menus.value);
  }
  return {
    routeHome,
    menus,
    searchMenus,
    cacheRoutes,
    excludeCacheRoutes,
    breadcrumbs,
    resetStore,
    initAuthRoute,
    isInitAuthRoute,
    getSelectedMenuKeyPath,
    // Business pages deliberately do not use KeepAlive across account changes.
    resetRouteCache: async (_key?: RouteKey) => {},
    updateGlobalMenusByLocale: () => {}
  };
});
