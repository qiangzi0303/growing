<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { NAlert, NButton, NCard, NList, NListItem, NSpin, NSwitch } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { listStudents } from '@/features/students/api';
import type { StudentIdentity } from '@/features/students/api';
import BindChild from '@/features/family/bind-child.vue';
import { legacy } from '@/features/legacy/links';
import { loadSounds } from '@/features/legacy/sounds';
const soundEnabled = ref(false); const soundReady = ref(false); const soundError = ref(''); let alive = true;
const soundPending = ref(false);
async function prepareSounds() { try { const sound = await loadSounds(); if (!alive) return; soundEnabled.value = sound.isEnabled(); soundReady.value = true; soundError.value = ''; } catch { if (alive) soundError.value = '交互音效加载失败，请重试'; } }
async function toggleSound(enabled: boolean) {
  if (soundPending.value) return;
  soundPending.value = true;
  try { const sound = await loadSounds(); await sound.setEnabled(enabled); if (alive) { soundEnabled.value = sound.isEnabled(); soundError.value = ''; } }
  catch { if (alive) soundError.value = '交互音效设置失败，请重试'; }
  finally { if (alive) soundPending.value = false; }
}
const updateSound = () => { if (window.GrowingInteractionSounds) soundEnabled.value = window.GrowingInteractionSounds.isEnabled(); };
onMounted(() => { prepareSounds(); window.addEventListener('growing:sound-changed', updateSound); });
onUnmounted(() => { alive = false; window.removeEventListener('growing:sound-changed', updateSound); });
const auth = useAuthStore(); const children = ref<StudentIdentity[]>([]); const error = ref('');
let version = 0; let controller: AbortController | null = null;
function clear() { version++; controller?.abort(); children.value = []; error.value = ''; }
async function refresh() { clear(); if (auth.profile?.role !== 'Parent') return; const current = version; controller = new AbortController(); try { const result = await listStudents('Parent', { signal: controller.signal }); if (current === version) children.value = result.rows; } catch (cause) { if (current === version) error.value = cause instanceof Error ? cause.message : '孩子列表刷新失败'; } }
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], clear, { flush: 'sync' }); onUnmounted(clear);
</script>
<template>
  <section class="account-settings">
    <h1>账号与设置</h1><p>{{ auth.profile?.displayName }}</p>
    <BindChild @refresh="refresh" />
    <NAlert v-if="error" type="error" role="alert">{{ error }}</NAlert>
    <NList v-if="children.length"><NListItem v-for="child in children" :key="child.id"><RouterLink v-slot="{ href, navigate }" :to="`/students/${encodeURIComponent(child.id)}`" custom><NButton tag="a" text type="primary" :href="href" @click="navigate">{{ child.displayName }}</NButton></RouterLink></NListItem></NList>
    <NCard title="本机连接设置" size="small">
      <p>连接设置按当前账号隔离，密钥只保存在本机。</p>
      <div class="actions">
        <NButton tag="a" :href="legacy.link('settings', '/console/account')">DeepSeek 密钥设置</NButton>
        <NButton tag="a" :href="legacy.link('voice-settings', '/console/account')">语音 Key 设置</NButton>
        <NButton v-if="auth.profile?.role === 'Admin'" tag="a" :href="legacy.link('classroom', '/console/account')">管理员课堂试用</NButton>
      </div>
    </NCard>
    <NCard title="交互音效" size="small">
      <p>此设备所有账号共用，不影响课程朗读。</p>
      <NSwitch v-if="soundReady" :value="soundEnabled" :loading="soundPending" :disabled="soundPending" aria-label="交互音效" @update:value="toggleSound"><template #checked>开</template><template #unchecked>关</template></NSwitch>
      <NSpin v-else-if="!soundError" size="small" aria-label="加载交互音效" />
      <NAlert v-if="soundError" type="error" role="alert">{{ soundError }} <NButton size="small" @click="prepareSounds">重试</NButton></NAlert>
    </NCard>
    <NButton @click="auth.resetStore()">退出账号</NButton>
    <NAlert v-if="auth.logoutError" type="error" role="alert">退出未完成，请重试。</NAlert>
  </section>
</template>
<style scoped>
.account-settings { display:grid;gap:16px;max-width:60rem;min-width:0 }
.actions { display:flex;flex-wrap:wrap;gap:12px;margin-top:12px }
</style>
