import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),folder='../../app/src/main/assets/web/app-design/';
async function setup(){
 const dom=new JSDOM('',{url:'https://learn.test/units.html',runScripts:'outside-only'}),w=dom.window;
 for(const [name,file] of Object.entries({GrowingMath:'math-data.js',GrowingPracticeProgress:'practice-progress.js',GrowingHandwriting:'handwriting-core.js',GrowingCourseTools:'course-tools.js',GrowingMathFeedback:'math-feedback.js',GrowingMathScore:'math-chapter-score.js',GrowingRewards:'reward-engine.js'}))w[name]=require(folder+file);
 w.GrowingMathWrongIndex={};w.GrowingCurriculum={math:{name:'数学',terms:{lower:{name:'下册',verified:true,units:[{id:'math-8b-11',title:'二次根式',number:11,entry:'math-course.html'}]}}}};
 let active=true;
 const storage=w.localStorage;
 w.eval(await readFile(new URL(folder+'student-catalog-model.js',import.meta.url),'utf8'));
 const model=w.GrowingStudentCatalog.create({params:new URLSearchParams({subject:'math',term:'lower'}),storage,read:key=>JSON.parse(storage.getItem(key)),load:async()=>{},active:()=>{if(!active)throw Error('账号已切换');}});
 return {w,model,storage,revoke(){active=false;},close(){w.close();}};
}
test('catalog rewards accrue without opening a lesson, preserve earned and paid balances, and do not write lesson time',async()=>{
 const f=await setup();try{
  const first=await f.model.readReward('math-8b-11');assert.equal(first.game,16);assert.equal(first.cash,3200);
  assert.equal(f.storage.getItem('growing-math-lessons-v1'),null);
  const E=f.w.GrowingRewards,key='growing-unit-rewards-v1:math-8b-11';
  let ledger=E.accrue(E.restore(JSON.parse(f.storage.getItem(key))),500,1000);
  ledger=E.redeem(ledger,'cash','家长');f.storage.setItem(key,JSON.stringify(ledger));
  const next=await f.model.readReward('math-8b-11');assert.equal(next.game,50);assert.equal(next.cash,10000);assert.equal(next.paidCash,10000);assert.equal(next.availableCash,0);
  assert.equal(f.w.location.pathname,'/units.html');assert.equal(f.storage.getItem('growing-math-lessons-v1'),null);
 }finally{f.close();}
});
test('catalog rewards reject invalid records and revoked account sessions without overwriting storage',async()=>{
 const f=await setup();try{
  const key='growing-math-lessons-v1';f.storage.setItem(key,'{"version":9}');
  await assert.rejects(f.model.readReward('math-8b-11'),/学习记录无法读取/);
  assert.equal(f.storage.getItem(key),'{"version":9}');assert.equal(f.storage.getItem('growing-unit-rewards-v1:math-8b-11'),null);
  f.storage.removeItem(key);const pending=f.model.readReward('math-8b-11');f.revoke();await assert.rejects(pending,/账号已切换/);
  assert.equal(f.storage.getItem('growing-unit-rewards-v1:math-8b-11'),null);
 }finally{f.close();}
});
