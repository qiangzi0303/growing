const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
test('exam model links reuse reviewed question identities and preserve association boundaries',()=>{
  const base=path.resolve(__dirname,'../app/src/main/assets/web/app-design'),context={window:{}};
  for(const file of ['math-geometry-links.js','math-midterm-20261029.js','geometry-models-data.js','geometry-models-more.js','geometry-models-advanced.js']){
    vm.runInNewContext(fs.readFileSync(path.join(base,file),'utf8'),context);
  }
  const links=context.window.GrowingGeometryLinks,models=context.window.GrowingGeometryModels.models;
  const q=context.window.GrowingMidterm.questions.find(q=>q.number===22);
  assert.ok(q.priority);assert.match(links.markup(q),/geometry-models.html#model-11/);
  assert.match(links.markup(q),/直接对应第（1）问/);
  for(const question of context.window.GrowingMidterm.questions){
    for(const [,id] of links.markup(question).matchAll(/data-geometry-model="(\d+)"/g))assert.ok(models.some(m=>m.id===Number(id)),id);
  }
  assert.equal(links.markup({id:'unknown'}),'');
  assert.equal(links.markup({id:'<script>'}),'');
});
