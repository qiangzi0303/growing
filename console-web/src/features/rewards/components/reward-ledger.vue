<script setup lang="ts">
import { NTable } from 'naive-ui';
import { rewardAmount } from '../api';
import type { RewardReport, StudentIdentity } from '../api';
import ConfirmReward from './confirm-reward.vue';
defineProps<{ student: StudentIdentity; rewards: RewardReport }>(); defineEmits<{ refresh: [] }>();
</script>
<template>
  <section class="ledger">
    <section><h2>设备累计摘要</h2><p>来自已同步设备；与下方云端确认账本独立，不相加。</p>
      <div v-if="rewards.summaries.length" class="table-scroll" role="region" aria-label="设备累计摘要表" tabindex="0"><NTable size="small" :bordered="false" :single-line="true" class="reward-table">
        <thead><tr><th scope="col">单元</th><th scope="col">现金</th><th scope="col">游戏时间</th><th scope="col">备注</th></tr></thead>
        <tbody><tr v-for="summary in rewards.summaries" :key="summary.unit"><th scope="row">{{ summary.unit }}</th><td>{{ rewardAmount('cash', summary.paidCash) }}</td><td>{{ summary.paidGame }} 分钟</td><td>{{ summary.legacy ? '旧版汇总' : '—' }}</td></tr></tbody>
      </NTable></div><p v-else>暂无设备汇总</p>
    </section>
    <section><h2>设备奖励明细</h2>
      <div v-if="rewards.entries.length" class="table-scroll" role="region" aria-label="设备奖励明细表" tabindex="0"><NTable size="small" :bordered="false" :single-line="true" class="reward-table">
        <thead><tr><th scope="col">单元</th><th scope="col">奖励类型</th><th scope="col">奖励数额</th><th scope="col">确认状态 / 操作</th></tr></thead>
        <tbody><tr v-for="entry in rewards.entries" :key="entry.documentKey + entry.hash"><th scope="row">{{ entry.unit }}</th><td>{{ entry.kind === 'cash' ? '现金' : '游戏时间' }}</td><td>{{ rewardAmount(entry.kind, entry.amount) }}</td><td><ConfirmReward :student="student" :entry="entry" @refresh="$emit('refresh')" /></td></tr></tbody>
      </NTable></div><p v-else>暂无可确认明细</p><p v-if="rewards.invalid">有 {{ rewards.invalid }} 条无法解析的设备记录。</p>
    </section>
    <section><h2>云端确认账本</h2><p>确认只记录已兑现奖励，不触发付款或游戏控制。</p>
      <div v-if="rewards.confirmations.length" class="table-scroll" role="region" aria-label="云端确认账本表" tabindex="0"><NTable size="small" :bordered="false" :single-line="true" class="reward-table">
        <thead><tr><th scope="col">奖励类型</th><th scope="col">奖励数额</th><th scope="col">确认家长</th><th scope="col">确认时间</th></tr></thead>
        <tbody><tr v-for="row in rewards.confirmations" :key="row.id"><td>{{ row.kind === 'cash' ? '现金' : '游戏时间' }}</td><td>{{ rewardAmount(row.kind, row.amount) }}</td><td>{{ row.parentName }}</td><td>{{ row.confirmedAt }}</td></tr></tbody>
      </NTable></div><p v-else>暂无确认记录</p><p>{{ rewards.note }}</p>
    </section>
  </section>
</template>
<style scoped>
.ledger { display: grid; gap: 24px; min-width: 0; } h2 { margin: 0 0 12px; font-size: 20px; } p { overflow-wrap: anywhere; }
.ledger > section { min-width: 0; }
.table-scroll { min-width: 0; overflow-x: auto; border: 1px solid #e0e7e1; border-radius: 6px; background: white; }
.table-scroll:focus-visible { outline: 2px solid #38694f; outline-offset: 2px; }
.reward-table { min-width: 720px; }
.reward-table :deep(th), .reward-table :deep(td) { padding: 12px 16px; vertical-align: top; overflow-wrap: anywhere; }
.reward-table :deep(thead th) { background: #f3f7f4; color: #53665a; }
</style>
