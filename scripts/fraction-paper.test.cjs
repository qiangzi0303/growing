const {test}=require('node:test'),assert=require('node:assert/strict');
const web='../app/src/main/assets/web/app-design/';
const H=require(web+'handwriting-core.js'),P=require(web+'fraction-paper-tasks.js'),T=require(web+'handwriting-tasks.js'),S=require(web+'unit-summary-core.js'),M=require(web+'math-data.js');
const task=P.tasks.find(t=>t.nodes.includes('add')&&t.nodes.includes('sign'));
function make(scores=[40,70],at='2026-10-24T05:00:00.000Z'){
  const d=H.create('math','math-8b-10',task.prompt);
  d.pages=[[{tool:'pen',width:4,points:[[10,10,.5],[50,50,.7]]}]];
  d.recognition={revision:0,text:'手写计算过程',uncertain:[],confirmed:true};
  d.grades=[{revision:0,at,score:65,parts:[15,20,20,10],feedback:'需要复习符号与通分。',needsReview:false,knowledge:task.nodes.map((nodeId,i)=>({nodeId,score:i<scores.length?scores[i]:90,feedback:'第'+(i+1)+'步的判断依据'}))}];
  return d;
}
test('paper questions are source-traceable question-only tasks using actual fraction nodes',()=>{
  const ids=new Set(),prompts=new Set(),nodes=new Set(M.chapters.find(c=>c.id==='math-8b-10').nodes.map(n=>n.id));
  assert.equal(P.tasks.length,89);
  for(const t of P.tasks){
    assert.ok(!ids.has(t.id)&&!prompts.has(t.prompt));ids.add(t.id);prompts.add(t.prompt);
    assert.ok(t.prompt.length<=6000&&t.source.file.endsWith('.jpg')&&t.source.page&&t.source.number&&t.source.section);
    assert.ok(t.nodes.length&&t.nodes.every(id=>nodes.has(id)));
    assert.ok(!Object.hasOwn(t,'answer')&&!Object.hasOwn(t,'explanation'));
    assert.ok(H.validate(H.create('math','math-8b-10',t.prompt)));
  }
  assert.equal(T.forUnit('math','math-8b-10').filter(t=>t.source).length,89);
  assert.ok(T.forUnit('math','math-8a-01').every(t=>!t.source));
});
test('knowledge grades preserve legacy archives and reject malformed, duplicate or cross-unit nodes',()=>{
  assert.ok(H.validate(make()));
  const legacy=make();delete legacy.grades[0].knowledge;assert.ok(H.validate(legacy));assert.deepEqual(H.evidence([legacy],P.tasks),[]);
  for(const mutate of [d=>d.grades[0].knowledge[0].nodeId='injected',d=>d.grades[0].knowledge[0].score=101,d=>d.grades[0].knowledge[0].score='40',d=>d.grades[0].knowledge[0].feedback='',d=>d.grades[0].knowledge.push(d.grades[0].knowledge[0]),d=>d.unitId='math-8a-01',d=>d.grades[0].knowledge[0].apiKey='private']){
    const d=make();mutate(d);assert.equal(H.validate(d),false);
  }
  for(const values of [[],make().grades[0].knowledge.slice(0,1),[...make().grades[0].knowledge,{nodeId:'equation',score:10,feedback:'wrong task'}]])assert.equal(H.matchesKnowledge({...make().grades[0],knowledge:values},task),false);
});
test('only current confirmed written work with complete trusted task metadata affects nodes',()=>{
  for(const mutate of [d=>H.change(d),d=>d.recognition.confirmed=false,d=>d.pages=[[]],d=>d.prompt+=' altered',d=>d.grades[0].knowledge.pop(),d=>{d.grades[0]={revision:0,at:d.updatedAt,score:null,parts:null,feedback:'图片不清楚',needsReview:true};}]){
    const d=make();mutate(d);assert.deepEqual(H.evidence([d],P.tasks),[]);
  }
  const d=make(),before=JSON.stringify(d),e=H.evidence([d],P.tasks);assert.equal(e.length,task.nodes.length);assert.equal(JSON.stringify(d),before);
});
test('scores label each node independently; latest repair clears earlier handwritten weaknesses without awarding course mastery',()=>{
  const d=make(),base={rows:task.nodes.map(id=>({id,title:id,status:'untested',detail:'未测'})),warnings:[]};
  let out=S.withHandwriting(base,H.evidence([d],P.tasks));assert.equal(out.rows[0].status,'weak');assert.equal(out.rows[1].status,'shaky');assert.match(out.rows[0].detail,/40\/100/);
  const repaired=make([95,90],'2026-10-24T06:00:00.000Z');
  out=S.withHandwriting(base,H.evidence([repaired,d],P.tasks));assert.ok(out.rows.every(r=>r.status==='untested'&&r.detail.includes('仅本题通过')));
  H.change(repaired);out=S.withHandwriting(base,H.evidence([d,repaired],P.tasks));assert.equal(out.rows[0].status,'weak');
  const unassessed=make([null,79],'2026-10-24T07:00:00.000Z');out=S.withHandwriting(base,H.evidence([unassessed,d],P.tasks));assert.equal(out.rows[0].status,'weak');assert.equal(out.rows[1].status,'shaky');
  const reviewed=make();reviewed.grades.push({revision:0,at:'2026-10-24T08:00:00.000Z',needsReview:true,score:null,parts:null,feedback:'请复核'});
  assert.equal(H.evidence([reviewed],P.tasks).find(k=>k.nodeId===task.nodes[0]).score,40);
  assert.deepEqual([59,60,79,80,null].map(H.knowledgeStatus),['薄弱','不稳','不稳','本题通过','未判定']);
});
