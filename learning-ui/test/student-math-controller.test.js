import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),folder='../../app/src/main/assets/web/app-design/';
async function fixture({subject='math',data={},active=()=>true,request=async()=>''}={}){
 const dom=new JSDOM('<main></main>',{url:'https://learn.test/math-course.html?chapter=math-8a-01',runScripts:'outside-only'}),w=dom.window;
 for(const [name,file] of Object.entries({GrowingMath:'math-data.js',GrowingPhysics:'physics-data.js',GrowingPracticeProgress:'practice-progress.js',GrowingApplicationPractice:'application-practice.js',GrowingHandwriting:'handwriting-core.js',GrowingCourseTools:'course-tools.js',GrowingMathFeedback:'math-feedback.js'}))w[name]=require(folder+file);
 w.GrowingMathFigure=w.GrowingPhysicsFigure=()=>'<svg></svg>';w.GrowingCourseSpeech={create:()=>({stop(){},play(){}})};w.UnitRewards={register(){},update(){}};w.GrowingCourseAI={request};w.GrowingHandwritingAI={request};
 for(const [key,value] of Object.entries(data))w.localStorage.setItem(key,JSON.stringify(value));
 w.eval(await readFile(new URL(folder+'student-math-course.js',import.meta.url),'utf8'));
 const chapter=subject==='physics'?'physics-8a-01':'math-8a-01';const controller=w.GrowingStudentMathCourse.create({subject,params:new URLSearchParams({chapter}),storage:w.localStorage,active});
 return {dom,w,controller};
}
test('math controller retains original records and ten exact practice IDs, drafts and self-checks',async()=>{
 const f=await fixture();const c=f.controller,s=c.snapshot();assert.equal(s.kind,'course');assert.equal(s.questions.length,10);assert.ok(s.questions.every(q=>q.id.startsWith(s.node.id+'-application-')));c.actions.draft('自己的解释需要写完整，举出一个具体例子。');c.actions.self([0,1]);c.actions.markRead();const saved=JSON.parse(f.w.localStorage.getItem('growing-math-lessons-v1'));assert.equal(saved.topics[s.node.id].seen,true);assert.equal(saved.topics[s.node.id].self.length,2);assert.match(saved.topics[s.node.id].draft,/自己的解释/);assert.equal(c.snapshot().tab,'recall');c.destroy();f.dom.window.close();
});
test('destroy cancels AI and rejects late results; a changed account cannot write',async()=>{
 let resolve,signal,valid=true;const f=await fixture({active:()=>valid,request:options=>{signal=options.signal;return new Promise(r=>resolve=r);}}),c=f.controller;
 c.actions.draft('解释需要足够详细，包含条件、理由和具体例子。');const grading=c.actions.grade();assert.ok(signal);const before=f.w.localStorage.getItem('growing-math-lessons-v1');valid=false;c.destroy();assert.equal(signal.aborted,true);resolve('{"score":10}');await grading;assert.equal(f.w.localStorage.getItem('growing-math-lessons-v1'),before);f.dom.window.close();
});
test('unreadable archives are never overwritten and physics grading preserves schema checks',async()=>{
 const broken=await fixture({data:{'growing-math-lessons-v1':{version:99,topics:{}}}});const before=broken.w.localStorage.getItem('growing-math-lessons-v1');broken.controller.actions.draft('本地草稿仍可保留');assert.equal(broken.w.localStorage.getItem('growing-math-lessons-v1'),before);assert.match(broken.controller.snapshot().storageError,/原|读取/);broken.controller.destroy();broken.dom.window.close();
 const f=await fixture({subject:'physics',request:async()=>JSON.stringify({score:9,criticalErrors:[],feedback:'有效解释',gaps:[]})}),c=f.controller;c.actions.draft('声音由振动产生，传播需要介质，真空中不能传声。');await c.actions.grade();const s=c.snapshot();assert.equal(s.record.attempts.at(-1).score,9);assert.ok(f.w.localStorage.getItem('growing-physics-lessons-v1'));assert.equal(f.w.localStorage.getItem('growing-math-lessons-v1'),null);c.destroy();f.dom.window.close();
});

test('math rubric verifies quoted evidence and rejects fabricated high marks',async()=>{
 const answer='这是我的完整解释，包含概念条件例子和边界。';let good=true;
 const f=await fixture({active:()=>undefined,request:async()=>JSON.stringify({criteria:['core','condition','example','boundary'].map((id,i)=>({id,score:[4,2,2,2][i],evidence:good?'我的完整解释':'未出现的证据',feedback:'准确'})),good:[],gaps:[],criticalErrors:[],followup:'为什么？',comment:'概念正确'})}),c=f.controller;
 c.actions.draft(answer);await c.actions.grade();assert.equal(c.snapshot().record.attempts.at(-1).score,10);good=false;await c.actions.grade();assert.equal(c.snapshot().record.attempts.length,1);assert.match(c.snapshot().message,/证据/);c.destroy();f.w.close();
});

test('changing knowledge cancels late grades and answer drafts survive cancellation',async()=>{
 let resolve;const f=await fixture({request:()=>new Promise(r=>resolve=r)}),c=f.controller;
 c.actions.draft('我的解释包括概念、条件、方法和一个完整例子。');const grading=c.actions.grade();const original=c.snapshot().node.id;c.actions.choose(c.snapshot().chapter.nodes[1].id);resolve('{}');await grading;assert.equal(JSON.parse(f.w.localStorage.getItem('growing-math-lessons-v1')).topics[original].attempts.length,0);
 c.actions.doubtDraft('这个知识点的使用条件是什么？');const asking=c.actions.ask();c.actions.cancelDoubt();resolve('迟到的解释');await asking;assert.match(c.snapshot().doubt.draft,/使用条件/);assert.equal(c.snapshot().doubt.messages.length,0);c.destroy();f.w.close();
});

function answers(f){
 const c=f.controller,w=f.w,C=w.GrowingHandwriting,A=w.GrowingApplicationPractice;
 for(const [i,q] of c.snapshot().questions.entries())if(q.type==='choice')c.actions.practiceChoice(q.id,q.answer);else {const doc=C.create(c.snapshot().subject,c.snapshot().chapter.id,A.prompt(q)),key=C.PREFIX+'12345678-1234-1234-1234-123456789ab'+i;doc.photos=['data:image/jpeg;base64,/9j/AAAA'];w.localStorage.setItem(key,JSON.stringify(doc));}
 w.Image=class{decode(){return Promise.resolve();}};
 w.GrowingHandwritingAI.pageImage=async(strokes,draw,width,height,image)=>image.src;
}
const photoGrade=(id,extra={})=>({score:100,parts:[20,30,30,20],feedback:'正确',needsReview:false,source:'handwriting',corrections:[],knowledge:[{nodeId:id,score:100,feedback:'正确'}],...extra});

test('partial choices submit without AI, keep unanswered items at zero and allow later completion',async()=>{
 for(const subject of ['math','physics']){
  const f=await fixture({subject}),c=f.controller,w=f.w,qs=c.snapshot().questions;let calls=0;
  w.GrowingHandwritingAI.request=async()=>{calls++;return photoGrade(c.snapshot().selected);};
  c.actions.practiceChoice(qs[0].id,qs[0].answer);await c.actions.submitPractice();
  let s=c.snapshot();assert.equal(s.practice.result.score,1,s.practice.message);assert.equal(s.practice.result.pending,0);assert.equal(s.practice.result.saved,true);assert.equal(s.practice.result.items.filter(q=>q.unanswered).length,9);assert.equal(calls,0);assert.equal(w.GrowingPracticeProgress.result(s.record).passed,false);
  const invalid=JSON.parse(JSON.stringify(s.record.practiceRound));invalid.items[1].passed=true;assert.equal(w.GrowingPracticeProgress.round(invalid),false);
  await c.actions.submitPractice();assert.equal(c.snapshot().calendar.totals.practice,1);
  const data=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,JSON.parse(w.localStorage.getItem(k))]));
  c.destroy();w.close();const restored=await fixture({subject,data});assert.equal(restored.controller.snapshot().practice.result.score,1);restored.controller.destroy();restored.w.close();
 }
});

test('partial photo submission grades only uploaded solutions and can be completed later',async()=>{
 const f=await fixture(),c=f.controller,w=f.w;answers(f);const qs=c.snapshot().questions;
 const removed=c.snapshot().questions[9].key;w.localStorage.removeItem(removed);let calls=0;
 w.GrowingHandwritingAI.request=async()=>{calls++;return photoGrade(c.snapshot().selected);};
 await c.actions.submitPractice();assert.equal(calls,1);assert.equal(c.snapshot().practice.result.score,9);assert.equal(c.snapshot().practice.result.pending,0);assert.equal(c.snapshot().practice.result.items[9].unanswered,true);
 answers(f);await c.actions.submitPractice();assert.equal(calls,3);assert.equal(c.snapshot().practice.result.score,10);assert.equal(w.GrowingPracticeProgress.result(c.snapshot().record).passed,true);
 c.destroy();w.close();
});

test('choice drafts do not default to A and restore independently of old results',async()=>{
 const f=await fixture(),c=f.controller;assert.equal(c.snapshot().practice.completed,0);await c.actions.submitPractice();assert.match(c.snapshot().practice.message,/至少作答1题/);const q=c.snapshot().questions[0];c.actions.practiceChoice(q.id,0);assert.equal(c.snapshot().practice.choices[q.id],0);assert.equal(c.snapshot().practice.completed,1);
 const data=Object.fromEntries(Object.keys(f.w.localStorage).map(k=>[k,JSON.parse(f.w.localStorage.getItem(k))]));c.destroy();f.w.close();const restored=await fixture({data});assert.equal(restored.controller.snapshot().practice.choices[q.id],0);assert.equal(restored.controller.snapshot().practice.result,null);restored.controller.destroy();restored.w.close();
});

test('uploads save only solution photos, retain originals and never grade before group submission',async()=>{
 let calls=0;const f=await fixture({request:async()=>{calls++;}}),w=f.w,c=f.controller,qs=c.snapshot().questions;
 w.Image=class{naturalWidth=100;naturalHeight=100;decode(){return Promise.resolve();}};w.URL.createObjectURL=()=> 'blob:photo';w.URL.revokeObjectURL=()=>{};
 const create=w.document.createElement.bind(w.document);w.document.createElement=tag=>tag==='canvas'?{getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,/9j/AAAA'}:create(tag);
 const file=new w.File(['photo'],'answer.jpg',{type:'image/jpeg'});await c.actions.uploadPhoto(qs[0].id,file);assert.equal(w.localStorage.length,0);
 await c.actions.uploadPhoto(qs[8].id,file);assert.equal(calls,0);assert.equal(c.snapshot().questions[8].photos.length,1);assert.equal(c.snapshot().practice.completed,1);assert.equal(c.snapshot().record.practicePhoto,undefined);assert.equal(c.snapshot().record.practiceRound,undefined);
 const previous=c.snapshot().questions[8].key;await c.actions.uploadPhoto(qs[8].id,file);assert.notEqual(c.snapshot().questions[8].key,previous);assert.ok(w.localStorage.getItem(previous));c.destroy();w.close();
});

test('one group submission grades two actual photos, saves a ten-point score and avoids duplicate rounds',async()=>{
 for(const subject of ['math','physics']){
 const f=await fixture({subject}),c=f.controller,w=f.w;answers(f);const qs=c.snapshot().questions;let calls=0;
 w.GrowingHandwritingAI.request=async input=>{calls++;assert.deepEqual([...input.nodeIds],[qs[0].topic]);assert.ok(qs.filter(q=>q.type==='solution').some(q=>q.prompt===input.prompt));assert.equal(input.pages[0],'data:image/jpeg;base64,/9j/AAAA');return photoGrade(qs[0].topic);};
 c.actions.practiceChoice(qs[0].id,(qs[0].answer+1)%4);const task=c.actions.submitPractice();assert.equal(c.snapshot().practice.busy,true);assert.equal(c.snapshot().practice.result,null);await c.actions.submitPractice();await task;
 const s=c.snapshot();assert.equal(calls,2);assert.equal(s.practice.result.score,9);assert.equal(s.practice.result.pending,0);assert.equal(s.practice.result.saved,true);assert.equal(s.calendar.totals.practice,1);assert.equal(w.GrowingPracticeProgress.result(s.record).total,10);await c.actions.submitPractice();assert.equal(calls,2);assert.equal(c.snapshot().calendar.totals.practice,1);
 const data=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,JSON.parse(w.localStorage.getItem(k))]));c.destroy();w.close();const restored=await fixture({subject,data});assert.equal(restored.controller.snapshot().practice.result.score,9);restored.controller.actions.practiceChoice(qs[0].id,qs[0].answer);assert.equal(restored.controller.snapshot().practice.result,null);restored.controller.destroy();restored.w.close();
 }
});

test('low knowledge marks and review results cannot earn solution credit',async()=>{
 const f=await fixture(),c=f.controller,w=f.w;answers(f);let calls=0;const id=c.snapshot().selected;
 w.GrowingHandwritingAI.request=async()=>{if(++calls===1)return photoGrade(id,{knowledge:[{nodeId:id,score:70,feedback:'条件遗漏'}]});const grade=photoGrade(id,{needsReview:true,score:null,parts:null});delete grade.knowledge;return grade;};
 try{await c.actions.submitPractice();assert.ok(c.snapshot().practice.result,c.snapshot().practice.message);assert.equal(c.snapshot().practice.result.score,8);assert.equal(c.snapshot().practice.result.pending,1);assert.equal(w.GrowingPracticeProgress.result(c.snapshot().record).passed,false);}finally{c.destroy();w.close();}
});

test('group grading blocks stale revisions, topic changes and destroyed-session writes',async()=>{
 for(const change of ['revision','topic','destroy','account']){
 let resolve,active=true;const f=await fixture({active:()=>active}),c=f.controller,w=f.w;answers(f);const q=c.snapshot().questions[8],key=c.snapshot().questions[8].key,id=q.topic;
 w.GrowingHandwritingAI.request=()=>new Promise(r=>resolve=r);const task=c.actions.submitPractice();await new Promise(r=>setTimeout(r,0));assert.equal(typeof resolve,'function');
 if(change==='revision'){const doc=JSON.parse(w.localStorage.getItem(key));w.GrowingHandwriting.change(doc);w.localStorage.setItem(key,JSON.stringify(doc));}else if(change==='topic')c.actions.choose(c.snapshot().chapter.nodes[1].id);else if(change==='destroy')c.destroy();else active=false;
 const before=w.localStorage.getItem(key);resolve(photoGrade(id));await task;assert.equal(w.localStorage.getItem(key),before);assert.equal(JSON.parse(w.localStorage.getItem('growing-math-lessons-v1')).topics[id].practiceRound,undefined);if(change==='revision')assert.match(c.snapshot().practice.message,/更新/);if(change==='topic'){assert.equal(c.snapshot().practice.result,null);assert.equal(c.snapshot().practice.completed,0);}c.destroy();w.close();
 }
});

test('a failed grading request preserves answers without committing a partial group',async()=>{
 const f=await fixture(),c=f.controller,w=f.w;answers(f);let calls=0;w.GrowingHandwritingAI.request=async()=>{if(++calls===2)throw Error('服务暂不可用');return photoGrade(c.snapshot().selected);};await c.actions.submitPractice();assert.equal(c.snapshot().practice.result,null);assert.equal(c.snapshot().record.practiceRound,undefined);assert.equal(c.snapshot().practice.completed,10);assert.match(c.snapshot().practice.message,/服务暂不可用/);c.destroy();w.close();
});

test('saving a completed group can retry without grading again or double-counting activity',async()=>{
 const f=await fixture(),c=f.controller,w=f.w;answers(f);let calls=0;w.GrowingHandwritingAI.request=async()=>{calls++;return photoGrade(c.snapshot().selected);};
 const proto=Object.getPrototypeOf(w.localStorage),set=proto.setItem;let fail=true;proto.setItem=function(k,v){if(fail&&k==='growing-math-lessons-v1'&&JSON.parse(v).topics[c.snapshot().selected]?.practiceRound)throw Error('存储已满');return set.call(this,k,v);};
 await c.actions.submitPractice();assert.equal(c.snapshot().practice.result.saved,false);assert.equal(c.snapshot().calendar.totals.practice,0);fail=false;await c.actions.submitPractice();assert.equal(calls,2);assert.equal(c.snapshot().practice.result.saved,true);assert.equal(c.snapshot().calendar.totals.practice,1);proto.setItem=set;c.destroy();w.close();
});

test('a corrupt topic in another chapter blocks whole-archive writes while lessons remain readable',async()=>{
 for(const subject of ['math','physics']){
  const dataset=require(folder+(subject==='physics'?'physics-data.js':'math-data.js')),badId=dataset.chapters[1].nodes[0].id,key='growing-'+subject+'-lessons-v1';
  for(const damaged of [{draft:'保留的旧草稿',self:[],attempts:'damaged'},'damaged',false]){
   const f=await fixture({subject,data:{[key]:{version:1,topics:{[badId]:damaged}}}}),c=f.controller,before=f.w.localStorage.getItem(key);
   try{assert.equal(c.snapshot().kind,'course');assert.ok(c.snapshot().node.review);assert.match(c.snapshot().storageError,/读取|原存档/);c.actions.markRead();c.actions.draft('新草稿不能覆盖损坏存档');c.beforeLeave();assert.equal(f.w.localStorage.getItem(key),before);assert.match(c.snapshot().storageError,/读取|原存档/);}
   finally{c.destroy();f.w.close();}
  }
 }
});

test('real connection services clear keys only in the active account storage',async()=>{
 let active=true;const f=await fixture({active:()=>{if(!active)throw Error('account changed');}}),c=f.controller,w=f.w;
 w.eval(await readFile(new URL(folder+'course-ai.js',import.meta.url),'utf8'));
 c.actions.saveSettings('deepseek',{apiKey:'test-only-key',model:'deepseek-flash'});assert.ok(w.localStorage.getItem('growing-course-ai-v1'));c.actions.clearSettings('deepseek');assert.equal(w.localStorage.getItem('growing-course-ai-v1'),null);
 c.actions.saveSettings('deepseek',{apiKey:'test-only-key',model:'deepseek-flash'});const before=w.localStorage.getItem('growing-course-ai-v1');active=false;assert.throws(()=>c.actions.clearSettings('deepseek'));assert.equal(w.localStorage.getItem('growing-course-ai-v1'),before);c.destroy();w.close();
});
