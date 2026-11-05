<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NAlert, NButton, NInput, NSelect, NTable } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { listStudents } from '@/features/students/api';
import type { RewardReport, StudentIdentity } from '@/features/students/api';
import { listMembers, getMember } from '@/features/members/api';
import type { MemberRow, Page } from '@/features/members/api';
import { api } from '@/service/request';
import { getLedger, rewardAmount } from '@/features/rewards/api';
import type { LedgerRow } from '@/features/rewards/api';
import RewardLedger from '@/features/rewards/components/reward-ledger.vue';
const auth = useAuthStore(); const route = useRoute(); const router = useRouter();
const children = ref<StudentIdentity[]>([]); const student = ref<StudentIdentity | null>(null); const rewards = ref<RewardReport | null>(null); const ledger = ref<Page<LedgerRow> | null>(null); const loading = ref(false); const error = ref('');
const searchText = ref(''); const searchRole = ref<'Student' | 'Parent'>('Student'); const found = ref<MemberRow[]>([]); const searchPage = ref(1); const searchTotal = ref(0); const searching = ref(false); const searchError = ref(''); const filterNames = ref('');
let version = 0; let controller: AbortController | null = null; let searchVersion = 0; let searchController: AbortController | null = null;
const scalar = (value: unknown) => typeof value === 'string' ? value : '';
async function load() {
 const current = ++version; controller?.abort(); controller = new AbortController(); const signal = controller.signal; children.value = []; student.value = null; rewards.value = null; ledger.value = null; error.value = ''; filterNames.value = ''; loading.value = true;
 try {
  if (['student', 'parent', 'page'].some(key => Object.prototype.hasOwnProperty.call(route.query, key) && (typeof route.query[key] !== 'string' || !(route.query[key] as string).trim()))) throw new Error('奖励筛选参数无效，请重新选择。');
  if (Object.prototype.hasOwnProperty.call(route.query, 'page') && (!/^[1-9]\d*$/.test(scalar(route.query.page)) || !Number.isSafeInteger(Number(route.query.page)))) throw new Error('奖励筛选参数无效，请重新选择。');
  const selected = scalar(route.query.student); const parent = scalar(route.query.parent);
  if (auth.profile?.role === 'Parent') {
   if (parent) throw new Error('家长只能查看已绑定孩子的奖励。');
   const result = await listStudents('Parent', { signal }); if (current !== version) return; children.value = result.rows; const target = selected ? result.rows.find(row => row.id === selected) : result.rows[0]; if (selected && !target) throw new Error('此孩子未绑定到当前账号，无法查看。'); if (target) { student.value = target; const result = await api<RewardReport>(`/parent/children/${encodeURIComponent(target.id)}/rewards`, { signal }); if (current === version) rewards.value = result; }
  } else if (auth.profile?.role === 'Admin') {
   const names: string[] = [];
   for (const [id, role] of [[selected, 'Student'], [parent, 'Parent']]) { if (!id) continue; const detail = await getMember(id, signal); if (current !== version) return; if (detail.member.role !== role) throw new Error('筛选账号身份已变化，请重新选择。'); names.push(detail.member.displayName); }
   const page = Number(scalar(route.query.page) || 1); if (!Number.isSafeInteger(page) || page < 1) throw new Error('账本页码无效。'); const result = await getLedger(page, selected, parent, signal); if (current === version) { ledger.value = result; filterNames.value = names.join(' / ') || '全部已确认记录'; }
  }
 } catch (cause) { if (current === version) error.value = cause instanceof Error ? cause.message : '奖励加载失败'; } finally { if (current === version) loading.value = false; }
}
function reset() { searchVersion++; searchController?.abort(); searchText.value = ''; found.value = []; searchError.value = ''; searching.value = false; searchPage.value = 1; searchTotal.value = 0; }
async function search(page = 1) { if (auth.profile?.role !== 'Admin') return; const current = ++searchVersion; searchController?.abort(); searchController = new AbortController(); searching.value = true; searchError.value = ''; found.value = []; try { const result = await listMembers({ q: searchText.value.trim(), role: searchRole.value, page, signal: searchController.signal }); if (current === searchVersion) { found.value = result.rows; searchPage.value = result.page; searchTotal.value = result.total; } } catch (cause) { if (current === searchVersion) searchError.value = cause instanceof Error ? cause.message : '搜索失败'; } finally { if (current === searchVersion) searching.value = false; } }
function selectMember(row: MemberRow) { void router.replace({ query: { ...route.query, [row.role === 'Student' ? 'student' : 'parent']: row.id, page: '1' } }); }
watch(() => [route.query.student, route.query.parent, route.query.page, auth.profile?.id, auth.profile?.role, auth.sessionRevision], load, { immediate: true, flush: 'sync' });
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision, searchRole.value], reset, { flush: 'sync' });
onUnmounted(() => { version++; controller?.abort(); reset(); });
</script>
<template>
  <section class="rewards-page">
    <header><h1>奖励记录</h1><p>设备累计与云端确认分开查看；确认代表已实际兑现。</p></header>
    <section v-if="auth.profile?.role === 'Admin'" aria-label="筛选确认账本"><h2>筛选确认账本</h2>
      <form @submit.prevent="search(1)"><NSelect v-model:value="searchRole" aria-label="搜索账号类型" :options="[{ label: '学生', value: 'Student' }, { label: '家长', value: 'Parent' }]" /><NInput v-model:value="searchText" :input-props="{ 'aria-label': '搜索学生或家长', maxlength: 40 }" placeholder="账号或姓名" /><NButton attr-type="submit" :disabled="searching">搜索账号</NButton><NButton @click="router.replace({ query: {} })">清除筛选</NButton></form>
      <p v-if="searching" role="status">正在搜索…</p><p v-if="searchError" role="alert">{{ searchError }}</p>
      <div v-if="found.length" class="table-scroll search-results" role="region" aria-label="奖励筛选账号表" tabindex="0"><NTable size="small" :bordered="false" :single-line="true" class="account-table">
        <thead><tr><th scope="col">姓名</th><th scope="col">账号</th><th scope="col">身份</th><th scope="col">操作</th></tr></thead>
        <tbody><tr v-for="row in found" :key="row.id"><td>{{ row.displayName }}</td><td>{{ row.username }}</td><td>{{ row.role === 'Student' ? '学生' : '家长' }}</td><td><NButton size="small" @click="selectMember(row)">按此账号筛选</NButton></td></tr></tbody>
      </NTable></div>
      <nav v-if="searchTotal" aria-label="账号搜索分页"><NButton :disabled="searching || searchPage <= 1" @click="search(searchPage - 1)">上一页账号</NButton><span>第 {{ searchPage }} 页</span><NButton :disabled="searching || searchPage * 20 >= searchTotal" @click="search(searchPage + 1)">下一页账号</NButton></nav>
    </section>
    <label v-if="auth.profile?.role === 'Parent' && children.length">选择孩子<select aria-label="选择奖励孩子" :value="student?.id ?? ''" @change="router.replace({ query: { student: ($event.target as HTMLSelectElement).value } })"><option v-for="child in children" :key="child.id" :value="child.id">{{ child.displayName }}</option></select></label>
    <p v-if="loading" role="status">正在加载奖励…</p>
    <NAlert v-else-if="error" type="error" title="奖励加载失败"><p>{{ error }}</p><NButton @click="load">重试</NButton></NAlert>
    <RewardLedger v-else-if="student && rewards" :key="student.id" :student="student" :rewards="rewards" @refresh="load" />
    <section v-else-if="ledger" aria-label="云端确认账本"><h2>云端确认账本</h2><p>{{ filterNames }}</p>
      <div v-if="ledger.rows.length" class="table-scroll" role="region" aria-label="奖励确认账本表" tabindex="0"><NTable size="small" :bordered="false" :single-line="true" class="ledger-table">
        <thead><tr><th scope="col">学生</th><th scope="col">奖励类型</th><th scope="col">奖励数额</th><th scope="col">确认家长</th><th scope="col">家长账号</th><th scope="col">确认时间</th></tr></thead>
        <tbody><tr v-for="row in ledger.rows" :key="row.id"><td><RouterLink :to="`/students/${encodeURIComponent(row.studentId)}`">{{ row.studentName }}</RouterLink></td><td>{{ row.kind === 'cash' ? '现金' : '游戏时间' }}</td><td>{{ rewardAmount(row.kind, row.amount) }}</td><td>{{ row.parentName }}</td><td>{{ row.parentUsername }}</td><td>{{ row.confirmedAt }}</td></tr></tbody>
      </NTable></div><p v-else>此筛选下暂无确认记录</p>
      <nav aria-label="奖励账本分页"><NButton :disabled="ledger.page <= 1" @click="router.replace({ query: { ...route.query, page: String(ledger.page - 1) } })">上一页</NButton><span>第 {{ ledger.page }} 页，共 {{ ledger.total }} 条</span><NButton :disabled="ledger.page * ledger.pageSize >= ledger.total" @click="router.replace({ query: { ...route.query, page: String(ledger.page + 1) } })">下一页</NButton></nav>
    </section>
    <p v-else-if="auth.profile?.role === 'Parent'">尚未添加孩子，请到账号页添加。</p>
  </section>
</template>
<style scoped>
.rewards-page { display: grid; align-content: start; gap: 20px; min-width: 0; } h1 { font-size: 24px; } h2 { margin: 0 0 12px; font-size: 20px; }
.rewards-page > section { min-width: 0; }
form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; } form .n-select { width: 120px; } form .n-input { width: 240px; max-width: 100%; }
nav { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-block: 12px; } span, p { overflow-wrap: anywhere; } select { max-width: 100%; padding: 8px; margin-inline-start: 8px; } a { color: #38694f; text-decoration: underline; }
.table-scroll { min-width: 0; overflow-x: auto; border: 1px solid #e0e7e1; border-radius: 6px; background: white; }
.table-scroll:focus-visible { outline: 2px solid #38694f; outline-offset: 2px; }
.search-results { margin-top: 16px; } .account-table { min-width: 640px; } .ledger-table { min-width: 1000px; }
.rewards-page :deep(th), .rewards-page :deep(td) { padding: 12px 16px; white-space: nowrap; }
.rewards-page :deep(th) { background: #f3f7f4; color: #53665a; }
</style>
