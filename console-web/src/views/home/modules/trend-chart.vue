<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NRadioButton, NRadioGroup } from 'naive-ui';
import { api } from '@/service/request';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({ name: 'TrendChart' });

interface TrendPoint { day: string; syncedStudents: number; newMembers: number; confirmations: number }
interface Trend { days: number; points: TrendPoint[] }
type SeriesKey = Exclude<keyof TrendPoint, 'day'>;

const ranges = [7, 30, 90];
const legend: { key: SeriesKey; name: string; unit: string; color: string }[] = [
  { key: 'syncedStudents', name: '同步学生', unit: '人次', color: '#38694f' },
  { key: 'newMembers', name: '新注册会员', unit: '人', color: '#d9a441' },
  { key: 'confirmations', name: '奖励确认', unit: '次', color: '#8a9890' }
];

// Honour reduced motion; e2e screenshots use it so the line is fully drawn when captured.
const reducedMotion = Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
// Dots only on non-zero days, so a single sparse day stays visible against the zero baseline.
const dot = (value: number) => (Number(value) > 0 ? 6 : 0);

const days = ref(7);
const points = ref<TrendPoint[]>([]);
const loading = ref(false);
const error = ref('');
let generation = 0;
let controller: AbortController | null = null;

const totals = computed(() =>
  legend.map(item => ({ ...item, total: points.value.reduce((sum, point) => sum + (Number(point[item.key]) || 0), 0) }))
);
const empty = computed(() => !loading.value && !error.value && totals.value.every(item => item.total === 0));
const summary = computed(() => `近 ${days.value} 天：${totals.value.map(item => `${item.name}累计 ${item.total} ${item.unit}`).join('，')}`);

const { domRef, updateOptions } = useEcharts(() => ({
  animation: !reducedMotion,
  tooltip: { trigger: 'axis' },
  grid: { left: 36, right: 16, top: 16, bottom: 28 },
  xAxis: { type: 'category', boundaryGap: false, axisTick: { show: false }, data: [] as string[] },
  yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { type: 'dashed' } } },
  series: [
    {
      name: '同步学生',
      type: 'line',
      smooth: true,
      showSymbol: true,
      symbolSize: dot,
      color: '#38694f',
      lineStyle: { width: 2.5 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(56, 105, 79, 0.22)' },
            { offset: 1, color: 'rgba(56, 105, 79, 0)' }
          ]
        }
      },
      data: [] as number[]
    },
    { name: '新注册会员', type: 'line', smooth: true, showSymbol: true, symbolSize: dot, color: '#d9a441', data: [] as number[] },
    { name: '奖励确认', type: 'line', smooth: true, showSymbol: true, symbolSize: dot, color: '#8a9890', lineStyle: { type: 'dashed' }, data: [] as number[] }
  ]
}));

function render() {
  updateOptions(opts => {
    opts.xAxis.data = points.value.map(point => point.day.slice(5));
    opts.series[0].data = points.value.map(point => point.syncedStudents);
    opts.series[1].data = points.value.map(point => point.newMembers);
    opts.series[2].data = points.value.map(point => point.confirmations);
    return opts;
  });
}

async function load() {
  const current = ++generation;
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  error.value = '';
  try {
    const result = await api<Trend>(`/admin/trend?days=${days.value}`, { signal: controller.signal });
    if (current !== generation) return;
    points.value = Array.isArray(result?.points) ? result.points : [];
    render();
  } catch (cause) {
    if (current === generation) error.value = cause instanceof Error ? cause.message : '无法加载趋势。';
  } finally {
    if (current === generation) loading.value = false;
  }
}

function select(value: string | number | boolean) {
  const next = Number(value);
  if (ranges.includes(next)) days.value = next;
}

watch(days, load, { immediate: true });
onUnmounted(() => {
  generation++;
  controller?.abort();
});
</script>

<template>
  <NCard title="近期趋势" :bordered="false" size="small" class="card-wrapper">
    <template #header-extra>
      <NRadioGroup :value="days" size="small" aria-label="统计天数" @update:value="select">
        <NRadioButton v-for="n in ranges" :key="n" :value="n">{{ n }} 天</NRadioButton>
      </NRadioGroup>
    </template>
    <NAlert v-if="error" type="error" title="趋势加载失败">
      <p>{{ error }}</p>
      <NButton size="small" @click="load">重试</NButton>
    </NAlert>
    <div v-show="!error" :aria-busy="loading">
      <ul class="trend-totals">
        <li v-for="item in totals" :key="item.key" :data-testid="`trend-total-${item.key}`">
          <i class="trend-dot" :style="{ backgroundColor: item.color }"></i>
          <span>{{ item.name }}</span>
          <strong>{{ loading ? '—' : item.total }}</strong>
          <small>{{ item.unit }}</small>
        </li>
      </ul>
      <div ref="domRef" class="trend-chart" :class="{ 'is-loading': loading }" role="img" :aria-label="summary"></div>
    </div>
    <p class="trend-note">
      <template v-if="empty">所选时间内暂无记录。</template>
      按北京时间逐日统计，同步学生指当天上传过学习记录的学生。
    </p>
  </NCard>
</template>

<style scoped>
.trend-totals { display: flex; flex-wrap: wrap; gap: 6px 20px; }
.trend-totals li { display: inline-flex; align-items: baseline; gap: 6px; font-size: 13px; color: #4a5a51; }
.trend-dot { align-self: center; width: 8px; height: 8px; border-radius: 50%; }
.trend-totals strong { font-size: 18px; font-weight: 600; color: #1f2d26; }
.trend-totals small { font-size: 12px; color: #7a877f; }
.trend-chart { height: 240px; overflow: hidden; transition: opacity 0.2s; }
.trend-chart.is-loading { opacity: 0.45; }
.trend-note { margin-top: 4px; font-size: 12px; color: #7a877f; }
html.dark .trend-totals li { color: #b5c0b9; }
html.dark .trend-totals strong { color: #e6ece8; }
</style>
