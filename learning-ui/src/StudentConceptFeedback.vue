<script setup>
import {computed} from 'vue';
const props=defineProps({result:{type:Object,required:true},legacy:{type:Boolean,default:false}});
// Split Chinese prose without breaking English examples or decimal scores.
const lines=text=>(text||'').match(/[^。！？；\n]+[。！？；]?/g)?.map(s=>s.trim()).filter(Boolean)||[];
const passed=computed(()=>props.legacy?props.result.score>=80:props.result.score>=8&&!props.result.criticalErrors?.length);
const summary=computed(()=>lines(props.legacy?props.result.comment:props.result.feedback));
const gaps=computed(()=>props.legacy?props.result.gap||[]:props.result.gaps||[]);
</script>
<template>
 <section class="concept-feedback" aria-label="AI评分反馈">
  <h3 class="concept-score" :class="passed?'concept-good':'concept-error'">{{result.score}}/{{legacy?100:10}} · {{passed?'本次概念解释达标':'继续补充后重试'}}</h3>
  <section v-if="summary.length"><h4>评分说明</h4><ol><li v-for="(line,i) in summary" :key="i">{{line}}</li></ol></section>
  <section v-if="legacy&&result.good?.length" class="concept-good"><h4>✓ 讲清楚的地方</h4><ol><li v-for="(item,i) in result.good" :key="i">{{item}}</li></ol></section>
  <section v-if="gaps.length" class="concept-gap"><h4>△ 待巩固与遗漏</h4><ol><li v-for="(item,i) in gaps" :key="i">{{item}}</li></ol></section>
  <section v-if="result.criticalErrors?.length" class="concept-error"><h4>✗ 核心错误 · 优先纠正</h4><ol><li v-for="(item,i) in result.criticalErrors" :key="i">{{item}}</li></ol></section>
  <section v-if="legacy&&result.question"><h4>老师追问</h4><ol><li>{{result.question}}</li></ol></section>
 </section>
</template>
<style scoped>
.concept-feedback{margin-top:28px;line-height:1.8;font-size:16px;overflow-wrap:anywhere}
.concept-feedback .concept-score{font-size:22px;line-height:1.5;margin:0 0 24px;font-weight:700}
.concept-feedback section+section{margin-top:24px}
.concept-feedback h4{font-size:16px;font-weight:700;margin:0 0 12px}
.concept-feedback ol{list-style:decimal outside!important;padding:0 0 0 1.8em!important;margin:0!important}
.concept-feedback li{display:list-item!important;padding:0 0 0 4px;margin:0 0 14px}
.concept-feedback li::marker{font-weight:700;color:inherit}
.concept-good{color:#15803d}.concept-gap{color:#9a3412}.concept-error{color:#b91c1c}
@media(max-width:650px){.concept-feedback{font-size:16px}.concept-feedback .concept-score{font-size:20px}}
</style>
