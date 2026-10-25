import {test} from 'node:test';
import assert from 'node:assert/strict';
import {masteryBoards} from '../src/rankings';
import {buildUnitReports} from '../src/unit-reports';
import type {Document} from '../src/database';
const answer='概念原话。条件原话。举例原话。边界原话。';
const grade={schema:'math-four-part-v1',valid:true,answer,score:8.5,feedback:'解释完整',comment:'解释完整',good:['概念准确'],gaps:['继续练习'],criticalErrors:[],followup:'还有其他例子吗？',at:'2026-10-25T02:00:00Z',criteria:[
 {id:'core',score:3.5,evidence:'概念原话',feedback:'正确'},
 {id:'condition',score:2,evidence:'条件原话',feedback:'正确'},
 {id:'example',score:2,evidence:'举例原话',feedback:'正确'},
 {id:'boundary',score:1,evidence:'边界原话',feedback:'还可补充'}
]};
const doc=(attempt:any):Document=>({key:'growing-math-lessons-v1',value:JSON.stringify({topics:{'tri-lines':{draft:answer,bestQuiz:3,attempts:[attempt]}}}),revision:1,updatedAt:'2026-10-25T02:00:00Z'});
test('verified half-point rubric grades count toward both rankings and unit reports',()=>{
 assert.equal(masteryBoards([doc(grade)]).find(u=>u.id==='math-8a-01')!.conceptDone,1);
 const report=buildUnitReports([doc(grade)]).units.find(u=>u.id==='math-8a-01')!;
 assert.equal(report.concept.latest,8.5);assert.equal(report.mastered,1);
});
test('altered totals and invented evidence do not gain mastery through sync',()=>{
 for(const bad of [{...grade,score:10},{...grade,answer:'不含证据'},{...grade,criteria:grade.criteria.slice(0,3)}, {...grade,schema:undefined}]){
  assert.equal(masteryBoards([doc(bad)]).find(u=>u.id==='math-8a-01')!.conceptDone,0);
  assert.equal(buildUnitReports([doc(bad)]).units.find(u=>u.id==='math-8a-01')!.mastered,0);
 }
});
