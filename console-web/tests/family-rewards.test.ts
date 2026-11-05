import { beforeEach, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { reactive } from 'vue';
import { parseQuery } from 'vue-router';
import type { LocationQuery } from 'vue-router';
import BindChild from '@/features/family/bind-child.vue';
import ConfirmReward from '@/features/rewards/components/confirm-reward.vue';
import RewardLedger from '@/features/rewards/components/reward-ledger.vue';
import RewardsPage from '@/views/rewards/index.vue';
const route = reactive({ query: {} as LocationQuery });
vi.mock('vue-router', async importOriginal => ({ ...await importOriginal<typeof import('vue-router')>(), useRoute: () => route, useRouter: () => ({ replace: vi.fn() }) }));
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
const auth = reactive({ profile: { id: 'p', role: 'Parent' }, sessionRevision: 0 });
vi.mock('@/service/request', () => ({ api: mocks.api }));
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }));
beforeEach(() => { vi.clearAllMocks(); document.body.innerHTML = ''; auth.profile = { id: 'p', role: 'Parent' }; auth.sessionRevision++; mocks.api.mockResolvedValue({}); });
it('binds exact credentials once, refreshes children and clears the password', async () => {
 const w = mount(BindChild); await w.get('input[aria-label="孩子用户名"]').setValue(' child '); await w.get('input[type="password"]').setValue('password1'); await w.get('form').trigger('submit'); await flushPromises();
 expect(mocks.api).toHaveBeenCalledWith('/parent/children/account', expect.objectContaining({ method: 'POST', body: JSON.stringify({ studentUsername: 'child', studentPassword: 'password1' }) })); expect(w.emitted('refresh')).toHaveLength(1); expect((w.get('input[type="password"]').element as HTMLInputElement).value).toBe(''); w.unmount();
});
it('does not forge binding on failure and clears password on session change', async () => {
 mocks.api.mockRejectedValue(new Error('拒绝 (403)')); const w = mount(BindChild); await w.get('input[aria-label="孩子用户名"]').setValue('child'); await w.get('input[type="password"]').setValue('password1'); await w.get('form').trigger('submit'); await flushPromises(); expect(w.emitted('refresh')).toBeUndefined(); expect(w.text()).toContain('403'); expect((w.get('input[type="password"]').element as HTMLInputElement).value).toBe(''); await w.get('input[type="password"]').setValue('password2'); auth.sessionRevision++; await flushPromises(); expect((w.get('input[type="password"]').element as HTMLInputElement).value).toBe(''); w.unmount();
});
const entry = { documentKey: 'secret', hash: 'hash', unit: '第一单元', kind: 'cash' as const, amount: 120, claimedParent: '', claimedAt: '', confirmation: null };
it('shows actual reward meaning then submits once with only key/hash/confirm', async () => {
 let done!: (value: unknown) => void; mocks.api.mockImplementation(() => new Promise(resolve => { done = resolve; })); const w = mount(ConfirmReward, { props: { student: { id: 's', displayName: '小安' }, entry }, attachTo: document.body }); await w.get('button').trigger('click'); await flushPromises(); expect(document.body.textContent).toContain('小安'); expect(document.body.textContent).toContain('1.20'); expect(document.body.textContent).toContain('不会自动转账');
 const button = [...document.querySelectorAll('button')].find(value => value.textContent?.trim() === '确认已兑现')!; button.click(); button.click(); await flushPromises(); expect(mocks.api).toHaveBeenCalledOnce(); expect(mocks.api).toHaveBeenCalledWith('/parent/children/s/confirm-redemption', expect.objectContaining({ body: JSON.stringify({ documentKey: 'secret', hash: 'hash', confirm: true }) })); done({ alreadyConfirmed: true }); await flushPromises(); expect(w.emitted('refresh')).toHaveLength(1); w.unmount();
});
it('Admin has no confirmation control and 409 is not success', async () => {
 auth.profile.role = 'Admin'; const a = mount(ConfirmReward, { props: { student: { id: 's', displayName: '小安' }, entry } }); expect(a.find('button').exists()).toBe(false); a.unmount(); auth.profile.role = 'Parent'; mocks.api.mockRejectedValue(new Error('记录变化 (409)')); const w = mount(ConfirmReward, { props: { student: { id: 's', displayName: '小安' }, entry }, attachTo: document.body }); await w.get('button').trigger('click'); await flushPromises(); [...document.querySelectorAll('button')].find(value => value.textContent?.trim() === '确认已兑现')!.click(); await flushPromises(); expect(w.emitted('refresh')).toBeUndefined(); expect(w.text()).toContain('409'); w.unmount();
});
it('keeps device totals separate from cloud confirmations and converts cash cents', () => {
 const w = mount(RewardLedger, { props: { student: { id: 's', displayName: '小安' }, rewards: { entries: [], summaries: [{ unit: '第一单元', paidCash: 120, paidGame: 5, legacy: false }], invalid: 0, confirmations: [{ id: 'c', documentKey: '', hash: '', kind: 'cash', amount: 120, parentName: '家长', parentId: 'p', claimedAt: '', claimedParent: '', confirmedAt: '2026-11-05' }], note: '' } } }); expect(w.text()).toContain('设备累计摘要'); expect(w.text()).toContain('云端确认账本'); expect(w.text()).toContain('不相加'); expect(w.text()).not.toContain('2.40'); expect(w.text()).toContain('1.20 元'); w.unmount();
});
it('ignores pending bind and confirmation results after account or child changes', async () => {
 let done!: (value: unknown) => void; mocks.api.mockImplementation(() => new Promise(resolve => { done = resolve; })); const w = mount(BindChild); await w.get('input[aria-label="孩子用户名"]').setValue('child'); await w.get('input[type="password"]').setValue('password1'); await w.get('form').trigger('submit'); auth.sessionRevision++; done({ studentId: 's' }); await flushPromises(); expect(w.emitted('refresh')).toBeUndefined(); w.unmount();
 const c = mount(ConfirmReward, { props: { student: { id: 's', displayName: '小安' }, entry }, attachTo: document.body }); await c.get('button').trigger('click'); await flushPromises(); [...document.querySelectorAll('button')].find(value => value.textContent?.trim() === '确认已兑现')!.click(); await flushPromises(); await c.setProps({ student: { id: 'b', displayName: '小贝' } }); done({ alreadyConfirmed: false }); await flushPromises(); expect(c.emitted('refresh')).toBeUndefined(); c.unmount();
});
it('rejects unbound child deep links without fetching another child or hiding errors', async () => {
 route.query = { student: 'unknown' }; mocks.api.mockResolvedValue([{ id: 's', displayName: '小安' }]); const w = mount(RewardsPage); await flushPromises(); expect(w.text()).toContain('未绑定'); expect(mocks.api).toHaveBeenCalledOnce(); expect(w.text()).not.toContain('暂无确认记录'); w.unmount();
});
it('validates Admin deep-link member before requesting filtered ledger', async () => {
 auth.profile.role = 'Admin'; route.query = { student: 'unknown' }; mocks.api.mockRejectedValue(new Error('会员不存在 (404)')); const w = mount(RewardsPage); await flushPromises(); expect(w.text()).toContain('404'); expect(mocks.api).toHaveBeenCalledOnce(); expect(mocks.api.mock.lastCall![0]).toBe('/admin/members/unknown'); w.unmount();
});
it('reads explicit filtered ledger page and discards late results after session change', async () => {
 auth.profile.role = 'Admin'; route.query = { student: 's', parent: 'p', page: '2' }; mocks.api.mockImplementation(async (url: string) => url === '/admin/members/s' ? { member: { id: 's', role: 'Student', displayName: '小安' } } : url === '/admin/members/p' ? { member: { id: 'p', role: 'Parent', displayName: '家长' } } : { rows: [], page: 2, pageSize: 20, total: 21 }); const w = mount(RewardsPage); await flushPromises(); expect(mocks.api).toHaveBeenCalledWith('/admin/redemptions?page=2&student=s&parent=p', expect.anything()); expect(w.text()).toContain('小安 / 家长'); auth.profile.role = 'Parent'; route.query = { student: 'unknown' }; mocks.api.mockRejectedValue(new Error('拒绝 (403)')); auth.sessionRevision++; await flushPromises(); expect(w.text()).not.toContain('小安 / 家长'); expect(w.text()).toContain('403'); w.unmount();
});
it.each([
 ['Admin', 'student='], ['Admin', 'student'], ['Admin', 'parent='], ['Admin', 'parent'], ['Admin', 'student=%20'], ['Admin', 'page='], ['Admin', 'page'], ['Parent', 'student='], ['Parent', 'student'], ['Parent', 'student=%20']
])('rejects explicit empty URL filter for %s: %s without broadening requests', async (role, query) => {
 auth.profile.role = role; route.query = parseQuery(query); mocks.api.mockImplementation(async (url: string) => url === '/parent/children' ? [{ id: 's', displayName: '小安' }] : { rows: [], total: 0, page: 1, pageSize: 20 });
 const w = mount(RewardsPage); await flushPromises(); expect(w.text()).toContain('筛选参数无效'); expect(mocks.api).not.toHaveBeenCalled(); w.unmount();
});
it.each(['Admin', 'Parent'])('retains intentional absent-filter default for %s', async role => {
 auth.profile.role = role; route.query = parseQuery(''); mocks.api.mockImplementation(async (url: string) => url === '/parent/children' ? [] : { rows: [], total: 0, page: 1, pageSize: 20 }); const w = mount(RewardsPage); await flushPromises(); expect(w.text()).not.toContain('筛选参数无效'); expect(mocks.api).toHaveBeenCalledWith(role === 'Parent' ? '/parent/children' : '/admin/redemptions?page=1&student=&parent=', expect.anything()); w.unmount();
});
