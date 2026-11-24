export interface EntryProfile {
  role: string;
  roleSelectionRequired?: boolean;
}
/** Sidebar groups, in display order. Pages keep their flat paths and permissions. */
export const menuGroups = [
  { key: 'group-overview', label: '概览' },
  { key: 'group-study', label: '学习' },
  { key: 'group-members', label: '会员' },
  { key: 'group-system', label: '系统' }
] as const;
export type MenuGroupKey = (typeof menuGroups)[number]['key'];
/** `icon` names a local SVG in src/assets/svg-icon (no runtime icon downloads). */
export const businessPages = [
  { name: 'home', path: '/home', title: '工作台', adminOnly: false, group: 'group-overview', icon: 'mdi-view-dashboard-outline' },
  { name: 'students', path: '/students', title: '学生档案', adminOnly: false, group: 'group-study', icon: 'mdi-account-school-outline' },
  { name: 'student-detail', path: '/students/:id', title: '学生详情', adminOnly: false, hidden: true, group: 'group-study', icon: 'mdi-account-school-outline' },
  { name: 'reports', path: '/reports', title: '学习报告', adminOnly: false, group: 'group-study', icon: 'mdi-chart-box-outline' },
  { name: 'rewards', path: '/rewards', title: '奖励记录', adminOnly: false, group: 'group-study', icon: 'mdi-gift-outline' },
  { name: 'members', path: '/members', title: '注册会员', adminOnly: true, group: 'group-members', icon: 'mdi-account-group-outline' },
  { name: 'member-detail', path: '/members/:id', title: '会员详情', adminOnly: true, hidden: true, group: 'group-members', icon: 'mdi-account-group-outline' },
  { name: 'ai-models', path: '/ai-models', title: 'AI 模型配置', adminOnly: true, group: 'group-system', icon: 'mdi-robot-outline' },
  { name: 'ai-usage', path: '/ai-usage', title: 'AI 用量统计', adminOnly: true, group: 'group-system', icon: 'mdi-chart-line' },
  { name: 'account', path: '/account', title: '账号与设置', adminOnly: false, group: 'group-system', icon: 'mdi-account-cog-outline' }
] as const;
export function landing(profile: EntryProfile | null): string {
  if (!profile) return '/console/login';
  if (profile.role === 'Admin') return '/console/home';
  if (profile.role === 'Parent' || profile.role === 'Student') {
    if (profile.roleSelectionRequired !== false) return '/?choose-role=1';
    return profile.role === 'Student' ? '/' : '/console/home';
  }
  return '/console/403';
}
export function canVisit(profile: EntryProfile | null, path: string): boolean {
  const page = businessPages.find(
    p => p.path === path || (p.path.endsWith('/:id') && new RegExp(`^${p.path.replace('/:id', '/[^/]+')}$`).test(path))
  );
  return Boolean(page && landing(profile) === '/console/home' && (!page.adminOnly || profile?.role === 'Admin'));
}
export function safeReturn(value: unknown): string {
  const fallback = '/console/home';
  if (typeof value !== 'string' || !value.startsWith('/console/') || /[\\\s\u0000-\u001f]/.test(value)) return fallback;
  let decoded = value;
  try {
    for (let n = 0; n < 4; n++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    return fallback;
  }
  if (
    /[\\\u0000-\u001f]/.test(decoded) ||
    decoded.includes('%') ||
    decoded.split(/[/?#]/).some(s => s === '.' || s === '..')
  )
    return fallback;
  const path = decoded.split(/[?#]/)[0].slice('/console'.length);
  return canVisit({ role: 'Admin' }, path) ? value : fallback;
}
