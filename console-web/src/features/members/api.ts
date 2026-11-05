import { api } from '@/service/request';
export interface Member { id: string; username: string; displayName: string; role: 'Admin' | 'Parent' | 'Student'; createdAt: string }
export interface MemberRow extends Member { lastSyncedAt: string | null; connections: number; mastered: number | null }
export interface Page<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface Relation { id: string; displayName: string; createdAt: string }
export interface LedgerRow { id: string; studentId: string; studentName: string; parentId: string; parentName: string; kind: 'game' | 'cash'; amount: number; confirmedAt: string }
export interface MemberDetail { member: Member; parents?: Relation[]; children?: Relation[]; confirmations?: Page<LedgerRow> }
export function listMembers(options: { q: string; role: string; page: number; signal?: AbortSignal }) {
  const params = new URLSearchParams({ q: options.q, role: options.role, page: String(options.page) });
  return api<Page<MemberRow>>(`/admin/members?${params}`, { signal: options.signal });
}
export function getMember(id: string, signal?: AbortSignal) { return api<MemberDetail>(`/admin/members/${encodeURIComponent(id)}`, { signal }); }
