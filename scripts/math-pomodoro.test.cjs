const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../app/src/main/assets/web/app-design/math-pomodoro.js');
const unit='math-8b-11',t=1800000000000,study=25*60000;
const options={nodeId:'radical-simplify',nodeTitle:'二次根式的性质与化简'};
const question={id:'question:radical-simplify-1',kind:'question',nodeId:options.nodeId,title:'第 1 题',detail:'照片已保存',status:'submitted'};
const first=()=>P.start(null,unit,t,options);
const last=s=>s.rounds.at(-1);

test('chapter context and immutable state preserve unknown fields',()=>{
 const raw={version:1,unitId:unit,rounds:[],custom:{keep:true}},before=JSON.stringify(raw);
 const s=P.start(raw,unit,t,options);
 assert.equal(JSON.stringify(raw),before);assert.deepEqual(s.custom,{keep:true});
 assert.equal(last(s).nodeId,options.nodeId);assert.equal(last(s).elapsedMs,0);
 assert.deepEqual(P.start(s,unit,t+1,options).rounds.map(r=>r.id),s.rounds.map(r=>r.id));
 assert.throws(()=>P.restore(s,'math-8a-01'),/单元/);
});
test('background catchup stops exactly at 25 minutes and never generates extra rounds',()=>{
 const s=P.advance(first(),unit,t+86400000),r=last(s);
 assert.equal(r.phase,'ready');assert.equal(r.elapsedMs,study);assert.equal(r.endedAt,t+study);
 assert.equal(r.restMs,300000);assert.equal(s.rounds.length,1);
 assert.deepEqual(P.advance(s,unit,t+86400000),s);
 assert.equal(last(P.start(s,unit,t+86400001,options)).phase,'ready');
});
test('pause remains paused beyond five minutes and resumes without counting the pause',()=>{
 let s=P.pause(first(),unit,t+60000);
 s=P.advance(s,unit,t+660000);
 assert.equal(last(s).elapsedMs,60000);assert.equal(last(s).pauseMs,600000);assert.equal(last(s).pausedAt,t+60000);
 s=P.resume(s,unit,t+720000);assert.equal(last(s).pauseMs,660000);assert.equal(last(s).pausedAt,null);
 s=P.advance(s,unit,t+780000);assert.equal(last(s).elapsedMs,120000);assert.equal(last(s).pauseMs,660000);
});
test('reload, repeated pause and backward clocks cannot double count',()=>{
 let s=P.pause(first(),unit,t+10000);s=P.pause(s,unit,t+15000);
 s=P.restore(JSON.parse(JSON.stringify(s)),unit);s=P.advance(s,unit,t+12000);
 assert.equal(last(s).lastAt,t+15000);assert.equal(last(s).elapsedMs,10000);assert.equal(last(s).pauseMs,5000);
 s=P.resume(s,unit,t+14000);s=P.advance(s,unit,t+16000);
 assert.equal(last(s).elapsedMs,11000);
});
test('rest starts explicitly and finishing rest leaves the next round unstarted',()=>{
 let s=P.advance(first(),unit,t+study+60000);
 assert.equal(last(s).phase,'ready');
 s=P.startBreak(s,unit,t+study+120000);assert.equal(last(s).phase,'break');assert.equal(last(s).restMs,300000);
 s=P.advance(s,unit,t+study+420000);assert.equal(last(s).phase,'finished');assert.equal(s.rounds.length,1);
 s=P.start(s,unit,t+study+430000,options);assert.equal(s.rounds.length,2);assert.equal(last(s).elapsedMs,0);assert.equal(last(s).items.length,0);
});
test('the fourth completed round has a long break and stopped rounds do not count',()=>{
 let at=t,s=P.finish(first(),unit,t+1000);assert.equal(last(s).phase,'stopped');
 for(let i=1;i<=4;i++){
  at+=2000000;s=P.start(s,unit,at,options);s=P.advance(s,unit,at+study);
  assert.equal(last(s).restTotalMs,i===4?900000:300000);
  s=P.skipBreak(s,unit,at+study);assert.equal(last(s).phase,'finished');
 }
 assert.equal(s.rounds.length,5);
});
test('early finish preserves actual time and pause totals without claiming a complete round',()=>{
 let s=P.pause(first(),unit,t+20000);s=P.finish(s,unit,t+30000);
 assert.equal(last(s).phase,'stopped');assert.equal(last(s).elapsedMs,20000);assert.equal(last(s).pauseMs,10000);
 assert.equal(last(s).pausedAt,null);assert.equal(last(s).endedAt,t+30000);
 assert.equal(last(P.advance(s,unit,t+study)).elapsedMs,20000);
 assert.throws(()=>P.startBreak(first(),unit,t+1000),/结束|完成/);
});
test('question re-submission updates one record while preserving its first timestamp',()=>{
 let s=P.record(first(),unit,t+1000,question);
 s=P.record(s,unit,t+2000,{...question,status:'incorrect',score:0,attempts:1});
 s=P.record(s,unit,t+3000,{...question,status:'corrected',score:10,attempts:2});
 assert.equal(last(s).items.length,1);assert.equal(last(s).items[0].at,t+1000);
 assert.equal(last(s).items[0].status,'corrected');assert.equal(last(s).items[0].attempts,2);
 const before=JSON.stringify(s);const restored=P.restore(s,unit);restored.rounds[0].items[0].detail='changed';assert.equal(JSON.stringify(s),before);
});
test('unstarted and paused rounds do not absorb automatic completion records',()=>{
 assert.equal(P.record(null,unit,t,question).rounds.length,0);
 const s=P.pause(first(),unit,t+1000);assert.equal(last(P.record(s,unit,t+2000,question)).items.length,0);
 const ready=P.advance(first(),unit,t+study);assert.equal(last(P.record(ready,unit,t+study+1,question)).items.length,0);
});
test('delayed grading belongs to the captured originating round after the next starts',()=>{
 let s=first(),id=last(s).id;s=P.record(s,unit,t+1000,question,id);s=P.skipBreak(s,unit,t+study);
 s=P.start(s,unit,t+study+1000,options);s=P.record(s,unit,t+study+2000,{...question,status:'correct',score:10},id);
 assert.equal(s.rounds[0].items[0].status,'correct');assert.equal(s.rounds[0].items[0].at,t+1000);assert.equal(s.rounds[1].items.length,0);
 assert.equal(s.rounds[0].endedAt,t+study);P.restore(s,unit);
 assert.throws(()=>P.record(s,unit,t+study+3000,question,'missing'),/番茄/);
});
test('malformed records, mismatched units and unsupported versions fail without overwriting',()=>{
 const s=first();
 for(const mutate of [x=>x.version=2,x=>x.rounds[0].elapsedMs=-1,x=>x.rounds[0].elapsedMs=study+1,x=>x.rounds[0].phase='finished',x=>x.rounds[0].pauseMs=NaN,x=>x.rounds[0].restTotalMs=1,x=>x.rounds.push({...x.rounds[0]})]){
  const raw=structuredClone(s);mutate(raw);const before=structuredClone(raw);assert.throws(()=>P.restore(raw,unit));assert.deepEqual(raw,before);
 }
 assert.throws(()=>P.restore(s,'physics-8a-01'));
 assert.throws(()=>P.advance(s,unit,Infinity));
 assert.throws(()=>P.record(s,unit,t+1,{...question,score:11}));
});

test('physics plans survive pause, resume and reload without changing legacy math rounds',()=>{
 const physics='physics-8a-01',planned={nodeId:'source',nodeTitle:'声音来自振动',planId:'physics-8a-01-plan-1'};
 let s=P.start(null,physics,t,planned);
 assert.equal(last(s).planId,planned.planId);
 s=P.start(s,physics,t+1000,{...planned,planId:'different-plan'});
 assert.equal(s.rounds.length,1);assert.equal(last(s).planId,planned.planId);
 s=P.pause(s,physics,t+10000);s=P.restore(JSON.parse(JSON.stringify(s)),physics);s=P.resume(s,physics,t+20000);
 assert.equal(last(s).planId,planned.planId);assert.equal(last(s).elapsedMs,10000);
 assert.equal(Object.hasOwn(last(P.restore(first(),unit)),'planId'),false);
 for(const planId of ['',3,{},null])assert.throws(()=>P.start(null,physics,t,{...planned,planId}),/计划/);
 const broken=structuredClone(s);broken.rounds[0].planId=3;assert.throws(()=>P.restore(broken,physics),/计划/);
});

test('adaptive review and skipped lecture metadata are frozen copies across reload and repeated start',()=>{
 const planned={...options,planId:'plan-1',reviewQuestions:{'task-1':['q-2','q-5']},skippedLearn:['learn-1']};
 let s=P.start(null,unit,t,planned);
 planned.reviewQuestions['task-1'].push('q-6');planned.skippedLearn.push('learn-2');
 assert.deepEqual(last(s).reviewQuestions,{'task-1':['q-2','q-5']});assert.deepEqual(last(s).skippedLearn,['learn-1']);
 s=P.start(s,unit,t+1000,{...options,reviewQuestions:{different:['q-9']},skippedLearn:[]});
 s=P.pause(s,unit,t+2000);s=P.restore(JSON.parse(JSON.stringify(s)),unit);s=P.resume(s,unit,t+4000);
 assert.deepEqual(last(s).reviewQuestions,{'task-1':['q-2','q-5']});assert.deepEqual(last(s).skippedLearn,['learn-1']);
 const legacy=last(P.restore(first(),unit));assert.equal(Object.hasOwn(legacy,'reviewQuestions'),false);assert.equal(Object.hasOwn(legacy,'skippedLearn'),false);
 assert.deepEqual(last(P.start(null,unit,t,{...options,reviewQuestions:{},skippedLearn:[]})).reviewQuestions,{});
});

test('adaptive metadata validation rejects malformed, repeated and oversized ids without changing archives',()=>{
 const invalidReview=[null,[],{'':['q']},{task:[]},{task:['q','q']},{task:['']},{task:[1]},{task:Array(1)},{task:Array.from({length:11},(_,i)=>'q'+i)},Object.fromEntries(Array.from({length:201},(_,i)=>['t'+i,['q']]))];
 const invalidSkipped=[null,{},[''],[3],['a','a'],Array(1),Array.from({length:201},(_,i)=>'t'+i)];
 for(const [field,values] of [['reviewQuestions',invalidReview],['skippedLearn',invalidSkipped]])for(const value of values){
  assert.throws(()=>P.start(null,unit,t,{...options,[field]:value}),/复习|讲解/);
  const raw=first();raw.rounds[0][field]=value;const before=structuredClone(raw);assert.throws(()=>P.restore(raw,unit),/复习|讲解/);assert.deepEqual(raw,before);
 }
 const valid={...options,reviewQuestions:Object.fromEntries(Array.from({length:200},(_,i)=>['t'+i,Array.from({length:10},(_,j)=>'q'+j)])),skippedLearn:Array.from({length:200},(_,i)=>'t'+i)};
 assert.equal(last(P.restore(P.start(null,unit,t,valid),unit)).skippedLearn.length,200);
});

function sessionFixture(){
 const vm=require('node:vm'),fs=require('node:fs'),data=new Map();let at=t,fail=false;
 const storage={getItem:key=>data.get(key)??null,setItem(key,value){if(fail)throw Error('quota');data.set(key,value);}};
 const context={window:{GrowingMathPomodoro:P}};vm.runInNewContext(fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/math-pomodoro-session.js'),'utf8'),context);
 const create=(unitId,subject)=>context.window.GrowingMathPomodoroSession.create({unitId,subject,storage,active:()=>true,now:()=>at});
 return {data,create,advance:ms=>at+=ms,fail:value=>fail=value};
}

test('subject sessions isolate archives and physics chapter switching pauses the prior physics timer',()=>{
 const f=sessionFixture(),math=f.create(unit),physics=f.create('physics-8a-01','physics'),next=f.create('physics-8a-02','physics');
 math.change('start',options);const mathBefore=f.data.get('growing-math-lessons-v1');
 physics.change('start',{nodeId:'source',nodeTitle:'声音',planId:'sound-1'});f.advance(10000);
 next.change('start',{nodeId:'reflection',nodeTitle:'反射',planId:'light-1'});
 assert.equal(f.data.get('growing-math-lessons-v1'),mathBefore);
 const archive=JSON.parse(f.data.get('growing-physics-lessons-v1'));
 assert.equal(archive.pomodoro['physics-8a-01'].rounds[0].pausedAt,t+10000);
 assert.equal(archive.pomodoro['physics-8a-01'].rounds[0].elapsedMs,10000);
 assert.equal(archive.pomodoro['physics-8a-02'].rounds[0].planId,'light-1');
 assert.equal(f.create('physics-8a-01','physics').model().rounds[0].planId,'sound-1');
});

test('physics save retry preserves the intended plan and refuses mismatched subject archives',()=>{
 const f=sessionFixture(),physics=f.create('physics-8a-01','physics');f.fail(true);
 assert.equal(physics.change('start',{nodeId:'source',nodeTitle:'声音',planId:'sound-1'}),false);
 assert.match(physics.model().error,/保存/);f.fail(false);physics.retry();
 assert.equal(physics.model().rounds[0].planId,'sound-1');
 assert.throws(()=>f.create('physics-8a-01','math'),/学科|单元/);
 assert.throws(()=>f.create(unit,'physics'),/学科|单元/);
});
