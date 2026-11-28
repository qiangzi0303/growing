import { beforeEach, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { NDatePicker, NPagination } from 'naive-ui';
import { listModels, saveModel, listUsage } from '@/features/ai/api';
import ModelsPage from '@/views/ai-models/index.vue';
import UsagePage from '@/views/ai-usage/index.vue';
import { canVisit } from '@/features/session/policy';

const api = vi.hoisted(() => vi.fn());
const auth = reactive({ profile: { id: 'admin', role: 'Admin' }, sessionRevision: 0 });
vi.mock('@/service/request', () => ({ api }));
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }));
const model = { id: 'chat', purpose: '聊天', model: 'chat-model', endpoint: 'https://provider.test/v1/chat/completions', enabled: true, configured: true, keyHint: '••••1234', revision: 1 };
beforeEach(() => { api.mockReset(); auth.profile = { id: 'admin', role: 'Admin' }; });

it('uses only admin masked configuration and omits blank replacement keys', async () => {
  await listModels();
  expect(api).toHaveBeenLastCalledWith('/admin/ai/models', { signal: undefined });
  await saveModel('chat', { model: 'm', endpoint: model.endpoint, apiKey: '  ', enabled: true });
  const [url, options] = api.mock.lastCall!;
  expect(url).toBe('/admin/ai/models/chat');
  expect(options.method).toBe('PUT');
  expect(JSON.parse(options.body)).toEqual({ model: 'm', endpoint: model.endpoint, enabled: true });
});
it('encodes filters and pagination without changing calendar dates', async () => {
  await listUsage({ from: '2026-11-01', to: '2026-11-23', userId: 'a&b', configId: 'chat', page: 2, pageSize: 20 });
  expect(api.mock.lastCall![0]).toBe('/admin/ai/usage?from=2026-11-01&to=2026-11-23&userId=a%26b&configId=chat&page=2&pageSize=20');
});
it('queries the selected calendar range unchanged, resets pagination and clears both dates', async () => {
  api.mockResolvedValue({ summary: { inputTokens: 0, outputTokens: 0, totalTokens: 0, requests: 0, unknownRequests: 0, failedRequests: 0 }, accounts: [], calls: [], total: 60, page: 1, pageSize: 20 });
  const page = mount(UsagePage); await flushPromises();
  try {
    const picker = page.getComponent(NDatePicker);
    expect(picker.props('type')).toBe('daterange');
    expect(picker.props('valueFormat')).toBe('yyyy-MM-dd');
    expect(picker.props('inputReadonly')).toBe(false);
    page.getComponent(NPagination).vm.$emit('update:page', 2); await flushPromises();
    expect(new URL(api.mock.lastCall![0], 'https://test.invalid').searchParams.get('page')).toBe('2');
    picker.vm.$emit('update:formattedValue', ['2026-10-31', '2026-11-01']);
    await page.get('form').trigger('submit'); await flushPromises();
    const params = new URL(api.mock.lastCall![0], 'https://test.invalid').searchParams;
    expect([params.get('from'), params.get('to'), params.get('page')]).toEqual(['2026-10-31', '2026-11-01', '1']);
    picker.vm.$emit('update:formattedValue', null);
    await page.get('form').trigger('submit'); await flushPromises();
    const cleared = new URL(api.mock.lastCall![0], 'https://test.invalid').searchParams;
    expect([cleared.get('from'), cleared.get('to')]).toEqual(['', '']);
  } finally { page.unmount(); }
});
it('restricts both AI pages to administrators', () => {
  for (const path of ['/ai-models', '/ai-usage']) {
    expect(canVisit({ role: 'Admin' }, path)).toBe(true);
    expect(canVisit({ role: 'Parent', roleSelectionRequired: false }, path)).toBe(false);
  }
});
it('edits a masked model and clears the password after saving', async () => {
  api.mockResolvedValueOnce({ models: [model] }).mockResolvedValueOnce({ ...model, revision: 2 });
  const page = mount(ModelsPage);
  await flushPromises();
  expect(page.text()).toContain(model.keyHint);
  const password = page.get('input[type="password"]');
  expect((password.element as HTMLInputElement).value).toBe('');
  await password.setValue('new-secret');
  await page.get('form').trigger('submit'); await flushPromises();
  expect(JSON.parse(api.mock.lastCall![1].body).apiKey).toBe('new-secret');
  expect((page.get('input[type="password"]').element as HTMLInputElement).value).toBe('');
  page.unmount();
});
it('shows unknown usage distinctly and marks statistics as client reported', async () => {
  api.mockResolvedValue({ summary: { inputTokens: 2, outputTokens: 3, totalTokens: 5, requests: 2, unknownRequests: 1, failedRequests: 0 }, accounts: [], calls: [{ requestId: 'r', userId: 'u', username: 'student', displayName: '学生', configId: 'chat', model: 'm', feature: '课题', status: 'success', source: 'client', inputTokens: null, outputTokens: null, totalTokens: null, createdAt: '2026-11-23T00:00:00Z' }], total: 1, page: 1, pageSize: 20 });
  const page = mount(UsagePage); await flushPromises();
  expect(page.text()).toContain('CLIENT REPORTED');
  expect(page.text()).toContain('未知');
  expect(page.text()).toContain('student');
  page.unmount();
});
it('does not fetch admin data for a parent and discards a pending response after account change', async () => {
  auth.profile = { id: 'parent', role: 'Parent' };
  const denied = mount(ModelsPage); await flushPromises();
  expect(api).not.toHaveBeenCalled(); denied.unmount();
  auth.profile = { id: 'admin', role: 'Admin' };
  let resolve!: (value: unknown) => void;
  api.mockImplementation(() => new Promise(done => { resolve = done; }));
  const page = mount(ModelsPage); await flushPromises();
  auth.profile = { id: 'parent', role: 'Parent' };
  resolve({ models: [model] }); await flushPromises();
  expect(page.find('input[type="password"]').exists()).toBe(false);
  page.unmount();
});
it('rejects an invalid API endpoint before saving and retains the form on a save error', async () => {
  api.mockResolvedValueOnce({ models: [model] }).mockRejectedValueOnce(new Error('配置保存失败'));
  const page = mount(ModelsPage); await flushPromises();
  await page.get('[aria-label="chat API 地址"]').setValue('http://example.test');
  await page.get('form').trigger('submit'); await flushPromises();
  expect(api).toHaveBeenCalledTimes(1); expect(page.text()).toContain('HTTPS');
  await page.get('[aria-label="chat API 地址"]').setValue(model.endpoint);
  await page.get('form').trigger('submit'); await flushPromises();
  expect(page.text()).toContain('配置保存失败');
  expect(page.find('form').exists()).toBe(true); page.unmount();
});
