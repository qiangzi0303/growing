import { createApi, ApiError } from '@/features/api/client';
import { useAuthStore } from '@/store/modules/auth';

export const api = createApi({ unauthorized: () => useAuthStore().clearSession() });

/** Template-compatible result shape over the site's raw JSON HTTP API. */
export async function request<T = unknown>(config: {
  url: string; method?: string; data?: unknown; params?: Record<string, unknown>; signal?: AbortSignal; timeout?: number;
}) {
  const params = new URLSearchParams();
  Object.entries(config.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, String(value));
  });
  const query = params.size ? `${config.url.includes('?') ? '&' : '?'}${params}` : '';
  try {
    const data = await api<T>(`${config.url}${query}`, {
      method: config.method?.toUpperCase(), body: config.data === undefined ? undefined : JSON.stringify(config.data),
      signal: config.signal, timeout: config.timeout
    });
    return { data, error: null } as const;
  } catch (error) {
    return { data: null, error: error instanceof ApiError ? error : new ApiError('请求失败。') } as const;
  }
}