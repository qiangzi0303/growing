<script setup lang="ts">
import { useRoute } from 'vue-router';
import StudentOverview from '@/features/students/components/student-overview.vue';
const route = useRoute();
</script>

<template><main class="console-page"><h1>学生详情</h1><StudentOverview :student-id="String(route.params.id ?? '')" /></main></template>
