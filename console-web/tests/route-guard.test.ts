import { beforeEach, expect, it, vi } from 'vitest';
import { reactive, nextTick } from 'vue';
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router';
const state = vi.hoisted(() => ({ auth: null as any, routes: { initAuthRoute: vi.fn(), resetStore: vi.fn() } }));
vi.mock('../src/store/modules/auth', () => ({ useAuthStore: () => state.auth }));
vi.mock('../src/store/modules/route', () => ({ useRouteStore: () => state.routes }));
import { businessPages } from '../src/features/session/policy';
import { createConsoleRoutes } from '../src/router/routes';
import { createRouteGuard } from '../src/router/guard/route';
function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory('/console/'),
    routes: [
      ...businessPages.map(p => ({ path: p.path, name: p.name, component: { template: '<div />' } })),
      ...['login', '403', 'session-error'].map(p => ({
        path: `/${p}`,
        name: p,
        component: { template: '<div />' },
        meta: { constant: true }
      }))
    ] as RouteRecordRaw[]
  });
  createRouteGuard(router);
  return router;
}
beforeEach(() => {
  vi.clearAllMocks();
  state.auth = reactive({
    initialized: false,
    isLogin: false,
    profile: null,
    restoreError: null,
    sessionRevision: 0,
    initUserInfo: vi.fn(async () => {
      state.auth.initialized = true;
      return false;
    })
  });
});
it('restores cookie once and redirects a 401 to login without looping', async () => {
  const router = makeRouter();
  await router.push('/students/a');
  await router.isReady();
  expect(router.currentRoute.value.path).toBe('/login');
  expect(state.auth.initUserInfo).toHaveBeenCalledTimes(1);
  expect(router.currentRoute.value.query.redirect).toBe('/console/students/a');
});

it('registers only the business and builtin routes, with the shared layout for business pages',()=>{
 const router=createRouter({history:createMemoryHistory('/console/'),routes:createConsoleRoutes()});
 expect(router.hasRoute('root')).toBe(true);
 for(const page of businessPages) {
   const resolved=router.resolve(page.path.replace(':id','student-a'));
   expect(resolved.name).toBe(page.name);
   expect(resolved.matched).toHaveLength(2);
   expect(resolved.href).toMatch(/^\/console\//);
 }
 for(const name of ['login','403','500','session-error']) expect(router.hasRoute(name)).toBe(true);
 for(const path of ['/about','/function/tab','/manage/user','/login/code-login']) expect(router.resolve(path).name).toBe('not-found');
});
it('routes failed restoration to a retry page instead of claiming unauthenticated success', async () => {
  state.auth.initUserInfo.mockImplementation(async () => {
    state.auth.initialized = true;
    state.auth.restoreError = { status: 503, message: 'offline' };
    return false;
  });
  const router = makeRouter();
  await router.push('/home');
  expect(router.currentRoute.value.path).toBe('/session-error');
  state.auth.restoreError = null;
  state.auth.isLogin = true;
  state.auth.profile = { role: 'Parent', roleSelectionRequired: false };
  await router.push('/home');
  expect(router.currentRoute.value.path).toBe('/home');
});
it('blocks parent member routes and sends unknown roles to forbidden', async () => {
  state.auth.initialized = true;
  state.auth.isLogin = true;
  state.auth.profile = { role: 'Parent', roleSelectionRequired: false };
  const router = makeRouter();
  await router.push('/members/a');
  expect(router.currentRoute.value.path).toBe('/403');
  state.auth.profile = { role: 'Unknown' };
  await router.push('/home');
  expect(router.currentRoute.value.path).toBe('/403');
});
it('navigates away and resets route/tab state immediately on session revocation', async () => {
  state.auth.initialized = true;
  state.auth.isLogin = true;
  state.auth.profile = { role: 'Admin' };
  const router = makeRouter();
  await router.push('/students/a');
  state.auth.isLogin = false;
  state.auth.profile = null;
  state.auth.sessionRevision++;
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(router.currentRoute.value.path).toBe('/login');
  expect(state.routes.resetStore).toHaveBeenCalled();
});
it('restores only a validated login return and still checks the target role', async () => {
  state.auth.initialized = true;
  state.auth.isLogin = true;
  state.auth.profile = { role: 'Parent', roleSelectionRequired: false };
  const router = makeRouter();
  await router.push('/login?redirect=https://evil.test');
  expect(router.currentRoute.value.path).toBe('/home');
  await router.push('/login?redirect=/console/members');
  expect(router.currentRoute.value.path).toBe('/403');
});
