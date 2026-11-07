<script setup lang="ts">
import { computed, h, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { DataTableColumns } from 'naive-ui';
import { NAlert, NButton, NInput, NDataTable, NPagination, NForm, NFormItem, NSelect, NSpin, NEmpty } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { listMembers } from '@/features/members/api';
import type { MemberRow, Page } from '@/features/members/api';
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
const columns: DataTableColumns<MemberRow> = [
  { title: '姓名', key: 'displayName', minWidth: 160 }, { title: '账号', key: 'username', minWidth: 160 },
  { title: '身份', key: 'role', width: 100, render: row => row.role === 'Admin' ? '管理员' : row.role === 'Parent' ? '家长' : '学生' },
  { title: '注册时间', key: 'createdAt', minWidth: 180 }, { title: '最近同步', key: 'lastSyncedAt', minWidth: 180, render: row => row.lastSyncedAt ?? '暂无快照' },
  { title: '课程达标', key: 'mastered', width: 110, render: row => row.mastered ?? '暂无快照' }, { title: '关联数', key: 'connections', width: 90 },
  { title: '操作', key: 'action', width: 140, fixed: 'right', render: row => h(NButton, { tag: 'a', href: router.resolve({ path: `/members/${encodeURIComponent(row.id)}`, query: route.query }).href, text: true, type: 'primary', onClick: (event: MouseEvent) => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); void router.push({ path: `/members/${encodeURIComponent(row.id)}`, query: route.query }); } } }, { default: () => '查看会员' }) }
];
watch(() => [route.fullPath, auth.profile?.id, auth.profile?.role, auth.sessionRevision], load, { immediate: true, flush: 'sync' });
onUnmounted(() => { generation++; controller?.abort(); });
</script>
<template>
  <main class="console-page">
    <header><h1>会员管理</h1><p class="page-description">查找账号、关联会员与云端记录。</p></header>
    <NForm class="filters" @submit.prevent="navigate(1)"><NFormItem label="姓名或账号" :label-props="{ for: 'member-search' }"><NInput v-model:value="q" :input-props="{ id: 'member-search', 'aria-label': '姓名或账号', maxlength: 40 }" /></NFormItem><NFormItem label="身份"><NSelect v-model:value="role" :options="roleOptions" aria-label="身份" style="min-width: 160px" /></NFormItem><NFormItem :show-label="false"><NButton attr-type="submit" type="primary">搜索</NButton></NFormItem></NForm>
    <NSpin v-if="loading" size="small"><span role="status">正在加载会员…</span></NSpin>
    <NAlert v-else-if="error" type="error" title="加载失败"><p>{{ error }}</p><NButton data-testid="retry" @click="load">重试</NButton></NAlert>
    <template v-else-if="data"><p>共 {{ data.total }} 位会员 · 第 {{ data.page }} 页</p><NEmpty v-if="!data.rows.length" description="没有匹配的会员" />
      <NDataTable v-if="data.rows.length" :columns="columns" :data="data.rows" :row-key="row => row.id" :scroll-x="1120" size="small" :bordered="false" />
      <nav class="filters" aria-label="会员分页"><NPagination :page="page" :page-size="data.pageSize" :item-count="data.total" :page-slot="5" @update:page="navigate" /></nav>
    </template>
  </main>
</template>
<style scoped>
.filters { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.filters :deep(.n-form-item) { min-width: 0; }
</style>
