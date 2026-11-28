<script setup>
import {ref,onMounted,onUpdated} from 'vue';
const root=ref();let currentMode=false;
function buttons(){return [...root.value.querySelectorAll('button:not(:disabled)')];}
function update(){const all=buttons(),current=all.find(button=>button.hasAttribute('aria-current'));if(current)currentMode=true;const active=current||(!currentMode&&all.find(button=>button.getAttribute('aria-pressed')==='true'))||all[0];for(const button of all){button.tabIndex=button===active?0:-1;if(currentMode)button.setAttribute('aria-pressed',String(button===current));}}
onMounted(update);onUpdated(update);
function move(event){if(event.isComposing||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const all=buttons(),index=all.indexOf(document.activeElement);if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?all.length-1:(index+(event.key==='ArrowRight'?1:all.length-1))%all.length;all[next].focus({preventScroll:true});all[next].scrollIntoView?.({block:'nearest',inline:'nearest'});}
</script>
<template><nav ref="root" class="study-choice-group" role="group" @keydown="move"><slot/></nav></template>
<style scoped>
.study-choice-group{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.study-choice-group :deep(button){transition:background-color .16s,border-color .16s,color .16s}.study-choice-group :deep(button:focus-visible){outline:2px solid var(--ui-accent,#38694f);outline-offset:2px}.study-choice-group :deep(button[aria-current]),.study-choice-group :deep(button[aria-pressed=true]){background:var(--ui-accent,#38694f);border-color:var(--ui-accent,#38694f);color:#fff}@media(prefers-reduced-motion:reduce){.study-choice-group :deep(button){transition:none}}
</style>
