import { beforeEach, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const services = vi.hoisted(() => ({ fetchLogin: vi.fn(), fetchGetUserInfo: vi.fn(), fetchLogout: vi.fn() }));
const cancelAll = vi.hoisted(() => vi.fn());
vi.mock('../src/service/api/auth', () => services);
vi.mock('../src/service/request', () => ({ api: { cancelAll } }));
import { ApiError } from '../src/features/api/client';
import { useAuthStore } from '../src/store/modules/auth';

const parent = { id: 'parent', username: 'p', displayName: 'Parent', role: 'Parent', roleSelectionRequired: true };
beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  localStorage.clear();
});

it('restores the actual profile through /me without stored tokens', async () => {
  services.fetchGetUserInfo.mockResolvedValue({ data: parent, error: null });
  const store = useAuthStore();
  expect(await store.initUserInfo()).toBe(true);
  expect(store.profile).toEqual(parent);
  expect(store.userInfo).toMatchObject({ userId: 'parent', roles: ['Parent'] });
  expect(store.isLogin).toBe(true);
  expect(localStorage.length).toBe(0);
});

it('does not retain login response tokens or refresh a failed session', async () => {
  services.fetchLogin.mockResolvedValue({
    data: { user: parent, token: 'must-not-store', expiresAt: 123 },
    error: null
  });
  const store = useAuthStore();
  expect(await store.login('p', 'test-only')).toBe(true);
  expect(services.fetchLogin).toHaveBeenCalledWith('p', 'test-only');
  expect(localStorage.length).toBe(0);
  store.clearSession();
  expect(store.profile).toBeNull();
  expect(store.isLogin).toBe(false);
  expect(services.fetchLogout).not.toHaveBeenCalled();
});

it('logs out through the server and revokes local requests', async () => {
  services.fetchLogout.mockResolvedValue({ data: null, error: null });
  const store = useAuthStore();
  expect(await store.resetStore()).toBe(true);
  expect(services.fetchLogout).toHaveBeenCalledOnce();
  expect(cancelAll).toHaveBeenCalledOnce();
});

it('deduplicates restoration and ignores a late result after logout', async () => {
  let finish!: (value: unknown) => void;
  services.fetchGetUserInfo.mockReturnValue(
    new Promise(resolve => {
      finish = resolve;
    })
  );
  const store = useAuthStore();
  const first = store.initUserInfo();
  const second = store.initUserInfo();
  expect(services.fetchGetUserInfo).toHaveBeenCalledOnce();
  store.clearSession();
  finish({ data: parent, error: null });
  expect(await first).toBe(false);
  expect(await second).toBe(false);
  expect(store.profile).toBeNull();
});

it('preserves a recoverable network error and clears it after retry', async () => {
  services.fetchGetUserInfo
    .mockResolvedValueOnce({ data: null, error: new ApiError('offline', 503) })
    .mockResolvedValueOnce({ data: parent, error: null });
  const store = useAuthStore();
  expect(await store.initUserInfo()).toBe(false);
  expect(store.restoreError?.status).toBe(503);
  expect(await store.initUserInfo()).toBe(true);
  expect(store.restoreError).toBeNull();
});

it('waits for the pending logout response before sending a new login', async () => {
  let finish!: (value: unknown) => void;
  services.fetchLogout.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  services.fetchLogin.mockResolvedValue({ data: { user: parent }, error: null });
  const store = useAuthStore();
  const exiting = store.resetStore();
  const entering = store.login('p', 'test-only');
  expect(store.loginLoading).toBe(true);
  await Promise.resolve();
  expect(services.fetchLogin).not.toHaveBeenCalled();
  finish({ data: null, error: new ApiError('offline', 503) });
  expect(await exiting).toBe(false);
  expect(await entering).toBe(true);
  expect(store.profile).toEqual(parent);
  expect(store.logoutError).toBe('');
});

it('preserves the failed logout retry when the subsequent login also fails', async () => {
  services.fetchLogout.mockResolvedValue({ data: null, error: new ApiError('offline', 503) });
  services.fetchLogin.mockResolvedValue({ data: null, error: new ApiError('denied', 401) });
  const store = useAuthStore();
  await store.resetStore();
  expect(await store.login('p', 'test-only')).toBe(false);
  expect(store.logoutError).toContain('退出未完成');
});

it('discards a queued login when its session is cleared while logout is pending', async () => {
  let finish!: (value: unknown) => void;
  services.fetchLogout.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  services.fetchLogin.mockResolvedValue({ data: { user: parent }, error: null });
  const store = useAuthStore();
  const exiting = store.resetStore();
  const entering = store.login('p', 'test-only');
  store.clearSession();
  finish({ data: null, error: null });
  await exiting;
  expect(await entering).toBe(false);
  expect(services.fetchLogin).not.toHaveBeenCalled();
  expect(store.profile).toBeNull();
});

it('shares an in-flight logout so retry cannot cancel its Cookie transition', async () => {
  let finish!: (value: unknown) => void;
  services.fetchLogout.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const store = useAuthStore();
  const first = store.resetStore();
  const second = store.resetStore();
  expect(services.fetchLogout).toHaveBeenCalledOnce();
  expect(cancelAll).toHaveBeenCalledOnce();
  finish({ data: null, error: null });
  expect(await first).toBe(true);
  expect(await second).toBe(true);
});
