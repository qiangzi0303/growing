<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NSpin } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { api } from '@/service/request';
import StudentOverview from '@/features/students/components/student-overview.vue';
const auth = useAuthStore();
interface Overview { members: number; students: number; parents: number; admins: number; syncedThisWeek: number; confirmations: number; gameMinutes: number; cashCents: number }
const data = ref<Overview | null>(null); const error = ref(''); const loading = ref(false);
let generation = 0; let controller: AbortController | null = null;
const fields = [['members', '注册会员'], ['students', '学生'], ['parents', '家长'], ['admins', '管理员'], ['syncedThisWeek', '近7天同步学生'], ['confirmations', '云端奖励确认'], ['gameMinutes', '已确认游戏分钟'], ['cashCents', '已确认现金（元）']] as const;
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
</script>

<template>
  <main class="console-page">
    <header><h1>{{ auth.profile?.role === 'Parent' ? '孩子概况' : '工作台' }}</h1><p class="page-description">逆流 · {{ auth.profile?.role === 'Parent' ? '陪伴每一天的成长' : '学习档案与家庭管理' }}</p></header>
    <StudentOverview v-if="auth.profile?.role === 'Parent'" />
    <template v-else-if="auth.profile?.role === 'Admin'">
      <NSpin v-if="loading" size="small"><template #description><span role="status">正在加载全站概况…</span></template></NSpin>
      <NAlert v-else-if="error" title="概况加载失败" type="error"><p>{{ error }}</p><NButton @click="load">重试</NButton></NAlert>
      <div v-else-if="data" class="overview-grid"><NCard v-for="[key, title] in fields" :key="key" :title="title" size="small"><strong class="overview-number">{{ data[key] == null ? '暂无记录' : key === 'cashCents' ? (data[key] / 100).toFixed(2) : data[key] }}</strong></NCard></div>
      <nav class="overview-links" aria-label="管理功能"><RouterLink v-slot="{ href, navigate }" to="/students" custom><NButton tag="a" :href="href" @click="navigate">查看学生档案</NButton></RouterLink><RouterLink v-slot="{ href, navigate }" to="/members" custom><NButton tag="a" :href="href" @click="navigate">管理注册会员</NButton></RouterLink><RouterLink v-slot="{ href, navigate }" to="/rewards" custom><NButton tag="a" :href="href" @click="navigate">查看奖励账本</NButton></RouterLink></nav>
    </template>
  </main>
</template>

<style scoped>
.overview-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); }
.overview-number { font-size: 28px; font-weight: 600; color: #38694f; }
.overview-links { display: flex; flex-wrap: wrap; gap: 16px; }
</style>
