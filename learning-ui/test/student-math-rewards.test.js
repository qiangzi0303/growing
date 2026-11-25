import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),folder='../../app/src/main/assets/web/app-design/';
async function setup(chapter='math-8b-11',saved=null){
 const dom=new JSDOM('<main></main>',{url:'https://learn.test/math-course.html',runScripts:'outside-only'}),w=dom.window;
 for(const [name,file] of Object.entries({GrowingMath:'math-data.js',GrowingPracticeProgress:'practice-progress.js',GrowingApplicationPractice:'application-practice.js',GrowingHandwriting:'handwriting-core.js',GrowingCourseTools:'course-tools.js',GrowingMathFeedback:'math-feedback.js',GrowingMathScore:'math-chapter-score.js'}))w[name]=require(folder+file);
 w.GrowingMathWrongIndex={};w.GrowingMathFigure=()=>'';w.GrowingCourseAI={};
 let provider,opened=null,active=true;
 w.UnitRewards={register(id,p){provider=p;return()=>{provider=null;};},update(){},open(id){opened=id;}};
 if(saved)w.localStorage.setItem('growing-math-lessons-v1',saved);
 w.eval(await readFile(new URL(folder+'student-math-course.js',import.meta.url),'utf8'));
 const c=w.GrowingStudentMathCourse.create({params:new URLSearchParams({chapter}),storage:w.localStorage,active:()=>active});
 return {w,c,get provider(){return provider;},get opened(){return opened;},revoke(){active=false;},close(){c.destroy();w.close();}};
}
test('chapter reward provider uses best submitted round after worse retry and reload',async()=>{
 const f=await setup();let saved;
 try{
  assert.equal(f.provider.defaults.gameMinutes,100);assert.equal(f.provider.progress().done,160);
  const questions=f.c.snapshot().questions.filter(q=>q.type==='choice');
  for(const q of questions)f.c.actions.practiceChoice(q.id,q.answer);
  await f.c.actions.submitPractice();const best=f.provider.progress().done;assert.ok(best>160);
  for(const q of questions)f.c.actions.practiceChoice(q.id,(q.answer+1)%4);
  await f.c.actions.submitPractice();assert.equal(f.c.snapshot().practice.result.score,0);assert.equal(f.provider.progress().done,best);
  saved=f.w.localStorage.getItem('growing-math-lessons-v1');
  const next=await setup('math-8b-11',saved);try{assert.equal(next.provider.progress().done,best);assert.match(next.provider.describe(),/章节得分/);}finally{next.close();}
  f.c.actions.rewards();assert.equal(f.opened,'math-8b-11');
  f.revoke();assert.throws(()=>f.provider.progress(),/会话/);
 }finally{f.close();}
});
test('fraction chapter registers the new score provider and keeps its records',async()=>{
 const f=await setup('math-8b-10');try{assert.ok(f.provider);assert.equal(f.c.snapshot().questions.length,10);f.c.actions.draft('分母不能为零，分式的条件必须先确定。');assert.ok(f.w.localStorage.getItem('growing-math-lessons-v1'));f.c.actions.rewards();assert.equal(f.opened,'math-8b-10');}finally{f.close();}
});
