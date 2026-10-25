import {test} from 'node:test';
import assert from 'node:assert/strict';
import {masteryBoards} from '../src/rankings';
import {buildUnitReports} from '../src/unit-reports';
import type {Document} from '../src/database';
const good={protocol:'word-mastery-v2',answers:Array(7).fill('shelf'),pluralAnswer:'shelves',oral:{meaningPassed:true,posPassed:true,feedback:'正确',errors:[],answer:'架子，名词'},at:Date.now()};
const doc=(key:string,value:any):Document=>({key,value:JSON.stringify(value),revision:1,updatedAt:new Date().toISOString()});
test('ranking and unit reports agree that new evidence requires both plural and oral mastery',()=>{
  for(const [record,credit] of [[good,1],[{...good,pluralAnswer:'shelfs'},0],[{...good,oral:{...good.oral,posPassed:false}},0],[{...good,oral:{...good.oral,answer:''}},0],[{practice:{answers:good.answers,pluralAnswer:'shelves'}},0]] as const){
    const docs=[doc('growing-english-course-v1:english-8a-04',{version:1,words:{shelf:record},lessons:{}})];
    assert.equal(masteryBoards(docs).find(b=>b.id==='english-8a-04')!.testDone,credit);
    assert.equal(buildUnitReports(docs).units.find(b=>b.id==='english-8a-04')!.mastered,credit);
  }
});
test('legacy Unit 3 reports validate new records without turning pending oral work into mastery',()=>{
  const learner={...good,answers:Array(7).fill('learner'),pluralAnswer:'learners'};
  for(const [record,credit] of [[learner,1],[{...learner,pluralAnswer:'learner'},0],[{...learner,oral:{...good.oral,meaningPassed:false}},0]] as const){
    const docs=[doc('wordops_8A_unit3',{seen:['w1'],mastered:{w1:record}})];
    assert.equal(buildUnitReports(docs).units.find(b=>b.id==='english-8a-03')!.mastered,credit);
  }
});
