import { onUnmounted, ref, shallowRef, watch } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import type { ConsoleRole } from '@/features/students/api';

/** Each mounted student scope is invalidated by identity changes; stale responses never repopulate it. */
export function useHistoryQuery<T>(student: () => string, key: () => unknown, read: (role: ConsoleRole, signal: AbortSignal) => Promise<T | null>) {
  const auth = useAuthStore();
  const data = shallowRef<T | null>(null); const error = ref(''); const loading = ref(false);
  const authorized = ref(Boolean(auth.profile && ['Admin', 'Parent'].includes(auth.profile.role)));
  let sequence = 0; let controller: AbortController | null = null;
  function clear() { sequence++; controller?.abort(); data.value = null; error.value = ''; loading.value = false; }
  async function reload() {
    clear(); if (!authorized.value || !auth.profile) return;
    const current = sequence; controller = new AbortController(); loading.value = true;
    try { const result = await read(auth.profile.role as ConsoleRole, controller.signal); if (current === sequence) data.value = result; }
    catch (cause) { if (current === sequence) error.value = cause instanceof Error ? cause.message : '记录读取失败，请重试。'; }
    finally { if (current === sequence) loading.value = false; }
  }
  watch(() => [student(), key()], reload, { immediate: true, flush: 'sync' });
  watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], () => { authorized.value = false; clear(); }, { flush: 'sync' });
  onUnmounted(clear);
  return { data, error, loading, authorized, reload, clear };
}
