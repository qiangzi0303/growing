import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),base='../../app/src/main/assets/web/app-design/';
const F=require(base+'practice-figures.js');
const questions=new Map();
for(const file of ['practice-math-upper.js','practice-math-lower.js','practice-physics.js'])for(const [topic,qs] of Object.entries(require(base+file)))for(const [i,q] of qs.entries())questions.set(topic+'-application-'+(i+4),{...q,id:topic+'-application-'+(i+4)});

test('every curated diagram belongs to an existing solution and produces accessible local SVG',()=>{
 assert.ok(F.ids.length>100);
 const dom=new JSDOM('<main></main>'),root=dom.window.document.querySelector('main');
 for(const id of F.ids){
  const q=questions.get(id);assert.ok(q,'Unknown diagram: '+id);assert.equal(q.type,'solution',id);
  const before=JSON.stringify(q);root.innerHTML=F.render(q);assert.equal(JSON.stringify(q),before);
  const svg=root.querySelector('svg');assert.ok(svg,id);assert.equal(svg.namespaceURI,'http://www.w3.org/2000/svg');assert.ok(svg.getAttribute('aria-label'));assert.ok(svg.querySelector('title'));
  assert.equal(root.querySelector('script,foreignObject,image,a'),null,id);assert.doesNotMatch(root.innerHTML,/NaN|Infinity|undefined|onload=|onerror=/,id);
 }
 assert.equal(F.render({id:F.ids[0],type:'choice'}),'');assert.equal(F.render({id:'not-a-question',type:'solution'}),'');
 dom.window.close();
});

test('all geometry solution pairs and optical relations are covered',()=>{
 const pairs=['tri-lines','tri-angles','tri-inequality','congruence','cong-sss','cong-sas','cong-asa','cong-hl','perp-bisector','angle-bisector','isosceles','equilateral','real-line','pythagoras','pyth-converse','pyth-apply','coordinates','quadrants','translation','reflection','parallelogram','parallel-judge','rectangle','rhombus','square','midline','trapezoid','iso-trapezoid','phy-echo','phy-straight','phy-mirror','phy-mirror-lab','phy-reflection','phy-diffuse','phy-refraction','phy-shallow','phy-lens','phy-focus','phy-imaging','phy-lens-lab','phy-applications','phy-eye','phy-instruments'];
 for(const topic of pairs)for(const n of [9,10])assert.ok(F.ids.includes(topic+'-application-'+n),topic+' #'+n);
});

test('median drawing respects the given 13, 10, 16 lengths and does not mark a right angle',()=>{
 const q=questions.get('tri-lines-application-9'),dom=new JSDOM(F.render(q)),svg=dom.window.document.querySelector('svg');
 const ns=svg.querySelector('path').getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number),[ax,ay,bx,by,cx,cy]=ns,dx=(bx+cx)/2,dy=(by+cy)/2;
 const ad=Math.hypot(ax-dx,ay-dy),ab=Math.hypot(ax-bx,ay-by),bc=Math.hypot(bx-cx,by-cy);
 assert.ok(Math.abs(ab/ad-13/10)<.001);assert.ok(Math.abs(bc/ad-16/10)<.001);assert.notEqual(ax,dx);
 // Only outline, median, and the two equal-segment ticks are drawn.
 assert.equal(svg.querySelectorAll('path').length,4);
 dom.window.close();
});
