const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'../app/src/main/assets/web/app-design');
function setup(subject='math',initial={}){
 const records=new Map(Object.entries(initial)),w={window:null,URLSearchParams};w.window=w;vm.createContext(w);
 w.GrowingDiagnosis=require(path.join(base,'diagnosis-engine.js'));
 w.GrowingKnowledge=require(path.join(base,subject==='math'?'math-data.js':'physics-data.js'));
 w.GrowingPanoramaLayout=require(path.join(base,'panorama-layout.js'));
 vm.runInContext(fs.readFileSync(path.join(base,'student-knowledge.js'),'utf8'),w);
 let valid=true;const store={getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v),key:i=>[...records.keys()][i]??null,get length(){return records.size;}};
 const chapter=w.GrowingKnowledge.chapters[0];const c=w.GrowingStudentKnowledge.create({subject,params:new URLSearchParams({chapter:chapter.id}),storage:store,active(){if(!valid)throw Error('expired');}});
 return {w,c,records,chapter,expire(){valid=false;}};
}
test('complete two-question assessment preserves exact engine evidence and original keys',()=>{
 const {w,c,records,chapter}=setup();c.actions.prepare(chapter.nodes[0].id);c.actions.start();let count=0;
 while(c.model.screen==='question'){const q=c.model.question;assert.equal(c.model.report,null);c.actions.answer(q.answer);count++;}
 assert.equal(count,2);assert.equal(c.model.screen,'report');assert.ok(c.model.report.credit);const key='growing-diagnosis-year8-v1:'+chapter.id;
 const saved=JSON.parse(records.get(key));assert.equal(saved.protocol,'complete-assessment-v1');assert.equal(saved.answers.length,2);
 assert.ok(records.has('growing-diagnosis-v1:'+chapter.id));assert.equal(w.GrowingDiagnosis.assessmentCredit(w.GrowingDiagnosis.graph(w.GrowingKnowledge),saved)[chapter.nodes[0].id],1);
 c.actions.undo();assert.equal(c.model.screen,'question');assert.equal(c.model.report,null);c.actions.answer(null);assert.equal(c.model.screen,'report');c.actions.retry();assert.equal(c.model.asked,0);
});
test('physics and invalid routes retain separate keys and safe route errors',()=>{
 const {c,chapter,records}=setup('physics');c.actions.start();assert.ok(records.has('growing-diagnosis-physics-v1:'+chapter.id));assert.equal(records.has('growing-diagnosis-year8-v1:'+chapter.id),false);
 const {w}=setup();const invalid=w.GrowingStudentKnowledge.create({params:new URLSearchParams('chapter=missing'),storage:{},active(){}});assert.equal(invalid.model.kind,'error');
});
test('corrupt originals remain untouched until explicit new assessment; stale/destroyed actions cannot write',()=>{
 const first=setup(),id=first.chapter.id,key='growing-diagnosis-year8-v1:'+id;first.c.destroy();
 const s=setup('math',{[key]:'broken'});assert.ok(s.c.model.notice);assert.equal(s.records.get(key),'broken');s.expire();assert.throws(()=>s.c.actions.start(),/expired/);assert.equal(s.records.get(key),'broken');
 const t=setup();t.c.destroy();assert.throws(()=>t.c.actions.start(),/销毁/);assert.equal(t.records.size,0);
});
test('graph scope, panorama range/search, chapter navigation and setup retain real targets',()=>{
 const {c,chapter}=setup();c.actions.mode('panorama');assert.ok(c.model.panorama.nodes.length);c.actions.range('year');assert.ok(c.model.panorama.nodes.length>=chapter.nodes.length);c.actions.search('');assert.match(c.model.searchNote,/请输入/);c.actions.locate(chapter.nodes[0].id);assert.equal(c.model.selected.id,chapter.nodes[0].id);c.actions.prepare(chapter.nodes[0].id);assert.equal(c.model.screen,'setup');c.actions.start();c.actions.newTarget();assert.equal(c.model.screen,'setup');c.actions.resume();assert.equal(c.model.screen,'question');
});
test('saved run resumes with exact question and best completed credit survives a weaker retest',()=>{
 const first=setup();first.c.actions.prepare(first.chapter.nodes[0].id);first.c.actions.start();first.c.actions.answer(first.c.model.question.answer);const next=first.c.model.question.id;
 const restored=setup('math',Object.fromEntries(first.records));assert.equal(restored.c.model.question.id,next);restored.c.actions.answer(restored.c.model.question.answer);const result='growing-diagnosis-v1:'+restored.chapter.id,best=restored.records.get(result);
 restored.c.actions.retry();restored.c.actions.answer(null);restored.c.actions.answer(null);assert.equal(restored.records.get(result),best);assert.equal(restored.c.model.report.credit[restored.chapter.nodes[0].id],0);
 restored.c.actions.retry();assert.throws(()=>restored.c.actions.answer(999),/请选择/);assert.equal(restored.c.model.asked,0);
});
test('malformed ranking evidence is retained and a completed assessment reports the save failure',()=>{
 const s=setup(),key='growing-diagnosis-v1:'+s.chapter.id;s.records.set(key,'broken');s.c.actions.prepare(s.chapter.nodes[0].id);s.c.actions.start();s.c.actions.answer(null);s.c.actions.answer(null);assert.equal(s.records.get(key),'broken');assert.match(s.c.model.notice,/排行榜/);assert.equal(s.c.model.screen,'report');
});
test('fraction handwritten weakness overrides diagnosis display and never becomes course mastery',()=>{
 const {w}=setup();w.GrowingHandwriting={KEY:/^original:/,evidence:()=>[{nodeId:'add',score:45,feedback:'需复查',taskId:'paper'}],knowledgeStatus:()=> '薄弱'};w.GrowingFractionPaperTasks={tasks:[]};
 const original='original:one',records=new Map([[original,'{"drawing":"retained"}']]),storage={getItem:k=>records.get(k)??null,key:i=>[...records.keys()][i],get length(){return records.size;},setItem:(k,v)=>records.set(k,v)};
 const c=w.GrowingStudentKnowledge.create({params:new URLSearchParams('chapter=math-8b-10&node=add'),storage,active(){}});assert.equal(c.model.selected.status,'weak');assert.equal(c.model.handwritingStatus,'薄弱');assert.match(c.model.handwritingHref,/task=paper/);assert.equal(records.get(original),'{"drawing":"retained"}');assert.equal(c.model.report,null);
});
