<script setup>
import {ref,watch,onBeforeUnmount} from 'vue';
import {Button} from 'vant';
import 'vant/es/button/style';
defineOptions({inheritAttrs:false});
const props=defineProps({loading:Boolean,failed:Boolean,cancelled:Boolean,resultKey:[String,Number,Object],contextKey:String,successText:{type:String,default:'已保存'},retryText:{type:String,default:'重试'},loadingText:{type:String,default:'处理中…'}});
const feedback=ref('');
let timer,baseline=props.resultKey;
function clear(){clearTimeout(timer);feedback.value='';}
function complete(){clear();feedback.value='success';timer=setTimeout(clear,1800);}
// Only a new, persisted result can acknowledge success. Busy ending alone
// means the user can try again; explicit cancellation stays neutral.
watch(()=>[props.loading,props.resultKey,props.contextKey,props.failed,props.cancelled],([busy,result,context,failed,cancelled],[wasBusy,previous,oldContext])=>{
 if(context!==oldContext){clear();baseline=result;return;}
 if(cancelled){clear();baseline=result;return;}
 if(busy){if(!wasBusy){clear();baseline=previous;}return;}
 if(failed){clear();feedback.value='retry';return;}
 if((wasBusy&&result!==baseline||!wasBusy&&result!==previous)&&result!=null){complete();return;}
 if(wasBusy){clear();feedback.value='retry';}
});
onBeforeUnmount(clear);
</script>
<template>
 <Button v-bind="$attrs" class="action-feedback" :data-feedback="loading?'loading':feedback||'idle'" :loading="loading" :loading-text="loadingText" :aria-busy="loading">
  <span class="action-feedback-label" :class="{'is-hidden':!!feedback}" :aria-hidden="feedback?true:undefined"><slot/></span>
  <span v-if="feedback" class="action-feedback-result" role="status" aria-live="polite">
   <svg v-if="feedback==='success'" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8" pathLength="1"/></svg>
   <svg v-else viewBox="0 0 20 20" aria-hidden="true"><path d="M15.5 7A6 6 0 1 0 16 12M15.5 3.5V7H12"/></svg>
   {{feedback==='success'?successText:retryText}}
  </span>
 </Button>
</template>
<style scoped>
.action-feedback{position:relative;min-inline-size:7.5em;transition:background-color .16s,border-color .16s}
.action-feedback-label.is-hidden{visibility:hidden}
.action-feedback-result{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;font:inherit;pointer-events:none}
.action-feedback-result svg{width:18px;height:18px;background:transparent;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
[data-feedback=success] .action-feedback-result path{stroke-dasharray:1;animation:action-check .24s ease-out both}
@keyframes action-check{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@media(prefers-reduced-motion:reduce){.action-feedback{transition:none}.action-feedback-result path{animation:none!important}}
</style>
