export class ApiError extends Error {
  constructor(message: string, public status = 0, public kind = 'http') {
    super(message);
    this.name = 'ApiError';
  }
}
export type ApiOptions = RequestInit & { timeout?: number };
export function createApi({ fetcher = globalThis.fetch, unauthorized }: { fetcher?: typeof fetch; unauthorized?: () => void } = {}) {
  const pending = new Set<AbortController>();
  async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw new ApiError('Invalid API path', 0, 'request');
    if (options.signal?.aborted) throw new ApiError('请求已取消。', 0, 'cancelled');
    const controller = new AbortController();
    pending.add(controller);
    const { timeout, signal, ...init } = options;
    const headers = new Headers(init.headers);
    headers.delete('Authorization');
    headers.set('X-Growing-Client', '1');
    if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    let timedOut = false;
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const duration = timeout ?? (path === '/question-bank/import' || /^\/question-bank\/questions\/[^/]+\/(format|followup|correct|drawing)$/.test(path) ? 110000 : 12000);
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, duration);
    try {
      const aborted = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new ApiError(timedOut ? '请求超时，请重试。' : '请求已取消。', 0, timedOut ? 'timeout' : 'cancelled')), { once: true });
      });
      if (signal?.aborted) cancel();
      const response = await Promise.race([fetcher(`/api${path}`, { ...init, headers, credentials: 'same-origin', signal: controller.signal }), aborted]);
      if (response.status === 204) return null as T;
      let data: unknown;
      try { data = await Promise.race([response.json(), aborted]); }
      catch (error) {
        if (error instanceof ApiError) throw error;
        if (response.status === 401) unauthorized?.();
        throw new ApiError('服务器返回了无法识别的响应。', response.status, 'response');
      }
      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : `请求失败 (${response.status})`;
        if (response.status === 401) unauthorized?.();
        throw new ApiError(message, response.status);
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('无法连接服务器，请检查网络。', 0, 'network');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      pending.delete(controller);
    }
  }
  api.cancelAll = () => { pending.forEach(controller => controller.abort()); pending.clear(); };
  return api;
}
