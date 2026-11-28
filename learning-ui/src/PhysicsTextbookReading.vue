<script setup>
defineProps({reading:{type:Object,required:true},part:{type:String,default:'concepts'}});
</script>

<template>
 <section class="textbook-reading" :data-textbook-part="part" :aria-label="part==='concepts'?'教材概念':'教材讲解与实验'">
  <template v-if="part==='concepts'">
   <header class="reading-heading"><h3>先读懂概念</h3><span>教材梳理</span></header>
   <p class="reading-conclusion">{{reading.conclusion}}</p>
   <dl class="concept-list"><div v-for="[term,text] in reading.concepts" :key="term"><dt>{{term}}</dt><dd>{{text}}</dd></div></dl>
   <div class="study-focus" aria-label="本知识点学习重点">
    <section v-if="reading.examPoints?.length" class="focus-panel exam-focus" aria-label="易考点"><h3>易考点</h3><ol><li v-for="[title,text] in reading.examPoints" :key="title"><strong>{{title}}</strong><p>{{text}}</p></li></ol></section>
    <section v-if="reading.mistakes?.length" class="focus-panel mistake-focus" aria-label="易错点"><h3>易错点</h3><ol><li v-for="[title,text] in reading.mistakes" :key="title"><strong>{{title}}</strong><p>{{text}}</p></li></ol></section>
   </div>
   <p class="observe-guide"><strong>带着问题看动画</strong>{{reading.observe}}</p>
  </template>
  <template v-else>
   <section v-if="reading.comparison" class="reading-section">
    <h3>{{reading.comparison.title}}</h3>
    <table><thead><tr><th v-for="heading in reading.comparison.headers" :key="heading" scope="col">{{heading}}</th></tr></thead><tbody><tr v-for="(row,i) in reading.comparison.rows" :key="i"><th scope="row">{{row[0]}}</th><td v-for="(cell,j) in row.slice(1)" :key="j">{{cell}}</td></tr></tbody></table>
   </section>
   <section v-for="section in reading.sections" :key="section.title" class="reading-section"><h3>{{section.title}}</h3><ul><li v-for="item in section.items" :key="item">{{item}}</li></ul></section>
  </template>
 </section>
</template>

<style scoped>
.textbook-reading{font-size:15px;line-height:1.95;color:var(--ui-ink,#203c38);margin:0 0 30px;overflow-wrap:anywhere}
.reading-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.reading-heading h3,.reading-section h3{font-size:18px;line-height:1.5;margin:0 0 14px}.reading-heading span{font-size:12px;color:var(--ui-muted,#586b64)}
.textbook-reading .reading-conclusion{padding:14px 18px;border-left:3px solid var(--ui-accent,#38674f);background:var(--ui-soft,#f3f6f1);margin:0 0 18px;font-weight:600}
.concept-list{margin:0}.concept-list>div{display:grid;grid-template-columns:7em minmax(0,1fr);gap:18px;padding:13px 0;border-bottom:1px solid var(--ui-line,#dfe7df)}.concept-list dt{font-weight:700}.concept-list dd{margin:0}
.observe-guide{margin:20px 0 0}.observe-guide strong{display:block;font-size:13px;color:var(--course-brown,#92552e);margin-bottom:5px}
.study-focus{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:24px}.focus-panel{padding:18px;border-radius:8px;border-top:3px solid currentColor}.exam-focus{background:#edf5fc;color:#174e78}.mistake-focus{background:#fff2ec;color:#963c22}.focus-panel h3{font-size:18px;color:inherit;margin:0 0 14px}.focus-panel ol{margin:0;padding-left:1.4em}.focus-panel li+li{margin-top:16px}.focus-panel li::marker{font-weight:700}.focus-panel strong{color:inherit;font-size:15px}.textbook-reading .focus-panel p{margin:4px 0 0;color:#293e46;line-height:1.8;font-size:14px}
@media(max-width:700px){.study-focus{grid-template-columns:minmax(0,1fr)}.focus-panel{padding:16px}}
.reading-section{padding-top:26px}.reading-section ul{margin:0;padding-left:1.3em}.reading-section li+li{margin-top:10px}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:14px}th,td{text-align:left;vertical-align:top;padding:11px 12px;border-bottom:1px solid var(--ui-line,#dfe7df);overflow-wrap:anywhere}thead{background:var(--ui-soft,#f3f6f1)}tbody th{font-weight:500}th:first-child{width:25%}
@media(max-width:600px){.concept-list>div{grid-template-columns:minmax(0,1fr);gap:3px}.reading-heading h3,.reading-section h3{font-size:17px}th,td{padding:9px 7px;font-size:13px}.textbook-reading .reading-conclusion{padding:12px}.textbook-reading{line-height:1.9}}
</style>
