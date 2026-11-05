<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { listStudents } from '@/features/students/api';
import type { StudentIdentity } from '@/features/students/api';
import BindChild from '@/features/family/bind-child.vue';
import { legacy } from '@/features/legacy/links';
import { loadSounds } from '@/features/legacy/sounds';
const soundEnabled = ref(false); const soundReady = ref(false); const soundError = ref(''); let alive = true;
async function prepareSounds() { try { const sound = await loadSounds(); if (!alive) return; soundEnabled.value = sound.isEnabled(); soundReady.value = true; soundError.value = ''; } catch { if (alive) soundError.value = '交互音效加载失败，请重试'; } }
async function toggleSound() { try { const sound = await loadSounds(); await sound.setEnabled(!sound.isEnabled()); if (alive) soundEnabled.value = sound.isEnabled(); } catch { if (alive) soundError.value = '交互音效设置失败，请重试'; } }
const updateSound = () => { if (window.GrowingInteractionSounds) soundEnabled.value = window.GrowingInteractionSounds.isEnabled(); };
onMounted(() => { prepareSounds(); window.addEventListener('growing:sound-changed', updateSound); });
onUnmounted(() => { alive = false; window.removeEventListener('growing:sound-changed', updateSound); });
const auth = useAuthStore(); const children = ref<StudentIdentity[]>([]); const error = ref('');
let version = 0; let controller: AbortController | null = null;
function clear() { version++; controller?.abort(); children.value = []; error.value = ''; }
async function refresh() { clear(); if (auth.profile?.role !== 'Parent') return; const current = version; controller = new AbortController(); try { const result = await listStudents('Parent', { signal: controller.signal }); if (current === version) children.value = result.rows; } catch (cause) { if (current === version) error.value = cause instanceof Error ? cause.message : '孩子列表刷新失败'; } }
watch(() => [auth.profile?.id, auth.profile?.role, auth.sessionRevision], clear, { flush: 'sync' }); onUnmounted(clear);
</script>
<template><section class="account-settings"><h1>账号与设置</h1><p>{{ auth.profile?.displayName }}</p><BindChild @refresh="refresh" /><p v-if="error" role="alert">{{ error }}</p><p v-for="child in children" :key="child.id"><RouterLink :to="`/students/${encodeURIComponent(child.id)}`">{{ child.displayName }}</RouterLink></p><section><h2>本机连接设置</h2><p>连接设置按当前账号隔离，密钥只保存在本机。</p><div class="actions"><a :href="legacy.link('settings', '/console/account')">DeepSeek 密钥设置</a><a :href="legacy.link('voice-settings', '/console/account')">语音 Key 设置</a><a v-if="auth.profile?.role === 'Admin'" :href="legacy.link('classroom', '/console/account')">管理员课堂试用</a></div></section><section><h2>交互音效</h2><p>此设备所有账号共用，不影响课程朗读。</p><button v-if="soundReady" type="button" :aria-pressed="soundEnabled" @click="toggleSound">音效：{{ soundEnabled ? '开' : '关' }}</button><p v-if="soundError" role="alert">{{ soundError }} <button type="button" @click="prepareSounds">重试</button></p></section><button type="button" @click="auth.resetStore()">退出账号</button><p v-if="auth.logoutError" role="alert">退出未完成，请重试。</p></section></template>
<style scoped>.account-settings{max-width:60rem}.account-settings section{margin-block:1.5rem}.actions{display:flex;flex-wrap:wrap;gap:1rem}a,button{overflow-wrap:anywhere}button{padding:.6rem 1rem;border:1px solid #a8b8aa;border-radius:.4rem}h2{font-size:1.1rem;font-weight:600}</style>
