const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../app/src/main/assets/web/app-design/english-motion.js');
const samples=id=>Array.from({length:801},(_,i)=>M.pose(id,i/800));
const max=(poses,f)=>Math.max(...poses.map(f));
test('feet distinguish dragging, high steps, toe contact and unequal injured gait',()=>{
  const walk=samples('walk'),shuffle=samples('shuffle'),march=samples('march'),tiptoe=samples('tiptoe'),limp=samples('limp');
  assert(max(shuffle,g=>g.legs.left.lift)<2);
  assert(max(walk,g=>g.legs.left.lift)>15);
  assert(max(march,g=>g.hip.y-g.legs.left.knee.y)>20);
  for(const g of tiptoe)for(const l of Object.values(g.legs))if(l.contact){assert(l.heel.y<l.toe.y-20);assert.equal(l.toe.y,275);}
  assert(max(limp,g=>g.legs.left.lift)>25);
  assert(max(limp,g=>g.legs.right.lift)<4);
  assert(limp.filter(g=>g.legs.right.contact).length>limp.filter(g=>g.legs.left.contact).length);
});
test('crouching, hopping and running have visibly different body and contact states',()=>{
  const walk=samples('walk'),slink=samples('slink'),skip=samples('skip'),run=samples('run');
  assert(slink.every(g=>g.head.y>walk[0].head.y+50));
  assert(walk.every(g=>!g.airborne));
  assert(run.some(g=>g.airborne));
  assert(max(skip,g=>g.hop)>40);
  assert(skip.some(g=>g.legs.left.contact));assert(skip.some(g=>g.legs.right.contact));
  assert(M.pose('wander',.1).direction!==M.pose('wander',.6).direction);
  assert(M.pose('sprint',.6).distance>M.pose('run',.6).distance*1.5);
  const d=t=>M.pose('dash',t).distance;
  assert(d(.9)-d(.8)>(d(.2)-d(.1))*2);
});
test('rigid leg segments stay consistent across the entire movement cycle',()=>{
  const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  for(const id of Object.keys(M.profiles))for(const g of samples(id))for(const l of Object.values(g.legs)){
    assert(Math.abs(length(g.hip,l.knee)-51)<.01,id+' upper leg');
    assert(Math.abs(length(l.knee,l.ankle)-51)<.01,id+' lower leg');
  }
});
