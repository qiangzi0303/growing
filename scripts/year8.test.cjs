const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../app/src/main/assets/web/app-design/math-data.js'),E=require('../app/src/main/assets/web/app-design/diagnosis-engine.js'),g=E.graph(D);

for(const [subject,data] of [['math',D],['physics',require('../app/src/main/assets/web/app-design/physics-data.js')]]){
  test(`${subject}: assessment always asks every target twice, with identical paths for right and wrong answers`,()=>{
    const graph=E.graph(data);
    for(const chapter of data.chapters){
      const paths=[];
      for(const correct of [true,false]){
        let session=E.createAssessment(graph,chapter.nodes.map(n=>n.id)),view;const path=[];
        while((view=E.inspect(graph,session)).next){
          assert.equal(E.assessmentCredit(graph,session),null);
          const q=view.next.question;path.push(q.id);
          session=E.restore(graph,JSON.stringify(E.answer(graph,session,q.id,correct?q.answer:null)));
        }
        assert.equal(path.length,chapter.nodes.length*2);assert.equal(view.limitReached,false);
        assert(Object.values(E.assessmentCredit(graph,session)).every(value=>value===(correct?1:0)));
        assert.equal(E.assessmentCredit(graph,{...session,closed:true}),null);
        assert.equal(E.assessmentCredit(graph,E.undo(graph,session)),null);
        paths.push(path);
      }
      assert.deepEqual(paths[0],paths[1]);
    }
  });
}

test('verified outline covers 11 chapters and all 43 textbook sections',()=>{
  assert.equal(D.chapters.length,11);
  assert.equal(D.chapters.reduce((s,c)=>s+c.sections.length,0),43);
  assert.deepEqual(D.chapters.map(c=>c.number),Array.from({length:11},(_,i)=>i+1));
  for(const c of D.chapters){
    assert(c.nodes.length);
    for(const section of c.sections)assert(c.nodes.some(n=>(n.sectionCode||n.section.split(' ')[0])===section),section);
    for(const n of c.nodes)assert.equal(n.chapter,c.id);
  }
  assert.equal(D.nodes.length,71);assert.equal(D.edges.length,98);assert.equal(D.questions.length,142);
});

test('new lessons have actionable examples and three complete practice questions',()=>{
  const lessons=D.chapters.filter(c=>c.number!==10).flatMap(c=>c.nodes);
  assert.equal(lessons.length,57);
  for(const n of lessons){
    for(const key of ['review','criterion','example','pitfall','recall','source'])assert(n[key]?.length>5,`${n.id}: ${key}`);
    assert(n.steps.length>=2);assert.equal(n.practice.length,3);
    for(const q of n.practice){
      assert(q.prompt&&q.explanation);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
      assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
    }
  }
});

test('cross-chapter prerequisites link algebra and geometry in the right direction',()=>{
  for(const [from,to] of [['factor-concept','factor'],['factor','reduce'],['factor-difference','reduce'],['square-root','pythagoras']]){
    assert(D.edges.some(e=>e.from===from&&e.to===to&&e.strength==='hard'),`${from}>${to}`);
    assert(g.order.indexOf(from)<g.order.indexOf(to));
  }
});

test('independently calculate representative numeric answer keys across both terms',()=>{
  const correct=(id,index)=>{const q=g.byId.get(id).practice[index];return q.options[q.answer];};
  for(const [id,index,expected] of [
    ['tri-angles',0,(180-50-60)+'°'],['tri-lines',0,String(14/2)],
    ['isosceles',0,((180-36)/2)+'°'],['equilateral',0,String(24/3)],
    ['square-root',1,String(Math.sqrt(25))],['cube-root',0,'−'+Math.cbrt(64)],
    ['root-estimate',2,String(Math.floor(Math.sqrt(50)))],['pythagoras',0,String(Math.hypot(5,12))],
    ['pyth-apply',0,Math.sqrt(13**2-5**2)+'m'],['coordinates',0,String(Math.abs(2))],
    ['line-coefficients',2,String((7-1)/2)],['line-model',1,String(2*4+6)],
    ['charts',2,(360*.25)+'°'],['frequency',0,String(20/80)],['frequency',2,String(60*.3)],
    ['histogram',2,String(4+9+7)],['frequency-prob',2,String(203/1000)],
    ['parallelogram',0,(180-70)+'°'],['rhombus',0,String(10*12/2)],
    ['rhombus',2,String(Math.hypot(6/2,8/2))],['midline',0,String(6*2)],
    ['trapezoid',0,String((3+7)*4/2)],['radical-simplify',1,String(Math.abs(-4))],
    ['radical-multiply',0,String(Math.sqrt(8*2))]
  ])assert.equal(correct(id,index),expected,`${id} question ${index+1}`);
});

for(const c of D.chapters){
  test(`${c.title}: correct answers screen exactly this chapter without assuming prerequisite mastery`,()=>{
    let s=E.create(g,c.nodes.map(n=>n.id),32),state;
    while((state=E.inspect(g,s)).next){const q=state.next.question;s=E.answer(g,s,q.id,q.answer);}
    state=E.inspect(g,s);assert.equal(state.asked.length,c.nodes.length);
    for(const n of c.nodes)assert.equal(state.states[n.id],'screened');
    for(const id of state.order.filter(id=>!s.targets.includes(id)))assert.equal(state.states[id],undefined);
    assert.equal(state.path.length,0);
  });
  test(`${c.title}: repeated uncertainty traces prerequisites, respects limits and can resume`,()=>{
    let s=E.create(g,c.nodes.map(n=>n.id),32),state;
    while((state=E.inspect(g,s)).next){s=E.answer(g,s,state.next.question.id,null);s=E.restore(g,JSON.stringify(s));}
    state=E.inspect(g,s);assert(state.asked.length<=32);
    assert.equal(new Set(state.asked.map(a=>a.qid)).size,state.asked.length);
    for(const attempts of Object.values(state.attempts))assert(attempts.length<=2);
    for(const e of D.edges)if(state.path.includes(e.from)&&state.path.includes(e.to))assert(state.path.indexOf(e.from)<state.path.indexOf(e.to));
    assert(state.roots.length>0);
    const short=E.create(g,c.nodes.map(n=>n.id),1),q=E.inspect(g,short).next.question;
    const pending=E.inspect(g,E.answer(g,short,q.id,null));
    assert.equal(pending.states[q.topic],'pending');assert.equal(pending.roots.length,0);
  });
}
