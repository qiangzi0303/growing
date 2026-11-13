import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
async function fixture(kind='experiment'){
 const dom=new JSDOM('',{url:'https://learn.test/app-design/math-explore-lab.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 for(const file of ['knowledge-data.js','math-builder.js','math-upper.js','math-lower.js','math-data.js','math-lab-models.js','geometry-models-data.js','geometry-models-more.js','geometry-models-advanced.js','student-math-labs.js'])w.eval(await readFile(new URL('../../app/src/main/assets/web/app-design/'+file,import.meta.url),'utf8'));
 let valid=true;const controller=w.GrowingStudentMathLabs.create({params:new w.URLSearchParams({kind}),active:()=>{if(!valid)throw Error('expired');}});
 return {w,controller,expire(){valid=false;},close(){controller.destroy();w.close();}};
}
test('math experiments retain every model, slider bounds, quiz feedback and route',async()=>{
 const f=await fixture(),c=f.controller;try{
  assert.equal(c.model.chapters.length,11);
  for(const experiment of f.w.GrowingMathLab.experiments){c.actions.experiment(experiment.id);assert.equal(c.model.current.id,experiment.id);for(const control of experiment.controls){c.actions.adjust(control.key,control.max+1);assert.equal(c.model.values[control.key],control.max);}assert.doesNotMatch(c.model.svg,/NaN|undefined/);c.actions.answer(experiment.answer);assert.match(c.model.feedback,/预测正确/);assert.ok(c.model.route.includes(experiment.id));}
  c.actions.step();c.actions.reset();assert.equal(c.model.running,false);
 }finally{f.close();}
});
test('geometry retains all original models, source pages and step animations without storage writes',async()=>{
 const f=await fixture('geometry'),c=f.controller;try{
  assert.equal(c.model.models.length,41);
  for(const m of f.w.GrowingGeometryModels.models){c.actions.select(m.id);c.actions.progress(3);assert.equal(c.model.current.id,m.id);assert.equal(c.model.progress,3);assert.doesNotMatch(c.model.svg,/NaN|undefined/);assert.deepEqual(c.model.current.pages,m.pages);}
  c.actions.filter('search','never matches any model');assert.equal(c.model.filtered.length,0);assert.equal(f.w.localStorage.length,0);
  f.expire();assert.throws(()=>c.actions.select(1),/expired/);
 }finally{f.close();}
});
