const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../app/src/main/assets/web/app-design/english-pomodoro.js');
const U='english-8a-01',STUDY=1200000,REST=300000;
const last=s=>s.rounds.at(-1);
const item=(i,newWord=true)=>({id:'word:'+i,kind:'word',title:'word '+i,detail:'已完成',newWord,at:0,result:{answers:['a']}});
function eight(s,at=1000){for(let i=0;i<8;i++)s=P.complete(s,U,at+i,item(i));return s;}
test('starts empty, immutable, scoped and no precreated next round',()=>{
 const empty=P.restore(null,U);assert.deepEqual(empty,{version:1,unitId:U,rounds:[]});
 const s=P.start(empty,U,100);assert.equal(empty.rounds.length,0);assert.equal(s.rounds.length,1);assert.equal(last(s).goal,0);assert.deepEqual(last(s).items,[]);assert.equal(last(s).index,0);
 assert.deepEqual(P.start(s,U,100),s);assert.throws(()=>P.restore(s,'english-8a-02'),/单元/);assert.throws(()=>P.restore(null,'english-8b-01'),/单元/);
});
test('20 minute generic study and full rest finish without auto starting another',()=>{
 const s=P.start(null,U,1000);
 const rest=P.advance(s,U,1000+STUDY);assert.equal(last(rest).phase,'break');assert.equal(last(rest).restMs,REST);assert.equal(last(rest).elapsedMs,STUDY);
 assert.throws(()=>P.start(rest,U,1000+STUDY+1),/休息/);
 const near=P.advance(rest,U,1000+STUDY+REST-1);assert.equal(last(near).phase,'break');assert.equal(last(near).restMs,1);
 const done=P.advance(near,U,1000+STUDY+REST);assert.equal(last(done).phase,'finished');assert.equal(last(done).finishedAt,1000+STUDY+REST);assert.equal(done.rounds.length,1);
 assert.deepEqual(P.advance(done,U,9000000),done);
 const next=P.start(done,U,9000000);assert.equal(next.rounds.length,2);assert.equal(last(next).index,1);assert.deepEqual(last(next).items,[]);assert.equal(last(next).elapsedMs,0);
});
test('pause holds at 4:59.999 and auto resumes exactly at 5 minutes',()=>{
 const s=P.pause(P.start(null,U,1000),U,11000);assert.equal(last(s).elapsedMs,10000);assert.equal(last(s).pauseUntil,311000);
 const again=P.pause(s,U,21000);assert.equal(last(again).pauseUntil,311000);
 const near=P.advance(again,U,310999);assert.equal(last(near).elapsedMs,10000);assert.equal(last(near).pauseUntil,311000);
 const edge=P.advance(near,U,311000);assert.equal(last(edge).elapsedMs,10000);assert.equal(last(edge).pauseUntil,null);
 assert.equal(last(P.advance(edge,U,312000)).elapsedMs,11000);
});
test('early resume clears prior deadline and elapsed time is never reset by start',()=>{
 let s=P.start(null,U,0);s=P.pause(s,U,10000);s=P.resume(s,U,20000);
 assert.equal(last(s).pauseUntil,null);s=P.start(s,U,21000,{newWords:true});assert.equal(last(s).elapsedMs,11000);assert.equal(last(s).goal,8);assert.equal(s.rounds.length,1);
 s=P.advance(s,U,310000);assert.equal(last(s).elapsedMs,300000);
 s=P.pause(s,U,311000);const before=last(s).pauseUntil;s=P.start(s,U,312000);assert.equal(last(s).pauseUntil,before);
});
test('delayed callback and JSON reload catch up through pause study rest',()=>{
 const s=P.pause(P.start(null,U,0),U,0),restored=JSON.parse(JSON.stringify(s));
 const result=P.advance(restored,U,REST+STUDY+REST+50000);assert.equal(last(result).phase,'finished');assert.equal(last(result).elapsedMs,STUDY);assert.equal(last(result).finishedAt,REST+STUDY+REST);assert.equal(result.rounds.length,1);
 assert.deepEqual(s,restored);
});
test('new-word round needs 8 unique new words and preserves overtime',()=>{
 let s=P.start(null,U,0,{newWords:true});s=P.advance(s,U,STUDY+10000);assert.equal(last(s).phase,'learning');assert.equal(last(s).elapsedMs,STUDY+10000);
 for(let i=0;i<10;i++)s=P.complete(s,U,STUDY+11000,item('review'+i,false));
 for(let i=0;i<7;i++)s=P.complete(s,U,STUDY+12000,item(i));
 s=P.complete(s,U,STUDY+13000,item(0));assert.equal(last(s).phase,'learning');assert.equal(last(s).items.length,17);
 s=P.complete(s,U,STUDY+14000,item(7));assert.equal(last(s).phase,'break');assert.equal(last(s).elapsedMs,STUDY+14000);assert.equal(last(s).restMs,REST);
 const finished=P.advance(s,U,STUDY+14000+REST);assert.equal(last(finished).phase,'finished');assert.equal(last(finished).elapsedMs,STUDY+14000);
});
test('early mastery waits for time; snapshots are copied and completed content is deduplicated',()=>{
 let s=P.start(null,U,0,{newWords:true});const input=item(0);s=P.complete(s,U,10,input);input.result.answers.push('mutated');assert.deepEqual(last(s).items[0].result.answers,['a']);assert.equal(last(s).items[0].at,10);
 s=eight(s);assert.equal(last(s).items.length,8);assert.equal(last(s).phase,'learning');assert.equal(last(P.advance(s,U,STUDY)).phase,'break');
 const snapshot=structuredClone(s);P.advance(s,U,STUDY+REST);assert.deepEqual(s,snapshot);
});
test('complete does not invent rounds or append during rest or after finishing',()=>{
 assert.deepEqual(P.complete(null,U,100,item(0)),P.restore(null,U));
 let s=P.start(null,U,0);s=P.advance(s,U,STUDY);assert.equal(last(P.complete(s,U,STUDY+1,item(0))).items.length,0);
 s=P.advance(s,U,STUDY+REST);assert.deepEqual(P.complete(s,U,STUDY+REST+1,item(0)),s);
});
test('rest can pause with same cap; clock rollback never subtracts elapsed time',()=>{
 let s=P.advance(P.start(null,U,0),U,STUDY);s=P.pause(s,U,STUDY+10000);assert.equal(last(s).restMs,REST-10000);
 s=P.advance(s,U,STUDY+REST+10000);assert.equal(last(s).restMs,REST-10000);assert.equal(last(s).pauseUntil,null);
 const before=structuredClone(s);s=P.advance(s,U,STUDY+REST);assert.deepEqual(s,before);
 assert.equal(last(P.advance(s,U,STUDY+REST+REST)).phase,'finished');
});
test('strict bad-state validation, unknown fields preserved and malformed items rejected',()=>{
 const s=P.start(null,U,1000);s.future={enabled:true};last(s).futureRound='keep';const restored=P.restore(s,U);assert.deepEqual(restored.future,{enabled:true});assert.equal(last(restored).futureRound,'keep');
 const invalid=[{...s,version:9},{...s,rounds:{}},{...s,unitId:'english-8a-02'}];
 for(const patch of [{elapsedMs:-1},{elapsedMs:NaN},{restMs:REST+1},{phase:'x'},{index:4},{goal:4},{pauseUntil:500},{createdAt:2000},{lastAt:0},{items:[item(0)]}]){const x=structuredClone(s);Object.assign(last(x),patch);invalid.push(x)}
 const two=structuredClone(s);two.rounds.push({...last(two),id:'second',index:1});invalid.push(two);
 for(const raw of invalid)assert.throws(()=>P.restore(raw,U),/记录|单元/);
 for(const at of [NaN,Infinity,-1,1.5])assert.throws(()=>P.advance(s,U,at),/时间/);
 assert.throws(()=>P.complete(s,U,2000,{...item(0),newWord:'yes'}),/内容/);
});
