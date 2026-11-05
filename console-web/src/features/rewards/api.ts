import { api } from '@/service/request';
import type { Page } from '@/features/members/api';
export type { RewardReport, RewardConfirmation, StudentIdentity } from '@/features/students/api';
export interface LedgerRow { id: string; studentId: string; studentName: string; parentId: string; parentName: string; parentUsername: string; kind: 'game' | 'cash'; amount: number; confirmedAt: string }
export function rewardAmount(kind: string, amount: number) { return kind === 'cash' ? `${(amount / 100).toFixed(2)} 元` : `${amount} 分钟游戏`; }
export function getLedger(page: number, student: string, parent: string, signal?: AbortSignal) { return api<Page<LedgerRow>>(`/admin/redemptions?${new URLSearchParams({ page: String(page), student, parent })}`, { signal }); }
