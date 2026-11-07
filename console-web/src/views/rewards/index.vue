<script setup lang="ts">
import { h, onUnmounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { NAlert, NButton, NDataTable, NEmpty, NForm, NFormItem, NInput, NPagination, NSelect, NSpin } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
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
const accountColumns: DataTableColumns<MemberRow> = [
  { title: '姓名', key: 'displayName', width: 160 },
  { title: '账号', key: 'username', width: 180 },
  { title: '身份', key: 'role', width: 120, render: row => row.role === 'Student' ? '学生' : '家长' },
  { title: '操作', key: 'actions', width: 180, fixed: 'right', render: row => h(NButton, { size: 'small', onClick: () => selectMember(row) }, { default: () => '按此账号筛选' }) }
];
const ledgerColumns: DataTableColumns<LedgerRow> = [
  { title: '学生', key: 'studentName', width: 160, render: row => h(RouterLink, { to: `/students/${encodeURIComponent(row.studentId)}`, custom: true }, { default: ({ href, navigate }: { href: string; navigate: (event: MouseEvent) => void }) => h(NButton, { tag: 'a', href, text: true, type: 'primary', onClick: navigate }, { default: () => row.studentName }) }) },
  { title: '奖励类型', key: 'kind', width: 140, render: row => row.kind === 'cash' ? '现金' : '游戏时间' },
  { title: '奖励数额', key: 'amount', width: 150, render: row => rewardAmount(row.kind, row.amount) },
  { title: '确认家长', key: 'parentName', width: 150 },
  { title: '家长账号', key: 'parentUsername', width: 180 },
  { title: '确认时间', key: 'confirmedAt', width: 220 }
];
watch(() => [route.query.student, route.query.parent, route.query.page, auth.profile?.id, auth.profile?.role, auth.sessionRevision], load, { immediate: true, flush: 'sync' });
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision, searchRole.value], reset, { flush: 'sync' });
onUnmounted(() => { version++; controller?.abort(); reset(); });
</script>
<template>
  <section class="rewards-page">
    <header><h1>奖励记录</h1><p>设备累计与云端确认分开查看；确认代表已实际兑现。</p></header>
    <section v-if="auth.profile?.role === 'Admin'" aria-label="筛选确认账本"><h2>筛选确认账本</h2>
      <NForm class="search-form" :show-feedback="false" label-placement="top" @submit.prevent="search(1)"><NFormItem label="账号类型"><NSelect v-model:value="searchRole" aria-label="搜索账号类型" :options="[{ label: '学生', value: 'Student' }, { label: '家长', value: 'Parent' }]" /></NFormItem><NFormItem label="账号或姓名"><NInput v-model:value="searchText" :input-props="{ 'aria-label': '搜索学生或家长', maxlength: 40 }" placeholder="账号或姓名" /></NFormItem><NButton attr-type="submit" :disabled="searching">搜索账号</NButton><NButton @click="router.replace({ query: {} })">清除筛选</NButton></NForm>
      <NSpin v-if="searching" size="small" role="status"><span>正在搜索…</span></NSpin><NAlert v-if="searchError" type="error">{{ searchError }}</NAlert>
      <NDataTable v-if="found.length" aria-label="奖励筛选账号表" size="small" :columns="accountColumns" :data="found" :row-key="row => row.id" :scroll-x="640" />
      <NPagination v-if="searchTotal" aria-label="账号搜索分页" :disabled="searching" :page="searchPage" :page-size="20" :item-count="searchTotal" :page-slot="5" @update:page="search" />
    </section>
    <NForm v-if="auth.profile?.role === 'Parent' && children.length" :show-feedback="false"><NFormItem label="选择孩子"><NSelect aria-label="选择奖励孩子" :value="student?.id ?? ''" :options="children.map(child => ({value: child.id, label: child.displayName}))" @update:value="router.replace({ query: { student: $event } })" /></NFormItem></NForm>
    <NSpin v-if="loading" size="small" role="status"><span>正在加载奖励…</span></NSpin>
    <NAlert v-else-if="error" type="error" title="奖励加载失败"><p>{{ error }}</p><NButton @click="load">重试</NButton></NAlert>
    <RewardLedger v-else-if="student && rewards" :key="student.id" :student="student" :rewards="rewards" @refresh="load" />
    <section v-else-if="ledger" aria-label="云端确认账本"><h2>云端确认账本</h2><p>{{ filterNames }}</p>
      <NDataTable v-if="ledger.rows.length" aria-label="奖励确认账本表" size="small" :columns="ledgerColumns" :data="ledger.rows" :row-key="row => row.id" :scroll-x="1000" /><NEmpty v-else description="此筛选下暂无确认记录" />
      <NPagination aria-label="奖励账本分页" :page="ledger.page" :page-size="ledger.pageSize" :item-count="ledger.total" :page-slot="5" @update:page="router.replace({ query: { ...route.query, page: String($event) } })" />
    </section>
    <NEmpty v-else-if="auth.profile?.role === 'Parent'" description="尚未添加孩子，请到账号页添加。" />
  </section>
</template>
<style scoped>
.rewards-page { display: grid; align-content: start; gap: 20px; min-width: 0; }
h1 { font-size: 24px; } h2 { margin: 0 0 12px; font-size: 20px; }
.rewards-page > section { min-width: 0; }
.search-form { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; margin-bottom: 16px; }
.search-form :deep(.n-form-item) { width: 240px; max-width: 100%; }
.n-pagination { margin-top: 12px; }
p { overflow-wrap: anywhere; }
</style>
