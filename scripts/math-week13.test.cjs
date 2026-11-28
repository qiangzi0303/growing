const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../app/src/main/assets/web/app-design/math-week13.js');
const A=require('../app/src/main/assets/web/app-design/application-practice.js');
const math=require('../app/src/main/assets/web/app-design/math-data.js');
test('all 34 originals have one real knowledge-point placement without changing ten-question sets',()=>{
 const rows=W.questions();assert.equal(rows.length,34);assert.equal(new Set(rows.map(q=>q.id)).size,34);
 let placed=0;
 for(const chapter of math.chapters)for(const node of chapter.nodes){const qs=W.questions(chapter.id,node.id);placed+=qs.length;assert.equal(A.questions(node,'math').length,10);for(const q of qs)assert.equal(q.practice.unitId,chapter.id);}
 assert.equal(placed,34);
});
test('source errors are kept separate from ambiguous revisions and unanswered originals',()=>{
 assert.deepEqual(W.questions('all','',true).map(q=>q.number),[21,34]);
 for(const n of [6,8,12,18,24,32,33])assert.equal(W.questions().find(q=>q.number===n).originalReview.wrong,false);
 assert.equal(W.questions().find(q=>q.number===20).originalReview.verdict,'correct');
 assert.equal(W.questions().find(q=>q.number===30).originalReview.verdict,'correct');
});
test('stable application links restore the exact prompt and exclude unresolved question 12 from grading',()=>{
 for(const q of W.questions()){
  const params=new URLSearchParams(W.writingHref(q).split('?')[1]);
  const task=A.tasks('math',params.get('unit')).find(t=>t.id===params.get('practice'));
  if(q.review){assert.equal(task,undefined);continue;}
  assert.ok(task);assert.equal(task.prompt,W.prompt(q));assert.deepEqual(task.nodes,[q.practice.nodeId]);assert.deepEqual(task.figures,q.figures);
  assert.ok(task.reference);assert.ok(!task.prompt.includes(q.originalReview.feedback));
 }
 assert.equal(W.tasks('physics-8a-01').length,0);
});
test('question 21 includes both valid ray configurations; 60 degrees fails the isosceles condition',()=>{
 const lengths=degrees=>{const r=1/Math.tan(degrees*Math.PI/180),P=[r*(r*r-1)/(r*r+1),2*r*r/(r*r+1)],D=[0,(r*r+1)/(3-r*r)],B=[0,1],distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);return [distance(P,B),distance(P,D),distance(B,D)];};
 for(const angle of [18,54]){const [a,,c]=lengths(angle);assert.ok(Math.abs(a-c)<1e-9);}
 const [a,b,c]=lengths(60);assert.ok(Math.abs(a-b)>1e-3&&Math.abs(a-c)>1e-3&&Math.abs(b-c)>1e-3);
});
