const {test}=require('node:test'),assert=require('node:assert/strict');
const base='../app/src/main/assets/web/app-design/';
const P=require(base+'practice-progress.js');
const A=require(base+'application-practice.js'),C=require(base+'handwriting-core.js');
test('ten-question progress cannot be confused with historical three-question results',()=>{
  assert.deepEqual(P.result({bestQuiz:3}),{score:3,total:3,passed:true,legacy:true});
  assert.deepEqual(P.result({bestQuiz:3,practice10:{version:1,total:10,best:9}}),{score:9,total:10,passed:false,legacy:false});
  assert.equal(P.result({practice10:{version:1,total:10,best:10}}).passed,true);
  for(const best of [-1,11,NaN,'10'])assert.equal(P.result({bestQuiz:3,practice10:{version:1,total:10,best}}).passed,false);
});
for(const subject of ['math','physics'])test(subject+': every supported micro-lesson has six basic, two improved, one hard and one comprehensive question',()=>{
  const d=require(base+subject+'-data.js');
  for(const c of d.chapters.filter(c=>c.number!==10))for(const n of c.nodes){
    const qs=A.questions(n,subject);assert.equal(qs.length,10,n.id);
    assert.deepEqual(qs.map(q=>q.level),['basic','basic','basic','basic','basic','basic','improved','improved','hard','comprehensive']);
    assert.equal(new Set(qs.map(q=>q.id)).size,10);assert.equal(new Set(qs.map(q=>q.prompt)).size,10,n.id);
    for(const q of qs){assert(q.prompt&&q.explanation);if(q.type==='solution')assert.equal(typeof q.answer,'string');else {assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);}}
    for(const q of qs.filter(q=>q.type==='solution')){
      const task=A.tasks(subject,c.id).find(t=>t.id===q.id);assert(task);assert.equal(task.prompt,q.prompt);assert.deepEqual(task.nodes,[n.id]);
      const link=new URL(A.link(q,subject,c.id),'https://test/');assert.equal(link.searchParams.get('practice'),q.id);
    }
  }
});
test('unanswered and pending-review solutions earn no credit; choices do not default to option A',()=>{
  const qs=A.questions(require(base+'math-data.js').nodes.find(n=>n.id==='pythagoras'),'math');
  assert.equal(A.score(qs,{},{}),null);
  const choices=Object.fromEntries(qs.filter(q=>q.type!=='solution').map(q=>[q.id,q.answer]));
  assert.deepEqual(A.score(qs,choices,{}),{score:8,total:10,pending:2});
  const solutions=Object.fromEntries(qs.filter(q=>q.type==='solution').map(q=>[q.id,{status:'graded',passed:true}]));
  assert.deepEqual(A.score(qs,choices,solutions),{score:10,total:10,pending:0});
});
test('photo results require the exact question, student document, current revision and valid image assessment',()=>{
  const task=A.tasks('math','math-8a-03')[0],doc=C.create('math','math-8a-03',task.prompt);
  doc.pages=[[{tool:'pen',width:4,points:[[10,10,.5]]}]];
  doc.grades=[{revision:0,at:doc.updatedAt,score:100,parts:[20,30,30,20],feedback:'推导正确',needsReview:false,source:'handwriting',corrections:[],knowledge:[{nodeId:task.nodes[0],score:100,feedback:'本题通过'}]}];
  const key=C.PREFIX+'12345678-1234-1234-1234-123456789abc',values={[key]:JSON.stringify(doc)};
  const storage={get length(){return Object.keys(values).length},key:i=>Object.keys(values)[i],getItem:k=>values[k]};
  assert.equal(A.results(storage,'math','math-8a-03')[task.id].passed,true);
  doc.revision=1;values[key]=JSON.stringify(doc);assert.equal(A.results(storage,'math','math-8a-03')[task.id].status,'pending');
  doc.grades.push({revision:1,at:doc.updatedAt,score:null,parts:null,feedback:'照片需复核',needsReview:true,source:'handwriting',corrections:[]});values[key]=JSON.stringify(doc);assert.equal(A.results(storage,'math','math-8a-03')[task.id].passed,false);
  doc.prompt+='（另一题）';values[key]=JSON.stringify(doc);assert.equal(A.results(storage,'math','math-8a-03')[task.id],undefined);
  values[key]='broken';assert.doesNotThrow(()=>A.results(storage,'math','math-8a-03'));
  assert.throws(()=>A.results({...storage,getItem(){throw Error('Storage unavailable')}},'math','math-8a-03'),/Storage unavailable/);
});
