<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NEmpty, NSpin } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { listStudents } from '../api';
import type { StudentIdentity } from '../api';
import { createStudentSelection } from '../model';
import StudentPicker from './student-picker.vue';
import ReportPanel from '@/features/reports/components/report-panel.vue';
import HistoryPanel from '@/features/history/components/history-panel.vue';
import RewardLedger from '@/features/rewards/components/reward-ledger.vue';
import { legacy } from '@/features/legacy/links';

const props = defineProps<{ studentId?: string; showReports?: boolean }>();
const auth = useAuthStore();
const selection = createStudentSelection(() => auth.profile, () => auth.sessionRevision);
const { data, loading, error } = selection;
const children = ref<StudentIdentity[]>([]);
const listLoading = ref(false);
const listError = ref('');
const forbidden = ref(false);
let generation = 0;
let controller: AbortController | null = null;
const pendingRewards = computed(() => data.value?.rewards.entries.filter(entry => !entry.confirmation).length ?? 0);
const message = computed(() => error.value instanceof Error ? error.value.message : '无法加载孩子概况，请重试。');
async function initialize() {
  const current = ++generation;
  controller?.abort(); controller = new AbortController(); selection.clear();
  children.value = []; listError.value = ''; forbidden.value = false; listLoading.value = false;
  if (!auth.profile || !['Admin', 'Parent'].includes(auth.profile.role)) return;
  if (auth.profile.role === 'Admin') {
    if (props.studentId) await selection.select({ id: props.studentId, displayName: '' });
    return;
  }
  listLoading.value = true;
  try {
    const result = await listStudents('Parent', { signal: controller.signal });
    if (current !== generation) return;
    children.value = result.rows;
    const target = props.studentId ? result.rows.find(child => child.id === props.studentId) : result.rows[0];
    if (props.studentId && !target) forbidden.value = true;
    if (target) void selection.select(target);
  } catch (cause) {
    if (current === generation) listError.value = cause instanceof Error ? cause.message : '无法加载孩子列表。';
  } finally { if (current === generation) listLoading.value = false; }
}
function choose(id: string) {
  const child = children.value.find(value => value.id === id);
  if (child) void selection.select(child);
}
watch(() => [props.studentId, auth.profile?.id, auth.profile?.role, auth.sessionRevision], initialize, { immediate: true, flush: 'sync' });
onUnmounted(() => { generation++; controller?.abort(); selection.dispose(); });
</script>

<template>
  <section class="student-overview">
    <StudentPicker v-if="children.length && (!studentId || showReports) && !forbidden" :students="children" :model-value="selection.student.value?.id ?? ''" @update:model-value="choose" />
    <NSpin v-if="listLoading || loading" size="small"><template #description><span role="status">正在加载孩子概况…</span></template></NSpin>
    <NAlert v-else-if="listError" type="error" title="孩子列表加载失败"><p>{{ listError }}</p><NButton @click="initialize">重试</NButton></NAlert>
    <NAlert v-else-if="forbidden" type="warning" title="无法查看">此孩子未绑定到当前账号，请返回我的孩子核对。</NAlert>
    <NAlert v-else-if="error" type="error" title="概况加载失败"><p>{{ message }}</p><NButton @click="selection.student.value && selection.select(selection.student.value)">重试</NButton></NAlert>
    <NEmpty v-else-if="!data && auth.profile?.role === 'Parent'" description="尚未添加孩子"><template #extra><RouterLink v-slot="{ href, navigate }" to="/account" custom><NButton tag="a" :href="href" @click="navigate">添加孩子</NButton></RouterLink></template></NEmpty>
    <template v-else-if="data">
      <header><h2>{{ data.student.displayName }}的学习概况</h2><p class="muted">孩子的学习与奖励记录，以云端已同步数据为准。</p></header>
      <nav class="overview-links" aria-label="题库与试卷"><NButton tag="a" :href="legacy.link('question-bank', `/console/students/${data.student.id}`, data.student.id)">拍照题库</NButton><NButton tag="a" :href="legacy.link('my-papers', `/console/students/${data.student.id}`, data.student.id)">我的试卷</NButton></nav>
      <NCard v-if="auth.profile?.role === 'Parent'" title="待确认奖励" size="small"><p><strong>{{ pendingRewards }}</strong> 条待确认记录</p><RouterLink v-slot="{ href, navigate }" :to="{ path: '/rewards', query: { student: data.student.id } }" custom><NButton tag="a" :href="href" @click="navigate">查看奖励记录</NButton></RouterLink></NCard>
      <ReportPanel v-if="studentId || showReports" :key="data.student.id" :student="data.student" :report="data.report" :growth="data.growth" />
      <HistoryPanel v-if="studentId || showReports" :key="`history-${data.student.id}`" :student="data.student" />
      <RewardLedger v-if="studentId" :student="data.student" :rewards="data.rewards" @refresh="selection.select(data.student)" />
      <div v-if="!studentId && !showReports" class="subject-grid">
        <NCard v-for="subject in data.report.subjects" :key="subject.subject" :title="subject.subject" size="small">
          <dl><div><dt>今日学习</dt><dd>{{ subject.todayMinutes == null ? '暂无记录' : `${subject.todayMinutes} 分钟` }}</dd></div><div><dt>累计学习</dt><dd>{{ subject.totalMinutes == null ? '暂无记录' : `${subject.totalMinutes} 分钟` }}</dd></div><div><dt>课程达标</dt><dd>{{ subject.mastered ?? '暂无记录' }}</dd></div><div><dt>练习完成</dt><dd>{{ subject.practice ?? '暂无记录' }}</dd></div></dl>
        </NCard>
      </div>
      <NEmpty v-if="!data.report.subjects.length" description="暂无学习记录" />
      <nav class="overview-links" aria-label="孩子功能"><RouterLink v-slot="{ href, navigate }" :to="{ path: '/reports', query: { student: data.student.id } }" custom><NButton tag="a" :href="href" @click="navigate">学习报告</NButton></RouterLink><RouterLink v-if="!studentId" v-slot="{ href, navigate }" :to="`/students/${encodeURIComponent(data.student.id)}`" custom><NButton tag="a" :href="href" @click="navigate">孩子详情</NButton></RouterLink><RouterLink v-slot="{ href, navigate }" to="/account" custom><NButton tag="a" :href="href" @click="navigate">账号与设置</NButton></RouterLink></nav>
      <p v-for="warning in data.report.warnings" :key="warning" class="muted">{{ warning }}</p>
    </template>
  </section>
</template>

<style scoped>
.student-overview { display: grid; gap: 20px; min-width: 0; }
h2 { margin: 0 0 6px; font-size: 20px; font-weight: 600; overflow-wrap: anywhere; }
.muted { color: #617268; }
.subject-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px; }
dl { display: grid; gap: 12px; } dl > div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; } dt { color: #617268; } dd { margin: 0; font-weight: 600; }
.overview-links { display: flex; gap: 16px; flex-wrap: wrap; }
</style>
