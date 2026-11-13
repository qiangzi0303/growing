import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {connect,type Database,type User,HttpError} from '../src/database';
import {PaperImportJobs} from '../src/paper-import-jobs';
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database;
const student={id:crypto.randomUUID(),role:'Student',roleConfirmed:1,username:'student',displayName:'测试',passwordHash:'test'} as User;
const parent={...student,id:crypto.randomUUID(),role:'Parent',username:'parent'} as User;
const pages=['data:image/jpeg;base64,/9j/AA==','data:image/jpeg;base64,/9j/AB=='];
const region=(page:number)=>({page,x:.1,y:.1,width:.8,height:.8});
let planCalls=0,questionCalls=0,failure=false,block:Promise<void>|null=null;
const recognition:any={
 planPage:async(_e:any,_s:any,_u:any,_sub:any,_image:any,page:number)=>{planCalls++;if(block)await block;if(failure)throw new HttpError(502,'upstream');return {title:'期中测试',classification:null,warnings:[],questions:page===1?[{number:'1',regions:[region(1)]}]:[{number:'2',regions:[region(2)]}],continuesPrevious:page===2,continuationRegions:page===2?[region(2)]:[]};},
 transcribeQuestion:async(_e:any,_s:any,_u:any,_sub:any,task:any)=>{questionCalls++;return {warnings:[],question:{...task,text:'完整题面',answer:'',unitId:'',reason:'',uncertain:[],figures:[],drawing:null}};},
 locateQuestionRegions:async(_e:any,_s:any,_u:any,_sub:any,task:any)=>({regions:task.pages.map(region),warnings:[]}),
 reviewQuestion:async(_e:any,_s:any,_u:any,_sub:any,task:any)=>({warnings:[],hasFigures:false,question:{...task,text:'完整题面',answer:'',unitId:'',reason:'',uncertain:[],figures:[],drawing:null}}),
 redrawQuestion:async()=>{throw Error('unexpected drawing');},verifyQuestionDrawing:async()=>{throw Error('unexpected verification');}
};
const env:any={AI_LIMITER:{limit:async()=>({success:true})}};
const jobs=()=>new PaperImportJobs(db,student,recognition);
const attachments=(v:any)=>v.next?.kind==='question'&&['transcribe','review','draw','grade'].includes(v.next.stage)?{fragments:v.next.regions.map((region:any)=>({page:region.page,region,image:pages[region.page-1]}))}:{};
const singleStep=(j:any,v:any,e=env)=>j.step(student.id,v.id,{revision:v.revision,workflow:'visual-v1',...attachments(v)},e,new AbortController().signal,fetch);
const step=async(j:any,v:any,e=env)=>{const before=v;for(let i=0;i<8;i++){v=await singleStep(j,v,e);if(before.plannedPages!==v.plannedPages||v.status==='failed'||v.status==='complete'||v.recognizedQuestions!==before.recognizedQuestions)return v;}throw Error('workflow did not advance');};
const rejected=(status:number)=>(e:any)=>e instanceof HttpError&&e.status===status;
before(async()=>{db=connect(await mf.getD1Database('DB') as any);for(const f of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(new URL('../migrations/'+f,import.meta.url),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));}for(const u of [student,parent])await db.query('INSERT INTO "GrowingUsers" ("Id","Username","NormalizedName","DisplayName","Role","PasswordHash","CreatedAt","RoleConfirmed") VALUES (?1,?2,?2,?2,?3,\'test\',\'2026\',1)',[u.id,u.username,u.role]);await db.query('INSERT INTO "GrowingFamilyLinks" ("StudentId","ParentId","CreatedAt") VALUES (?1,?2,\'2026\')',[student.id,parent.id]);});
after(async()=>mf.dispose());
test('D1 persisted creation is idempotent and content-conflicting request IDs are rejected',async()=>{const j=jobs(),input={studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages};const a=await j.create(input),b=await j.create(input);assert.equal(a.id,b.id);await assert.rejects(j.create({...input,pages:[pages[0]]}),rejected(409));assert.equal((await j.get(student.id,a.id)).sourcePages[1].image,pages[1]);assert.ok(!JSON.stringify(await j.list(student.id)).includes('/9j/'));const [row]=await db.query<any>('SELECT "State" FROM "GrowingPaperImportJobs" WHERE "Id"=?1',[a.id]);assert.ok(!row.State.includes('/9j/'));});
test('D1 recovery preserves prior successful pages, cross-page questions and atomically creates ungraded draft once',async()=>{const j=jobs();let v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages});v=await step(j,v);failure=true;v=await step(j,v);assert.equal(v.status,'failed');assert.equal(v.plannedPages,1);failure=false;v=await step(j,v);assert.equal(v.plannedPages,2);assert.equal(v.totalQuestions,2);assert.deepEqual((v.next as any).pages,[1,2]);v=await step(j,v);assert.equal(v.recognizedQuestions,1);v=await step(j,v);assert.equal(v.status,'complete');const repeat=await step(j,v);assert.equal(repeat.paperId,v.paperId);const [paper]=await db.query<any>('SELECT "Mode" FROM "GrowingQuestionPapers" WHERE "Id"=?1',[v.paperId]);assert.equal(paper.Mode,'paper-draft');const qs=await db.query<any>('SELECT "Pages","Answer","FigureDrawing" FROM "GrowingPhotoQuestions" WHERE "PaperId"=?1',[v.paperId]);assert.equal(qs.length,2);assert.deepEqual(JSON.parse(qs[0].Pages),[1,2]);assert.ok(qs.every(q=>q.Answer===''&&q.FigureDrawing===''));assert.equal((await db.query('SELECT * FROM "GrowingPhotoGrades"')).length,0);assert.deepEqual(await db.query('PRAGMA foreign_key_check'),[]);});
test('CAS prevents concurrent model calls; expired lease recovers; 429 preserves resumable task',async()=>{const j=jobs();let v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'physics',pages:[pages[0]]});let release!:()=>void;block=new Promise<void>(r=>release=r);const before=planCalls;const pending=step(j,v);await new Promise(r=>setTimeout(r,80));await assert.rejects(step(j,v),rejected(409));release();v=await pending;block=null;assert.equal(planCalls,before+1);await assert.rejects(step(j,v,{AI_LIMITER:{limit:async()=>({success:false})}}),rejected(429));v=await j.get(student.id,v.id);assert.equal(v.status,'recognizing');assert.equal(v.recognizedQuestions,0);await db.query('UPDATE "GrowingPaperImportJobs" SET "LeaseToken"=\'crashed\',"LeaseUntil"=1 WHERE "Id"=?1',[v.id]);v=await step(j,v);assert.equal(v.status,'complete');});
test('unfinished task deletion removes only its source pages and rejects active or stale work',async()=>{
 const j=jobs(),make=()=>j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages});
 const target=await make(),other=await make();
 await assert.rejects(j.remove(student.id,target.id,target.revision+1),rejected(409));
 await db.query('UPDATE "GrowingPaperImportJobs" SET "LeaseUntil"=?2 WHERE "Id"=?1',[target.id,Date.now()+60000]);
 await assert.rejects(j.remove(student.id,target.id,target.revision),rejected(409));
 assert.equal((await j.get(student.id,target.id)).sourcePages.length,2);
 await db.query('UPDATE "GrowingPaperImportJobs" SET "LeaseUntil"=0 WHERE "Id"=?1',[target.id]);
 // A damaged upload must still be removable without loading the missing source page.
 await db.query('DELETE FROM "GrowingPaperImportJobPages" WHERE "JobId"=?1 AND "Page"=2',[target.id]);
 const before=(await db.query('SELECT * FROM "GrowingQuestionPapers"')).length;
 assert.deepEqual(await j.remove(student.id,target.id,target.revision),{deleted:true});
 assert.equal((await db.query('SELECT * FROM "GrowingPaperImportJobPages" WHERE "JobId"=?1',[target.id])).length,0);
 await assert.rejects(j.get(student.id,target.id),rejected(404));
 assert.equal((await j.get(student.id,other.id)).sourcePages.length,2);
 assert.equal((await db.query('SELECT * FROM "GrowingQuestionPapers"')).length,before);
 assert.deepEqual(await db.query('PRAGMA foreign_key_check'),[]);
});

test('completed import deletion is blocked and preserves its paper and photos',async()=>{
 const j=jobs();let v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages:[pages[0]]});
 while(v.status!=='complete')v=await step(j,v);
 await assert.rejects(j.remove(student.id,v.id,v.revision),rejected(409));
 assert.equal((await j.get(student.id,v.id)).sourcePages.length,1);
 assert.equal((await db.query('SELECT * FROM "GrowingQuestionPapers" WHERE "Id"=?1',[v.paperId])).length,1);
});

test('unreliable page planning cannot complete a paper or discard its source page',async()=>{const broken={...recognition,planPage:async()=>({title:'空卷',classification:null,warnings:[],questions:[],continuesPrevious:false,continuationRegions:[]})};const j=new PaperImportJobs(db,student,broken);let v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages:[pages[0]]});v=await step(j,v);assert.equal(v.status,'failed');assert.equal(v.plannedPages,0);assert.equal(v.paperId,null);assert.equal((await j.get(student.id,v.id)).sourcePages.length,1);});
test('figure failure preserves completed questions and retry saves the real figure with the draft',async()=>{
 let rejectFigure=true;
 const service={...recognition,reviewQuestion:async(...args:any[])=>{
  if(args[4].number==='2'&&rejectFigure)throw new HttpError(502,'本题题图识别失败，已保存进度，请重试。');
  const result=await recognition.reviewQuestion(...args);result.question.figures=[region(args[4].pages[0])];return result;
 }};
 const j=new PaperImportJobs(db,student,service);let v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages});
 v=await step(j,v);v=await step(j,v);v=await step(j,v);assert.equal(v.recognizedQuestions,1);
 v=await step(j,v);assert.equal(v.status,'failed');assert.equal(v.recognizedQuestions,1);assert.equal(v.paperId,null);assert.match(v.error,/题图识别失败/);
 rejectFigure=false;v=await step(j,v);assert.equal(v.status,'complete');
 const [question]=await db.query<any>('SELECT "Figures" FROM "GrowingPhotoQuestions" WHERE "PaperId"=?1 AND "Number"=\'2\'',[v.paperId]);
 assert.deepEqual(JSON.parse(question.Figures),[region(2)]);
});

test('localized workflow requires all advisory crops before OCR without discarding persisted originals',async()=>{const j=jobs();let v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages:[pages[0]]});v=await step(j,v);v=await singleStep(j,v);await assert.rejects(j.step(student.id,v.id,{revision:v.revision,workflow:'visual-v1',fragments:[]},env,new AbortController().signal,fetch),rejected(400));assert.equal((await j.get(student.id,v.id)).sourcePages[0].image,pages[0]);v=await step(j,v);assert.equal(v.status,'complete');});
test('missing source rows never silently shrink the original page count',async()=>{const j=jobs(),v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages});await db.query('DELETE FROM "GrowingPaperImportJobPages" WHERE "JobId"=?1 AND "Page"=1',[v.id]);await assert.rejects(j.get(student.id,v.id),rejected(409));await assert.rejects(step(j,v),rejected(409));});
test('OCR failure, blind review and rendered diagram repair each resume from the persisted stage',async()=>{
 let ocrCalls=0,reviewCalls=0,drawCalls=0,verifyCalls=0,reviewFails=true;
 const vector={version:'question-svg-v1',warnings:[],figures:[{width:200,height:200,title:'题图',elements:[{tag:'line',x1:20,y1:20,x2:150,y2:150}]}]};
 const service={...recognition,
  transcribeQuestion:async()=>{ocrCalls++;throw new HttpError(502,'OCR格式错误');},
  reviewQuestion:async(...args:any[])=>{reviewCalls++;if(reviewFails)throw new HttpError(502,'原图复核失败');return {...await recognition.reviewQuestion(...args),hasFigures:true,question:{...(await recognition.reviewQuestion(...args)).question,figures:[{page:1,x:.2,y:0,width:.2,height:.1}]}};},
  redrawQuestion:async(...args:any[])=>{drawCalls++;assert.equal(args[4].regions[0].y,0);assert.equal(args[6][0].region.y,0);if(drawCalls===2)assert.match(args[8][0],/点名/);return {drawing:vector,warnings:[]};},
  verifyQuestionDrawing:async()=>{verifyCalls++;return {matches:verifyCalls>1,issues:verifyCalls>1?[]:['点名被切到']};}
 };
 let j=new PaperImportJobs(db,student,service),v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages:[pages[0]]});
 v=await singleStep(j,v);v=await singleStep(j,v);v=await singleStep(j,v);
 assert.equal((v.next as any).stage,'review');assert.equal(ocrCalls,1);
 v=await singleStep(j,v);assert.equal(v.status,'failed');assert.equal(v.completedQuestions,0);
 reviewFails=false;j=new PaperImportJobs(db,student,service);v=await singleStep(j,v);
 assert.equal((v.next as any).stage,'draw');assert.equal((v.next as any).regions[0].y,0);assert.equal(ocrCalls,1);assert.equal(reviewCalls,2);
 v=await singleStep(j,v);assert.equal((v.next as any).stage,'verify');
 await assert.rejects(j.step(student.id,v.id,{revision:v.revision,workflow:'visual-v1',diagramImages:[pages[0]],drawingHash:'obsolete'},env,new AbortController().signal,fetch),rejected(400));assert.equal(verifyCalls,0);
 await assert.rejects(j.step(student.id,v.id,{revision:v.revision,workflow:'visual-v1',fragments:(v.next as any).regions.map((region:any)=>({page:region.page,region,image:'data:image/jpeg;base64,/9j/'+'A'.repeat(100000)})),diagramImages:[pages[0]],drawingHash:(v.next as any).drawingHash},env,new AbortController().signal,fetch),rejected(400));assert.equal(verifyCalls,0);
 const verify=()=>j.step(student.id,v.id,{revision:v.revision,workflow:'visual-v1',fragments:(v.next as any).regions.map((region:any)=>({page:region.page,region,image:pages[0]})),diagramImages:[pages[0]],drawingHash:(v.next as any).drawingHash},env,new AbortController().signal,fetch);
 v=await verify();assert.equal(v.status,'recognizing');assert.equal(v.error,'');assert.equal((v.next as any).stage,'draw');assert.equal(v.completedQuestions,0);
 v=await singleStep(j,v);assert.equal(drawCalls,2);v=await verify();assert.equal(v.status,'complete');
 assert.equal(ocrCalls,1);assert.equal(reviewCalls,2);
 const [q]=await db.query<any>('SELECT "FigureDrawing","DrawingRevision","DrawingReviewed","Reviewed","Answer" FROM "GrowingPhotoQuestions" WHERE "PaperId"=?1',[v.paperId]);
 assert.equal(JSON.parse(q.FigureDrawing).version,'question-svg-v1');assert.equal(q.DrawingRevision,1);assert.equal(q.DrawingReviewed,0);assert.equal(q.Reviewed,0);assert.equal(q.Answer,'');
 const [row]=await db.query<any>('SELECT "State" FROM "GrowingPaperImportJobs" WHERE "Id"=?1',[v.id]);assert.ok(!row.State.includes('/9j/'));assert.equal(JSON.parse(row.State).pending,undefined);
});

test('repeated drawing mismatch resumes across restarts and preserves originals while completing later questions',async()=>{
 let draws=0;
 const service={...recognition,
  reviewQuestion:async(...args:any[])=>{const result=await recognition.reviewQuestion(...args);return {...result,hasFigures:args[4].number==='1',question:{...result.question,figures:args[4].number==='1'?[region(1)]:[],uncertain:Array.from({length:10},(_,i)=>'核对项'+i)}};},
  redrawQuestion:async()=>{draws++;return {drawing:{version:'question-svg-v1',warnings:[],figures:[{width:200,height:200,title:'题图',elements:[{tag:'line',x1:20,y1:20,x2:150,y2:150}]}]},warnings:[]};},
  verifyQuestionDrawing:async()=>({matches:false,issues:['点名和角度不符']})
 };
 let j=new PaperImportJobs(db,student,service),v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages});
 for(let i=0;i<20&&v.status!=='complete';i++){
  j=new PaperImportJobs(db,student,service);
  const next=v.next as any;
  v=next?.stage==='verify'?await j.step(student.id,v.id,{revision:v.revision,workflow:'visual-v1',fragments:next.regions.map((region:any)=>({page:region.page,region,image:pages[region.page-1]})),diagramImages:[pages[0]],drawingHash:next.drawingHash},env,new AbortController().signal,fetch):await singleStep(j,v);
  assert.notEqual(v.status,'failed',v.error);
 }
 assert.equal(v.status,'complete');assert.equal(v.completedQuestions,2);assert.equal(draws,2);
 const qs=await db.query<any>('SELECT "Number","FigureDrawing","Figures","Uncertain" FROM "GrowingPhotoQuestions" WHERE "PaperId"=?1 ORDER BY "Number"',[v.paperId]);
 assert.equal(qs.length,2);assert.equal(qs[0].FigureDrawing,'');assert.ok(JSON.parse(qs[0].Figures).length);assert.match(qs[0].Uncertain,/已保留原图/);
 const originals=await db.query<any>('SELECT "Image" FROM "GrowingQuestionPages" WHERE "PaperId"=?1 ORDER BY "Page"',[v.paperId]);assert.deepEqual(originals.map(p=>p.Image),pages);
 assert.equal((await singleStep(j,v)).paperId,v.paperId);
});

test('capacity reached after planning never marks a task complete or inserts partial paper rows',async()=>{const j=jobs();let v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'physics',pages:[pages[0]]});v=await step(j,v);const [{total}]=await db.query<any>('SELECT count(*) AS total FROM "GrowingQuestionPapers" WHERE "StudentId"=?1',[student.id]);const ids=Array.from({length:100-total},()=>crypto.randomUUID());await db.batch(ids.map(id=>({sql:'INSERT INTO "GrowingQuestionPapers" ("Id","StudentId","RequestId","Fingerprint","Title","Warnings","CreatedAt") VALUES (?1,?2,?1,?1,\'capacity\',\'[]\',\'2026\')',params:[id,student.id]})));await assert.rejects(step(j,v),rejected(409));const state=await j.get(student.id,v.id);assert.equal(state.paperId,null);assert.equal(state.recognizedQuestions,0);assert.equal((await db.query<any>('SELECT count(*) AS total FROM "GrowingQuestionPapers" WHERE "StudentId"=?1',[student.id]))[0].total,100);await assert.rejects(j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages:[pages[0]]}),rejected(413));await db.batch(ids.map(id=>({sql:'DELETE FROM "GrowingQuestionPapers" WHERE "Id"=?1',params:[id]})));});
test('linked parent shares progress and unlink revokes future reads and steps',async()=>{const j=jobs(),v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'english',pages:[pages[0]]});const p=new PaperImportJobs(db,parent,recognition);assert.equal((await p.get(student.id,v.id)).id,v.id);await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "StudentId"=?1',[student.id]);await assert.rejects(p.get(student.id,v.id),rejected(404));await assert.rejects(step(p,v),rejected(404));});

test('grading progress reports the active lease and blocks concurrent calls; cancellation never advances completion',async()=>{
 let release!:()=>void,entered!:()=>void,calls=0;
 const waiting=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);
 const grade:any=async(...args:any[])=>{calls++;entered();await waiting;return {verdict:'correct',score:100,studentAnswer:'2',feedback:'正确',corrections:[],knowledge:[],models:[]};};
 const j=new PaperImportJobs(db,student,recognition,grade);
 let v=await j.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'physics',pages:[pages[0]],mode:'grade'});
 v=await step(j,v);assert.equal(v.progressPercent,0);
 for(let i=0;i<3;i++)v=await singleStep(j,v);
 assert.equal((v.next as any).stage,'grade');
 const controller=new AbortController();
 const pending=j.step(student.id,v.id,{revision:v.revision,workflow:'visual-v1',...attachments(v)},env,controller.signal,fetch);
 await started;
 const progress=await j.progress(student.id,v.id);assert.equal(progress.processing,true);assert.equal(progress.completedQuestions,0);assert.equal(progress.progressPercent,0);
 assert.ok(!JSON.stringify(progress).includes('/9j/'));
 await assert.rejects(step(j,v),rejected(409));assert.equal(calls,1);
 controller.abort();release();await assert.rejects(pending,rejected(499));
 const cancelled=await j.progress(student.id,v.id);assert.equal(cancelled.processing,false);assert.equal(cancelled.completedQuestions,0);assert.equal(cancelled.paperId,null);
 v=await step(j,cancelled);assert.equal(v.progressPercent,100);assert.equal(calls,2);
});
