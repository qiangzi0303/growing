<script setup>
import {ref,watch} from 'vue';
const props=defineProps({done:Boolean,label:[String,Number]});
const changed=ref(false);
// Existing completed records render quietly; only a live completion animates.
watch(()=>props.done,(done,previous)=>{changed.value=done&&!previous;});
</script>
<template>
 <span class="completion-mark" :class="{'is-done':done,'just-completed':changed}" aria-hidden="true">
  <svg v-if="done" viewBox="0 0 20 20"><path d="m4 10 4 4 8-8" pathLength="1"/></svg><span v-else>{{label}}</span>
 </span>
</template>
<style scoped>
.completion-mark{display:inline-grid;place-items:center;box-sizing:border-box;flex:0 0 22px;width:22px;height:22px;border:1px solid var(--ui-control,#b9c6bf);border-radius:50%;color:var(--ui-muted,#5e6b63);font-size:12px;line-height:1;background:var(--ui-surface,#fff);transition:background-color .18s,border-color .18s}
.completion-mark.is-done{color:#fff;background:var(--ui-accent,#38694f);border-color:var(--ui-accent,#38694f)}
.completion-mark svg{display:block;width:16px;height:16px;background:transparent;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.just-completed{animation:completion-pop .25s ease-out}.just-completed path{stroke-dasharray:1;animation:completion-check .22s ease-out both}
@keyframes completion-pop{50%{transform:scale(1.12)}}
@keyframes completion-check{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@media(prefers-reduced-motion:reduce){.completion-mark,.completion-mark path{animation:none;transition:none}}
</style>
