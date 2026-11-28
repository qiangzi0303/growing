const {test}=require('node:test');
const assert=require('node:assert/strict');
const Plan=require('../app/src/main/assets/web/app-design/english-pomodoro-plan.js');
const U='english-8a-01';
const word=i=>({id:'word:'+i,eventId:'word:'+i,kind:'word',title:'word '+i,wordId:String(i),review:false,newWord:true});
const point=i=>({id:'point:l:'+i,eventId:'point:l:'+i,kind:'point',title:'point '+i,lessonId:'l',pointId:String(i),review:false,newWord:false});
const lesson=i=>({id:'lesson:'+i,eventId:'lesson:'+i,kind:'lesson',title:'reading '+i,lessonId:String(i),review:false,newWord:false});
const sentence=(i,topicId='a')=>({id:'sentence:'+i,eventId:'sentence:'+i,kind:'sentence',title:'sentence '+i,sentenceId:String(i),topicId,review:false,newWord:false});
const main=r=>r.targets.filter(t=>!t.review);

test('reading points and comprehensive quiz retain independent targets',()=>{
 const plan=Plan.build(U,{reading:[point('reading'),lesson('reading')]});
 assert.deepEqual(plan.rounds.map(r=>r.kind),['mixed','mixed']);
 assert.deepEqual(plan.rounds.map(r=>main(r)[0].kind),['point','lesson']);
});

test('every round combines available subjects and retains all new content and word remainder',()=>{
 const catalog={words:Array.from({length:23},(_,i)=>word(i)),grammar:[point(1),point(2)],reading:[lesson(1)],sentences:Array.from({length:7},(_,i)=>sentence(i)),review:[]};
 const before=structuredClone(catalog),plan=Plan.build(U,catalog);
 assert.deepEqual(plan.rounds.map(r=>r.kind),['mixed','mixed','mixed']);
 assert.deepEqual(plan.rounds.map(r=>main(r).filter(t=>t.newWord).length),[10,10,3]);
 assert.deepEqual(plan.rounds.map(r=>main(r).filter(t=>t.kind==='sentence').length),[3,2,2]);
 for(const r of plan.rounds)assert.deepEqual([...new Set(r.targets.map(t=>t.category))].sort(),['grammar','reading','sentences','words']);
 const ids=plan.rounds.flatMap(main).map(t=>t.id);
 assert.equal(ids.length,33);assert.equal(new Set(ids).size,33);
 assert.deepEqual(catalog,before);assert.deepEqual(Plan.build(U,catalog),plan);
 assert.deepEqual(plan.rounds.map(r=>r.id),['mixed-1','mixed-2','mixed-3']);
});
test('each later round reviews only available earlier tasks, rotating recent and older items',()=>{
 const plan=Plan.build(U,{words:Array.from({length:71},(_,i)=>word(i)),grammar:[point(1),point(2)],sentences:[sentence(1)],reading:[lesson(1)]});
 const available=new Set();
 for(const r of plan.rounds){
  const reviews=r.targets.filter(t=>t.review),fresh=main(r);
  assert.ok(reviews.length<=3,'only missing subjects and a bounded word review');
  for(const t of reviews){assert.ok(available.has(t.kind==='word'?'word:'+t.wordId:t.eventId));assert.equal(t.newWord,false);if(t.kind==='word')assert.equal(t.eventId,'review:'+t.wordId);assert.ok(!fresh.some(x=>x.id===t.id||x.kind==='word'&&x.wordId===t.wordId));}
  for(const t of fresh)available.add(t.eventId);
 }
 const balanced=Plan.build(U,{words:Array.from({length:30},(_,i)=>word(i)),grammar:[point(1),point(2),point(3)],sentences:[sentence(1),sentence(2),sentence(3)],reading:[lesson(1),lesson(2),lesson(3)]});
 assert.ok(balanced.rounds.slice(1).every(r=>r.targets.filter(t=>t.review).length===1&&r.targets.some(t=>t.review&&t.kind==='word')),'balanced new content includes one earlier word review');
});
test('short sentence topics share a round while retaining exact topic routing',()=>{
 const plan=Plan.build(U,{sentences:[sentence(1,'a'),sentence(2,'b'),sentence(3,'a')],review:[word('old'),point('old')]});
 assert.equal(plan.rounds.length,1);
 assert.deepEqual(main(plan.rounds[0]).map(t=>[t.sentenceId,t.topicId]),[['1','a'],['3','a'],['2','b']]);
 assert.equal(plan.rounds[0].targets.filter(t=>t.review).length,2);
 assert.ok(plan.rounds[0].targets.some(t=>t.eventId==='review:old'));
});
test('empty curriculum stays empty, review-only produces a bounded explicit round',()=>{
 assert.deepEqual(Plan.build(U,{}),{version:1,layout:'mixed-v2',unitId:U,rounds:[]});
 const plan=Plan.build(U,{review:Array.from({length:7},(_,i)=>word(i))});
 assert.equal(plan.rounds.length,1);assert.equal(plan.rounds[0].kind,'mixed');assert.equal(plan.rounds[0].targets.length,4);assert.ok(plan.rounds[0].targets.every(t=>t.review&&!t.newWord));
});

test('a partly completed active word batch can seed a mixed plan without replacing its ten targets',()=>{
 const seeds=Array.from({length:10},(_,i)=>word(i)),catalog={words:Array.from({length:12},(_,i)=>word(i+3)),grammar:[point(1)],reading:[lesson(1)],sentences:[sentence(1)],review:seeds.slice(0,3)};
 const plan=Plan.build(U,catalog,seeds);
 assert.deepEqual(plan.rounds[0].targets.filter(t=>t.newWord).map(t=>t.wordId),seeds.map(t=>t.wordId));
 assert.equal(plan.rounds[0].targets.filter(t=>!t.review).length,13);
 assert.deepEqual(plan.rounds[1].targets.filter(t=>t.newWord).map(t=>t.wordId),['10','11','12','13','14']);
});
test('validation rejects corruption and wrong units without changing inputs or dropping extensions',()=>{
 const plan=Plan.build(U,{words:[word(1)]});plan.future={keep:true};plan.rounds[0].futureRound=1;plan.rounds[0].targets[0].futureTask=2;
 const restored=Plan.validate(plan,U);assert.deepEqual(restored,plan);restored.rounds[0].targets[0].title='changed';assert.notEqual(restored.rounds[0].targets[0].title,plan.rounds[0].targets[0].title);
 assert.throws(()=>Plan.validate(plan,'english-8a-02'),/单元/);
 for(const mutate of [p=>p.version=2,p=>p.rounds={},p=>p.rounds[0].targets=[],p=>p.rounds[0].targets[0].eventId='',p=>p.rounds[0].targets[0].review='yes',p=>p.rounds.push(structuredClone(p.rounds[0])),p=>p.rounds[0].targets.push(structuredClone(p.rounds[0].targets[0]))]){const bad=structuredClone(plan);mutate(bad);assert.throws(()=>Plan.validate(bad,U),/计划|目标/);}
 assert.throws(()=>Plan.build(U,{words:[word(1),word(1)]}),/重复/);
 assert.throws(()=>Plan.build(U,{words:[{...word(1),wordId:undefined}]}),/目标/);
});

test('all completed sentence and grammar seeds stay credited in the active round',()=>{
 const seeds=[point('saved-1'),point('saved-2'),...Array.from({length:5},(_,i)=>sentence('saved-'+i,i%2?'a':'b'))];
 const plan=Plan.build(U,{words:Array.from({length:50},(_,i)=>word(i)),grammar:[point('next')],sentences:[sentence('next','a')]},seeds);
 assert.equal(plan.rounds.length,5);
 for(const t of seeds)assert.ok(plan.rounds[0].targets.some(x=>x.eventId===t.eventId&&!x.review),t.eventId);
 const fresh=plan.rounds.flatMap(main).map(t=>t.eventId);
 assert.equal(fresh.length,59);assert.equal(new Set(fresh).size,59);
});
