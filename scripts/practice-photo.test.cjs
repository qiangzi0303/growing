const {test}=require('node:test'),assert=require('node:assert/strict');
const base='../app/src/main/assets/web/app-design/';
const P=require(base+'practice-progress.js'),A=require(base+'application-practice.js'),C=require(base+'handwriting-core.js');
const M=require(base+'math-data.js');
const qs=A.questions(M.nodes.find(n=>n.id==='pythagoras'),'math');
const key=C.PREFIX+'12345678-1234-1234-1234-123456789abc';
const stamp='2026-11-09T00:00:00Z';
const snapshot=score=>({version:1,items:qs.map(q=>({id:q.id,key,revision:1,at:stamp,score}))});

test('upload history retains ungraded replacements and isolates exact question, subject and unit',()=>{
  const values={}, storage={get length(){return Object.keys(values).length},key:i=>Object.keys(values)[i],getItem:k=>values[k]};
  function add(i,q=qs[0],unit='math-8a-03'){
    const doc=C.create('math',unit,A.prompt(q));doc.updatedAt=`2026-11-09T00:00:0${i}Z`;doc.photos=['data:image/jpeg;base64,/9j/'];
    const k=C.PREFIX+'12345678-1234-1234-1234-123456789ab'+i;values[k]=JSON.stringify(doc);return k;
  }
  const first=add(1),second=add(2);add(3,qs[1]);add(4,qs[0],'math-8a-01');
  const r=A.results(storage,'math','math-8a-03',qs)[qs[0].id];
  assert.equal(r.key,second);assert.equal(r.status,'pending');assert.equal(r.uploads.length,2);
  assert.deepEqual(r.uploads.map(u=>u.key),[second,first]);assert.equal(r.uploads[1].status,'pending');assert.equal(r.uploads[1].photos.length,1);
  assert.equal(Object.keys(values).length,4);assert.deepEqual(A.results(storage,'physics','physics-8a-01',qs),{});
  const doc=JSON.parse(values[first]);doc.grades=[{revision:0,at:doc.updatedAt,score:80,parts:[20,20,20,20],feedback:'第一份批改',needsReview:false,source:'handwriting',corrections:[],knowledge:[{nodeId:qs[0].topic,score:80,feedback:'对应知识点'}]}];values[first]=JSON.stringify(doc);
  const graded=A.results(storage,'math','math-8a-03',qs)[qs[0].id];
  assert.equal(graded.key,second);assert.equal(graded.uploads[0].grades.length,0);assert.equal(graded.uploads[1].grades[0].feedback,'第一份批改');assert.equal(graded.uploads[1].status,'graded');assert.equal(graded.passed,false);
});
test('actual Feynman and AI application marks form a 30/70 score out of 100',()=>{
  const r={attempts:[{score:9,feedback:'有效解释',criticalErrors:[]}],practicePhoto:snapshot(70)};
  assert.deepEqual(P.mastery(r),{feynman:90,application:70,score:76});
  r.practicePhoto=snapshot(100);r.attempts[0].score=10;assert.equal(P.mastery(r).score,100);
  assert.equal(P.mastery({}).score,0);
  r.attempts.push({score:5,feedback:'最近一次解释',criticalErrors:[]});assert.equal(P.mastery(r).score,85);
  r.attempts.push({score:8.5,feedback:'量表允许半分',criticalErrors:[]});assert.equal(P.mastery(r).score,95.5);
  r.attempts.push({score:null,feedback:'无效',criticalErrors:[]});assert.equal(P.mastery(r).score,95.5);
});

test('legacy photo controls expose ungraded upload records without a writing entry',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),window={GrowingHandwriting:C,GrowingApplicationPractice:A};
  vm.runInNewContext(fs.readFileSync(require.resolve(base+'practice-photo.js'),'utf8'),{window,addEventListener(){}});
  const controls=window.GrowingPracticePhoto.create({subject:'math',unit:'math-8a-03',questions:qs,onChange(){}});
  const html=controls.markup(qs[8],{uploads:[{key,updatedAt:stamp,photos:['saved-original.jpg'],grades:[],status:'pending'}]});
  assert.match(html,/上传记录（1）/);assert.match(html,/saved-original.jpg/);assert.match(html,/尚无批改记录/);assert.match(html,/最后保存/);assert.doesNotMatch(html,/handwriting\.html|手写作答/);
});

test('fraction keeps its actual question denominator and uses continuous Feynman marks',()=>{
  const qs3=qs.slice(0,3),results=Object.fromEntries(qs3.map(q=>[q.id,{key,doc:{revision:1},grade:{score:70,at:stamp},status:'graded',passed:false}]));
  const practicePhoto=A.snapshot(qs3,results),r={practicePhoto,attempts:[{valid:true,score:9,comment:'有效解释',criticalErrors:[]}],exams:[{real:false,correct:3,total:3}]};
  assert.equal(practicePhoto.total,3);assert.equal(P.photo(practicePhoto),true);
  assert.deepEqual(P.fraction(r),{feynman:90,application:70,score:76});
  r.practicePhoto.items[0].score=null;assert.equal(P.result(r).score,140/3);
  assert.equal(P.fraction({},true).feynman,100);
  assert.equal(P.fraction({attempts:{invalid:true}}).score,0);
});

test('a low associated knowledge score blocks passing even when the overall mark is high',()=>{
  const r={practicePhoto:snapshot(100)};r.practicePhoto.items[0].passed=false;
  assert.equal(P.result(r).score,100);assert.equal(P.result(r).passed,false);
});
test('ungraded and malformed photo results cannot resurrect historical full marks',()=>{
  const r={bestQuiz:3,practice10:{version:1,total:10,best:10},practicePhoto:snapshot(null)};
  assert.equal(P.result(r).score,0);assert.equal(P.result(r).passed,false);
  r.practicePhoto.items[0].score=100;assert.equal(P.result(r).score,10);
  for(const bad of [null,{}, {version:1,items:[null]},snapshot(101),snapshot('100')]){r.practicePhoto=bad;assert.equal(P.result(r).score,0);}
  assert.equal(P.result({bestQuiz:3}).passed,true);
});
test('every question including choices associates visual grades with its exact prompt and current revision',()=>{
  const q=qs[0],doc=C.create('math','math-8a-03',A.prompt(q));
  doc.pages=[[{tool:'pen',width:4,points:[[10,10,.5]]}]];
  const grade={revision:0,at:stamp,score:80,parts:[20,20,20,20],feedback:'推导仍缺一步',needsReview:false,source:'handwriting',corrections:[{location:'第二行',issue:'缺少推导',correction:'补全等式'}],knowledge:[{nodeId:q.topic,score:80,feedback:'方法正确'}]};
  doc.grades=[grade];const values={[key]:JSON.stringify(doc)},storage={get length(){return Object.keys(values).length},key:i=>Object.keys(values)[i],getItem:k=>values[k]};
  let result=A.results(storage,'math','math-8a-03',qs);assert.equal(result[q.id].grade.score,80);assert.equal(result[q.id].status,'graded');
  assert.equal(P.result({practicePhoto:A.snapshot(qs,result)}).score,8);
  doc.revision++;values[key]=JSON.stringify(doc);result=A.results(storage,'math','math-8a-03',qs);assert.equal(result[q.id].status,'pending');
  grade.revision=1;grade.knowledge[0].score=null;values[key]=JSON.stringify(doc);assert.equal(A.results(storage,'math','math-8a-03',qs)[q.id].status,'pending');
  doc.prompt=qs[1].prompt;values[key]=JSON.stringify(doc);assert.equal(A.results(storage,'math','math-8a-03',qs)[q.id],undefined);
});
