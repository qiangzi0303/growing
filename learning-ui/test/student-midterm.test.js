import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
async function fixture(kind='original'){
 const base=new URL('../../app/src/main/assets/web/app-design/',import.meta.url),html=await readFile(new URL(kind==='original'?'math-exam-midterm.html':'math-exam-midterm-graph.html',base),'utf8');
 const dom=new JSDOM(html,{url:'https://learn.test/app-design/math-exam-midterm.html',runScripts:'outside-only'}),w=dom.window;
 if(kind==='graph')w.eval(html.match(/<script>(const D=[\s\S]*?)<\/script>/)[1]+'\nwindow.GrowingMidtermGraphData=D;');
 w.GrowingMathFormat={html:s=>s,solutionHtml:s=>s};
 w.eval(await readFile(new URL('math-midterm-20261029.js',base),'utf8'));
 w.eval(await readFile(new URL('student-midterm.js',base),'utf8'));
 const c=w.GrowingStudentMidterm.create({params:new w.URLSearchParams({kind})});return {w,c,close(){c.destroy();w.close();}};
}
test('original midterm preserves all readonly question diagrams and only solution questions offer grading',async()=>{
 const f=await fixture();try{
  assert.equal(f.c.model.questions.length,f.w.GrowingMidterm.questions.length);
  for(const q of f.c.model.questions){assert.doesNotMatch(q.html,/<(?:button|input|select|textarea|script)\b/i);if(q.canGrade)assert.equal(q.solution,true);}
  const n=f.c.model.questions[0].number;f.c.actions.original(n);assert.equal(f.c.model.original,n);f.c.actions.closeOriginal();assert.equal(f.c.model.original,null);assert.equal(f.w.localStorage.length,0);
 }finally{f.close();}
});
test('fixed graph retains every concept, reviewed course target and only corresponding questions',async()=>{
 const f=await fixture('graph');try{
  for(const id of Object.keys(f.w.GrowingMidtermGraphData.links)){f.c.actions.concept(id);assert.ok(f.c.model.filtered.every(q=>q.concepts.includes(id)));assert.ok(f.c.model.selectedLinks.every(l=>l.href.includes(l.node)));}
  f.c.actions.concept('all');assert.equal(f.c.model.filtered.length,f.w.GrowingMidtermGraphData.questions.length);
  f.c.destroy();assert.throws(()=>f.c.actions.concept('all'),/关闭/);
 }finally{f.close();}
});

test('graph follows browser hash changes and releases the listener on disposal',async()=>{
 const f=await fixture('graph');try{
  const id=Object.keys(f.w.GrowingMidtermGraphData.links)[0];f.w.history.replaceState(null,'','#concept='+id);f.w.dispatchEvent(new f.w.HashChangeEvent('hashchange'));
  assert.equal(f.c.model.concept,id);f.w.history.replaceState(null,'','#concept=%');assert.doesNotThrow(()=>f.w.dispatchEvent(new f.w.HashChangeEvent('hashchange')));assert.equal(f.c.model.concept,'all');
 }finally{f.close();}
});

test('student search uses the API page size and account names',async()=>{
 const f=await fixture('graph');try{
  f.w.GrowingCloud={paperReviewContext:()=>({user:{role:'Admin',id:'admin'},api:async()=>({rows:[{id:'s',username:'account'}],total:8,pageSize:5})})};
  await f.c.actions.refresh();assert.equal(f.c.model.pageSize,5);assert.equal(f.c.model.students[0].username,'account');assert.equal(f.c.model.total,8);
 }finally{f.close();}
});

test('cancelling an uncooperative AI immediately unlocks retry and ignores its late response',async()=>{
 const f=await fixture();try{
  const pending=[];f.w.GrowingCourseAI={request:()=>new Promise(resolve=>pending.push(resolve))};const q=f.c.model.questions.find(q=>q.priority),key=q.number+':explain';
  const older=f.c.actions.explain(q.number);assert.equal(f.c.model.ai[key].busy,true);f.c.actions.cancel(key);assert.equal(f.c.model.ai[key].busy,false);
  const newer=f.c.actions.explain(q.number);assert.equal(pending.length,2);pending[0]('stale');await older;assert.equal(f.c.model.ai[key].busy,true);assert.equal(f.c.model.ai[key].text,undefined);pending[1]('current');await newer;assert.equal(f.c.model.ai[key].text,'current');
 }finally{f.close();}
});
