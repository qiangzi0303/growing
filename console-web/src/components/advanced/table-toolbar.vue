<script setup lang="ts">
import { NButton } from 'naive-ui';
import TableColumnSetting from '@/components/advanced/table-column-setting.vue';

defineOptions({ name: 'TableToolbar' });
defineProps<{ loading?: boolean }>();
const emit = defineEmits<{ refresh: [] }>();
const columns = defineModel<NaiveUI.TableColumnCheck[]>('columns', { required: true });
</script>

<template>
  <div class="table-toolbar">
    <slot />
    <NButton size="small" :disabled="loading" data-testid="table-refresh" @click="emit('refresh')">
      <template #icon>
        <icon-mdi-refresh class="text-icon" :class="{ 'animate-spin': loading }" />
      </template>
      刷新
    </NButton>
    <TableColumnSetting v-model:columns="columns" />
  </div>
</template>
