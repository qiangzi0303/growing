const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../platform-web/question-drawing.js');
const sample=()=>({version:'question-svg-v1',figures:[{width:380,height:280,title:'三角形题设图',elements:[{tag:'path',d:'M80 230 L180 30 L280 230 Z'},{tag:'text',x:180,y:22,text:'A'}]}],warnings:[]});
test('vector figures render as standalone SVG, with escaped titles and labels',()=>{
  const value=sample();value.figures[0].title='<img onerror=alert(1)>';value.figures[0].elements[1].text='</text><script>alert(1)</script>';
  const svg=D.render(value)[0];assert.match(svg,/<svg /);assert.match(svg,/viewBox="0 0 380 280"/);assert.match(svg,/&lt;script&gt;/);assert.doesNotMatch(svg,/<script|<img|<image|foreignObject/);
});
test('model output cannot introduce executable or external SVG content',()=>{
  for(const element of [{tag:'image',href:'https://evil.test'},{tag:'script',text:'alert(1)'},{tag:'constructor'}, {tag:'__proto__'}, {tag:'path',d:'M0 0',onclick:'alert(1)'},{tag:'path',d:'M0 0',stroke:'url(https://evil.test)'},{tag:'text',x:1,y:2,text:'A',style:'display:none'}]){
    const value=sample();value.figures[0].elements=[element];assert.equal(D.normalize(value),null);
  }
});
test('invalid, excessive and nonfinite geometry is rejected before rendering',()=>{
  for(const element of [{tag:'line',x1:NaN,y1:0,x2:1,y2:2},{tag:'circle',cx:0,cy:0,r:-1},{tag:'path',d:'M 0 0 L 1e999 2'},{tag:'polygon',points:[0,0,1]}]){
    const value=sample();value.figures[0].elements=[element];assert.equal(D.normalize(value),null);
  }
  const large=sample();large.figures[0].elements=Array(321).fill(large.figures[0].elements[0]);assert.equal(D.normalize(large),null);
});
test('multi-panel question keeps independent viewBoxes and visible printed labels',()=>{
  const value=sample();value.figures.push({width:420,height:160,title:'图②',elements:[{tag:'line',x1:10,y1:100,x2:390,y2:100,dashed:true},{tag:'text',x:200,y:80,text:'75°'}]});
  const result=D.render(value);assert.equal(result.length,2);assert.match(result[1],/viewBox="0 0 420 160"/);assert.match(result[1],/75°/);assert.match(result[1],/stroke-dasharray/);
});
test('angle labels shrink and clear the edges without changing the saved geometry or point labels',()=>{
  const value=sample(),f=value.figures[0];
  f.elements=[{tag:'path',d:'M95 35 L55 104.28 L215 104.28 Z M95 35 V104.28'},
    {tag:'text',x:95,y:26,text:'A',fontSize:16},
    {tag:'text',x:72,y:91,text:'60°',fontSize:16},
    {tag:'text',x:182,y:91,text:'30°',fontSize:16}];
  const saved=structuredClone(value),svg=D.render(value)[0];
  assert.deepEqual(value,saved);
  assert.match(svg,/d="M95 35 L55 104.28 L215 104.28 Z M95 35 V104.28"/);
  assert.match(svg,/font-size="16"[^>]* x="95" y="26">A<\/text>/);
  for(const label of ['60°','30°']){
    const text=svg.match(new RegExp('<text[^>]*>'+label+'<\\/text>'))[0];
    assert.match(text,/font-size="12"/);
    assert.doesNotMatch(text,/x="72" y="91"|x="182" y="91"/);
  }
  assert.equal(D.render(value)[0],svg);
});
test('small angle labels and ordinary lengths keep their authored positions and sizes',()=>{
  const value=sample();value.figures[0].elements=[
    {tag:'text',x:80,y:40,text:'75°',fontSize:10,anchor:'start'},
    {tag:'text',x:120,y:80,text:'2',fontSize:16},
    {tag:'text',x:200,y:80,text:'x°'}];
  const svg=D.render(value)[0];
  assert.match(svg,/font-size="10" text-anchor="start" x="80" y="40">75°/);
  assert.match(svg,/font-size="16"[^>]* x="120" y="80">2/);
  assert.match(svg,/font-size="12"[^>]* x="200" y="80">x°/);
});
