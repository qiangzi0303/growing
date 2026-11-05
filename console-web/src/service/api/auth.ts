import { request } from '../request';

export interface SessionProfile {
  id: string;
  username: string;
  displayName: string;
  role: string;
  roleSelectionRequired: boolean;
}
export function fetchLogin(username: string, password: string) {
  return request<{ user: SessionProfile }>({ url: '/auth/login', method: 'POST', data: { username, password } });
}
export function fetchGetUserInfo() {
  return request<SessionProfile>({ url: '/auth/me' });
}
export function fetchLogout() {
  return request<null>({ url: '/auth/logout', method: 'POST' });
}