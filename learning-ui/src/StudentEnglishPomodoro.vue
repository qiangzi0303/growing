<script setup>
import {computed,ref,nextTick,onBeforeUnmount,watch} from 'vue';
import PomodoroStartButton from './PomodoroStartButton.vue';
import CompletionMark from './CompletionMark.vue';
const STUDY=25*60000;
const props=defineProps({model:{type:Object,required:true},actions:{type:Object,required:true},unit:{type:Object,required:true},view:{type:String,default:'words'}});
const dialog=ref(null),selectedId=ref(null),historyId=ref(null),localError=ref(''),working=ref(false);
let opener=null,oldOverflow=null;
const rounds=computed(()=>props.model.rounds||[]);
const planned=computed(()=>props.model.plan?.rounds||[]);
const family=r=>{let origin=rounds.value.find(saved=>saved.id===r.id)||r;while(origin?.retryOf){const parent=rounds.value.find(old=>old.id===origin.retryOf);if(!parent||parent.index>=origin.index)break;origin=parent;}return origin?.id;};
const entries=computed(()=>{
 const legacy=rounds.value.filter(r=>!r.planId&&!rounds.value.some(later=>later.index>r.index&&family(later)===family(r))).map((r,index)=>({...r,index}));
 if(!props.model.plan)return legacy;
 return [...legacy,...planned.value.map((p,i)=>({...p,phase:'ready',items:[],elapsedMs:0,...rounds.value.filter(r=>r.planId===p.id).at(-1),index:legacy.length+i}))];
});
const selectedEntry=computed(()=>{const old=rounds.value.find(r=>r.id===selectedId.value);return entries.value.find(r=>r.id===selectedId.value)||entries.value.find(r=>old&&(old.planId?r.planId===old.planId:family(r)===family(old)));});
const history=computed(()=>selectedEntry.value?rounds.value.filter(r=>selectedEntry.value.planId?r.planId===selectedEntry.value.planId:family(r)===family(selectedEntry.value)):[]);
const selected=computed(()=>history.value.find(r=>r.id===historyId.value)||selectedEntry.value);
const active=computed(()=>rounds.value.some(r=>r.phase!=='finished'));
const canRestart=computed(()=>selected.value?.phase==='finished'&&['timeout','manual'].includes(selected.value.endReason)&&selected.value.id===history.value.at(-1)?.id);
const canOpen=r=>r.phase==='learning'||(!active.value&&r.phase==='ready');
const done=(r,t)=>(r.items||[]).some(i=>(i.eventId||i.id)===t.eventId&&(!t.newWord||i.newWord));
const category=t=>t.category||(t.kind==='word'?'words':t.kind==='sentence'?'sentences':t.kind==='lesson'||/(^|[-_])reading($|[-_])/i.test(t.lessonId||'')?'reading':'grammar');
const groups=r=>Object.entries({words:'单词',grammar:'语法',sentences:'句子闯关',reading:'阅读理解'}).map(([id,name])=>({id,name,targets:(r.targets||[]).filter(t=>category(t)===id)})).filter(g=>g.targets.length);
const error=computed(()=>props.model.error||localError.value);
const newWords=computed(()=>selected.value?.items.filter(i=>i.newWord).length||0);
const time=ms=>{const sec=Math.floor(Math.max(0,ms||0)/1000);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;};
const date=at=>Number.isFinite(at)?new Date(at).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
const clock=r=>r.phase==='learning'?(r.elapsedMs>=STUDY?'+'+time(r.elapsedMs-STUDY):time(Math.max(0,STUDY-r.elapsedMs))):time(r.phase==='break'?r.restMs:r.elapsedMs);
const phase=r=>r.endReason==='timeout'?'已超时':r.endReason==='manual'?'已手动结束':r.phase==='finished'?'已完成':r.phase==='break'?'休息剩余':r.pauseUntil!=null?'已暂停':'学习计时';
const progress=computed(()=>Math.min(100,(selected.value?.phase==='break'?(300000-(selected.value.restMs||0))/300000:(selected.value?.elapsedMs||0)/STUDY)*100));
async function act(name,...args){if(working.value)return false;localError.value='';working.value=true;try{const result=await props.actions[name](...args);return result!==false&&!error.value;}catch(e){localError.value=e?.message||'操作失败，请重试。';return false;}finally{working.value=false;}}
async function restartSelected(){if(active.value||!canRestart.value)return;if(await act('pomodoroRestart',selected.value.id)){historyId.value=null;selectedId.value=rounds.value.at(-1)?.id;}}
async function startSelected(){const id=selected.value?.id;close();await act('pomodoroStart',id);}
async function openTarget(r,t){if(!canOpen(r))return;close();localError.value='';try{await props.actions.pomodoroOpenTarget(t.id,r.planId||r.id);}catch(e){localError.value=e?.message||'定位失败，请重试。';}}
async function open(round,event){selectedId.value=round.id;historyId.value=null;opener=event.currentTarget;await nextTick();if(!dialog.value||!selected.value)return;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.value.showModal();}
function restore(){if(oldOverflow!==null){document.body.style.overflow=oldOverflow;oldOverflow=null;}opener?.focus({preventScroll:true});}
function close(){dialog.value?.close();restore();}
watch(selected,r=>{if(!r&&dialog.value?.open)close();});
onBeforeUnmount(close);
</script>

<style scoped>
.english-pomo .ep-track{gap:6px;min-height:44px}
.english-pomo .ep-token{flex-basis:115px;min-width:0;min-height:44px;height:44px;padding:4px 7px;gap:6px;border-radius:8px}
.english-pomo .ep-token svg{width:15px;height:17px}
.english-pomo .ep-token span{min-width:0;overflow:hidden}
.english-pomo .ep-token small{font-size:12px;line-height:1.4;overflow:hidden;text-overflow:ellipsis}
.english-pomo .ep-token.running{font-size:20px;letter-spacing:0}
@media(max-width:760px){.english-pomo .ep-token{flex-basis:102.5px}}
</style>

<template>
 <section class="english-pomo" :class="{'in-library':view==='words'}" aria-label="本单元番茄列表">
  <div class="ep-track">
   <template v-for="r in entries" :key="r.planId||family(r)">
   <button :data-round="r.id" :data-action="r.phase==='ready'&&!active?'start':undefined" class="ep-token" :class="{running:r.phase==='learning'||r.phase==='break',paused:r.pauseUntil!=null,overtime:r.phase==='learning'&&r.elapsedMs>=STUDY,expired:r.endReason==='timeout'}" :aria-label="`第 ${r.index+1} 个番茄，${r.phase==='ready'?'待学习':phase(r)}${r.phase==='learning'||r.phase==='break'?'，'+clock(r):''}`" @click="open(r,$event)">
    <svg v-if="r.endReason==='timeout'" class="ep-rotten" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 11C6 5 1 16 5 25c2 6 8 7 12 5 7 3 12-3 11-10-1-9-6-12-12-9Z" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-width="1.5"/><path d="M16 11c2-4 6-6 9-2m-9 2-7-2m7 2-1-5" stroke="#8b7e58" stroke-width="1.7"/><ellipse cx="10" cy="20" rx="2.2" ry="3" fill="currentColor" opacity=".6"/><circle cx="22" cy="24" r="2.5" fill="currentColor" opacity=".45"/><path d="m18 15 3 2-2 3m-7 6q3-3 6 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    <svg v-else :class="{'ep-smile':r.phase==='finished'&&!r.endReason}" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 10C4 3 0 19 6 27c4 6 16 6 20 0 6-8 2-24-10-17Z" stroke="currentColor" stroke-width="1.5"/><path d="M16 10V4m0 6-6-3m6 3 6-3" stroke="#66816a" stroke-width="1.7"/><g v-if="r.phase==='finished'&&!r.endReason" class="ep-happy-face"><circle cx="11" cy="18" r="1.4" fill="currentColor"/><circle cx="21" cy="18" r="1.4" fill="currentColor"/><path d="M10 23q6 7 12 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></g></svg>
    <template v-if="r.phase==='ready'"><span><small>{{r.index+1}} · 待学习</small></span></template>
    <template v-else-if="r.phase!=='finished'">{{clock(r)}}</template>
    <template v-else><span><small>{{r.index+1}} · {{r.endReason==='manual'?'手动结束':phase(r)}}</small></span></template>
   </button>
   </template>
   <PomodoroStartButton v-if="!model.plan&&!active" :label="entries.length?`第 ${entries.length+1} 个番茄`:'开始番茄'" title="25 分钟专注" @click="act('pomodoroStart')"/>
  </div>
  <p v-if="error" class="ep-error" role="alert">{{error}} <button data-action="retry" @click="act('pomodoroRetry')">重试</button></p>
  <dialog ref="dialog" class="ep-dialog" aria-label="番茄完成记录" @cancel.prevent="close" @close="restore" @click.self="close">
   <template v-if="selected">
    <header class="ep-top"><div><h2>第 {{selectedEntry.index+1}} / {{entries.length}} 个番茄</h2><p>Unit {{unit.number}} · {{unit.title}}</p></div><button class="ep-close" aria-label="关闭番茄记录" autofocus @click="close">×</button></header>
    <div class="ep-body">
     <label v-if="history.length>1" class="ep-history">该番茄的学习历史 <select :value="selected.id" aria-label="该番茄的学习历史" @change="historyId=$event.target.value"><option v-for="(r,i) in history" :key="r.id" :value="r.id">第 {{i+1}} 次 · {{phase(r)}} · {{time(r.elapsedMs)}}</option></select></label>
     <p v-if="selected.createdAt!=null" class="ep-attempt-time">开始：{{date(selected.createdAt)}}<template v-if="selected.finishedAt!=null"> · 结束：{{date(selected.finishedAt)}}</template></p>
     <div v-if="canRestart" class="ep-restart"><button data-action="restart-round" :disabled="working||active" @click="restartSelected">重新学习</button><span>{{active?'结束当前番茄后可重学':'重新计时，保留此前每次学习记录'}}</span></div>
     <div class="ep-workspace">
      <section v-if="selected.phase!=='ready'" class="ep-timer" :class="{'ep-expired':selected.endReason==='timeout'}" aria-label="本轮计时">
       <h3>{{phase(selected)}}</h3>
       <div class="ep-clock" :style="{'--progress':`${progress}%`}"><div><strong>{{clock(selected)}}</strong><span>{{selected.phase==='finished'?'本轮学习用时':phase(selected)}}</span></div></div>
       <div class="ep-actions"><button v-if="selected.phase==='learning'&&selected.pauseUntil==null" data-action="pause" @click="act('pomodoroPause')">暂停</button><button v-else-if="selected.phase==='learning'" data-action="resume" @click="act('pomodoroResume')">继续计时</button><span v-else>{{selected.endReason==='timeout'?'已达到 50 分钟上限':selected.phase==='break'?'休息一下，稍后再学':'本轮学习已结束'}}</span><button v-if="selected.phase==='learning'||selected.phase==='break'" class="ep-end" data-action="end-round" @click="act('pomodoroEnd',selected.id)">结束本轮</button></div>
       <div v-if="selected.targets?.length" class="ep-goal"><strong>{{selected.targets.filter(t=>done(selected,t)).length}} / {{selected.targets.length}} 项目标</strong><p>{{selected.endReason?'已学记录已保留，未完成目标仍可在课堂学习':'专注满 25 分钟且目标全部完成后休息，最长 50 分钟'}}</p></div>
       <div v-else-if="selected.goal" class="ep-goal"><strong>{{newWords}} / {{selected.goal}} 个新词</strong><p>{{newWords<selected.goal?`专注满 25 分钟且完成 ${selected.goal} 个新词后休息`:'本轮新词目标已完成'}}</p></div>
      </section>
      <section class="ep-report" :class="{'ep-preview':selected.phase==='ready'}">
       <section v-if="selected.targets?.length" class="ep-targets ep-dialog-targets" aria-label="番茄目标">
        <h3>本轮目标</h3>
        <details v-for="group in groups(selected)" :key="`${selected.id}:${group.name}`" :data-category="group.id" open><summary>{{group.name}} <span>{{group.targets.filter(t=>done(selected,t)).length}} / {{group.targets.length}}</span></summary>
         <ul><li v-for="target in group.targets" :key="target.id"><component :is="canOpen(selected)?'button':'span'" :data-target="target.id" :class="{done:done(selected,target)}" @click="openTarget(selected,target)"><span class="ep-target-title">{{target.title}}</span><small :class="{'ep-target-status':done(selected,target)}"><CompletionMark v-show="done(selected,target)" :done="done(selected,target)"/>{{done(selected,target)?'已完成':(target.review?'复习':'新学')+' · '+(canOpen(selected)?'去学习':'待完成')}}</small></component></li></ul>
        </details>
        <div v-if="selected.phase==='ready'" class="ep-actions"><button v-if="canOpen(selected)" data-action="begin-round" @click="startSelected">开始本轮</button><span v-else>结束当前番茄后，即可开始本轮</span></div>
       </section>
       <template v-if="selected.phase!=='ready'"><h3>{{selected.phase==='finished'?'本轮学习报告':'本轮已学内容'}}</h3><div class="ep-metrics"><div><strong>{{selected.items.length}}</strong><span>已完成内容</span></div><div><strong>{{time(selected.elapsedMs)}}</strong><span>学习用时</span></div></div></template>
       <details v-for="item in selected.items" :key="item.id" class="ep-record"><summary><strong>{{item.title}}</strong><span>{{item.newWord?'新词':'已完成'}}</span></summary><p>{{item.detail||'已完成并保存'}}</p></details>
      </section>
     </div>
     <p v-if="error" class="ep-error" role="alert">{{error}} <button @click="act('pomodoroRetry')">重试</button></p>
    </div>
   </template>
  </dialog>
 </section>
</template>

<style scoped>
.ep-history,.ep-restart{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;font-size:14px}
.ep-history select{font:inherit;max-width:100%;min-height:44px;padding:8px;border:1px solid #b9cdc0;border-radius:8px;background:white;color:inherit}
.ep-attempt-time{font-size:12px;line-height:1.7;color:#626e6c;margin:0 0 16px;overflow-wrap:anywhere}
.ep-restart button{font:inherit;min-height:44px;padding:10px 20px;border:1px solid #347679;border-radius:8px;background:#347679;color:white}
.ep-restart button:disabled{opacity:.55;cursor:not-allowed}.ep-restart span{color:#626e6c;font-size:13px}
.ep-history select:focus-visible{outline:3px solid #347679;outline-offset:2px}
.ep-target-status :deep(.completion-mark){width:16px;height:16px;flex-basis:16px;border:0;background:transparent}
.ep-token.expired{background:#f0ebf2;border-color:#b7a7bb;color:#705d75}.ep-token.expired small,.ep-token.expired svg{color:#705d75}.ep-expired .ep-clock{background:conic-gradient(#88728e var(--progress),#eee7f0 0)}.ep-expired h3{color:#705d75}.ep-actions .ep-end{display:block;background:transparent;border-color:#aebbb5;color:#52645c;margin:10px auto 0;min-height:44px}
.english-pomo{margin:-48px 0 -16px;min-width:0;color:#253b3d}.english-pomo:not(.in-library){margin-bottom:12px}.ep-track{display:flex;gap:10px;overflow-x:auto;min-height:64px;overscroll-behavior-x:contain;scrollbar-width:thin}.english-pomo button{font:inherit;cursor:pointer}.ep-token{display:flex;align-items:center;justify-content:flex-start;gap:12px;flex:0 0 230px;min-height:76px;box-sizing:border-box;border:1px solid #dce5de;background:white;border-radius:12px;padding:9px 14px;color:#5d6d62;white-space:nowrap}.ep-token span{font-size:13px;line-height:1.6;text-align:left}.ep-token small{display:block;font-size:12px;line-height:1.6;color:#64776a}.ep-token strong{display:block;font-size:14px;font-weight:600;line-height:1.6;white-space:normal}.ep-token svg{width:30px;height:34px;flex:none;color:#b26c56}.ep-token.running{background:#edf3ef;border-color:#96b1a0;color:#38694f;font-size:29px;font-variant-numeric:tabular-nums;letter-spacing:1px}.ep-token.paused{border-style:dashed}.ep-token.overtime{color:#9c5426;background:#fff2e6;border-color:#d0ab8b}.ep-token:focus-visible{outline:3px solid #38694f;outline-offset:-3px}.ep-dialog{padding:0;border:1px solid #dce5e2;border-radius:20px;width:min(1050px,calc(100% - 40px));max-height:calc(100dvh - 48px);overflow:auto;background:#f5f3ef;color:#253b3d;box-sizing:border-box}.ep-dialog::backdrop{background:#15272880}.ep-top{display:flex;justify-content:space-between;align-items:center;gap:12px;position:sticky;top:0;z-index:1;padding:10px 24px;background:#f5f3ef;border-bottom:1px solid #dce5e2}.ep-top>div{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;min-width:0}.ep-top h2{font-size:18px;line-height:1.45;margin:0;overflow-wrap:anywhere}.ep-top p{margin:0;font-size:13px;line-height:1.5;color:#626e6c;overflow-wrap:anywhere}.ep-close{display:grid;place-items:center;flex:none;background:transparent;border:0;width:44px;height:44px;padding:0;font-size:28px!important;line-height:1;color:#626e6c}.ep-body{padding:16px 24px 24px}.ep-workspace{display:grid;grid-template-columns:290px minmax(0,1fr);gap:24px}.ep-timer,.ep-report{background:white;border:1px solid #dce5e2;border-radius:15px;padding:24px;min-width:0}.ep-timer{text-align:center;align-self:start}.ep-dialog h3{font-size:16px;margin:0 0 16px}.ep-clock{width:210px;height:210px;border-radius:50%;margin:20px auto;background:conic-gradient(#347679 var(--progress),#e7f0ed 0);padding:7px;box-sizing:border-box}.ep-clock>div{display:flex;align-items:center;justify-content:center;flex-direction:column;height:100%;border-radius:50%;background:white}.ep-clock strong{font-size:44px;font-weight:500;font-variant-numeric:tabular-nums}.ep-clock span{font-size:13px;margin-top:8px;color:#626e6c}.ep-actions button,.ep-error button{border:1px solid #347679;border-radius:8px;padding:10px 24px;background:#347679;color:white;min-height:44px}.ep-actions>span{font-size:13px;color:#626e6c}.ep-goal{border-top:1px solid #dce5e2;margin-top:22px;padding-top:18px}.ep-goal p{font-size:12px;line-height:1.7;color:#626e6c}.ep-metrics{display:flex;gap:36px;border-bottom:1px solid #dce5e2;padding:6px 0 24px;margin-bottom:12px}.ep-metrics strong{display:block;font-size:29px;font-weight:500;font-variant-numeric:tabular-nums}.ep-metrics span{display:block;font-size:12px;color:#626e6c;margin-top:6px}.ep-record{border-bottom:1px solid #dce5e2}.ep-record summary{cursor:pointer;padding:16px 0;font-size:14px;min-height:24px}.ep-record summary strong{font-weight:500;overflow-wrap:anywhere}.ep-record summary span{float:right;color:#626e6c;font-size:12px}.ep-record p{font-size:13px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;color:#626e6c}.ep-error{color:#9a382c;font-size:13px;line-height:1.6;background:#fff3ed;padding:8px 12px;border-radius:8px}.ep-error button{padding:4px 14px;margin-left:8px}.ep-dialog button:focus-visible,.ep-record summary:focus-visible{outline:3px solid #347679;outline-offset:2px}
@media(max-width:760px){.english-pomo{margin-top:-32px;margin-bottom:-20px}.ep-track{min-height:52px}.ep-token{flex-basis:205px;min-height:72px;padding:8px 12px}.ep-token span{line-height:1.4}.ep-dialog{width:calc(100% - 16px);max-height:calc(100dvh - 16px);border-radius:16px}.ep-top{padding:8px 16px}.ep-top h2{font-size:16px}.ep-body{padding:16px}.ep-workspace{grid-template-columns:1fr;gap:16px}.ep-timer{padding:14px 16px;display:grid;grid-template-columns:138px minmax(0,1fr);gap:6px 14px;align-items:center}.ep-timer h3{grid-column:1/-1;margin-bottom:4px}.ep-clock{width:138px;height:138px;margin:3px 0}.ep-clock strong{font-size:34px}.ep-clock span{font-size:12px}.ep-actions button{padding:10px 12px;width:100%}.ep-goal{grid-column:1/-1;margin-top:8px;padding-top:10px}.ep-goal p{margin-bottom:0}.ep-report{padding:19px 16px}.ep-metrics{gap:24px}.ep-metrics strong{font-size:25px}}
</style>
<style scoped>
.ep-targets{margin-top:16px;padding:18px 20px;border:1px solid #dce5e2;border-radius:12px;background:#fff}.ep-targets h3{font-size:15px;font-weight:600;margin:0 0 12px}.ep-targets details+details{margin-top:8px}.ep-targets summary{cursor:pointer;font-size:13px;padding:8px 0;color:#53695c}.ep-targets summary span{margin-left:10px;font-variant-numeric:tabular-nums}.ep-targets ul{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:4px 0 10px;padding:0}.ep-targets li{max-width:100%}.ep-targets [data-target]{display:flex;align-items:center;gap:14px;max-width:100%;border:1px solid #dce5e2;border-radius:7px;background:#f7f9f7;padding:10px 12px;min-height:44px;box-sizing:border-box;font-size:13px;color:#253b3d;overflow-wrap:anywhere;text-align:left}.ep-target-title{min-width:0}.ep-targets small{font-size:11px;color:#617668;white-space:nowrap}
.ep-targets .done{border-color:#86ab93;background:#e1efe5;color:#245239;box-shadow:inset 3px 0 #38694f}.done .ep-target-title{font-weight:600}.ep-targets .ep-target-status{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;padding:3px 7px;border-radius:5px;background:#38694f;color:#fff;font-weight:600;line-height:1.4}.ep-target-status svg{width:14px;height:14px;flex:none}
.ep-targets button:hover{border-color:#347679}.ep-targets button:focus-visible,.ep-targets summary:focus-visible{outline:2px solid #347679;outline-offset:2px}.ep-dialog-targets{border:0;padding:0;margin:0 0 24px}.ep-preview{grid-column:1/-1}.ep-plan-done{font-size:14px;color:#38694f;margin:14px 0}.ep-targets li>span{cursor:default}@media(max-width:760px){.ep-targets{padding:14px}.ep-dialog-targets{padding:0}.ep-targets h3{line-height:1.6}.ep-targets ul{gap:6px}.ep-targets [data-target]{gap:8px;flex-wrap:wrap}}
</style>
