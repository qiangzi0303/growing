const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../app/src/main/assets/web/app-design/unit-calendar.js');
const topics=[{id:'triangle',title:'三角形',unitId:'math-8a-01'},{id:'other',title:'其他章节',unitId:'math-8a-02'}];
const today='2026-11-01';
test('calendar isolates the selected math chapter and retains exact dated mastery and time',()=>{
  const raw={tools:{days:{[today]:{triangle:{ms:90000,reads:2,grades:3,practice:1},other:{ms:99999,grades:9}}},mastery:{triangle:today,other:today}}};
  const before=JSON.stringify(raw),data=C.collect('math-8a-01',()=>raw,topics),row=data.days[today];
  assert.equal(row.ms,90000);assert.equal(row.grades,3);assert.equal(row.practice,1);assert.equal(row.newCount,1);assert.equal(row.items[0].title,'三角形');
  assert.equal(JSON.stringify(raw),before,'calendar must never rewrite learning data');
});
test('legacy undated mastery stays at the baseline instead of being assigned today',()=>{
  const data=C.collect('math-8a-01',()=>({tools:{days:{},mastery:{triangle:null,other:today}}}),topics);
  assert.equal(data.baseline,1);assert.deepEqual(data.days,{});
});
test('physics uses its own store and filters chapter topics',()=>{
  const data=C.collect('physics-8a-01',key=>{assert.equal(key,'growing-physics-lessons-v1');return {tools:{days:{[today]:{sound:{ms:60000,grades:1}}}}};},[{id:'sound',title:'声音',unitId:'physics-8a-01'}]);
  assert.equal(data.days[today].ms,60000);assert.equal(data.days[today].grades,1);
});
test('fraction calendar preserves its original daily grades, practice, time and mastery',()=>{
  const data=C.collect('math-8b-10',key=>{assert.equal(key,'fraction-minute-v1');return {learning:{days:{[today]:{definition:{attempts:2,exams:3}}},mastery:{definition:today}},activity:{days:{[today]:120000}}};});
  assert.equal(data.days[today].grades,2);assert.equal(data.days[today].practice,3);assert.equal(data.days[today].ms,120000);assert.equal(data.days[today].newCount,1);
});
test('English unit calendars display saved records without inferring new mastery dates',()=>{
  const data=C.collect('english-8a-02',key=>{assert.equal(key,'growing-english-course-v1:english-8a-02');return {learningTime:{days:{[today]:70000}},words:{a:{at:today+'T12:00:00'},b:{}},lessons:{a:{at:today+'T12:30:00'}},feynman:{a:{attempts:[{at:today+'T13:00:00'}]}}};});
  assert.equal(data.days[today].words,1);assert.equal(data.days[today].lessons,1);assert.equal(data.days[today].grades,1);assert.equal(data.days[today].ms,70000);assert.equal(data.datedMastery,false);
});
test('legacy English Unit 3 retains separate study history and foreground time',()=>{
  const data=C.collect('english-8a-03',()=>({studyHistory:{days:{[today]:{words:{w1:{}},cards:['c1'],quizzes:{q1:{attempts:3}},points:{p1:{}},feynman:{f1:{attempts:2}}}}},learningTime:{days:{[today]:60000}}}));
  assert.equal(data.days[today].words,1);assert.equal(data.days[today].reads,1);assert.equal(data.days[today].practice,3);assert.equal(data.days[today].grades,2);assert.equal(data.days[today].lessons,1);assert.equal(data.days[today].ms,60000);
});
test('missing records stay empty and invalid calendar dates are rejected',()=>{
  assert.deepEqual(C.collect('english-8a-01',()=>null).days,{});
  assert.equal(C.validDate('2026-02-30'),false);assert.equal(C.validDate('2026-11-01'),true);
  const data=C.collect('english-8a-01',()=>({learningTime:{days:{'2026-02-30':999,[today]:-50}}}));
  assert.equal(data.days['2026-02-30'],undefined);assert.equal(data.days[today].ms,0);
});
