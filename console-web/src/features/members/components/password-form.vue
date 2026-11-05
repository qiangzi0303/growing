<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NCard, NInput } from 'naive-ui';
import { api } from '@/service/request';
import type { Member } from '../api';
import { useMemberAction } from '../use-member-action';
const props = defineProps<{ member: Member }>();
const password = ref(''); const confirm = ref('');
function clear() { password.value = ''; confirm.value = ''; }
const { pending, message, run, active, auth } = useMemberAction(() => props.member, clear);
function save() {
  if (pending.value) return;
  if (password.value.length < 8 || password.value.length > 128 || !password.value.trim() || password.value !== confirm.value) { clear(); message.value = '密码需为8–128位且两次一致'; return; }
  const body = JSON.stringify({ newPassword: password.value, confirmPassword: confirm.value });
  void run(async signal => {
    const result = await api<{ reauthenticate: boolean }>(`/admin/members/${encodeURIComponent(props.member.id)}/password`, { method: 'POST', body, signal });
    if (!active(signal)) return;
    clear(); if (result.reauthenticate) auth.clearSession(); else message.value = '密码已修改，该会员需重新登录';
  });
}
</script>
<template><NCard title="修改密码" size="small"><p>修改后该会员所有设备需重新登录。</p><form @submit.prevent="save"><NInput v-model:value="password" type="password" :disabled="pending" :input-props="{ 'aria-label': '新密码', autocomplete: 'new-password', maxlength: 128 }" placeholder="新密码" /><NInput v-model:value="confirm" type="password" :disabled="pending" :input-props="{ 'aria-label': '确认密码', autocomplete: 'new-password', maxlength: 128 }" placeholder="确认密码" /><NButton attr-type="submit" :disabled="pending">保存密码</NButton></form><p role="status">{{ message }}</p></NCard></template>
