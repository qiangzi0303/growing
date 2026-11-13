import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const file=new URL('../../platform-web/student-paper-pages.js',import.meta.url);
test('timed-out paper step waits for the lease and resumes saved completion without duplicate submission',async()=>{
 let steps=0,polls=0;
 const job={id:'j1',subject:'math',status:'recognizing',revision:1,next:{kind:'question'},sourcePages:[]};
 const {w,controller:c}=await setup(async(path)=>{
  if(path==='/question-bank/catalog')return [];
  if(path.includes('/papers/p1'))return {id:'p1',subject:'math',questions:[],units:[],pages:[]};
  if(path.endsWith('/step')){steps++;throw Object.assign(Error('timeout'),{code:'REQUEST_TIMEOUT'});}
  if(path.includes('/progress?')){polls++;return polls===1?job:polls===2?{...job,processing:true}:{...job,status:'complete',revision:2,paperId:'p1'};}
  if(path.includes('/import-jobs/j1?'))return job;
  return [];
 });
 w.GrowingQuestionFigures={prepareImportStep:async()=>({})};
 await c.actions.resume('j1');
 assert.equal(steps,1);assert.equal(polls,3);assert.equal(c.model.paper.id,'p1');assert.equal(c.model.running,false);c.destroy();
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
async function setup(api,user={id:'s1',role:'Student',username:'child'},context={}){const w={crypto:{randomUUID:()=> 'req1'},GrowingLegacy:{target:async(children,user)=>user.role==='Student'?user.id:children[0]?.id},GrowingStudentPhotoReview:{create:()=>({dispose(){},close(){},snapshot:()=>({}),subscribe:()=>()=>{},actions:{},open:async()=>{}})}};w.window=w;const c=vm.createContext({window:w,URLSearchParams,crypto:w.crypto,localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,setInterval,clearInterval,AbortController});vm.runInContext(await readFile(new URL('../../platform-web/legacy-navigation.js',import.meta.url),'utf8'),c);vm.runInContext(await readFile(file,'utf8'),c);const controller=w.GrowingStudentPaperPages.create({api,user,context,kind:'papers',active(){}});await controller.ready;return {w,controller};}
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
