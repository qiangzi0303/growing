import { expect, it } from 'vitest';
import { ref } from 'vue';
import { createStudentSelection } from '@/features/students/model';
import type { StudentDetail, StudentIdentity } from '@/features/students/api';
import { ApiError } from '@/features/api/client';

function setup() {
  const account = ref<{ id: string; role: 'Parent' } | null>({ id: 'parent', role: 'Parent' });
  const revision = ref(0);
  const calls: { student: StudentIdentity; days: number; signal?: AbortSignal; resolve: (value: StudentDetail) => void; reject: (error: unknown) => void }[] = [];
  const selection = createStudentSelection(() => account.value, () => revision.value, (_role, student, days = 7, signal) => new Promise((resolve, reject) => calls.push({ student, days, signal, resolve, reject })));
  const complete = (i: number) => calls[i].resolve({ student: calls[i].student, report: {}, growth: {}, rewards: {} } as StudentDetail);
  return { account, revision, calls, selection, complete };
}
const a = { id: 'a', displayName: '同名' }, b = { id: 'b', displayName: '同名' };
it('clears old detail immediately and ignores A after B completes even if abort is ignored', async () => {
  const { selection: s, calls, complete } = setup();
  const first = s.select(a); const second = s.select(b);
  expect(calls[0].signal?.aborted).toBe(true);
  complete(1); await second; complete(0); await first;
  expect(s.data.value?.student.id).toBe('b');
  const third = s.select(a, 30);
  expect(s.data.value).toBeNull(); expect(s.loading.value).toBe(true);
  complete(2); await third; expect(s.data.value?.student.id).toBe('a');
});
it('does not reuse A on A/B/A and preserves the latest permission error', async () => {
  const { selection: s, calls, complete } = setup();
  const first = s.select(a); complete(0); await first;
  const second = s.select(b); const third = s.select(a);
  expect(s.data.value).toBeNull();
  const error = new ApiError('unbound', 403); calls[2].reject(error); await third;
  complete(1); await second;
  expect(s.data.value).toBeNull(); expect(s.error.value).toBe(error);
});
it('clears synchronously on account change and invalidates pending results', async () => {
  const { selection: s, account, complete } = setup();
  const pending = s.select(a); account.value = { id: 'other', role: 'Parent' };
  expect(s.student.value).toBeNull(); complete(0); await pending;
  expect(s.data.value).toBeNull();
});
it('clears a loaded detail on session revision and logout and disposes pending reads', async () => {
  const { selection: s, revision, account, calls, complete } = setup();
  const pending = s.select(a); complete(0); await pending; revision.value++;
  expect(s.data.value).toBeNull(); expect(s.student.value).toBeNull();
  const next = s.select(b); account.value = null;
  expect(calls[1].signal?.aborted).toBe(true); complete(1); await next;
  expect(s.data.value).toBeNull(); s.dispose();
});
it('isolates day windows and clears pending work on disposal', async () => {
  const { selection: s, calls, complete } = setup();
  const first = s.select(a, 7); const second = s.select(a, 90);
  expect(calls.map(call => call.days)).toEqual([7, 90]);
  complete(1); await second; complete(0); await first;
  expect(s.days.value).toBe(90);
  const pending = s.select(a, 30); s.dispose();
  expect(calls[2].signal?.aborted).toBe(true); complete(2); await pending;
  expect(s.data.value).toBeNull(); expect(s.loading.value).toBe(false);
});
it('rejects illegal days after hiding old visible detail and prevents requests when logged out', async () => {
  const { selection: s, calls, complete, account } = setup();
  const first = s.select(a); complete(0); await first;
  await expect(s.select(a, 8)).rejects.toThrow();
  expect(s.data.value).toBeNull(); expect(calls).toHaveLength(1);
  account.value = null; await s.select(a);
  expect(calls).toHaveLength(1); s.dispose();
});
