<script setup lang="ts">
import { watch } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({ name: 'RoleChart' });

const props = defineProps<{ students: number; parents: number; admins: number; others: number }>();

const palette = ['#38694f', '#6fa585', '#d9a441', '#a9b5ae'];

function slices() {
  return [
    { name: '学生', value: props.students },
    { name: '家长', value: props.parents },
    { name: '管理员', value: props.admins },
    ...(props.others > 0 ? [{ name: '未选身份', value: props.others }] : [])
  ];
}

const reducedMotion = Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const { domRef, updateOptions } = useEcharts(() => ({
  animation: !reducedMotion,
  tooltip: { trigger: 'item', formatter: '{b}：{c} 人（{d}%）' },
  legend: { bottom: 0, left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, itemGap: 16 },
  series: [
    {
      name: '会员构成',
      type: 'pie',
      color: palette,
      radius: ['52%', '74%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 600, formatter: '{b}\n{c}' } },
      labelLine: { show: false },
      data: slices()
    }
  ]
}));

watch(
  () => [props.students, props.parents, props.admins, props.others],
  () => {
    updateOptions(opts => {
      opts.series[0].data = slices();
      return opts;
    });
  }
);
</script>

<template>
  <div ref="domRef" class="role-chart" role="img" :aria-label="`会员构成：学生 ${students} 人，家长 ${parents} 人，管理员 ${admins} 人`"></div>
</template>

<style scoped>
.role-chart { height: 260px; overflow: hidden; }
</style>
