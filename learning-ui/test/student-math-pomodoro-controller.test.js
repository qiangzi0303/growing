import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),folder='../../app/src/main/assets/web/app-design/',KEY='growing-math-lessons-v1';
async function fixture({unit='math-8a-01',subject='math',data=new Map(),clock={at:1800000000000},request=async()=>''}={}){
 const dom=new JSDOM('<main></main>',{url:'https://learn.test/math-course.html?chapter='+unit,runScripts:'outside-only'}),w=dom.window;let alive=true,fail=false,writes=0;
 for(const [name,file] of Object.entries({GrowingMath:'math-data.js',GrowingPhysics:'physics-data.js',GrowingPracticeProgress:'practice-progress.js',GrowingApplicationPractice:'application-practice.js',GrowingHandwriting:'handwriting-core.js',GrowingCourseTools:'course-tools.js',GrowingMathFeedback:'math-feedback.js'}))w[name]=require(folder+file);
 w.GrowingMathFigure=w.GrowingPhysicsFigure=()=>'<svg></svg>';w.UnitRewards={register(){},update(){}};w.GrowingCourseAI={request};w.GrowingHandwritingAI={request};
 const storage={get length(){return data.size},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem(k,v){if(fail)throw Error('存储已满');writes++;data.set(k,v)},removeItem:k=>data.delete(k)};
 for(const file of ['math-pomodoro.js','math-pomodoro-session.js','student-math-course.js'])w.eval(await readFile(new URL(folder+file,import.meta.url),'utf8'));
 const c=w.GrowingStudentMathCourse.create({subject,params:new URLSearchParams({chapter:unit}),storage,active:()=>alive,now:()=>clock.at});
 return {w,c,data,clock,storage,get writes(){return writes},fail:v=>fail=v,expire:()=>{alive=false},advance(ms){clock.at+=ms;return c.snapshot()},saved(){return JSON.parse(data.get(KEY))},close(){c.destroy();w.close()}};
}
test('every math chapter starts empty, records current actions, and physics has isolated storage',async()=>{
 const dataset=require(folder+'math-data.js'),data=new Map();
 for(const chapter of dataset.chapters){const f=await fixture({unit:chapter.id,data});try{const c=f.c;assert.equal(c.snapshot().pomodoro.rounds.length,0);c.actions.pomodoroStart();c.actions.markRead();const r=c.snapshot().pomodoro.rounds[0];assert.equal(r.nodeId,c.snapshot().selected);assert.equal(r.items.length,1);assert.equal(r.items[0].kind,'read');assert.equal(f.saved().topics[r.nodeId].seen,true);}finally{f.close()}}
 assert.equal(Object.keys(JSON.parse(data.get(KEY)).pomodoro).length,dataset.chapters.length);
 const p=await fixture({subject:'physics',unit:'physics-8a-01'});try{assert.equal(p.c.snapshot().pomodoro.rounds.length,0);p.c.actions.pomodoroStart();assert.ok(p.data.has('growing-physics-lessons-v1'));assert.equal(p.data.has(KEY),false)}finally{p.close()}
});
test('pause, reload, topic changes, no per-second writes, account guard and another chapter pauses the old clock',async()=>{
 const f=await fixture();try{const c=f.c;c.actions.pomodoroStart();const first=c.snapshot().selected,other=c.snapshot().chapter.nodes[1].id,count=f.writes;f.advance(60000);assert.equal(f.writes,count);c.actions.choose(other);assert.equal(c.snapshot().pomodoro.rounds[0].nodeId,first);c.actions.pomodoroPause();f.advance(120000);assert.equal(c.snapshot().pomodoro.rounds[0].elapsedMs,60000);c.actions.pomodoroResume();
 const re=await fixture({data:f.data,clock:f.clock});try{assert.equal(re.c.snapshot().pomodoro.rounds[0].elapsedMs,60000);re.c.actions.pomodoroStart();assert.equal(re.c.snapshot().pomodoro.rounds.length,1)}finally{re.close()}
 const next=await fixture({data:f.data,clock:f.clock,unit:'math-8a-02'});try{next.c.actions.pomodoroStart();assert.notEqual(c.snapshot().pomodoro.rounds[0].pausedAt,null)}finally{next.close()}
 f.expire();const raw=f.data.get(KEY);c.actions.pomodoroResume();f.advance(1800000);assert.equal(f.data.get(KEY),raw);
 }finally{f.close()}
});
test('stored choices enter once, wrong-to-correct updates the same item, old best is not counted',async()=>{
 const f=await fixture();try{const c=f.c;c.actions.pomodoroStart();const q=c.snapshot().questions[0];c.actions.practiceChoice(q.id,(q.answer+1)%4);await c.actions.submitPractice();let r=c.snapshot().pomodoro.rounds[0];assert.equal(r.items.length,1);assert.equal(r.items[0].status,'incorrect');c.actions.practiceChoice(q.id,q.answer);await c.actions.submitPractice();r=c.snapshot().pomodoro.rounds[0];assert.equal(r.items.length,1);assert.equal(r.items[0].status,'corrected');c.actions.pomodoroFinish();c.actions.pomodoroStart();await c.actions.submitPractice();assert.equal(c.snapshot().pomodoro.rounds[1].items.length,0)}finally{f.close()}
});
test('failed save never creates completion, retryable timer error and corrupt archive preserved',async()=>{
 const f=await fixture();try{f.fail(true);f.c.actions.pomodoroStart();assert.match(f.c.snapshot().pomodoro.error,/保存/);f.fail(false);f.c.actions.pomodoroRetry();assert.equal(f.c.snapshot().pomodoro.rounds.length,1);f.fail(true);f.c.actions.markRead();assert.equal(f.c.snapshot().pomodoro.rounds[0].items.length,0);f.fail(false);f.c.actions.markRead();assert.equal(f.c.snapshot().pomodoro.rounds[0].items.length,1)}finally{f.close()}
 const raw=JSON.stringify({version:1,topics:{},pomodoro:{'math-8a-01':{version:99}},custom:{keep:true}}),data=new Map([[KEY,raw]]),bad=await fixture({data});try{bad.c.actions.pomodoroStart();assert.match(bad.c.snapshot().pomodoro.error,/记录|格式/);assert.equal(data.get(KEY),raw)}finally{bad.close()}
});
test('valid delayed recall belongs to originating round and invalid or unsaved grade is not imported',async()=>{
 let resolve;const answer='这是我的完整解释，包含概念条件例子和边界。',f=await fixture({request:()=>new Promise(r=>resolve=r)});try{const c=f.c;c.actions.pomodoroStart();c.actions.draft(answer);const task=c.actions.grade();assert.equal(typeof resolve,'function');f.advance(1500000);c.actions.pomodoroSkipBreak();c.actions.pomodoroStart();resolve(JSON.stringify({criteria:['core','condition','example','boundary'].map((id,i)=>({id,score:[4,2,2,2][i],evidence:'我的完整解释',feedback:'准确'})),good:[],gaps:[],criticalErrors:[],followup:'为什么？',comment:'概念正确'}));await task;const rounds=c.snapshot().pomodoro.rounds;assert.equal(rounds[0].items.length,1);assert.equal(rounds[0].items[0].kind,'recall');assert.equal(rounds[1].items.length,0)}finally{f.close()}
});
test('partial regrading does not import unchanged old answers; cross-round correction is labelled correctly',async()=>{
 const f=await fixture();try{const c=f.c;c.actions.pomodoroStart();const [a,b]=c.snapshot().questions;c.actions.practiceChoice(a.id,(a.answer+1)%4);c.actions.practiceChoice(b.id,b.answer);await c.actions.submitPractice();c.actions.pomodoroFinish();c.actions.pomodoroStart();c.actions.practiceChoice(a.id,a.answer);await c.actions.submitPractice();const r=c.snapshot().pomodoro.rounds[1];assert.equal(r.items.length,1);assert.equal(r.items[0].status,'corrected');assert.ok(r.items[0].id.includes(a.id))}finally{f.close()}
});
test('failed group-save retry keeps the original question round after starting another timer',async()=>{
 const f=await fixture();try{const c=f.c;c.actions.pomodoroStart();const q=c.snapshot().questions[0];c.actions.practiceChoice(q.id,q.answer);const original=f.storage.setItem;let fail=true;f.storage.setItem=(k,v)=>{if(fail&&k===KEY&&JSON.parse(v).topics[c.snapshot().selected]?.practiceRound)throw Error('quota');original(k,v)};await c.actions.submitPractice();assert.equal(c.snapshot().practice.result.saved,false);f.advance(1500000);c.actions.pomodoroSkipBreak();c.actions.pomodoroStart();fail=false;await c.actions.submitPractice();const r=c.snapshot().pomodoro.rounds;assert.equal(r[0].items[0].status,'correct');assert.equal(r[1].items.length,0)}finally{f.close()}
});
test('a failed timer operation does not discard subsequently saved learning actions',async()=>{
 const f=await fixture();try{const c=f.c;c.actions.pomodoroStart();f.fail(true);c.actions.pomodoroPause();f.fail(false);c.actions.markRead();assert.equal(c.snapshot().pomodoro.rounds[0].items.length,1);assert.match(c.snapshot().pomodoro.error,/保存/);c.actions.pomodoroRetry();assert.equal(c.snapshot().pomodoro.error,'')}finally{f.close()}
});
test('retrying an older completion cannot overwrite a newer result from another instance',async()=>{
 const f=await fixture();try{const opts={unitId:'math-8a-01',storage:f.storage,active:()=>true,now:()=>f.clock.at},a=f.w.GrowingMathPomodoroSession.create(opts),b=f.w.GrowingMathPomodoroSession.create(opts);a.change('start',{nodeId:'tri-angles',nodeTitle:'三角形'});const round=a.capture(),item={id:'q',nodeId:'tri-angles',kind:'question',title:'题目',detail:'结果'};f.advance(1000);f.fail(true);a.record({...item,status:'correct'},round);f.fail(false);f.advance(1000);b.record({...item,status:'incorrect'},round);a.retry();assert.equal(a.model().rounds[0].items[0].status,'incorrect')}finally{f.close()}
});
test('new handwritten work is recovered on return while pre-session work stays excluded',async()=>{
 const f=await fixture();let re;try{const c=f.c;c.actions.pomodoroStart();const qs=c.snapshot().questions.filter(q=>q.type==='solution'),C=f.w.GrowingHandwriting,A=f.w.GrowingApplicationPractice;
 for(const [i,q] of qs.entries()){const doc=C.create('math','math-8a-01',A.prompt(q));doc.pages=[[{tool:'pen',width:3,points:[[20,20,.5],[40,40,.5]]}]];doc.updatedAt=new Date(f.clock.at+(i===0?-1000:1000)).toISOString();assert.equal(C.validate(doc),true);f.storage.setItem(C.PREFIX+'12345678-1234-1234-1234-123456789ab'+i,JSON.stringify(doc));}
 f.advance(2000);re=await fixture({data:f.data,clock:f.clock});const items=re.c.snapshot().pomodoro.rounds[0].items;assert.equal(items.length,1);assert.equal(items[0].kind,'question');assert.ok(items[0].id.includes(qs[1].id));assert.equal(items[0].status,'submitted');
 }finally{re?.close();f.close()}
});
