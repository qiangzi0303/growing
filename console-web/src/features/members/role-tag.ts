import { h } from 'vue';
import { NTag } from 'naive-ui';
import type { Member } from './api';

const roles: Record<Member['role'], { label: string; type: 'warning' | 'info' | 'success' }> = {
  Admin: { label: '管理员', type: 'warning' },
  Parent: { label: '家长', type: 'info' },
  Student: { label: '学生', type: 'success' }
};
export function roleLabel(role: string) {
  return roles[role as Member['role']]?.label ?? role;
}
export function renderRoleTag(role: string) {
  const item = roles[role as Member['role']];
  return h(NTag, { size: 'small', bordered: false, type: item?.type ?? 'default' }, { default: () => item?.label ?? role });
}
