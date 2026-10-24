const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const root='../app/src/main/assets/web/app-design/';
const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve(root+'growth-quadrant-data.js'),'utf8'),context);
const C=JSON.parse(JSON.stringify(context.window.GrowingQuadrantContent));
const Quad=require(root+'growth-quadrant-core.js');
function answersFor(sums){
 const remaining={...sums},counts=Object.fromEntries(C.quadrants.map(q=>[q.id,5]));
 return C.questions.map(q=>{const id=q.quadrant,score=Math.max(1,Math.min(3,remaining[id]-(counts[id]-1)));remaining[id]-=score;counts[id]--;return q.options.findIndex(o=>o.s===score);});
}
test('original option scores, including non-ordinal options, determine the result',()=>{
 assert.equal(C.questions.length,20);
 for(const q of C.quadrants)assert.equal(C.questions.filter(x=>x.quadrant===q.id).length,5);
 assert.deepEqual(C.questions[0].options.map(o=>o.s),[2,1,3]);
 for(const score of [1,2,3]){
  const r=Quad.evaluate(C,C.questions.map(q=>q.options.findIndex(o=>o.s===score)));
  assert.deepEqual(r.quadrants.map(q=>q.sum),Array(4).fill(score*5));
  assert.deepEqual(r.quadrants.map(q=>q.level),Array(4).fill(score));
 }
});
test('every score from 5 to 15 maps to the original boundary and tie priority',()=>{
 for(let total=5;total<=15;total++){
  const r=Quad.evaluate(C,answersFor(Object.fromEntries(C.quadrants.map(q=>[q.id,total]))));
  assert.deepEqual(r.quadrants.map(q=>q.sum),Array(4).fill(total));
  assert.deepEqual(r.quadrants.map(q=>q.level),Array(4).fill(total<=8?1:total<=11?2:3));
  assert.equal(r.focusId,'body');assert.equal(r.tied.length,4);
 }
 const r=Quad.evaluate(C,answersFor({mind:5,body:6,spirit:5,career:5}));
 assert.equal(r.focusId,'mind');
});
test('all 81 level combinations yield the expected original type and lowest focus',()=>{
 for(let a=1;a<=3;a++)for(let b=1;b<=3;b++)for(let c=1;c<=3;c++)for(let d=1;d<=3;d++){
  const levels=[a,b,c,d],sums=Object.fromEntries(C.quadrants.map((q,i)=>[q.id,levels[i]*5]));
  const r=Quad.evaluate(C,answersFor(sums));
  const name=levels.every(x=>x===3)?'满级整合者':levels.every(x=>x===1)?'顺流漂流瓶':levels.includes(3)&&levels.includes(1)?'偏科尖子生':levels.includes(3)?'稳步登山客':levels.filter(x=>x===1).length>=3?'起跑热身派':'独门掌门人';
  assert.equal(r.type.name,name);
  const min=Math.min(...Object.values(sums));assert.equal(r.focusId,['body','mind','spirit','career'].find(id=>sums[id]===min));
 }
});
