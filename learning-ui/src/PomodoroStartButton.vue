<script setup>
defineProps({label:{type:String,default:'开始番茄'}});
</script>

<template>
 <button type="button" class="pomodoro-start" data-action="start">
  <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 10C4 3 0 19 6 27c4 6 16 6 20 0 6-8 2-24-10-17Z" fill="currentColor" opacity=".13"/><path d="M16 10C4 3 0 19 6 27c4 6 16 6 20 0 6-8 2-24-10-17Z" stroke="currentColor" stroke-width="1.5"/><path d="M16 10V4m0 6-6-3m6 3 6-3m-6 3-4 3m4-3 4 3" stroke="#66816a" stroke-width="1.7" stroke-linecap="round"/></svg>
  <span>{{label}}</span>
 </button>
</template>

<style scoped>
.pomodoro-start{display:flex;align-items:center;justify-content:center;gap:10px;flex:0 0 126px;min-height:64px;border:1px solid #dce5de;background:#fff;border-radius:10px;padding:10px 14px;color:#5d6d62;white-space:nowrap;cursor:pointer;font:inherit}
.pomodoro-start svg{width:27px;height:30px;flex-shrink:0;color:#b26c56}
.pomodoro-start[data-action="start"]{min-height:64px}
.pomodoro-start span{font-size:13px;line-height:1.6;font-weight:400}
.pomodoro-start:focus-visible{outline:3px solid #38694f;outline-offset:-3px}
.pomodoro-start:disabled{cursor:wait;opacity:.65}
@media(max-width:760px){.pomodoro-start[data-action="start"]{min-height:52px;padding:6px 12px}.pomodoro-start span{line-height:1.4}}
</style>
