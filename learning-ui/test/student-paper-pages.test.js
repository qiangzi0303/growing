import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const file=new URL('../../platform-web/student-paper-pages.js',import.meta.url);

test('background photo jobs poll progress only and open server completion',async()=>{
 const calls=[];let polls=0;
 const job={id:'j1',processor:'photo-agent-v1',status:'recognizing',revision:1};
 const {w,controller:c}=await setup(async(path,options)=>{calls.push({path,options});if(path.includes('/progress?'))return ++polls===1?job:{...job,status:'complete',revision:2,paperId:'p1'};if(path.includes('/papers/p1'))return {id:'p1',subject:'math',questions:[],pages:[]};return [];});
 w.GrowingQuestionFigures={prepareImportStep:()=>{throw Error('client preparation forbidden');}};
 await c.actions.resume('j1');assert.equal(c.model.paper.id,'p1');
 assert.equal(calls.filter(v=>v.path.includes('/import-jobs/j1')&&!v.path.includes('/progress?')).length,0);c.destroy();
});

test('background failure waits for explicit retry and never permits legacy defer',async()=>{
 const calls=[];let retry=false;
 const job={id:'j1',processor:'photo-agent-v1',status:'recognizing',revision:1,canDefer:true};
 const {controller:c}=await setup(async(path,options)=>{calls.push({path,options});if(path.endsWith('/retry')){retry=true;return {...job,revision:3};}if(path.includes('/progress?'))return {...job,status:'failed',revision:retry?4:2,error:'图形无法确认'};return [];});
 // Clicking resume retries once; a subsequent failure remains visible.
 await c.actions.resume('j1');assert.equal(retry,true);assert.match(c.model.notice,/图形无法确认/);
 const retries=calls.filter(v=>v.path.endsWith('/retry'));assert.equal(retries.length,1);assert.deepEqual(JSON.parse(retries[0].options.body),{studentId:'s1',revision:2});
 await assert.rejects(c.actions.deferQuestion(),/等待/);assert.equal(calls.some(v=>v.path.endsWith('/step')),false);c.destroy();
});

test('closing background progress cancels polling without cancelling server job',async()=>{
 const calls=[];let release;
 const job={id:'j1',processor:'photo-agent-v1',status:'recognizing',revision:1};let polls=0;
 const {controller:c}=await setup(async(path,options)=>{calls.push({path,options});if(path.includes('/progress?'))return ++polls===1?job:new Promise(resolve=>release=resolve);return [];});
 const pending=c.actions.resume('j1');await new Promise(r=>setTimeout(r,0));c.actions.stopJob();release({...job,status:'complete',revision:2,paperId:'p1'});await pending;
 assert.match(c.model.notice,/后台继续/);assert.equal(c.model.paper,null);assert.equal(c.model.jobs[0].id,'j1');assert.equal(calls.some(v=>v.options?.method),false);c.destroy();
});

test('a newly uploaded background task reports failure without automatic retry',async()=>{
 const calls=[],job={id:'j1',processor:'photo-agent-v1',status:'planning',revision:1};
 const {w,controller:c}=await setup(async(path,options)=>{calls.push({path,options});if(path==='/question-bank/import-jobs'&&options)return job;if(path.includes('/progress?'))return {...job,status:'failed',revision:2,error:'OCR 暂不可用'};return [];});
 w.GrowingQuestionFigures={photo:async()=> 'prepared-photo',prepareImportStep:()=>{throw Error('client preparation forbidden');}};
 await c.actions.subject('math');await c.actions.addFiles([{}]);await c.actions.importPhotos();
 assert.match(c.model.notice,/OCR 暂不可用/);assert.equal(c.model.running,false);assert.equal(calls.some(v=>/\/(retry|step)$/.test(v.path)),false);c.destroy();
});

test('math paper uses current SVG even with an attached image and never falls back to source crops',async()=>{
 const questions=[
  {id:'valid',revision:1,hasDrawing:true,drawingRevision:1,hasFigureImage:true,figures:[{page:1}]},
  {id:'crop',revision:1,hasDrawing:false,figures:[{page:1}]},
  {id:'upload',revision:1,hasFigureImage:true},
  {id:'stale',revision:2,hasDrawing:true,drawingRevision:1,figures:[{page:1}]},
  {id:'invalid',revision:1,hasDrawing:true,drawingRevision:1},
  {id:'text',revision:1}
 ].map(q=>({...q,number:q.id,text:'题设'}));
 const {w,controller:c}=await setup(async path=>path.includes('/papers/p1')?{id:'p1',subject:'math',mode:'paper-draft',questions,pages:[{page:1,image:'source'}]}:path.includes('/figures?')?{drawingRevision:1,drawing:path.includes('/valid/')?'vector':null,image:'data:image/png;base64,AA=='}:[]);
 w.GrowingQuestionDrawing={render:d=>d?['<svg><path d="M0 0L10 10"/></svg>']:[]};
 await c.actions.open('p1');
 assert.equal(c.model.paper.questions[0].diagrams[0].type,'svg');
 for(const q of c.model.paper.questions.slice(1,5)){assert.equal(q.diagrams.length,0);assert.match(q.figureError,/SVG/);}
 assert.equal(c.model.paper.questions[5].figureError,undefined);c.destroy();
});
test('photo papers default to transcription, keep source pages for editing and open independent answers after confirmation',async()=>{
 const calls=[],paper={id:'p1',subject:'math',mode:'paper-draft',title:'可编辑卷',questions:[{id:'q1',paperId:'p1',text:'题干',number:'26',revision:1,questionType:'written',pages:[1]}],pages:[{page:1,image:'source'}]};
 const {w,controller:c}=await setup(async(path,options)=>{calls.push({path,options});if(path.includes('/papers/p1'))return structuredClone(paper);if(path==='/question-bank/import-jobs'&&options)return {id:'j1',status:'complete',paperId:'p1'};return [];});
 w.GrowingQuestionFigures={photo:async()=> 'prepared-photo'};
 await c.actions.subject('math');c.actions.newPaper();await c.actions.addFiles([{}]);await c.actions.importPhotos();
 assert.equal(JSON.parse(calls.find(v=>v.path==='/question-bank/import-jobs'&&v.options).options.body).mode,'paper');
 c.actions.edit(c.model.paper.questions[0]);assert.equal(c.model.edit.sourcePages[0].image,'source');
 await assert.rejects(c.actions.reviewQuestion(paper.questions[0]),/保存试卷/);
 let opened='',changed;
 w.GrowingStudentPhotoReview.create=options=>{changed=options.onChange;return {open:async q=>{opened=q.id;},close(){},dispose(){},snapshot:()=>({visible:false}),subscribe:()=>()=>{}};};
 paper.mode='paper';await c.actions.open('p1');await c.actions.reviewQuestion(paper.questions[0]);assert.equal(opened,'q1');
 paper.questions[0].grades=[{revision:1,result:{verdict:'partial'}}];await changed();assert.equal(c.model.paper.questions[0].filterWrong,true);assert.equal(c.model.view,'paper');
 c.actions.importMode('grade');assert.equal(c.model.importMode,'grade');c.destroy();
});
test('timed-out paper step waits for the lease and resumes saved completion without duplicate submission',async()=>{
 let steps=0,polls=0;
 const job={id:'j1',subject:'math',status:'recognizing',revision:1,next:{kind:'question'},sourcePages:[]};
 const {w,controller:c}=await setup(async(path)=>{
  if(path==='/question-bank/catalog')return [];
  if(path.includes('/papers/p1'))return {id:'p1',subject:'math',questions:[],units:[],pages:[]};
  if(path.endsWith('/step')){steps++;throw Object.assign(Error('timeout'),{code:'REQUEST_TIMEOUT'});}
  if(path.includes('/progress?')){polls++;return polls<=2?job:polls===3?{...job,processing:true}:{...job,status:'complete',revision:2,paperId:'p1'};}
  if(path.includes('/import-jobs/j1?'))return job;
  return [];
 });
 w.GrowingQuestionFigures={prepareImportStep:async()=>({})};
 await c.actions.resume('j1');
 assert.equal(steps,1);assert.equal(polls,4);assert.equal(c.model.paper.id,'p1');assert.equal(c.model.running,false);c.destroy();
});

test('manual deferral submits the failed revision once without recropping and opens the unconfirmed draft',async()=>{
 let steps=0;const bodies=[];
 const job={id:'j1',subject:'math',mode:'paper',status:'failed',revision:7,canDefer:true,error:'第17题：未确认配图',next:{kind:'question',number:'17',stage:'review'},sourcePages:[]};
 const {w,controller:c}=await setup(async(path,options)=>{
  if(path.includes('/papers/p1'))return {id:'p1',subject:'math',mode:'paper-draft',questions:[],pages:[]};
  if(path.endsWith('/step')){steps++;bodies.push(JSON.parse(options.body));return bodies.at(-1).defer?{...job,status:'complete',paperId:'p1',revision:8,deferredQuestions:1}:job;}
  if(path.includes('/import-jobs/j1'))return job;
  return [];
 });
 w.GrowingQuestionFigures={prepareImportStep:async()=>({})};
 await c.actions.resume('j1');assert.equal(c.model.progress.canDefer,true);assert.equal(c.model.running,false);
 w.GrowingQuestionFigures.prepareImportStep=async()=>{throw Error('must not crop or call vision when deferring');};
 await Promise.all([c.actions.deferQuestion(),c.actions.deferQuestion()]);
 assert.equal(steps,2);assert.deepEqual(bodies[1],{studentId:'s1',revision:7,workflow:'visual-v1',defer:true});
 assert.equal(c.model.paper.mode,'paper-draft');assert.equal(c.model.progress,null);c.destroy();
});

test('persistent step timeouts stop after bounded recovery and preserve resumable job',async()=>{
 let steps=0;
 const job={id:'j1',subject:'math',status:'recognizing',revision:1,next:{kind:'question'},sourcePages:[]};
 const {w,controller:c}=await setup(async(path)=>{
  if(path.endsWith('/step')){steps++;throw Object.assign(Error('连接云服务超时'),{code:'REQUEST_TIMEOUT'});}
  if(path.includes('/import-jobs/j1'))return job;
  return [];
 });
 w.GrowingQuestionFigures={prepareImportStep:async()=>({})};
 await c.actions.resume('j1');
 assert.equal(steps,4);assert.equal(c.model.progress.id,'j1');assert.equal(c.model.running,false);assert.match(c.model.notice,/进度与原稿保留/);c.destroy();
});
async function setup(api,user={id:'s1',role:'Student',username:'child'},context={}){const w={crypto:{randomUUID:()=> 'req1'},GrowingLegacy:{target:async(children,user)=>user.role==='Student'?user.id:children[0]?.id},GrowingStudentPhotoReview:{create:()=>({dispose(){},close(){},snapshot:()=>({}),subscribe:()=>()=>{},actions:{},open:async()=>{}})}};w.window=w;w.top=w;w.dispatchEvent=()=>true;const c=vm.createContext({window:w,URLSearchParams,crypto:w.crypto,localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,setInterval,clearInterval,AbortController,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}}});vm.runInContext(await readFile(new URL('../../platform-web/legacy-navigation.js',import.meta.url),'utf8'),c);vm.runInContext(await readFile(file,'utf8'),c);const controller=w.GrowingStudentPaperPages.create({api,user,context,kind:'papers',active(){}});await controller.ready;return {w,controller};}
test('student list captures own student id, subject and recovery jobs; switching cannot accept stale response',async()=>{const calls=[];const {controller:c}=await setup(async(path)=>{calls.push(path);if(path==='/question-bank/catalog')return [];return path.includes('import-jobs')?[{id:'j1',status:'failed',subject:'math'}]:[{id:'p1',subject:'math',title:'试卷'}];});assert.ok(calls.some(p=>p.includes('studentId=s1')));assert.equal(c.model.jobs.length,1);assert.equal(c.model.rows[0].id,'p1');assert.equal(c.model.userLabel,'child');c.destroy();await assert.rejects(()=>c.actions.subject('english'),/销毁/);});
test('classification confirmation sends original revision-safe routes and never writes coursework scores',async()=>{const calls=[];const paper={id:'p1',title:'旧卷',subject:'math',mode:'paper-draft',classification:{examType:'unit',termName:'上册',unitIds:['m1']},units:[{id:'m1',title:'第一章',termName:'上册',subject:'math'}],questions:[{id:'q11',number:'11',text:'题设',revision:7,reviewed:true}],pages:[],warnings:[]};const {controller:c}=await setup(async(path,options)=>{calls.push([path,options]);if(path==='/question-bank/catalog')return paper.units;if(path.startsWith('/question-bank/papers/p1'))return paper;return [];});await c.actions.open('p1');await c.actions.confirm({title:'核对卷',examType:'unit',termName:'上册',unitIds:['m1']});const body=JSON.parse(calls.find(([p,o])=>p.endsWith('/confirm')&&o)[1].body);assert.equal(body.studentId,'s1');assert.equal(body.title,'核对卷');assert.deepEqual(body.classification.unitIds,['m1']);c.destroy();});
test('real target authorization rejects cross-student and unrelated-parent context',async()=>{
 const api=async p=>p==='/question-bank/catalog'?[]:[];
 await assert.rejects(()=>setup(api,{id:'s1',role:'Student',username:'s1'},{studentId:'s2'}),/无权/);
 await assert.rejects(()=>setup(api,{id:'p1',role:'Parent',username:'parent'},{studentId:'s2'}),/关联/);
});
test('late previous-student list cannot replace selected student account rows',async()=>{
 let release,delay=false;const api=async p=>{if(p==='/question-bank/catalog')return [];if(p==='/parent/children')return [{id:'s1',username:'first'},{id:'s2',username:'second'}];if(p.includes('import-jobs'))return [];if(delay&&p.includes('studentId=s1'))return new Promise(r=>release=r);return [{id:p.includes('studentId=s2')?'p2':'p1',subject:'math',title:'卷'}];};
 const {controller:c}=await setup(api,{id:'parent',role:'Parent',username:'parent'});delay=true;const old=c.actions.load();await new Promise(r=>setTimeout(r,0));await c.actions.selectStudent('s2');release([{id:'old',subject:'math'}]);await old;assert.equal(c.model.studentId,'s2');assert.equal(c.model.rows[0].id,'p2');c.destroy();
});
test('wrong marking ignores old revisions and prefers paper-specific marks',async()=>{
 const questions=[{id:'old',number:'1',revision:2,text:'old',grades:[{revision:1,result:{verdict:'incorrect'}}]},{id:'fixed',number:'2',revision:2,text:'fixed',grades:[{revision:2,result:{verdict:'correct'}},{revision:1,result:{verdict:'incorrect'}}]},{id:'marked',number:'3',revision:2,text:'marked',paperWrong:true,grades:[]},{id:'partial',number:'4',revision:2,text:'partial',grades:[{revision:2,result:{verdict:'partial'}}]}];
 const {controller:c}=await setup(async p=>p==='/question-bank/catalog'?[]:p.includes('/papers/p1')?{id:'p1',subject:'math',questions,units:[],pages:[]}:[]);await c.actions.open('p1');assert.deepEqual(Array.from(c.model.paper.questions,q=>q.wrong),[false,false,true,true]);assert.deepEqual(Array.from(c.model.paper.questions,q=>q.filterWrong),[false,false,true,true]);c.destroy();
});
