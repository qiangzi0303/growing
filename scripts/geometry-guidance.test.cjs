const {test}=require('node:test');
const assert=require('node:assert/strict');
const base='../app/src/main/assets/web/app-design/';
const bank=require(base+'practice-math-upper.js');
const G=require(base+'geometry-guidance.js');
const question=(node,n)=>({...bank[node][n-4],id:node+'-application-'+n});
test('six exact existing questions have three progressive hints and explained steps',()=>{
  for(const node of ['cong-hl','perp-bisector','angle-bisector'])for(const n of [9,10]){
    const q=question(node,n),before=JSON.stringify(q),g=G.get(q);
    assert(g,q.id);assert.equal(g.id,q.id);assert.equal(g.hints.length,3);assert(g.steps.length>=2);
    for(const item of [g,...g.hints,...g.steps])assert.match(item.svg,/viewBox="0 0 360 260"/);
    for(const step of g.steps)for(const key of ['goal','noticed','reason'])assert(step.why[key].length>8);
    assert.equal(JSON.stringify(q),before);assert.equal(G.get({...q,prompt:q.prompt+' '}),null);
  }
  assert.equal(G.get(question('cong-hl',8)),null);assert.equal(G.get(null),null);
});
test('auxiliary constructions appear only after the relevant hint',()=>{
  const hl=G.get(question('cong-hl',9));
  assert.doesNotMatch(hl.svg,/data-part="AE"/);assert.match(hl.hints[2].svg,/data-part="AE"/);
  assert.doesNotMatch(hl.svg,/data-part="right-E"/);assert.match(hl.hints[2].svg,/data-part="right-E"/);
  assert.doesNotMatch(hl.hints[2].svg,/E=D/);assert.match(hl.steps.at(-1).text,/E.*D/);
  assert.doesNotMatch(hl.hints[2].svg,/>E\(D\)</);assert.doesNotMatch(hl.steps[1].svg,/>E\(D\)</);
  assert.match(hl.steps.at(-1).svg,/>E\(D\)<\/text>/);
  const pb=G.get(question('perp-bisector',10));
  assert.doesNotMatch(pb.svg,/data-part="PA"/);assert.match(pb.hints[2].svg,/data-part="PA"/);
  const ab=G.get(question('angle-bisector',10));
  assert.doesNotMatch(ab.svg,/data-part="DE"/);assert.match(ab.hints[2].svg,/data-part="DE"/);
  assert.match(ab.hints[2].svg,/data-part="right-E"/);assert.match(ab.hints[2].svg,/data-part="right-F"/);
});
test('angle-bisector area diagram is consistent with side lengths and altitude',()=>{
  const svg=G.get(question('angle-bisector',10)).hints[2].svg;
  const point=name=>{const m=svg.match(new RegExp('data-point="'+name+'" cx="([\\d.-]+)" cy="([\\d.-]+)"'));assert(m);return [+m[1],+m[2]];};
  const A=point('A'),B=point('B'),C=point('C'),D=point('D'),E=point('E'),F=point('F');
  const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
  assert(Math.abs(dist(A,B)/dist(A,C)-.8)<.0001);
  assert(Math.abs(dist(D,E)/dist(A,B)-3/8)<.0001);
  assert(Math.abs(dist(D,F)-dist(D,E))<.001);
  assert(Math.abs((B[0]-D[0])*(C[1]-D[1])-(B[1]-D[1])*(C[0]-D[0]))<.1);
});
test('perpendicular feet and incenter satisfy the claimed geometric relationships',()=>{
  const points=svg=>Object.fromEntries([...svg.matchAll(/data-point="([A-Z])" cx="([\d.-]+)" cy="([\d.-]+)"/g)].map(m=>[m[1],[+m[2],+m[3]]]));
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const perpendicular=(p,f,a,b)=>Math.abs((p[0]-f[0])*(b[0]-a[0])+(p[1]-f[1])*(b[1]-a[1]))<.4;
  const i=points(G.get(question('angle-bisector',9)).hints[2].svg);
  assert(perpendicular(i.I,i.E,i.A,i.B));assert(perpendicular(i.I,i.F,i.A,i.C));assert(perpendicular(i.I,i.G,i.B,i.C));
  assert(Math.abs(distance(i.I,i.E)-distance(i.I,i.F))<.001);
  assert(Math.abs(distance(i.I,i.E)-distance(i.I,i.G))<.001);
  const p=points(G.get(question('perp-bisector',10)).hints[2].svg);
  assert(perpendicular(p.P,p.M,p.A,p.B));assert(Math.abs(distance(p.P,p.A)-distance(p.P,p.B))<.002);
  assert(Math.abs(distance(p.A,p.B)/(distance(p.A,p.B)+distance(p.B,p.C)+distance(p.C,p.A))-8/30)<.0001);
  const h=points(G.get(question('cong-hl',10)).hints[2].svg);
  assert(perpendicular(h.P,h.E,h.O,h.A));assert(perpendicular(h.P,h.F,h.O,h.B));
  assert(Math.abs(distance(h.P,h.E)-distance(h.P,h.F))<.002);
});
