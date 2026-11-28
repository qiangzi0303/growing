import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {chapterStories,chapterNodeIds,chapterDefaults} from '../src/physics-chapter-stories.js';
import {chapterState,lensImage,refractedAngle} from '../src/physics-chapter-model.js';
const require=createRequire(import.meta.url);
const data=require('../../app/src/main/assets/web/app-design/physics-data.js');
const reading=require('../../app/src/main/assets/web/app-design/physics-story-readings.js');
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

test('32 new stories and reading entries cover exactly the nonthermal curriculum without changing question IDs',()=>{
 const nodes=data.nodes.filter(n=>n.chapter!=='physics-8a-04'),before=nodes.map(n=>[n.id,n.practice.map(q=>q.id)]);
 assert.deepEqual([...chapterNodeIds].sort(),nodes.map(n=>n.id).sort());
 assert.deepEqual(Object.keys(reading.readings).sort(),[...chapterNodeIds].sort());
 reading.enrich(data.nodes);
 for(const n of nodes){assert.equal(n.textbook.examPoints.length,3);assert.equal(n.textbook.mistakes.length,3);assert.ok(n.textbook.concepts.length>=3);assert.match(n.review,/易考点/);assert.match(n.review,/易错点/);}
 assert.deepEqual(before,nodes.map(n=>[n.id,n.practice.map(q=>q.id)]));
 const once=JSON.stringify(data.nodes);reading.enrich(data.nodes);assert.equal(JSON.stringify(data.nodes),once);
});

test('every scene is deterministic, changes across shots, and all control endpoints produce finite SVG geometry',()=>{
 for(const [id,story] of Object.entries(chapterStories)){
  const defaults=chapterDefaults(id),sets=[defaults];
  for(const c of story.controls)for(const value of c.options?c.options.map(o=>o[0]):[c.min,c.max])sets.push({...defaults,[c.key]:value});
  assert.equal(story.shots.length,4);
  for(const values of sets)for(const p of [0,.125,.25,.375,.5,.625,.75,.875,1]){
   const s=chapterState(id,values,p);assert.equal(s.stage,Math.min(3,Math.floor(p*4)));assert.equal(s.stats.length,4);assert.ok(s.elements.length>0,id);
   assert.deepEqual(s,chapterState(id,values,p));
   for(const e of s.elements)for(const [key,value] of Object.entries(e.attrs)){if(typeof value==='number')assert.ok(Number.isFinite(value),`${id}:${key}`);else assert.doesNotMatch(String(value),/NaN|Infinity/,id);}
  }
  const frames=[.125,.375,.625,.875].map(p=>JSON.stringify(chapterState(id,defaults,p).elements));
  assert.equal(new Set(frames).size,4,id+' must have four distinct visible stages');
 }
});

test('echo travels twice the distance and the speed depends on the selected medium',()=>{
 const air=chapterState('phy-echo',{distance:68},1),water=chapterState('phy-echo',{distance:68,medium:'water'},1);
 close(air.time,.4);close(air.travel,136);close(water.time,136/1500);close(water.travel,136);
 close(chapterState('phy-echo',{distance:68},.25).travel,68);
});
test('stopping a sound source leaves emitted waves in transit, while vacuum has no propagation',()=>{
 const source=chapterState('phy-source',{distance:340},.6);
 assert.equal(source.active,false);assert.ok(source.fronts.length>0);assert.ok(source.fronts.every(f=>f.emitted<=1));
 assert.equal(chapterState('phy-source',{distance:340},1).receiving,false);
 assert.equal(chapterState('phy-medium',{medium:'vacuum'},.8).transmits,false);
 for(const medium of ['air','water','solid'])assert.equal(chapterState('phy-medium',{medium},.8).transmits,true);
});
test('tuning fork bends opposite tines at fixed roots and stops deforming when held',()=>{
 const part=(s,name)=>s.elements.find(e=>e.attrs['data-source-part']===name).attrs.d;
 const a=chapterState('phy-source',{},.1),b=chapterState('phy-source',{},.1+1/(24*8*2));
 close(a.deflection,-b.deflection);assert.ok(Math.abs(a.deflection)>1);
 assert.equal(part(a,'base-handle'),part(b,'base-handle'));
 for(const s of [a,b]){
  const left=part(s,'left-tine').match(/^M110 200Q110 155 ([\d.]+) 100$/);
  const right=part(s,'right-tine').match(/^M160 200Q160 155 ([\d.]+) 100$/);
  assert.ok(left&&right);close(Number(left[1])-110,-(Number(right[1])-160));
 }
 const held=chapterState('phy-source',{},.5),later=chapterState('phy-source',{},.7);
 close(held.deflection,0);assert.equal(part(held,'left-tine'),part(later,'left-tine'));assert.ok(held.fronts.length>0);
});

test('frequency classification uses strict endpoints and a noise meter does not attenuate sound',()=>{
 assert.equal(chapterState('phy-ultrasound',{frequency:'10'},1).category,'次声');
 for(const frequency of ['20','20000'])assert.equal(chapterState('phy-ultrasound',{frequency},1).category,'通常可听范围');
 assert.equal(chapterState('phy-ultrasound',{frequency:'30000'},1).category,'超声');
 close(chapterState('phy-noise',{measure:'meter'},1).attenuation,1);
 assert.ok(chapterState('phy-noise',{measure:'barrier'},1).attenuation<1);
 close(chapterState('phy-loudness',{amplitude:4,distance:2},1).received,2);
});
test('each rough-surface ray obeys specular reflection about its own normal',()=>{
 const s=chapterState('phy-diffuse',{surface:'rough'},1);
 for(const {incoming,normal,outgoing} of s.rays){close(Math.hypot(...outgoing),1);const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];close(dot(incoming,normal),-dot(outgoing,normal));}
 close(chapterState('phy-reflection',{angle:0},1).outputAngle,0);
 close(chapterState('phy-reflection',{angle:65},1).outputAngle,65);
});
test('refraction is reciprocal and normal incidence has zero deflection',()=>{
 close(refractedAngle(0,'in'),0);close(refractedAngle(0,'out'),0);
 const r=refractedAngle(35,'in');assert.ok(r<35);close(refractedAngle(r,'out'),35);
 close(chapterState('phy-shallow',{depth:4},1).apparent,3);
});
test('lens focal boundaries, image size and screen alignment agree with geometry',()=>{
 assert.equal(lensImage(12,12).v,null);close(lensImage(24,12).v,24);close(lensImage(24,12).m,-1);
 close(lensImage(36,12).v,18);close(lensImage(18,12).v,36);close(lensImage(8,12).v,-24);close(lensImage(8,12).m,3);
 assert.equal(chapterState('phy-lens-lab',{u:36,screen:18},1).aligned,true);close(chapterState('phy-lens-lab',{u:36,screen:18},1).screenGap,0);
 assert.ok(chapterState('phy-lens-lab',{u:36,screen:20},1).screenGap>0);
 for(const [eye,correction] of [['near','concave'],['far','convex']])assert.equal(chapterState('phy-eye',{eye,correction},1).corrected,true);
 close(chapterState('phy-straight',{u:40,screen:20},1).m,-.5);
});
test('measurement uses endpoint subtraction and averaging retains shared bias',()=>{
 const a=chapterState('phy-length',{start:2,length:3.24},1);close(a.end-a.start,3.24);
 const clean=chapterState('phy-error',{count:6,bias:0},1),biased=chapterState('phy-error',{count:6,bias:.2},1);close(biased.mean-clean.mean,.2);
 close(chapterState('phy-time',{period:2,count:10},1).time,20);
});
test('motion preserves distance, stopped intervals, train length and reference transforms',()=>{
 close(chapterState('phy-speed',{speed:6},1).distance,30);
 close(chapterState('phy-uniform',{speed:5,motion:'stop'},.5).distance,10);
 close(chapterState('phy-uniform',{speed:5,motion:'stop'},1).distance,20);
 const bridge=chapterState('phy-average',{bridge:200,train:100,speed:20,wait:10},1);close(bridge.totalDistance,300);close(bridge.duration,25);close(bridge.average,12);close(bridge.head,300);
 close(chapterState('phy-reference',{frame:'train',speed:10},1).relativePosition,0);close(chapterState('phy-reference',{frame:'ground',speed:10},1).relativePosition,50);
});
