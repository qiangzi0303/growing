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
