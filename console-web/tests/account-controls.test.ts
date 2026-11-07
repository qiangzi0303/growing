import { beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { NForm, NFormItem, NSwitch } from 'naive-ui';
import AccountPage from '@/views/account/index.vue';
import BindChild from '@/features/family/bind-child.vue';

const mocks = vi.hoisted(() => ({ load: vi.fn(), api: vi.fn(), enabled: false, set: vi.fn() }));
const auth = reactive({ profile: { id: 'p', role: 'Parent', displayName: '家长' }, sessionRevision: 0, logoutError: '', resetStore: vi.fn() });
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }));
vi.mock('@/features/legacy/sounds', () => ({ loadSounds: mocks.load }));
vi.mock('@/features/students/api', () => ({ listStudents: vi.fn() }));
vi.mock('@/service/request', () => ({ api: mocks.api }));
beforeEach(() => {
  vi.clearAllMocks(); mocks.enabled = false;
  mocks.set.mockImplementation(async value => { mocks.enabled = value; });
  mocks.load.mockResolvedValue({ isEnabled: () => mocks.enabled, setEnabled: mocks.set });
});
it('uses the Naive switch to update the shared sound engine and keeps logout available', async () => {
  const page = mount(AccountPage, { global: { stubs: { RouterLink: true } } });
  await flushPromises();
  expect(page.findComponent(NSwitch).exists()).toBe(true);
  await page.get('[role="switch"]').trigger('click'); await flushPromises();
  expect(mocks.set).toHaveBeenCalledWith(true);
  expect(page.get('[role="switch"]').attributes('aria-checked')).toBe('true');
  await page.findAll('button').find(button => button.text() === '退出账号')!.trigger('click');
  expect(auth.resetStore).toHaveBeenCalledOnce(); page.unmount();
});
it('uses labeled Naive form items and rejects invalid binding without a request', async () => {
  const page = mount(BindChild);
  expect(page.findComponent(NForm).exists()).toBe(true);
  expect(page.findAllComponents(NFormItem)).toHaveLength(2);
  await page.get('form').trigger('submit'); await flushPromises();
  expect(mocks.api).not.toHaveBeenCalled(); expect(page.text()).toContain('请输入有效孩子用户名'); page.unmount();
});
