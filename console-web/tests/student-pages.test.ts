import { beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { NDataTable, NPagination, NSelect } from 'naive-ui';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { useRouteStore } from '@/store/modules/route';
import Students from '@/views/students/index.vue';
import Home from '@/views/home/index.vue';
import StudentDetail from '@/views/students/[id].vue';

const mocks = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn(), api: vi.fn() }));
const auth = reactive({ profile: { id: 'parent', role: 'Parent', displayName: '家长', roleSelectionRequired: false }, sessionRevision: 0 });
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }));
vi.mock('@/router', () => ({ router: { currentRoute: { value: { meta: {}, matched: [] } } } }));
vi.mock('@/store/modules/tab', () => ({ useTabStore: () => ({ resetStore: vi.fn(), initHomeTab: vi.fn() }) }));
vi.mock('@/service/request', () => ({ api: mocks.api }));
vi.mock('@/features/students/api', async original => ({ ...await original<object>(), listStudents: mocks.list, getStudentDetail: mocks.detail }));
const children = [{ id: 'a', displayName: '小安' }, { id: 'b', displayName: '小北' }];
const bundle = (id = 'a') => ({ student: children.find(c => c.id === id), report: { subjects: [{ subject: '数学', mastered: 3, read: 4, practice: 5, todayMinutes: 8, totalMinutes: 20 }], warnings: [], lastSyncedAt: null }, growth: { points: [] }, rewards: { entries: [{ confirmation: null }, { confirmation: {} }] } });
async function render(component: typeof Students | typeof Home | typeof StudentDetail, path = '/home') {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/students/:id', component: { template: '<div />' } }, { path: '/:pathMatch(.*)*', component: { template: '<div />' } }] });
  await router.push(path);
  const wrapper = mount(component, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}
beforeEach(() => {
  vi.clearAllMocks(); setActivePinia(createPinia()); auth.profile = { id: 'parent', role: 'Parent', displayName: '家长', roleSelectionRequired: false }; auth.sessionRevision++;
  mocks.list.mockResolvedValue({ rows: children, total: 2, page: 1, pageSize: 2 });
  mocks.detail.mockImplementation((_role, student) => Promise.resolve(bundle(student.id)));
});
it('shows only bound parent children and an account link when empty', async () => {
  const page = await render(Students);
  expect(page.findComponent(NDataTable).exists()).toBe(true);
  expect(page.text()).toContain('我的孩子'); expect(page.text()).toContain('小安');
  expect(page.find('input').exists()).toBe(false);
  expect(mocks.list.mock.calls[0][0]).toBe('Parent'); page.unmount();
  mocks.list.mockResolvedValue({ rows: [], total: 0, page: 1, pageSize: 0 });
  const empty = await render(Students); expect(empty.text()).toContain('尚未添加孩子');
  expect(empty.get('a[href="/account"]').text()).toContain('添加孩子'); empty.unmount();
});
it('uses parent menu labels and hides administrator-only pages', () => {
  const store = useRouteStore();
  expect(store.menus.map(menu => menu.label)).toContain('我的孩子');
  expect(store.menus.map(menu => menu.label)).toContain('孩子概况');
  expect(store.menus.map(menu => menu.key)).not.toContain('members');
  auth.profile.role = 'Admin'; expect(store.menus.map(menu => menu.key)).toContain('members');
});
it('shows a pending state until the list completes', async () => {
  let resolve!: (value: unknown) => void; mocks.list.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const page = await render(Students); expect(page.text()).toContain('正在加载学生列表'); expect(page.text()).not.toContain('尚未添加孩子');
  resolve({ rows: [], total: 0, page: 1, pageSize: 0 }); await flushPromises(); expect(page.text()).toContain('尚未添加孩子'); page.unmount();
});
it('searches and pages admin students using server pagination', async () => {
  auth.profile.role = 'Admin'; mocks.list.mockResolvedValue({ rows: children, total: 21, page: 1, pageSize: 20 });
  const page = await render(Students);
  await page.get('input').setValue('小安'); await page.get('form').trigger('submit'); await flushPromises();
  expect(mocks.list.mock.lastCall?.[1]).toMatchObject({ q: '小安', page: 1 });
  page.getComponent(NPagination).vm.$emit('update:page', 2); await flushPromises();
  expect(mocks.list.mock.lastCall?.[1]).toMatchObject({ q: '小安', page: 2 }); page.unmount();
});
it('associates the search label with the native keyboard-focusable input', async () => {
  auth.profile.role = 'Admin';
  const page = await render(Students);
  try {
    const input = page.get('input').element as HTMLInputElement;
    expect(Array.from(input.labels || []).map(label => label.textContent?.trim())).toContain('姓名或账号');
    expect(input.tabIndex).toBe(0);
    expect(input.disabled).toBe(false);
  } finally { page.unmount(); }
});
it('distinguishes loading, error, retry and empty without turning failure into empty', async () => {
  mocks.list.mockRejectedValueOnce(new Error('网络失败'));
  const page = await render(Students); expect(page.text()).toContain('网络失败'); expect(page.text()).not.toContain('尚未添加孩子');
  await page.get('[data-testid="retry-list"]').trigger('click'); await flushPromises(); expect(page.text()).toContain('小安'); page.unmount();
});
it('shows real admin overview fields and no demo or invented trends', async () => {
  auth.profile.role = 'Admin'; mocks.api.mockResolvedValue({ members: 41, students: 25, parents: 15, admins: 1, syncedThisWeek: 9, confirmations: 4, gameMinutes: 30, cashCents: 1234 });
  const page = await render(Home); expect(mocks.api).toHaveBeenCalledWith('/admin/overview', expect.anything());
  expect(page.text()).toContain('41'); expect(page.text()).toContain('12.34'); expect(page.text()).not.toContain('Soybean'); expect(page.text()).not.toContain('增长'); page.unmount();
});
it('clears the previous child immediately and ignores a late failure', async () => {
  const page = await render(Home); expect(page.text()).toContain('待确认奖励'); expect(page.text()).toContain('数学');
  let reject!: (error: Error) => void;
  mocks.detail.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; })).mockResolvedValueOnce(bundle('a'));
  page.getComponent(NSelect).vm.$emit('update:value', 'b'); await flushPromises(); expect(page.text()).not.toContain('数学'); expect(page.text()).toContain('正在加载');
  page.getComponent(NSelect).vm.$emit('update:value', 'a'); await flushPromises(); reject(new Error('迟到失败')); await flushPromises();
  expect(page.text()).toContain('数学'); expect(page.text()).not.toContain('迟到失败'); page.unmount();
});
it('does not silently select another child on an unbound direct detail URL', async () => {
  const page = await render(StudentDetail, '/students/unbound');
  expect(page.text()).toContain('未绑定'); expect(mocks.detail).not.toHaveBeenCalled(); page.unmount();
});
