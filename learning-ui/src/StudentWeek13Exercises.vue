<script setup>
import {computed,onMounted,nextTick} from 'vue';
import {Button} from 'vant';
import {courseMathHtml} from './course-math.js';
const props=defineProps({unit:{type:String,default:'all'},node:{type:String,default:''},wrongOnly:Boolean});
const source=window.GrowingWeek13;
const rows=computed(()=>source?.questions(props.unit,props.node,props.wrongOnly)||[]);
const math=value=>courseMathHtml(value,window.GrowingMathFormat);
onMounted(async()=>{await nextTick();const q=rows.value.find(q=>location.hash==='#question-'+q.id);if(q){const card=document.getElementById('question-'+q.id);if(card){card.open=true;card.scrollIntoView({block:'start'});}}});
</script>
<template>
 <section v-if="rows.length" class="week13-exercises" :aria-label="wrongOnly?'第十三周周练原卷错题':'第十三周周练补充练习'">
  <h2>{{wrongOnly?'第十三周周练 · 原卷错题':'第十三周周练 · 补充练习'}} · {{rows.length}} 题</h2>
  <p v-if="wrongOnly">原卷已核实的错误或部分完成题，订正记录按当前账号保存。</p>
  <details v-for="q in rows" :key="q.id" :id="'question-'+q.id" class="week13-exercise" :data-question-id="q.id">
   <summary>第 {{q.number}} 题 · {{q.practice.nodeTitle}}</summary>
   <div :class="{'original-wrong':wrongOnly}"><p v-html="math(q.body)"/><ol v-if="q.options.length"><li v-for="(option,i) in q.options" :key="i"><span>{{'ABCD'[i]}}. </span><span v-html="math(option)"/></li></ol><ol v-if="q.parts.length"><li v-for="(part,i) in q.parts" :key="i"><span>（{{i+1}}）</span><span v-html="math(part)"/></li></ol></div>
   <div class="week13-figures"><img v-for="src in q.figures" :key="src" :src="src" :alt="'第'+q.number+'题题图'" loading="lazy"/></div>
   <p v-if="q.review" role="note">{{q.review}}</p>
   <div class="course-actions"><Button tag="a" :href="source.paperHref(q)">查看试卷</Button><Button v-if="!q.review" tag="a" :href="source.writingHref(q)">拍照 / 手写解答</Button></div>
  </details>
 </section>
</template>
<style scoped>
.week13-exercises{margin-top:28px;border-top:1px solid #d7ded8;padding-top:16px}.week13-exercise{border-bottom:1px solid #d7ded8;padding:16px 0}.week13-exercise summary{cursor:pointer;font-weight:600;line-height:1.8}.week13-figures{display:flex;flex-wrap:wrap;gap:16px}.week13-figures img{width:280px;max-width:100%;max-height:290px;object-fit:contain}.original-wrong{color:#b42318}.week13-exercise li{margin:8px 0}
</style>
