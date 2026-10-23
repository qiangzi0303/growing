import {test} from 'node:test';
import assert from 'node:assert/strict';
import {masteryBoards} from '../src/rankings';
import catalog from '../src/ranking-rules.json';
import type {Document} from '../src/database';
const doc=(key:string,value:unknown):Document=>({key,value:JSON.stringify(value),revision:1,updatedAt:'2026-10-22T00:00:00Z'});
const good={score:8,feedback:'概念准确，例子恰当。',criticalErrors:[]};
const math=catalog.find(u=>u.id==='math-8a-01')!;

test('50% concepts and 100% tests give 85; semester includes unopened units in its denominator',()=>{
  const topics=Object.fromEntries(math.topics!.map((id,i)=>[id,{seen:true,bestQuiz:3,attempts:i<6?[good]:[]}]));
  const rows=masteryBoards([doc('growing-math-lessons-v1',{topics})]);
  const unit=rows.find(r=>r.id===math.id)!,course=rows.find(r=>r.id==='math:upper')!;
  assert.equal(unit.conceptTotal,12);assert.equal(unit.conceptDone,6);assert.equal(unit.score,8500);
  assert.equal(course.conceptTotal,32);assert.equal(course.testTotal,32);assert.equal(course.score,3188);
  assert.equal(rows.length,2);
});
test('concept-only mastery earns 30 points, tests-only mastery 70, all mastery 100',()=>{
  for(const [concept,quiz,expected] of [[true,0,3000],[false,3,7000],[true,3,10000]] as const){
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
  assert.equal(r.score,Math.round(750+14000/r.testTotal));
  value.feynman[lesson.id].attempts=[];assert.equal(masteryBoards([doc('growing-english-course-v1:'+u.id,value)])[0].conceptDone,0);
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
