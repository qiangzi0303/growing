<script setup lang="ts">
import { computed, h, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { DataTableColumns } from 'naive-ui';
import { NAlert, NButton, NCard, NDataTable, NEmpty, NForm, NFormItem, NInput, NPagination, NSelect, NSpin } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { listMembers } from '@/features/members/api';
import type { MemberRow, Page } from '@/features/members/api';
import { renderRoleTag } from '@/features/members/role-tag';
import TableToolbar from '@/components/advanced/table-toolbar.vue';
import { useColumnChecks } from '@/hooks/common/table-columns';
import { formatBeijingTime } from '@/utils/datetime';
const auth = useAuthStore(); const route = useRoute(); const router = useRouter();
const q = ref(''); const role = ref(''); const data = ref<Page<MemberRow> | null>(null); const error = ref(''); const loading = ref(false);
const page = computed(() => { const value = Number(route.query.page); return Number.isSafeInteger(value) && value > 0 ? value : 1; });
let generation = 0; let controller: AbortController | null = null;
async function load() {
  const current = ++generation; controller?.abort(); controller = new AbortController(); data.value = null; error.value = ''; loading.value = false;
  if (route.path !== '/members') return;
  if (auth.profile?.role !== 'Admin') { error.value = '无权访问会员管理'; return; }
  q.value = String(route.query.q ?? '').slice(0, 40); role.value = ['Student', 'Parent', 'Admin'].includes(String(route.query.role)) ? String(route.query.role) : '';
  loading.value = true;
  try { const result = await listMembers({ q: q.value, role: role.value, page: page.value, signal: controller.signal }); if (current === generation) data.value = result; }
  catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : '会员列表加载失败'; }
  finally { if (current === generation) loading.value = false; }
}
function navigate(target: number) { void router.push({ path: '/members', query: { q: q.value.trim(), role: role.value, page: String(target) } }); }
const roleOptions = [{ label: '全部身份', value: '' }, { label: '学生', value: 'Student' }, { label: '家长', value: 'Parent' }, { label: '管理员', value: 'Admin' }];
const muted = (text: string) => h('span', { class: 'list-muted' }, text);
const memberColumns: DataTableColumns<MemberRow> = [
  { title: '姓名', key: 'displayName', width: 160 }, { title: '账号', key: 'username', width: 160 },
  { title: '身份', key: 'role', width: 90, render: row => renderRoleTag(row.role) },
  { title: '注册时间', key: 'createdAt', width: 150, render: row => formatBeijingTime(row.createdAt) },
  { title: '最近同步', key: 'lastSyncedAt', width: 150, render: row => row.lastSyncedAt ? formatBeijingTime(row.lastSyncedAt) : muted('暂无快照') },
  { title: '课程达标', key: 'mastered', width: 100, render: row => row.mastered ?? muted('暂无快照') }, { title: '关联数', key: 'connections', width: 80 },
  { title: '操作', key: 'action', width: 110, fixed: 'right', render: row => h(NButton, { tag: 'a', href: router.resolve({ path: `/members/${encodeURIComponent(row.id)}`, query: route.query }).href, text: true, type: 'primary', onClick: (event: MouseEvent) => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); void router.push({ path: `/members/${encodeURIComponent(row.id)}`, query: route.query }); } } }, { default: () => '查看会员' }) }
];
const { checks, columns, scrollX } = useColumnChecks(() => memberColumns);
watch(() => [route.fullPath, auth.profile?.id, auth.profile?.role, auth.sessionRevision], load, { immediate: true, flush: 'sync' });
onUnmounted(() => { generation++; controller?.abort(); });
</script>
<template>
  <main class="console-page list-page">
    <header><h1>会员管理</h1><p class="page-description">查找账号、关联会员与云端记录。</p></header>
    <NCard class="search-card" size="small" :bordered="false">
      <NForm class="list-filters" :show-feedback="false" @submit.prevent="navigate(1)">
        <NFormItem label="姓名或账号" :label-props="{ for: 'member-search' }"><NInput v-model:value="q" placeholder="输入姓名或账号" :input-props="{ id: 'member-search', 'aria-label': '姓名或账号', maxlength: 40 }" /></NFormItem>
        <NFormItem label="身份"><NSelect v-model:value="role" :options="roleOptions" aria-label="身份" /></NFormItem>
        <NFormItem class="list-filters-actions" :show-label="false"><NButton attr-type="submit" type="primary" :disabled="loading">搜索</NButton></NFormItem>
      </NForm>
    </NCard>
    <NCard class="table-card" size="small" :bordered="false">
      <template #header><h2>会员列表</h2></template>
      <template #header-extra><TableToolbar v-model:columns="checks" :loading="loading" @refresh="load" /></template>
      <NSpin v-if="loading" class="list-state" size="small"><span role="status">正在加载会员…</span></NSpin>
      <NAlert v-else-if="error" type="error" title="加载失败"><p>{{ error }}</p><NButton data-testid="retry" @click="load">重试</NButton></NAlert>
      <template v-else-if="data">
        <p class="list-total">共 {{ data.total }} 位会员 · 第 {{ data.page }} 页</p>
        <NEmpty v-if="!data.rows.length" class="list-state" description="没有匹配的会员" />
        <NDataTable v-else :columns="columns" :data="data.rows" :row-key="row => row.id" :scroll-x="scrollX" size="small" :bordered="false" />
        <nav v-if="data.total > data.pageSize" class="list-pagination" aria-label="会员分页"><NPagination :page="page" :page-size="data.pageSize" :item-count="data.total" :page-slot="5" @update:page="navigate" /></nav>
      </template>
    </NCard>
  </main>
</template>
