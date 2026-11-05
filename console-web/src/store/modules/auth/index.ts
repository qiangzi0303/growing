import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchGetUserInfo, fetchLogin, fetchLogout } from '@/service/api/auth';
import type { SessionProfile } from '@/service/api/auth';
import { api } from '@/service/request';
import { SetupStoreId } from '@/enum';
import { ApiError } from '@/features/api/client';
import { clearAuthStorage } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const profile = ref<SessionProfile | null>(null);
  const loginLoading = ref(false);
  const initialized = ref(false);
  const sessionRevision = ref(0);
  const logoutError = ref('');
  const restoreError = ref<ApiError | null>(null);
  const userInfo = reactive<Api.Auth.UserInfo>({ userId: '', userName: '', roles: [], buttons: [] });
  let generation = 0;
  let restoring: Promise<boolean> | null = null;
  let loggingOut: Promise<boolean> | null = null;
  const isLogin = computed(() => profile.value !== null);
  const isStaticSuper = computed(() => profile.value?.role === 'Admin');

  function applyProfile(value: SessionProfile) {
    profile.value = value;
    Object.assign(userInfo, {
      userId: value.id,
      userName: value.displayName || value.username,
      roles: [value.role],
      buttons: []
    });
  }
  /** Local-only cleanup for expired sessions; never sends a recursive logout request. */
  function clearSession() {
    generation += 1;
    api.cancelAll();
    clearAuthStorage();
    profile.value = null;
    Object.assign(userInfo, { userId: '', userName: '', roles: [], buttons: [] });
    loginLoading.value = false;
    initialized.value = true;
    restoreError.value = null;
    restoring = null;
    // Synchronous session subscribers must observe the fully cleared identity.
    sessionRevision.value += 1;
  }
  async function resetStore() {
    if (loggingOut) return loggingOut;
    logoutError.value = '';
    clearSession();
    loggingOut = (async () => {
      const result = await fetchLogout();
      if (result.error) logoutError.value = '退出未完成，服务器会话可能仍有效，请重试退出。';
      return !result.error;
    })().finally(() => {
      loggingOut = null;
    });
    return loggingOut;
  }
  async function login(username: string, password: string, _redirect = true) {
    // Logout clears the Cookie in its response. Do not let it arrive after a new login.
    if (loggingOut) {
      const queuedGeneration = generation;
      loginLoading.value = true;
      await loggingOut;
      if (queuedGeneration !== generation) return false;
    }
    clearSession();
    const current = generation;
    loginLoading.value = true;
    try {
      const { data, error } = await fetchLogin(username, password);
      if (current !== generation || error) return false;
      logoutError.value = '';
      applyProfile(data.user);
      return true;
    } finally {
      if (current === generation) loginLoading.value = false;
    }
  }
  function initUserInfo(): Promise<boolean> {
    if (restoring) return restoring;
    clearAuthStorage();
    const current = generation;
    restoring = (async () => {
      const { data, error } = await fetchGetUserInfo();
      if (current !== generation) return false;
      initialized.value = true;
      if (error) {
        clearSession();
        if (error.status !== 401) restoreError.value = error;
        return false;
      }
      restoreError.value = null;
      applyProfile(data);
      return true;
    })().finally(() => {
      if (current === generation) restoring = null;
    });
    return restoring;
  }
  return {
    restoreError,
    profile,
    userInfo,
    initialized,
    sessionRevision,
    logoutError,
    isStaticSuper,
    isLogin,
    loginLoading,
    clearSession,
    resetStore,
    login,
    initUserInfo
  };
});
