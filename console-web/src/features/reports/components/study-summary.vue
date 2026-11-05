<script setup lang="ts">
import { NTable } from 'naive-ui';
import type { StudyReport } from '@/features/students/api';
import { formatBeijing, formatDuration } from '../api';
defineProps<{ report: StudyReport }>();
</script>

<template>
  <section class="study-summary" aria-label="学习时长汇总">
    <div v-if="report.subjects.length" class="table-scroll" role="region" aria-label="学科学习汇总表" tabindex="0">
      <NTable size="small" :bordered="false" :single-line="true" class="summary-table">
        <thead><tr><th scope="col">学科</th><th scope="col">今日学习</th><th scope="col">累计学习</th><th scope="col">课程达标</th><th scope="col">练习完成</th></tr></thead>
        <tbody><tr v-for="subject in report.subjects" :key="subject.subject"><th scope="row">{{ subject.subject }}</th><td>{{ formatDuration(subject.todayMinutes) }}</td><td>{{ formatDuration(subject.totalMinutes) }}</td><td>{{ subject.mastered ?? '暂无记录' }}</td><td>{{ subject.practice ?? '暂无记录' }}</td></tr></tbody>
      </NTable>
    </div>
    <p v-if="!report.subjects.length">暂无学习记录</p>
    <p>{{ report.timeNote }}</p><p v-if="report.note">{{ report.note }}</p>
    <p>最近同步（北京时间）：{{ formatBeijing(report.lastSyncedAt) }}</p>
    <p v-for="warning in report.warnings" :key="warning">{{ warning }}</p>
  </section>
</template>

<style scoped>
.study-summary { min-width: 0; }
.table-scroll { min-width: 0; overflow-x: auto; border: 1px solid #e0e7e1; border-radius: 6px; background: white; }
.table-scroll:focus-visible { outline: 2px solid #38694f; outline-offset: 2px; }
.summary-table { min-width: 640px; }
.summary-table :deep(th), .summary-table :deep(td) { padding: 12px 16px; white-space: nowrap; }
.summary-table :deep(thead th) { background: #f3f7f4; color: #53665a; }
p { color: #617268; }
</style>
