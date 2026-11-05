<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NAlert, NButton } from 'naive-ui';
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
</script>
<template>
  <section v-if="list.authorized.value" class="rankings"><header><h3>学生排行榜</h3><NButton :disabled="list.loading.value" @click="list.reload">刷新排行榜</NButton></header>
    <p v-if="list.loading.value" role="status">正在读取已学习课程…</p>
    <NAlert v-else-if="list.error.value" type="error" title="排行榜读取失败"><p>{{ list.error.value }}</p><NButton @click="list.reload">重试榜单</NButton></NAlert>
    <template v-else-if="list.data.value"><p>{{ list.data.value.formula }}</p><p>{{ list.data.value.note }} 其他同学仅显示匿名榜名。</p>
      <div class="filters"><label>学科 <select v-model="subject" aria-label="排名学科"><option value="">全部学科</option><option value="math">数学</option><option value="english">英语</option><option value="physics">物理</option></select></label><label>册次 <select v-model="term" aria-label="排名册次"><option value="">全部册次</option><option value="upper">上册</option><option value="lower">下册</option></select></label><label>类型 <select v-model="kind" aria-label="排名类型"><option value="unit">单元排行榜</option><option value="course">学期科目排行榜</option></select></label><label>课程 <select v-model="board" aria-label="排名课程" :disabled="!choices.length"><option v-for="item in choices" :key="item.id" :value="item.id">{{ item.title }}</option></select></label></div>
      <p v-if="!choices.length">暂无对应的已学习课程</p>
      <p v-if="detail.loading.value" role="status">正在读取课程排名…</p>
      <NAlert v-else-if="detail.error.value" type="error" title="课程排名读取失败"><p>{{ detail.error.value }}</p><NButton @click="detail.reload">重试课程排名</NButton></NAlert>
      <template v-else-if="detail.data.value">
        <p>我的名次：{{ detail.data.value.self?.rank ?? '暂无' }} · {{ detail.data.value.board.participants }} 人参与 · 综合分 {{ detail.data.value.self?.score.toFixed(2) ?? '暂无' }} / 100</p>
        <p>费曼评测 {{ percentage(detail.data.value.self?.conceptPercent) }} × 30% · 题目评测 {{ percentage(detail.data.value.self?.testPercent) }} × 40% · 图谱诊断 {{ percentage(detail.data.value.self?.diagnosisPercent) }} × 30%</p>
        <p>最近计分：{{ formatBeijing(detail.data.value.self?.updatedAt ?? null) }}；未评测部分按现有计分口径计 0，手写评分、阅读、奖励和学习时长不计分。</p>
        <div class="table-scroll" tabindex="0" aria-label="匿名课程排名"><table><thead><tr><th scope="col">名次</th><th scope="col">榜名</th><th scope="col">费曼评测</th><th scope="col">题目评测</th><th scope="col">图谱诊断</th><th scope="col">综合分</th></tr></thead><tbody><tr v-for="(row, i) in detail.data.value.rows" :key="i" :class="{ self: row.isSelf }" :aria-current="row.isSelf ? 'true' : undefined"><td>{{ row.rank }}</td><td>{{ row.label }}</td><td>{{ percentage(row.conceptPercent) }}</td><td>{{ percentage(row.testPercent) }}</td><td>{{ percentage(row.diagnosisPercent) }}</td><td>{{ row.score.toFixed(2) }}</td></tr></tbody></table></div>
        <nav aria-label="排行榜分页"><NButton :disabled="page <= 1" @click="page--">上一页排名</NButton><span>第 {{ page }} 页 · 共 {{ detail.data.value.total }} 人</span><NButton :disabled="page * detail.data.value.pageSize >= detail.data.value.total" @click="page++">下一页排名</NButton></nav>
      </template>
    </template>
  </section>
</template>
<style scoped>.rankings { display: grid; gap: 16px; min-width: 0; } header, nav, .filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; } h3, p { margin: 0; } select { max-width: 100%; padding: 6px; border: 1px solid #b9c9bf; border-radius: 5px; background: white; color: #203c2e; } label { min-width: 0; } table { width: 100%; min-width: 36rem; border-collapse: collapse; } th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e0e7e1; white-space: nowrap; } .table-scroll { overflow: auto; } .self { font-weight: 600; color: #38694f; }</style>
