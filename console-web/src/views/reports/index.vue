<script setup lang="ts">
import { computed, h, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NAlert, NButton, NDataTable, NEmpty, NForm, NFormItem, NInput, NPagination, NSpin } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { listStudents } from '@/features/students/api';
import type { StudentList } from '@/features/students/api';
import StudentOverview from '@/features/students/components/student-overview.vue';
const auth = useAuthStore(); const route = useRoute(); const router = useRouter();
const parent = computed(() => auth.profile?.role === 'Parent');
const selected = computed(() => typeof route.query.student === 'string' ? route.query.student : '');
const query = ref(''); const search = ref(''); const page = ref(1);
const students = ref<StudentList | null>(null); const loading = ref(false); const error = ref('');
let controller: AbortController | null = null; let sequence = 0;
async function load() {
  const current = ++sequence; controller?.abort(); controller = new AbortController();
  students.value = null; error.value = ''; loading.value = false;
  if (auth.profile?.role !== 'Admin') return;
  loading.value = true;
  try {
    const result = await listStudents('Admin', { q: search.value, page: page.value, signal: controller.signal });
    if (current === sequence) students.value = result;
  } catch (cause) { if (current === sequence) error.value = cause instanceof Error ? cause.message : '学生列表读取失败'; }
  finally { if (current === sequence) loading.value = false; }
}
function submit() { search.value = query.value.trim(); page.value = 1; void load(); }
function turn(value: number) { page.value = value; void load(); }
function choose(id: string) { void router.replace({ path: '/reports', query: { student: id } }); }
const columns: DataTableColumns<StudentList['rows'][number]> = [
  { title: '序号', key: 'index', width: 80, render: (_student, index) => ((students.value?.page ?? 1) - 1) * (students.value?.pageSize ?? 20) + index + 1 },
  { title: '姓名', key: 'displayName', width: 160 },
  { title: '账号', key: 'username', width: 180, render: row => row.username ?? '—' },
  { title: '操作', key: 'actions', width: 140, fixed: 'right', render: row => h(NButton, { size: 'small', 'aria-pressed': selected.value === row.id, onClick: () => choose(row.id) }, { default: () => selected.value === row.id ? '正在查看' : '查看报告' }) }
];
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], () => { query.value = ''; search.value = ''; page.value = 1; void load(); }, { immediate: true, flush: 'sync' });
onUnmounted(() => { sequence++; controller?.abort(); });
</script>

<template>
  <main class="console-page">
    <header><h1>学生学习报告</h1><p class="page-description">云端已同步的学习时间、成长曲线与单元记录。</p></header>
    <template v-if="!parent">
      <NForm class="report-filters" :show-feedback="false" label-placement="top" @submit.prevent="submit"><NFormItem label="姓名或账号"><NInput v-model:value="query" :input-props="{ id: 'report-search', 'aria-label': '姓名或账号' }" placeholder="查找学生" /></NFormItem><NButton attr-type="submit" :disabled="loading">搜索学生</NButton></NForm>
      <NSpin v-if="loading" size="small" role="status"><span>正在加载学生列表…</span></NSpin>
      <NAlert v-else-if="error" type="error" title="学生列表加载失败"><p>{{ error }}</p><NButton @click="load">重试</NButton></NAlert>
      <template v-else-if="students">
        <NEmpty v-if="!students.rows.length" description="没有匹配的学生" />
        <div v-else class="table-scroll" role="region" aria-label="报告学生列表" tabindex="0">
          <NDataTable size="small" :columns="columns" :data="students.rows" :row-key="row => row.id" :scroll-x="560" />
        </div>
        <NPagination v-if="students.total" aria-label="报告学生分页" :page="students.page" :page-size="students.pageSize" :item-count="students.total" :page-slot="5" @update:page="turn" />
      </template>
    </template>
    <StudentOverview v-if="parent || selected" :student-id="selected || undefined" show-reports />
    <p v-else>请选择学生查看报告。</p>
  </main>
</template>

<style scoped>
.report-filters { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; margin-bottom: 16px; }
.report-filters :deep(.n-form-item) { width: 320px; max-width: 100%; }
.table-scroll { min-width: 0; }
.n-pagination { margin-top: 16px; }
</style>
