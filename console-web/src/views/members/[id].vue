<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { NAlert, NButton, NCard, NSpin, NEmpty } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { getMember } from '@/features/members/api';
import type { MemberDetail } from '@/features/members/api';
import StudentOverview from '@/features/students/components/student-overview.vue';
import PasswordForm from '@/features/members/components/password-form.vue';
import RoleForm from '@/features/members/components/role-form.vue';
import FamilyEditor from '@/features/members/components/family-editor.vue';
const route = useRoute(); const auth = useAuthStore(); const data = ref<MemberDetail | null>(null); const error = ref(''); const loading = ref(false);
const actionNotice = ref('');
const relations = computed(() => data.value?.member.role === 'Student' ? data.value.parents : data.value?.children);
let generation = 0; let controller: AbortController | null = null;
async function load() {
  const current = ++generation; controller?.abort(); controller = new AbortController(); data.value = null; error.value = ''; loading.value = false;
  if (!route.params.id || !/^\/members\/[^/]+\/?$/.test(route.path)) return;
  if (auth.profile?.role !== 'Admin') { error.value = '无权访问会员管理'; return; }
  loading.value = true;
  try { const result = await getMember(String(route.params.id), controller.signal); if (current === generation) data.value = result; }
  catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : '会员详情加载失败'; }
  finally { if (current === generation) loading.value = false; }
}
function refreshAfterAction(notice = '') { actionNotice.value = notice; void load(); }
watch(() => [route.path, route.params.id, auth.profile?.id, auth.profile?.role, auth.sessionRevision], () => { actionNotice.value = ''; void load(); }, { immediate: true, flush: 'sync' });
onUnmounted(() => { generation++; controller?.abort(); });
</script>
<template>
  <main class="console-page"><RouterLink v-slot="{ href, navigate }" custom :to="{ path: '/members', query: route.query }"><NButton tag="a" text type="primary" :href="href" @click="navigate" data-testid="back">返回会员列表</NButton></RouterLink><h1>会员详情</h1>
    <NAlert v-if="actionNotice" type="info" role="status">{{ actionNotice }}</NAlert><NSpin v-if="loading" size="small"><span role="status">正在加载会员…</span></NSpin><NAlert v-else-if="error" type="error" title="加载失败"><p>{{ error }}</p><NButton data-testid="retry" @click="load">重试</NButton></NAlert>
    <template v-else-if="data"><NCard size="small"><h2>{{ data.member.displayName }}</h2><p>账号：{{ data.member.username }} · {{ data.member.role }}</p><p>注册时间：{{ data.member.createdAt }}</p><RouterLink v-slot="{ href, navigate }" custom :to="{ path: '/rewards', query: data.member.role === 'Student' ? { student: data.member.id } : { parent: data.member.id } }"><NButton tag="a" text type="primary" :href="href" @click="navigate" data-testid="ledger">查看该会员确认账本</NButton></RouterLink></NCard>
      <NCard :title="data.member.role === 'Student' ? '关联家长' : '绑定学生'" size="small"><NEmpty v-if="!relations?.length" description="暂无关联" /><div v-for="relation in relations" :key="relation.id"><RouterLink v-slot="{ href, navigate }" custom :to="{ path: `/members/${encodeURIComponent(relation.id)}`, query: route.query }"><NButton tag="a" text type="primary" :href="href" @click="navigate" data-testid="relation">{{ relation.displayName }}</NButton></RouterLink><p>绑定时间：{{ relation.createdAt }}</p></div></NCard>
      <PasswordForm :key="`password-${data.member.id}`" :member="data.member" />
      <RoleForm :key="`role-${data.member.id}`" :member="data.member" @refresh="refreshAfterAction" />
      <FamilyEditor v-if="data.member.role === 'Parent'" :key="`family-${data.member.id}`" :member="data.member" :children="data.children ?? []" @refresh="refreshAfterAction" />
      <StudentOverview v-if="data.member.role === 'Student'" :key="data.member.id" :student-id="data.member.id" />
      <NCard v-else title="最近确认记录" size="small"><p>共 {{ data.confirmations?.total ?? 0 }} 条 · 第 {{ data.confirmations?.page ?? 1 }} 页</p><NEmpty v-if="!data.confirmations?.rows.length" description="暂无确认记录" /><div v-for="row in data.confirmations?.rows" :key="row.id"><RouterLink v-slot="{ href, navigate }" custom :to="{ path: `/members/${encodeURIComponent(row.studentId)}`, query: route.query }"><NButton tag="a" text type="primary" :href="href" @click="navigate">{{ row.studentName }}</NButton></RouterLink><p>{{ row.kind === 'cash' ? `${(row.amount / 100).toFixed(2)} 元` : `${row.amount} 分钟` }} · 确认时间 {{ row.confirmedAt }}</p></div><p v-if="data.confirmations && data.confirmations.total > data.confirmations.rows.length">此处展示最近 {{ data.confirmations.pageSize }} 条，查看该会员确认账本可浏览全部记录。</p></NCard>
    </template>
  </main>
</template>
<style scoped>h2 { font-size: 20px; }h2,p { overflow-wrap: anywhere; }</style>
