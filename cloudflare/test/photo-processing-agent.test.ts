import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {connect,type Database,type User,HttpError} from '../src/database';
import {PaperImportJobs} from '../src/paper-import-jobs';
import {QuestionBank} from '../src/question-bank';
import {practiceCatalog} from '../src/photo-practice';
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database;
const student={id:crypto.randomUUID(),role:'Student',roleConfirmed:1,username:'student',displayName:'测试',passwordHash:'test'} as User;
const parent={...student,id:crypto.randomUUID(),role:'Parent',username:'parent'} as User;
const image='data:image/jpeg;base64,/9j/AA==',region={page:1,x:.1,y:.1,width:.8,height:.8};
const node=practiceCatalog('math')[0];
const vector={version:'question-svg-v1',warnings:[],figures:[{width:200,height:200,title:'A',elements:[{tag:'line',x1:20,y1:20,x2:150,y2:150}]}]};
let ocrCalls=0,renderCalls=0,planFails=false;
const service:any={
 planPage:async(...args:any[])=>{assert.equal(args[8],'GLM 原始题面');if(planFails)throw new HttpError(502,'复核暂时失败');return {title:'数学测试',classification:null,warnings:[],questions:[{number:'1',regions:[region]},{number:'2',regions:[region]}],continuesPrevious:false,continuationRegions:[]};},
 locateQuestionRegions:async()=>({regions:[region],warnings:[]}),
 transcribeQuestion:async()=>{throw Error('后台不能再次用chat接口调用OCR');},
 reviewQuestion:async(...args:any[])=>({warnings:[],hasFigures:args[4].number==='1',question:{number:args[4].number,text:'求值。',answer:'',unitId:node.unitId,reason:'已核对',questionType:'written',practice:{nodeId:node.id,level:'hard'},uncertain:[],pages:[1],figures:args[4].number==='1'?[region]:[],drawing:null}}),
 redrawQuestion:async()=>({drawing:vector,warnings:[]}),
 verifyQuestionDrawing:async(...args:any[])=>{assert.ok(args[8][0].startsWith('data:image/png'));return {matches:true,issues:[]};}
};
const grade:any=async(...args:any[])=>({verdict:args[4].number==='1'?'incorrect':'unanswered',score:args[4].number==='1'?0:null,studentAnswer:args[4].number==='1'?'错误作答':'',feedback:'原稿依据',corrections:[],knowledge:args[4].number==='1'?[{nodeId:node.id,role:'gap',confidence:.95,reason:'原稿步骤错误'}]:[],models:[],answerRegions:[]});
const runtime:any={ocr:async()=>{ocrCalls++;return {markdown:'GLM 原始题面',raw:'{"md_results":"GLM 原始题面"}',model:'glm-ocr',providerRequestId:'unit-test',usage:{}};},render:async()=>{renderCalls++;return ['data:image/png;base64,iVBORw0KGgoAAA=='];}};
const env:any={ZHIPU_API_KEY:'test',AI_LIMITER:{limit:async()=>({success:true})}};
const jobs=(user=parent)=>new PaperImportJobs(db,user,service,grade,runtime);
const create=()=>jobs().create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages:[image]},true);
const advance=(id:string)=>jobs().backendStep(student.id,id,env,new AbortController().signal,fetch);
before(async()=>{db=connect(await mf.getD1Database('DB') as any);for(const f of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(new URL('../migrations/'+f,import.meta.url),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));}for(const u of [student,parent])await db.query('INSERT INTO "GrowingUsers" ("Id","Username","NormalizedName","DisplayName","Role","PasswordHash","CreatedAt","SearchName","RoleConfirmed") VALUES (?1,?2,?2,?2,?3,\'x\',\'2026\',?2,1)',[u.id,u.username,u.role]);await db.query('INSERT INTO "GrowingFamilyLinks" ("StudentId","ParentId","CreatedAt") VALUES (?1,?2,\'2026\')',[student.id,parent.id]);});
after(async()=>mf.dispose());
test('background pipeline caches GLM, renders vectors without client attachments and writes unit bank and only actual errors',async()=>{
 let v=await create();const before=ocrCalls;assert.equal(v.processor,'photo-agent-v1');
 await assert.rejects(jobs().step(student.id,v.id,{revision:v.revision,workflow:'visual-v1'},env,new AbortController().signal,fetch),(e:any)=>e.status===409);
 for(let i=0;i<20&&v.status!=='complete';i++){v=await advance(v.id);assert.notEqual(v.status,'failed',v.error);}
 assert.equal(v.status,'complete');assert.equal(ocrCalls,before+1);assert.ok(renderCalls>0);
 const bank=new QuestionBank(db,student),all=await bank.list(student.id,node.unitId,1,false,false,node.id),wrong=await bank.list(student.id,node.unitId,1,false,true,node.id);
 assert.equal(all.total,2);assert.equal(wrong.total,1);assert.equal(wrong.rows[0].number,'1');
 const rows=await db.query<any>('SELECT * FROM GrowingPhotoQuestions WHERE PaperId=?',[v.paperId]);
 assert.equal(rows.length,2);assert.equal(rows[0].Reviewed,0);assert.equal(rows[0].AutoVerifiedRevision,rows[0].Revision);
 assert.equal((await advance(v.id)).paperId,v.paperId);
 assert.equal((await db.query('SELECT Id FROM GrowingPhotoQuestions WHERE PaperId=?',[v.paperId])).length,2);
 const progress=await jobs().progress(student.id,v.id);assert.ok(!JSON.stringify(progress).includes('GLM 原始题面'));assert.ok(!JSON.stringify(progress).includes('base64'));
});
test('planning failure retains raw OCR; explicit retry resumes without charging OCR twice',async()=>{
 const v=await create(),before=ocrCalls;planFails=true;
 const failed=await advance(v.id);assert.equal(failed.status,'failed');assert.equal(ocrCalls,before+1);
 assert.equal((await db.query('SELECT * FROM GrowingPaperOCRPages WHERE JobId=?',[v.id])).length,1);
 planFails=false;await jobs().retry(student.id,v.id,failed.revision);await advance(v.id);assert.equal(ocrCalls,before+1);
 await assert.rejects(jobs().retry(student.id,v.id,failed.revision),(e:any)=>e.status===409);
});
test('uncertain backend questions remain ungraded and unlinked until an explicit corrected edit',async()=>{
 const uncertainService={...service,reviewQuestion:async(...args:any[])=>{
  const result=await service.reviewQuestion(...args);
  return {...result,hasFigures:false,question:{...result.question,figures:[],uncertain:['公式中的数字不清楚。']}};
 }};
 const pipeline=new PaperImportJobs(db,parent,uncertainService,async()=>{throw Error('uncertain question must not be graded');},runtime);
 let v=await pipeline.create({studentId:student.id,requestId:crypto.randomUUID(),subject:'math',pages:[image]},true);
 for(let i=0;i<20&&v.status!=='complete';i++){
  v=await pipeline.backendStep(student.id,v.id,env,new AbortController().signal,fetch);
  assert.notEqual(v.status,'failed',v.error);
 }
 assert.equal(v.status,'complete');
 const bank=new QuestionBank(db,student),paper=await bank.paper(student.id,v.paperId!);
 assert.equal(paper.questions.length,2);
 for(const q of paper.questions){
  assert.equal(q.autoVerified,false);assert.equal(q.reviewed,false);assert.equal(q.unitId,'');assert.equal(q.practice,null);
  assert.ok(q.uncertain.length);assert.equal(q.grades.length,1);assert.equal(q.grades[0].result.verdict,'review');assert.equal(q.grades[0].result.score,null);
 }
 const graph=await bank.paperGraph(student.id,'math',v.paperId!);
 assert.equal(graph.wrongCount,0);
 for(const q of graph.questions){assert.equal(q.pending,true);assert.deepEqual(q.nodeIds,[]);assert.deepEqual(q.unitIds,[]);}
 const q=paper.questions[1];
 await bank.edit(student.id,q.id,{revision:q.revision,number:q.number,text:'计算 2 + 3。',answer:'',unitId:node.unitId,questionType:'written',practice:{nodeId:node.id,level:'hard'}});
 const corrected=(await bank.paper(student.id,v.paperId!)).questions.find((x:any)=>x.id===q.id)!;
 assert.equal(corrected.reviewed,true);assert.deepEqual(corrected.uncertain,[]);assert.equal(corrected.revision,q.revision+1);
 const linked=(await bank.list(student.id,node.unitId,1,false,false,node.id)).rows;
 assert.ok(linked.some((x:any)=>x.id===q.id));
 const correctedGraph=(await bank.paperGraph(student.id,'math',v.paperId!)).questions.find(x=>x.id===q.id)!;
 assert.equal(correctedGraph.pending,false);assert.ok(correctedGraph.nodeIds.includes(node.id));assert.equal(correctedGraph.needsCorrection,false);
});
test('replacing a backend figure invalidates automatic verification and old wrong-answer evidence',async()=>{
 let v=await create();
 for(let i=0;i<20&&v.status!=='complete';i++){v=await advance(v.id);assert.notEqual(v.status,'failed',v.error);}
 assert.equal(v.status,'complete');
 const bank=new QuestionBank(db,student),paper=await bank.paper(student.id,v.paperId!),q=paper.questions.find((x:any)=>x.number==='1')!;
 assert.equal(q.autoVerified,true);assert.equal((await bank.paperGraph(student.id,'math',v.paperId!)).wrongCount,1);
 await bank.saveFigure(student.id,q.id,{figureVersion:q.figureVersion,figures:[region]});
 const changed=(await bank.paper(student.id,v.paperId!)).questions.find((x:any)=>x.id===q.id)!;
 assert.equal(changed.autoVerified,false);assert.equal(changed.reviewed,false);assert.equal(changed.revision,q.revision+1);
 assert.equal(changed.grades.length,1);assert.equal(changed.grades[0].revision,q.revision);
 const graph=(await bank.paperGraph(student.id,'math',v.paperId!)).questions.find(x=>x.id===q.id)!;
 assert.equal(graph.needsCorrection,false);assert.equal(graph.pending,true);assert.equal(graph.verdict,null);assert.deepEqual(graph.nodeIds,[]);
 const practice=await bank.practiceCandidates(student.id,node.unitId);
 assert.ok(!practice.questions.some((x:any)=>x.id===q.id));
});
test('unlinking uploader parent stops backend processing and another household cannot retry',async()=>{
 const v=await create();await db.query('DELETE FROM GrowingFamilyLinks WHERE StudentId=? AND ParentId=?',[student.id,parent.id]);
 await assert.rejects(advance(v.id),(e:any)=>e.status===404);await assert.rejects(jobs().retry(student.id,v.id,v.revision),(e:any)=>e.status===404);
 assert.equal((await db.query('SELECT JobId FROM GrowingPaperOCRPages WHERE JobId=?',[v.id])).length,0);
});
