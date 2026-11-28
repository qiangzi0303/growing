<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NDataTable, NDatePicker, NEmpty, NForm, NFormItem, NInput, NPagination, NSelect, NSpin, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { listUsage, modelOptions } from '@/features/ai/api';
import type { AccountUsage, UsageCall, UsageResult } from '@/features/ai/api';
import { useAuthStore } from '@/store/modules/auth';
import TableToolbar from '@/components/advanced/table-toolbar.vue';
import { useColumnChecks } from '@/hooks/common/table-columns';
import { formatBeijingTime } from '@/utils/datetime';

const auth = useAuthStore();
const query = reactive({ from: '', to: '', userId: '', configId: '', page: 1, pageSize: 20 });
const dateRange = computed<[string, string] | null>(() => query.from && query.to ? [query.from, query.to] : null);
function changeDates(value: string | [string, string] | null) {
  if (typeof value === 'string') return;
  // Keep calendar dates verbatim; the API applies Beijing inclusive-day boundaries.
  query.from = value?.[0] ?? ''; query.to = value?.[1] ?? '';
}
const result = ref<UsageResult | null>(null); const loading = ref(false); const error = ref('');
const options = [{ label: '全部模型用途', value: '' }, ...modelOptions];
const tokens = (value: number | null) => value === null ? '未知' : value.toLocaleString();
const tokenCell = (value: number | null) => value === null ? h('span', { class: 'list-muted' }, '未知') : value.toLocaleString();
const purpose = (id: string) => modelOptions.find(option => option.value === id)?.label ?? id;
const statusTag = (status: string) => h(NTag, { size: 'small', bordered: false, type: status === 'success' ? 'success' : 'error' }, { default: () => status === 'success' ? '成功' : status });
const accountColumns: DataTableColumns<AccountUsage> = [
  { title: '账号', key: 'username', width: 150 }, { title: '姓名', key: 'displayName', width: 120 },
  { title: '输入', key: 'inputTokens', width: 100, render: row => tokenCell(row.inputTokens) }, { title: '输出', key: 'outputTokens', width: 100, render: row => tokenCell(row.outputTokens) },
  { title: '总 token', key: 'totalTokens', width: 110, render: row => tokenCell(row.totalTokens) }, { title: '请求数', key: 'requests', width: 80 }, { title: '未知用量', key: 'unknownRequests', width: 90 }, { title: '失败', key: 'failedRequests', width: 70 }
];
const callColumns: DataTableColumns<UsageCall> = [
  { title: '时间（北京）', key: 'createdAt', width: 150, render: row => formatBeijingTime(row.createdAt) },
  { title: '账号', key: 'username', width: 140 }, { title: '用途', key: 'configId', width: 100, render: row => purpose(row.configId) }, { title: '模型', key: 'model', width: 160 }, { title: '功能', key: 'feature', width: 120 }, { title: '状态', key: 'status', width: 90, render: row => statusTag(row.status) },
  { title: '输入', key: 'inputTokens', width: 90, render: row => tokenCell(row.inputTokens) }, { title: '输出', key: 'outputTokens', width: 90, render: row => tokenCell(row.outputTokens) },
  { title: '总 token', key: 'totalTokens', width: 100, render: row => tokenCell(row.totalTokens) }, { title: '来源', key: 'source', width: 90 }
];
const { checks: accountChecks, columns: accountTableColumns, scrollX: accountScrollX } = useColumnChecks(() => accountColumns);
const { checks: callChecks, columns: callTableColumns, scrollX: callScrollX } = useColumnChecks(() => callColumns);
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
  <main class="console-page list-page ai-usage">
    <header><h1>账户 AI 用量</h1><p class="page-description">按账户汇总并查看每次模型调用。</p></header>
    <NAlert type="info">CLIENT REPORTED · 客户端上报用量，可能缺失或被修改，不作为供应商账单。未知用量不计为零；日期按北京时间，包含结束日。</NAlert>
    <NCard class="search-card" size="small" :bordered="false">
      <NForm class="list-filters" :show-feedback="false" @submit.prevent="load(true)">
        <NFormItem class="usage-date-range" label="日期范围（北京时间）"><NDatePicker :formatted-value="dateRange" type="daterange" format="yyyy-MM-dd" value-format="yyyy-MM-dd" start-placeholder="开始日期" end-placeholder="结束日期" :to="false" clearable aria-label="日期范围（北京时间）" @update:formatted-value="changeDates" /></NFormItem>
        <NFormItem label="账户 ID"><NInput v-model:value="query.userId" placeholder="全部账户" :input-props="{ 'aria-label': '账户 ID' }" /></NFormItem>
        <NFormItem label="模型用途"><NSelect v-model:value="query.configId" :options="options" aria-label="模型用途" /></NFormItem>
        <NFormItem class="list-filters-actions" :show-label="false"><NButton attr-type="submit" type="primary" :loading="loading">查询</NButton></NFormItem>
      </NForm>
    </NCard>
    <NAlert v-if="error" type="error" role="alert">{{ error }}</NAlert>
    <NSpin v-if="loading && !result" class="list-state" size="small"><span role="status">正在加载用量…</span></NSpin>
    <template v-if="result">
      <NCard size="small" :bordered="false">
        <template #header>筛选范围汇总</template>
        <div class="usage-summary">
          <div><span>输入</span><strong>{{ tokens(result.summary.inputTokens) }}</strong></div>
          <div><span>输出</span><strong>{{ tokens(result.summary.outputTokens) }}</strong></div>
          <div><span>总 token</span><strong>{{ tokens(result.summary.totalTokens) }}</strong></div>
          <div><span>请求</span><strong>{{ result.summary.requests }}</strong></div>
          <div><span>未知用量</span><strong>{{ result.summary.unknownRequests }}</strong></div>
          <div><span>失败</span><strong>{{ result.summary.failedRequests }}</strong></div>
        </div>
      </NCard>
      <NCard class="table-card" size="small" :bordered="false">
        <template #header>按账户统计</template>
        <template #header-extra><TableToolbar v-model:columns="accountChecks" :loading="loading" @refresh="load()" /></template>
        <NEmpty v-if="!result.accounts.length" class="list-state" description="此范围内暂无用量" />
        <NDataTable v-else size="small" :bordered="false" :columns="accountTableColumns" :data="result.accounts" :row-key="row => row.userId" :scroll-x="accountScrollX" />
      </NCard>
      <NCard class="table-card" size="small" :bordered="false">
        <template #header>调用明细</template>
        <template #header-extra><TableToolbar v-model:columns="callChecks" :loading="loading" @refresh="load()" /></template>
        <p class="list-total">共 {{ result.total }} 次调用 · 第 {{ result.page }} 页</p>
        <NEmpty v-if="!result.calls.length" class="list-state" description="此范围内暂无调用" />
        <NDataTable v-else size="small" :bordered="false" :columns="callTableColumns" :data="result.calls" :row-key="row => `${row.userId}:${row.requestId}`" :scroll-x="callScrollX" />
        <nav v-if="result.total > query.pageSize" class="list-pagination" aria-label="调用明细分页"><NPagination :page="query.page" :page-size="query.pageSize" :item-count="result.total" :page-slot="5" @update:page="changePage" /></nav>
      </NCard>
    </template>
  </main>
</template>

<style scoped>
.list-filters .usage-date-range { width: 320px; max-width: 100%; }
.usage-date-range :deep(.n-date-picker) { width: 100%; min-width: 0; }
@media (max-width: 600px) {
  .usage-date-range :deep(.n-date-panel--daterange) { grid-template-areas: 'left-calendar' 'footer' 'action'; }
  .usage-date-range :deep(.n-date-panel-calendar--end), .usage-date-range :deep(.n-date-panel__vertical-divider) { display: none; }
}
.usage-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
.usage-summary > div { display: grid; gap: 4px; min-width: 0; padding: 12px 14px; border-radius: 8px; background: #f4f7f5; }
.usage-summary span { color: #5e6b63; font-size: 13px; }
.usage-summary strong { font-size: 18px; font-weight: 600; overflow-wrap: anywhere; }
html.dark .usage-summary > div { background: #262c28; }
html.dark .usage-summary span { color: #9aa59f; }
</style>
