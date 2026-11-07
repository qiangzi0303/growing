<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NAlert, NButton, NDataTable, NEmpty, NForm, NFormItem, NPagination, NSelect, NSpin } from 'naive-ui';
import type { DataTableColumns, DataTableInst } from 'naive-ui';
import type { RankingRow } from '../api';
import type { StudentIdentity } from '@/features/students/api';
import { rankingBoard, rankings } from '../api';
import { useHistoryQuery } from '../use-history-query';
import { formatBeijing } from '@/features/reports/api';
const props = defineProps<{ student: StudentIdentity }>();
const percentage = (value?: number) => value == null ? '暂无' : `${value.toFixed(1)}%`;
const subject = ref(''); const term = ref(''); const kind = ref('unit'); const board = ref(''); const page = ref(1);
watch(() => props.student.id, () => { subject.value = ''; term.value = ''; kind.value = 'unit'; board.value = ''; page.value = 1; }, { flush: 'sync' });
const list = useHistoryQuery(() => props.student.id, () => '', (role, signal) => rankings(role, props.student.id, signal));
const choices = computed(() => list.data.value?.boards.filter(item => (!subject.value || item.subject === subject.value) && (!term.value || item.term === term.value) && item.kind === kind.value) ?? []);
watch(choices, rows => { if (!rows.some(row => row.id === board.value)) board.value = rows[0]?.id ?? ''; }, { immediate: true, flush: 'sync' });
watch(board, () => { page.value = 1; }, { flush: 'sync' });
const detail = useHistoryQuery(() => props.student.id, () => `${board.value}:${page.value}`, (role, signal) => board.value ? rankingBoard(role, props.student.id, board.value, page.value, signal) : Promise.resolve(null));
const subjectOptions = [{ label: '全部学科', value: '' }, { label: '数学', value: 'math' }, { label: '英语', value: 'english' }, { label: '物理', value: 'physics' }];
const termOptions = [{ label: '全部册次', value: '' }, { label: '上册', value: 'upper' }, { label: '下册', value: 'lower' }];
const kindOptions = [{ label: '单元排行榜', value: 'unit' }, { label: '学期科目排行榜', value: 'course' }];
const boardOptions = computed(() => choices.value.map(item => ({ label: item.title, value: item.id })));
const columns: DataTableColumns<RankingRow> = [
  { title: '名次', key: 'rank', width: 80 }, { title: '榜名', key: 'label', width: 120 },
  { title: '费曼评测', key: 'conceptPercent', width: 130, render: row => percentage(row.conceptPercent) },
  { title: '题目评测', key: 'testPercent', width: 130, render: row => percentage(row.testPercent) },
  { title: '图谱诊断', key: 'diagnosisPercent', width: 130, render: row => percentage(row.diagnosisPercent) },
  { title: '综合分', key: 'score', width: 130, render: row => row.score.toFixed(2) }
];
const rowProps = (row: RankingRow) => ({ 'aria-current': row.isSelf ? 'true' as const : undefined });
const table = ref<DataTableInst | null>(null);
let scrollLeft = 0;
function scrollTable(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  table.value?.scrollTo({ left: Math.max(0, scrollLeft + (event.key === 'ArrowRight' ? 80 : -80)) });
}
</script>
<template>
  <section v-if="list.authorized.value" class="rankings"><header><h3>学生排行榜</h3><NButton :disabled="list.loading.value" @click="list.reload">刷新排行榜</NButton></header>
    <NSpin v-if="list.loading.value" role="status" size="small"><span>正在读取已学习课程…</span></NSpin>
    <NAlert v-else-if="list.error.value" type="error" title="排行榜读取失败"><p>{{ list.error.value }}</p><NButton @click="list.reload">重试榜单</NButton></NAlert>
    <template v-else-if="list.data.value"><p>{{ list.data.value.formula }}</p><p>{{ list.data.value.note }} 其他同学仅显示匿名榜名。</p>
      <NForm class="filters" label-placement="top">
<NFormItem label="学科"><NSelect v-model:value="subject" aria-label="排名学科" :options="subjectOptions" /></NFormItem>
<NFormItem label="册次"><NSelect v-model:value="term" aria-label="排名册次" :options="termOptions" /></NFormItem>
<NFormItem label="类型"><NSelect v-model:value="kind" aria-label="排名类型" :options="kindOptions" /></NFormItem>
<NFormItem label="课程"><NSelect v-model:value="board" aria-label="排名课程" :options="boardOptions" :disabled="!choices.length" /></NFormItem>
</NForm>
      <NEmpty v-if="!choices.length" description="暂无对应的已学习课程" />
      <NSpin v-if="detail.loading.value" role="status" size="small"><span>正在读取课程排名…</span></NSpin>
      <NAlert v-else-if="detail.error.value" type="error" title="课程排名读取失败"><p>{{ detail.error.value }}</p><NButton @click="detail.reload">重试课程排名</NButton></NAlert>
      <template v-else-if="detail.data.value">
        <p>我的名次：{{ detail.data.value.self?.rank ?? '暂无' }} · {{ detail.data.value.board.participants }} 人参与 · 综合分 {{ detail.data.value.self?.score.toFixed(2) ?? '暂无' }} / 100</p>
        <p>费曼评测 {{ percentage(detail.data.value.self?.conceptPercent) }} × 30% · 题目评测 {{ percentage(detail.data.value.self?.testPercent) }} × 40% · 图谱诊断 {{ percentage(detail.data.value.self?.diagnosisPercent) }} × 30%</p>
        <p>最近计分：{{ formatBeijing(detail.data.value.self?.updatedAt ?? null) }}；未评测部分按现有计分口径计 0，手写评分、阅读、奖励和学习时长不计分。</p>
        <NDataTable ref="table" tabindex="0" aria-label="匿名课程排名" :columns="columns" :data="detail.data.value.rows" :scroll-x="720" :row-props="rowProps" :row-class-name="row => row.isSelf ? 'self' : ''" @scroll="event => { scrollLeft = (event.target as HTMLElement).scrollLeft; }" @keydown="scrollTable" />
        <NPagination v-model:page="page" aria-label="排行榜分页" :item-count="detail.data.value.total" :page-size="detail.data.value.pageSize" :page-slot="5" />
      </template>
    </template>
  </section>
</template>
<style scoped>.rankings { display: grid; gap: 16px; min-width: 0; } header { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; } h3, p { margin: 0; } .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: 12px; } :deep(.self) { font-weight: 600; } .n-pagination { max-width: 100%; overflow-x: auto; }</style>
