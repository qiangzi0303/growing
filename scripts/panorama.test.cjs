const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../app/src/main/assets/web/app-design/math-data.js'),g=require('../app/src/main/assets/web/app-design/diagnosis-engine.js').graph(D),L=require('../app/src/main/assets/web/app-design/panorama-layout.js');

test('year view contains all 71 nodes and 98 real relations exactly once',()=>{
  const result=L.layout(g,L.visible(g,D.chapters[0],'year'));
  assert.equal(result.nodes.length,71);assert.equal(result.edges.length,98);
  assert.equal(new Set(result.nodes.map(n=>n.id)).size,71);
  assert.deepEqual(result,L.layout(g,L.visible(g,D.chapters[0],'year')));
});
test('each chapter includes all its lessons and every recursive prerequisite',()=>{
  for(const c of D.chapters){
    const ids=L.visible(g,c),result=L.layout(g,ids);
    for(const n of c.nodes)assert(ids.has(n.id));
    for(const id of ids)for(const e of g.pre.get(id))assert(ids.has(e.from));
    assert.equal(result.edges.length,D.edges.filter(e=>ids.has(e.from)&&ids.has(e.to)).length);
  }
});
test('nodes fit the canvas without overlap and every arrow descends from prerequisite to successor',()=>{
  for(const range of ['chapter','year'])for(const c of D.chapters){
    const result=L.layout(g,L.visible(g,c,range)),nodes=new Map(result.nodes.map(n=>[n.id,n]));
    for(const n of result.nodes){
      assert(n.x>=0&&n.y>=0&&n.x+n.width<=result.width&&n.y+n.height<=result.height);
      for(const m of result.nodes)if(m.id!==n.id)assert(n.x+n.width<=m.x||m.x+m.width<=n.x||n.y+n.height<=m.y||m.y+m.height<=n.y,`${n.id} overlaps ${m.id}`);
    }
    for(const e of result.edges){
      const a=nodes.get(e.from),b=nodes.get(e.to);
      assert(a.rank<b.rank);assert.equal(e.points[0].y,a.y+a.height);assert.equal(e.points.at(-1).y,b.y);
    }
  }
});
test('long-edge routing never crosses the interior of any knowledge node',()=>{
  const result=L.layout(g,L.visible(g,D.chapters[0],'year'));
  assert(result.edges.some(e=>e.points.length>2));
  for(const e of result.edges)for(let i=1;i<e.points.length;i++){
    const a=e.points[i-1],b=e.points[i],mid=(a.y+b.y)/2;
    for(let step=0;step<=32;step++){
      const t=step/32,u=1-t,x=u*u*u*a.x+3*u*u*t*a.x+3*u*t*t*b.x+t*t*t*b.x,y=u*u*u*a.y+3*u*u*t*mid+3*u*t*t*mid+t*t*t*b.y;
      for(const n of result.nodes)assert(!(x>n.x+.001&&x<n.x+n.width-.001&&y>n.y+.001&&y<n.y+n.height-.001),`${e.from}>${e.to} crosses ${n.id}`);
    }
  }
});
