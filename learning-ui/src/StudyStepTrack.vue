<script setup>
import {computed} from 'vue';
import CompletionMark from './CompletionMark.vue';
const props=defineProps({total:{type:Number,required:true},completed:{type:Number,default:0},current:{type:Number,default:-1},label:{type:String,required:true},pending:Boolean});
const count=computed(()=>Math.max(0,Math.min(props.total,props.completed)));
</script>
<template>
 <span class="study-step-track" role="img" :aria-label="`${label}：${count} / ${total}${current>=0&&current<total?'，当前第 '+(current+1)+' 步':''}${pending?'，保存未完成':''}`" :class="{'is-pending':pending}">
  <span v-for="n in total" :key="n" class="study-step-node" :class="{'is-current':n-1===current,'is-complete':n<=count}">
   <CompletionMark :done="n<=count" :label="n"/>
  </span>
 </span>
</template>
<style scoped>
.study-step-track{display:inline-flex;align-items:center;min-width:0;gap:0;vertical-align:middle}
.study-step-node{display:flex;align-items:center}
.study-step-node+.study-step-node::before{content:'';height:2px;width:clamp(6px,2vw,16px);background:var(--ui-line,#dce5de);transition:background-color .18s}
.study-step-node.is-complete+.study-step-node:is(.is-complete,.is-current)::before{background:var(--ui-accent,#38694f)}
.is-current :deep(.completion-mark){border-color:var(--ui-accent,#38694f);color:var(--ui-accent,#38694f);background:var(--ui-soft,#edf3ef);box-shadow:0 0 0 2px var(--ui-soft,#edf3ef);font-weight:700}
.is-pending{opacity:.55}
@media(prefers-reduced-motion:reduce){.study-step-node::before{transition:none}}
</style>
