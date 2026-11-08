import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {createHandler,type Env} from '../src/index';
import {connect,type Database} from '../src/database';
import {normalizeClassification,manualClassification} from '../src/paper-classification';
const candidate={examType:'unit',unitIds:['physics-8a-01'],termName:'八年级上册',confidence:.95,unitConfidence:.95,evidence:'卷头明确写第一章机械运动单元测试'};
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database,output:any,calls:any[]=[];
const env={AUTH_LIMITER:{limit:async()=>({success:true})},AI_LIMITER:{limit:async()=>({success:true})},HANDWRITING_VISION_MODELS:JSON.stringify([{name:'test',model:'test',endpoint:'https://vision.test/v1',apiKey:'test-only'}]),ASSETS:{fetch:async()=>new Response('asset')}} as unknown as Env;
const handler=createHandler(()=>db,(async(_url,options)=>{calls.push(JSON.parse(options!.body as string));return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]});}) as typeof fetch);
const pages=['data:image/jpeg;base64,/9j/AA=='];
const grade=()=>({verdict:'unanswered',score:null,studentAnswer:'',feedback:'空白',corrections:[],knowledge:[],models:[]});
const paper=(subject='physics')=>({format:subject+'-text-v1',title:'第一单元测试',classification:{...candidate,unitIds:[subject+'-8a-01']},warnings:[],questions:[{number:'1',text:'测量长度并记录单位。',answer:'',unitId:subject+'-8a-01',confidence:.95,reason:'第一单元',uncertain:[],pages:[1],regions:[],figures:[{page:1,x:.1,y:.1,width:.2,height:.2}],...grade()}]});
async function call(path:string,method='GET',data?:unknown,token?:string){return handler(new Request('https://learn.test/api'+path,{method,headers:{'Content-Type':'application/json','X-Growing-Client':'1',...(token?{Authorization:'Bearer '+token}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})}),env,{waitUntil:()=>{}});}
async function register(role='Student'){const r=await call('/auth/register','POST',{username:'classify_'+crypto.randomUUID().replaceAll('-','').slice(0,12),displayName:'测试',password:'Test-Only-1987!',role});assert.equal(r.status,200);return r.json() as Promise<any>;}
let legacyUser:any;
before(async()=>{
 db=connect(await mf.getD1Database('DB') as unknown as D1Database);
 for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
  if(file.startsWith('0016')){
   legacyUser=await register();
   await db.query(`INSERT INTO "GrowingQuestionPapers" ("Id","StudentId","RequestId","Fingerprint","Title","Warnings","CreatedAt","Subject") VALUES ('10000000-0000-4000-8000-000000000001',?1,'old-request','old-fingerprint','旧英语卷','[]','2026-01-01','english')`,[legacyUser.user.id]);
   await db.query(`INSERT INTO "GrowingQuestionPages" ("PaperId","Page","Image") VALUES ('10000000-0000-4000-8000-000000000001',1,'old-image')`);
   await db.query(`INSERT INTO "GrowingPhotoQuestions" ("Id","PaperId","Number","Text","Answer","UnitId","Reason","Uncertain","Pages") VALUES ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','1','old-text','','english-8a-01','','[]','[1]')`);
   await db.query(`INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt") VALUES ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','request','fp',1,'initial','old-answer',?1,'2026-01-01')`,[JSON.stringify(grade())]);
   await db.query(`INSERT INTO "GrowingQuestionAttempts" ("StudentId","AttemptId","Kind","QuestionId","Correct","ActorId","CreatedAt") VALUES (?1,'old-attempt','photo','10000000-0000-4000-8000-000000000002',0,?1,'2026-01-01')`,[legacyUser.user.id]);
  }
  const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
 }
});
after(async()=>{await mf.dispose();});
test('classification accepts true subject units and isolates uncertain or conflicting metadata',()=>{
 assert.deepEqual(normalizeClassification(candidate,'physics','第一章单元测试').unitIds,['physics-8a-01']);
 for(const value of [{...candidate,unitConfidence:.7},{...candidate,unitIds:['math-8a-01']},{...candidate,termName:'八年级下册'},{...candidate,conflict:true},{...candidate,detectedSubject:'english'}])assert.deepEqual(normalizeClassification(value,'physics','单元测试').unitIds,[]);
 assert.equal(normalizeClassification({...candidate,confidence:.7},'physics','').examType,'unknown');
 assert.equal(normalizeClassification({...candidate,examType:'unit'},'physics','期末考试').examType,'unknown');
 assert.deepEqual(normalizeClassification({...candidate,examType:'final'},'physics','期末考试').unitIds,[]);
 assert.equal(normalizeClassification(undefined,'math','旧卷').source,'legacy');
 assert.equal(normalizeClassification({...candidate,examType:'final',termName:'虚构册次'},'physics','期末考试').termName,'');
 assert.deepEqual(normalizeClassification({...candidate,unitIds:['physics-8a-01','physics-8a-02']},'physics','第一二单元测试').unitIds,['physics-8a-01','physics-8a-02']);
 assert.deepEqual(normalizeClassification({...candidate,unitIds:['physics-8a-01','physics-8a-01']},'physics','单元测试').unitIds,[]);
 for(const examType of ['midterm','final','other','unknown'])assert.deepEqual(normalizeClassification({...candidate,examType},'physics','未命名卷').unitIds,[]);
 assert.equal(normalizeClassification({...candidate,evidence:''},'physics','单元测试').examType,'unknown');
 assert.equal(manualClassification({...candidate},'physics'),null);
 assert.equal(manualClassification({examType:'unit',unitIds:['english-8a-01'],termName:'八年级上册'},'physics'),null);
 assert.equal(manualClassification({examType:'final',unitIds:[],termName:'八年级上册'},'physics')?.confirmed,true);
});
test('migration preserves legacy subject, original images, question, grade and answer attempts without rebuilding parent table',async()=>{
 const detail=await (await call('/question-bank/papers/10000000-0000-4000-8000-000000000001?studentId='+legacyUser.user.id,'GET',undefined,legacyUser.token)).json() as any;
 assert.equal(detail.subject,'english');assert.equal(detail.classification.source,'legacy');assert.equal(detail.pages[0].image,'old-image');assert.equal(detail.questions[0].text,'old-text');assert.equal(detail.questions[0].grades[0].id,'10000000-0000-4000-8000-000000000003');
 assert.equal((await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "AttemptId"=\'old-attempt\'')).length,1);
 assert.deepEqual(await db.query('PRAGMA foreign_key_check'),[]);
 const index=await db.query<any>('PRAGMA index_info("GrowingQuestionPapers_StudentSubject")');assert.equal(index[1].name,'Subject');
});
test('three subject upload, duplicate, list, manual confirmation and reopen share persisted classification',async()=>{
 const u=await register(),other=await register(),parent=await register('Parent');
 await db.query('INSERT INTO "GrowingFamilyLinks" ("StudentId","ParentId","CreatedAt") VALUES (?1,?2,?)',[u.user.id,parent.user.id,'2026-11-07']);
 for(const subject of ['math','english','physics']){
  output=paper(subject);const input={studentId:u.user.id,requestId:crypto.randomUUID(),pages,mode:'paper',subject};
  const response=await call('/question-bank/import','POST',input,parent.token);assert.equal(response.status,200,await response.clone().text());
  const result=await response.json() as any;assert.equal(result.classification.examType,'unit');assert.deepEqual(result.classification.unitIds,[subject+'-8a-01']);
  const item=result.questions[0],questionPath='/question-bank/questions/'+item.id;
  assert.equal((await call(questionPath,'PUT',{studentId:u.user.id,revision:1,number:item.number,text:item.text,answer:'',unitId:subject==='math'?'physics-8a-01':'math-8a-01'},u.token)).status,400);
  if(subject==='physics'){
   const count=calls.length;assert.equal((await call(questionPath+'/format','POST',{studentId:u.user.id,revision:1},u.token)).status,200);assert.equal(calls.length,count);
  }
  const context=JSON.parse(calls.at(-1).messages[1].content[0].text);assert.ok(context.units.every((v:any)=>v.subject===subject));
  if(subject==='physics'){assert.deepEqual(context.geometryModels,[]);assert.match(calls.at(-1).messages[0].content,/物理/);assert.ok(!calls.at(-1).messages[0].content.includes('HL必须'));assert.ok(!result.questions[0].uncertain.some((s:string)=>s.includes('SVG')));}
  const retry=await (await call('/question-bank/import','POST',input,u.token)).json() as any;assert.equal(retry.paperId,result.paperId);assert.deepEqual(retry.classification,result.classification);
  const path='/question-bank/papers/'+result.paperId,query='?studentId='+u.user.id;
  assert.equal((await call(path+query,'GET',undefined,other.token)).status,404);
  const autoConfirmation={examType:result.classification.examType,unitIds:result.classification.unitIds,termName:result.classification.termName};
  assert.equal((await call(path+'/confirm','POST',{studentId:u.user.id,title:'核对自动分类',classification:autoConfirmation},u.token)).status,409);
  assert.equal((await call(questionPath,'PUT',{studentId:u.user.id,revision:item.revision,figureVersion:item.figureVersion,reviewed:true},u.token)).status,200);
  assert.equal((await call(path+'/confirm','POST',{studentId:u.user.id,title:'核对自动分类',classification:autoConfirmation},u.token)).status,200);
  const confirmedAI=await (await call(path+query,'GET',undefined,u.token)).json() as any;
  assert.equal(confirmedAI.classification.source,'ai');assert.equal(confirmedAI.classification.confirmed,true);assert.equal(confirmedAI.classification.evidence,result.classification.evidence);assert.equal(confirmedAI.classification.confidence,.95);
  assert.equal((await call(path+'/confirm','POST',{studentId:u.user.id,title:'核对后',classification:{examType:'unit',unitIds:['physics-8a-01'],termName:'八年级下册'}},u.token)).status,400);
  assert.equal((await call(path+'/confirm','POST',{studentId:u.user.id,title:'期末卷',classification:{examType:'final',unitIds:[],termName:'八年级上册'}},parent.token)).status,200);
  const reopened=await (await call(path+query,'GET',undefined,u.token)).json() as any;
  assert.equal(reopened.classification.examType,'final');assert.equal(reopened.classification.confirmed,true);assert.equal(reopened.classification.source,'manual');assert.deepEqual(reopened.classification.unitIds,[]);assert.ok(reopened.units.every((v:any)=>v.subject===subject));assert.equal(reopened.questions[0].unitId,subject+'-8a-01');
  assert.ok(reopened.classification.evidence.includes(result.classification.evidence));assert.equal(reopened.classification.confidence,0);
  const rows=await (await call('/question-bank/papers'+query+'&subject='+subject,'GET',undefined,u.token)).json() as any[];assert.equal(rows.length,1);assert.deepEqual(rows[0].classification,reopened.classification);
  assert.equal((await call(path+'/confirm','POST',{studentId:u.user.id,title:'旧客户端'},u.token)).status,200);
 }
});
test('physics handwriting grading and followup use separate original illustrations, never old answer pages',async()=>{
 const u=await register();output=paper();const result=await (await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),pages,mode:'paper',subject:'physics'},u.token)).json() as any;
 const q=result.questions[0],path='/question-bank/questions/'+q.id,answer='data:image/png;base64,iVBORw0KGgoAAA==',figure='data:image/jpeg;base64,/9j/Ag==';
 const input={studentId:u.user.id,revision:1,requestId:crypto.randomUUID(),answerPages:[answer]};output={...grade(),verdict:'correct',score:100,studentAnswer:'10 cm',feedback:'正确',answerAnnotations:[]};
 assert.equal((await call(path+'/correct','POST',input,u.token)).status,409);
 assert.equal((await call(path+'/figures','PUT',{studentId:u.user.id,figureVersion:q.figureVersion,image:figure},u.token)).status,200);
 const response=await call(path+'/correct','POST',input,u.token);assert.equal(response.status,200,await response.clone().text());const saved=await response.json() as any;
 assert.deepEqual(calls.at(-1).messages[1].content.filter((x:any)=>x.type==='image_url').map((x:any)=>x.image_url.url),[answer,figure]);
 output={reply:'单位应写cm。'};assert.equal((await call(path+'/followup','POST',{studentId:u.user.id,gradeId:saved.grade.id,requestId:crypto.randomUUID(),prompt:'为什么'},u.token)).status,200);
 assert.deepEqual(calls.at(-1).messages[1].content.filter((x:any)=>x.type==='image_url').map((x:any)=>x.image_url.url),[answer,figure]);
});
