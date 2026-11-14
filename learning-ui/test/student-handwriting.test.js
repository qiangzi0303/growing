import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const base=new URL('../../app/src/main/assets/web/app-design/',import.meta.url);
async function setup({query='',saved={},request,active=()=>{}}={}){
 const data=new Map(Object.entries(saved)),writes=[];
 const w={window:null,URLSearchParams,crypto:{randomUUID},console,setTimeout,clearTimeout,AbortController,Image:class{},history:{replaceState(){}},document:{hidden:false,addEventListener(){},removeEventListener(){}},addEventListener(){},removeEventListener(){}};w.window=w;vm.createContext(w);
 for(const f of ['curriculum.js','handwriting-core.js','fraction-paper-tasks.js','handwriting-tasks.js','practice-math-upper.js','practice-math-lower.js','practice-physics.js','application-practice.js','student-handwriting.js'])vm.runInContext(await readFile(new URL(f,base),'utf8'),w);
 w.GrowingHandwriting.draw=()=>{};
 w.GrowingHandwritingAI={pageImage:async()=> 'actual-page-image',request:request||(async()=>({score:100,parts:[20,30,30,20],feedback:'正确',needsReview:false})),details:()=>''};
 const storage={getItem:key=>data.get(key)??null,setItem(key,value){writes.push(key);data.set(key,value);}};
 const controller=w.GrowingStudentHandwriting.create({params:new URLSearchParams('subject=math&unit=math-8a-01&'+query),storage,active});
 return {w,data,writes,controller};
}
const key='growing-handwriting-v1:12345678-1234-1234-1234-123456789abc';

test('application writing returns to the exact question with its unchanged prompt',async()=>{
 const id='perp-bisector-application-9',s=await setup({query:'practice='+id});
 const state=s.controller.snapshot(),task=s.w.GrowingApplicationPractice.tasks('math','math-8a-01').find(t=>t.id===id);
 assert.equal(state.prompt,task.prompt);assert.equal(state.backHref,'math-course.html?chapter=math-8a-01&node=perp-bisector&practice=1#question-'+id);
 s.controller.destroy();
});
test('existing original restores without writes and corrupt originals remain protected',async()=>{
 const empty=await setup();const core=empty.w.GrowingHandwriting;empty.controller.destroy();const doc=core.create('math','math-8a-01','existing original');doc.pages[0].push({tool:'pen',width:4,points:[[10,20,.4]]});
 const s=await setup({query:'id='+key.split(':')[1],saved:{[key]:JSON.stringify(doc)}});
 assert.equal(s.controller.snapshot().prompt,'existing original');assert.equal(s.writes.length,0);s.controller.destroy();
 const broken=await setup({query:'id='+key.split(':')[1],saved:{[key]:'invalid'}});assert.equal(broken.controller.snapshot().blocked,true);broken.controller.actions.setPrompt('must not overwrite');assert.equal(broken.data.get(key),'invalid');assert.equal(broken.writes.length,0);broken.controller.destroy();
});
test('historical multi-page originals preserve pressure and remain read-only',async()=>{
 const initial=await setup(),doc=initial.w.GrowingHandwriting.create('math','math-8a-01','historical question');initial.controller.destroy();
 doc.pages=[[{tool:'pen',width:4,points:[[40,50,.8],[60,50,.8]]}],[{tool:'pen',width:2,points:[[20,30,.4]]}]];
 const raw=JSON.stringify(doc),s=await setup({query:'id='+key.split(':')[1],saved:{[key]:raw}}),c=s.controller;
 const canvas={getBoundingClientRect:()=>({left:0,top:0,width:400,height:550}),setPointerCapture(){}};c.actions.attachCanvas(canvas);
 const event={pointerId:1,pointerType:'pen',button:0,clientX:20,clientY:25,pressure:.8,preventDefault(){}};
 c.actions.pointerDown(event);c.actions.pointerMove({...event,clientX:30});c.actions.pointerEnd(event);
 c.actions.undo();c.actions.redo();c.actions.addPage();assert.equal(c.snapshot().pageCount,2);c.actions.turn(1);assert.equal(c.snapshot().page,1);c.actions.turn(0);assert.equal(c.snapshot().page,0);
 assert.equal(s.data.get(key),raw);assert.equal(s.writes.length,0);assert.ok(s.w.GrowingHandwriting.validate(JSON.parse(s.data.get(key))));c.destroy();
});
test('save failure retains the visible draft and prevents task switching',async()=>{
 const s=await setup(),c=s.controller,original=c.snapshot().key;
 s.w.GrowingHandwriting.validate=()=>false;c.actions.setPrompt('unsaved question');c.actions.chooseTask('custom');
 assert.equal(c.snapshot().key,original);assert.equal(c.snapshot().prompt,'unsaved question');assert.match(c.snapshot().saveStatus,/尚未保存/);c.destroy();
});
test('leaving a session aborts grading and cannot save a late AI response',async()=>{
 const initial=await setup(),doc=initial.w.GrowingHandwriting.create('math','math-8a-01','complete question');initial.controller.destroy();doc.pages[0].push({tool:'pen',width:4,points:[[5,5,.5]]});
 let finish;const s=await setup({query:'id='+key.split(':')[1],saved:{[key]:JSON.stringify(doc)},request:()=>new Promise(r=>finish=r)}),c=s.controller;
 const job=c.actions.grade();await new Promise(r=>setTimeout(r,0));c.destroy();const count=s.writes.length;
 finish({score:100,parts:[20,30,30,20],feedback:'late',needsReview:false});await job;assert.equal(s.writes.length,count);assert.equal(JSON.parse(s.data.get(c.snapshot().key)).grades.length,0);
});
test('invalid application task displays an error and creates no unrelated original',async()=>{
 const s=await setup({query:'practice=unknown'});assert.equal(s.controller.snapshot().kind,'error');assert.equal(s.writes.length,0);s.controller.destroy();
});
