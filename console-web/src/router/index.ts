import type { App } from 'vue';
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import type { RouterHistory } from 'vue-router';
import { createRouterGuard } from './guard';
import { createConsoleRoutes } from './routes';

const { VITE_ROUTER_HISTORY_MODE = 'history' } = import.meta.env;

const historyCreatorMap: Record<Env.RouterHistoryMode, (base?: string) => RouterHistory> = {
  hash: createWebHashHistory,
  history: createWebHistory,
  memory: createMemoryHistory
};

export const router = createRouter({
  history: historyCreatorMap[VITE_ROUTER_HISTORY_MODE]('/console/'),
  routes: createConsoleRoutes()
});

/** Setup Vue Router */
export async function setupRouter(app: App) {
  app.use(router);
  createRouterGuard(router);
  await router.isReady();
}
