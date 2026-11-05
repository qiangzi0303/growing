import { afterEach, expect, it, vi } from 'vitest';
import { createApi } from '../src/features/api/client';

afterEach(() => vi.useRealTimers());

it('uses the existing login contract and same-origin Cookie credentials', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ user: { id: 'p', role: 'Parent' } }));
  await createApi({ fetcher })('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'parent', password: 'test-only' }) });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe('/api/auth/login');
  expect(options.credentials).toBe('same-origin');
  expect(new Headers(options.headers).get('X-Growing-Client')).toBe('1');
  expect(new Headers(options.headers).has('Authorization')).toBe(false);
  expect(JSON.parse(options.body)).toEqual({ username: 'parent', password: 'test-only' });
});

it.each([401, 403, 503])('preserves HTTP %s and never retries writes', async status => {
  const unauthorized = vi.fn();
  const fetcher = vi.fn().mockResolvedValue(Response.json({ error: 'denied' }, { status }));
  await expect(createApi({ fetcher, unauthorized })('/auth/login', { method: 'POST' })).rejects.toMatchObject({ status, message: 'denied' });
  expect(fetcher).toHaveBeenCalledOnce();
  expect(unauthorized).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
});

it('accepts empty 204 responses', async () => {
  expect(await createApi({ fetcher: vi.fn().mockResolvedValue(new Response(null, { status: 204 })) })('/auth/logout', { method: 'POST' })).toBeNull();
});

it('reports non-JSON and network failures without rendering HTML', async () => {
  await expect(createApi({ fetcher: vi.fn().mockResolvedValue(new Response('<html>gateway</html>')) })('/auth/me')).rejects.toMatchObject({ kind: 'response' });
  await expect(createApi({ fetcher: vi.fn().mockRejectedValue(new TypeError('offline')) })('/auth/me')).rejects.toMatchObject({ kind: 'network' });
});

it('honors cancellation even when fetch ignores abort', async () => {
  const controller = new AbortController();
  const promise = createApi({ fetcher: vi.fn(() => new Promise<Response>(() => {})) })('/auth/me', { signal: controller.signal });
  const check = expect(promise).rejects.toMatchObject({ kind: 'cancelled' });
  controller.abort();
  await check;
});

it('times out regular requests after 12 seconds but gives AI operations 110 seconds', async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn(() => new Promise<Response>(() => {}));
  const normal = expect(createApi({ fetcher })('/auth/me')).rejects.toMatchObject({ kind: 'timeout' });
  await vi.advanceTimersByTimeAsync(12000);
  await normal;
  const ai = expect(createApi({ fetcher })('/question-bank/questions/q/correct')).rejects.toMatchObject({ kind: 'timeout' });
  await vi.advanceTimersByTimeAsync(110000);
  await ai;
});

it('can revoke every pending request on logout', async () => {
  const api = createApi({ fetcher: vi.fn(() => new Promise<Response>(() => {})) });
  const check = expect(api('/auth/me')).rejects.toMatchObject({ kind: 'cancelled' });
  api.cancelAll();
  await check;
});

it('keeps HTTP 401 when session cleanup cancels pending requests', async () => {
  const api = createApi({ fetcher: vi.fn().mockResolvedValue(Response.json({ error: 'expired' }, { status: 401 })), unauthorized: () => api.cancelAll() });
  await expect(api('/auth/me')).rejects.toMatchObject({ status: 401, message: 'expired' });
});

it('does not send a write that was already cancelled', async () => {
  const controller = new AbortController();
  controller.abort();
  const fetcher = vi.fn();
  await expect(createApi({ fetcher })('/auth/login', { method: 'POST', signal: controller.signal })).rejects.toMatchObject({ kind: 'cancelled' });
  expect(fetcher).not.toHaveBeenCalled();
});
