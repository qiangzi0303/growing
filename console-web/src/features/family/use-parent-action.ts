import { onUnmounted, ref, watch } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
export function useParentAction(target: () => string, clear: () => void) {
 const auth = useAuthStore(); const pending = ref(false); const message = ref(''); let version = 0; let controller: AbortController | null = null;
 function reset() { version++; controller?.abort(); pending.value = false; message.value = ''; clear(); }
 watch(() => [target(), auth.profile?.id, auth.profile?.role, auth.sessionRevision], reset, { flush: 'sync' }); onUnmounted(reset);
 async function run(action: (signal: AbortSignal) => Promise<void>) { if (pending.value || auth.profile?.role !== 'Parent') return; const current = ++version; controller = new AbortController(); const signal = controller.signal; pending.value = true; message.value = ''; try { await action(signal); } catch (cause) { if (current === version) message.value = cause instanceof Error ? cause.message : '操作失败，请重试'; } finally { if (current === version) { pending.value = false; clear(); } } }
 return { auth, pending, message, run };
}
