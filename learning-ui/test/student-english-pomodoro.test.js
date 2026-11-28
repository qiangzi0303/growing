import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

async function setup(rounds=[],extra={}){
 const component=fileURLToPath(new URL('../src/StudentEnglishPomodoro.vue',import.meta.url));
 const result=await build({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,logLevel:'silent',plugins:[vue(),{name:'pomo-test',resolveId:id=>id.endsWith('pomo-entry')?'\0pomo-entry':null,load:id=>id==='\0pomo-entry'?`import {createApp,h,reactive,nextTick} from 'vue';import C from ${JSON.stringify(component)};export {nextTick};export function mount(el,model,actions){const state=reactive(model);const app=createApp({render:()=>h(C,{model:state,actions,unit:{number:1,title:'Friendship'},view:'words'})});app.mount(el);return {app,state};}`:null}],build:{write:false,lib:{entry:'pomo-entry',name:'PomoTest',formats:['iife'],cssFileName:'pomo-test'},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.eval((Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code);
 const calls=[],actions=Object.fromEntries(['pomodoroStart','pomodoroPause','pomodoroResume','pomodoroRetry','pomodoroEnd','pomodoroRestart'].map(name=>[name,(...args)=>calls.push(args.length?[name,...args]:name)]));
 actions.pomodoroOpenTarget=(id,planId)=>calls.push(['open',id,!!w.document.querySelector('dialog[open]'),planId]);
 const mounted=w.PomoTest.mount(w.document.querySelector('#root'),{rounds,error:'',...extra},actions);
 return {w,actions,calls,state:mounted.state,flush:async()=>{await Promise.resolve();await w.PomoTest.nextTick();await w.PomoTest.nextTick();},close:()=>{mounted.app.unmount();w.close();},unmount:()=>mounted.app.unmount()};
}
const round=(extra={})=>({id:'r1',index:0,phase:'learning',elapsedMs:755000,restMs:0,pauseUntil:null,goal:0,items:[],...extra});
const targets=[{id:'t1',eventId:'word:w1',title:'friendship',kind:'word',newWord:true},{id:'t2',eventId:'word:w2',title:'review word',kind:'word',review:true}];
const plan={rounds:[{id:'p1',title:'单词',targets},{id:'p2',title:'语法',targets:[{id:'t3',eventId:'grammar:g1',title:'Grammar',kind:'grammar'}]}]};
test('relearning stays in the same tomato slot and history remains read-only with its original report',async()=>{
 const first=round({planId:'p2',phase:'finished',endReason:'timeout',elapsedMs:3000000,targets,createdAt:1800000000000,finishedAt:1800003000000,items:[{id:'old',title:'原学习内容',detail:'旧记录完整保留',newWord:true}]});
 const s=await setup([first],{plan});try{
  const token=s.w.document.querySelector('[data-round="r1"]');token.click();await s.flush();
  assert.match(s.w.document.querySelector('.ep-attempt-time').textContent,/开始：.*结束：/);
  s.actions.pomodoroRestart=id=>{s.calls.push(['pomodoroRestart',id]);s.state.rounds.push(round({id:'r2',index:1,planId:'p2',targets,retryOf:id,elapsedMs:0}));return true;};
  s.w.document.querySelector('[data-action="restart-round"]').click();await s.flush();
  assert.deepEqual(s.calls.at(-1),['pomodoroRestart','r1']);assert.equal(s.w.document.querySelectorAll('.ep-token').length,2);
  assert.match(s.w.document.querySelector('dialog h2').textContent,/第 2 \/ 2/);assert.equal(s.w.document.querySelector('.ep-clock strong').textContent,'25:00');
  assert.equal(s.w.document.querySelector('[data-round="r2"]'),token,'slot and focus target survive restart');
  const select=s.w.document.querySelector('.ep-history select');assert.equal(select.options.length,2);
  select.value='r1';select.dispatchEvent(new s.w.Event('change'));await s.flush();
  assert.equal(s.w.document.querySelector('.ep-clock strong').textContent,'50:00');assert.match(s.w.document.querySelector('.ep-record').textContent,/旧记录完整保留/);
  assert.equal(s.w.document.querySelector('[data-action="restart-round"],dialog button[data-target],[data-action="pause"]'),null);
  select.value='r2';select.dispatchEvent(new s.w.Event('change'));await s.flush();assert.ok(s.w.document.querySelector('[data-action="pause"]'));
  s.w.document.querySelector('.ep-close').click();await s.flush();assert.equal(s.w.document.activeElement,token);assert.equal(s.w.document.body.style.overflow,'');
 }finally{s.close();}
});

test('legacy unplanned tomatoes keep one slot and their own linked history',async()=>{
 const first=round({phase:'finished',endReason:'timeout',elapsedMs:3000000});
 const s=await setup([first,round({id:'r2',index:1,retryOf:'r1',phase:'finished',endReason:'manual'}),round({id:'other',index:2,phase:'finished'})]);try{
  assert.equal(s.w.document.querySelectorAll('.ep-token').length,2);
  s.w.document.querySelector('[data-round="r2"]').click();await s.flush();
  const select=s.w.document.querySelector('.ep-history select');assert.ok(select);assert.equal(select.options.length,2);
  assert.ok(s.w.document.querySelector('[data-action="restart-round"]'));
  select.value='r1';select.dispatchEvent(new s.w.Event('change'));await s.flush();
  assert.equal(s.w.document.querySelector('.ep-clock strong').textContent,'50:00');
  assert.equal(s.w.document.querySelector('[data-action="restart-round"]'),null);
 }finally{s.close();}
});

test('failed restart stays on the old record and restart is disabled during another active tomato',async()=>{
 const s=await setup([round({phase:'finished',endReason:'manual',planId:'p1',targets})],{plan});try{
  s.w.document.querySelector('[data-round="r1"]').click();await s.flush();
  s.actions.pomodoroRestart=()=>Promise.reject(Error('记录保存失败'));
  s.w.document.querySelector('[data-action="restart-round"]').click();await s.flush();
  assert.match(s.w.document.querySelector('dialog').textContent,/记录保存失败/);assert.equal(s.state.rounds.length,1);
  s.state.rounds.push(round({id:'other',index:1,planId:'p2'}));await s.flush();
  assert.equal(s.w.document.querySelector('[data-action="restart-round"]').disabled,true);
  assert.match(s.w.document.querySelector('.ep-restart').textContent,/结束当前番茄/);
 }finally{s.close();}
});

test('legacy retries stay one numbered tomato with all of its attempts accessible',async()=>{
 const s=await setup([round({phase:'finished',endReason:'timeout'}),round({id:'r2',index:1,retryOf:'r1',phase:'finished',endReason:'manual'})]);try{
  assert.equal(s.w.document.querySelectorAll('.ep-token').length,1);assert.match(s.w.document.querySelector('[data-action=start]').textContent,/第 2 个/);
  s.w.document.querySelector('[data-round=r2]').click();await s.flush();assert.match(s.w.document.querySelector('dialog h2').textContent,/第 1 \/ 1/);
  assert.equal(s.w.document.querySelectorAll('.ep-history option').length,2);assert.ok(s.w.document.querySelector('[data-action=restart-round]'));
 }finally{s.close();}
});

test('page has only the strip; next and future goals are shown in dialogs',async()=>{
 const s=await setup([],{plan,nextPlanId:'p1'});try{
 assert.equal(s.w.document.querySelector('.english-pomo > .ep-targets'),null);
 s.w.document.querySelector('[data-action="start"]').click();await s.flush();assert.match(s.w.document.querySelector('dialog h2').textContent,/第 1 \/ 2/);assert.equal(s.calls.length,0);
 s.w.document.querySelector('dialog [data-target="t1"]').click();await s.flush();assert.deepEqual(s.calls.at(-1),['open','t1',false,'p1']);
 s.w.document.querySelector('[data-round="p2"]').click();await s.flush();const d=s.w.document.querySelector('dialog');assert.match(d.textContent,/Grammar/);assert.ok(d.querySelector('button[data-target]'));assert.equal(d.querySelector('input,textarea,form'),null);
 d.querySelector('[data-action="begin-round"]').click();await s.flush();assert.deepEqual(s.calls.at(-1),['pomodoroStart','p2']);
 }finally{s.close();}
});
test('targets retain expansion across ticks, reflect saved events and close dialog before navigation',async()=>{
 const s=await setup([round({planId:'p1',title:'单词',targets,items:[{id:'record1',eventId:'word:w1',title:'friendship'}]})],{plan,nextPlanId:'p2'});try{
 s.w.document.querySelector('[data-round="r1"]').click();await s.flush();
 assert.doesNotMatch(s.w.document.querySelector('[data-target="t1"]').textContent,/已完成/,'a review event cannot satisfy a new-word target');
 s.state.rounds[0].items[0].newWord=true;await s.flush();
 const detail=s.w.document.querySelector('.ep-targets details');detail.open=true;s.state.rounds[0].elapsedMs+=1000;await s.flush();assert.ok(detail.open);assert.match(s.w.document.querySelector('[data-target="t1"]').textContent,/已完成/);
 s.w.document.querySelector('dialog [data-target="t2"]').click();await s.flush();assert.deepEqual(s.calls.at(-1),['open','t2',false,'p1']);
 s.state.rounds[0].phase='break';await s.flush();assert.equal(s.w.document.querySelector('.ep-targets button[data-target]'),null);
 s.state.rounds[0].phase='finished';s.state.rounds.push(round({id:'r2',planId:'p2',phase:'finished'}));await s.flush();assert.equal(s.w.document.querySelector('[data-action="start"]'),null);
 }finally{s.close();}
});

test('start creates no preview rounds or automatic dialog; running and break entries show only time',async()=>{
 const s=await setup();try{
 s.w.document.querySelector('[data-action="start"]').click();await s.flush();assert.deepEqual(s.calls,['pomodoroStart']);assert.equal(s.w.document.querySelector('dialog[open]'),null);
 s.state.rounds.push(round());await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'12:25');assert.equal(s.w.document.querySelector('[data-action="start"]'),null);
 s.state.rounds[0].elapsedMs=1200000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'05:00');assert.equal(s.w.document.querySelector('.overtime'),null);
 s.state.rounds[0].elapsedMs=1501000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'+00:01');assert.ok(s.w.document.querySelector('.overtime'));
 s.state.rounds[0].phase='break';s.state.rounds[0].restMs=300000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'05:00');assert.equal(s.w.document.querySelector('[data-action="start"]'),null);
 s.state.rounds[0].restMs=60000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'01:00');
 s.state.rounds[0].restMs=59000;await s.flush();assert.equal(s.w.document.querySelector('[data-round]').textContent.trim(),'00:59');
 s.state.rounds[0].phase='finished';await s.flush();assert.match(s.w.document.querySelector('[data-action="start"]').textContent,/第 2 个番茄/);assert.ok(s.w.document.querySelector('.ep-smile .ep-happy-face'));
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

test('manual ending keeps its report open; timeout uses a rotten icon and stays read-only',async()=>{
 const s=await setup([round({planId:'p2',targets})],{plan});try{
 s.w.document.querySelector('[data-round="r1"]').click();await s.flush();assert.match(s.w.document.querySelector('dialog h2').textContent,/第 2 \/ 2/);
 s.w.document.querySelector('[data-action="end-round"]').click();await s.flush();assert.deepEqual(s.calls.at(-1),['pomodoroEnd','r1']);
 Object.assign(s.state.rounds[0],{phase:'finished',endReason:'manual'});await s.flush();assert.match(s.w.document.querySelector('[data-round="r1"]').textContent,/手动结束/);assert.equal(s.w.document.querySelector('[data-action="end-round"]'),null);assert.equal(s.w.document.querySelector('dialog button[data-target]'),null);assert.equal(s.w.document.querySelector('.ep-happy-face'),null);
 Object.assign(s.state.rounds[0],{endReason:'timeout',elapsedMs:3000000});await s.flush();assert.ok(s.w.document.querySelector('.ep-token.expired .ep-rotten'));assert.match(s.w.document.querySelector('dialog').textContent,/50:00/);assert.match(s.w.document.querySelector('dialog').textContent,/50 分钟上限/);
 assert.equal(s.w.document.querySelectorAll('.ep-token[data-action="start"]').length,1);assert.equal(s.w.document.querySelector('.ep-happy-face'),null);
 }finally{s.close();}
});
