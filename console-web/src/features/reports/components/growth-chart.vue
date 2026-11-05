<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NCard } from 'naive-ui';
import type { GrowthReport, ReportDays } from '@/features/students/api';
import { useEcharts } from '@/hooks/common/echarts';
import type { ECOption } from '@/hooks/common/echarts';
import { growthValues, subjects } from '../api';
import type { GrowthMetric } from '../api';
const props = defineProps<{ report: GrowthReport; days: ReportDays; loading?: boolean; error?: string }>();
defineEmits<{ 'update:days': [days: ReportDays]; retry: [] }>();
const subject = ref('数学'); const metric = ref<GrowthMetric>('minutes');
const metrics = { minutes: '学习分钟', read: '已读', mastered: '课程达标', practice: '练习完成' };
const values = computed(() => growthValues(props.report, subject.value, metric.value));
const options = (): ECOption => ({
  color: ['#38694f'], tooltip: { trigger: 'axis' }, grid: { left: 44, right: 18, bottom: 44, top: 20 },
  xAxis: { type: 'category', data: props.report.points.map(point => point.day) },
  yAxis: { type: 'value', min: 0, minInterval: 1 },
  series: [{ type: 'line', data: values.value, connectNulls: false, name: metrics[metric.value] }]
});
const { domRef, updateOptions } = useEcharts(options);
watch([() => props.report, subject, metric], () => { void updateOptions(() => options()); });
</script>

<template>
  <NCard title="成长曲线" size="small">
    <div class="filters">
      <label>天数<select aria-label="曲线天数" :value="days" @change="$emit('update:days', Number(($event.target as HTMLSelectElement).value) as ReportDays)"><option v-for="n in [7, 30, 90]" :key="n" :value="n">{{ n }} 天</option></select></label>
      <label>学科<select v-model="subject" aria-label="曲线学科"><option v-for="name in subjects" :key="name">{{ name }}</option></select></label>
      <label>指标<select v-model="metric" aria-label="曲线指标"><option v-for="(label, key) in metrics" :key="key" :value="key">{{ label }}</option></select></label>
    </div>
    <p v-if="loading" role="status">正在加载成长曲线…</p>
    <p v-else-if="error" role="alert">{{ error }} <button @click="$emit('retry')">重试曲线</button></p>
    <p v-else-if="!report.points.length">暂无成长快照</p>
    <div ref="domRef" class="chart" role="img" :aria-label="`${subject} ${metrics[metric]}成长曲线，北京时间`" />
    <details v-if="!loading && !error"><summary>查看每日数值（北京时间）</summary><ul data-testid="growth-values"><li v-for="(point, index) in report.points" :key="point.day">{{ point.day }}：{{ values[index] === null ? '暂无快照' : `${values[index]}${metric === 'minutes' ? ' 分钟' : ''}` }}</li></ul></details>
    <p>{{ report.note }}</p>
  </NCard>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 12px; } label { display: grid; gap: 4px; } select { min-height: 38px; padding: 4px 8px; border: 1px solid #b9c8be; border-radius: 6px; background: white; color: #213a2c; }
.chart { width: 100%; height: 260px; } p { color: #617268; } ul { max-height: 180px; overflow: auto; }
</style>
