<script setup lang="ts">
import { computed, h, onUnmounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import type { DataTableColumns } from 'naive-ui';
import { NAlert, NButton, NDataTable, NEmpty, NInput, NPagination, NSpin } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { listStudents } from '@/features/students/api';
import type { ConsoleRole, StudentList, StudentRow } from '@/features/students/api';
import TableToolbar from '@/components/advanced/table-toolbar.vue';
import { useColumnChecks } from '@/hooks/common/table-columns';
const auth = useAuthStore(); const router = useRouter();
const parent = computed(() => auth.profile?.role === 'Parent');
const query = ref(''); const search = ref(''); const page = ref(1);
const data = ref<StudentList | null>(null); const loading = ref(false); const error = ref('');
let generation = 0; let controller: AbortController | null = null;
async function load() {
  const current = ++generation; controller?.abort(); controller = new AbortController();
  data.value = null; error.value = ''; loading.value = false;
  if (!auth.profile || !['Admin', 'Parent'].includes(auth.profile.role)) return;
  loading.value = true;
  try {
    const result = await listStudents(auth.profile.role as ConsoleRole, { q: search.value, page: page.value, signal: controller.signal });
    if (current === generation) data.value = result;
  } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : '学生列表加载失败。'; }
  finally { if (current === generation) loading.value = false; }
}
function submit() { search.value = query.value.trim(); page.value = 1; void load(); }
function turn(target: number) { page.value = target; void load(); }
function rowKey(row: StudentRow) { return row.id; }
const muted = (text: string) => h('span', { class: 'list-muted' }, text);
const studentColumns = computed<DataTableColumns<StudentRow>>(() => [
  { title: '序号', key: 'number', width: 64, align: 'right', className: 'student-number', render: (_, index) => ((data.value?.page ?? 1) - 1) * (data.value?.pageSize ?? 20) + index + 1 },
  { title: '姓名', key: 'displayName', minWidth: 220, ellipsis: { tooltip: true }, render: row => h('span', { class: 'student-identity' }, [h('span', { class: 'student-initial', 'aria-hidden': 'true' }, Array.from(row.displayName.trim())[0] || '学'), h('span', { class: 'student-name' }, row.displayName)]) },
  { title: '账号', key: 'username', minWidth: 220, ellipsis: { tooltip: true }, className: 'student-account', render: row => row.username ?? muted('—') },
  { title: '操作', key: 'action', width: 152, align: 'right', fixed: 'right', render: row => h(NButton, { tag: 'a', size: 'small', class: 'student-open', href: router.resolve(`/students/${encodeURIComponent(row.id)}`).href, onClick: (event: MouseEvent) => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); void router.push(`/students/${encodeURIComponent(row.id)}`); } } }, { default: () => '查看学习档案' }) }
]);
const { checks, columns, scrollX } = useColumnChecks(() => studentColumns.value);
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], () => { query.value = ''; search.value = ''; page.value = 1; void load(); }, { immediate: true, flush: 'sync' });
onUnmounted(() => { generation++; controller?.abort(); });
</script>

<template>
  <main class="console-page list-page students-page">
    <header><h1>{{ parent ? '我的孩子' : '学生档案' }}</h1><p class="page-description">{{ parent ? '查看已绑定孩子的学习与成长记录。' : '按姓名或账号查找学生，查看云端学习档案。' }}</p></header>
    <section class="table-card student-sheet" :aria-label="parent ? '孩子列表' : '学生列表'" :aria-busy="loading">
      <div class="student-toolbar">
        <form v-if="!parent" class="student-search" role="search" @submit.prevent="submit">
          <label for="student-search" class="sr-only">姓名或账号</label>
          <NInput v-model:value="query" placeholder="搜索姓名或账号" clearable :input-props="{ id: 'student-search' }" />
          <NButton attr-type="submit" type="primary" :disabled="loading">搜索学生</NButton>
        </form>
        <h2 v-else>孩子列表</h2>
        <TableToolbar v-model:columns="checks" :loading="loading" @refresh="load" />
      </div>
      <NSpin v-if="loading" class="list-state" size="small"><span role="status">正在加载学生列表…</span></NSpin>
      <NAlert v-else-if="error" title="加载失败" type="error"><p>{{ error }}</p><NButton data-testid="retry-list" @click="load">重试</NButton></NAlert>
      <template v-else-if="data">
        <NEmpty v-if="!data.rows.length" class="list-state" :description="parent ? '尚未添加孩子' : '没有匹配的学生'"><template v-if="parent" #extra><RouterLink v-slot="{ href, navigate }" to="/account" custom><NButton tag="a" :href="href" @click="navigate">添加孩子</NButton></RouterLink></template></NEmpty>
        <NDataTable v-else aria-label="学生档案表" :columns="columns" :data="data.rows" :row-key="rowKey" :scroll-x="scrollX" :single-line="true" :bordered="false" />
        <footer v-if="!parent" class="student-table-footer">
          <p class="list-total">共 {{ data.total }} 位学生 · 第 {{ data.page }} 页</p>
          <nav v-if="data.total > data.pageSize" class="list-pagination" aria-label="学生列表分页"><NPagination :page="page" :page-size="data.pageSize" :item-count="data.total" :page-slot="5" @update:page="turn" /></nav>
        </footer>
      </template>
    </section>
  </main>
</template>

<style scoped>
.students-page { width: 100%; max-width: 1120px; gap: 24px; padding-top: 20px; }
.students-page > header { padding-inline: 2px; }
.student-sheet { --sheet-surface: #fff; --sheet-line: #e3e8e5; --sheet-ink: #202a24; --sheet-muted: #616d65; --sheet-hover: #f4f7f5; min-width: 0; overflow: hidden; border: 1px solid var(--sheet-line); border-radius: 10px; background: var(--sheet-surface); }
.student-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 20px; border-bottom: 1px solid var(--sheet-line); }
.student-toolbar h2 { margin: 0; font-size: 16px; font-weight: 600; }
.student-search { display: flex; align-items: center; gap: 8px; width: 410px; max-width: 100%; }
.student-search .n-input { flex: 1; min-width: 0; }
.student-search .n-button { flex: none; }
.student-table-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 16px 20px; }
.student-table-footer .list-total, .student-table-footer .list-pagination { margin: 0; }
.student-sheet :deep(.n-data-table) { --n-th-color: var(--sheet-surface) !important; --n-td-color: var(--sheet-surface) !important; --n-th-text-color: var(--sheet-muted) !important; --n-td-text-color: var(--sheet-ink) !important; --n-border-color: var(--sheet-line) !important; --n-td-color-hover: var(--sheet-hover) !important; font-size: 14px; }
.student-sheet :deep(.n-data-table-th) { height: 44px; padding: 10px 20px; font-size: 13px; font-weight: 600; white-space: nowrap; }
.student-sheet :deep(.n-data-table-td) { height: 60px; padding: 12px 20px; }
.student-sheet :deep(.student-number), .student-sheet :deep(.student-account) { color: var(--sheet-muted); }
.student-sheet :deep(.student-number) { padding-inline: 12px; }
.student-sheet :deep(.student-identity) { display: flex; align-items: center; gap: 12px; min-width: 0; }
.student-sheet :deep(.student-initial) { display: inline-flex; flex: 0 0 32px; align-items: center; justify-content: center; height: 32px; border-radius: 50%; background: var(--sheet-hover); color: var(--sheet-muted); font-size: 13px; }
.student-sheet :deep(.student-name) { overflow: hidden; text-overflow: ellipsis; color: var(--sheet-ink); font-weight: 600; }
.student-sheet :deep(.student-open) { font-size: 13px; }
.student-sheet > .n-alert { margin: 20px; }
:global(html.dark) .student-sheet { --sheet-surface: #202722; --sheet-line: #343d37; --sheet-ink: #ecf1ed; --sheet-muted: #abb8ae; --sheet-hover: #2a332d; }
@media (max-width: 600px) {
  .students-page { gap: 16px; padding-top: 8px; }
  .student-toolbar { gap: 12px; padding: 16px; }
  .student-search { width: 100%; }
  .student-toolbar :deep(.table-toolbar) { margin-left: auto; }
  .student-sheet :deep(.n-data-table-th), .student-sheet :deep(.n-data-table-td) { padding-inline: 12px; }
  .student-sheet :deep(.student-initial) { display: none; }
  .student-table-footer { padding: 16px; }
}
</style>
