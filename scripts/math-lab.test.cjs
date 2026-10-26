const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../app/src/main/assets/web/app-design/math-lab-models.js');
const D=require('../app/src/main/assets/web/app-design/math-data.js');
const model=(id,s)=>{const e=M.experiments.find(e=>e.id===id);return M.evaluate(e,{...M.defaults(e),...s}).values;};
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('all eleven curriculum units and all in-unit topics have an experiment',()=>{
  assert.equal(new Set(M.experiments.map(e=>e.id)).size,M.experiments.length);
  for(const chapter of D.chapters){
    const labs=M.experiments.filter(e=>e.chapter===chapter.number);assert(labs.length>=1,chapter.id);
    for(const n of chapter.nodes)assert(labs.some(e=>e.nodes.includes(n.id)),n.id);
    for(const e of labs){assert(e.controls.length);assert(e.choices[e.answer]);for(const id of e.nodes)assert(chapter.nodes.some(n=>n.id===id),`${e.id}: ${id}`);}
  }
});
test('all controls remain finite at boundaries and across their allowed range',()=>{
  for(const e of M.experiments){
    for(const c of e.controls)for(const f of [0,.25,.5,.75,1]){
      const s=M.defaults(e);s[c.key]=Number((c.min+Math.round((c.max-c.min)*f/c.step)*c.step).toFixed(6));
      const r=M.evaluate(e,s);assert(!/NaN|Infinity|undefined/.test(r.svg),`${e.id}:${c.key}`);assert.equal(r.stats.length,3);assert(r.conclusion.length>10);
    }
  }
});
test('geometry preserves lengths, equal distances and the midpoint relationship',()=>{
  for(const height of [0,1,3,4]){const r=model('bisectors',{height});close(r.pa,r.pb);}
  for(const d of [.5,2,6]){const r=model('angle-bisector',{d});close(r.pe,r.pf);close(r.pe,d/2);}
  for(const shift of [-100,-20,0,100]){const r=model('parallelogram',{shift});assert.deepEqual(r.mid1,r.mid2);}
  assert(model('isosceles',{a:60}).equilateral);assert(!model('isosceles',{a:90}).equilateral);
  assert(!model('triangle-sides',{c:1}).valid);assert(!model('triangle-sides',{c:7}).valid);assert(model('triangle-sides',{c:5}).valid);
  close(model('triangle-angles',{a:50,b:60}).c,70);
});
test('Pythagorean calculations and converse respect the longest side',()=>{
  close(model('pythagoras',{a:3,b:4}).c,5);close(model('pythagoras',{a:3,b:4}).area,25);
  assert(model('converse',{c:5}).right);assert(!model('converse',{c:3}).right);
  close(model('ladder',{x:3}).height,4);close(model('ladder',{x:5}).height,0);
});
test('real numbers and coordinate transforms handle signs and decimal precision',()=>{
  close(model('roots',{a:2}).root,Math.SQRT2);close(model('cube',{x:-2}).cube,-8);
  assert.equal(model('rounding',{n:2.995,digits:2}).rounded,'3.00');
  assert.deepEqual(model('translation',{dx:-3,dy:2}),{x:-4,y:4});
  assert.deepEqual(model('reflection',{x:-2,y:3,axis:1}),{x:2,y:3});
  assert.match(model('coordinates',{x:0,y:2}).quadrant,/坐标轴/);
});
test('function intersection satisfies two equations and cost uses matching units',()=>{
  for(const b of [-4,0,2,4]){const r=model('intersection',{b});close(r.y,r.x+1);close(r.y,-r.x+b);}
  close(model('linear',{k:-2,b:3,x:2}).y,-1);
  close(model('linear-model',{price:2,base:6,count:4}).cost,14);
  assert.deepEqual(model('price',{a:10,b:14}),{a:20,b:17.5});
});
test('statistics and seeded replacement trials keep numerator and denominator consistent',()=>{
  assert.equal(model('charts',{a:0,b:0,c:0}).bFrequency,null);
  close(model('charts',{a:2,b:5,c:3}).bFrequency,.5);
  assert.equal(model('probability',{red:0,trials:500}).count,0);
  assert.equal(model('probability',{red:10,trials:500}).count,500);
  const a=model('probability',{red:3,trials:500,seed:7});
  assert.deepEqual(a,model('probability',{red:3,trials:500,seed:7}));close(a.frequency,a.count/500);assert(a.count>=0&&a.count<=500);
});
test('factorization and trapezoid invariants agree independently',()=>{
  for(const a of [1,3,5])for(const b of [1,2,4]){
    const common=model('common-factor',{a,b,c:2});close(common.sum,common.product);
    const perfect=model('perfect-square',{a,b});close(perfect.expanded,perfect.square);
    const diff=model('difference',{a:5,ratio:b/5});close(diff.difference,diff.product);
  }
  close(model('trapezoid',{top:3,height:4,shift:80}).area,20);
});
test('fraction restrictions survive cancellation and denominator clearing',()=>{
  assert.equal(model('fraction-domain',{x:2}).value,null);close(model('fraction-domain',{x:1}).value,0);
  assert.equal(model('fraction-property',{x:0}).value,null);close(model('fraction-property',{x:2}).value,3);
  assert(!model('fraction-equation',{a:1}).valid);assert(model('fraction-equation',{a:2}).valid);
  const sum=model('fraction-add',{x:3,a:-2,b:4});close(sum.value,sum.combined);
  close(model('fraction-multiply',{x:3,mode:1}).value,1.5);
});
test('radicals enforce domain, absolute value and like-term rules',()=>{
  assert.equal(model('radical-domain',{x:1}).value,null);assert.equal(model('radical-domain',{x:2}).value,0);
  close(model('radical-simplify',{a:-4}).value,4);
  for(const mode of [0,1]){const r=model('radical-product',{a:8,b:2,mode});close(r.left,r.right);}
  assert.equal(model('radical-add',{a:1,b:1}).coefficient,5);
});
