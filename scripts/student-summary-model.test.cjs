const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const web=path.join(__dirname,'../app/src/main/assets/web/app-design');
function setup(records={}){
 const w={URLSearchParams,console,document:{body:{dataset:{}},documentElement:{dataset:{}}}};w.window=w;const context=vm.createContext(w);
 const load=async file=>{try{return vm.runInContext(fs.readFileSync(path.join(web,file.split('?')[0]),'utf8'),context);}catch(e){throw Error(file+': '+e.message);}};
 const storage={getItem:key=>records[key]??null,get length(){return Object.keys(records).length;},key:i=>Object.keys(records)[i]??null};
 return {w,load,storage,async create(query){await load('student-summary-model.js');return w.GrowingStudentSummary.create({params:new URLSearchParams(query),storage,load,active(){}});}};
}
test('all verified units retain real summary rows and records remain read-only',async()=>{
 const s=setup();await s.load('curriculum.js');
 for(const [subject,course] of Object.entries(s.w.GrowingCurriculum))for(const book of Object.values(course.terms))if(book.verified)for(const unit of book.units){const model=await s.create('subject='+subject+'&unit='+unit.id);assert.equal(model.kind,'summary',model.message);assert.ok(model.groups.find(g=>g.key==='untested').rows.length);assert.equal(model.groups.length,3);assert.equal(s.storage.length,0);}
});
test('legacy English records and unavailable storage are preserved explicitly',async()=>{
 const records={wordops_8A_unit3:'{"wordRuns":{},"records":[]}'},before=JSON.stringify(records),s=setup(records);
 const model=await s.create('subject=english&unit=english-8a-03');assert.equal(model.kind,'summary');assert.equal(JSON.stringify(records),before);
 s.storage.getItem=()=>{throw Error('denied');};const failed=await s.create('subject=english&unit=english-8a-03');assert.equal(failed.kind,'error');assert.match(failed.message,/无法读取/);
});
test('invalid routes never read stored records',async()=>{
 const s=setup();s.storage.getItem=()=>{throw Error('must not read');};const model=await s.create('subject=invalid&unit=unknown');assert.equal(model.kind,'error');assert.match(model.message,/尚未开放/);
});
test('session invalidation cannot return a stale summary',async()=>{
 const s=setup();await s.load('student-summary-model.js');let calls=0;await assert.rejects(s.w.GrowingStudentSummary.create({params:new URLSearchParams('subject=math&unit=math-8a-11'),storage:s.storage,load:s.load,active(){if(++calls>1)throw Error('session changed');}}),/session changed/);
});
test('diagnostic screening stays separate from mastered course knowledge',async()=>{
 const M=require(path.join(web,'math-data.js')),D=require(path.join(web,'diagnosis-engine.js')),chapter=M.chapters[0],graph=D.graph(M);
 let assessment=D.createAssessment(graph,chapter.nodes.map(n=>n.id));
 while(D.inspect(graph,assessment).next){const {question}=D.inspect(graph,assessment).next;assessment=D.answer(graph,assessment,question.id,question.answer);}
 const s=setup({['growing-diagnosis-year8-v1:'+chapter.id]:JSON.stringify(assessment)}),model=await s.create('subject=math&unit='+chapter.id);
 assert.equal(model.kind,'summary');assert.equal(model.groups.find(g=>g.key==='passed').rows.length,0);assert.equal(model.groups.find(g=>g.key==='screened').rows.length,chapter.nodes.length);
});
test('fraction handwritten originals are read through injected storage and remain intact',async()=>{
 const H=require(path.join(web,'handwriting-core.js')),records={},s=setup(records),originalKey=H.PREFIX+'12345678-1234-1234-1234-123456789abc';
 // Use the engine's exact key format and a corrupt original: do not repair or discard it.
 assert.ok(H.KEY.test(originalKey));records[originalKey]='{broken';const before=JSON.stringify(records);
 const model=await s.create('subject=math&unit=math-8b-10');assert.equal(model.kind,'summary');assert.ok(model.warnings.some(w=>/手写原稿无法读取/.test(w)));assert.equal(JSON.stringify(records),before);
});
