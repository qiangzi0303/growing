<script setup lang="ts">
import type { StudentIdentity } from '../api';
defineProps<{ students: StudentIdentity[]; modelValue: string; disabled?: boolean }>();
defineEmits<{ 'update:modelValue': [id: string] }>();
</script>

<template>
  <label class="student-picker">
    <span>选择孩子</span>
    <select :value="modelValue" :disabled="disabled" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-for="student in students" :key="student.id" :value="student.id">{{ student.displayName }}</option>
    </select>
  </label>
</template>

<style scoped>
.student-picker { display: grid; gap: 6px; max-width: 360px; }
select { width: 100%; min-width: 0; min-height: 40px; padding: 8px 12px; border: 1px solid #b9c8be; border-radius: 6px; background: white; color: #213a2c; }
select:focus-visible { outline: 2px solid #38694f; outline-offset: 2px; }
</style>
