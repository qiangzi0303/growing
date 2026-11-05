import { shallowRef, watch } from 'vue';
import { getStudentDetail, validateDays } from './api';
import type { ConsoleRole, ReportDays, StudentDetail, StudentIdentity } from './api';

/** No response cache: each selection revalidates current server permission. */
export function createStudentSelection(
  account: () => { id: string; role: string } | null,
  sessionRevision: () => number,
  load: typeof getStudentDetail = getStudentDetail
) {
  const student = shallowRef<StudentIdentity | null>(null);
  const days = shallowRef<ReportDays>(7);
  const data = shallowRef<StudentDetail | null>(null);
  const error = shallowRef<unknown>(null);
  const loading = shallowRef(false);
  let sequence = 0;
  let controller: AbortController | null = null;
  function clear() {
    sequence++;
    controller?.abort();
    controller = null;
    student.value = null;
    data.value = null;
    error.value = null;
    loading.value = false;
  }
  const stop = watch(() => [account()?.id, account()?.role, sessionRevision()], clear, { flush: 'sync' });
  async function select(value: StudentIdentity, window: number = days.value) {
    clear();
    validateDays(window);
    const identity = account();
    if (!identity || !['Admin', 'Parent'].includes(identity.role)) return;
    student.value = value;
    days.value = window;
    loading.value = true;
    const current = sequence;
    controller = new AbortController();
    try {
      const result = await load(identity.role as ConsoleRole, value, window, controller.signal);
      if (current === sequence) data.value = result;
    } catch (cause) {
      if (current === sequence) error.value = cause;
    } finally {
      if (current === sequence) loading.value = false;
    }
  }
  function dispose() { clear(); stop(); }
  return { student, days, data, error, loading, select, clear, dispose };
}
