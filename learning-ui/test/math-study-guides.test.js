import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mathStudyGuides,questionFocus,studyQuestionIds} from '../src/math-study-guides.js';
const require=createRequire(import.meta.url),base='../../app/src/main/assets/web/app-design/';
const data=require(base+'math-data.js'),practice=require(base+'application-practice.js'),lab=require(base+'math-lab-models.js'),focus=require(base+'math-study-focus.js');
test('all 68 maths topics have real ten-question coverage for both teaching focuses',()=>{
 const nodes=data.chapters.flatMap(c=>c.nodes);assert.equal(nodes.length,68);assert.equal(Object.keys(mathStudyGuides).length,68);
 for(const n of nodes){
  const g=mathStudyGuides[n.id],questions=practice.questions(n,'math');assert.ok(g,n.id);assert.ok(n.review);assert.equal(questions.length,10);
  assert.deepEqual(questions.map(q=>q.level),['basic','basic','basic','basic','basic','basic','improved','improved','hard','comprehensive']);
  for(const kind of ['exam','mistake']){
   assert.ok(g[kind].text.length>10);assert.ok(g[kind].questions.length);
   const ids=studyQuestionIds(n.id,g[kind]);for(const id of ids)assert.ok(questions.some(q=>q.id===id),id);
   assert.ok(ids.some(id=>focus[n.id].required.includes(id)),n.id+' '+kind+' survives photo substitution');
   assert.deepEqual(focus[n.id][kind],g[kind].questions);
  }
  for(const q of questions){assert.equal(questionFocus(n.id,{...q,sourceKey:'photo:2'}).length,0);assert.equal(questionFocus(n.id,{...q,sourcePhoto:{id:'photo'}}).length,0);}
 }
});
test('selected experiments exist and evaluate finite geometry at every slider boundary',()=>{
 for(const [id,g] of Object.entries(mathStudyGuides)){
  if(!g.lab)continue;const e=lab.experiments.find(e=>e.id===g.lab);assert.ok(e,id);const initial=lab.defaults(e);
  for(const c of e.controls)for(const value of [c.min,c.max]){const r=lab.evaluate(e,{...initial,[c.key]:value});assert.doesNotMatch(r.svg,/NaN|Infinity|undefined/,id+' '+c.key);assert.ok(r.conclusion);assert.ok(r.stats.length);}
 }
});
