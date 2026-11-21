const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../app/src/main/assets/web/app-design/english-word-review.js');
const date=s=>new Date(s+'T12:00:00').getTime();
test('full interval ladder crosses calendar months and caps at thirty days',()=>{
 let r=R.answer(null,true,false,date('2026-01-30'));
 for(const [today,due] of [['2026-01-31','2026-02-03'],['2026-02-03','2026-02-10'],['2026-02-10','2026-02-24'],['2026-02-24','2026-03-26'],['2026-04-01','2026-05-01']]){r=R.answer(r,true,false,date(today));assert.equal(r.due,due);}
 assert.equal(r.level,5);
});
test('calendar schedule advances once per day and early success preserves due date',()=>{
 let r=R.answer(null,true,false,date('2026-11-21'));
 assert.equal(r.due,'2026-11-22');
 assert.deepEqual(R.answer(r,true,false,date('2026-11-21')),r);
 r=R.answer(r,true,false,date('2026-11-22'));assert.equal(r.due,'2026-11-25');
 assert.deepEqual(R.answer(r,true,false,date('2026-11-23')),r);
 r=R.answer(r,false,false,date('2026-11-23'));assert.equal(r.due,'2026-11-24');assert.equal(r.level,0);
 assert.deepEqual(R.answer(r,true,false,date('2026-11-23')),r);
 r=R.answer(r,true,false,date('2026-11-24'));assert.equal(r.due,'2026-11-25');
 r=R.answer(r,true,true,date('2026-11-25'));assert.equal(r.due,'2026-11-26');assert.equal(r.level,0);
});
test('plans exclude optional and include historical mastery for first check',()=>{
 const words=[{id:'a'},{id:'b'},{id:'c',optional:true},{id:'d'}];
 assert.deepEqual(R.plan(words,{a:{due:'2026-11-22'},c:{due:'2026-11-20'}},id=>id==='b',date('2026-11-21')),{dueIds:['b'],freshIds:['d'],scheduledIds:['a'],nextDue:'2026-11-22'});
});
