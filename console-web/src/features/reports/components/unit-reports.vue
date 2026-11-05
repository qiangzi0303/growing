<script setup lang="ts">
import { computed, ref } from 'vue';
import { NTable } from 'naive-ui';
import { formatDuration, formatBeijing } from '../api';
import type { UnitReports } from '../api';
const props = defineProps<{ report: UnitReports }>();
const subject = ref(''); const term = ref('');
const rows = computed(() => props.report.units.filter(unit => (!subject.value || unit.subject === subject.value) && (!term.value || unit.term === term.value)));
const missing = computed(() => props.report.units.filter(unit => unit.activeMinutes === null).length);
const minutes = computed(() => props.report.units.reduce((sum, unit) => sum + (unit.activeMinutes ?? 0), 0));
const completed = computed(() => props.report.units.filter(unit => unit.mastered === unit.total).length);
</script>

<template>
  <section class="units" aria-label="单元学习报告">
    <h2>单元学习报告</h2>
    <p>已学习 {{ report.units.length }} 个单元 · 有记录的有效时长：{{ formatDuration(!report.units.length || (missing === report.units.length) ? null : minutes) }} <span v-if="missing">（另有 {{ missing }} 个单元暂无时间记录）</span></p>
    <p>已完成课程达标的单元 {{ completed }} / {{ report.units.length }}</p>
    <div class="filters"><label>学科<select v-model="subject" aria-label="单元学科"><option value="">全部学科</option><option value="math">数学</option><option value="english">英语</option><option value="physics">物理</option></select></label><label>册次<select v-model="term" aria-label="单元册次"><option value="">全部册次</option><option value="upper">八年级上册</option><option value="lower">八年级下册</option></select></label></div>
    <p v-if="!rows.length">{{ report.units.length ? '该筛选下暂无已学习单元' : '尚无单元学习记录' }}</p>
    <div v-else class="table-scroll" role="region" aria-label="单元学习报告表" tabindex="0">
      <NTable size="small" :bordered="false" :single-line="true" class="unit-table">
        <thead><tr><th scope="col">单元</th><th scope="col">学科 / 册次</th><th scope="col">课程达标</th><th scope="col">有效学习时长</th><th scope="col">有记录的学习日期</th><th scope="col">概念复述</th><th scope="col">题目评测</th><th scope="col">图谱诊断</th><th scope="col">手写评测</th></tr></thead>
        <tbody><tr v-for="unit in rows" :key="unit.id">
          <th scope="row">{{ unit.title }}</th><td>{{ unit.subjectName }} · {{ unit.termName }}</td>
          <td><strong>{{ unit.masteryPercent }}%</strong> · {{ unit.mastered }} / {{ unit.total }} 项达标<progress :max="unit.total || 1" :value="unit.mastered" :aria-label="`${unit.title}课程达标`" /></td>
          <td>{{ formatDuration(unit.activeMinutes) }}</td><td>{{ unit.firstStudyDay ? `${unit.firstStudyDay} 至 ${unit.lastStudyDay} · 共 ${unit.studyDays} 天` : '暂无日期记录' }}</td>
          <td>{{ unit.concept.passed }} / {{ unit.concept.total }} 项通过 · <template v-if="unit.concept.latest !== null">最近 {{ unit.concept.latest }}/10 · 最好 {{ unit.concept.best === null ? '暂无有效评分' : `${unit.concept.best}/10` }}</template><template v-else-if="unit.concept.best !== null">留存最好 {{ unit.concept.best }}/10</template><template v-else>{{ unit.concept.passed ? '按历史达标记录' : '暂无有效评分' }}</template></td>
          <td>{{ unit.practice.done }} / {{ unit.practice.total }}（按各题项最好结果折合，非考试次数）</td><td>{{ !unit.diagnostic.total ? '该科目暂未开放' : !unit.diagnostic.tested ? '未测（暂无完整评测记录）' : `已测 ${unit.diagnostic.tested}/${unit.diagnostic.total} · 初筛通过 ${unit.diagnostic.passed} · 不稳 ${unit.diagnostic.shaky} · 薄弱 ${unit.diagnostic.weak} · 未测 ${unit.diagnostic.total - unit.diagnostic.tested}` }}</td>
          <td><template v-if="unit.handwriting.latest">{{ unit.handwriting.latest.needsReview ? '待核对原稿' : `${unit.handwriting.latest.score}/100` }} · {{ formatBeijing(unit.handwriting.latest.at) }} · 不直接计入课程达标</template><template v-else>暂无手写评测</template></td>
        </tr></tbody>
      </NTable>
    </div>
    <p>{{ report.note }}</p><p>最近同步（北京时间）：{{ formatBeijing(report.lastSyncedAt) }}</p><p v-for="warning in report.warnings" :key="warning">{{ warning }}</p>
  </section>
</template>

<style scoped>
.units { display: grid; gap: 16px; min-width: 0; } .filters { display: flex; flex-wrap: wrap; gap: 12px; } label { display: grid; gap: 4px; } select { min-height: 38px; padding: 4px 8px; border: 1px solid #b9c8be; border-radius: 6px; background: white; color: #213a2c; } progress { display: block; width: 100%; margin-top: 6px; accent-color: #38694f; } h2 { margin: 0; font-size: 20px; }
.table-scroll { min-width: 0; overflow-x: auto; border: 1px solid #e0e7e1; border-radius: 6px; background: white; }
.table-scroll:focus-visible { outline: 2px solid #38694f; outline-offset: 2px; }
.unit-table { min-width: 1640px; table-layout: fixed; }
.unit-table :deep(th), .unit-table :deep(td) { padding: 12px 16px; vertical-align: top; overflow-wrap: anywhere; }
.unit-table :deep(thead th) { background: #f3f7f4; color: #53665a; }
</style>
