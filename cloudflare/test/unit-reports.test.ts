import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUnitReports } from '../src/unit-reports';
import type { Document } from '../src/database';
import diagnosis from '../../app/src/main/assets/web/app-design/diagnosis-engine.js';
import graphs from '../src/diagnosis-rules.json';
import english from '../src/english-rules.json';
const doc=(key:string,data:any):Document=>({key,value:JSON.stringify(data),revision:1,updatedAt:'2026-10-24T03:00:00Z'});
const good={score:8,feedback:'解释正确',criticalErrors:[],at:Date.UTC(2026,9,23,17)};
test('only studied units appear; rewards and subject-wide time cannot manufacture unit time',()=>{
  assert.equal(buildUnitReports([]).units.length,0);
  assert.equal(buildUnitReports([doc('growing-unit-rewards-v1:math-8a-01',{version:1}),doc('growing-activity-v1:device',{days:{'2026-10-23':{数学:600}}})]).units.length,0);
  const [r]=buildUnitReports([doc('growing-math-lessons-v1',{topics:{'tri-lines':{seen:true}}})]).units;
  assert.equal(r.activeMinutes,null);assert.equal(r.firstStudyDay,null);assert.equal(r.mastered,0);assert.equal(r.total,12);
});
test('math/physics time is scoped to real curriculum nodes, mastery requires both explanation and quiz',()=>{
  const report=buildUnitReports([doc('growing-math-lessons-v1',{topics:{'tri-lines':{attempts:[good],bestQuiz:3},'tri-angles':{attempts:[good],bestQuiz:2},'square-root':{seen:true}},tools:{days:{'2026-10-23':{'tri-lines':{ms:120000},'square-root':{ms:60000},foreign:{ms:999999}},'bad-date':{'tri-lines':{ms:100000}}}}}),doc('growing-physics-lessons-v1',{topics:{'phy-source':{attempts:[good],bestQuiz:3}},tools:{days:{'2026-10-24':{'phy-source':{ms:60000}}}}})]);
  const tri=report.units.find(u=>u.id==='math-8a-01')!;
  assert.equal(tri.activeMinutes,2);assert.equal(tri.mastered,1);assert.equal(tri.concept.latest,8);assert.equal(tri.firstStudyDay,'2026-10-23');assert.equal(tri.lastStudyDay,'2026-10-24');
  assert.equal(report.units.find(u=>u.id==='math-8a-02')!.activeMinutes,1);
  assert.equal(report.units.find(u=>u.id==='physics-8a-01')!.mastered,1);
});
test('English mandatory recalls and complete lesson answers determine mastery; saved unit time is supported',()=>{
  const lesson=english['english-8a-01'].lessons[0];
  const [r]=buildUnitReports([doc('growing-english-course-v1:english-8a-01',{words:{friendship:{protocol:'seven-recalls',answers:Array(7).fill('friendship'),at:Date.now()},honest:{protocol:'seven-recalls',answers:Array(6).fill('honest')},unknown:{protocol:'seven-recalls',answers:Array(7).fill('unknown')}},lessons:{[lesson.id]:{protocol:'three-correct',answers:lesson.answers}},learningTime:{version:1,days:{'2026-10-24':90000}}})]).units;
  assert.equal(r.mastered,2);assert.equal(r.total,english['english-8a-01'].words.length+english['english-8a-01'].lessons.length);assert.equal(r.activeMinutes,1.5);assert.equal(r.diagnostic.total,0);
});
test('legacy fraction retains historical concepts but needs application verification for course mastery',()=>{
  const [r]=buildUnitReports([doc('fraction-minute-v1',{topics:{definition:{exams:[{real:false,correct:3,total:3,at:Date.now()}]},domain:{draft:'解释草稿'}},learning:{mastery:{definition:null}},activity:{days:{'2026-10-23':60000}}})]).units;
  assert.equal(r.mastered,1);assert.equal(r.total,11);assert.equal(r.activeMinutes,1);
  const [u]=buildUnitReports([doc('wordops_8A_unit3',{seen:['w1'],best:{[english.__legacy.tests[0]]:80},learningTime:{days:{'2026-10-23':120000}}})]).units;
  assert.equal(u.mastered,1);assert.equal(u.activeMinutes,2);
});
test('valid complete graph assessments stay separate from course mastery; incomplete evidence earns nothing',()=>{
  const g=diagnosis.graph(graphs.math);let s=diagnosis.createAssessment(g,['tri-lines']);
  while(diagnosis.inspect(g,s).next){const q=diagnosis.inspect(g,s).next.question;s=diagnosis.answer(g,s,q.id,q.answer);}
  const record=(session:any)=>doc('growing-diagnosis-v1:math-8a-01',{version:1,records:{'tri-lines':session}});
  const [r]=buildUnitReports([record(s)]).units;
  assert.equal(r.diagnostic.passed,1);assert.equal(r.diagnostic.tested,1);assert.equal(r.mastered,0);assert.equal(r.activeMinutes,null);
  assert.equal(buildUnitReports([record({...s,answers:s.answers.slice(0,1)})]).units.length,0);
});
test('invalid document is reported without exposing source text',()=>{
  const r=buildUnitReports([{key:'growing-math-lessons-v1',value:'broken private data',revision:1,updatedAt:'2026-10-24T00:00:00Z'}]);
  assert.equal(r.units.length,0);assert.equal(r.warnings.length,1);assert.ok(!JSON.stringify(r).includes('private data'));
});
