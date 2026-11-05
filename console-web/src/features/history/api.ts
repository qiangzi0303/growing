import { api } from '@/service/request';
import type { ConsoleRole } from '@/features/students/api';

export interface Page<T> { rows: T[]; page: number; pageSize: number; total: number }
export interface Correction { location: string; issue: string; correction: string }
export interface HandwritingGrade { revision: number; at: string; score: number | null; needsReview: boolean; feedback: string; corrections?: Correction[]; knowledge?: { nodeId: string; score: number | null; feedback: string }[] }
export interface Stroke { tool: string; width: number; points: number[][] }
export interface Original { revision: number; prompt: string; pages: Stroke[][]; photos?: (string | null)[]; grades: HandwritingGrade[]; recognition?: { text: string; confirmed: boolean } | null }
export interface ManuscriptRow { key: string; unitId: string; title: string; subject: string; pages: number; updatedAt: string; grade: HandwritingGrade | null }
export interface PhotoRow { id: string; number: string; unitId: string; title: string; gradeCount: number; latestAt: string }
export interface PhotoGrade { id: string; revision: number; at: string; studentAnswer: string; result: { verdict: string; feedback: string; answerPages?: string[]; corrections?: Correction[]; answerAnnotations?: { page: number; x: number; y: number; width: number; height: number; kind: string; comment: string }[] } }
export interface PhotoReview { question: { id: string; number: string; text: string; grades: PhotoGrade[] }; followups: { id: string; gradeId: string; prompt: string; reply: string; at: string }[] }
export interface RepeatedRow { kind: string; questionId: string; title: string; unitId: string; number: string; wrongCount: number; correctCount: number; totalCount: number; lastAt: string }
export interface Attempts { rows: { attemptId: string; correct: number; at: string }[]; totalCount: number; wrongCount: number; correctCount: number; page: number; pageSize: number }
export interface Board { id: string; title: string; subject: string; term: string; kind: string; score: number; participants: number }
export interface RankingRow { rank: number; label: string; score: number; isSelf?: boolean; conceptPercent?: number; testPercent?: number; diagnosisPercent?: number; updatedAt?: string }
export interface Rankings { boards: Board[]; formula: string; note: string }
export interface BoardPage extends Page<RankingRow> { board: Board; self: RankingRow | null }
export const studentPrefix = (role: ConsoleRole, id: string) => `${role === 'Admin' ? '/admin/students' : '/parent/children'}/${encodeURIComponent(id)}`;
export function manuscripts(role: ConsoleRole, student: string, page: number, signal: AbortSignal) { return api<Page<ManuscriptRow>>(`${studentPrefix(role, student)}/handwriting?page=${page}`, { signal }); }
export function manuscript(role: ConsoleRole, student: string, key: string, signal: AbortSignal) { return api<{ original: Original }>(`${studentPrefix(role, student)}/handwriting?key=${encodeURIComponent(key)}`, { signal }); }
export function photos(student: string, page: number, signal: AbortSignal) { return api<Page<PhotoRow>>(`/question-bank/unit-wrong-history?${new URLSearchParams({ studentId: student, page: String(page) })}`, { signal }); }
export function photo(student: string, id: string, signal: AbortSignal) { return api<PhotoReview>(`/question-bank/questions/${encodeURIComponent(id)}/review?${new URLSearchParams({ studentId: student })}`, { signal }); }
export function repeated(student: string, page: number, signal: AbortSignal) { return api<Page<RepeatedRow>>(`/question-bank/repeated?${new URLSearchParams({ studentId: student, page: String(page) })}`, { signal }); }
export function attempts(student: string, row: RepeatedRow, page: number, signal: AbortSignal) { return api<Attempts>(`/question-bank/attempts?${new URLSearchParams({ studentId: student, kind: row.kind, questionId: row.questionId, page: String(page) })}`, { signal }); }
export function rankings(role: ConsoleRole, student: string, signal: AbortSignal) { return api<Rankings>(`${studentPrefix(role, student)}/rankings`, { signal }); }
export function rankingBoard(role: ConsoleRole, student: string, board: string, page: number, signal: AbortSignal) { return api<BoardPage>(`${studentPrefix(role, student)}/rankings?${new URLSearchParams({ board, page: String(page) })}`, { signal }); }
export const verdictLabel = (value: string) => ({ correct: '正确', incorrect: '错误', partial: '部分正确', review: '需要复核', unanswered: '未作答' })[value] ?? '待核对';
