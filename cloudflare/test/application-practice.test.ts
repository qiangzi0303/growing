import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReport} from '../src/reports';
import {masteryBoards} from '../src/rankings';
import {buildUnitReports} from '../src/unit-reports';
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
