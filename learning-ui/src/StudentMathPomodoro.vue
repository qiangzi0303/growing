<script setup>
import {computed,ref,nextTick,onBeforeUnmount,watch} from 'vue';
import PomodoroStartButton from './PomodoroStartButton.vue';
const props=defineProps({model:{type:Object,required:true},actions:{type:Object,required:true},chapter:{type:Object,required:true}});
const dialog=ref(null),selectedId=ref(null),localError=ref(''),confirmFinish=ref(false),working=ref(false);
let opener=null,oldOverflow=null;
const rounds=computed(()=>props.model.rounds||[]);
const selected=computed(()=>rounds.value.find(r=>r.id===selectedId.value));
const current=computed(()=>rounds.value.find(r=>!['finished','stopped'].includes(r.phase)));
const editable=computed(()=>selected.value&&selected.value.id===current.value?.id);
const error=computed(()=>props.model.error||localError.value);
const questions=computed(()=>selected.value?.items.filter(i=>i.kind==='question')||[]);
const pending=computed(()=>questions.value.filter(i=>['submitted','pending'].includes(i.status)).length);
const time=ms=>{const sec=Math.floor(Math.max(0,ms||0)/1000);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;};
const clock=r=>time(r.phase==='learning'?1500000-r.elapsedMs:r.phase==='break'?r.restMs:['finished','stopped'].includes(r.phase)?r.elapsedMs:0);
const phase=r=>r.phase==='learning'?(r.pausedAt!=null?'已暂停':'计时中'):({ready:'本轮计时完成',break:'休息中',finished:'已完成',stopped:'提前结束'}[r.phase]||'');
const status=i=>({read:'已阅读',graded:'已评分',submitted:'已提交',correct:'首次答对',incorrect:'需订正',corrected:'订正通过',pending:'待批改',answered:'已答疑'}[i.status]||'已记录');
const progress=computed(()=>{const r=selected.value;if(!r)return 0;return Math.max(0,Math.min(100,r.phase==='break'?r.restMs/Math.max(1,r.restTotalMs)*100:(1500000-r.elapsedMs)/1500000*100));});
async function act(name){if(working.value)return;localError.value='';working.value=true;try{await props.actions[name]();confirmFinish.value=false;}catch(e){localError.value=e?.message||'操作失败，请重试。';}finally{working.value=false;}}
async function open(round,event){selectedId.value=round.id;confirmFinish.value=false;opener=event.currentTarget;await nextTick();if(!dialog.value||!selected.value)return;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.value.showModal();}
function restore(){if(oldOverflow!==null){document.body.style.overflow=oldOverflow;oldOverflow=null;}if(opener?.isConnected)opener.focus({preventScroll:true});}
function close(){dialog.value?.close();confirmFinish.value=false;restore();}
function backdrop(event){if(event.target!==dialog.value)return;const r=dialog.value.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}
watch(selected,r=>{if(!r&&dialog.value?.open)close();if(r?.phase!=='learning')confirmFinish.value=false;});
onBeforeUnmount(close);
</script>

<template>
 <section class="math-pomo" aria-label="本单元番茄列表">
  <div class="mp-track">
   <button v-for="r in rounds" :key="r.id" :data-round="r.id" class="mp-token" :class="{running:!['finished','stopped'].includes(r.phase),paused:r.pausedAt!=null}" :aria-label="`第 ${r.index+1} 个番茄，${phase(r)}，${clock(r)}`" @click="open(r,$event)">
    <template v-if="!['finished','stopped'].includes(r.phase)">{{clock(r)}}</template>
    <template v-else><svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 10C4 3 0 19 6 27c4 6 16 6 20 0 6-8 2-24-10-17Z" stroke="currentColor" stroke-width="1.5"/><path d="M16 10V4m0 6-6-3m6 3 6-3" stroke="#66816a" stroke-width="1.7"/></svg><span>第 {{r.index+1}} 个<small>{{r.phase==='stopped'?'未完成':'已完成'}}</small></span></template>
   </button>
   <PomodoroStartButton v-if="!current" :label="rounds.length?`第 ${rounds.length+1} 个番茄`:'开始番茄'" title="25 分钟学习" :disabled="working" @click="act('pomodoroStart')"/>
  </div>
  <div v-if="current?.phase==='ready'" class="mp-ready" role="status"><span>本轮计时完成，可以写完当前步骤再休息。</span><button data-action="start-break" :disabled="working" @click="act('pomodoroStartBreak')">开始休息 {{time(current.restTotalMs)}}</button><button data-action="skip-break" :disabled="working" @click="act('pomodoroSkipBreak')">结束本次</button></div>
  <p v-if="error" class="mp-error" role="alert">{{error}} <button data-action="retry" :disabled="working" @click="act('pomodoroRetry')">重试</button></p>
  <dialog ref="dialog" class="mp-dialog" aria-label="数学番茄学习记录" @cancel.prevent="close" @close="restore" @click="backdrop">
   <template v-if="selected">
    <header class="mp-top"><div><h2>{{chapter.title}}</h2><p>第 {{selected.index+1}} 个番茄 · {{selected.nodeTitle}}</p></div><button class="mp-close" aria-label="收起番茄详情" autofocus @click="close">×</button></header>
    <div class="mp-body"><div class="mp-workspace">
     <section class="mp-timer" aria-label="本轮计时">
      <div class="mp-timer-head"><h3>本轮学习</h3><span>{{phase(selected)}}</span></div>
      <div class="mp-clock" :style="{'--progress':`${progress}%`}"><div><span>{{selected.phase==='break'?'休息剩余':['finished','stopped'].includes(selected.phase)?'本轮已计时':'本轮剩余'}}</span><strong>{{clock(selected)}}</strong><span>计划 25 分钟</span></div></div>
      <div class="mp-actions">
       <button v-if="editable&&selected.phase==='learning'&&selected.pausedAt==null" class="mp-primary" data-action="pause" :disabled="working" @click="act('pomodoroPause')">暂停</button>
       <button v-else-if="editable&&selected.phase==='learning'" class="mp-primary" data-action="resume" :disabled="working" @click="act('pomodoroResume')">继续计时</button>
       <button v-else-if="editable&&selected.phase==='ready'" class="mp-primary" data-action="start-break" :disabled="working" @click="act('pomodoroStartBreak')">开始休息</button>
       <button v-else-if="editable&&selected.phase==='break'" class="mp-primary" data-action="skip-break" :disabled="working" @click="act('pomodoroSkipBreak')">结束休息</button>
       <button data-action="collapse" @click="close">收起</button>
      </div>
      <div class="mp-timer-note"><p>暂停 {{time(selected.pauseMs)}}，不计入本轮时长。</p><p>屏幕、纸上与拍照学习共用一个计时器。</p></div>
      <button v-if="editable&&selected.phase==='learning'&&!confirmFinish" class="mp-secondary" data-action="request-finish" @click="confirmFinish=true">提前结束本轮</button>
      <div v-if="editable&&selected.phase==='learning'&&confirmFinish" class="mp-confirm"><p>提前结束会保留记录，本轮标为未完成。</p><div class="mp-actions"><button data-action="cancel-finish" @click="confirmFinish=false">继续学习</button><button data-action="confirm-finish" :disabled="working" @click="act('pomodoroFinish')">确认结束</button></div></div>
      <button v-if="editable&&selected.phase==='ready'" class="mp-secondary" data-action="skip-break" :disabled="working" @click="act('pomodoroSkipBreak')">结束本次</button>
     </section>
     <section class="mp-report"><div class="mp-report-head"><h3>本轮学习记录</h3><span>{{selected.items.length}} 项记录</span></div><p class="mp-intro">按原来的方式学习，已保存的内容记入本轮。</p>
      <div class="mp-metrics"><div><strong>{{time(selected.elapsedMs)}}</strong><span>番茄计时时长</span></div><div><strong data-metric="questions">{{questions.length}}</strong><span>已作答题目</span></div><div><strong data-metric="pending">{{pending}}</strong><span>待批改题目</span></div></div>
      <p v-if="!selected.items.length" class="mp-empty">还没有已完成的内容。继续在原课堂学习，阅读确认、复述评分和作答记录会随学加入。</p>
      <details v-for="item in selected.items" :key="item.id" class="mp-record"><summary><strong>{{item.title}}</strong><span>{{status(item)}}</span></summary><p>{{item.detail||'已保存学习记录'}}<template v-if="typeof item.score==='number'"> · {{item.score}} / 10</template></p></details>
      <button class="mp-return mp-primary" @click="close">返回课堂继续学习</button>
     </section>
    </div><p v-if="error" class="mp-error" role="alert">{{error}} <button :disabled="working" @click="act('pomodoroRetry')">重试</button></p><p class="mp-footer">计时完成不代表知识点已掌握。收起后继续计时；到时不会自动交卷，休息和下一轮由你开始。</p></div>
   </template>
  </dialog>
 </section>
</template>

<style scoped>
.math-pomo{margin:18px 0 0;min-width:0;color:#253b3d;font-family:'Segoe UI','Microsoft YaHei',sans-serif}.math-pomo button{font:inherit;cursor:pointer;min-height:44px}.math-pomo button:disabled{cursor:wait;opacity:.65}.mp-track{display:flex;gap:10px;overflow-x:auto;min-height:58px;overscroll-behavior-x:contain;scrollbar-width:thin}.mp-token{display:flex;align-items:center;justify-content:center;gap:10px;flex:0 0 126px;min-height:58px;border:1px solid #dce5de;background:#fff;border-radius:10px;padding:10px 14px;color:#5d6d62;white-space:nowrap}.mp-token span{font-size:14px;line-height:1.6;text-align:left}.mp-token small{display:block;font-size:12px;color:#69766e}.mp-token svg{width:27px;height:30px;color:#b26c56;flex-shrink:0}.mp-token.running{background:#edf3ef;border-color:#96b1a0;color:#38694f;font-size:29px;font-variant-numeric:tabular-nums;letter-spacing:1px}.mp-token.paused{border-style:dashed}.mp-token:focus-visible{outline:3px solid #38694f;outline-offset:-3px}.mp-ready{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px;font-size:14px;line-height:1.8}.mp-ready button,.mp-error button{border:1px solid #347679;border-radius:8px;padding:8px 14px;background:white;color:#347679}.mp-dialog{padding:0;border:1px solid #dce5e2;border-radius:22px;width:min(1050px,calc(100% - 40px));max-height:calc(100dvh - 48px);overflow:auto;background:#f5f3ef;color:#253b3d;box-sizing:border-box;box-shadow:0 24px 100px #162d3038}.mp-dialog *{box-sizing:border-box}.mp-dialog::backdrop{background:#182a2273;backdrop-filter:blur(3px)}.mp-top{display:flex;justify-content:space-between;align-items:center;gap:16px;position:sticky;top:0;z-index:1;padding:20px 26px;background:#f5f3ef;border-bottom:1px solid #dce5e2}.mp-top h2{font-size:19px;line-height:1.5;margin:0}.mp-top p{margin:4px 0 0;font-size:13px;color:#626e6c;line-height:1.7}.mp-close{background:transparent;border:1px solid #dce5e2;border-radius:10px;width:44px;height:44px;font-size:24px!important;color:#626e6c;flex:none}.mp-body{padding:24px 26px}.mp-workspace{display:grid;grid-template-columns:290px minmax(0,1fr);gap:22px;align-items:start}.mp-timer,.mp-report{background:white;border:1px solid #dce5e2;border-radius:18px;padding:22px;min-width:0}.mp-timer{text-align:center}.mp-timer-head,.mp-report-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.mp-timer-head span,.mp-report-head span{font-size:13px;color:#626e6c}.mp-dialog h3{font-size:16px;margin:0;line-height:1.6}.mp-clock{width:226px;height:226px;border-radius:50%;margin:16px auto;background:conic-gradient(#347679 var(--progress),#e7f0ed 0);padding:6px;box-sizing:border-box}.mp-clock>div{display:flex;align-items:center;justify-content:center;flex-direction:column;height:100%;border-radius:50%;background:white}.mp-clock strong{font-size:51px;font-weight:300;line-height:1.4;font-variant-numeric:tabular-nums;letter-spacing:-2px}.mp-clock span{font-size:12px;color:#626e6c}.mp-actions{display:flex;gap:8px;margin:15px 0}.mp-actions button{flex:1;border:1px solid #dce5e2;border-radius:10px;padding:10px 12px;background:white;color:#253b3d;font-size:14px}.math-pomo .mp-primary{background:#347679;color:white;border-color:#347679}.mp-timer-note{border-top:1px solid #dce5e2;padding-top:14px;text-align:left}.mp-timer-note p,.mp-confirm p{font-size:13px;line-height:1.8;margin:0 0 8px;color:#626e6c}.mp-secondary{border:0;background:transparent;color:#626e6c;font-size:13px!important;text-decoration:underline}.mp-confirm{margin-top:12px;text-align:left}.mp-report{padding:24px}.mp-intro{font-size:14px;line-height:1.8;color:#626e6c;margin:16px 0}.mp-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:6px 0 20px;margin-bottom:8px}.mp-metrics strong{display:block;font-size:27px;font-weight:500;font-variant-numeric:tabular-nums}.mp-metrics span{display:block;font-size:12px;color:#626e6c;margin-top:7px;line-height:1.8}.mp-empty{font-size:14px;line-height:1.9;color:#626e6c;padding:20px 0}.mp-record{border-bottom:1px solid #dce5e2}.mp-record summary{display:flex;justify-content:space-between;align-items:center;gap:14px;cursor:pointer;padding:14px 0;font-size:14px;min-height:48px;list-style:none}.mp-record summary strong{font-weight:600;overflow-wrap:anywhere}.mp-record summary span{color:#626e6c;font-size:12px;white-space:nowrap;flex-shrink:0}.mp-record p{font-size:14px;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere;color:#626e6c;margin:0 0 18px}.mp-return{width:100%;border:1px solid #347679;border-radius:10px;padding:10px 15px;margin-top:20px;font-size:14px!important}.mp-error{color:#9a382c;font-size:14px;line-height:1.8;background:#fff3ed;padding:8px 12px;border-radius:8px}.mp-error button{margin-left:8px}.mp-footer{margin:18px 0 0;font-size:12px;line-height:1.8;color:#626e6c}.mp-dialog button:focus-visible,.mp-record summary:focus-visible,.mp-ready button:focus-visible,.mp-error button:focus-visible{outline:3px solid #347679;outline-offset:2px}
@media(max-width:700px){.math-pomo{margin-top:14px}.mp-token{min-height:52px;flex-basis:116px;padding:6px 12px}.mp-track{min-height:52px}.mp-dialog{width:calc(100% - 16px);max-height:calc(100dvh - 16px);border-radius:16px}.mp-top{padding:12px 16px}.mp-top h2{font-size:16px}.mp-body{padding:12px}.mp-workspace{grid-template-columns:1fr;gap:16px}.mp-timer{padding:12px;display:grid;grid-template-columns:128px minmax(0,1fr);gap:6px 14px;align-items:center}.mp-timer-head{grid-column:1/-1}.mp-clock{width:128px;height:128px;margin:3px 0}.mp-clock strong{font-size:34px}.mp-actions{flex-direction:column;margin:0}.mp-actions button{width:100%}.mp-timer-note,.mp-secondary,.mp-confirm{grid-column:1/-1}.mp-timer-note{padding-top:12px;margin-top:8px}.mp-timer-note p:last-child{margin-bottom:0}.mp-confirm .mp-actions{flex-direction:row}.mp-report{padding:16px}.mp-metrics{gap:8px;padding-bottom:14px}.mp-metrics strong{font-size:22px}.mp-record summary{gap:8px}.mp-ready>span{width:100%}.mp-intro{margin:12px 0}}
</style>
