import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { RouteKey, LastLevelRouteKey } from '@elegant-router/types';
import { router } from '@/router';
import { SetupStoreId } from '@/enum';
import { localStg } from '@/utils/storage';
import type { MenuOption } from 'naive-ui';
import { businessPages, canVisit, menuGroups } from '@/features/session/policy';
import { useSvgIcon } from '@/hooks/common/icon';
import { useAuthStore } from '../auth';
import { useTabStore } from '../tab';
import { getBreadcrumbsByRoute, getSelectedMenuKeyPathByKey, transformMenuToSearchMenus } from './shared';
export const useRouteStore = defineStore(SetupStoreId.Route, () => {
  const routeHome = ref<LastLevelRouteKey>('home');
  const isInitAuthRoute = ref(false);
  const { SvgIconVNode } = useSvgIcon();
  const visiblePages = computed(() =>
    businessPages.filter(p => !('hidden' in p) && canVisit(useAuthStore().profile, p.path))
  );
  /** Flat menu list: breadcrumbs, search and non-vertical layouts use it. */
  const menus = computed<App.Global.Menu[]>(() =>
    visiblePages.value.map(p => ({
      key: p.name,
      label: useAuthStore().profile?.role === 'Parent' && p.name === 'home' ? '孩子概况'
        : useAuthStore().profile?.role === 'Parent' && p.name === 'students' ? '我的孩子' : p.title,
      routeKey: p.name as RouteKey,
      routePath: p.path as App.Global.Menu['routePath'],
      icon: SvgIconVNode({ localIcon: p.icon, fontSize: 18 })
    }))
  );
  /** Sidebar menu: the same items under labelled groups; empty groups are dropped. */
  const groupedMenus = computed<MenuOption[]>(() =>
    menuGroups
      .map(group => ({
        type: 'group' as const,
        key: group.key,
        label: group.label,
        children: menus.value.filter(menu => visiblePages.value.find(p => p.name === menu.key)?.group === group.key)
      }))
      .filter(group => group.children.length > 0)
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
    groupedMenus,
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
