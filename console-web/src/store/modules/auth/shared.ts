import { localStg } from '@/utils/storage';
/** Remove credentials left by upstream demo builds; never persist new credentials. */
export function clearAuthStorage() {
  localStg.remove('token');
  localStg.remove('refreshToken');
  localStg.remove('globalTabs');
}
