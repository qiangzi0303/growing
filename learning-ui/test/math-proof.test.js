import test from 'node:test';
import assert from 'node:assert/strict';
import {proofState,proofDefaults} from '../src/math-proof-model.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const area=p=>Math.abs(p.reduce((sum,[x,y],i)=>{const q=p[(i+1)%p.length];return sum+x*q[1]-y*q[0];},0)/2);
const lengths=p=>p.map(([x,y],i)=>Math.hypot(x-p[(i+1)%p.length][0],y-p[(i+1)%p.length][1]));
function inside(poly,x,y){
 const crosses=poly.map(([px,py],i)=>{const q=poly[(i+1)%poly.length];return (q[0]-px)*(y-py)-(q[1]-py)*(x-px);});
 if(crosses.some(v=>Math.abs(v)<1e-9))return null;
 return crosses.every(v=>v>0)||crosses.every(v=>v<0);
}
function tiled(polys,x,y,w,h){
 for(let i=0;i<25;i++)for(let j=0;j<25;j++){
  const hits=polys.map(p=>inside(p,x+w*(i+.371)/25,y+h*(j+.613)/25));
  if(hits.includes(null))continue;
  assert.equal(hits.filter(Boolean).length,1,'tiles must cover every sampled interior point exactly once');
 }
}
test('square difference preserves rigid pieces at every animation step and tiles the final rectangle',()=>{
 for(const a of [3,4.5,6])for(const ratio of [.2,.5,.8]){
  const start=proofState('factor-difference',{a,ratio},0),b=a*ratio;
  close(area(start.cut),b*b);
  for(let i=0;i<=100;i++){
   const m=proofState('factor-difference',{a,ratio},i/100);
   close(area(m.base)+area(m.piece),a*a-b*b);
   for(const [x,y] of [...m.base,...m.piece]){assert.ok(60+x*m.scale>=0&&60+x*m.scale<=820);assert.ok(120+y*m.scale>=0&&120+y*m.scale<=425);}
   [m.base,m.piece].forEach((poly,k)=>lengths(poly).forEach((n,j)=>close(n,lengths(start.source[k])[j])));
  }
  const end=proofState('factor-difference',{a,ratio},1);
  tiled([end.base,end.piece],end.offset,b,a+b,a-b);
  close(area(end.frame),a*a-b*b);
 }
});
test('Pythagorean layouts use four congruent right triangles and genuinely square residual areas',()=>{
 for(const a of [1,3,5])for(const b of [1,4,5]){
  const m=proofState('pythagoras',{a,b},1),L=a+b;
  for(const poly of [...m.source,...m.pieces]){
   close(area(poly),a*b/2);
   const edges=lengths(poly).sort((x,y)=>x-y),expected=[a,b,Math.hypot(a,b)].sort((x,y)=>x-y);
   edges.forEach((x,i)=>close(x,expected[i]));
  }
  lengths(m.center).forEach(side=>close(side,Math.hypot(a,b)));
  m.center.forEach((p,i)=>{const prev=m.center[(i+3)%4],next=m.center[(i+1)%4];close((prev[0]-p[0])*(next[0]-p[0])+(prev[1]-p[1])*(next[1]-p[1]),0);});
  tiled([...m.source,m.center],0,0,L,L);
  tiled([...m.pieces,...m.squares],m.offset,0,L,L);
  close(area(m.center),area(m.squares[0])+area(m.squares[1]));
  for(const p of [.5,.55,.6,.65,.7,.75])proofState('pythagoras',{a,b},p).pieces.forEach(poly=>close(area(poly),a*b/2));
 }
});
test('seeking is deterministic, bounded, and does not mutate parameters',()=>{
 for(const id of ['pythagoras','factor-difference']){
  const values=proofDefaults(id),before=structuredClone(values);
  for(const p of [0,.249,.25,.5,.75,1]){
   assert.equal(proofState(id,values,p).stage,Math.min(3,Math.floor(p*4)));
   assert.deepEqual(proofState(id,values,p),proofState(id,values,p));
  }
  assert.deepEqual(values,before);
  assert.deepEqual(proofState(id,values,-1),proofState(id,values,0));
  assert.throws(()=>proofState(id,{a:0},0));
  assert.throws(()=>proofState(id,values,NaN));
 }
});
