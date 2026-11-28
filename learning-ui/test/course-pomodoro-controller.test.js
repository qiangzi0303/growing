import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),folder='../../app/src/main/assets/web/app-design/';
async function fixture(subject='math',data=new Map()){
 const dom=new JSDOM('<main></main>',{url:'https://learn.test/',runScripts:'outside-only'}),w=dom.window;let at=1800000000000,alive=true,fail=false;
 for(const [name,file] of Object.entries({GrowingMath:'math-data.js',GrowingPhysics:'physics-data.js',GrowingPracticeProgress:'practice-progress.js',GrowingApplicationPractice:'application-practice.js',GrowingHandwriting:'handwriting-core.js',GrowingCourseTools:'course-tools.js',GrowingMathFeedback:'math-feedback.js'}))w[name]=require(folder+file);
 w.GrowingMathFigure=w.GrowingPhysicsFigure=()=>'<svg></svg>';w.UnitRewards={register(){},update(){}};
 const storage={get length(){return data.size},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem(k,v){if(fail)throw Error('quota');data.set(k,v)}};
 for(const file of ['math-pomodoro.js','math-pomodoro-session.js','course-pomodoro-plan.js','student-math-course.js'])w.eval(await readFile(new URL(folder+file,import.meta.url),'utf8'));
 const c=w.GrowingStudentMathCourse.create({subject,params:new URLSearchParams({chapter:subject+'-8a-01'}),storage,active:()=>alive,now:()=>at});
 return {w,c,data,fail(v){fail=v},advance(ms){at+=ms},expire(){alive=false},close(){c.destroy();w.close()}};
}
test('math and physics select concrete plans and navigate tasks inside original classroom',async()=>{
 for(const subject of ['math','physics']){const f=await fixture(subject);try{const {c}=f;let m=c.snapshot();assert.ok(m.pomodoro.plans.length>1);assert.ok(m.pomodoro.selectedPlan.goal);assert.equal(m.pomodoro.rounds.length,0);c.actions.pomodoroStart();m=c.snapshot();assert.equal(m.pomodoro.rounds[0].planId,m.pomodoro.selectedPlanId);assert.equal(m.lessonTask.kind,'review');assert.equal(m.selected,m.lessonTask.nodeId);assert.equal(m.view,'home');
 c.actions.pomodoroReviewDone();m=c.snapshot();assert.equal(m.pomodoro.selectedPlan.tasks[0].done,true);const practice=m.pomodoro.plans.flatMap(p=>p.tasks).find(t=>t.kind==='practice');const p=m.pomodoro.plans.find(p=>p.tasks.some(t=>t.id===practice.id));c.actions.pomodoroSelectPlan(p.id);c.actions.pomodoroGoTask(practice.id);m=c.snapshot();assert.equal(m.selected,practice.nodeId);assert.equal(m.tab,'practice');assert.equal(m.questions.length,10);assert.ok(m.lessonTask.questionIds.length);assert.equal(m.pomodoro.rounds.length,1);
 assert.ok(f.data.has('growing-'+subject+'-lessons-v1'));assert.equal(f.data.has('growing-'+(subject==='math'?'physics':'math')+'-lessons-v1'),false);
 }finally{f.close()}}
});

test('compact regrouping preserves an active legacy goal and reuses its learning evidence without crediting new reviews',async()=>{
 for(const subject of ['math','physics']){
  const seed=await fixture(subject),data=seed.data,chapter=seed.c.snapshot().chapter;
  const plan=seed.w.GrowingCoursePomodoroPlan.build(chapter,subject,n=>seed.w.GrowingApplicationPractice.questions(n,subject),{legacy:true})[0];
  const P=seed.w.GrowingMathPomodoro,at=1800000000000,nodeId=plan.tasks[0].nodeId,qid=plan.tasks.find(t=>t.kind==='practice').questionIds[0];
  let old=P.start(undefined,chapter.id,at,{nodeId,nodeTitle:plan.title,planId:plan.id});
  for(const item of [{id:'read:'+nodeId,kind:'read',nodeId,title:'已阅读',status:'read'},{id:'question:'+qid,kind:'question',nodeId,title:'第 1 题',status:'correct'}])old=P.record(old,chapter.id,at,{...item,detail:'已保存'},old.rounds[0].id);
  data.set('growing-'+subject+'-lessons-v1',JSON.stringify({version:1,topics:{},pomodoro:{[chapter.id]:old}}));seed.close();
  const f=await fixture(subject,data);try{
   let m=f.c.snapshot();assert.equal(m.pomodoro.selectedPlan.id,plan.id);
   assert.equal(JSON.stringify(m.pomodoro.selectedPlan.tasks.map(t=>t.id)),JSON.stringify(plan.tasks.map(t=>t.id)));
   assert.equal(m.pomodoro.rounds[0].items.length,2);
   f.c.actions.pomodoroFinish();m=f.c.snapshot();
   assert.ok(m.pomodoro.plans.every(p=>p.id.includes(':p2:')));
   const first=m.pomodoro.plans[0];assert.equal(first.tasks.find(t=>t.kind==='learn').done,true);assert.equal(first.tasks.find(t=>t.kind==='review').done,false);
   assert.equal(first.tasks.find(t=>t.kind==='practice').done,false);
   const persisted=JSON.parse(data.get('growing-'+subject+'-lessons-v1')).pomodoro[chapter.id];assert.equal(persisted.rounds[0].planId,plan.id);assert.equal(persisted.rounds[0].items.length,2);
   const re=await fixture(subject,data);try{assert.equal(re.c.snapshot().pomodoro.plans[0].tasks.find(t=>t.kind==='learn').done,true);}finally{re.close();}
  }finally{f.close();}
 }
});
test('time completion does not complete objectives; continuation rechecks review and preserves historic records',async()=>{
 const f=await fixture();try{const c=f.c;c.actions.pomodoroStart();c.actions.pomodoroReviewDone();const id=c.snapshot().pomodoro.selectedPlanId;f.advance(1500000);assert.notEqual(c.snapshot().pomodoro.selectedPlan.status,'completed');c.actions.pomodoroSkipBreak();assert.equal(c.snapshot().pomodoro.selectedPlan.continuation,true);c.actions.pomodoroStart();let m=c.snapshot();assert.equal(m.pomodoro.rounds[1].planId,id);assert.equal(m.pomodoro.selectedPlan.tasks[0].done,false);assert.ok(m.pomodoro.rounds[0].items.length);c.actions.pomodoroReviewDone();assert.equal(c.snapshot().pomodoro.selectedPlan.tasks[0].done,true);
 const re=await fixture('math',f.data);try{assert.equal(re.c.snapshot().pomodoro.selectedPlanId,id);assert.equal(re.c.snapshot().pomodoro.rounds.length,2)}finally{re.close()}
 }finally{f.close()}
});
test('failed start or expired account cannot mark review complete',async()=>{
 const f=await fixture();try{f.fail(true);f.c.actions.pomodoroStart();f.c.actions.pomodoroReviewDone();assert.equal(f.c.snapshot().pomodoro.selectedPlan.done,0);f.fail(false);f.c.actions.pomodoroRetry();assert.equal(f.c.snapshot().lessonTask.kind,'review');f.expire();const before=[...f.data];f.c.actions.pomodoroReviewDone();assert.deepEqual([...f.data],before)}finally{f.close()}
});
test('review of an unchanged saved choice requires fresh answering and preserves full ten-question scores',async()=>{
 const f=await fixture();try{const c=f.c,first=c.snapshot().pomodoro.plans[0];c.actions.pomodoroStart();const task=first.tasks.find(t=>t.kind==='practice');assert.ok(task);c.actions.pomodoroGoTask(task.id);const qs=c.snapshot().questions;
 const C=f.w.GrowingHandwriting,A=f.w.GrowingApplicationPractice;
 for(const [i,q] of qs.filter(q=>q.type==='solution').entries()){const doc=C.create('math',c.snapshot().chapter.id,A.prompt(q));doc.pages=[[{tool:'pen',width:3,points:[[20,20,.5],[40,40,.5]]}]];doc.updatedAt=new Date(1799999999000).toISOString();doc.grades=[{revision:doc.revision,at:doc.updatedAt,score:100,parts:[20,30,30,20],feedback:'有效原稿批改',needsReview:false,source:'handwriting',corrections:[],knowledge:[{nodeId:q.topic,score:100,feedback:'正确'}]}];assert.equal(C.validate(doc),true);f.data.set(C.PREFIX+'12345678-1234-1234-1234-123456789ab'+i,JSON.stringify(doc));}
 f.w.GrowingHandwritingAI={request(){assert.fail('unchanged valid solution must not be sent to AI again')}};
 for(const q of qs.filter(q=>q.type==='choice'))c.actions.practiceChoice(q.id,q.answer);
 await c.actions.submitPractice();const originalScore=c.snapshot().practice.result.score;c.actions.pomodoroFinish();
 const next=c.snapshot().pomodoro.plans.find(p=>p.id!==first.id&&p.tasks.some(t=>t.kind==='review'&&t.nodeId===task.nodeId&&t.questionIds.length));assert.ok(next);c.actions.pomodoroSelectPlan(next.id);c.actions.pomodoroStart();const review=c.snapshot().pomodoro.selectedPlan.tasks.find(t=>t.kind==='review');c.actions.pomodoroGoTask(review.id);
 assert.equal(c.snapshot().practice.result,null);for(const id of review.questionIds)assert.equal(c.snapshot().practice.choices[id],undefined);
 await c.actions.submitPractice();assert.equal(c.snapshot().pomodoro.selectedPlan.tasks.find(t=>t.id===review.id).done,false);
 for(const id of review.questionIds){const q=qs.find(q=>q.id===id);c.actions.practiceChoice(id,q.answer);}
 await c.actions.submitPractice();const m=c.snapshot();assert.equal(m.pomodoro.selectedPlan.tasks.find(t=>t.id===review.id).done,true);assert.equal(m.practice.result.score,originalScore);assert.equal(m.practice.result.items.length,10);
 }finally{f.close()}
});
test('new reviews prioritize wrong answers, freeze their question list and preserve free classroom navigation',async()=>{
 const f=await fixture();try{const c=f.c;c.actions.pomodoroStart();const qs=c.snapshot().questions,q=qs[2];c.actions.practiceChoice(q.id,(q.answer+1)%4);await c.actions.submitPractice();c.actions.pomodoroFinish();
 const plan=c.snapshot().pomodoro.plans.find(p=>p.tasks.some(t=>t.kind==='review'&&t.questionIds.includes(q.id)));assert.ok(plan);c.actions.pomodoroSelectPlan(plan.id);c.actions.pomodoroStart();const before=c.snapshot().pomodoro.selectedPlan.tasks.find(t=>t.kind==='review');assert.ok(before.questionIds.includes(q.id));c.actions.practiceChoice(q.id,q.answer);await c.actions.submitPractice();assert.deepEqual(c.snapshot().pomodoro.selectedPlan.tasks.find(t=>t.id===before.id).questionIds,before.questionIds);
 const other=c.snapshot().chapter.nodes.find(n=>n.id!==before.nodeId);c.actions.choose(other.id);assert.equal(c.snapshot().lessonTask,null);const otherQ=c.snapshot().questions[0];c.actions.practiceChoice(otherQ.id,otherQ.answer);await c.actions.submitPractice();assert.equal(c.snapshot().practice.result.saved,true);
 }finally{f.close()}
});
test('starting physics pauses existing math timer and a failed pause refuses a second timer',async()=>{
 const data=new Map(),math=await fixture('math',data),physics=await fixture('physics',data);try{math.c.actions.pomodoroStart();physics.c.actions.pomodoroStart();assert.notEqual(math.c.snapshot().pomodoro.rounds[0].pausedAt,null);physics.c.actions.pomodoroFinish();math.c.actions.pomodoroResume();physics.fail(true);physics.c.actions.pomodoroStart();assert.equal(physics.c.snapshot().pomodoro.rounds.length,1);assert.match(physics.c.snapshot().message,/尚未开始/);assert.equal(math.c.snapshot().pomodoro.rounds[0].pausedAt,null)}finally{math.close();physics.close()}
});
test('previously mastered content skips only repeated lecture and keeps fresh review requirements',async()=>{
 const data=new Map(),key='growing-physics-lessons-v1';data.set(key,JSON.stringify({version:1,topics:{'phy-source':{draft:'已有有效解释',seen:true,self:[],attempts:[{score:9,criticalErrors:[],feedback:'正确',answer:'声音由物体振动产生。',at:'2026-01-01T00:00:00.000Z'}],practice10:{version:1,total:10,best:10}}}}));
 const f=await fixture('physics',data);try{const c=f.c,lecture=c.snapshot().pomodoro.selectedPlan.tasks.find(t=>t.kind==='learn');assert.equal(lecture.priorMastery,true);assert.equal(lecture.done,true);assert.equal(c.snapshot().pomodoro.selectedPlan.tasks[0].done,false);c.actions.pomodoroStart();const r=c.snapshot().pomodoro.rounds[0];assert.ok(r.skippedLearn.includes(lecture.id));assert.equal(r.items.length,0);assert.equal(c.snapshot().record.practice10.best,10);assert.equal(JSON.parse(data.get(key)).topics['phy-source'].practice10.best,10)}finally{f.close()}
});
test('finishing the current exercise after the timer rings still belongs to that plan until rest',async()=>{
 const f=await fixture();try{const c=f.c;c.actions.pomodoroStart();const task=c.snapshot().pomodoro.selectedPlan.tasks.find(t=>t.kind==='practice');c.actions.pomodoroGoTask(task.id);f.advance(1500000);const qs=c.snapshot().questions;for(const id of task.questionIds){const q=qs.find(q=>q.id===id);c.actions.practiceChoice(id,q.answer);}await c.actions.submitPractice();const m=c.snapshot();assert.equal(m.pomodoro.rounds[0].phase,'ready');assert.equal(m.pomodoro.rounds[0].elapsedMs,1500000);assert.equal(m.pomodoro.selectedPlan.tasks.find(t=>t.id===task.id).done,true);c.actions.pomodoroStartBreak();const count=c.snapshot().pomodoro.rounds[0].items.length;c.actions.markRead();assert.equal(c.snapshot().pomodoro.rounds[0].items.length,count)}finally{f.close()}
});
test('startup retry pauses the other subject again and malformed old question rounds do not crash plans',async()=>{
 const data=new Map(),math=await fixture('math',data),physics=await fixture('physics',data);try{math.fail(true);math.c.actions.pomodoroStart();math.fail(false);physics.c.actions.pomodoroStart();math.c.actions.pomodoroRetry();assert.equal(math.c.snapshot().pomodoro.rounds.length,1);assert.notEqual(physics.c.snapshot().pomodoro.rounds[0].pausedAt,null)}finally{math.close();physics.close()}
 const raw=new Map([['growing-physics-lessons-v1',JSON.stringify({version:1,topics:{'phy-source':{draft:'',seen:false,self:[],attempts:[],practiceRound:{}}}})]]),f=await fixture('physics',raw);try{assert.ok(f.c.snapshot().pomodoro.plans.length>0);assert.equal(JSON.parse(raw.get('growing-physics-lessons-v1')).topics['phy-source'].practiceRound.items,undefined)}finally{f.close()}
});
test('a complete first physics goal needs reading, valid recall and assigned practice, independently of elapsed time',async()=>{
 const f=await fixture('physics');try{const c=f.c;f.w.GrowingCourseAI={request:async()=>JSON.stringify({score:9,criticalErrors:[],feedback:'条件方法准确',gaps:[]})};c.actions.pomodoroStart();c.actions.pomodoroReviewDone();const tasks=c.snapshot().pomodoro.selectedPlan.tasks;
 for(const task of tasks.filter(t=>t.kind!=='review')){c.actions.pomodoroGoTask(task.id);if(task.kind==='learn')c.actions.markRead();else if(task.kind==='recall'){c.actions.draft('物体发声时正在振动，停止振动会停止发声，音叉实验可以检验。');await c.actions.grade();}else{const qs=c.snapshot().questions;for(const id of task.questionIds){const q=qs.find(q=>q.id===id);c.actions.practiceChoice(id,q.answer);}await c.actions.submitPractice();}}
 const m=c.snapshot();assert.equal(m.pomodoro.selectedPlan.status,'completed');assert.equal(m.pomodoro.rounds[0].phase,'learning');assert.equal(m.pomodoro.rounds[0].elapsedMs,0);
 }finally{f.close()}
});
