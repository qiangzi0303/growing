<script setup lang="ts">
import { NSelect, NFormItem } from 'naive-ui';
import type { StudentIdentity } from '../api';
defineProps<{ students: StudentIdentity[]; modelValue: string; disabled?: boolean }>();
defineEmits<{ 'update:modelValue': [id: string] }>();
</script>

<template>
  <NFormItem label="选择孩子" class="student-picker"><NSelect :value="modelValue" :disabled="disabled" :options="students.map(student => ({ label: student.displayName, value: student.id }))" aria-label="选择孩子" @update:value="value => $emit('update:modelValue', value)" /></NFormItem>
</template>
<style scoped>.student-picker { max-width: 360px; }</style>
