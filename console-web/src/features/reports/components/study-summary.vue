<script setup lang="ts">
import { NDataTable, NEmpty } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import type { StudyReport } from '@/features/students/api';
import { formatBeijing, formatDuration } from '../api';
defineProps<{ report: StudyReport }>();
const columns: DataTableColumns<StudyReport['subjects'][number]> = [
  { title: '学科', key: 'subject', width: 120 },
  { title: '今日学习', key: 'todayMinutes', render: row => formatDuration(row.todayMinutes) },
  { title: '累计学习', key: 'totalMinutes', render: row => formatDuration(row.totalMinutes) },
  { title: '课程达标', key: 'mastered', render: row => row.mastered ?? '暂无记录' },
  { title: '练习完成', key: 'practice', render: row => row.practice ?? '暂无记录' }
];
</script>

<template>
  <section class="study-summary" aria-label="学习时长汇总">
    <div v-if="report.subjects.length" class="table-scroll" role="region" aria-label="学科学习汇总表" tabindex="0">
      <NDataTable size="small" :bordered="false" :columns="columns" :data="report.subjects" :row-key="row => row.subject" :scroll-x="640" />
    </div>
    <NEmpty v-if="!report.subjects.length" description="暂无学习记录" />
    <p>{{ report.timeNote }}</p><p v-if="report.note">{{ report.note }}</p>
    <p>最近同步（北京时间）：{{ formatBeijing(report.lastSyncedAt) }}</p>
    <p v-for="warning in report.warnings" :key="warning">{{ warning }}</p>
  </section>
</template>

<style scoped>
.study-summary { min-width: 0; }
p { color: #617268; }
</style>
