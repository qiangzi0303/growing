<script setup>
import {computed,ref,onBeforeUnmount} from 'vue';
import {thermalStories,thermalDefaults,thermalState,thermalCurve,clamp} from './thermal-story-model.js';
const props=defineProps({nodeId:{type:String,required:true}});
const story=thermalStories[props.nodeId],values=ref(thermalDefaults(props.nodeId)),progress=ref(0),playing=ref(false),expanded=ref(false);
const model=computed(()=>thermalState(props.nodeId,values.value,progress.value));
const stage=computed(()=>model.value.stage),kind=story.kind;
const freeze=computed(()=>kind==='melting'&&values.value.direction==='freeze');
const shots=computed(()=>freeze.value?[
 ['先让水降温','从20 °C的水开始，持续向外放热。'],['看见冰晶出现','纯水到0 °C后开始凝固，冰与水同时存在。'],['对照凝固平台','继续放热，冰增加、水减少，温度仍保持0 °C。'],['凝固完成之后','全部变成冰，再继续放热，冰温降到0 °C以下。']
]:story.shots);
const headline=computed(()=>freeze.value?'水在变成冰，仍要继续放热':story.title);
const question=computed(()=>freeze.value?'继续放热时，是温度降低，还是水变成冰？':story.question);
const caption=computed(()=>kind==='boiling'&&stage.value===1?'继续加热到100 °C。达到沸点，还需要持续供热才能沸腾。':kind==='boiling'&&!model.value.active?'热源已关闭：当前热量不再增加，不能维持沸腾。':shots.value[stage.value][1]);
let frame=0,last=0;
function pause(){playing.value=false;cancelAnimationFrame(frame);last=0;}
function tick(now){
 if(!playing.value)return;
 if(last)progress.value=Math.min(1,progress.value+Math.min(.08,(now-last)/1000)*(values.value.rate||1)/32);
 last=now;
 if(progress.value>=1){pause();return;}
 frame=requestAnimationFrame(tick);
}
function play(){if(playing.value){pause();return;}if(kind==='boiling'&&values.value.heater==='off')return;if(progress.value>=1)progress.value=0;playing.value=true;last=0;frame=requestAnimationFrame(tick);}
function seek(value){pause();progress.value=clamp(Number(value));}
function change(key,event){pause();values.value={...values.value,[key]:event.target.type==='range'?Number(event.target.value):event.target.value};}
function reset(){pause();progress.value=0;values.value=thermalDefaults(props.nodeId);}
function visibility(){if(document.hidden)pause();}
document.addEventListener('visibilitychange',visibility);
onBeforeUnmount(()=>{pause();document.removeEventListener('visibilitychange',visibility);});
const curve=computed(()=>thermalCurve(props.nodeId,values.value));
const maxTime=computed(()=>curve.value.at(-1)?.time||1);
const chartX=t=>485+260*t/maxTime.value,chartY=t=>306-(t+20)*1.65;
const graph=computed(()=>curve.value.filter(x=>x.p<=progress.value+.0001).map((x,i)=>(i?'L':'M')+chartX(x.time).toFixed(2)+' '+chartY(x.t).toFixed(2)).join(' '));
const graphFull=computed(()=>curve.value.map((x,i)=>(i?'L':'M')+chartX(x.time).toFixed(2)+' '+chartY(x.t).toFixed(2)).join(' '));
const waterTop=computed(()=>kind==='melting'?295-135*model.value.liquid:kind==='boiling'?160+100*model.value.gas:160);
const iceSize=computed(()=>Math.sqrt(1-model.value.liquid)*95);
const iceTop=computed(()=>Math.min(295-iceSize.value,waterTop.value-iceSize.value*.1));
const iceColor='#c9dce9';
const evapWidth=index=>index&&values.value.factor==='area'?110*values.value.strength:110;
const evapLevel=index=>300-(index?model.value.liquid:model.value.base)*120*110/evapWidth(index);
const particles=Array.from({length:24},(_,i)=>({x:105+(i%6)*24,y:140+Math.floor(i/6)*24,i}));
const drops=Array.from({length:16},(_,i)=>({x:170+(i%4)*24,y:145+Math.floor(i/4)*33,i}));
const dotX=i=>110+(i*71%175),dotY=i=>65+((i*37+progress.value*170)%120);
const focusTransform=computed(()=>stage.value===1&&['melting','boiling','condensation'].includes(kind)?'translate(-22 -35) scale(1.1)':'translate(0 0) scale(1)');
const heatUp=computed(()=>!freeze.value&&kind!=='cooling');
const canPlay=computed(()=>!(kind==='boiling'&&values.value.heater==='off'));
</script>

<template>
 <section class="thermal-story" :data-thermal-story="nodeId" :data-story-stage="stage" aria-label="物态变化分幕实验">
  <header class="story-header"><p>物态变化 <span>／</span> 分幕实验</p><h3>{{headline}}</h3><p class="story-question">{{question}}</p></header>
  <nav class="story-chapters" aria-label="实验分幕"><button v-for="(shot,i) in shots" :key="i" :aria-current="stage===i?'step':undefined" @click="seek(i/4)"><span>0{{i+1}}</span>{{shot[0]}}</button></nav>
  <div class="story-stage" :class="{expanded}">
   <div class="shot-heading"><span>第 {{stage+1}} 幕 · {{stage===1?'局部特写':stage===2?'追踪变化':stage===3?'回到全景':'观察现象'}}</span><strong>{{shots[stage][0]}}</strong></div>
   <div class="stage-scroll" tabindex="0" aria-label="实验舞台，放大时可横向滚动">
   <svg class="story-svg" viewBox="0 0 820 390" role="img" :aria-label="shots[stage][0]+'：'+model.status">
    <defs>
     <linearGradient id="thermal-story-water" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#6a9bcc" stop-opacity=".65"/><stop offset="1" stop-color="#6a9bcc" stop-opacity=".18"/></linearGradient>
     <pattern id="thermal-story-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#faf9f5" stroke-opacity=".035"/></pattern>
     <marker id="thermal-story-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill="#d97757"/></marker>
    </defs>
    <rect width="820" height="390" fill="url(#thermal-story-grid)"/>
    <template v-if="['melting','boiling','cooling','thermometer'].includes(kind)">
     <g class="focus-object" :transform="focusTransform">
      <path d="M113 110V283Q113 299 130 299H310Q327 299 327 283V110" fill="#faf9f5" fill-opacity=".025" stroke="#9dadaf" stroke-width="3"/>
      <path v-if="kind!=='melting'||model.liquid>0" :d="`M116 ${waterTop} Q221 ${waterTop-5} 324 ${waterTop} V295H116Z`" fill="url(#thermal-story-water)"/>
      <line x1="103" x2="338" y1="309" y2="309" stroke="#797e7e" stroke-width="4"/>
      <g v-if="kind==='melting'&&iceSize>.2" :transform="`translate(${220-iceSize/2} ${iceTop})`">
       <rect :width="iceSize" :height="iceSize" rx="7" :fill="iceColor" fill-opacity=".8" stroke="#e4eef4" stroke-width="2"/>
       <path :d="`M0 ${iceSize*.3}L${iceSize*.65} ${iceSize*.15}L${iceSize} ${iceSize*.4}M${iceSize*.65} ${iceSize*.15}L${iceSize*.6} ${iceSize}`" fill="none" stroke="#faf9f5" stroke-opacity=".6"/>
      </g>
      <g v-if="kind==='boiling'&&model.boiling">
       <circle v-for="i in 12" :key="i" :cx="145+(i*43%150)" :cy="285-((i*19+progress*450)%110)" :r="3+((i*19+progress*450)%110)/23" fill="none" stroke="#c9dce9" stroke-width="1.5" opacity=".8"/>
       <path v-for="i in 5" :key="'mist'+i" :d="`M${166+i*20} 102q-15 -16 0 -33t0 -31`" fill="none" stroke="#c9dce9" stroke-width="4" :opacity=".1+.13*Math.sin(progress*30+i)**2"/>
      </g>
      <g v-if="kind!=='thermometer'" class="energy-arrows" :opacity="kind==='boiling'&&!model.active ? .1 : 1">
       <path v-for="i in 3" :key="i" :d="heatUp?`M${170+i*25} 357V322`:`M${170+i*25} 320V357`" stroke="#d97757" stroke-width="2" marker-end="url(#thermal-story-arrow)"/>
       <text x="220" y="382" text-anchor="middle" fill="#d97757">{{kind==='boiling'&&!model.active?'停止供热':heatUp?'热量进入':'热量离开'}}</text>
      </g>
      <text v-if="kind!=='thermometer'" x="220" y="80" text-anchor="middle" fill="#faf9f5" class="object-value">{{model.temperature.toFixed(1)}} °C</text>
      <g v-if="kind==='thermometer'" :transform="values.placement==='outside'?'translate(-50 -65)':values.placement==='wall'?'translate(63 0)':''">
       <rect x="244" y="40" width="20" height="224" rx="9" fill="#faf9f5" fill-opacity=".1" stroke="#d4d9d9"/>
       <rect x="251" :y="250-model.temperature*2" width="6" :height="Math.max(1,model.temperature*2)" rx="2" fill="#d97757"/>
       <circle cx="254" cy="263" r="13" fill="#d97757"/>
       <g v-for="n in 11" :key="n"><line x1="264" :y1="250-(n-1)*20" x2="273" :y2="250-(n-1)*20" stroke="#b0aea5"/><text x="279" :y="254-(n-1)*20" fill="#b0aea5" font-size="12">{{(n-1)*10}}</text></g>
      </g>
      <text v-if="kind==='thermometer'" x="185" y="332" text-anchor="middle" fill="#6a9bcc">水温 {{values.water}} °C</text>
     </g>
     <g v-if="stage===1&&kind==='melting'" class="detail-note">
      <text x="465" y="110" fill="#faf9f5" font-size="25">冰水界面</text>
      <rect x="470" y="150" width="100" height="90" fill="#c9dce9" fill-opacity=".8" rx="5"/><path d="M570 150H720V240H570Z" fill="url(#thermal-story-water)"/>
      <line :x1="freeze?690:505" y1="195" :x2="freeze?505:690" y2="195" stroke="#d97757" stroke-width="3" marker-end="url(#thermal-story-arrow)"/>
      <text x="520" y="270" text-anchor="middle" fill="#c9dce9">固态</text><text x="660" y="270" text-anchor="middle" fill="#6a9bcc">液态</text>
      <text x="595" y="320" text-anchor="middle" fill="#d4a27f">0 °C · {{freeze?'水变少，冰变多':'冰变少，水变多'}}</text>
     </g>
     <g v-else-if="stage===1&&kind==='thermometer'">
      <text x="490" y="90" fill="#faf9f5" font-size="23">视线对齐液柱顶端</text>
      <rect x="535" y="120" width="40" height="160" rx="8" fill="#faf9f5" fill-opacity=".08" stroke="#b0aea5"/>
      <rect x="550" :y="270-model.temperature*1.5" width="10" :height="model.temperature*1.5" fill="#d97757"/>
      <line x1="565" :y1="270-model.temperature*1.5" x2="720" :y2="270-model.temperature*1.5+(values.eye==='above'?-65:values.eye==='below'?65:0)" stroke="#d4a27f" stroke-dasharray="6 5"/>
      <circle cx="725" :cy="270-model.temperature*1.5+(values.eye==='above'?-65:values.eye==='below'?65:0)" r="9" fill="none" stroke="#d4a27f"/>
      <text x="615" y="330" text-anchor="middle" fill="#d4a27f">{{values.eye==='level'?'平视：沿水平线观察':'有视差：请改为平视'}}</text>
     </g>
     <g v-else-if="stage===1&&kind==='cooling'">
      <text x="485" y="80" fill="#faf9f5" font-size="23">看清水与环境的温差</text>
      <path d="M515 300H715" stroke="#797e7e"/>
      <rect x="520" :y="300-model.temperature*2" width="55" :height="model.temperature*2" fill="#d97757" opacity=".8"/>
      <rect x="655" :y="300-values.room*2" width="55" :height="values.room*2" fill="#6a9bcc" opacity=".8"/>
      <text x="547" :y="287-model.temperature*2" text-anchor="middle" fill="#faf9f5">{{model.temperature.toFixed(1)}} °C</text>
      <text x="682" :y="287-values.room*2" text-anchor="middle" fill="#faf9f5">{{values.room}} °C</text>
      <text x="547" y="327" text-anchor="middle" fill="#d97757">水温</text><text x="682" y="327" text-anchor="middle" fill="#6a9bcc">室温</text>
      <text x="615" y="367" text-anchor="middle" fill="#d4a27f">温差 {{(model.temperature-values.room).toFixed(1)}} °C</text>
     </g>
     <g v-else class="temperature-chart">
      <text x="485" y="68" fill="#faf9f5" font-size="22">{{kind==='thermometer'?'液柱如何稳定':'把变化画成曲线'}}</text>
      <g v-for="t in [-20,0,50,100]" :key="t"><line x1="485" x2="745" :y1="chartY(t)" :y2="chartY(t)" stroke="#faf9f5" stroke-opacity=".1" stroke-dasharray="3 6"/><text x="472" :y="chartY(t)+5" text-anchor="end" fill="#b0aea5" font-size="14">{{t}}</text></g>
      <path d="M485 98V306H750" fill="none" stroke="#797e7e"/>
      <path :d="graphFull" fill="none" stroke="#6a9bcc" opacity=".15" stroke-dasharray="4 5"/>
      <path :d="graph" fill="none" stroke="#6a9bcc" stroke-width="3"/>
      <circle :cx="chartX(model.time)" :cy="chartY(model.temperature)" r="6" fill="#d97757"/>
      <line :x1="chartX(model.time)" :x2="chartX(model.time)" :y1="chartY(model.temperature)" y2="306" stroke="#d97757" opacity=".5" stroke-dasharray="4 4"/>
      <text x="485" y="88" fill="#b0aea5" font-size="14">温度 / °C</text><text x="745" y="337" text-anchor="end" fill="#b0aea5" font-size="14">时间 / {{kind==='cooling'?'min':'s'}}</text>
      <text x="485" y="326" fill="#b0aea5" font-size="13">0</text><text x="745" y="326" text-anchor="end" fill="#b0aea5" font-size="13">{{maxTime.toFixed(0)}}</text>
      <text v-if="kind==='melting'&&stage>=2" x="600" y="375" text-anchor="middle" fill="#d4a27f">平台上：温度不变，物态在变</text>
      <text v-if="kind==='boiling'&&stage>=2" x="600" y="375" text-anchor="middle" fill="#d4a27f">平台上：继续吸热，液态变气态</text>
     </g>
    </template>
    <template v-else-if="kind==='evaporation'">
     <g v-for="(side,index) in ['对照组','实验组']" :key="side" :transform="`translate(${index*390} 0)`">
      <text x="215" y="65" text-anchor="middle" fill="#faf9f5" font-size="24">{{side}}</text>
      <path :d="`M${212-evapWidth(index)/2} 155V303H${218+evapWidth(index)/2}V155`" fill="none" stroke="#9dadaf" stroke-width="3"/>
      <rect :x="215-evapWidth(index)/2" :y="evapLevel(index)" :width="evapWidth(index)" :height="300-evapLevel(index)" fill="url(#thermal-story-water)"/>
      <circle v-for="i in (index?Math.round(8*values.strength):8)" :key="i" :cx="215-evapWidth(index)/2+12+(i*29%(evapWidth(index)-24))" :cy="evapLevel(index)-((i*21+progress*210*(index?values.strength:1))%105)" r="3" fill="#d4a27f" :opacity="progress? .6:0"/>
      <path v-if="index&&values.factor==='wind'&&values.strength>1" d="M80 100H290m-40 -10 40 10-40 10M65 130H280" stroke="#faf9f5" fill="none" opacity=".6"/>
      <path v-if="index&&values.factor==='temperature'&&values.strength>1" d="M170 350V320M210 350V320M250 350V320" stroke="#d97757" marker-end="url(#thermal-story-arrow)"/>
      <text x="215" y="376" text-anchor="middle" fill="#b0aea5">{{index?{area:'改变表面积',temperature:'提高温度',wind:'加快空气流动'}[values.factor]:'其余条件保持一致'}}</text>
     </g>
     <g v-if="stage===1"><rect x="255" y="100" width="300" height="75" rx="8" fill="#151f25" stroke="#d4a27f"/><text x="405" y="132" text-anchor="middle" fill="#d4a27f">表面特写</text><path d="M280 154H520M350 154V141M455 154V141" stroke="#6a9bcc" stroke-width="2"/><circle :cx="405" :cy="145-(progress%.25)*120" r="4" fill="#d4a27f"/></g>
    </template>
    <template v-else-if="kind==='condensation'">
     <g class="focus-object" :transform="focusTransform">
      <path d="M160 90L175 290Q220 310 270 290L285 90Z" fill="#6a9bcc" fill-opacity=".13" stroke="#9dadaf" stroke-width="3"/>
      <ellipse cx="222" cy="90" rx="62" ry="12" fill="#151f25" stroke="#9dadaf"/>
      <rect x="192" y="145" width="40" height="40" rx="5" fill="#c9dce9" opacity=".65" transform="rotate(12 212 165)"/>
      <path v-for="drop in drops" :key="drop.i" :transform="`translate(${drop.x} ${drop.y}) scale(${model.drops*(.4+drop.i%3*.2)})`" d="M0 -9C-2 -3-7 1-7 5a7 7 0 0 0 14 0C7 1 2 -3 0 -9" fill="#6a9bcc" stroke="#b9d9ef"/>
      <text x="222" y="345" text-anchor="middle" fill="#6a9bcc">杯壁 {{values.wall}} °C</text>
     </g>
     <g><text x="470" y="85" fill="#faf9f5" font-size="25">{{stage===1?'靠近外壁，看状态改变':'空气 → 杯子外壁'}}</text>
      <circle v-for="i in 12" :key="i" :cx="470+(i*43%120)" :cy="140+(i*27+progress*45)%130" r="3" fill="#d4a27f" opacity=".65"/>
      <line x1="645" y1="115" x2="645" y2="290" stroke="#b0aea5" stroke-width="6"/>
      <path d="M550 215H620" stroke="#d97757" marker-end="url(#thermal-story-arrow)"/>
      <circle v-for="i in 5" :key="'near'+i" cx="633" :cy="135+i*25" :r="model.drops*(3+i%2*3)" fill="#6a9bcc"/>
      <text x="510" y="325" text-anchor="middle" fill="#d4a27f">水蒸气（示意）</text><text x="690" y="325" text-anchor="middle" fill="#6a9bcc">{{model.active?'液态水滴':'未结露'}}</text>
      <text x="590" y="365" text-anchor="middle" fill="#b0aea5">{{model.active?'杯壁温度低于露点':'杯壁温度不低于露点'}}</text>
     </g>
    </template>
    <template v-else-if="kind==='sublimation'">
     <text x="190" y="65" text-anchor="middle" fill="#faf9f5" font-size="25">固态</text><text x="630" y="65" text-anchor="middle" fill="#faf9f5" font-size="25">气态</text>
     <g :opacity="1-model.gas"><rect x="104" y="130" width="155" height="118" rx="5" fill="#c9dce9" fill-opacity=".17"/><circle v-for="dot in particles" :key="dot.i" :cx="dot.x+15" :cy="dot.y+10" r="6" fill="#c9dce9"/></g>
     <g :opacity="model.gas"><circle v-for="i in 24" :key="i" :cx="dotX(i)+430" :cy="dotY(i)+55" r="4" fill="#d4a27f"/></g>
     <path :d="values.direction==='sublime'?'M300 180H490':'M490 180H300'" stroke="#d97757" stroke-width="3" marker-end="url(#thermal-story-arrow)"/>
     <text x="400" y="145" text-anchor="middle" fill="#d97757">{{values.direction==='sublime'?'升华 · 吸热':'凝华 · 放热'}}</text>
     <g v-if="stage>=1"><rect x="330" y="255" width="145" height="52" rx="6" fill="#faf9f5" fill-opacity=".04"/><text x="403" y="287" text-anchor="middle" fill="#b0aea5">液态</text><path d="M330 307L475 255" stroke="#d97757" stroke-width="2"/><text x="403" y="345" text-anchor="middle" fill="#faf9f5">直接跨过，没有液态中间环节</text></g>
    </template>
    <template v-else-if="kind==='cycle'">
     <circle cx="100" cy="73" r="29" fill="#d4a27f"/><path d="M55 312Q155 291 252 316T450 317V370H55Z" fill="#6a9bcc" fill-opacity=".45"/>
     <path d="M430 320L580 130L753 335Z" fill="#788c5d" fill-opacity=".35" stroke="#788c5d"/><path d="M545 175L580 130L625 182L597 171L580 184L566 170Z" fill="#c9dce9"/>
     <path d="M280 80a30 30 0 0 1 43-24 40 40 0 0 1 72 6 26 26 0 0 1 37 29H280Z" fill="#c9dce9" :opacity="stage>=1?.85:.2"/>
     <path d="M580 255Q525 290 566 316T350 352" fill="none" stroke="#6a9bcc" stroke-width="7" opacity=".8"/>
     <g v-if="stage===0"><path d="M210 280Q165 170 290 108" stroke="#d97757" stroke-dasharray="7 7" fill="none" marker-end="url(#thermal-story-arrow)"/><circle v-for="i in 6" :key="i" :cx="210+(progress*4+i/6)*60" :cy="280-(progress*4+i/6)%1*160" r="3" fill="#d4a27f"/></g>
     <g v-if="stage===1"><circle v-for="i in 10" :key="i" :cx="285+i*13" :cy="75+(i%3)*8" :r="values.route==='snow'?4:3" :fill="values.route==='snow'?'#faf9f5':'#6a9bcc'"/><text x="330" y="135" text-anchor="middle" fill="#faf9f5">{{values.route==='snow'?'凝华 → 冰晶':'液化 → 小水滴'}}</text></g>
     <g v-if="stage===2"><text v-for="i in 12" :key="i" :x="300+i*14" :y="110+(i*21+progress*500)%185" :fill="values.route==='snow'?'#faf9f5':'#6a9bcc'" font-size="23">{{values.route==='snow'?'✳':'│'}}</text></g>
     <circle v-if="stage===3" :cx="560-(progress-.75)*750" :cy="330+(progress-.75)*70" r="7" fill="#6a9bcc" stroke="#faf9f5"/>
     <text x="140" y="352" text-anchor="middle" fill="#faf9f5">河海 · 液态水</text><text x="605" y="106" fill="#c9dce9">{{values.route==='snow'?'冰晶路径':'水滴路径'}}</text>
     <text x="410" y="38" text-anchor="middle" fill="#d4a27f" font-size="23">{{model.status}}</text>
    </template>
   </svg>
   </div>
   <p class="shot-caption" aria-live="polite">{{caption}}</p>
   <div class="film-controls"><button class="play" :disabled="!canPlay" :aria-pressed="playing" @click="play">{{playing?'暂停':progress===1?'重新播放':'播放过程'}}</button><button :disabled="stage===0" @click="seek((stage-1)/4)">上一幕</button><button :disabled="stage===3" @click="seek((stage+1)/4)">下一幕</button><button @click="reset">重置</button><button class="expand" :aria-pressed="expanded" @click="expanded=!expanded">{{expanded?'完整图示':'放大图示'}}</button></div>
   <label class="timeline">动画进度 <output>{{Math.round(progress*100)}}%</output><input aria-label="动画进度" type="range" min="0" max="1" step=".001" :value="progress" @input="seek($event.target.value)"></label>
  </div>
  <div class="story-readings" aria-label="实时读数"><div v-for="[label,value] in model.stats" :key="label"><span>{{label}}</span><strong>{{value}}</strong></div></div>
  <div class="experiment-controls"><label v-for="control in story.controls" :key="control.key">{{control.label}}<template v-if="!control.options"><output>{{values[control.key]}} {{control.unit}}</output><input type="range" :aria-label="control.label" :min="control.min" :max="control.max" :step="control.step" :value="values[control.key]" @input="change(control.key,$event)"></template><select v-else :aria-label="control.label" :value="values[control.key]" @change="change(control.key,$event)"><option v-for="[value,label] in control.options" :key="value" :value="value">{{label}}</option></select></label></div>
  <p class="experiment-status" role="status">{{model.status}}</p>
  <details class="model-note"><summary>模型与参考说明</summary><p>{{story.note}}</p><p>动画进度用于分幕观察；画面刻意放慢，不能用播放秒数当作物理过程时间。改变条件后暂停，保留当前分幕位置并重新计算。</p><p>分镜参考 <a href="https://github.com/HarleyCoops/Math-To-Manim" target="_blank" rel="noopener noreferrer">Math-To-Manim</a> 的物理计算与镜头规范，本页为原创网页交互改编，未使用其视频或 Manim 运行时。</p></details>
 </section>
</template>

<style scoped>
.thermal-story{--ink:#252d30;--muted:#657071;margin:0 0 30px;color:var(--ink);font-family:system-ui,"Microsoft YaHei",sans-serif;min-width:0}.story-header>p:first-child{margin:0;color:#7f5c46;font-size:12px;font-weight:650;letter-spacing:.12em}.story-header span{padding:0 9px;opacity:.5}.story-header h3{font-size:clamp(22px,2.5vw,30px);line-height:1.4;letter-spacing:-.035em;margin:10px 0}.story-question{margin:0 0 23px;color:var(--muted);font-size:15px}.story-chapters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border-bottom:1px solid #d9ded9;margin-bottom:18px}.story-chapters button{border:0!important;border-bottom:3px solid transparent!important;background:transparent!important;border-radius:0!important;box-shadow:none!important;padding:10px 6px!important;min-height:62px!important;font:600 13px/1.5 inherit!important;color:#657071;text-align:left;cursor:pointer;overflow-wrap:anywhere}.story-chapters button span{display:block;font-size:11px;font-weight:400;margin-bottom:3px;font-variant-numeric:tabular-nums}.story-chapters button[aria-current=step]{border-bottom-color:#b66549!important;color:#a45239}.story-stage{background:#101518;color:#faf9f5;border-radius:12px;overflow:hidden}.shot-heading{padding:24px 25px 0;display:flex;align-items:center;justify-content:space-between;gap:16px}.shot-heading span{font-size:12px;color:#b0aea5;letter-spacing:.05em}.shot-heading strong{font-size:18px;font-weight:550}.stage-scroll{overflow-x:auto;overscroll-behavior-inline:contain}.story-svg{display:block;width:100%;height:auto;font-family:system-ui,"Microsoft YaHei",sans-serif;font-size:17px}.expanded .story-svg{min-width:760px}.object-value{font-size:28px;font-variant-numeric:tabular-nums}.focus-object{transition:transform .55s ease}.shot-caption{border-top:1px solid #ffffff18;margin:0 24px;padding:18px 0 12px;font-size:16px;line-height:1.7;min-height:56px;color:#e7e7de}.film-controls{display:flex;flex-wrap:wrap;gap:8px;padding:4px 24px}.film-controls button{font:500 13px/1.4 system-ui!important;color:#deded6!important;background:transparent!important;border:1px solid #ffffff35!important;border-radius:6px!important;min-height:42px!important;padding:9px 14px!important;box-shadow:none!important;cursor:pointer}.film-controls button.play{background:#d97757!important;color:#101518!important;border-color:#d97757!important;font-weight:650!important}.film-controls button:disabled{opacity:.35;cursor:default}.timeline{display:block;font-size:12px;color:#b0aea5;margin:16px 24px 20px}.timeline output{float:right;font-variant-numeric:tabular-nums}.timeline input{display:block;width:100%;height:28px;accent-color:#d97757;margin:5px 0 0;cursor:pointer}.story-readings{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;border-bottom:1px solid #d9ded9;padding:23px 0}.story-readings span{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}.story-readings strong{font-size:18px;font-weight:650;line-height:1.4;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.experiment-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 26px;padding:22px 0 8px}.experiment-controls label{font-size:14px;font-weight:600;min-width:0;display:block}.experiment-controls output{display:block;font-weight:400;color:#657071;margin:7px 0;font-variant-numeric:tabular-nums}.experiment-controls input{display:block;width:100%;min-height:36px;margin:4px 0;accent-color:#a96149;cursor:pointer}.experiment-controls select{display:block;width:100%;min-height:44px;border:1px solid #c2ccc7;border-radius:6px;background:#fff;color:#252d30;padding:9px;font:400 14px/1.4 system-ui;margin-top:10px;box-sizing:border-box}.experiment-status{font-size:14px;font-weight:600;color:#7e4938;margin:16px 0}.model-note{font-size:13px;line-height:1.8;color:#657071}.model-note summary{cursor:pointer}.model-note a{color:inherit;text-decoration:underline}.thermal-story :is(button,input,select,summary,.stage-scroll):focus-visible{outline:2px solid #d97757;outline-offset:3px}.expand{display:none}@media(max-width:600px){.story-header h3{font-size:23px}.story-chapters{grid-template-columns:repeat(2,minmax(0,1fr));gap:3px 12px}.shot-heading{padding:16px 15px 0;display:block}.shot-heading span{display:block;margin-bottom:8px}.shot-heading strong{font-size:17px}.shot-caption{margin:0 14px;font-size:14px;min-height:76px}.film-controls{padding:4px 14px}.film-controls button{padding:8px 11px!important}.timeline{margin:14px}.story-readings{grid-template-columns:repeat(2,minmax(0,1fr));gap:19px}.story-readings strong{font-size:17px}.experiment-controls{grid-template-columns:1fr;gap:16px}.expand{display:inline-block}.focus-object{transition:none}}@media(prefers-reduced-motion:reduce){.focus-object{transition:none}}
</style>
