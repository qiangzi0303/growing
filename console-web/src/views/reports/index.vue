<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NAlert, NButton, NInput, NTable } from 'naive-ui';
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
function turn(delta: number) { page.value += delta; void load(); }
function choose(id: string) { void router.replace({ path: '/reports', query: { student: id } }); }
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], () => { query.value = ''; search.value = ''; page.value = 1; void load(); }, { immediate: true, flush: 'sync' });
onUnmounted(() => { sequence++; controller?.abort(); });
</script>

<template>
  <main class="console-page">
    <header><h1>学生学习报告</h1><p class="page-description">云端已同步的学习时间、成长曲线与单元记录。</p></header>
    <template v-if="!parent">
      <form class="report-filters" @submit.prevent="submit"><label for="report-search">姓名或账号</label><NInput v-model:value="query" :input-props="{ id: 'report-search', 'aria-label': '姓名或账号' }" placeholder="查找学生" /><NButton attr-type="submit" :disabled="loading">搜索学生</NButton></form>
      <p v-if="loading" role="status">正在加载学生列表…</p>
      <NAlert v-else-if="error" type="error" title="学生列表加载失败"><p>{{ error }}</p><NButton @click="load">重试</NButton></NAlert>
      <template v-else-if="students">
        <p v-if="!students.rows.length">没有匹配的学生</p>
        <div v-else class="table-scroll" role="region" aria-label="报告学生列表" tabindex="0">
          <NTable size="small" :bordered="false" :single-line="true" class="report-students-table">
            <thead><tr><th scope="col">序号</th><th scope="col">姓名</th><th scope="col">账号</th><th scope="col">操作</th></tr></thead>
            <tbody><tr v-for="(student, index) in students.rows" :key="student.id" :class="{ selected: selected === student.id }"><td>{{ (students.page - 1) * students.pageSize + index + 1 }}</td><td>{{ student.displayName }}</td><td>{{ student.username ?? '—' }}</td><td><NButton size="small" :aria-pressed="selected === student.id" @click="choose(student.id)">{{ selected === student.id ? '正在查看' : '查看报告' }}</NButton></td></tr></tbody>
          </NTable>
        </div>
        <nav v-if="students.total" aria-label="报告学生分页"><NButton :disabled="page <= 1" aria-label="上一页" @click="turn(-1)">上一页</NButton><span>第 {{ students.page }} 页 · 共 {{ students.total }} 位</span><NButton :disabled="page * students.pageSize >= students.total" aria-label="下一页" @click="turn(1)">下一页</NButton></nav>
      </template>
    </template>
    <StudentOverview v-if="parent || selected" :student-id="selected || undefined" show-reports />
    <p v-else>请选择学生查看报告。</p>
  </main>
</template>

<style scoped>
.report-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; } .report-filters .n-input { max-width: 320px; } nav { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; width: 100%; }
.table-scroll { min-width: 0; overflow-x: auto; border: 1px solid #e0e7e1; border-radius: 6px; background: white; }
.table-scroll:focus-visible { outline: 2px solid #38694f; outline-offset: 2px; }
.report-students-table { min-width: 560px; }
.report-students-table :deep(th), .report-students-table :deep(td) { padding: 12px 16px; }
.report-students-table :deep(th) { background: #f3f7f4; color: #53665a; }
.selected :deep(td) { background: #f3f7f4; }
</style>
