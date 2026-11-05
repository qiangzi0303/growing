import { beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import PasswordForm from '@/features/members/components/password-form.vue';
import RoleForm from '@/features/members/components/role-form.vue';
import FamilyEditor from '@/features/members/components/family-editor.vue';
import type { Member } from '@/features/members/api';
const mocks = vi.hoisted(() => ({ api: vi.fn(), clear: vi.fn(), list: vi.fn() }));
const auth = reactive({ profile: { id: 'admin', role: 'Admin' }, sessionRevision: 0, clearSession: mocks.clear });
vi.mock('@/service/request', () => ({ api: mocks.api }));
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }));
vi.mock('@/features/members/api', () => ({ listMembers: mocks.list }));
const member: Member = { id: 'p', role: 'Parent', displayName: '家长', username: 'parent', createdAt: '' };
beforeEach(() => { document.body.innerHTML = ''; vi.clearAllMocks(); auth.profile = { id: 'admin', role: 'Admin' }; auth.sessionRevision++; mocks.api.mockResolvedValue({ changed: true, reauthenticate: false }); mocks.list.mockResolvedValue({ rows: [{ ...member, id: 's', role: 'Student', displayName: '小安' }], page: 1, total: 1, pageSize: 20 }); });
it('rejects mismatched passwords and clears drafts after validation failure', async () => {
  const w = mount(PasswordForm, { props: { member } });
  await w.get('input[aria-label="新密码"]').setValue('password1'); await w.get('input[aria-label="确认密码"]').setValue('password2');
  await w.get('form').trigger('submit'); await flushPromises(); expect(mocks.api).not.toHaveBeenCalled();
  expect(w.findAll('input').every(input => (input.element as HTMLInputElement).value === '')).toBe(true); w.unmount();
});
async function positive(label: string) { await flushPromises(); const button = [...document.querySelectorAll('button')].find(item => item.textContent?.trim() === label)!; expect(button).toBeTruthy(); button.click(); await flushPromises(); }
it('requires role confirmation and sends expectedRole; conflict refreshes without retry', async () => {
  mocks.api.mockRejectedValue({ status: 409 }); const w = mount(RoleForm, { props: { member }, attachTo: document.body });
  await w.get('button').trigger('click'); await flushPromises(); expect(mocks.api).not.toHaveBeenCalled(); expect(document.body.textContent).toContain('家长');
  await positive('确认更改'); expect(mocks.api).toHaveBeenCalledOnce(); expect(mocks.api.mock.lastCall).toEqual(['/admin/members/p/role', expect.objectContaining({ method: 'POST', body: JSON.stringify({ expectedRole: 'Parent', role: 'Student' }) })]);
  expect(w.emitted('refresh')).toEqual([['账号身份已变化，已刷新资料，请重新确认。']]); w.unmount();
});
it('never offers Admin type change or family editing', () => {
  const admin: Member = { ...member, role: 'Admin' }; const role = mount(RoleForm, { props: { member: admin } }); const family = mount(FamilyEditor, { props: { member: admin, children: [] } });
  expect(role.find('button').exists()).toBe(false); expect(family.find('form').exists()).toBe(false); role.unmount(); family.unmount();
});
it('searches actual Student members and binds by studentId', async () => {
  const w = mount(FamilyEditor, { props: { member, children: [] } }); await w.get('input').setValue('小安'); await w.get('form').trigger('submit'); await flushPromises();
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ q: '小安', role: 'Student', page: 1 }));
  await w.findAll('button').find(button => button.text() === '绑定')!.trigger('click'); await flushPromises();
  expect(mocks.api).toHaveBeenCalledWith('/admin/members/p/children', expect.objectContaining({ method: 'POST', body: JSON.stringify({ studentId: 's' }) })); expect(w.emitted('refresh')).toHaveLength(1); w.unmount();
});
it('confirms both names before DELETE and preserves backend failure', async () => {
  mocks.api.mockRejectedValue(Object.assign(new Error('关系不存在 (404)'), { status: 404 })); const w = mount(FamilyEditor, { props: { member, children: [{ id: 's', displayName: '小安', createdAt: '' }] }, attachTo: document.body });
  await w.findAll('button').find(button => button.text() === '解绑')!.trigger('click'); await flushPromises(); expect(mocks.api).not.toHaveBeenCalled(); expect(document.body.textContent).toContain('家长 家长 与学生 小安');
  await positive('确认解绑'); expect(mocks.api).toHaveBeenCalledWith('/admin/members/p/children/s', expect.objectContaining({ method: 'DELETE' })); expect(w.emitted('refresh')).toEqual([['关系不存在 (404)；已刷新资料，请重新确认。']]); expect(w.text()).toContain('404'); expect(w.findAll('button').some(button => button.attributes('disabled') !== undefined)).toBe(false); w.unmount();
});
it('clears drafts and late search/write results on member or session changes', async () => {
  let resolveSearch!: (value: unknown) => void; mocks.list.mockImplementationOnce(() => new Promise(resolve => { resolveSearch = resolve; }));
  const w = mount(FamilyEditor, { props: { member, children: [] } }); await w.get('input').setValue('小安'); await w.get('form').trigger('submit'); await w.setProps({ member: { ...member, id: 'b' } });
  resolveSearch({ rows: [{ ...member, displayName: '过期孩子' }], page: 1, total: 1 }); await flushPromises(); expect(w.text()).not.toContain('过期孩子'); expect((w.get('input').element as HTMLInputElement).value).toBe('');
  await w.get('form').trigger('submit'); await flushPromises(); let resolveWrite!: (value: unknown) => void; mocks.api.mockImplementationOnce(() => new Promise(resolve => { resolveWrite = resolve; }));
  await w.findAll('button').find(button => button.text() === '绑定')!.trigger('click'); auth.sessionRevision++; resolveWrite({ studentId: 's' }); await flushPromises(); expect(w.emitted('refresh')).toBeUndefined(); w.unmount();
});
it('clears passwords on server failure and reenables submission', async () => {
  mocks.api.mockRejectedValue(new Error('拒绝 (403)')); const w = mount(PasswordForm, { props: { member } }); for (const input of w.findAll('input')) await input.setValue('password1'); await w.get('form').trigger('submit'); await flushPromises();
  expect(w.text()).toContain('403'); expect(w.findAll('input').every(input => (input.element as HTMLInputElement).value === '')).toBe(true); expect(w.get('button').attributes('disabled')).toBeUndefined(); w.unmount();
});
it('posts exact password body then clears and reauthenticates locally', async () => {
  mocks.api.mockResolvedValue({ changed: true, reauthenticate: true }); const w = mount(PasswordForm, { props: { member } });
  for (const input of w.findAll('input')) await input.setValue('password1'); await w.get('form').trigger('submit'); await flushPromises();
  expect(mocks.api).toHaveBeenCalledWith('/admin/members/p/password', expect.objectContaining({ method: 'POST', body: JSON.stringify({ newPassword: 'password1', confirmPassword: 'password1' }) }));
  expect(mocks.clear).toHaveBeenCalledOnce(); expect(w.findAll('input').every(input => (input.element as HTMLInputElement).value === '')).toBe(true); w.unmount();
});
it('ignores pending results after switching member', async () => {
  let done!: (value: unknown) => void; mocks.api.mockImplementation(() => new Promise(resolve => { done = resolve; }));
  const w = mount(PasswordForm, { props: { member } }); for (const input of w.findAll('input')) await input.setValue('password1'); await w.get('form').trigger('submit');
  await w.setProps({ member: { ...member, id: 'b' } }); done({ reauthenticate: true }); await flushPromises(); expect(mocks.clear).not.toHaveBeenCalled(); expect(w.text()).not.toContain('已修改'); w.unmount();
});
