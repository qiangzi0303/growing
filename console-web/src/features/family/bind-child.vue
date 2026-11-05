<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NCard, NInput } from 'naive-ui';
import { api } from '@/service/request';
import { useParentAction } from './use-parent-action';
const emit = defineEmits<{ refresh: [] }>(); const username = ref(''); const password = ref('');
const { auth, pending, message, run } = useParentAction(() => '', () => { username.value = ''; password.value = ''; });
function submit() { void run(async signal => { const name = username.value.trim(); const secret = password.value; if (!/^[\p{L}\p{N}_]{2,24}$/u.test(name) || secret.length < 8 || secret.length > 128) throw new Error('请输入有效孩子用户名和 8–128 位密码。'); await api('/parent/children/account', { method: 'POST', body: JSON.stringify({ studentUsername: name, studentPassword: secret }), signal }); if (!signal.aborted) { message.value = '已添加孩子，正在刷新孩子列表。'; emit('refresh'); } }); }
</script>
<template><NCard v-if="auth.profile?.role === 'Parent'" title="添加孩子" size="small"><p>使用孩子的学生账号验证并建立亲子关系。密码仅用于本次提交。</p><form @submit.prevent="submit"><NInput v-model:value="username" :disabled="pending" :input-props="{ 'aria-label': '孩子用户名', autocomplete: 'off' }" placeholder="孩子用户名" /><NInput v-model:value="password" type="password" :disabled="pending" :input-props="{ 'aria-label': '孩子密码', autocomplete: 'new-password' }" placeholder="孩子密码" /><NButton attr-type="submit" :disabled="pending">添加孩子</NButton></form><p role="status">{{ message }}</p></NCard></template>
<style scoped>form { display:grid;gap:12px;max-width:420px }</style>
