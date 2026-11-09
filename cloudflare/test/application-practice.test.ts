import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReport} from '../src/reports';
import {masteryBoards} from '../src/rankings';
import {buildUnitReports} from '../src/unit-reports';
import {buildKnowledge} from '../src/student-knowledge';
import type {Document} from '../src/database';
const record=(topic:any):Document=>({key:'growing-math-lessons-v1',value:JSON.stringify({version:1,topics:{pythagoras:{seen:true,draft:'',self:[],attempts:[{score:8,criticalErrors:[],feedback:'解释正确'}],...topic}}}),revision:1,updatedAt:'2026-11-05T00:00:00Z'});
test('new ten-question grades drive reports and rankings without granting historical three-question credit twice',()=>{
  for(const [best,passed] of [[8,false],[10,true]] as const){
    const doc=record({bestQuiz:3,practice10:{version:1,total:10,best}}),original=doc.value;
    assert.equal(buildReport([doc]).subjects[0].mastered,Number(passed));
    assert.equal(buildUnitReports([doc]).units.find(u=>u.id==='math-8a-03')?.mastered,Number(passed));
    assert.equal(masteryBoards([doc]).find(u=>u.id==='math-8a-03')?.testDone,best/10);
    assert.equal(doc.value,original);
  }
});
test('historical results remain readable; malformed ten-question results cannot fall back to a saved full score',()=>{
  assert.equal(buildReport([record({bestQuiz:3})]).subjects[0].mastered,1);
  for(const practice10 of [{version:1,total:10,best:11},{version:1,total:3,best:3},{version:1,total:10,best:'10'}]){
    assert.equal(buildReport([record({bestQuiz:3,practice10})]).subjects[0].mastered,0);
    assert.equal(masteryBoards([record({bestQuiz:3,practice10})]).find(u=>u.id==='math-8a-03')?.testDone,0);
  }
});

test('photo marks and actual latest Feynman scores use 30/70 across the entire chapter',()=>{
  const items=Array.from({length:10},(_,i)=>({id:'pythagoras-application-'+(i+1),key:'growing-handwriting-v1:12345678-1234-1234-1234-123456789abc',revision:1,at:'2026-11-09T00:00:00Z',score:70}));
  const d=record({attempts:[{score:9,criticalErrors:[],feedback:'有效解释'}],practicePhoto:{version:1,items}});
  const unit=masteryBoards([d]).find(u=>u.id==='math-8a-03')!;
  assert.equal(unit.conceptDone,.9);assert.equal(unit.testDone,.7);assert.equal(unit.score,2533);
  assert.equal(buildUnitReports([d]).units.find(u=>u.id===unit.id)?.masteryPercent,25.33);
});

test('fraction photo results replace old exam credit and reach summaries and knowledge reports',()=>{
  const items=Array.from({length:3},(_,i)=>({id:'definition-application-'+(i+1),key:'growing-handwriting-v1:12345678-1234-1234-1234-123456789abc',revision:1,at:'2026-11-09T00:00:00Z',score:70,passed:false}));
  const state={topics:{definition:{attempts:[{valid:true,score:9,criticalErrors:[],comment:'有效解释'}],exams:[{real:false,correct:3,total:3}],practicePhoto:{version:2,total:3,items}}}};
  const d:Document={key:'fraction-minute-v1',value:JSON.stringify(state),revision:1,updatedAt:'2026-11-09T00:00:00Z'};
  const unit=masteryBoards([d]).find(u=>u.id==='math-8b-10')!;
  assert.equal(unit.conceptDone,.9);assert.equal(unit.testDone,.7);assert.equal(unit.score,691);
  assert.equal(buildUnitReports([d]).units.find(u=>u.id===unit.id)?.mastered,0);
  assert.equal(buildReport([d]).subjects[0].mastered,0);
  assert.equal(buildKnowledge([d]).topics.find(t=>t.unitId===unit.id&&t.id==='definition')?.courseMastered,false);
});
