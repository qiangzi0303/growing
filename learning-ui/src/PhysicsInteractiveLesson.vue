<script setup>
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { Button } from 'vant';
import { physicsLessonGuides } from './physics-lesson-guides.js';
const props=defineProps({nodeId:{type:String,required:true}});

const guide=physicsLessonGuides[props.nodeId];
const sound=['phy-source','phy-medium','phy-echo','phy-pitch','phy-loudness','phy-timbre','phy-noise','phy-ultrasound'].includes(props.nodeId);
const controller=window.GrowingStudentPhysicsLabs.create({params:new URLSearchParams({kind:sound?'sound':'explore',node:props.nodeId})});
if(sound&&controller.model.playing)controller.actions.play();
const m=shallowRef(controller.model),a=controller.actions;
const zoomed=ref(false);
const unsubscribe=controller.subscribe(value=>m.value=value);
onBeforeUnmount(()=>{unsubscribe();controller.destroy();});
// The classroom retains a hidden legacy diagram, so SVG ids must be distinct.
const svg=computed(()=>m.value.svg.replace(/id="([^"]+)"/g,'id="thermal-$1"').replace(/url\(#([^)]+)\)/g,'url(#thermal-$1)'));
const valueText=c=>Number(Number(m.value.state[c.key]).toFixed(c.step<.1?2:c.step<1?1:0));
function change(c,event){if(sound&&m.value.playing)a.play();a.change(c.key,c.type==='checkbox'?event.target.checked:event.target.value);}
function reset(){a.reset();if(sound&&m.value.playing)a.play();}
async function listen(){await a.listen();}
</script>

<template>
 <section class="thermal-lesson" aria-labelledby="thermal-claim" :data-thermal-node="nodeId" :data-physics-node="nodeId">
  <p class="thermal-eyebrow">{{sound?'声现象':m.chapter.title}} · 动手观察</p>
  <h3 id="thermal-claim">{{guide[0]}}</h3>
  <p class="thermal-question">{{guide[1]}}</p>
  <details class="thermal-prerequisite"><summary>先回忆哪些知识？</summary><p>{{guide[2]}}</p></details>
  <div class="thermal-diagram" :class="{zoomed}" v-html="svg" tabindex="0" role="region" aria-label="实验图示，放大后可左右滚动"/>
  <p v-if="zoomed" class="thermal-scroll-hint">左右滑动图示，查看完整刻度。</p>
  <div class="thermal-actions"><Button v-if="m.canPlay" type="primary" :disabled="nodeId==='phy-boiling'&&!m.state.heater" :aria-pressed="m.playing" @click="a.play">{{m.playing?'暂停观察':'播放过程'}}</Button><Button v-if="m.canPlay" :disabled="nodeId==='phy-boiling'&&!m.state.heater" @click="a.step">单步观察</Button><Button @click="reset">重置</Button><Button class="thermal-zoom" :aria-pressed="zoomed" @click="zoomed=!zoomed">{{zoomed?'完整图示':'放大图示'}}</Button></div>
  <p v-if="!m.canPlay" class="thermal-help">直接调整下方条件，观察图示与读数的变化。</p>
  <template v-if="sound">
   <div class="thermal-diagram" :class="{zoomed}"><svg viewBox="0 0 800 130" role="img" aria-label="接收位置的波形示意"><path d="M35 65H780" stroke="#426372" stroke-dasharray="5 5"/><path :d="m.wavePath" fill="none" stroke="#60e3e7" stroke-width="3"/></svg></div>
   <p class="thermal-help">{{m.waveNote}}</p>
   <div class="thermal-actions"><Button v-if="m.mode==='source'" @click="a.hold">{{m.state.sourceHeld?'松开声源':'按住声源'}}</Button><Button :disabled="m.mode==='hearing'" @click="listen">试听 6 秒</Button><Button v-if="['loudness','pitch','timbre'].includes(m.mode)" @click="a.listen(true)">A/B 试听</Button><Button @click="a.stop">停止声音</Button></div>
   <label for="physics-volume">试听音量 {{m.volume}}%<input id="physics-volume" class="physics-volume" type="range" min="0" max="100" step="5" :value="m.volume" @input="a.change('volume',Number($event.target.value))"></label>
   <p role="status" class="thermal-help">{{m.audioStatus}}</p>
  </template>
  <div class="thermal-stats"><div v-for="stat in m.stats" :key="stat[0]"><span>{{stat[0]}}</span><strong>{{stat[1]}}</strong><small v-if="stat[2]">{{stat[2]}}</small></div></div>
  <div class="thermal-controls">
   <div v-for="c in m.controls" :key="c.key" class="thermal-control">
    <template v-if="c.type==='range'"><label :for="'thermal-'+c.key">{{c.label}} <output>{{valueText(c)}}{{c.unit}}</output></label><input :id="'thermal-'+c.key" type="range" :min="c.min" :max="c.max" :step="c.step" :value="m.state[c.key]" @input="change(c,$event)"></template>
    <template v-else-if="c.type==='select'"><label :for="'thermal-'+c.key">{{c.label}}</label><select :id="'thermal-'+c.key" :value="m.state[c.key]" @change="change(c,$event)"><option v-for="[value,label] in c.options" :key="value" :value="value">{{label}}</option></select></template>
    <label v-else class="thermal-switch"><input type="checkbox" :checked="m.state[c.key]" @change="change(c,$event)">{{c.label}}</label>
   </div>
  </div>
  <Button v-if="m.action" @click="a.action">{{m.action}}</Button>
  <p v-if="m.notice" role="status" class="thermal-help">{{m.notice}}</p>
  <p class="thermal-conclusion">{{m.conclusion}}</p>
  <details class="thermal-help"><summary>怎么观察 · 模型说明</summary><p>{{m.tip}}</p><p>{{m.note}}</p><p>调整条件会暂停播放；用重置恢复本实验初始条件。图示与数值来自同一模型，不是实测证据。</p></details>
 </section>
</template>

<style scoped>
.thermal-lesson{--thermal-ink:#26372e;margin-bottom:26px;padding:22px;border:1px solid #cbd8ce;border-radius:14px;background:#f5f8f3;color:var(--thermal-ink);font:16px/1.7 system-ui,"Microsoft YaHei",sans-serif;min-width:0}.thermal-eyebrow{color:#22634b;font-size:14px;font-weight:600;margin:0}.thermal-lesson h3{font-size:23px;line-height:1.45;margin:8px 0 14px}.thermal-question{margin:0 0 14px}.thermal-prerequisite{margin-bottom:18px}.thermal-lesson summary{cursor:pointer;font-weight:600}.thermal-diagram{background:#102d3b;border-radius:10px;overflow-x:auto;overscroll-behavior-inline:contain}.thermal-diagram :deep(svg){display:block;width:100%;height:auto}.thermal-diagram.zoomed :deep(svg){min-width:620px}.thermal-zoom{display:none!important}.thermal-scroll-hint{display:none;font-size:13px;color:#526458;margin:4px 0}.thermal-actions{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.thermal-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;border-block:1px solid #dce4dc;padding:16px 0;margin-bottom:18px}.thermal-stats span,.thermal-stats small{display:block;color:#526458;font-size:13px}.thermal-stats strong{display:block;font-size:20px;line-height:1.5;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.thermal-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 24px}.thermal-control{min-width:0}.thermal-control label{display:block;font-weight:600}.thermal-control output{display:block;font-weight:400;font-variant-numeric:tabular-nums}.physics-volume,.thermal-control input[type=range]{display:block;width:100%;height:36px;margin:4px 0;accent-color:#22634b;cursor:pointer}.thermal-control select{display:block;width:100%;min-height:44px;font:inherit;color:inherit;border:1px solid #adbbaf;border-radius:8px;padding:8px;background:#fff;box-sizing:border-box}.thermal-switch{display:flex!important;align-items:center;gap:10px;min-height:44px}.thermal-switch input{width:20px;height:20px;accent-color:#22634b}.thermal-conclusion{font-weight:600;color:#22634b;margin:22px 0 12px}.thermal-help{font-size:14px;color:#526458}.thermal-lesson :is(input,select,summary):focus-visible,.thermal-diagram:focus-visible{outline:2px solid #22634b;outline-offset:3px}@media(max-width:600px){.thermal-zoom{display:inline-flex!important}.thermal-lesson{padding:16px 12px}.thermal-lesson h3{font-size:20px}.thermal-controls{grid-template-columns:1fr}.thermal-stats{grid-template-columns:1fr;gap:12px}.thermal-stats>div{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;align-items:baseline}.thermal-stats small{grid-column:1/-1}.thermal-stats strong{font-size:18px}.thermal-scroll-hint{display:block}}
</style>
