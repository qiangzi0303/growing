import { beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { NSelect, NPagination, NDataTable } from 'naive-ui';
import { createMemoryHistory, createRouter } from 'vue-router';
import Members from '@/views/members/index.vue';
import Detail from '@/views/members/[id].vue';
const mocks = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn() }));
const auth = reactive({ profile: { id: 'admin', role: 'Admin' }, sessionRevision: 0 });
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }));
vi.mock('@/features/members/api', () => ({ listMembers: mocks.list, getMember: mocks.detail }));
vi.mock('@/features/students/components/student-overview.vue', () => ({ default: { props: ['studentId'], template: '<div data-testid="student">学生复用 {{ studentId }}</div>' } }));
const member = { id: 'a', username: 'anna', displayName: '<img src=x onerror=alert(1)>', role: 'Parent', createdAt: '2026-01-01' };
async function render(component: typeof Members | typeof Detail, path = '/members') {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/members/:id', component: { template: '<div />' } }, { path: '/students/:id', component: { template: '<div />' } }, { path: '/:pathMatch(.*)*', component: { template: '<div />' } }] });
  await router.push(path);
  const wrapper = mount(component, { global: { plugins: [router] } }); await flushPromises(); return { wrapper, router };
}
beforeEach(() => { vi.clearAllMocks(); auth.profile = { id: 'admin', role: 'Admin' }; auth.sessionRevision++; mocks.list.mockResolvedValue({ rows: [member], total: 21, page: 1, pageSize: 20 }); mocks.detail.mockResolvedValue({ member, children: [{ id: 's', displayName: '孩子', createdAt: '2026-02-01' }], confirmations: { rows: [], total: 0, page: 1, pageSize: 20 } }); });
it('searches, filters and pages with URL state and escapes names', async () => {
  const { wrapper: w, router } = await render(Members, '/members?q=anna&role=Parent&page=2');
  expect(mocks.list.mock.lastCall?.[0]).toMatchObject({ q: 'anna', role: 'Parent', page: 2 });
  expect(w.text()).toContain(member.displayName); expect(w.find('img').exists()).toBe(false); expect(w.text()).toContain('暂无快照');
  expect(w.findComponent(NDataTable).exists()).toBe(true);
  await w.get('input').setValue('bob'); w.getComponent(NSelect).vm.$emit('update:value', 'Student'); await w.get('form').trigger('submit'); await flushPromises();
  expect(router.currentRoute.value.query).toMatchObject({ q: 'bob', role: 'Student', page: '1' });
  w.getComponent(NPagination).vm.$emit('update:page', 2); await flushPromises(); expect(router.currentRoute.value.query.page).toBe('2'); w.unmount();
});
it('links relations, ledger and preserves return filters', async () => {
  const { wrapper: w } = await render(Detail, '/members/a?q=anna&role=Parent&page=2');
  expect(w.get('a[data-testid="back"]').attributes('href')).toContain('q=anna'); expect(w.get('a[data-testid="back"]').attributes('href')).toContain('page=2');
  expect(w.get('a[data-testid="relation"]').attributes('href')).toBe('/members/s?q=anna&role=Parent&page=2');
  expect(w.get('a[data-testid="ledger"]').attributes('href')).toBe('/rewards?parent=a'); expect(w.text()).toContain('绑定时间'); w.unmount();
});
it('reuses student overview and student ledger scope', async () => {
  mocks.detail.mockResolvedValue({ member: { ...member, role: 'Student' }, parents: [] }); const { wrapper: w } = await render(Detail, '/members/a');
  expect(w.get('[data-testid="student"]').text()).toContain('a'); expect(w.get('[data-testid="ledger"]').attributes('href')).toBe('/rewards?student=a'); w.unmount();
});
it('shows missing/error states and retries instead of empty data', async () => {
  mocks.detail.mockRejectedValueOnce(new Error('会员不存在 (404)')); const { wrapper: w } = await render(Detail, '/members/missing'); expect(w.text()).toContain('404'); expect(w.find('[data-testid="ledger"]').exists()).toBe(false);
  await w.get('[data-testid="retry"]').trigger('click'); await flushPromises(); expect(w.text()).toContain('anna'); w.unmount();
});
it('clears on member switch and ignores late responses and permission changes', async () => {
  let resolve!: (value: unknown) => void; mocks.detail.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const { wrapper: w, router } = await render(Detail, '/members/a'); await router.push('/members/b'); await flushPromises(); expect(w.text()).toContain('anna');
  resolve({ member: { ...member, displayName: '迟到' }, children: [], confirmations: { rows: [] } }); await flushPromises(); expect(w.text()).not.toContain('迟到');
  auth.profile.role = 'Parent'; await flushPromises(); expect(w.text()).not.toContain('anna'); expect(w.text()).toContain('无权'); w.unmount();
});
it('does not leak a list response after account or session changes', async () => {
  let resolve!: (value: unknown) => void;
  mocks.list.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const { wrapper: w } = await render(Members);
  auth.profile = { id: 'other', role: 'Parent' }; auth.sessionRevision++; await flushPromises();
  resolve({ rows: [member], total: 1, page: 1, pageSize: 20 }); await flushPromises();
  expect(w.text()).toContain('无权'); expect(w.text()).not.toContain(member.displayName); w.unmount();
});
it('clears old detail immediately while the next member is pending', async () => {
  const { wrapper: w, router } = await render(Detail, '/members/a'); expect(w.text()).toContain('anna');
  mocks.detail.mockImplementationOnce(() => new Promise(() => {})); await router.push('/members/b'); await flushPromises();
  expect(w.text()).not.toContain('anna'); expect(w.text()).toContain('正在加载'); w.unmount();
});
it('does not request an undefined member when leaving detail', async () => {
  const { wrapper: w, router } = await render(Detail, '/members/a'); await router.push('/members'); await flushPromises();
  expect(mocks.detail).toHaveBeenCalledTimes(1); w.unmount();
});
it('does not request another member when leaving for a different page with an id', async () => {
  const { wrapper: w, router } = await render(Detail, '/members/a'); await router.push('/students/b'); await flushPromises();
  expect(mocks.detail).toHaveBeenCalledTimes(1); w.unmount();
});
it('preserves list filters when following a recent confirmation student', async () => {
  mocks.detail.mockResolvedValueOnce({ member, children: [], confirmations: { rows: [{ id: 'c', studentId: 's', studentName: '记录中的孩子', kind: 'game', amount: 5, confirmedAt: '2026-02-01' }], total: 1, page: 1, pageSize: 20 } });
  const { wrapper: w, router } = await render(Detail, '/members/a?q=anna&role=Parent&page=2');
  const student = w.findAll('a').find(link => link.text() === '记录中的孩子')!;
  await student.trigger('click'); await flushPromises();
  expect(router.currentRoute.value.query).toMatchObject({ q: 'anna', role: 'Parent', page: '2' });
  expect(w.get('[data-testid="back"]').attributes('href')).toBe('/members?q=anna&role=Parent&page=2'); w.unmount();
});
