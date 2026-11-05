<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { NButton, NCard, NInput, NModal } from 'naive-ui';
import { api } from '@/service/request';
import { listMembers } from '../api';
import type { Member, MemberRow, Relation } from '../api';
import { useMemberAction } from '../use-member-action';
const props = defineProps<{ member: Member; children: Relation[] }>(); const emit = defineEmits<{ refresh: [notice?: string] }>();
const query = ref(''); const rows = ref<MemberRow[]>([]); const page = ref(1); const total = ref(0); const searching = ref(false); const searchError = ref(''); const removing = ref<Relation | null>(null);
let searchVersion = 0; let searchController: AbortController | null = null;
function clear() { query.value = ''; rows.value = []; page.value = 1; total.value = 0; searchVersion++; searchController?.abort(); searching.value = false; searchError.value = ''; removing.value = null; }
const { pending, message, run, active, auth } = useMemberAction(() => props.member, clear);
onUnmounted(clear);
watch(() => [props.member.id, props.member.role, auth.profile?.id, auth.profile?.role, auth.sessionRevision], clear, { flush: 'sync' });
async function search(target = 1) {
  if (props.member.role !== 'Parent' || auth.profile?.role !== 'Admin' || pending.value) return;
  const current = ++searchVersion; searchController?.abort(); searchController = new AbortController(); searching.value = true; rows.value = []; searchError.value = '';
  try { const result = await listMembers({ q: query.value.trim(), role: 'Student', page: target, signal: searchController.signal }); if (current === searchVersion) { rows.value = result.rows; page.value = result.page; total.value = result.total; } }
  catch (cause) { if (current === searchVersion) searchError.value = cause instanceof Error ? cause.message : '学生搜索失败'; }
  finally { if (current === searchVersion) searching.value = false; }
}
function bind(studentId: string) {
  if (props.member.role !== 'Parent') return;
  void run(async signal => { await api(`/admin/members/${encodeURIComponent(props.member.id)}/children`, { method: 'POST', body: JSON.stringify({ studentId }), signal }); if (active(signal)) emit('refresh'); });
}
function unbind() {
  const child = removing.value; if (!child || props.member.role !== 'Parent') return;
  void run(async signal => {
    try { await api(`/admin/members/${encodeURIComponent(props.member.id)}/children/${encodeURIComponent(child.id)}`, { method: 'DELETE', signal }); }
    catch (cause) { if (active(signal) && (cause as { status?: number }).status === 404) { message.value = `${cause instanceof Error ? cause.message : '关系不存在 (404)'}；已刷新资料，请重新确认。`; emit('refresh', message.value); return; } throw cause; }
    if (active(signal)) emit('refresh');
  });
}
</script>
<template><NCard v-if="member.role === 'Parent'" title="管理亲子关系" size="small"><p>解绑仅解除关系，账号、学习记录及确认账本保留。</p><div v-for="child in children" :key="child.id" class="relation-row"><span>{{ child.displayName }}</span><NButton :disabled="pending" @click="removing = child">解绑</NButton></div><form @submit.prevent="search(1)"><NInput v-model:value="query" :disabled="pending" :input-props="{ 'aria-label': '搜索学生账号或姓名', maxlength: 40 }" placeholder="搜索学生账号或姓名" /><NButton attr-type="submit" :disabled="pending || searching">搜索学生</NButton></form><p v-if="searching" role="status">正在搜索…</p><p v-if="searchError" role="alert">{{ searchError }}</p><div v-for="row in rows" :key="row.id" class="relation-row"><span>{{ row.displayName }}（{{ row.username }}）</span><NButton :disabled="pending || children.some(child => child.id === row.id)" @click="bind(row.id)">绑定</NButton></div><nav v-if="total" aria-label="学生搜索分页"><NButton :disabled="pending || searching || page <= 1" @click="search(page - 1)">上一页</NButton><span>第 {{ page }} 页，共 {{ total }} 位</span><NButton :disabled="pending || searching || page * 20 >= total" @click="search(page + 1)">下一页</NButton></nav><p role="status">{{ message }}</p><NModal :show="Boolean(removing)" preset="dialog" title="确认解除亲子关系" :content="`解除家长 ${member.displayName} 与学生 ${removing?.displayName ?? ''} 的绑定？学习历史和账本保留。`" positive-text="确认解绑" negative-text="取消" :positive-button-props="{ disabled: pending }" :mask-closable="!pending" :closable="!pending" @update:show="value => { if (!value) removing = null; }" @positive-click="unbind" /></NCard></template>
<style scoped>.relation-row,nav { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-block: 12px; }span { overflow-wrap: anywhere; min-width: 0; }</style>
