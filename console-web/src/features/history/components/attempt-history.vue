<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import { NAlert, NButton } from 'naive-ui';
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
    <p v-if="list.loading.value" role="status">正在读取反复错题…</p>
    <NAlert v-else-if="list.error.value" type="error" title="反复错题读取失败"><p>{{ list.error.value }}</p><NButton @click="list.reload">重试错题</NButton></NAlert>
    <template v-else-if="list.data.value"><p v-if="!list.data.value.rows.length">暂无至少两次答错的题目</p>
      <article v-for="row in list.data.value.rows" :key="`${row.kind}:${row.questionId}`"><strong>{{ row.number }}. {{ row.title || row.questionId }}</strong><p>错 {{ row.wrongCount }} 次 · 对 {{ row.correctCount }} 次 · 最近 {{ formatBeijing(row.lastAt) }}</p><NButton data-testid="open-attempts" :aria-expanded="selected === row" @click="selected = selected === row ? null : row">查看最近作答</NButton></article>
      <nav aria-label="反复错题分页"><NButton :disabled="page <= 1" @click="page--">上一页</NButton><span>第 {{ page }} 页 · 共 {{ list.data.value.total }} 题</span><NButton :disabled="page * list.data.value.pageSize >= list.data.value.total" @click="page++">下一页</NButton></nav>
    </template>
    <p v-if="detail.loading.value" role="status">正在读取作答记录…</p>
    <NAlert v-if="detail.error.value" type="error" title="作答记录读取失败"><p>{{ detail.error.value }}</p><NButton @click="detail.reload">重试作答记录</NButton></NAlert>
    <div v-if="detail.data.value"><h4>所选题最近作答</h4><p>留存记录不含作答原文；按实际记录显示对错。</p><ul><li v-for="row in detail.data.value.rows" :key="row.attemptId">{{ formatBeijing(row.at) }} · {{ row.correct === 1 ? '作答正确' : row.correct === 0 ? '作答错误' : '待核对' }}</li></ul><nav aria-label="最近作答分页"><NButton :disabled="attemptPage <= 1" @click="attemptPage--">上一页作答</NButton><span>第 {{ attemptPage }} 页 · 共 {{ detail.data.value.totalCount }} 次</span><NButton :disabled="attemptPage * detail.data.value.pageSize >= detail.data.value.totalCount" @click="attemptPage++">下一页作答</NButton></nav></div>
  </section>
</template>
<style scoped>.attempt-history { display: grid; gap: 16px; min-width: 0; } h3, h4 { margin: 0; } article { padding-bottom: 12px; border-bottom: 1px solid #e0e7e1; } nav { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; } li, strong { overflow-wrap: anywhere; }</style>
