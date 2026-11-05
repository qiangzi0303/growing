import { api } from '@/service/request';

export type ConsoleRole = 'Admin' | 'Parent';
export type ReportDays = 7 | 30 | 90;
/** Parent children have no username or role; retain only fields actually supplied. */
export interface StudentIdentity {
  id: string;
  displayName: string;
  createdAt?: string;
  username?: string;
  role?: string;
  roleSelectionRequired?: boolean;
}
export interface StudentRow extends StudentIdentity {
  lastSyncedAt?: string | null;
  connections?: number;
  mastered?: number | null;
}
export interface StudentList { rows: StudentRow[]; total: number; page: number; pageSize: number }
export interface StudySubject {
  subject: string; read: number; mastered: number; practice: number;
  activeMinutes: number; todayMinutes: number; totalMinutes: number; dailyMinutes: Record<string, number>;
}
export interface StudyReport {
  subjects: StudySubject[]; today: string; timezone: string; lastSyncedAt: string | null;
  timeNote: string; note: string; warnings: string[];
}
export interface GrowthReport {
  timezone: string; note: string;
  points: { day: string; subjects: { subject: string; minutes: number; read: number | null; mastered: number | null; practice: number | null }[] }[];
}
export interface RewardConfirmation {
  id: string; documentKey: string; hash: string; kind: 'game' | 'cash'; amount: number;
  claimedParent: string; claimedAt: string; confirmedAt: string; parentName: string; parentId: string;
}
export interface RewardReport {
  entries: { documentKey: string; unit: string; hash: string; kind: 'game' | 'cash'; amount: number; claimedParent: string; claimedAt: string; confirmation: RewardConfirmation | null }[];
  summaries: { unit: string; paidGame: number; paidCash: number; legacy: boolean }[];
  invalid: number; confirmations: RewardConfirmation[]; note: string;
}
export interface StudentDetail { student: StudentIdentity; report: StudyReport; growth: GrowthReport; rewards: RewardReport }

export function validateDays(days: number): asserts days is ReportDays {
  if (![7, 30, 90].includes(days)) throw new RangeError('报告天数仅支持 7、30 或 90。');
}
export async function listStudents(role: ConsoleRole, options: { q?: string; page?: number; signal?: AbortSignal } = {}): Promise<StudentList> {
  if (role === 'Parent') {
    const rows = await api<StudentIdentity[]>('/parent/children', { signal: options.signal });
    return { rows, total: rows.length, page: 1, pageSize: rows.length };
  }
  const page = options.page ?? 1;
  if (!Number.isInteger(page) || page < 1) throw new RangeError('页码无效。');
  const params = new URLSearchParams({ role: 'Student', q: options.q ?? '', page: String(page) });
  return api<StudentList>(`/admin/members?${params}`, { signal: options.signal });
}
/** Parent caller obtains student from listStudents; server rechecks binding on every read. */
export async function getStudentDetail(role: ConsoleRole, student: StudentIdentity, days: number = 7, signal?: AbortSignal): Promise<StudentDetail> {
  validateDays(days);
  const id = encodeURIComponent(student.id);
  if (role === 'Admin') return api<StudentDetail>(`/admin/students/${id}/report?days=${days}`, { signal });
  const prefix = `/parent/children/${id}`;
  const [report, growth, rewards] = await Promise.all([
    api<StudyReport>(`${prefix}/report`, { signal }),
    api<GrowthReport>(`${prefix}/growth?days=${days}`, { signal }),
    api<RewardReport>(`${prefix}/rewards`, { signal })
  ]);
  return { student, report, growth, rewards };
}
