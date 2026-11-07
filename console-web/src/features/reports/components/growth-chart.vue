<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NCollapse, NCollapseItem, NEmpty, NForm, NFormItem, NSelect, NSpin } from 'naive-ui';
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
    <NForm class="filters" :show-feedback="false" label-placement="top">
      <NFormItem label="天数"><NSelect aria-label="曲线天数" :value="days" :options="[7, 30, 90].map(value => ({ value, label: `${value} 天` }))" @update:value="$emit('update:days', $event as ReportDays)" /></NFormItem>
      <NFormItem label="学科"><NSelect v-model:value="subject" aria-label="曲线学科" :options="subjects.map(value => ({ value, label: value }))" /></NFormItem>
      <NFormItem label="指标"><NSelect v-model:value="metric" aria-label="曲线指标" :options="Object.entries(metrics).map(([value, label]) => ({ value, label }))" /></NFormItem>
    </NForm>
    <NSpin v-if="loading" size="small" role="status"><span>正在加载成长曲线…</span></NSpin>
    <NAlert v-else-if="error" type="error">{{ error }} <NButton @click="$emit('retry')">重试曲线</NButton></NAlert>
    <NEmpty v-else-if="!report.points.length" description="暂无成长快照" />
    <div ref="domRef" class="chart" role="img" :aria-label="`${subject} ${metrics[metric]}成长曲线，北京时间`" />
    <NCollapse v-if="!loading && !error"><NCollapseItem name="values" title="查看每日数值（北京时间）"><ul data-testid="growth-values"><li v-for="(point, index) in report.points" :key="point.day">{{ point.day }}：{{ values[index] === null ? '暂无快照' : `${values[index]}${metric === 'minutes' ? ' 分钟' : ''}` }}</li></ul></NCollapseItem></NCollapse>
    <p>{{ report.note }}</p>
  </NCard>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; } .filters :deep(.n-form-item) { width: 160px; max-width: 100%; }
.chart { width: 100%; height: 260px; } p { color: #617268; } ul { max-height: 180px; overflow: auto; }
</style>
