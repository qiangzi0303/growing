const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const assets=path.join(__dirname,'../app/src/main/assets/web/app-design');
const planner=require(path.join(assets,'course-pomodoro-plan.js'));
const A=require(path.join(assets,'application-practice.js'));
const math=require(path.join(assets,'math-data.js'));
const physics=require(path.join(assets,'physics-data.js'));

test('every math and physics unit gets bounded goals and all ten questions without changing source data',()=>{
 for(const [subject,data] of [['math',math],['physics',physics]])for(const chapter of data.chapters){
  const before=JSON.stringify(chapter),plans=planner.build(chapter,subject,n=>A.questions(n,subject));
  assert.ok(plans.length>1,chapter.id);assert.equal(new Set(plans.map(p=>p.id)).size,plans.length);
  assert.deepEqual(planner.build(chapter,subject,n=>A.questions(n,subject)),plans);
  assert.equal(JSON.stringify(chapter),before);
  const expected=chapter.nodes.flatMap(n=>A.questions(n,subject).map(q=>q.id));
  const actual=plans.flatMap(p=>p.tasks.filter(t=>t.kind==='practice').flatMap(t=>t.questionIds));
  assert.deepEqual(actual.slice().sort(),expected.slice().sort(),chapter.id+' exact coverage');
  assert.equal(new Set(actual).size,actual.length);
  for(const p of plans){
   assert.ok(p.title&&p.goal&&p.goal!=='学习25分钟');
   assert.ok(p.minutes<=25&&p.minutes>0,p.id);
   assert.equal(p.minutes,p.tasks.reduce((s,t)=>s+t.minutes,0));
   assert.ok(p.tasks.some(t=>t.kind==='review'),p.id+' review');
   assert.equal(new Set(p.tasks.map(t=>t.id)).size,p.tasks.length);
   for(const t of p.tasks){assert.ok(chapter.nodes.some(n=>n.id===t.nodeId));assert.ok(t.goal&&t.title);assert.ok(['learn','recall','practice'].includes(t.tab));}
  }
 }
});

test('reviews use only earlier taught content and assigned questions, followed by full-unit recap',()=>{
 for(const [subject,data] of [['math',math],['physics',physics]])for(const chapter of data.chapters){
  const plans=planner.build(chapter,subject,n=>A.questions(n,subject)),taught=new Set(),assigned=new Set(),recap=new Set();
  for(const [i,p] of plans.entries()){
   for(const t of p.tasks.filter(t=>t.kind==='review')){
    if(i>0)assert.ok(taught.has(t.nodeId),p.id+' prior node '+t.nodeId);
    for(const id of t.questionIds)assert.ok(assigned.has(id),p.id+' earlier question '+id);
    if(p.recap)recap.add(t.nodeId);
   }
   for(const t of p.tasks){if(t.kind==='learn')taught.add(t.nodeId);if(t.kind==='practice')t.questionIds.forEach(id=>assigned.add(id));}
  }
  assert.deepEqual([...recap].sort(),chapter.nodes.map(n=>n.id).sort());
 }
});

test('overall goals remain concise while classroom tasks retain exact criteria',()=>{
 for(const [subject,data] of [['math',math],['physics',physics]])for(const chapter of data.chapters){
  const plans=planner.build(chapter,subject,n=>A.questions(n,subject));
  for(const plan of plans){
   assert.ok(plan.goal.length<=140,plan.id+' goal length '+plan.goal.length);
   assert.match(plan.goal,/复习|回顾/);
   for(const t of plan.tasks.filter(t=>t.kind==='learn'))assert.ok(t.goal.includes(chapter.nodes.find(n=>n.id===t.nodeId).steps[0]));
  }
 }
 const first=planner.build(physics.chapters[0],'physics',n=>A.questions(n,'physics'))[0];
 assert.match(first.goal,/声音来自振动/);assert.match(first.goal,/第 1–8 题/);
 assert.match(first.tasks.find(t=>t.kind==='recall').goal,/8 分且无核心错误/);
});

test('compact plans reduce every unit by at least a quarter while preserving instruction, hard work and legacy identity',()=>{
 for(const [subject,data] of [['math',math],['physics',physics]])for(const chapter of data.chapters){
  const compact=planner.build(chapter,subject,n=>A.questions(n,subject));
  const legacy=planner.build(chapter,subject,n=>A.questions(n,subject),{legacy:true});
  assert.ok(compact.length<=Math.ceil(legacy.length*.75),chapter.id+' fewer rounds');
  assert.ok(compact.every(p=>!legacy.some(old=>old.id===p.id)));
  const tasks=compact.flatMap(p=>p.tasks);
  for(const node of chapter.nodes){
   for(const kind of ['learn','recall'])assert.equal(tasks.filter(t=>t.nodeId===node.id&&t.kind===kind).length,1);
   for(const q of A.questions(node,subject).filter(q=>q.type==='solution')){
    const t=tasks.find(t=>t.kind==='practice'&&t.questionIds.includes(q.id));
    assert.equal(t.questionIds.length,1);assert.ok(t.minutes>=6);
   }
  }
 }
 assert.equal(planner.build(math.chapters[0],'math',n=>A.questions(n,'math'),{legacy:true}).length,33);
 assert.equal(planner.build(physics.chapters[0],'physics',n=>A.questions(n,'physics'),{legacy:true}).length,26);
});

test('more steps and harder questions produce greater planned work rather than a fixed count per node',()=>{
 const node={id:'test',title:'实验条件',steps:['比较条件'],example:'例子',practice:[]};
 const chapter={id:'physics-8a-99',title:'实验',nodes:[node],edges:[]};
 const questions=Array.from({length:10},(_,i)=>({id:'q'+i,type:i<8?'choice':'solution',level:i<6?'basic':i<8?'improved':i===8?'hard':'comprehensive'}));
 const simple=planner.build(chapter,'physics',()=>questions);
 const complex=planner.build({...chapter,nodes:[{...node,steps:Array.from({length:7},(_,i)=>'比较多个条件并说明因果关系'+i),example:'比较多个条件和实验数据。'.repeat(50)}]},'physics',()=>questions);
 assert.ok(complex.reduce((s,p)=>s+p.minutes,0)>simple.reduce((s,p)=>s+p.minutes,0));
 assert.ok(complex.length>=simple.length);
 for(const p of complex)for(const t of p.tasks.filter(t=>t.kind==='practice'&&t.questionIds.some(id=>id==='q8'||id==='q9')))assert.equal(t.questionIds.length,1);
});

test('a forward prerequisite is scheduled before its dependent and invalid inputs fail visibly',()=>{
 const a={id:'a',title:'后学',steps:['后学步骤']},b={id:'b',title:'先学',steps:['先学步骤']};
 const chapter={id:'math-8a-99',title:'顺序',nodes:[a,b],edges:[{from:'b',to:'a'}]};
 const qs=n=>Array.from({length:10},(_,i)=>({id:n.id+i,type:i<8?'choice':'solution',level:i<6?'basic':i<8?'improved':i===8?'hard':'comprehensive'}));
 const plans=planner.build(chapter,'math',qs);
 assert.equal(plans.flatMap(p=>p.tasks).find(t=>t.kind==='learn').nodeId,'b');
 assert.throws(()=>planner.build(chapter,'english',qs),/学科/);
 assert.throws(()=>planner.build(chapter,'math',()=>[]),/十题/);
 assert.throws(()=>planner.build({...chapter,edges:[...chapter.edges,{from:'a',to:'b'}]},'math',qs),/先修/);
});
