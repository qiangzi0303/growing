import { onUnmounted, ref, watch } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import type { Member } from './api';
export function useMemberAction(member: () => Member, clear: () => void) {
  const auth = useAuthStore(); const pending = ref(false); const message = ref('');
  let version = 0; let controller: AbortController | null = null;
  function reset() { version++; controller?.abort(); pending.value = false; message.value = ''; clear(); }
  watch(() => [member().id, member().role, auth.profile?.id, auth.profile?.role, auth.sessionRevision], reset, { flush: 'sync' });
  onUnmounted(reset);
  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (pending.value || auth.profile?.role !== 'Admin') return;
    const current = ++version; controller = new AbortController(); pending.value = true; message.value = '';
    const signal = controller.signal;
    try { await action(signal); }
    catch (cause) { if (current === version) message.value = cause instanceof Error ? cause.message : '保存失败，请重试'; }
    finally { if (current === version) { pending.value = false; clear(); } }
  }
  return { pending, message, run, active: (signal: AbortSignal) => !signal.aborted, auth };
}
