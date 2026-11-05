import { beforeEach, expect, it, vi } from 'vitest';
import { getStudentDetail, listStudents } from '@/features/students/api';
import { ApiError } from '@/features/api/client';

const { api } = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('@/service/request', () => ({ api }));
beforeEach(() => { api.mockReset(); });
it('uses the admin student filter, encodes search and retains server pagination', async () => {
  const result = { total: 21, page: 2, pageSize: 20, rows: [] };
  api.mockResolvedValue(result);
  expect(await listStudents('Admin', { q: '张 &李', page: 2 })).toEqual(result);
  expect(api.mock.calls[0][0]).toBe('/admin/members?role=Student&q=%E5%BC%A0+%26%E6%9D%8E&page=2');
});
it('normalizes the raw parent array without inventing username or role', async () => {
  const child = { id: 'a', displayName: '孩子', createdAt: '2026-01-01' };
  api.mockResolvedValue([child]);
  expect(await listStudents('Parent')).toEqual({ rows: [child], total: 1, page: 1, pageSize: 1 });
  expect(api.mock.calls[0][0]).toBe('/parent/children');
});
it('returns the admin combined response and passes cancellation', async () => {
  const data = { student: { id: 'a' }, report: {}, growth: {}, rewards: {} };
  const signal = new AbortController().signal;
  api.mockResolvedValue(data);
  expect(await getStudentDetail('Admin', { id: 'a/b', displayName: 'A' }, 30, signal)).toBe(data);
  expect(api).toHaveBeenCalledWith('/admin/students/a%2Fb/report?days=30', { signal });
});
it('combines three parent reads with the supplied bound child identity', async () => {
  const child = { id: 'a/b', displayName: '同名' };
  api.mockImplementation((path: string) => Promise.resolve(path.includes('/growth') ? { points: [] } : path.endsWith('/report') ? { subjects: [] } : { entries: [] }));
  expect(await getStudentDetail('Parent', child, 7)).toEqual({ student: child, report: { subjects: [] }, growth: { points: [] }, rewards: { entries: [] } });
  expect(api.mock.calls.map(call => call[0])).toEqual(['/parent/children/a%2Fb/report', '/parent/children/a%2Fb/growth?days=7', '/parent/children/a%2Fb/rewards']);
});
it.each([0, 8, 365, NaN])('rejects invalid days %s without a request', async days => {
  await expect(getStudentDetail('Parent', { id: 'a', displayName: 'A' }, days)).rejects.toThrow();
  expect(api).not.toHaveBeenCalled();
});
it.each([403, 404])('preserves server rejection %s for an unbound child', async status => {
  const error = new ApiError('unbound', status);
  api.mockRejectedValue(error);
  await expect(getStudentDetail('Parent', { id: 'a', displayName: 'A' }, 90)).rejects.toBe(error);
});
