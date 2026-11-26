<script setup>
import {computed,ref,nextTick,onBeforeUnmount,watch} from 'vue';
import PomodoroStartButton from './PomodoroStartButton.vue';
const props=defineProps({model:{type:Object,required:true},actions:{type:Object,required:true},unit:{type:Object,required:true},view:{type:String,default:'words'}});
const dialog=ref(null),selectedId=ref(null),localError=ref('');
let opener=null,oldOverflow=null;
const rounds=computed(()=>props.model.rounds||[]);
const selected=computed(()=>rounds.value.find(r=>r.id===selectedId.value));
const active=computed(()=>rounds.value.some(r=>r.phase!=='finished'));
const error=computed(()=>props.model.error||localError.value);
const newWords=computed(()=>selected.value?.items.filter(i=>i.newWord).length||0);
const time=ms=>{const sec=Math.floor(Math.max(0,ms||0)/1000);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;};
const clock=r=>r.phase==='learning'?(r.elapsedMs>=1200000?'+'+time(r.elapsedMs-1200000):time(Math.max(0,1200000-r.elapsedMs))):time(r.phase==='break'?r.restMs:r.elapsedMs);
const phase=r=>r.phase==='finished'?'已完成':r.phase==='break'?'休息剩余':r.pauseUntil!=null?'已暂停':'学习计时';
const progress=computed(()=>Math.min(100,(selected.value?.phase==='break'?(300000-(selected.value.restMs||0))/300000:(selected.value?.elapsedMs||0)/1200000)*100));
async function act(name){localError.value='';try{await props.actions[name]();}catch(e){localError.value=e?.message||'操作失败，请重试。';}}
async function open(round,event){selectedId.value=round.id;opener=event.currentTarget;await nextTick();if(!dialog.value||!selected.value)return;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.value.showModal();}
function restore(){if(oldOverflow!==null){document.body.style.overflow=oldOverflow;oldOverflow=null;}opener?.focus({preventScroll:true});}
function close(){dialog.value?.close();restore();}
watch(selected,r=>{if(!r&&dialog.value?.open)close();});
onBeforeUnmount(close);
</script>

<template>
 <section class="english-pomo" :class="{'in-library':view==='words'}" aria-label="本单元番茄列表">
  <div class="ep-track">
   <button v-for="r in rounds" :key="r.id" :data-round="r.id" class="ep-token" :class="{running:r.phase!=='finished',paused:r.pauseUntil!=null,overtime:r.phase==='learning'&&r.elapsedMs>=1200000}" :aria-label="`第 ${r.index+1} 个番茄，${phase(r)}，${clock(r)}`" @click="open(r,$event)">
    <template v-if="r.phase!=='finished'">{{clock(r)}}</template>
    <template v-else><svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 10C4 3 0 19 6 27c4 6 16 6 20 0 6-8 2-24-10-17Z" stroke="currentColor" stroke-width="1.5"/><path d="M16 10V4m0 6-6-3m6 3 6-3" stroke="#66816a" stroke-width="1.7"/></svg><span>第 {{r.index+1}} 个<small>已完成</small></span></template>
   </button>
   <PomodoroStartButton v-if="!active" :label="rounds.length?`第 ${rounds.length+1} 个番茄`:'开始番茄'" title="20 分钟专注" @click="act('pomodoroStart')"/>
  </div>
  <p v-if="error" class="ep-error" role="alert">{{error}} <button data-action="retry" @click="act('pomodoroRetry')">重试</button></p>
  <dialog ref="dialog" class="ep-dialog" aria-label="番茄完成记录" @cancel.prevent="close" @close="restore" @click.self="close">
   <template v-if="selected">
    <header class="ep-top"><div><h2>第 {{selected.index+1}} 个番茄</h2><p>Unit {{unit.number}} · {{unit.title}}</p></div><button class="ep-close" aria-label="关闭番茄记录" autofocus @click="close">×</button></header>
    <div class="ep-body">
     <div class="ep-workspace">
      <section class="ep-timer" aria-label="本轮计时">
       <h3>{{phase(selected)}}</h3>
       <div class="ep-clock" :style="{'--progress':`${progress}%`}"><div><strong>{{clock(selected)}}</strong><span>{{selected.phase==='finished'?'本轮学习用时':phase(selected)}}</span></div></div>
       <div class="ep-actions"><button v-if="selected.phase==='learning'&&selected.pauseUntil==null" data-action="pause" @click="act('pomodoroPause')">暂停</button><button v-else-if="selected.phase==='learning'" data-action="resume" @click="act('pomodoroResume')">继续计时</button><span v-else>{{selected.phase==='break'?'休息一下，稍后再学':'本轮学习已结束'}}</span></div>
       <div v-if="selected.goal" class="ep-goal"><strong>{{newWords}} / {{selected.goal}} 个新词</strong><p>{{newWords<selected.goal?'专注满 20 分钟且完成 8 个新词后休息':'本轮新词目标已完成'}}</p></div>
      </section>
      <section class="ep-report"><h3>{{selected.phase==='finished'?'本轮学习报告':'本轮已学内容'}}</h3><div class="ep-metrics"><div><strong>{{selected.items.length}}</strong><span>已完成内容</span></div><div><strong>{{time(selected.elapsedMs)}}</strong><span>学习用时</span></div></div>
       <p v-if="!selected.items.length" class="ep-empty">本轮还没有已完成内容。按原来的方式学习，完成后会自动记录在这里。</p>
       <details v-for="item in selected.items" :key="item.id" class="ep-record"><summary><strong>{{item.title}}</strong><span>{{item.newWord?'新词':'已完成'}}</span></summary><p>{{item.detail||'已完成并保存'}}</p></details>
      </section>
     </div>
     <p v-if="error" class="ep-error" role="alert">{{error}} <button @click="act('pomodoroRetry')">重试</button></p>
     <p class="ep-footer">暂停最多 5 分钟，随后自动继续计时；本轮学习及休息结束后显示下一个番茄。</p>
    </div>
   </template>
  </dialog>
 </section>
</template>

<style scoped>
.english-pomo{margin:-48px 0 -16px;min-width:0;color:#253b3d}.english-pomo:not(.in-library){margin-bottom:12px}.ep-track{display:flex;gap:10px;overflow-x:auto;min-height:64px;overscroll-behavior-x:contain;scrollbar-width:thin}.english-pomo button{font:inherit;cursor:pointer}.ep-token{display:flex;align-items:center;justify-content:center;gap:10px;flex:0 0 126px;min-height:64px;border:1px solid #dce5de;background:white;border-radius:10px;padding:10px 14px;color:#5d6d62;white-space:nowrap}.ep-token span{font-size:13px;line-height:1.6;text-align:left}.ep-token small{display:block;font-size:12px;color:#69766e}.ep-token svg{width:27px;height:30px;color:#b26c56}.ep-token.running{background:#edf3ef;border-color:#96b1a0;color:#38694f;font-size:29px;font-variant-numeric:tabular-nums;letter-spacing:1px}.ep-token.paused{border-style:dashed}.ep-token.overtime{color:#9c5426;background:#fff2e6;border-color:#d0ab8b}.ep-token:focus-visible{outline:3px solid #38694f;outline-offset:-3px}.ep-dialog{padding:0;border:1px solid #dce5e2;border-radius:20px;width:min(1050px,calc(100% - 40px));max-height:calc(100dvh - 48px);overflow:auto;background:#f5f3ef;color:#253b3d;box-sizing:border-box}.ep-dialog::backdrop{background:#15272880}.ep-top{display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:1;padding:20px 26px;background:#f5f3ef;border-bottom:1px solid #dce5e2}.ep-top h2{font-size:20px;margin:0}.ep-top p{margin:6px 0 0;font-size:13px;color:#626e6c}.ep-close{background:transparent;border:0;width:44px;height:44px;font-size:28px!important;color:#626e6c}.ep-body{padding:24px}.ep-workspace{display:grid;grid-template-columns:290px minmax(0,1fr);gap:24px}.ep-timer,.ep-report{background:white;border:1px solid #dce5e2;border-radius:15px;padding:24px;min-width:0}.ep-timer{text-align:center;align-self:start}.ep-dialog h3{font-size:16px;margin:0 0 16px}.ep-clock{width:210px;height:210px;border-radius:50%;margin:20px auto;background:conic-gradient(#347679 var(--progress),#e7f0ed 0);padding:7px;box-sizing:border-box}.ep-clock>div{display:flex;align-items:center;justify-content:center;flex-direction:column;height:100%;border-radius:50%;background:white}.ep-clock strong{font-size:44px;font-weight:500;font-variant-numeric:tabular-nums}.ep-clock span{font-size:13px;margin-top:8px;color:#626e6c}.ep-actions button,.ep-error button{border:1px solid #347679;border-radius:8px;padding:10px 24px;background:#347679;color:white;min-height:44px}.ep-actions>span{font-size:13px;color:#626e6c}.ep-goal{border-top:1px solid #dce5e2;margin-top:22px;padding-top:18px}.ep-goal p,.ep-footer{font-size:12px;line-height:1.7;color:#626e6c}.ep-metrics{display:flex;gap:36px;border-bottom:1px solid #dce5e2;padding:6px 0 24px;margin-bottom:12px}.ep-metrics strong{display:block;font-size:29px;font-weight:500;font-variant-numeric:tabular-nums}.ep-metrics span{display:block;font-size:12px;color:#626e6c;margin-top:6px}.ep-empty{font-size:14px;line-height:1.8;color:#626e6c;padding:22px 0}.ep-record{border-bottom:1px solid #dce5e2}.ep-record summary{cursor:pointer;padding:16px 0;font-size:14px;min-height:24px}.ep-record summary strong{font-weight:500;overflow-wrap:anywhere}.ep-record summary span{float:right;color:#626e6c;font-size:12px}.ep-record p{font-size:13px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;color:#626e6c}.ep-error{color:#9a382c;font-size:13px;line-height:1.6;background:#fff3ed;padding:8px 12px;border-radius:8px}.ep-error button{padding:4px 14px;margin-left:8px}.ep-footer{margin:20px 0 0}.ep-dialog button:focus-visible,.ep-record summary:focus-visible{outline:3px solid #347679;outline-offset:2px}
@media(max-width:760px){.english-pomo{margin-top:-32px;margin-bottom:-20px}.ep-track{min-height:52px}.ep-token{flex-basis:116px;min-height:52px;padding:6px 12px}.ep-token span{line-height:1.4}.ep-dialog{width:calc(100% - 16px);max-height:calc(100dvh - 16px);border-radius:16px}.ep-top{padding:14px 16px}.ep-top h2{font-size:16px}.ep-body{padding:16px}.ep-workspace{grid-template-columns:1fr;gap:16px}.ep-timer{padding:14px 16px;display:grid;grid-template-columns:138px minmax(0,1fr);gap:6px 14px;align-items:center}.ep-timer h3{grid-column:1/-1;margin-bottom:4px}.ep-clock{width:138px;height:138px;margin:3px 0}.ep-clock strong{font-size:34px}.ep-clock span{font-size:12px}.ep-actions button{padding:10px 12px;width:100%}.ep-goal{grid-column:1/-1;margin-top:8px;padding-top:10px}.ep-goal p{margin-bottom:0}.ep-report{padding:19px 16px}.ep-metrics{gap:24px}.ep-metrics strong{font-size:25px}}
</style>
