import {test} from 'node:test';
import assert from 'node:assert/strict';
import {masteryBoards} from '../src/rankings';
import catalog from '../src/ranking-rules.json';
import type {Document} from '../src/database';
import diagnosis from '../../app/src/main/assets/web/app-design/diagnosis-engine.js';
import diagnosisRules from '../src/diagnosis-rules.json';
const doc=(key:string,value:unknown):Document=>({key,value:JSON.stringify(value),revision:1,updatedAt:'2026-10-22T00:00:00Z'});
const good={score:8,feedback:'概念准确，例子恰当。',criticalErrors:[]};
const math=catalog.find(u=>u.id==='math-8a-01')!;

test('50% Feynman, 100% questions and no diagnosis give 55; semester keeps fixed denominators',()=>{
  const topics=Object.fromEntries(math.topics!.map((id,i)=>[id,{seen:true,bestQuiz:3,attempts:i<6?[good]:[]}]));
  const rows=masteryBoards([doc('growing-math-lessons-v1',{topics})]);
  const unit=rows.find(r=>r.id===math.id)!,course=rows.find(r=>r.id==='math:upper')!;
  assert.equal(unit.conceptTotal,12);assert.equal(unit.conceptDone,6);assert.equal(unit.score,5500);
  assert.equal(course.conceptTotal,32);assert.equal(course.testTotal,32);assert.equal(course.diagnosisTotal,32);assert.equal(course.score,2063);
  assert.equal(rows.length,2);
});
test('Feynman alone earns 30, questions alone 40, both without diagnosis 70',()=>{
  for(const [concept,quiz,expected] of [[true,0,3000],[false,3,4000],[true,3,7000]] as const){
    const topics=Object.fromEntries(math.topics!.map(id=>[id,{seen:true,bestQuiz:quiz,attempts:concept?[good]:[]}]));
    assert.equal(masteryBoards([doc('growing-math-lessons-v1',{topics})])[0].score,expected);
  }
});
test('invalid scores, unknown topics, browsing, rewards and clocks cannot award points',()=>{
  const topics={unknown:{bestQuiz:3,attempts:[good]},[math.topics![0]]:{seen:true,bestQuiz:999,attempts:[{...good,score:'10'},{...good,score:11},{...good,criticalErrors:['错误']}]}};
  const rows=masteryBoards([doc('growing-math-lessons-v1',{topics}),doc('growing-unit-rewards-v1:'+math.id,{done:9999}),doc('growing-activity-v1:fake',{days:{}})]);
  assert.equal(rows[0].score,0);assert.equal(rows.length,2);
  assert.deepEqual(masteryBoards([doc('growing-math-lessons-v1',{topics:{unknown:{seen:true}}})]),[]);
});
test('English recall is test credit and never concept credit; real explanations and lesson answers count separately',()=>{
  const u=catalog.find(u=>u.id==='english-8a-01')!,word=u.rules!.words[0],lesson=u.rules!.lessons[0];
  const value={words:{[word.id]:{protocol:'seven-recalls',answers:Array(7).fill(word.word)}},lessons:{[lesson.id]:{protocol:'three-correct',answers:lesson.answers}},feynman:{[lesson.id]:{attempts:[good]}}};
  const r=masteryBoards([doc('growing-english-course-v1:'+u.id,value)])[0];
  assert.equal(r.conceptDone,1);assert.equal(r.conceptTotal,4);assert.equal(r.testDone,2);
  assert.equal(r.testTotal,u.rules!.words.length+4);
  assert.equal(r.score,Math.round(750+8000/r.testTotal));
  value.feynman[lesson.id].attempts=[];assert.equal(masteryBoards([doc('growing-english-course-v1:'+u.id,value)])[0].conceptDone,0);
});

const graph=diagnosis.graph(diagnosisRules.math);
function assessment(targets:string[],correct=true){
  let session=diagnosis.createAssessment(graph,targets),state;
  while((state=diagnosis.inspect(graph,session)).next){const q=state.next.question;session=diagnosis.answer(graph,session,q.id,correct?q.answer:null);}
  return session;
}
const diagnosticDoc=(unit:any,session:any)=>doc('growing-diagnosis-v1:'+unit.id,{version:1,score:10000,
  records:Object.fromEntries(unit.diagnosisTopics.map((id:string)=>[id,session]))});
test('complete diagnosis is worth 30; all three components are worth exactly 100',()=>{
  const session=assessment(math.diagnosisTopics!);
  const diagnostic=diagnosticDoc(math,session);
  const only=masteryBoards([diagnostic]);
  assert.equal(only[0].score,3000);assert.equal(only[0].diagnosisDone,12);assert.equal(only[0].diagnosisTotal,12);
  assert.equal(only.find(r=>r.id==='math:upper')!.score,1125);
  const topics=Object.fromEntries(math.topics!.map(id=>[id,{bestQuiz:3,attempts:[good]}]));
  assert.equal(masteryBoards([diagnostic,doc('growing-math-lessons-v1',{topics})])[0].score,10000);
  assert.deepEqual(masteryBoards([{...diagnostic,value:null}]),[]);
});
test('partial, early-closed, forged and wrong-chapter diagnostic evidence earn no points',()=>{
  const full=assessment(math.diagnosisTopics!);
  for(const bad of [{...full,answers:full.answers.slice(0,-1)},{...full,closed:true},
    {...full,answers:full.answers.map((a:any)=>({...a,choice:99}))},{...full,protocol:'forged'},
    {...full,answers:[...full.answers.slice(1),full.answers[0]]},assessment(['add'])]){
    assert.deepEqual(masteryBoards([diagnosticDoc(math,bad)]),[]);
  }
  const none=masteryBoards([diagnosticDoc(math,assessment(math.diagnosisTopics!,false))]);
  assert.equal(none[0].score,0);assert.equal(none[0].diagnosisDone,0);
});
test('one completed target contributes only its two-question fraction, without double counting',()=>{
  const id=math.diagnosisTopics![0],full=assessment([id]);
  const session={...full,answers:[full.answers[0],{...full.answers[1],choice:null}]};
  const record=doc('growing-diagnosis-v1:'+math.id,{version:1,records:{[id]:session,unknown:full}});
  const rows=masteryBoards([record,record]);
  assert.equal(rows[0].diagnosisDone,.5);assert.equal(rows[0].diagnosisTotal,12);assert.equal(rows[0].score,125);
});
test('fraction diagnostic and semester denominators use the actual graph independently of legacy concept counts',()=>{
  const fraction=catalog.find(u=>u.kind==='fraction')!;
  const rows=masteryBoards([diagnosticDoc(fraction,assessment(fraction.diagnosisTopics!))]);
  const unit=rows.find(r=>r.id===fraction.id)!,course=rows.find(r=>r.id==='math:lower')!;
  assert.equal(unit.diagnosisTotal,11);assert.equal(unit.diagnosisDone,11);assert.equal(unit.score,3000);
  assert.equal(course.diagnosisTotal,36);assert.equal(course.score,917);
});
test('legacy fraction and Unit 3 keep valid records; bonus exams cannot inflate the test denominator',()=>{
  const fraction=catalog.find(u=>u.kind==='fraction')!,english=catalog.find(u=>u.kind==='legacy-english')!;
  const rows=masteryBoards([
    doc('fraction-minute-v1',{topics:{[fraction.topics![0]]:{attempts:[{valid:true,score:8}],exams:[{real:false,correct:2,total:3},{real:true,correct:99,total:99}]}}}),
    doc('wordops_8A_unit3',{studyHistory:{days:{'2026-10-22':{feynman:{[english.topics![0]]:{attempts:1,best:80}}}}},best:{[english.tests![0]]:100,unknown:100}}),
  ]);
  assert.equal(rows.find(r=>r.id===fraction.id)!.conceptDone,1);
  assert.equal(rows.find(r=>r.id===fraction.id)!.testDone,2/3);
  assert.equal(rows.find(r=>r.id===english.id)!.conceptDone,1);
  assert.equal(rows.find(r=>r.id===english.id)!.testDone,1);
});
test('initial empty classroom records do not enroll; tombstones remove enrollment; terms stay separate',()=>{
  assert.deepEqual(masteryBoards([doc('fraction-minute-v1',{topics:{}}),doc('growing-english-course-v1:english-8a-01',{words:{},lessons:{}})]),[]);
  const lower=catalog.find(u=>u.id==='math-8b-06')!;
  const rows=masteryBoards([doc('growing-math-lessons-v1',{topics:{[math.topics![0]]:{seen:true},[lower.topics![0]]:{seen:true}}})]);
  assert.deepEqual(rows.filter(r=>r.kind==='course').map(r=>r.id),['math:upper','math:lower']);
  assert.deepEqual(masteryBoards([{...doc('growing-math-lessons-v1',{}),value:null}]),[]);
});
