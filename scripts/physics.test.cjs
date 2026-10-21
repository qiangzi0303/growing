const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../app/src/main/assets/web/app-design/physics-data.js'),E=require('../app/src/main/assets/web/app-design/diagnosis-engine.js'),L=require('../app/src/main/assets/web/app-design/panorama-layout.js'),g=E.graph(D);
const answer=(id,i)=>{const q=g.byId.get('phy-'+id).practice[i];return q.options[q.answer];};
test('upper volume has five chapters, all 22 sections and original lessons',()=>{
  assert.deepEqual(D.chapters.map(c=>c.title),['声现象','光现象','光的折射 透镜','物态变化','物体的运动']);
  assert.deepEqual(D.chapters.map(c=>c.sections.length),[4,4,5,5,4]);
  assert.equal(D.nodes.length,40);assert.equal(D.questions.length,80);
  const math=require('../app/src/main/assets/web/app-design/math-data.js'),mathIDs=new Set(math.nodes.map(n=>n.id));
  for(const c of D.chapters){
    assert.equal(c.id,'physics-8'+(c.number<=5?'a':'b')+'-'+String(c.number).padStart(2,'0'));assert.equal(c.term,c.number<=5?'upper':'lower');
    for(const s of c.sections)assert(c.nodes.some(n=>n.section===s),'Missing section '+s);
    for(const n of c.nodes){
      assert.equal(n.chapter,c.id);assert(!mathIDs.has(n.id));assert.equal(n.steps.length,3);
      for(const k of ['review','criterion','recall','example','pitfall','source'])assert(n[k].length>10,n.id+': '+k);
      assert(n.source.includes(c.term==='upper'?'2025年7月第4版':'2012年11月第3版（2015年10月印刷）')&&n.source.includes('原创教学补充'));
      assert.equal(n.practice.length,3);
      for(const q of n.practice){assert(q.prompt&&q.explanation);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);}
    }
  }
  assert.equal(new Set(D.nodes.flatMap(n=>n.practice).map(q=>q.id)).size,120);
  assert.deepEqual([...new Set(D.nodes.flatMap(n=>n.practice).map(q=>q.answer))].sort(),[0,1,2,3]);
});
test('independent numerical checks for sound, optics, temperature and motion',()=>{
  for(const [id,i,value] of [
    ['echo',0,340*1/2+' m'],['echo',2,1500*.4/2+' m'],['pitch',2,10/2+' Hz'],
    ['mirror',0,2*2+' m'],['reflection',0,90-30+'°'],['focus',0,20/2+' cm'],
    ['cooling',0,80-63+' ℃'],['length',0,(5.35-2).toFixed(2)+' cm'],['length',1,1/1000+' m'],
    ['error',0,((3.41+3.43+3.42)/3).toFixed(2)+' cm'],['time',0,(32/20).toFixed(2)+' s'],
    ['time',1,.5*3600+' s'],['speed',0,72/3.6+' m/s'],['speed',1,50/10+' m/s'],
    ['speed',2,5*30+' m'],['uniform',0,6/2+' m/s'],['average',0,(20+60)/(10+30)+' m/s'],
    ['average',1,300+100+' m'],['average',2,12/(6/2+6/6)+' m/s']
  ])assert.equal(answer(id,i),value,id+' #'+i);
  assert.equal(answer('imaging',0),'倒立缩小实像');assert(30>2*10);
  assert.equal(answer('imaging',1),'正立放大虚像');assert(6<10);
  // Thin lens equation independently confirms u=15 cm, f=10 cm gives v=30 cm.
  assert(Math.abs(1/(1/10-1/15)-30)<1e-10);assert.equal(answer('imaging',2),'v>20 cm');
});
test('physical prerequisite graph is acyclic and cross-chapter review has no math IDs',()=>{
  for(const e of D.edges){assert(g.order.indexOf(e.from)<g.order.indexOf(e.to));assert(e.reason.length>10);}
  for(const [from,to] of [['reflection','refraction'],['mirror','shallow'],['spectrum','invisible']])assert(D.edges.some(e=>e.from==='phy-'+from&&e.to==='phy-'+to));
  for(const c of D.chapters){const ids=L.visible(g,c,'chapter',c.nodes[0].id),layout=L.layout(g,ids);assert(layout.nodes.length>=c.nodes.length);for(const n of layout.nodes)assert(Number.isFinite(n.x)&&Number.isFinite(n.y));}
  const all=L.visible(g,D.chapters[0],'year',D.nodes[0].id);assert.equal(all.size,40);
});
for(const c of D.chapters){
  test(c.title+': all-correct diagnostic covers only targets, archive restores',()=>{
    let s=E.create(g,c.nodes.map(n=>n.id),32),state;
    while((state=E.inspect(g,s)).next){const q=state.next.question;s=E.restore(g,JSON.stringify(E.answer(g,s,q.id,q.answer)));}
    state=E.inspect(g,s);assert.equal(state.asked.length,c.nodes.length);
    c.nodes.forEach(n=>assert.equal(state.states[n.id],'screened'));
    for(const id of state.order.filter(id=>!s.targets.includes(id)))assert.equal(state.states[id],undefined);
  });
  test(c.title+': uncertainty triggers basic retest and prerequisite tracing within budget',()=>{
    let s=E.create(g,c.nodes.map(n=>n.id),32),state;
    while((state=E.inspect(g,s)).next)s=E.answer(g,s,state.next.question.id,null);
    state=E.inspect(g,s);assert(state.asked.length<=32);assert(state.roots.length>0);
    assert.equal(new Set(state.asked.map(a=>a.qid)).size,state.asked.length);
    for(const list of Object.values(state.attempts))assert(list.length<=2);
    for(const e of D.edges)if(state.path.includes(e.from)&&state.path.includes(e.to))assert(state.path.indexOf(e.from)<state.path.indexOf(e.to));
  });
}
test('physics catalogue opens upper volume and defers lower volume',()=>{
  const scope={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/curriculum.js'),'utf8'),scope);
  const p=scope.window.GrowingCurriculum.physics;
  const book=p.terms.upper;assert.equal(book.verified,true);assert.equal(book.units.length,5);assert(book.edition.includes('2025年第4版'));
  book.units.forEach(u=>{const c=D.chapters.find(c=>c.id===u.id);assert.equal(c.term,'upper');assert.equal(u.title,c.title);assert.deepEqual(Array.from(u.outline),c.sections.map(s=>s.replace(/^\d+\.\d+ /,'')));assert.equal(u.entry,'physics-course.html?chapter='+u.id);});
  assert.equal(p.terms.lower.verified,false);assert.equal(p.terms.lower.units.length,0);
});
