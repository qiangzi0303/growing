import { api } from '@/service/request';
import { validateDays } from '@/features/students/api';
import type { ConsoleRole, GrowthReport, StudentDetail } from '@/features/students/api';

export interface UnitReport {
  id: string; title: string; subject: string; subjectName: string; term: string; termName: string;
  activeMinutes: number | null; firstStudyDay: string | null; lastStudyDay: string | null; studyDays: number;
  mastered: number; total: number; masteryPercent: number;
  words?: { mastered: number; total: number } | null;
  sentences?: { completed: number; total: number } | null;
  concept: { passed: number; total: number; retainedAttempts: number; best: number | null; latest: number | null };
  practice: { done: number; total: number };
  diagnostic: { passed: number; shaky: number; weak: number; tested: number; total: number };
  handwriting: { graded: number; latest: { score: number | null; needsReview: boolean; at: string } | null };
}
export interface UnitReports { units: UnitReport[]; lastSyncedAt: string | null; warnings: string[]; note: string }
export type GrowthMetric = 'minutes' | 'read' | 'mastered' | 'practice';
export const subjects = ['数学', '英语', '物理'];
export function growthValues(report: GrowthReport, subject: string, metric: GrowthMetric) {
  return report.points.map(point => point.subjects.find(value => value.subject === subject)?.[metric] ?? null);
}
export function formatDuration(value: number | null | undefined) {
  if (value == null) return '暂无时间记录';
  if (value > 0 && value < 1) return `${Math.max(1, Math.round(value * 60))} 秒`;
  return `${Number(value.toFixed(1))} 分钟`;
}
export function formatBeijing(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '暂无时间记录';
}
export function getUnitReports(role: ConsoleRole, id: string, signal?: AbortSignal) {
  return api<UnitReports>(`/${role === 'Admin' ? 'admin/students' : 'parent/children'}/${encodeURIComponent(id)}/unit-report`, { signal });
}
export async function getGrowth(role: ConsoleRole, id: string, days: number, signal?: AbortSignal) {
  validateDays(days);
  const target = encodeURIComponent(id);
  // Admin has no standalone growth endpoint; reuse its authorized report response.
  if (role === 'Admin') return (await api<StudentDetail>(`/admin/students/${target}/report?days=${days}`, { signal })).growth;
  return api<GrowthReport>(`/parent/children/${target}/growth?days=${days}`, { signal });
}
