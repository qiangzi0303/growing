<script setup>
import {computed,ref,onBeforeUnmount} from 'vue';
const props=defineProps({nodeId:String,guide:Object});
const lab=window.GrowingMathLab,experiment=lab?.experiments.find(e=>e.id===props.guide.lab);
const initial=()=>({...lab.defaults(experiment),...(props.nodeId==='rhombus'?{type:1}:props.nodeId==='square'?{size:1}:{})});
const values=ref(experiment?initial():{}),expanded=ref(false),playing=ref(false);
const result=computed(()=>experiment?lab.evaluate(experiment,values.value):null);
let frame=0,start=0,origin=0;
const preferred=props.guide.lab==='special-quads'?'size':['probability','frequency-prob'].includes(props.nodeId)?'trials':null;
const control=experiment?.controls.find(c=>c.key===preferred)||experiment?.controls.find(c=>c.max-c.min>1)||experiment?.controls[0];
function pause(){playing.value=false;cancelAnimationFrame(frame);}
function tick(time){if(!playing.value)return;const c=control,span=c.max-c.min,p=(origin+(time-start)/8000)%2,value=c.min+(p<=1?p:2-p)*span;values.value={...values.value,[c.key]:Math.max(c.min,Math.min(c.max,c.min+Math.round((value-c.min)/c.step)*c.step))};frame=requestAnimationFrame(tick);}
function play(){if(playing.value){pause();return;}start=performance.now();origin=(values.value[control.key]-control.min)/(control.max-control.min);playing.value=true;frame=requestAnimationFrame(tick);}
function change(key,value){pause();values.value={...values.value,[key]:Number(value)};}
function reset(){pause();values.value=initial();}
function visibility(){if(document.hidden)pause();}
document.addEventListener('visibilitychange',visibility);
onBeforeUnmount(()=>{pause();document.removeEventListener('visibilitychange',visibility);});
</script>
<template>
 <section v-if="experiment" class="math-inline-lab" :data-inline-lab="guide.lab" aria-label="动手观察">
  <header><h3>动手观察 · {{experiment.name}}</h3><button @click="expanded=!expanded" :aria-pressed="expanded">{{expanded?'适应屏幕':'放大图示'}}</button></header>
  <p>{{guide.explore||experiment.goal}}</p>
  <div class="inline-lab-scroll" :class="{expanded}" tabindex="0" aria-label="数学图示，放大后可横向滚动"><svg viewBox="0 0 720 360" role="img" :aria-label="experiment.name"><defs><clipPath id="plot-clip"><rect x="55" y="45" width="610" height="275"/></clipPath></defs><g v-html="result.svg"/></svg></div>
  <dl class="inline-lab-stats"><div v-for="[label,value] in result.stats" :key="label"><dt>{{label}}</dt><dd>{{value}}</dd></div></dl>
  <p class="inline-lab-caption" aria-label="观察结论">{{result.conclusion}}</p>
  <div class="inline-lab-controls"><label v-for="c in experiment.controls" :key="c.key">{{c.label}} <output>{{values[c.key]}}</output><input type="range" :aria-label="c.label" :min="c.min" :max="c.max" :step="c.step" :value="values[c.key]" @input="change(c.key,$event.target.value)"></label></div>
  <footer><button @click="play" :aria-pressed="playing">{{playing?'暂停变化':'自动变化'}}</button><button @click="reset">重置</button><span>观察帮助理解，推理依据见本节讲解。</span></footer>
 </section>
</template>
<style scoped>
.math-inline-lab{background:#112b3b;color:#edf5fa;border-radius:16px;padding:20px;margin:22px 0;min-width:0;overflow:hidden;line-height:1.7}.math-inline-lab header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.math-inline-lab h3{margin:0;font-size:18px}.math-inline-lab p{margin:12px 0}.math-inline-lab button{font:inherit;font-size:14px;color:#f2f7ff;background:#24475b;border:1px solid #6d92a8;border-radius:7px;min-height:42px;padding:6px 12px;cursor:pointer}.math-inline-lab button:focus-visible,.math-inline-lab input:focus-visible{outline:3px solid #ffd186;outline-offset:3px}.inline-lab-scroll{overflow:auto;max-width:100%}.inline-lab-scroll svg{display:block;width:100%;height:auto}.inline-lab-scroll.expanded svg{min-width:760px}.inline-lab-stats{display:flex;flex-wrap:wrap;gap:12px 26px;margin:12px 0}.inline-lab-stats dt{color:#b7d1e0;font-size:13px}.inline-lab-stats dd{margin:0;font-size:19px;color:#ffd186;overflow-wrap:anywhere}.inline-lab-caption{border-top:1px solid #3b5768;padding-top:12px}.inline-lab-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}.inline-lab-controls label{font-size:14px}.inline-lab-controls output{color:#ffd186;margin-left:8px}.inline-lab-controls input{display:block;width:100%;height:34px;accent-color:#79c6ff}.math-inline-lab footer{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}.math-inline-lab footer span{font-size:13px;color:#b7d1e0}@media(max-width:480px){.math-inline-lab{padding:14px}.inline-lab-controls{grid-template-columns:1fr}}
</style>
