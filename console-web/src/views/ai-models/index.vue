<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NForm, NFormItem, NInput, NSwitch } from 'naive-ui';
import { listModels, modelOptions, saveModel } from '@/features/ai/api';
import type { ManagedModel } from '@/features/ai/api';
import { useAuthStore } from '@/store/modules/auth';

const auth = useAuthStore();
const rows = ref<(ManagedModel & { apiKey: string })[]>([]);
const loading = ref(false); const saving = ref(''); const error = ref(''); const message = ref('');
let controller = new AbortController(); let revision = 0;
function clear() { revision++; controller.abort(); controller = new AbortController(); rows.value = []; error.value = ''; message.value = ''; saving.value = ''; loading.value = false; }
async function load() {
  clear(); if (auth.profile?.role !== 'Admin') return;
  const current = revision; loading.value = true;
  try { const result = await listModels(controller.signal); if (current === revision) rows.value = result.models.map(row => ({ ...row, apiKey: '' })); }
  catch (cause) { if (current === revision) error.value = cause instanceof Error ? cause.message : '配置加载失败'; }
  finally { if (current === revision) loading.value = false; }
}
async function save(row: ManagedModel & { apiKey: string }) {
  if (saving.value || auth.profile?.role !== 'Admin') return;
  error.value = ''; message.value = '';
  try { const url = new URL(row.endpoint); if (url.protocol !== 'https:') throw new Error(); }
  catch { error.value = '请输入完整的 HTTPS 模型 API 地址'; return; }
  if (!row.model.trim()) { error.value = '请输入模型名称'; return; }
  const current = revision; saving.value = row.id;
  try {
    const updated = await saveModel(row.id, { model: row.model.trim(), endpoint: row.endpoint.trim(), enabled: row.enabled, apiKey: row.apiKey, ...(row.id === 'realtime' ? { voice: row.voice || '' } : {}) }, controller.signal);
    if (current === revision) { Object.assign(row, updated, { apiKey: '' }); message.value = '配置已保存'; }
  } catch (cause) { if (current === revision) error.value = cause instanceof Error ? cause.message : '保存失败'; }
  finally { if (current === revision) saving.value = ''; }
}
onMounted(load);
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], clear, { flush: 'sync' });
onUnmounted(clear);
</script>

<template>
  <section class="ai-models">
    <h1>AI 模型配置</h1>
    <p>全站共用配置。登录后的前端获取配置，直接调用模型 API。</p>
    <NAlert v-if="error" type="error" role="alert">{{ error }}</NAlert>
    <NAlert v-if="message" type="success" role="status">{{ message }}</NAlert>
    <NButton :loading="loading" :disabled="Boolean(saving)" @click="load">刷新配置</NButton>
    <NCard v-for="row in rows" :key="row.id" :title="modelOptions.find(option => option.value === row.id)?.label || row.purpose" size="small">
      <NForm @submit.prevent="save(row)">
        <NFormItem label="模型名称"><NInput v-model:value="row.model" :disabled="Boolean(saving)" :input-props="{ 'aria-label': `${row.id} 模型名称` }" /></NFormItem>
        <NFormItem :label="row.id === 'realtime' ? '完整 SDP API 地址' : '完整 chat/completions API 地址'"><NInput v-model:value="row.endpoint" :disabled="Boolean(saving)" :input-props="{ 'aria-label': `${row.id} API 地址` }" /></NFormItem>
        <p>{{ row.configured ? `已配置 ${row.keyHint}` : '尚未配置 Key' }} · 版本 {{ row.revision }}</p>
        <NFormItem label="替换 API Key（留空保留现有值）"><NInput v-model:value="row.apiKey" type="password" :disabled="Boolean(saving)" :input-props="{ autocomplete: 'new-password', 'aria-label': `${row.id} API Key` }" placeholder="留空保留现有 Key" /></NFormItem>
        <NFormItem v-if="row.id === 'realtime'" label="音色（可选）"><NInput v-model:value="row.voice" :disabled="Boolean(saving)" /></NFormItem>
        <NFormItem label="启用"><NSwitch v-model:value="row.enabled" :disabled="Boolean(saving)" :aria-label="`${row.id} 启用`" /></NFormItem>
        <NButton attr-type="submit" type="primary" :disabled="Boolean(saving)" :loading="saving === row.id">保存配置</NButton>
      </NForm>
    </NCard>
  </section>
</template>

<style scoped>
.ai-models { display:grid;gap:16px;max-width:760px;min-width:0 }
</style>
