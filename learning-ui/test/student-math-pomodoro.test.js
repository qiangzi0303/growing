import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

let bundle;
async function setup(rounds=[]){
 const component=fileURLToPath(new URL('../src/StudentMathPomodoro.vue',import.meta.url));
 bundle??=build({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,logLevel:'silent',plugins:[vue(),{name:'math-pomo-test',resolveId:id=>id.endsWith('math-pomo-entry')?'\0math-pomo-entry':null,load:id=>id==='\0math-pomo-entry'?`import {createApp,h,reactive,nextTick} from 'vue';import C from ${JSON.stringify(component)};export {nextTick};export function mount(el,model,actions){const state=reactive(model);const app=createApp({render:()=>h(C,{model:state,actions,chapter:{id:'math-8b-11',title:'二次根式'}})});app.mount(el);return {app,state};}`:null}],build:{write:false,lib:{entry:'math-pomo-entry',name:'MathPomoTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const result=await bundle,dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.eval((Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code);
 const calls=[],actions=Object.fromEntries(['Start','Pause','Resume','Finish','StartBreak','SkipBreak','Retry'].map(name=>['pomodoro'+name,()=>calls.push(name)]));
 const mounted=w.MathPomoTest.mount(w.document.querySelector('#root'),{rounds,error:''},actions);
 return {w,actions,calls,state:mounted.state,flush:async()=>{await Promise.resolve();await w.MathPomoTest.nextTick();await w.MathPomoTest.nextTick();},close:()=>{mounted.app.unmount();w.close();},unmount:()=>mounted.app.unmount()};
}
const round=(extra={})=>({id:'r1',index:0,nodeId:'radical-simplify',nodeTitle:'二次根式的性质与化简',phase:'learning',elapsedMs:745000,pauseMs:0,pausedAt:null,restMs:300000,restTotalMs:300000,createdAt:1800000000000,lastAt:1800000745000,endedAt:null,items:[],...extra});
const click=async(s,selector)=>{s.w.document.querySelector(selector).click();await s.flush();};

test('only tomato entries, 25-minute countdown, ready does not open dialog or start rest automatically',async()=>{
 const s=await setup();try{
 await click(s,'[data-action="start"]');assert.deepEqual(s.calls,['Start']);assert.equal(s.w.document.querySelector('dialog[open]'),null);
 assert.equal(s.w.document.querySelector('[data-action="paper"], [data-action="photo"], .mode-control'),null);
 s.state.rounds.push(round());await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'12:35');assert.equal(s.w.document.querySelector('[data-action="start"]'),null);
 s.state.rounds[0].phase='ready';s.state.rounds[0].elapsedMs=1500000;await s.flush();assert.equal(s.w.document.querySelector('dialog[open]'),null);assert.match(s.w.document.body.textContent,/本轮计时完成/);
 await click(s,'[data-action="start-break"]');assert.equal(s.calls.at(-1),'StartBreak');
 s.state.rounds[0].phase='break';s.state.rounds[0].restMs=59000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'00:59');
 s.state.rounds[0].phase='finished';await s.flush();assert.match(s.w.document.querySelector('[data-action="start"]').textContent,/第 2 个番茄/);
 }finally{s.close();}
});
test('read-only record details and distinct submitted/pending metrics; updates preserve expanded records',async()=>{
 const s=await setup([round({items:[{id:'q1',kind:'question',title:'第 1 题',detail:'已提交原稿',status:'submitted'},{id:'q2',kind:'question',title:'第 2 题',detail:'订正通过',status:'corrected'},{id:'read1',kind:'read',title:'图文讲解',detail:'已阅读',status:'read'}]})]);try{
 const opener=s.w.document.querySelector('[data-round]');opener.focus();await click(s,'[data-round]');const d=s.w.document.querySelector('dialog');
 assert.ok(d.open);assert.equal(d.querySelector('input,textarea,form'),null);assert.equal(d.querySelector('[data-metric="questions"]').textContent,'2');assert.equal(d.querySelector('[data-metric="pending"]').textContent,'1');
 assert.ok(!d.textContent.includes('屏幕学习'));assert.doesNotMatch(d.textContent,/计时完成不代表|不计入本轮时长|共用一个计时器|按原来的方式学习|还没有已完成的内容/);
 const detail=d.querySelector('details');detail.open=true;s.state.rounds[0].elapsedMs+=1000;await s.flush();assert.ok(detail.open);
 await click(s,'[data-action="pause"]');assert.equal(s.calls.at(-1),'Pause');s.state.rounds[0].pausedAt=1800000746000;await s.flush();await click(s,'[data-action="resume"]');assert.equal(s.calls.at(-1),'Resume');
 d.dispatchEvent(new s.w.Event('cancel',{cancelable:true}));await s.flush();assert.ok(!d.open);assert.equal(s.w.document.body.style.overflow,'');assert.equal(s.w.document.activeElement,opener);
 await click(s,'[data-round]');s.unmount();assert.equal(s.w.document.body.style.overflow,'');
 }finally{s.close();}
});
test('early finish requires inline confirmation and historical rounds cannot control a later active round',async()=>{
 const s=await setup([round()]);try{
 await click(s,'[data-round]');await click(s,'[data-action="request-finish"]');assert.deepEqual(s.calls,[]);assert.match(s.w.document.querySelector('dialog').textContent,/未完成/);
 await click(s,'[data-action="cancel-finish"]');assert.equal(s.w.document.querySelector('[data-action="confirm-finish"]'),null);
 await click(s,'[data-action="request-finish"]');await click(s,'[data-action="confirm-finish"]');assert.equal(s.calls.at(-1),'Finish');
 s.state.rounds[0].phase='stopped';s.state.rounds.push(round({id:'r2',index:1}));await s.flush();assert.equal(s.w.document.querySelector('dialog [data-action="pause"]'),null);assert.equal(s.w.document.querySelector('dialog [data-action="request-finish"]'),null);
 }finally{s.close();}
});
test('action rejection and storage error are visible, retryable; long rest uses provided total',async()=>{
 const s=await setup();try{
 s.actions.pomodoroStart=()=>Promise.reject(new Error('保存失败'));await click(s,'[data-action="start"]');assert.match(s.w.document.body.textContent,/保存失败/);await click(s,'[data-action="retry"]');assert.equal(s.calls.at(-1),'Retry');
 s.state.rounds.push(round({phase:'break',elapsedMs:1500000,restMs:900000,restTotalMs:900000}));s.state.error='记录同步失败';await s.flush();await click(s,'[data-round]');assert.match(s.w.document.querySelector('dialog').textContent,/15:00/);assert.match(s.w.document.querySelector('dialog').textContent,/记录同步失败/);await click(s,'dialog [data-action="skip-break"]');assert.equal(s.calls.at(-1),'SkipBreak');
 }finally{s.close();}
});
