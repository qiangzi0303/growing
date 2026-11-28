const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../app/src/main/assets/web/app-design/english-pomodoro.js');
const U='english-8a-01',STUDY=1500000,REST=300000;
const LIMIT=50*60000;
const last=s=>s.rounds.at(-1);
const item=(i,newWord=true)=>({id:'word:'+i,kind:'word',title:'word '+i,detail:'已完成',newWord,at:0,result:{answers:['a']}});
function eight(s,at=1000){for(let i=0;i<8;i++)s=P.complete(s,U,at+i,item(i));return s;}
test('relearning appends linked attempts and preserves every failed report',()=>{
 let s=P.start(null,U,100,{newWords:true});s=P.complete(s,U,200,item(1));s=P.advance(s,U,100+LIMIT);
 const first=structuredClone(s.rounds[0]);first.custom={keep:true};s.rounds[0]=structuredClone(first);
 const old=structuredClone(s),again=P.restart(s,U,100+LIMIT+100,{roundId:first.id});
 assert.deepEqual(s,old);assert.deepEqual(again.rounds[0],first);assert.equal(last(again).retryOf,first.id);
 assert.equal(last(again).elapsedMs,0);assert.deepEqual(last(again).items,[]);assert.equal(last(again).goal,10);
 assert.equal(P.restart(again,U,100+LIMIT+101,{roundId:first.id}).rounds.length,2,'a duplicate request reuses the same attempt');
 const stopped=P.finish(again,U,100+LIMIT+1000),snapshot=structuredClone(stopped.rounds);
 const third=P.restart(stopped,U,100+LIMIT+2000,{roundId:last(stopped).id});
 assert.deepEqual(third.rounds.slice(0,2),snapshot);assert.equal(third.rounds.length,3);assert.deepEqual(P.restore(third,U),third);
 assert.throws(()=>P.restart(stopped,U,100+LIMIT+3000,{roundId:first.id}),/最新/);
 const corrupt=structuredClone(third);last(corrupt).createdAt=first.createdAt;assert.throws(()=>P.restore(corrupt,U),/历史/);
});

test('relearning rejects completed tomatoes and does not replace a different running tomato',()=>{
 const finished=P.advance(P.start(null,U,100),U,100+STUDY+REST);
 assert.throws(()=>P.restart(finished,U,100+STUDY+REST,{roundId:last(finished).id}),/重新学习/);
 let stopped=P.finish(P.start(null,U,100,{newWords:true}),U,200);
 const running=P.start(stopped,U,300),before=structuredClone(running);
 assert.throws(()=>P.restart(running,U,400,{roundId:stopped.rounds[0].id}),/当前/);assert.deepEqual(running,before);
});

test('starts empty, immutable, scoped and no precreated next round',()=>{
 const empty=P.restore(null,U);assert.deepEqual(empty,{version:1,unitId:U,rounds:[]});
 const s=P.start(empty,U,100);assert.equal(empty.rounds.length,0);assert.equal(s.rounds.length,1);assert.equal(last(s).goal,0);assert.deepEqual(last(s).items,[]);assert.equal(last(s).index,0);
 assert.deepEqual(P.start(s,U,100),s);assert.throws(()=>P.restore(s,'english-8a-02'),/单元/);assert.throws(()=>P.restore(null,'english-8b-01'),/单元/);
});
test('25 minute generic study and full rest finish without auto starting another',()=>{
 const s=P.start(null,U,1000);
 assert.equal(last(P.advance(s,U,1000+20*60000)).phase,'learning');
 assert.equal(last(P.advance(s,U,1000+STUDY-1)).phase,'learning');
 const rest=P.advance(s,U,1000+STUDY);assert.equal(last(rest).phase,'break');assert.equal(last(rest).restMs,REST);assert.equal(last(rest).elapsedMs,STUDY);
 assert.throws(()=>P.start(rest,U,1000+STUDY+1),/休息/);
 const near=P.advance(rest,U,1000+STUDY+REST-1);assert.equal(last(near).phase,'break');assert.equal(last(near).restMs,1);
 const done=P.advance(near,U,1000+STUDY+REST);assert.equal(last(done).phase,'finished');assert.equal(last(done).finishedAt,1000+STUDY+REST);assert.equal(done.rounds.length,1);
 assert.deepEqual(P.advance(done,U,9000000),done);
 const next=P.start(done,U,9000000);assert.equal(next.rounds.length,2);assert.equal(last(next).index,1);assert.deepEqual(last(next).items,[]);assert.equal(last(next).elapsedMs,0);
});

test('old 20-minute finished and resting rounds remain valid while active rounds use 25 minutes',()=>{
 const raw=P.start(null,U,1000),r=last(raw);
 Object.assign(r,{phase:'break',elapsedMs:20*60000,lastAt:1000+20*60000});
 assert.deepEqual(P.restore(raw,U),raw);
 const finished=P.advance(raw,U,r.lastAt+REST);
 assert.equal(last(finished).phase,'finished');assert.equal(last(finished).elapsedMs,20*60000);
 assert.deepEqual(P.advance(JSON.parse(JSON.stringify(finished)),U,1000+60*60000),finished);
 const next=P.start(finished,U,1000+60*60000);
 assert.equal(last(P.advance(next,U,1000+80*60000)).phase,'learning');
 assert.equal(last(P.advance(next,U,1000+85*60000)).phase,'break');
 const active=P.start(null,U,1000);Object.assign(last(active),{elapsedMs:21*60000,lastAt:1000+21*60000});
 const before=structuredClone(active);assert.deepEqual(P.restore(active,U),before);
 assert.equal(last(P.advance(active,U,1000+25*60000-1)).phase,'learning');
 assert.equal(last(P.advance(active,U,1000+25*60000)).phase,'break');
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
 assert.equal(last(s).pauseUntil,null);s=P.start(s,U,21000,{newWords:true});assert.equal(last(s).elapsedMs,11000);assert.equal(last(s).goal,10);assert.equal(s.rounds.length,1);
 s=P.advance(s,U,310000);assert.equal(last(s).elapsedMs,300000);
 s=P.pause(s,U,311000);const before=last(s).pauseUntil;s=P.start(s,U,312000);assert.equal(last(s).pauseUntil,before);
});
test('delayed callback and JSON reload catch up through pause study rest',()=>{
 const s=P.pause(P.start(null,U,0),U,0),restored=JSON.parse(JSON.stringify(s));
 const result=P.advance(restored,U,REST+STUDY+REST+50000);assert.equal(last(result).phase,'finished');assert.equal(last(result).elapsedMs,STUDY);assert.equal(last(result).finishedAt,REST+STUDY+REST);assert.equal(result.rounds.length,1);
 assert.deepEqual(s,restored);
});
test('new-word round needs 10 unique new words and preserves overtime',()=>{
 let s=P.start(null,U,0,{newWords:true});s=P.advance(s,U,STUDY+10000);assert.equal(last(s).phase,'learning');assert.equal(last(s).elapsedMs,STUDY+10000);
 for(let i=0;i<10;i++)s=P.complete(s,U,STUDY+11000,item('review'+i,false));
 for(let i=0;i<9;i++)s=P.complete(s,U,STUDY+12000,item(i));
 s=P.complete(s,U,STUDY+13000,item(0));assert.equal(last(s).phase,'learning');assert.equal(last(s).items.length,19);
 s=P.complete(s,U,STUDY+14000,item(9));assert.equal(last(s).phase,'break');assert.equal(last(s).elapsedMs,STUDY+14000);assert.equal(last(s).restMs,REST);
 const finished=P.advance(s,U,STUDY+14000+REST);assert.equal(last(finished).phase,'finished');assert.equal(last(finished).elapsedMs,STUDY+14000);
});
test('early mastery waits for time; snapshots are copied and completed content is deduplicated',()=>{
 let s=P.start(null,U,0,{newWords:true});const input=item(0);s=P.complete(s,U,10,input);input.result.answers.push('mutated');assert.deepEqual(last(s).items[0].result.answers,['a']);assert.equal(last(s).items[0].at,10);
 s=eight(s);s=P.complete(s,U,1010,item(8));s=P.complete(s,U,1011,item(9));assert.equal(last(s).items.length,10);assert.equal(last(s).phase,'learning');assert.equal(last(P.advance(s,U,STUDY)).phase,'break');
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

test('planned rounds require every exact new and review target before rest',()=>{
 const targets=[{id:'new',eventId:'word:a',kind:'word',title:'a',newWord:true,review:false,wordId:'a'},{id:'review',eventId:'review:b',kind:'word',title:'b',newWord:false,review:true,wordId:'b'}];
 const planRound={id:'plan-1',kind:'words',title:'学习 a，复习 b',targets};
 let s=P.start(null,U,0,{planRound});assert.equal(last(s).goal,1);assert.equal(last(s).planId,'plan-1');assert.deepEqual(last(s).targets,targets);
 targets[0].title='mutated';assert.equal(last(s).targets[0].title,'a');
 s=P.complete(s,U,10,{...item('other'),id:'word:other'});assert.equal(last(s).goal,1);
 s=P.complete(s,U,20,{...item('a',false),id:'review:a'});
 s=P.advance(s,U,STUDY);assert.equal(last(s).phase,'learning');
 s=P.complete(s,U,STUDY+10,{...item('a'),id:'word:a'});assert.equal(last(s).phase,'learning');
 s=P.complete(s,U,STUDY+20,{...item('b',false),id:'review:b'});assert.equal(last(s).phase,'break');assert.equal(last(s).elapsedMs,STUDY+20);
 s=P.advance(s,U,STUDY+20+REST);assert.equal(last(s).phase,'finished');assert.equal(s.rounds.length,1);
});
test('planned grammar/review targets use event IDs, survive reload, and cannot be replaced by start',()=>{
 const planRound={id:'plan-2',kind:'grammar',title:'语法',targets:[{id:'g',eventId:'point:l:p',kind:'point',title:'语法',newWord:false,review:false}]};
 let s=P.start(null,U,0,{planRound});s=P.pause(s,U,100);s=P.start(s,U,200,{newWords:true,planRound:{...planRound,id:'another'}});assert.equal(last(s).planId,'plan-2');assert.equal(last(s).goal,0);assert.ok(last(s).pauseUntil);
 s=P.resume(s,U,300);s=P.complete(s,U,400,{...item('event',false),kind:'point',eventId:'point:l:p'});s=P.advance(JSON.parse(JSON.stringify(s)),U,STUDY+200);assert.equal(last(s).phase,'break');
 const bad=structuredClone(s);last(bad).targets[0].eventId='unknown';assert.throws(()=>P.restore(bad,U),/目标/);
});
test('legacy 8-word rounds retain their quota and new standalone rounds default to ten',()=>{
 let old=P.start(null,U,0,{newWords:true});last(old).goal=8;old=eight(old);assert.equal(last(P.start(old,U,1100,{newWords:true})).goal,8);assert.equal(last(P.advance(old,U,STUDY)).phase,'break');
 const fresh=P.start(null,U,0,{newWords:true});assert.equal(last(fresh).goal,10);
});

test('unfinished study expires exactly at 50 minutes, stops permanently and retains completed items',()=>{
 let s=P.complete(P.start(null,U,1000,{newWords:true}),U,2000,item(0));
 s=P.advance(s,U,1000+LIMIT-1);assert.equal(last(s).phase,'learning');assert.equal(last(s).elapsedMs,LIMIT-1);
 const ended=P.advance(s,U,1000+LIMIT);assert.equal(last(ended).phase,'finished');assert.equal(last(ended).endReason,'timeout');
 assert.equal(last(ended).elapsedMs,LIMIT);assert.equal(last(ended).finishedAt,1000+LIMIT);assert.equal(last(ended).restMs,0);assert.equal(last(ended).items.length,1);
 assert.deepEqual(P.restore(ended,U),ended);assert.deepEqual(P.advance(ended,U,1000+LIMIT*4),ended);
 assert.deepEqual(P.complete(ended,U,1000+LIMIT+1,item(1)),ended);assert.equal(ended.rounds.length,1);
 const next=P.start(ended,U,1000+LIMIT+1,{newWords:true});assert.equal(next.rounds.length,2);assert.equal(last(next).elapsedMs,0);
});

test('background catchup and reload enforce the limit while excluding paused minutes',()=>{
 let s=P.pause(P.start(null,U,1000,{newWords:true}),U,1000+10*60000);
 const before=JSON.stringify(s);s=P.advance(JSON.parse(before),U,1000+REST+LIMIT-1);assert.equal(last(s).phase,'learning');
 s=P.advance(s,U,1000+REST+LIMIT+900000);assert.equal(last(s).endReason,'timeout');assert.equal(last(s).finishedAt,1000+REST+LIMIT);assert.equal(last(s).elapsedMs,LIMIT);
 assert.equal(last(s).pauseUntil,null);assert.deepEqual(P.restore(s,U),s);
});

test('goals saved before the cap finish normally; the exact deadline cannot credit late work',()=>{
 const planRound={id:'limit-test',title:'学习',kind:'words',targets:[{id:'w',eventId:'word:0',kind:'word',title:'word',newWord:true,review:false}]};
 let s=P.start(null,U,0,{planRound});
 const normal=P.complete(s,U,LIMIT-1,item(0));assert.equal(last(normal).phase,'break');assert.equal(last(normal).endReason,undefined);
 assert.equal(last(P.advance(normal,U,LIMIT+REST)).endReason,undefined);
 const late=P.complete(s,U,LIMIT,item(0));assert.equal(last(late).endReason,'timeout');assert.equal(last(late).items.length,0);
});

test('old over-limit active rounds expire without losing history; old finished records stay intact',()=>{
 const old=P.start(null,U,1000,{newWords:true});Object.assign(last(old),{elapsedMs:90*60000,lastAt:1000+90*60000,items:[{...item(0),at:1000+80*60000}]});
 const result=P.advance(old,U,1000+91*60000);assert.equal(last(result).endReason,'timeout');assert.equal(last(result).elapsedMs,LIMIT);assert.equal(last(result).previousElapsedMs,90*60000);assert.deepEqual(last(result).items,last(old).items);P.restore(result,U);
 const finished=P.advance(P.start(null,U,0),U,STUDY+REST);last(finished).elapsedMs=90*60000;last(finished).lastAt=last(finished).finishedAt=90*60000+REST;
 assert.deepEqual(P.advance(finished,U,100*60000),finished);
 const bad=P.start(null,U,0);last(bad).endReason='timeout';assert.throws(()=>P.restore(bad,U),/结束|超时/);
});

test('manual end stops early or paused study, preserves work and never turns it into successful completion',()=>{
 let s=P.complete(P.start(null,U,1000,{newWords:true}),U,2000,item(0));s=P.pause(s,U,6000);
 const ended=P.finish(s,U,10000,{roundId:last(s).id});assert.equal(last(ended).phase,'finished');assert.equal(last(ended).endReason,'manual');assert.equal(last(ended).elapsedMs,5000);assert.equal(last(ended).finishedAt,10000);assert.equal(last(ended).pauseUntil,null);assert.deepEqual(last(ended).items,last(s).items);
 assert.deepEqual(P.restore(ended,U),ended);assert.deepEqual(P.finish(ended,U,11000),ended);assert.deepEqual(P.complete(ended,U,12000,item(1)),ended);
 const next=P.start(ended,U,12000);assert.throws(()=>P.finish(next,U,13000,{roundId:last(s).id}),/变化/);
 const expired=P.finish(P.start(null,U,0,{newWords:true}),U,LIMIT);assert.equal(last(expired).endReason,'timeout');
});
