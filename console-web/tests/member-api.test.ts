import { expect, it, vi } from 'vitest';
import { getMember, listMembers } from '@/features/members/api';
const api = vi.hoisted(() => vi.fn());
vi.mock('@/service/request', () => ({ api }));
it('uses member list raw pagination and forwards cancellation', async () => {
  const value = { total: 34, page: 2, pageSize: 20, rows: [] }; api.mockResolvedValueOnce(value);
  const signal = new AbortController().signal;
  expect(await listMembers({ q: '小安 &', role: 'Parent', page: 2, signal })).toBe(value);
  expect(api).toHaveBeenLastCalledWith('/admin/members?q=%E5%B0%8F%E5%AE%89+%26&role=Parent&page=2', { signal });
});
it('encodes member IDs and preserves the actual detail shape', async () => {
  const value = { member: { id: 'a' }, children: [], confirmations: { rows: [], total: 0, page: 1, pageSize: 20 } }; api.mockResolvedValueOnce(value);
  expect(await getMember('a/b')).toBe(value); expect(api).toHaveBeenLastCalledWith('/admin/members/a%2Fb', { signal: undefined });
});
