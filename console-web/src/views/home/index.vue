<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NSpin } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { api } from '@/service/request';
import SvgIcon from '@/components/custom/svg-icon.vue';
import StudentOverview from '@/features/students/components/student-overview.vue';
import RoleChart from './modules/role-chart.vue';
import TrendChart from './modules/trend-chart.vue';

const auth = useAuthStore();
interface Overview { members: number; students: number; parents: number; admins: number; syncedThisWeek: number; confirmations: number; gameMinutes: number; cashCents: number }
const data = ref<Overview | null>(null); const error = ref(''); const loading = ref(false);
let generation = 0; let controller: AbortController | null = null;
async function load() {
  const current = ++generation; controller?.abort(); controller = new AbortController();
  data.value = null; error.value = ''; loading.value = false;
  if (auth.profile?.role !== 'Admin') return;
  loading.value = true;
  try { const result = await api<Overview>('/admin/overview', { signal: controller.signal }); if (current === generation) data.value = result; }
  catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : '无法加载全站概况。'; }
  finally { if (current === generation) loading.value = false; }
}
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], load, { immediate: true, flush: 'sync' });
onUnmounted(() => { generation++; controller?.abort(); });

type Key = keyof Overview;
function show(key: Key) {
  const value = data.value?.[key];
  if (value == null) return '暂无记录';
  return key === 'cashCents' ? (value / 100).toFixed(2) : String(value);
}
function share(part: number | undefined, whole: number | undefined, label: string) {
  if (part == null || !whole) return '';
  return `${label} ${Math.round((part / whole) * 100)}%`;
}
// Activity first: it is the number that changes day to day.
const metrics = computed(() => {
  const d = data.value;
  return [
    { key: 'syncedThisWeek', title: '近 7 天同步学生', unit: '人', icon: 'mdi-sync', tone: 'tone-primary', note: share(d?.syncedThisWeek, d?.students, '占全部学生') },
    { key: 'students', title: '学生', unit: '人', icon: 'mdi-school-outline', tone: 'tone-green', note: share(d?.students, d?.members, '占会员') },
    { key: 'parents', title: '家长', unit: '人', icon: 'mdi-human-male-female-child', tone: 'tone-amber', note: share(d?.parents, d?.members, '占会员') },
    { key: 'members', title: '注册会员', unit: '人', icon: 'mdi-account-multiple-outline', tone: 'tone-neutral', note: d?.admins == null ? '' : `含管理员 ${d.admins} 人` }
  ] as const;
});
const rewards = [
  { key: 'confirmations', title: '云端奖励确认', unit: '次', icon: 'mdi-check-decagram-outline' },
  { key: 'gameMinutes', title: '已确认游戏分钟', unit: '分钟', icon: 'mdi-gamepad-variant-outline' },
  { key: 'cashCents', title: '已确认现金', unit: '元', icon: 'mdi-cash' }
] as const;
const shortcuts = [
  { to: '/students', title: '查看学生档案', desc: '搜索学生，查看云端学习记录', icon: 'mdi-account-school-outline' },
  { to: '/members', title: '管理注册会员', desc: '身份、家庭绑定与密码', icon: 'mdi-account-group-outline' },
  { to: '/rewards', title: '查看奖励账本', desc: '奖励申请与确认明细', icon: 'mdi-gift-outline' },
  { to: '/ai-usage', title: 'AI 用量统计', desc: '模型调用次数与消耗', icon: 'mdi-chart-line' }
] as const;
const roles = computed(() => {
  const d = data.value;
  const students = d?.students ?? 0; const parents = d?.parents ?? 0; const admins = d?.admins ?? 0;
  return { students, parents, admins, others: Math.max(0, (d?.members ?? 0) - students - parents - admins) };
});
</script>

<template>
  <main class="console-page">
    <header class="page-head"><h1>{{ auth.profile?.role === 'Parent' ? '孩子概况' : '工作台' }}</h1><p class="page-description">逆流 · {{ auth.profile?.role === 'Parent' ? '陪伴每一天的成长' : '学习档案与家庭管理' }}</p></header>
    <StudentOverview v-if="auth.profile?.role === 'Parent'" />
    <template v-else-if="auth.profile?.role === 'Admin'">
      <NCard v-if="loading" :bordered="false" class="card-wrapper"><NSpin size="small"><template #description><span role="status">正在加载全站概况…</span></template></NSpin></NCard>
      <NAlert v-else-if="error" title="概况加载失败" type="error"><p>{{ error }}</p><NButton @click="load">重试</NButton></NAlert>
      <template v-else-if="data">
        <section class="metric-grid" aria-label="全站概况">
          <NCard v-for="item in metrics" :key="item.key" :bordered="false" size="small" class="card-wrapper metric-card" :class="item.tone">
            <div class="metric-head"><h2>{{ item.title }}</h2><span class="metric-icon"><SvgIcon :local-icon="item.icon" /></span></div>
            <p class="metric-value"><strong>{{ show(item.key) }}</strong><span v-if="data[item.key] != null">{{ item.unit }}</span></p>
            <p class="metric-note">{{ item.note }}</p>
          </NCard>
        </section>
        <section class="panel-grid">
          <TrendChart class="trend-span" />
          <NCard title="会员构成" :bordered="false" size="small" class="card-wrapper">
            <RoleChart v-bind="roles" />
            <p class="panel-note">管理员 {{ show('admins') }} 人 · 共 {{ show('members') }} 位会员</p>
          </NCard>
        </section>
        <section class="detail-grid">
          <NCard title="奖励汇总" :bordered="false" size="small" class="card-wrapper">
            <ul class="reward-list">
              <li v-for="item in rewards" :key="item.key">
                <span class="reward-icon"><SvgIcon :local-icon="item.icon" /></span>
                <span class="reward-title">{{ item.title }}</span>
                <span class="reward-value"><strong>{{ show(item.key) }}</strong><small v-if="data[item.key] != null">{{ item.unit }}</small></span>
              </li>
            </ul>
          </NCard>
          <NCard title="快捷入口" :bordered="false" size="small" class="card-wrapper">
            <nav class="shortcut-list" aria-label="管理功能">
              <RouterLink v-for="item in shortcuts" :key="item.to" :to="item.to" class="shortcut">
                <span class="shortcut-icon"><SvgIcon :local-icon="item.icon" /></span>
                <span class="shortcut-text"><strong>{{ item.title }}</strong><small>{{ item.desc }}</small></span>
              </RouterLink>
            </nav>
          </NCard>
        </section>
      </template>
    </template>
  </main>
</template>

<style scoped>
.page-head h1 { margin-bottom: 4px; }
.metric-grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.metric-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.metric-head h2 { font-size: 14px; font-weight: 500; color: #5b6b62; }
.metric-icon { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; font-size: 20px; }
.metric-value { margin-top: 10px; display: flex; align-items: baseline; gap: 6px; }
.metric-value strong { font-size: 30px; font-weight: 600; line-height: 1.1; color: #1f2d26; }
.metric-value span { font-size: 13px; color: #617268; }
.metric-note { min-height: 18px; margin-top: 6px; font-size: 12px; color: #7a877f; }
.tone-green .metric-icon { color: rgb(var(--primary-color)); background: rgb(var(--primary-color) / 0.1); }
.tone-amber .metric-icon { color: #a8751c; background: rgb(217 164 65 / 0.16); }
.tone-neutral .metric-icon { color: #5f6f66; background: rgb(95 111 102 / 0.1); }
.metric-card.tone-primary { background-color: rgb(var(--primary-color)); }
.tone-primary .metric-head h2, .tone-primary .metric-value strong, .tone-primary .metric-value span { color: #fff; }
.tone-primary .metric-note { color: rgb(255 255 255 / 0.78); }
.tone-primary .metric-icon { color: #fff; background: rgb(255 255 255 / 0.16); }
.panel-grid { display: grid; gap: 16px; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: stretch; }
.panel-grid > .trend-span { grid-column: span 2; }
.detail-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: stretch; }
.panel-note { margin-top: 4px; text-align: center; font-size: 13px; color: #617268; }
.reward-list { display: flex; flex-direction: column; gap: 10px; }
.reward-list li { display: grid; grid-template-columns: 40px 1fr auto; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; background: rgb(var(--primary-color) / 0.05); }
.reward-icon, .shortcut-icon { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; font-size: 20px; color: rgb(var(--primary-color)); background: rgb(var(--primary-color) / 0.1); }
.reward-title { font-size: 14px; color: #4a5a51; }
.reward-value strong { font-size: 22px; font-weight: 600; }
.reward-value small { margin-left: 4px; font-size: 12px; color: #617268; }
.shortcut-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.shortcut { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; color: inherit; text-decoration: none; transition: background-color 0.2s; }
.shortcut:hover { background: rgb(var(--primary-color) / 0.06); }
.shortcut:focus-visible { outline: 2px solid rgb(var(--primary-color)); outline-offset: 2px; }
.shortcut-text { display: flex; flex-direction: column; min-width: 0; }
.shortcut-text strong { font-size: 14px; font-weight: 500; }
.shortcut-text small { font-size: 12px; color: #7a877f; }
html.dark .metric-card:not(.tone-primary) .metric-head h2, html.dark .reward-title, html.dark .panel-note { color: #b5c0b9; }
html.dark .metric-card:not(.tone-primary) .metric-value strong { color: #e6ece8; }
html.dark .reward-list li { background: rgb(255 255 255 / 0.04); }
html.dark .shortcut:hover { background: rgb(255 255 255 / 0.06); }
@media (max-width: 1100px) { .panel-grid { grid-template-columns: minmax(0, 1fr); } .panel-grid > .trend-span { grid-column: auto; } }
@media (max-width: 1000px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) { .detail-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) { .metric-grid { gap: 12px; } .metric-head h2 { font-size: 13px; white-space: nowrap; } .metric-icon { width: 32px; height: 32px; font-size: 18px; } .metric-value strong { font-size: 26px; } .shortcut-list { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 360px) { .metric-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
