import { api } from '@/service/request';

export const modelOptions = [
  { value: 'chat', label: '文本对话' },
  { value: 'realtime', label: '实时语音' },
  { value: 'vision', label: '视觉理解' },
  { value: 'paperRecognition', label: '试卷识别' },
  { value: 'paperFigure', label: '题目图形' }
] as const;
export type ConfigId = typeof modelOptions[number]['value'];
export interface ModelInput { model: string; endpoint: string; enabled: boolean; apiKey?: string; voice?: string }
export interface ManagedModel extends Omit<ModelInput, 'apiKey'> { id: ConfigId; purpose: string; revision: number; configured: boolean; keyHint: string }
export interface UsageTotals { inputTokens: number; outputTokens: number; totalTokens: number; requests: number; unknownRequests: number; failedRequests: number }
export interface AccountUsage extends UsageTotals { userId: string; username: string; displayName: string }
export interface UsageCall { requestId: string; userId: string; username: string; displayName: string; configId: ConfigId; model: string; feature: string; status: string; source: string; inputTokens: number | null; outputTokens: number | null; totalTokens: number | null; createdAt: string }
export interface UsageResult { summary: UsageTotals; accounts: AccountUsage[]; calls: UsageCall[]; total: number; page: number; pageSize: number }
export interface UsageQuery { from: string; to: string; userId: string; configId: string; page: number; pageSize: number }
export function listModels(signal?: AbortSignal) { return api<{ models: ManagedModel[] }>('/admin/ai/models', { signal }); }
export function saveModel(id: ConfigId, input: ModelInput, signal?: AbortSignal) {
  const { apiKey, ...settings } = input;
  return api<ManagedModel>(`/admin/ai/models/${id}`, { method: 'PUT', body: JSON.stringify({ ...settings, ...(apiKey?.trim() ? { apiKey: apiKey.trim() } : {}) }), signal });
}
export function listUsage(query: UsageQuery, signal?: AbortSignal) {
  const params = new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)]));
  return api<UsageResult>(`/admin/ai/usage?${params}`, { signal });
}
