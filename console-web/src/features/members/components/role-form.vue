<script setup lang="ts">
import { ref } from 'vue';
import { NAlert, NButton, NCard, NModal } from 'naive-ui';
import { api } from '@/service/request';
import type { Member } from '../api';
import { useMemberAction } from '../use-member-action';
const props = defineProps<{ member: Member }>(); const emit = defineEmits<{ refresh: [notice?: string] }>();
const confirming = ref(false);
const { pending, message, run, active } = useMemberAction(() => props.member, () => { confirming.value = false; });
function save() {
  if (props.member.role === 'Admin') return;
  const expectedRole = props.member.role; const role = expectedRole === 'Student' ? 'Parent' : 'Student';
  void run(async signal => {
    try { await api(`/admin/members/${encodeURIComponent(props.member.id)}/role`, { method: 'POST', body: JSON.stringify({ expectedRole, role }), signal }); }
    catch (cause) { if (active(signal) && (cause as { status?: number }).status === 409) { emit('refresh', '账号身份已变化，已刷新资料，请重新确认。'); return; } throw cause; }
    if (active(signal)) emit('refresh');
  });
}
</script>
<template><NCard v-if="member.role !== 'Admin'" title="账号类型" size="small"><p>更改身份会解除原有亲子绑定、使绑定码失效并要求重新登录；学习历史和确认账本保留。</p><NButton :disabled="pending" @click="confirming = true">改为{{ member.role === 'Student' ? '家长' : '学生' }}</NButton><NAlert v-if="message" type="info" role="status">{{ message }}</NAlert><NModal v-model:show="confirming" preset="dialog" title="确认更改账号类型" :content="`更改 ${member.displayName} 的身份？原绑定将解除，绑定码失效，历史保留。`" positive-text="确认更改" negative-text="取消" :positive-button-props="{ disabled: pending }" :mask-closable="!pending" :closable="!pending" @positive-click="save" /></NCard></template>
