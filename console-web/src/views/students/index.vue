<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { NAlert, NButton, NInput, NTable } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { listStudents } from '@/features/students/api';
import type { ConsoleRole, StudentList } from '@/features/students/api';
const auth = useAuthStore();
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
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], () => { query.value = ''; search.value = ''; page.value = 1; void load(); }, { immediate: true, flush: 'sync' });
function turn(delta: number) { page.value += delta; void load(); }
onUnmounted(() => { generation++; controller?.abort(); });
</script>

<template>
  <main class="console-page">
    <header><h1>{{ parent ? '我的孩子' : '学生档案' }}</h1><p class="page-description">{{ parent ? '查看已绑定孩子的学习与成长记录。' : '按姓名或账号查找学生，查看云端学习档案。' }}</p></header>
    <form v-if="!parent" class="student-search" @submit.prevent="submit"><label for="student-search">姓名或账号</label><NInput :input-props="{ id: 'student-search' }" v-model:value="query" placeholder="输入姓名或账号" /><NButton attr-type="submit" type="primary" :disabled="loading">搜索学生</NButton></form>
    <p v-if="loading" role="status">正在加载学生列表…</p>
    <NAlert v-else-if="error" title="加载失败" type="error"><p>{{ error }}</p><NButton data-testid="retry-list" @click="load">重试</NButton></NAlert>
    <template v-else-if="data">
      <div v-if="!data.rows.length" class="empty-state"><p>{{ parent ? '尚未添加孩子' : '没有匹配的学生' }}</p><RouterLink v-if="parent" to="/account">添加孩子</RouterLink></div>
      <div v-else class="table-scroll" role="region" :aria-label="parent ? '孩子列表' : '学生档案列表'" tabindex="0">
        <NTable size="small" :bordered="false" :single-line="true" class="student-table">
          <thead><tr><th scope="col" class="row-number">序号</th><th scope="col">姓名</th><th scope="col">账号</th><th scope="col" class="row-action">操作</th></tr></thead>
          <tbody><tr v-for="(student, index) in data.rows" :key="student.id"><td class="row-number">{{ (data.page - 1) * data.pageSize + index + 1 }}</td><td class="student-name">{{ student.displayName }}</td><td>{{ student.username ?? '—' }}</td><td class="row-action"><RouterLink :to="`/students/${encodeURIComponent(student.id)}`">查看学习档案</RouterLink></td></tr></tbody>
        </NTable>
      </div>
      <nav v-if="!parent && data.total > 0" class="student-pagination" aria-label="学生列表分页"><span>共 {{ data.total }} 位学生 · 第 {{ data.page }} 页</span><NButton aria-label="上一页" :disabled="page <= 1" @click="turn(-1)">上一页</NButton><NButton aria-label="下一页" :disabled="page * data.pageSize >= data.total" @click="turn(1)">下一页</NButton></nav>
    </template>
  </main>
</template>

<style scoped>
.student-search { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; } .student-search .n-input { flex: 1; min-width: 140px; }
.table-scroll { min-width: 0; overflow-x: auto; border: 1px solid #e0e7e1; border-radius: 6px; background: white; }
.table-scroll:focus-visible { outline: 2px solid #38694f; outline-offset: 2px; }
.student-table { min-width: 560px; }
.student-table :deep(th), .student-table :deep(td) { padding: 12px 16px; }
.student-table :deep(th) { background: #f3f7f4; color: #53665a; }
.student-name { font-weight: 600; overflow-wrap: anywhere; }
.row-number { width: 72px; font-variant-numeric: tabular-nums; }
.row-action { width: 144px; white-space: nowrap; }
a { color: #38694f; text-decoration: underline; text-underline-offset: 3px; }
.student-pagination { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.empty-state { text-align: center; padding: 32px 16px; }
</style>
