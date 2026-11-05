export interface EntryProfile {
  role: string;
  roleSelectionRequired?: boolean;
}
export const businessPages = [
  { name: 'home', path: '/home', title: '工作台', adminOnly: false },
  { name: 'students', path: '/students', title: '学生档案', adminOnly: false },
  { name: 'student-detail', path: '/students/:id', title: '学生详情', adminOnly: false, hidden: true },
  { name: 'reports', path: '/reports', title: '学习报告', adminOnly: false },
  { name: 'members', path: '/members', title: '注册会员', adminOnly: true },
  { name: 'member-detail', path: '/members/:id', title: '会员详情', adminOnly: true, hidden: true },
  { name: 'rewards', path: '/rewards', title: '奖励记录', adminOnly: false },
  { name: 'account', path: '/account', title: '账号与设置', adminOnly: false }
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
