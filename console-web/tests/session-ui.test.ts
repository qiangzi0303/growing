import { expect, it, vi } from 'vitest';
import { reactive, defineComponent, h, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
const state = vi.hoisted(() => ({ auth: null as any }));
vi.mock('../src/store/modules/auth', () => ({ useAuthStore: () => state.auth }));
vi.mock('@sa/materials', () => ({ LAYOUT_SCROLL_EL_ID: 'scroll' }));
vi.mock('../src/store/modules/app', () => ({
  useAppStore: () => ({ reloadFlag: true, setContentXScrollable: vi.fn() })
}));
vi.mock('../src/store/modules/route', () => ({ useRouteStore: () => ({ cacheRoutes: [], excludeCacheRoutes: [] }) }));
vi.mock('../src/store/modules/tab', () => ({ useTabStore: () => ({ getTabIdByRoute: () => '/students/a' }) }));
vi.mock('../src/store/modules/theme', () => ({ useThemeStore: () => ({ page: { animate: false } }) }));
vi.mock('../src/views/_builtin/login/modules/pwd-login.vue', () => ({
  default: { template: '<div>login form</div>' }
}));
import GlobalContent from '../src/layouts/modules/global-content/index.vue';
import Login from '../src/views/_builtin/login/index.vue';
it('unmounts visible private content immediately when the session is revoked', async () => {
  state.auth = reactive({ isLogin: true, sessionRevision: 1 });
  const unmounted = vi.fn();
  const Child = defineComponent({ unmounted, render: () => h('p', 'private student data') });
  const RouterView = defineComponent({ setup: (_, ctx) => () => ctx.slots.default?.({ Component: Child, route: {} }) });
  const wrapper = mount(GlobalContent, { global: { stubs: { RouterView, Transition: false } } });
  expect(wrapper.text()).toContain('private student data');
  state.auth.isLogin = false;
  state.auth.sessionRevision++;
  await nextTick();
  expect(wrapper.text()).not.toContain('private student data');
  expect(unmounted).toHaveBeenCalledOnce();
  wrapper.unmount();
});
it('keeps failed server logout visible and retryable on the login page', async () => {
  state.auth = reactive({
    logoutError: '退出未完成',
    resetStore: vi.fn(async () => {
      state.auth.logoutError = '';
    })
  });
  const wrapper = mount(Login, {
    global: {
      stubs: { NCard: { template: '<div><slot /></div>' }, NButton: { template: '<button><slot /></button>' } }
    }
  });
  expect(wrapper.find('[role=alert]').text()).toContain('退出未完成');
  await wrapper.find('button').trigger('click');
  await flushPromises();
  expect(state.auth.resetStore).toHaveBeenCalledOnce();
  expect(wrapper.find('[role=alert]').exists()).toBe(false);
  wrapper.unmount();
});
