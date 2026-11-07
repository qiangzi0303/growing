<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NDataTable, NEmpty, NForm, NFormItem, NProgress, NSelect } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { formatDuration, formatBeijing } from '../api';
import type { UnitReport, UnitReports } from '../api';
const props = defineProps<{ report: UnitReports }>();
const subject = ref(''); const term = ref('');
const rows = computed(() => props.report.units.filter(unit => (!subject.value || unit.subject === subject.value) && (!term.value || unit.term === term.value)));
const missing = computed(() => props.report.units.filter(unit => unit.activeMinutes === null).length);
const minutes = computed(() => props.report.units.reduce((sum, unit) => sum + (unit.activeMinutes ?? 0), 0));
const completed = computed(() => props.report.units.filter(unit => unit.mastered === unit.total).length);
const columns: DataTableColumns<UnitReport> = [
  { title: '单元', key: 'title', width: 160 },
  { title: '学科 / 册次', key: 'subject', width: 150, render: unit => `${unit.subjectName} · ${unit.termName}` },
  { title: '单词掌握', key: 'words', width: 130, render: unit => unit.words ? [h('strong', { class: 'completed-count' }, unit.words.mastered), ' / ', h('span', { class: 'total-count' }, unit.words.total), ' 个'] : '—' },
  { title: '句子互动', key: 'sentences', width: 150, render: unit => unit.sentences ? [h('strong', { class: 'completed-count' }, unit.sentences.completed), ' / ', h('span', { class: 'total-count' }, unit.sentences.total), ' 项完成'] : '—' },
  { title: '课程达标', key: 'masteryPercent', width: 180, render: unit => h('div', [
    `${unit.masteryPercent}% · ${unit.mastered} / ${unit.total} 项达标`,
    h(NProgress, { type: 'line', percentage: unit.total ? Math.min(100, Math.max(0, unit.mastered / unit.total * 100)) : 0, showIndicator: false, 'aria-label': `${unit.title}课程达标` })
  ]) },
  { title: '有效学习时长', key: 'activeMinutes', width: 150, render: unit => formatDuration(unit.activeMinutes) },
  { title: '有记录的学习日期', key: 'studyDays', width: 190, render: unit => unit.firstStudyDay ? `${unit.firstStudyDay} 至 ${unit.lastStudyDay} · 共 ${unit.studyDays} 天` : '暂无日期记录' },
  { title: '概念复述', key: 'concept', width: 220, render: unit => `${unit.concept.passed} / ${unit.concept.total} 项通过 · ${unit.concept.latest !== null ? `最近 ${unit.concept.latest}/10 · 最好 ${unit.concept.best === null ? '暂无有效评分' : `${unit.concept.best}/10`}` : unit.concept.best !== null ? `留存最好 ${unit.concept.best}/10` : unit.concept.passed ? '按历史达标记录' : '暂无有效评分'}` },
  { title: '题目评测', key: 'practice', width: 200, render: unit => `${unit.practice.done} / ${unit.practice.total}（按各题项最好结果折合，非考试次数）` },
  { title: '图谱诊断', key: 'diagnostic', width: 220, render: unit => !unit.diagnostic.total ? '该科目暂未开放' : !unit.diagnostic.tested ? '未测（暂无完整评测记录）' : `已测 ${unit.diagnostic.tested}/${unit.diagnostic.total} · 初筛通过 ${unit.diagnostic.passed} · 不稳 ${unit.diagnostic.shaky} · 薄弱 ${unit.diagnostic.weak} · 未测 ${unit.diagnostic.total - unit.diagnostic.tested}` },
  { title: '手写评测', key: 'handwriting', width: 230, render: unit => unit.handwriting.latest ? `${unit.handwriting.latest.needsReview ? '待核对原稿' : `${unit.handwriting.latest.score}/100`} · ${formatBeijing(unit.handwriting.latest.at)} · 不直接计入课程达标` : '暂无手写评测' }
];
</script>

<template>
  <section class="units" aria-label="单元学习报告">
    <h2>单元学习报告</h2>
    <p>已学习 {{ report.units.length }} 个单元 · 有记录的有效时长：{{ formatDuration(!report.units.length || (missing === report.units.length) ? null : minutes) }} <span v-if="missing">（另有 {{ missing }} 个单元暂无时间记录）</span></p>
    <p>已完成课程达标的单元 {{ completed }} / {{ report.units.length }}</p>
    <NForm class="filters" :show-feedback="false" label-placement="top">
      <NFormItem label="学科"><NSelect v-model:value="subject" aria-label="单元学科" :options="[{value: '', label: '全部学科'}, {value: 'math', label: '数学'}, {value: 'english', label: '英语'}, {value: 'physics', label: '物理'}]" /></NFormItem>
      <NFormItem label="册次"><NSelect v-model:value="term" aria-label="单元册次" :options="[{value: '', label: '全部册次'}, {value: 'upper', label: '八年级上册'}, {value: 'lower', label: '八年级下册'}]" /></NFormItem>
    </NForm>
    <NEmpty v-if="!rows.length" :description="report.units.length ? '该筛选下暂无已学习单元' : '尚无单元学习记录'" />
    <NDataTable v-else aria-label="单元学习报告表" size="small" :columns="columns" :data="rows" :row-key="unit => unit.id" :scroll-x="2080" />
    <p>{{ report.note }}</p><p>最近同步（北京时间）：{{ formatBeijing(report.lastSyncedAt) }}</p><p v-for="warning in report.warnings" :key="warning">{{ warning }}</p>
  </section>
</template>

<style scoped>
.units { display: grid; gap: 16px; min-width: 0; }
.filters { display: flex; flex-wrap: wrap; gap: 12px; }
.filters :deep(.n-form-item) { width: 180px; max-width: 100%; }
h2 { margin: 0; font-size: 20px; }
.units :deep(.completed-count) { color: #2e7d32; } .units :deep(.total-count) { color: #2b5b84; }
</style>
