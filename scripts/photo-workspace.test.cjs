const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const root=path.join(__dirname,'../app/src/main/assets/web/app-design');
test('photo workspaces retain independent uploads and historical strokes are read-only',async()=>{
 const dom=new JSDOM('',{url:'https://learn.test/handwriting.html',runScripts:'outside-only'}),w=dom.window;
 for(const file of ['curriculum.js','handwriting-core.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 w.GrowingHandwritingTasks={forUnit:()=>[{id:'task',title:'题目',prompt:'证明题'}]};w.GrowingHandwritingAI={details:()=>''};
 w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.Image=class{naturalWidth=800;naturalHeight=1100;set src(v){queueMicrotask(()=>this.onload?.());}async decode(){}};
 w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},drawImage(){}});
 w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,/9j/'+'A'.repeat(128);
 w.eval(fs.readFileSync(path.join(root,'student-handwriting.js'),'utf8'));
 const c=w.GrowingStudentHandwriting.create({storage:w.localStorage});
 try{
  await c.actions.photo({type:'image/jpeg',size:100});const first=c.snapshot().key,raw=w.localStorage.getItem(first);
  await c.actions.photo({type:'image/jpeg',size:100});assert.notEqual(c.snapshot().key,first);assert.equal(w.localStorage.getItem(first),raw);assert.equal(c.snapshot().records.length,2);
  c.actions.openRecord(first);assert.equal(c.snapshot().key,first);
  c.actions.pointerDown({});c.actions.undo();c.actions.addPage();assert.equal(w.localStorage.getItem(first),raw);
  const write=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(){throw Error('quota');};
  await c.actions.photo({type:'image/jpeg',size:100});assert.equal(c.snapshot().key,first);assert.equal(w.localStorage.getItem(first),raw);assert.match(c.snapshot().status,/照片未保存/);
  w.Storage.prototype.setItem=write;
 }finally{c.destroy();dom.window.close();}
});
