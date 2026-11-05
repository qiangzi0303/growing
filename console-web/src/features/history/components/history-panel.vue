<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton } from 'naive-ui';
import type { StudentIdentity } from '@/features/students/api';
import WorkHistory from './work-history.vue';
import AttemptHistory from './attempt-history.vue';
import StudentRankings from './student-rankings.vue';
const props = defineProps<{ student: StudentIdentity }>();
const opened = ref(false);
watch(() => props.student.id, () => { opened.value = false; }, { flush: 'sync' });
</script>
<template><section class="history-panel"><NButton data-testid="open-history" :aria-expanded="opened" :aria-controls="`history-${student.id}`" @click="opened = !opened">{{ opened ? '收起历史与排名' : '查看原稿、错题与排名' }}</NButton><div v-if="opened" :id="`history-${student.id}`" class="history-content"><WorkHistory :key="`work-${student.id}`" :student="student" /><AttemptHistory :key="`attempts-${student.id}`" :student="student" /><StudentRankings :key="`rank-${student.id}`" :student="student" /></div></section></template>
<style scoped>.history-panel { min-width: 0; } .history-content { display: grid; gap: 32px; margin-top: 24px; min-width: 0; }</style>
