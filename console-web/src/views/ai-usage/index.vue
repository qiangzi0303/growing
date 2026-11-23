<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NDataTable, NForm, NFormItem, NInput, NPagination, NSelect } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { listUsage, modelOptions } from '@/features/ai/api';
import type { AccountUsage, UsageCall, UsageResult } from '@/features/ai/api';
import { useAuthStore } from '@/store/modules/auth';

const auth = useAuthStore();
const query = reactive({ from: '', to: '', userId: '', configId: '', page: 1, pageSize: 20 });
const result = ref<UsageResult | null>(null); const loading = ref(false); const error = ref('');
const options = [{ label: '全部模型用途', value: '' }, ...modelOptions];
const tokens = (value: number | null) => value === null ? '未知' : value.toLocaleString();
const accountColumns: DataTableColumns<AccountUsage> = [
  { title: '账号', key: 'username' }, { title: '姓名', key: 'displayName' },
  { title: '输入', key: 'inputTokens', render: row => tokens(row.inputTokens) }, { title: '输出', key: 'outputTokens', render: row => tokens(row.outputTokens) },
  { title: '总 token', key: 'totalTokens', render: row => tokens(row.totalTokens) }, { title: '请求数', key: 'requests' }, { title: '未知用量', key: 'unknownRequests' }, { title: '失败', key: 'failedRequests' }
];
const callColumns: DataTableColumns<UsageCall> = [
  { title: '时间（北京）', key: 'createdAt', render: row => new Date(row.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) },
  { title: '账号', key: 'username' }, { title: '用途', key: 'configId' }, { title: '模型', key: 'model' }, { title: '功能', key: 'feature' }, { title: '状态', key: 'status' },
  { title: '输入', key: 'inputTokens', render: row => tokens(row.inputTokens) }, { title: '输出', key: 'outputTokens', render: row => tokens(row.outputTokens) },
  { title: '总 token', key: 'totalTokens', render: row => tokens(row.totalTokens) }, { title: '来源', key: 'source' }
];
let controller = new AbortController(); let revision = 0;
function clear() { revision++; controller.abort(); controller = new AbortController(); result.value = null; error.value = ''; loading.value = false; }
async function load(reset = false) {
  clear(); if (auth.profile?.role !== 'Admin') return;
  if (reset) query.page = 1;
  if ([query.from, query.to].some(value => value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) || (query.from && query.to && query.from > query.to)) { error.value = '请输入有效日期范围，格式 YYYY-MM-DD'; return; }
  const current = revision; loading.value = true;
  try { const data = await listUsage({ ...query }, controller.signal); if (current === revision) result.value = data; }
  catch (cause) { if (current === revision) error.value = cause instanceof Error ? cause.message : '用量加载失败'; }
  finally { if (current === revision) loading.value = false; }
}
function changePage(page: number) { query.page = page; void load(); }
onMounted(() => load());
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], clear, { flush: 'sync' });
onUnmounted(clear);
</script>

<template>
  <section class="ai-usage">
    <h1>账户 AI 用量</h1>
    <NAlert type="info">CLIENT REPORTED · 客户端上报用量，可能缺失或被修改，不作为供应商账单。未知用量不计为零；日期按北京时间，包含结束日。</NAlert>
    <NForm class="usage-filters" @submit.prevent="load(true)">
      <NFormItem label="开始日期"><NInput v-model:value="query.from" placeholder="YYYY-MM-DD" :input-props="{ 'aria-label': '开始日期' }" /></NFormItem>
      <NFormItem label="结束日期"><NInput v-model:value="query.to" placeholder="YYYY-MM-DD" :input-props="{ 'aria-label': '结束日期' }" /></NFormItem>
      <NFormItem label="账户 ID"><NInput v-model:value="query.userId" placeholder="全部账户" :input-props="{ 'aria-label': '账户 ID' }" /></NFormItem>
      <NFormItem label="模型用途"><NSelect v-model:value="query.configId" :options="options" class="model-select" aria-label="模型用途" /></NFormItem>
      <NButton attr-type="submit" type="primary" :loading="loading">查询</NButton>
    </NForm>
    <NAlert v-if="error" type="error" role="alert">{{ error }}</NAlert>
    <template v-if="result">
      <NCard title="筛选范围汇总" size="small"><div class="summary"><span>输入 {{ tokens(result.summary.inputTokens) }}</span><span>输出 {{ tokens(result.summary.outputTokens) }}</span><strong>总 token {{ tokens(result.summary.totalTokens) }}</strong><span>请求 {{ result.summary.requests }}</span><span>未知用量 {{ result.summary.unknownRequests }}</span><span>失败 {{ result.summary.failedRequests }}</span></div></NCard>
      <NCard title="按账户统计" size="small"><NDataTable :columns="accountColumns" :data="result.accounts" :row-key="row => row.userId" :scroll-x="850" /></NCard>
      <NCard title="调用明细" size="small"><NDataTable :columns="callColumns" :data="result.calls" :row-key="row => `${row.userId}:${row.requestId}`" :scroll-x="1200" /><NPagination :page="query.page" :page-size="query.pageSize" :item-count="result.total" @update:page="changePage" /></NCard>
    </template>
  </section>
</template>

<style scoped>
.ai-usage { display:grid;grid-template-columns:minmax(0,1fr);gap:16px;min-width:0 }
.usage-filters { display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;align-items:start }
.usage-filters > * { min-width:0 }.usage-filters > .n-button { align-self:center }
.summary { display:flex;flex-wrap:wrap;gap:20px }
</style>
