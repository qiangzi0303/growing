<script setup lang="ts">
import { onUnmounted, ref, shallowRef, watch } from 'vue';
import { NAlert, NButton, NSpin } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import type { ConsoleRole, GrowthReport, ReportDays, StudentIdentity, StudyReport } from '@/features/students/api';
import { getGrowth, getUnitReports } from '../api';
import type { UnitReports as UnitReportData } from '../api';
import StudySummary from './study-summary.vue';
import GrowthChart from './growth-chart.vue';
import UnitReports from './unit-reports.vue';
const props = defineProps<{ student: StudentIdentity; report: StudyReport; growth: GrowthReport }>();
const auth = useAuthStore();
const units = shallowRef<UnitReportData | null>(null); const growth = shallowRef<GrowthReport>(props.growth);
const days = ref<ReportDays>(7); const unitError = ref(''); const growthError = ref('');
const unitLoading = ref(false); const growthLoading = ref(false); const authorized = ref(true);
let sequence = 0; let growthSequence = 0;
let unitController: AbortController | null = null; let growthController: AbortController | null = null;
const emptyGrowth: GrowthReport = { timezone: 'Asia/Shanghai', points: [], note: '' };
function clear() {
  sequence++; growthSequence++; unitController?.abort(); growthController?.abort();
  units.value = null; growth.value = emptyGrowth; unitError.value = ''; growthError.value = '';
  unitLoading.value = false; growthLoading.value = false;
}
async function loadUnits() {
  const current = ++sequence; unitController?.abort(); unitController = new AbortController();
  units.value = null; unitError.value = ''; unitLoading.value = true;
  try {
    const result = await getUnitReports(auth.profile!.role as ConsoleRole, props.student.id, unitController.signal);
    if (current === sequence) units.value = result;
  } catch (cause) { if (current === sequence) unitError.value = cause instanceof Error ? cause.message : '单元报告读取失败'; }
  finally { if (current === sequence) unitLoading.value = false; }
}
async function changeDays(value: ReportDays) {
  days.value = value; const current = ++growthSequence; growthController?.abort(); growthController = new AbortController();
  growth.value = emptyGrowth; growthError.value = ''; growthLoading.value = true;
  try {
    const result = await getGrowth(auth.profile!.role as ConsoleRole, props.student.id, value, growthController.signal);
    if (current === growthSequence) growth.value = result;
  } catch (cause) { if (current === growthSequence) growthError.value = cause instanceof Error ? cause.message : '成长曲线读取失败'; }
  finally { if (current === growthSequence) growthLoading.value = false; }
}
watch(() => props.student.id, () => {
  clear(); authorized.value = Boolean(auth.profile && ['Admin', 'Parent'].includes(auth.profile.role));
  if (!authorized.value) return;
  days.value = 7; growth.value = props.growth; void loadUnits();
}, { immediate: true, flush: 'sync' });
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], () => { clear(); authorized.value = false; }, { flush: 'sync' });
onUnmounted(clear);
</script>

<template>
  <section v-if="authorized" class="report-panel">
    <StudySummary :report="report" />
    <GrowthChart :report="growth" :days="days" :loading="growthLoading" :error="growthError" @update:days="changeDays" @retry="changeDays(days)" />
    <div><NButton data-testid="refresh-units" :disabled="unitLoading" @click="loadUnits">刷新单元报告</NButton></div>
    <NSpin v-if="unitLoading" size="small" role="status"><span>正在读取单元学习记录…</span></NSpin>
    <NAlert v-else-if="unitError" title="单元报告加载失败" type="error"><p>{{ unitError }}</p><NButton data-testid="retry-units" @click="loadUnits">重试读取报告</NButton></NAlert>
    <UnitReports v-else-if="units" :report="units" />
  </section>
</template>

<style scoped>.report-panel { display: grid; gap: 24px; min-width: 0; }</style>
