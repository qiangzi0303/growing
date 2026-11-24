<script setup lang="ts">
import { computed, h, onUnmounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import type { DataTableColumns } from 'naive-ui';
import { NAlert, NButton, NCard, NDataTable, NEmpty, NForm, NFormItem, NInput, NPagination, NSpin } from 'naive-ui';
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
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], () => { query.value = ''; search.value = ''; page.value = 1; void load(); }, { immediate: true, flush: 'sync' });
function turn(target: number) { page.value = target; void load(); }
const muted = (text: string) => h('span', { class: 'list-muted' }, text);
const studentColumns = computed<DataTableColumns<StudentRow>>(() => [
  { title: '序号', key: 'number', width: 72, render: (_, index) => ((data.value?.page ?? 1) - 1) * (data.value?.pageSize ?? 20) + index + 1 },
  { title: '姓名', key: 'displayName', width: 160 },
  { title: '账号', key: 'username', width: 180, render: row => row.username ?? muted('—') },
  { title: '操作', key: 'action', width: 140, fixed: 'right', render: row => h(NButton, { tag: 'a', href: router.resolve(`/students/${encodeURIComponent(row.id)}`).href, text: true, type: 'primary', onClick: (event: MouseEvent) => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); void router.push(`/students/${encodeURIComponent(row.id)}`); } } }, { default: () => '查看学习档案' }) }
]);
const { checks, columns, scrollX } = useColumnChecks(() => studentColumns.value);
onUnmounted(() => { generation++; controller?.abort(); });
</script>

<template>
  <main class="console-page list-page">
    <header><h1>{{ parent ? '我的孩子' : '学生档案' }}</h1><p class="page-description">{{ parent ? '查看已绑定孩子的学习与成长记录。' : '按姓名或账号查找学生，查看云端学习档案。' }}</p></header>
    <NCard v-if="!parent" class="search-card" size="small" :bordered="false">
      <NForm class="list-filters" :show-feedback="false" @submit.prevent="submit">
        <NFormItem label="姓名或账号" :label-props="{ for: 'student-search' }"><NInput v-model:value="query" placeholder="输入姓名或账号" :input-props="{ id: 'student-search' }" /></NFormItem>
        <NFormItem class="list-filters-actions" :show-label="false"><NButton attr-type="submit" type="primary" :disabled="loading">搜索学生</NButton></NFormItem>
      </NForm>
    </NCard>
    <NCard class="table-card" size="small" :bordered="false">
      <template #header><h2>{{ parent ? '孩子列表' : '学生列表' }}</h2></template>
      <template #header-extra><TableToolbar v-model:columns="checks" :loading="loading" @refresh="load" /></template>
      <NSpin v-if="loading" class="list-state" size="small"><span role="status">正在加载学生列表…</span></NSpin>
      <NAlert v-else-if="error" title="加载失败" type="error"><p>{{ error }}</p><NButton data-testid="retry-list" @click="load">重试</NButton></NAlert>
      <template v-else-if="data">
        <p v-if="!parent" class="list-total">共 {{ data.total }} 位学生 · 第 {{ data.page }} 页</p>
        <NEmpty v-if="!data.rows.length" class="list-state" :description="parent ? '尚未添加孩子' : '没有匹配的学生'"><template v-if="parent" #extra><RouterLink v-slot="{ href, navigate }" to="/account" custom><NButton tag="a" :href="href" @click="navigate">添加孩子</NButton></RouterLink></template></NEmpty>
        <NDataTable v-else :columns="columns" :data="data.rows" :row-key="row => row.id" :scroll-x="scrollX" size="small" :bordered="false" />
        <nav v-if="!parent && data.total > data.pageSize" class="list-pagination" aria-label="学生列表分页"><NPagination :page="page" :page-size="data.pageSize" :item-count="data.total" :page-slot="5" @update:page="turn" /></nav>
      </template>
    </NCard>
  </main>
</template>
