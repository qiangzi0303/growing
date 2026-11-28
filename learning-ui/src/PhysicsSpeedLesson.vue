<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { Button } from 'vant';

const speeds=ref([5,8]),time=ref(0),running=ref(false);
let frame=0,last=0;
const distances=computed(()=>speeds.value.map(v=>v*time.value));
const fmt=n=>Number(n.toFixed(1));
function pause(){running.value=false;cancelAnimationFrame(frame);time.value=fmt(time.value);}
function reset(){pause();time.value=0;}
function tick(now){
 if(!running.value)return;
 time.value=Math.min(10,time.value+(now-last)/1000);last=now;
 if(time.value>=10)pause();else frame=requestAnimationFrame(tick);
}
function play(){
 if(running.value){pause();return;}
 if(time.value>=10)time.value=0;
 running.value=true;last=performance.now();frame=requestAnimationFrame(tick);
}
function changeSpeed(i,event){reset();speeds.value[i]=Number(event.target.value);}
function seek(event){pause();time.value=Number(event.target.value);}
onBeforeUnmount(pause);
</script>

<template>
 <section class="speed-lesson" aria-labelledby="speed-claim">
  <p class="speed-kicker">先预测，再验证</p>
  <h3 id="speed-claim">相同时间，走得越远，平均速度越大。</h3>
  <details class="speed-prerequisites"><summary>看懂这句话，需要先懂什么？</summary>
   <p>倒推：比较运动快慢 ← 同一过程的路程和时间 ← 长度、计时及单位。</p>
   <ol><li>会测路程：米与千米怎样换算？</li><li>会计时：秒与分钟怎样换算？</li><li>让两车同时出发，观察同一时刻谁走得更远。</li><li>把路程平分到每一秒，就能用统一标准比较快慢。</li></ol>
  </details>
  <p>两车同时出发，10 秒后谁走得更远？先说出预测，再开始。</p>
  <div class="speed-controls">
   <label v-for="(v,i) in speeds" :key="i" :for="'speed-car-'+i">{{i===0?'甲车':'乙车'}} · {{v}} m/s
    <input :id="'speed-car-'+i" type="range" min="0" max="10" step="1" :value="v" @input="changeSpeed(i,$event)">
    <span>{{fmt(v*3.6)}} km/h</span>
   </label>
  </div>
  <svg class="speed-track" viewBox="0 0 620 200" role="img" :aria-label="'经过'+fmt(time)+'秒，甲车走'+fmt(distances[0])+'米，乙车走'+fmt(distances[1])+'米'">
   <g v-for="(v,i) in speeds" :key="i" :transform="'translate(0,'+(i*80)+')'">
    <text x="12" y="38">{{i===0?'甲':'乙'}}</text><path d="M60 50H560" stroke="#c4cfc8" stroke-width="2"/>
    <path :d="'M60 50H'+(60+distances[i]*5)" :stroke="i===0?'#22634b':'#a9522e'" stroke-width="5"/>
    <g :transform="'translate('+(60+distances[i]*5)+',30)'" :fill="i===0?'#22634b':'#a9522e'"><rect x="-12" y="-5" width="24" height="14" rx="3"/><circle cx="-7" cy="12" r="4"/><circle cx="7" cy="12" r="4"/></g>
    <text x="60" y="72">{{fmt(distances[i])}} m</text>
   </g>
   <g v-for="s in [0,20,40,60,80,100]" :key="s"><path :d="'M'+(60+s*5)+' 165v6'" stroke="#8c9a91"/><text :x="60+s*5" y="190" text-anchor="middle">{{s}} m</text></g>
  </svg>
  <label class="speed-time" for="speed-time">共同时间 · <output data-speed-time>{{fmt(time)}} s</output>
   <input id="speed-time" type="range" min="0" max="10" step="0.1" :value="time" @input="seek">
  </label>
  <div class="speed-actions"><Button type="primary" :aria-pressed="running" @click="play">{{running?'暂停':time>=10?'再看一次':'开始观察'}}</Button><Button @click="reset">重置</Button></div>
  <p class="speed-observation" aria-live="polite">{{time===0?'准备好了：两车从同一起点出发。':speeds[0]===speeds[1]?'同一时间，两车路程相同，速度相等。':(speeds[0]>speeds[1]?'甲':'乙')+'车在同一时间走得更远，速度更大。'}}</p>
  <h4>把“每秒走多远”写成公式</h4>
  <p><strong>v = s ÷ t</strong>：速度（m/s）= 这段路程（m）÷ 对应时间（s）。</p>
  <p data-speed-equation>{{running?'正在运动：暂停或拖动时间，查看这一刻的计算。':time===0?'此刻 t = 0，不能用 0 ÷ 0 求速度；开始或拖动时间后查看。':'甲：'+fmt(distances[0])+' m ÷ '+fmt(time)+' s ≈ '+speeds[0]+' m/s；乙：'+fmt(distances[1])+' m ÷ '+fmt(time)+' s ≈ '+speeds[1]+' m/s。'}}</p>
  <p class="speed-model">模型：相对地面匀速直线运动，路程按 s = vt 计算。调速会回到起点；拖动时间会暂停。模拟读数不是实测证据。</p>
  <p class="speed-misreading">辨一辨：甲走 300 m 用 50 s，乙走 480 m 用 80 s。乙一定更快吗？两者都是 6 m/s，路程长不等于速度大。</p>
 </section>
</template>

<style scoped>
.speed-lesson{margin:0 0 28px;padding:22px;border:1px solid #cbd8ce;border-radius:14px;background:#f5f8f3;color:#26372e;line-height:1.7;min-width:0}.speed-kicker{color:#22634b;font-weight:600;margin:0}.speed-lesson h3{font-size:23px;line-height:1.45;margin:8px 0 16px}.speed-lesson h4{font-size:17px;margin-bottom:8px}.speed-prerequisites{border-block:1px solid #dce4dc;padding:12px 0}.speed-prerequisites summary{cursor:pointer;font-weight:600}.speed-controls{display:grid;grid-template-columns:1fr 1fr;gap:24px}.speed-controls label,.speed-time{display:block;font-weight:600;min-width:0}.speed-controls span{font-size:14px;font-weight:400}.speed-lesson input[type=range]{display:block;width:100%;height:34px;accent-color:#22634b;cursor:pointer;margin:4px 0}.speed-controls label:nth-child(2) input{accent-color:#a9522e}.speed-track{display:block;width:100%;height:auto;margin:16px 0;font-size:15px;fill:#26372e}.speed-actions{display:flex;gap:10px;margin-top:12px}.speed-observation{font-weight:600;color:#22634b}.speed-model{font-size:14px;color:#526458}.speed-misreading{border-left:3px solid #a9522e;padding-left:12px}.speed-lesson input:focus-visible,.speed-prerequisites summary:focus-visible{outline:2px solid #22634b;outline-offset:3px}@media(max-width:520px){.speed-lesson{padding:16px 12px}.speed-lesson h3{font-size:20px}.speed-controls{gap:16px}.speed-track{font-size:28px}}
</style>
