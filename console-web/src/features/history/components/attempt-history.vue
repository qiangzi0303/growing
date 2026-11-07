<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import { NAlert, NButton, NEmpty, NPagination, NSpin } from 'naive-ui';
import type { StudentIdentity } from '@/features/students/api';
import { formatBeijing } from '@/features/reports/api';
import { attempts, repeated } from '../api';
import type { RepeatedRow } from '../api';
import { useHistoryQuery } from '../use-history-query';
const props = defineProps<{ student: StudentIdentity }>();
const page = ref(1); const attemptPage = ref(1); const selected = shallowRef<RepeatedRow | null>(null);
watch(() => props.student.id, () => { selected.value = null; page.value = 1; attemptPage.value = 1; }, { flush: 'sync' });
watch(page, () => { selected.value = null; }, { flush: 'sync' });
watch(selected, () => { attemptPage.value = 1; }, { flush: 'sync' });
const list = useHistoryQuery(() => props.student.id, () => page.value, (_role, signal) => repeated(props.student.id, page.value, signal));
const detail = useHistoryQuery(() => props.student.id, () => `${selected.value?.kind}:${selected.value?.questionId}:${attemptPage.value}`, (_role, signal) => selected.value ? attempts(props.student.id, selected.value, attemptPage.value, signal) : Promise.resolve(null));
</script>
<template>
  <section v-if="list.authorized.value" class="attempt-history"><h3>反复错题与最近作答</h3>
    <NSpin v-if="list.loading.value" role="status" size="small"><span>正在读取反复错题…</span></NSpin>
    <NAlert v-else-if="list.error.value" type="error" title="反复错题读取失败"><p>{{ list.error.value }}</p><NButton @click="list.reload">重试错题</NButton></NAlert>
    <template v-else-if="list.data.value"><NEmpty v-if="!list.data.value.rows.length" description="暂无至少两次答错的题目" />
      <article v-for="row in list.data.value.rows" :key="`${row.kind}:${row.questionId}`"><strong>{{ row.number }}. {{ row.title || row.questionId }}</strong><p>错 {{ row.wrongCount }} 次 · 对 {{ row.correctCount }} 次 · 最近 {{ formatBeijing(row.lastAt) }}</p><NButton data-testid="open-attempts" :aria-expanded="selected === row" @click="selected = selected === row ? null : row">查看最近作答</NButton></article>
      <NPagination v-model:page="page" aria-label="反复错题分页" :item-count="list.data.value.total" :page-size="list.data.value.pageSize" :page-slot="5" />
    </template>
    <NSpin v-if="detail.loading.value" role="status" size="small"><span>正在读取作答记录…</span></NSpin>
    <NAlert v-if="detail.error.value" type="error" title="作答记录读取失败"><p>{{ detail.error.value }}</p><NButton @click="detail.reload">重试作答记录</NButton></NAlert>
    <div v-if="detail.data.value"><h4>所选题最近作答</h4><p>留存记录不含作答原文；按实际记录显示对错。</p><ul><li v-for="row in detail.data.value.rows" :key="row.attemptId">{{ formatBeijing(row.at) }} · {{ row.correct === 1 ? '作答正确' : row.correct === 0 ? '作答错误' : '待核对' }}</li></ul><NPagination v-model:page="attemptPage" aria-label="最近作答分页" :item-count="detail.data.value.totalCount" :page-size="detail.data.value.pageSize" :page-slot="5" /></div>
  </section>
</template>
<style scoped>.attempt-history { display: grid; gap: 16px; min-width: 0; } h3, h4 { margin: 0; } article { padding-bottom: 12px; border-bottom: 1px solid #e0e7e1; } nav { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; } li, strong { overflow-wrap: anywhere; }.n-pagination { max-width: 100%; overflow-x: auto; }</style>
