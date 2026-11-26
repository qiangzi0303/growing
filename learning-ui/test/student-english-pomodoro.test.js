import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

async function setup(rounds=[]){
 const component=fileURLToPath(new URL('../src/StudentEnglishPomodoro.vue',import.meta.url));
 const result=await build({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,logLevel:'silent',plugins:[vue(),{name:'pomo-test',resolveId:id=>id.endsWith('pomo-entry')?'\0pomo-entry':null,load:id=>id==='\0pomo-entry'?`import {createApp,h,reactive,nextTick} from 'vue';import C from ${JSON.stringify(component)};export {nextTick};export function mount(el,model,actions){const state=reactive(model);const app=createApp({render:()=>h(C,{model:state,actions,unit:{number:1,title:'Friendship'},view:'words'})});app.mount(el);return {app,state};}`:null}],build:{write:false,lib:{entry:'pomo-entry',name:'PomoTest',formats:['iife'],cssFileName:'pomo-test'},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.eval((Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code);
 const calls=[],actions=Object.fromEntries(['pomodoroStart','pomodoroPause','pomodoroResume','pomodoroRetry'].map(name=>[name,()=>calls.push(name)]));
 const mounted=w.PomoTest.mount(w.document.querySelector('#root'),{rounds,error:''},actions);
 return {w,actions,calls,state:mounted.state,flush:async()=>{await Promise.resolve();await w.PomoTest.nextTick();await w.PomoTest.nextTick();},close:()=>{mounted.app.unmount();w.close();},unmount:()=>mounted.app.unmount()};
}
const round=(extra={})=>({id:'r1',index:0,phase:'learning',elapsedMs:755000,restMs:0,pauseUntil:null,goal:0,items:[],...extra});

test('start creates no preview rounds or automatic dialog; running and break entries show only time',async()=>{
 const s=await setup();try{
 s.w.document.querySelector('[data-action="start"]').click();await s.flush();assert.deepEqual(s.calls,['pomodoroStart']);assert.equal(s.w.document.querySelector('dialog[open]'),null);
 s.state.rounds.push(round());await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'07:25');assert.equal(s.w.document.querySelector('[data-action="start"]'),null);
 s.state.rounds[0].elapsedMs=1201000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'+00:01');
 s.state.rounds[0].phase='break';s.state.rounds[0].restMs=300000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'05:00');assert.equal(s.w.document.querySelector('[data-action="start"]'),null);
 s.state.rounds[0].restMs=60000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'01:00');
 s.state.rounds[0].restMs=59000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'00:59');
 s.state.rounds[0].phase='finished';await s.flush();assert.match(s.w.document.querySelector('[data-action="start"]').textContent,/第 2 个番茄/);
 }finally{s.close();}
});
test('read-only records remain expanded across ticks; dialog closes and restores focus and scroll',async()=>{
 const s=await setup([round({items:[{id:'word1',kind:'word',title:'friendship',detail:'七次默写完成',newWord:true}]})]);try{
 const opener=s.w.document.querySelector('[data-round]');opener.focus();opener.click();await s.flush();
 const d=s.w.document.querySelector('dialog');assert.ok(d.open);assert.equal(d.querySelector('input,textarea,form'),null);assert.match(d.textContent,/friendship/);assert.ok(!d.textContent.includes('/ 8'));assert.equal(s.w.document.body.style.overflow,'hidden');
 const detail=d.querySelector('details');detail.open=true;s.state.rounds[0].elapsedMs+=1000;await s.flush();assert.equal(detail.open,true);
 d.querySelector('[data-action="pause"]').click();await s.flush();assert.equal(s.calls.at(-1),'pomodoroPause');s.state.rounds[0].pauseUntil=Date.now()+300000;s.state.rounds[0].goal=8;await s.flush();assert.match(d.textContent,/1 \/ 8/);d.querySelector('[data-action="resume"]').click();await s.flush();assert.equal(s.calls.at(-1),'pomodoroResume');
 d.dispatchEvent(new s.w.Event('cancel',{cancelable:true}));await s.flush();assert.equal(d.open,false);assert.equal(s.w.document.body.style.overflow,'');assert.equal(s.w.document.activeElement,opener);
 opener.click();await s.flush();d.dispatchEvent(new s.w.MouseEvent('click',{bubbles:true}));await s.flush();assert.equal(d.open,false);
 opener.click();await s.flush();s.unmount();assert.equal(s.w.document.body.style.overflow,'');
 }finally{s.close();}
});
test('action errors are visible and retryable',async()=>{
 const s=await setup();try{
 s.actions.pomodoroStart=()=>Promise.reject(new Error('保存失败'));s.w.document.querySelector('[data-action="start"]').click();await s.flush();assert.match(s.w.document.body.textContent,/保存失败/);s.w.document.querySelector('[data-action="retry"]').click();await s.flush();assert.equal(s.calls.at(-1),'pomodoroRetry');
 }finally{s.close();}
});
