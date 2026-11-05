<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NAlert, NButton, NInput, NTable } from 'naive-ui';
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
watch(() => [route.fullPath, auth.profile?.id, auth.profile?.role, auth.sessionRevision], load, { immediate: true, flush: 'sync' });
onUnmounted(() => { generation++; controller?.abort(); });
</script>
<template>
  <main class="console-page">
    <header><h1>会员管理</h1><p class="page-description">查找账号、关联会员与云端记录。</p></header>
    <form class="filters" @submit.prevent="navigate(1)"><label for="member-search">姓名或账号</label><NInput v-model:value="q" :input-props="{ id: 'member-search', 'aria-label': '姓名或账号', maxlength: 40 }" /><label for="member-role">身份</label><select id="member-role" v-model="role"><option value="">全部身份</option><option value="Student">学生</option><option value="Parent">家长</option><option value="Admin">管理员</option></select><NButton attr-type="submit" type="primary">搜索</NButton></form>
    <p v-if="loading" role="status">正在加载会员…</p>
    <NAlert v-else-if="error" type="error" title="加载失败"><p>{{ error }}</p><NButton data-testid="retry" @click="load">重试</NButton></NAlert>
    <template v-else-if="data"><p>共 {{ data.total }} 位会员 · 第 {{ data.page }} 页</p><p v-if="!data.rows.length">没有匹配的会员</p>
      <div v-if="data.rows.length" class="table-scroll" role="region" aria-label="会员列表" tabindex="0">
        <NTable size="small" :bordered="false" :single-line="true" class="member-table">
          <thead><tr><th scope="col">姓名</th><th scope="col">账号</th><th scope="col">身份</th><th scope="col">注册时间</th><th scope="col">最近同步</th><th scope="col">课程达标</th><th scope="col">关联数</th><th scope="col">操作</th></tr></thead>
          <tbody><tr v-for="member in data.rows" :key="member.id"><td class="member-name">{{ member.displayName }}</td><td>{{ member.username }}</td><td>{{ member.role === 'Admin' ? '管理员' : member.role === 'Parent' ? '家长' : '学生' }}</td><td>{{ member.createdAt }}</td><td>{{ member.lastSyncedAt ?? '暂无快照' }}</td><td>{{ member.mastered ?? '暂无快照' }}</td><td>{{ member.connections }}</td><td><RouterLink :to="{ path: `/members/${encodeURIComponent(member.id)}`, query: route.query }">查看会员</RouterLink></td></tr></tbody>
        </NTable>
      </div>
      <nav class="filters" aria-label="会员分页"><NButton aria-label="上一页" :disabled="page <= 1" @click="navigate(page - 1)">上一页</NButton><NButton aria-label="下一页" :disabled="page * data.pageSize >= data.total" @click="navigate(page + 1)">下一页</NButton></nav>
    </template>
  </main>
</template>
<style scoped>
.filters { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }.filters .n-input { flex: 1; min-width: 140px; }a { color: #38694f; text-decoration: underline; }select { padding: 8px; border: 1px solid #bbb; border-radius: 4px; }
.table-scroll { min-width: 0; overflow-x: auto; border: 1px solid #e0e7e1; border-radius: 6px; background: white; }
.table-scroll:focus-visible { outline: 2px solid #38694f; outline-offset: 2px; }
.member-table { min-width: 1080px; }
.member-table :deep(th), .member-table :deep(td) { padding: 12px 16px; white-space: nowrap; }
.member-table :deep(th) { background: #f3f7f4; color: #53665a; }
.member-name { font-weight: 600; }
</style>
