<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NModal } from 'naive-ui';
import { api } from '@/service/request';
import { useParentAction } from '@/features/family/use-parent-action';
import { rewardAmount } from '../api';
import type { RewardReport, StudentIdentity } from '../api';
const props = defineProps<{ student: StudentIdentity; entry: RewardReport['entries'][number] }>(); const emit = defineEmits<{ refresh: [] }>(); const open = ref(false);
const { auth, pending, message, run } = useParentAction(() => `${props.student.id}:${props.entry.hash}`, () => { open.value = false; });
function confirm() { if (props.entry.confirmation) return; void run(async signal => { const result = await api<{ alreadyConfirmed: boolean }>(`/parent/children/${encodeURIComponent(props.student.id)}/confirm-redemption`, { method: 'POST', body: JSON.stringify({ documentKey: props.entry.documentKey, hash: props.entry.hash, confirm: true }), signal }); if (!signal.aborted) { message.value = result.alreadyConfirmed ? '这条奖励已确认，已重新加载账本。' : '已记账，已重新加载账本。'; emit('refresh'); } }); }
</script>
<template><span v-if="entry.confirmation">已确认</span><template v-else-if="auth.profile?.role === 'Parent'"><NButton :disabled="pending" @click="open = true">确认兑现</NButton><p role="status">{{ message }}</p><NModal :show="open" preset="dialog" title="确认奖励已兑现" :content="`确认已向 ${student.displayName} 兑现 ${rewardAmount(entry.kind, entry.amount)}？此操作只记录账本，不会自动转账，也不会控制游戏时长。`" positive-text="确认已兑现" negative-text="取消" :positive-button-props="{ disabled: pending }" :mask-closable="!pending" :closable="!pending" @update:show="value => { if (!pending) open = value; }" @positive-click="confirm" /></template></template>
