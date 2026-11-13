import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),assets=new URL('../../app/src/main/assets/web/',import.meta.url);
async function fixture({saved,active=()=>true,request=async()=>''}={}){
 const filename=(await readdir(new URL('fraction-ops/',assets))).find(f=>f.endsWith('.html'));
 const html=await readFile(new URL('fraction-ops/'+filename,assets),'utf8');
 const dom=new JSDOM('<main></main>',{url:'https://learn.test/fraction-ops/class.html',runScripts:'outside-only'}),w=dom.window;
 const dataScript=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].find(match=>match[1].includes('MINUTE_DATA'));
 assert.ok(dataScript,'fraction data script must be present');
 w.eval(dataScript[1].split('(function(root,factory)')[0]);
 for(const [key,file] of Object.entries({GrowingHandwriting:'handwriting-core.js',GrowingPracticeProgress:'practice-progress.js',GrowingApplicationPractice:'application-practice.js'}))w[key]=require('../../app/src/main/assets/web/app-design/'+file);
 w.UnitRewards={register(){},update(){}};w.GrowingCourseAI={request};
 w.GrowingRewards=require('../../app/src/main/assets/web/app-design/reward-engine.js');
 if(saved!==undefined)w.localStorage.setItem('fraction-minute-v1',typeof saved==='string'?saved:JSON.stringify(saved));
 w.eval(await readFile(new URL('app-design/student-fraction-course.js',assets),'utf8'));
 const controller=w.GrowingStudentFractionCourse.create({storage:w.localStorage,active,params:new URLSearchParams()});
 return {w,controller,close(){controller.destroy();w.close();}};
}
test('fraction keeps eleven original topics, canonical photo IDs and saved drafts',async()=>{
 const f=await fixture({saved:{topics:{domain:{draft:'旧复述',attempts:[],exams:[],doubts:[]}},extra:'保留扩展字段'}});
 try{const c=f.controller;c.actions.choose('domain');const m=c.snapshot();assert.equal(m.topics.length,11);assert.equal(m.record.draft,'旧复述');assert.equal(m.questions[0].id,'meaning-application-1');c.actions.draft('新的解释');const saved=JSON.parse(f.w.localStorage.getItem('fraction-minute-v1'));assert.equal(saved.topics.domain.draft,'新的解释');assert.equal(saved.extra,'保留扩展字段');assert.equal(m.lesson.title,f.w.MINUTE_LESSONS.domain[0].title);}finally{f.close();}
});
test('corrupt records are not overwritten and unsaved draft remains visible',async()=>{
 for(const saved of ['{broken',JSON.stringify({topics:{domain:{draft:'旧',attempts:'broken'}}})]){const f=await fixture({saved});try{f.controller.actions.draft('本地草稿');assert.equal(f.w.localStorage.getItem('fraction-minute-v1'),saved);assert.equal(f.controller.snapshot().record.draft,'本地草稿');assert.match(f.controller.snapshot().storageError,/原|读取/);}finally{f.close();}}
});
test('real evidence rubric keeps 8/10 threshold and critical errors cap score',async()=>{
 let critical=false;const f=await fixture({request:async()=>JSON.stringify({criteria:['core','condition','example','boundary'].map((id,i)=>({id,score:[4,2,2,2][i],evidence:'我的解释',feedback:'准确'})),good:[],gaps:[],criticalErrors:critical?['核心错误']:[],followup:'为什么',comment:'核对'})});
 try{const c=f.controller;c.actions.open('retell');c.actions.draft('这是我的解释与例子');await c.actions.grade();assert.equal(c.snapshot().record.attempts.at(-1).score,10);assert.equal(c.snapshot().topics[0].mastered,true);critical=true;await c.actions.grade();assert.equal(c.snapshot().record.attempts.at(-1).score,7.5);}finally{f.close();}
});
test('destroy and changed account reject late AI grades',async()=>{
 let resolve,valid=true;const f=await fixture({active:()=>valid,request:()=>new Promise(r=>resolve=r)});const c=f.controller;c.actions.draft('这是我的解释与例子');const task=c.actions.grade(),before=f.w.localStorage.getItem('fraction-minute-v1');valid=false;c.destroy();resolve('{}');await task;assert.equal(f.w.localStorage.getItem('fraction-minute-v1'),before);f.w.close();
});
test('specialist training stays locked and original answers survive completion',async()=>{
 const f=await fixture();try{const c=f.controller;c.actions.special();assert.equal(c.snapshot().view,'retell');assert.equal(c.snapshot().run,null);assert.match(c.snapshot().message,/8/);}finally{f.close();}
});
test('specialist completion preserves original qids and never substitutes textbook verification',async()=>{
 const f=await fixture({saved:{topics:{definition:{draft:'原解释',attempts:[{valid:true,score:8,criticalErrors:[],at:1000}],exams:[],doubts:[]}}}});
 try{const c=f.controller;c.actions.special();const expected=c.snapshot().run.items.map(q=>q.id);while(c.snapshot().view!=='result'){const m=c.snapshot(),q=m.run.items[m.run.i];if(!m.run.answered){if(q.type==='fill')c.actions.examInput(q.answer[0]);else c.actions.pick(q.answer);}c.actions.answerExam();}const saved=JSON.parse(f.w.localStorage.getItem('fraction-minute-v1')),exam=saved.topics.definition.exams.at(-1);assert.equal(exam.real,true);assert.equal(JSON.stringify(exam.answers.map(a=>a.qid)),JSON.stringify(expected));assert.equal(exam.correct,exam.total);assert.equal(c.snapshot().topics[0].verified,false);}finally{f.close();}
});
test('reward ledger imports old promise, uses captured storage and keeps earned peak after reset',async()=>{
 const f=await fixture({saved:{rewards:{version:1,config:{gameMinutes:120,cashYuan:200},verified:[],award:{unlockedAt:1000,gameMinutes:120,cashYuan:200,game:{at:1000,parent:'妈妈'}}},topics:{}}});
 try{const c=f.controller,m=c.snapshot();assert.equal(m.rewardLedger.peak,1);assert.equal(m.rewardLedger.paidGame,120);assert.equal(m.rewardAmounts.availableCash,20000);assert.equal(m.rewardLocked,true);assert.equal(c.actions.redeemReward('cash','爸爸',false),false);assert.equal(c.actions.redeemReward('cash','爸爸',true),true);assert.equal(c.snapshot().rewardAmounts.availableCash,0);assert.equal(c.actions.reset(true),true);assert.equal(c.snapshot().rewardLedger.paidCash,20000);assert.equal(c.snapshot().rewardLedger.peak,1);}finally{f.close();}
});
test('lesson visuals are read-only and lesson scene changes keep original four panels',async()=>{
 const f=await fixture();try{for(const t of f.controller.snapshot().topics){f.controller.actions.choose(t.id);for(let i=0;i<4;i++){f.controller.actions.scene(i);const m=f.controller.snapshot();assert.equal(m.lesson.title,f.w.MINUTE_LESSONS[t.id][i].title);assert.doesNotMatch(m.lesson.visual,/<(?:button|input|textarea|select|a)\b|\son\w+\s*=/i);}}}finally{f.close();}
});
test('audio preserves original scene timestamps, playback speed, pause and automatic closed-book retell',async()=>{
 const f=await fixture();try{const c=f.controller;let element;f.w.URL.createObjectURL=()=> 'blob:lesson';f.w.URL.revokeObjectURL=()=>{};f.w.Audio=class{constructor(){element=this;this.currentTime=0;}play(){return Promise.resolve();}pause(){}removeAttribute(){}load(){}};
  c.actions.rate(0.9);await c.actions.play();assert.equal(element.playbackRate,0.9);assert.equal(c.snapshot().playing,true);element.currentTime=f.w.MINUTE_AUDIO.definition.starts[2]+0.01;element.ontimeupdate();assert.equal(c.snapshot().scene,2);c.actions.pause();assert.equal(c.snapshot().paused,true);c.actions.pause();assert.equal(c.snapshot().paused,false);element.onended();assert.equal(c.snapshot().view,'retell');assert.equal(c.snapshot().playing,false);
 }finally{f.close();}
});
test('photo regrading preserves saved original and refuses stale or departed-session results',async()=>{
 const f=await fixture();try{const c=f.controller,w=f.w,q=c.snapshot().questions[0],C=w.GrowingHandwriting,A=w.GrowingApplicationPractice,doc=C.create('math','math-8b-10',A.prompt(q)),key=C.PREFIX+'12345678-1234-1234-1234-123456789abc';doc.photos=['data:image/jpeg;base64,'+'/9j/'+'AAAA'];w.localStorage.setItem(key,JSON.stringify(doc));let resolve;w.Image=class{decode(){return Promise.resolve();}};w.GrowingHandwritingAI={pageImage:async()=> 'photo',request:()=>new Promise(r=>resolve=r)};
  const task=c.actions.submitPhoto(q.id);await new Promise(r=>setTimeout(r,0));assert.equal(typeof resolve,'function');const changed=JSON.parse(w.localStorage.getItem(key));C.change(changed);w.localStorage.setItem(key,JSON.stringify(changed));resolve({score:100,parts:[20,30,30,20],feedback:'正确',needsReview:false,source:'handwriting',corrections:[],knowledge:[{nodeId:q.topic,score:100,feedback:'正确'}]});await task;assert.equal(JSON.parse(w.localStorage.getItem(key)).grades.length,0);assert.match(c.snapshot().questions[0].message,/更新/);
  const late=c.actions.submitPhoto(q.id);await new Promise(r=>setTimeout(r,0));const before=w.localStorage.getItem(key);c.destroy();resolve({});await late;assert.equal(w.localStorage.getItem(key),before);assert.ok(JSON.parse(before).photos[0]);
 }finally{f.close();}
});
test('invalid nested historical entries block archive writes while a failed save keeps current draft',async()=>{
 const saved=JSON.stringify({topics:{definition:{draft:'原稿',attempts:[null],exams:[],doubts:[]}}}),f=await fixture({saved});try{f.controller.actions.draft('当前草稿');assert.equal(f.w.localStorage.getItem('fraction-minute-v1'),saved);assert.match(f.controller.snapshot().storageError,/原|读取/);}finally{f.close();}
 const g=await fixture();try{const c=g.controller,original=g.w.Storage.prototype.setItem;g.w.Storage.prototype.setItem=()=>{throw Error('quota');};c.actions.draft('不能丢失的临时草稿');assert.equal(c.snapshot().record.draft,'不能丢失的临时草稿');assert.match(c.snapshot().storageError,/quota/);g.w.Storage.prototype.setItem=original;c.beforeLeave();assert.equal(JSON.parse(g.w.localStorage.getItem('fraction-minute-v1')).topics.definition.draft,'不能丢失的临时草稿');}finally{g.close();}
});
