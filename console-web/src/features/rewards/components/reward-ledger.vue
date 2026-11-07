<script setup lang="ts">
import { h } from 'vue';
import { NDataTable, NEmpty } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { rewardAmount } from '../api';
import type { RewardReport, StudentIdentity } from '../api';
import ConfirmReward from './confirm-reward.vue';
const props = defineProps<{ student: StudentIdentity; rewards: RewardReport }>();
const emit = defineEmits<{ refresh: [] }>();
const summaryColumns: DataTableColumns<RewardReport['summaries'][number]> = [
  { title: '单元', key: 'unit', width: 200 },
  { title: '现金', key: 'paidCash', render: row => rewardAmount('cash', row.paidCash) },
  { title: '游戏时间', key: 'paidGame', render: row => `${row.paidGame} 分钟` },
  { title: '备注', key: 'legacy', render: row => row.legacy ? '旧版汇总' : '—' }
];
const entryColumns: DataTableColumns<RewardReport['entries'][number]> = [
  { title: '单元', key: 'unit', width: 200 },
  { title: '奖励类型', key: 'kind', width: 140, render: row => row.kind === 'cash' ? '现金' : '游戏时间' },
  { title: '奖励数额', key: 'amount', width: 160, render: row => rewardAmount(row.kind, row.amount) },
  { title: '确认状态 / 操作', key: 'actions', width: 220, fixed: 'right', render: entry => h(ConfirmReward, { student: props.student, entry, onRefresh: () => emit('refresh') }) }
];
const confirmationColumns: DataTableColumns<RewardReport['confirmations'][number]> = [
  { title: '奖励类型', key: 'kind', width: 140, render: row => row.kind === 'cash' ? '现金' : '游戏时间' },
  { title: '奖励数额', key: 'amount', width: 160, render: row => rewardAmount(row.kind, row.amount) },
  { title: '确认家长', key: 'parentName', width: 160 },
  { title: '确认时间', key: 'confirmedAt', width: 260 }
];
</script>
<template>
  <section class="ledger">
    <section><h2>设备累计摘要</h2><p>来自已同步设备；与下方云端确认账本独立，不相加。</p>
      <NDataTable v-if="rewards.summaries.length" aria-label="设备累计摘要表" size="small" :columns="summaryColumns" :data="rewards.summaries" :row-key="row => row.unit" :scroll-x="720" />
      <NEmpty v-else description="暂无设备汇总" />
    </section>
    <section><h2>设备奖励明细</h2>
      <NDataTable v-if="rewards.entries.length" aria-label="设备奖励明细表" size="small" :columns="entryColumns" :data="rewards.entries" :row-key="row => row.documentKey + row.hash" :scroll-x="720" />
      <NEmpty v-else description="暂无可确认明细" /><p v-if="rewards.invalid">有 {{ rewards.invalid }} 条无法解析的设备记录。</p>
    </section>
    <section><h2>云端确认账本</h2><p>确认只记录已兑现奖励，不触发付款或游戏控制。</p>
      <NDataTable v-if="rewards.confirmations.length" aria-label="云端确认账本表" size="small" :columns="confirmationColumns" :data="rewards.confirmations" :row-key="row => row.id" :scroll-x="720" />
      <NEmpty v-else description="暂无确认记录" /><p>{{ rewards.note }}</p>
    </section>
  </section>
</template>
<style scoped>
.ledger { display: grid; gap: 24px; min-width: 0; } h2 { margin: 0 0 12px; font-size: 20px; } p { overflow-wrap: anywhere; }
.ledger > section { min-width: 0; }
</style>