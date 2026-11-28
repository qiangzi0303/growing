import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { physicsLessonGuides } from '../src/physics-lesson-guides.js';
const require=createRequire(import.meta.url);
const data=require('../../app/src/main/assets/web/app-design/physics-data.js');
const soundModes={'phy-source':'source','phy-medium':'medium','phy-echo':'echo','phy-pitch':'pitch','phy-loudness':'loudness','phy-timbre':'timbre','phy-noise':'noise','phy-ultrasound':'hearing'};
async function factory(){
 const window={addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(await readFile(new URL('../../app/src/main/assets/web/app-design/student-physics-labs.js',import.meta.url),'utf8'),{window,URLSearchParams,Math,performance:{now:()=>0},document:{hidden:false,addEventListener(){},removeEventListener(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout,clearTimeout});
 return window.GrowingStudentPhysicsLabs;
}
test('every registered physics lesson has its own guide, matching model and valid boundary controls',async()=>{
 assert.equal(data.nodes.length,40);assert.deepEqual(Object.keys(physicsLessonGuides).sort(),data.nodes.map(n=>n.id).sort());
 const f=await factory();
 for(const node of data.nodes){
  assert.equal(physicsLessonGuides[node.id].length,3);assert(physicsLessonGuides[node.id].every(x=>typeof x==='string'&&x.length>8),node.id);
  const c=f.create({params:new URLSearchParams({kind:soundModes[node.id]?'sound':'explore',node:node.id})});
  assert.equal(soundModes[node.id]?c.model.mode:c.model.current.id,soundModes[node.id]||node.id);
  for(const control of c.model.controls){
   const values=control.type==='range'?[control.min,control.max]:control.type==='select'?control.options.map(o=>o[0]):[true,false];
   for(const value of values){
    c.actions.change(control.key,value);
    assert(c.model.svg.includes('<svg'),node.id);assert(!/NaN|Infinity/.test(c.model.svg),node.id+' '+control.key);
    assert(c.model.stats.length>0);assert(!/NaN|Infinity/.test(JSON.stringify(c.model.stats)),node.id+' stats');
   }
   c.actions.reset();
  }
  c.destroy();assert.throws(()=>c.actions.play(),/销毁/);
 }
});
test('sound models distinguish frequency, amplitude, vacuum and round-trip echo',async()=>{
 const f=await factory(),c=f.create({params:new URLSearchParams({kind:'sound',node:'phy-echo'})});
 c.actions.change('wall',68);assert.equal(c.inspect().delay,.4);
 c.actions.select('pitch');c.actions.change('frequency',880);assert.equal(c.inspect().frequency,880);
 c.actions.select('medium');c.actions.change('medium','vacuum');assert.equal(c.inspect().gain,0);
 c.actions.select('source');c.actions.hold();assert.equal(c.inspect().gain,0);c.destroy();
});
