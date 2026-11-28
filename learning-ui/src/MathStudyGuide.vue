<script setup>
import {computed} from 'vue';
import {mathProofStories} from './math-proof-model.js';
import {courseMathHtml} from './course-math.js';
const props=defineProps({node:Object,guide:Object});
const lesson=computed(()=>mathProofStories[props.node.id]?.lesson);
const html=text=>courseMathHtml(text,window.GrowingMathFormat);
</script>
<template>
 <section class="math-study-guide" aria-label="本节概念与定义" :data-study-guide="node.id">
  <h3>概念与定义</h3>
  <template v-if="lesson">
   <dl><template v-for="[term,text] in lesson.definitions" :key="term"><dt>{{term}}</dt><dd v-html="html(text)"/></template></dl>
   <p class="study-formula" v-html="html(lesson.formula)"/><p v-html="html(lesson.symbols)"/><p><strong>适用条件：</strong><span v-html="html(lesson.condition)"/></p>
  </template>
  <p v-else class="study-definition" v-html="html(node.review)"/>
  <dl v-if="guide.terms"><template v-for="[term,text] in guide.terms" :key="term"><dt>{{term}}</dt><dd v-html="html(text)"/></template></dl>
  <div class="study-focus-grid">
   <section v-for="kind in ['exam','mistake']" :key="kind" class="study-focus" :class="kind" :aria-label="kind==='exam'?'易考点':'易错点'">
    <h4>{{kind==='exam'?'易考点':'易错点'}}</h4><p v-html="html(guide[kind].text)"/>
   </section>
  </div>
 </section>
</template>
<style scoped>
.math-study-guide{margin-bottom:24px;line-height:1.8;overflow-wrap:anywhere}.math-study-guide h3{font-size:20px;margin:0 0 14px}.math-study-guide p{margin:8px 0}.math-study-guide dl{margin:12px 0}.math-study-guide dt{font-weight:700}.math-study-guide dd{margin:0 0 12px}.study-formula{font-size:23px;font-weight:700}.study-focus-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:20px}.study-focus{border-left:4px solid;padding:14px 16px;border-radius:0 12px 12px 0;min-width:0}.study-focus h4{margin:0;font-size:16px}.study-focus.exam{background:#edf5ff;border-color:#2765aa;color:#174e84}.study-focus.mistake{background:#fff2e9;border-color:#bc4a24;color:#92391c}@media(max-width:640px){.study-focus-grid{grid-template-columns:1fr}.study-focus{padding:12px}.study-formula{font-size:20px}}
</style>
