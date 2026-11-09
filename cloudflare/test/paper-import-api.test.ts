import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {createHandler,type Env} from '../src/index';
import {connect,type Database} from '../src/database';

// Exercise HTTP auth, routing, recognition and real migrated D1 together.
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database;
const image='data:image/jpeg;base64,/9j/AA==';
let calls=0;
let failGradeNumber='';
const handler=createHandler(()=>db,(async(_url:any,options:any)=>{
 calls++;
 const body=JSON.parse(options.body),context=JSON.parse(body.messages[1].content[0].text);
 const grading=!!context.knowledgePoints;
 if(grading&&context.number===failGradeNumber)return Response.json({error:'test failure'},{status:503});
 const result=context.number?{format:'math-text-v1',complete:true,warnings:[],questions:[{number:context.number,text:'计算 1+1。',questionType:'written',answer:'',unitId:'math-8a-01',confidence:.9,reason:'题设',uncertain:[],pages:[1],figures:[],drawing:null,...(grading?{assessment:{verdict:'correct',score:100,studentAnswer:'2',feedback:'正确',corrections:[],knowledge:[],models:[]}}:{})}]}:
 {title:'数学期中考试',complete:true,classification:{examType:'midterm',confidence:.95,evidence:'卷头数学期中考试',unitIds:[],termName:''},warnings:[],questions:[{number:'1',regions:[]},{number:'2',regions:[]}],continuesPrevious:false,continuationRegions:[]};
 return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]});
}) as typeof fetch);
const env={AUTH_LIMITER:{limit:async()=>({success:true})},AI_LIMITER:{limit:async()=>({success:true})},HANDWRITING_VISION_MODELS:JSON.stringify([{name:'test',model:'test',endpoint:'https://vision.test',apiKey:'test-only'}])} as unknown as Env;
const base='/api/question-bank/import-jobs';
async function call(path:string,method='GET',data?:unknown,token?:string){
 return handler(new Request('https://learn.test'+path,{method,headers:{'X-Growing-Client':'1','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})}),env,{waitUntil:()=>{}});
}
async function register(name:string){
 const r=await call('/api/auth/register','POST',{username:name,displayName:name,role:'Student',password:'Testing-1987!'});
 assert.equal(r.status,200,await r.clone().text());return await r.json() as any;
}
async function ok(r:Response){assert.equal(r.status,200,await r.clone().text());return await r.json() as any;}
before(async()=>{
 db=connect(await mf.getD1Database('DB') as any);
 for(const f of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
  const sql=await readFile(new URL('../migrations/'+f,import.meta.url),'utf8');
  await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
 }
});

test('HTTP grading progress counts persisted questions, survives failure and saves grades exactly once',async()=>{
 const a=await register('grade_owner'),b=await register('grade_other');
 const input={studentId:a.user.id,requestId:crypto.randomUUID(),subject:'math',pages:[image],mode:'grade'};
 let v=await ok(await call(base,'POST',input,a.token));
 const detail=base+'/'+v.id,query='?studentId='+a.user.id;
 const progress=()=>call(detail+'/progress'+query,'GET',undefined,a.token);
 const step=()=>call(detail+'/step','POST',{studentId:a.user.id,revision:v.revision},a.token);
 assert.equal(v.mode,'grade');assert.equal(v.progressPercent,null);assert.equal(v.totalQuestions,0);
 assert.equal((await call(detail+'/progress'+query)).status,401);
 assert.equal((await call(detail+'/progress'+query,'GET',undefined,b.token)).status,404);
 assert.equal((await call(detail+'/progress?studentId='+b.user.id,'GET',undefined,b.token)).status,404);
 const initial=await ok(await progress());assert.ok(!JSON.stringify(initial).includes('/9j/'));assert.equal(initial.processing,false);
 assert.equal((await call(base,'POST',{...input,mode:undefined},a.token)).status,409);
 v=await ok(await step());assert.equal(v.status,'grading');assert.equal(v.totalQuestions,2);assert.equal(v.progressPercent,0);
 v=await ok(await step());assert.equal(v.completedQuestions,1);assert.equal(v.progressPercent,50);
 failGradeNumber='2';v=await ok(await step());failGradeNumber='';
 assert.equal(v.status,'failed');assert.equal(v.progressPercent,50);assert.equal(v.completedQuestions,1);
 const restored=await ok(await call(base,'POST',input,a.token));assert.equal(restored.id,v.id);assert.equal(restored.progressPercent,50);
 v=await ok(await step());assert.equal(v.status,'complete');assert.equal(v.progressPercent,100);assert.equal(v.completedQuestions,2);
 const final=await ok(await progress());assert.equal(final.progressPercent,100);assert.equal(final.processing,false);
 const repeated=await ok(await step());assert.equal(repeated.paperId,v.paperId);
 const paper=await ok(await call('/api/question-bank/papers/'+v.paperId+query,'GET',undefined,a.token));
 assert.equal(paper.mode,'grade');assert.equal(paper.questions.length,2);
 assert.ok(paper.questions.every((q:any)=>q.grades.length===1&&q.grades[0].result.score===100));
 assert.equal((await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1',[a.user.id])).length,2);
 assert.deepEqual(await db.query('PRAGMA foreign_key_check'),[]);
});
after(async()=>mf.dispose());
test('HTTP job lifecycle persists an ungraded classified draft; auth and repeat completion remain safe',async()=>{
 calls=0;
 const a=await register('import_owner'),b=await register('import_other');
 const input={studentId:a.user.id,requestId:crypto.randomUUID(),subject:'math',pages:[image]};
 assert.equal((await call(base,'POST',input)).status,401);
 assert.equal((await call(base+'?studentId='+a.user.id)).status,401);
 let v=await ok(await call(base,'POST',input,a.token));
 assert.equal(v.status,'planning');
 assert.equal((await ok(await call(base,'POST',input,a.token))).id,v.id);
 const detail=base+'/'+v.id,query='?studentId='+a.user.id;
 assert.equal((await call(detail+query)).status,401);
 assert.equal((await call(detail+'/step','POST',{studentId:a.user.id,revision:v.revision})).status,401);
 for(const studentId of [a.user.id,b.user.id]){
  assert.equal((await call(detail+'?studentId='+studentId,'GET',undefined,b.token)).status,404);
  assert.equal((await call(detail+'/step','POST',{studentId,revision:v.revision},b.token)).status,404);
 }
 assert.equal(calls,0);
 const list=await ok(await call(base+query+'&subject=math','GET',undefined,a.token));
 assert.equal(list.length,1);assert.equal(list[0].id,v.id);assert.ok(!JSON.stringify(list).includes('/9j/'));
 const restored=await ok(await call(detail+query,'GET',undefined,a.token));
 assert.equal(restored.sourcePages[0].image,image);
 const step=()=>call(detail+'/step','POST',{studentId:a.user.id,revision:v.revision,...(v.next?.kind==='question'?{fragments:[]}:{})},a.token);
 v=await ok(await step());assert.equal(v.status,'recognizing');assert.equal(v.totalQuestions,2);
 v=await ok(await step());assert.equal(v.recognizedQuestions,1);
 v=await ok(await step());assert.equal(v.status,'complete');assert.ok(v.paperId);
 const again=await ok(await step());assert.equal(again.paperId,v.paperId);assert.equal(calls,3);
 const paper=await ok(await call('/api/question-bank/papers/'+v.paperId+query,'GET',undefined,a.token));
 assert.equal(paper.mode,'paper-draft');assert.equal(paper.subject,'math');assert.equal(paper.classification.examType,'midterm');
 assert.equal(paper.questions.length,2);assert.ok(paper.questions.every((q:any)=>q.answer===''));
 assert.equal((await db.query('SELECT g."Id" FROM "GrowingPhotoGrades" g JOIN "GrowingPhotoQuestions" q ON q."Id"=g."QuestionId" JOIN "GrowingQuestionPapers" p ON p."Id"=q."PaperId" WHERE p."StudentId"=?1',[a.user.id])).length,0);
 assert.equal((await db.query('SELECT * FROM "GrowingQuestionPapers" WHERE "StudentId"=?1',[a.user.id])).length,1);
 assert.deepEqual(await db.query('PRAGMA foreign_key_check'),[]);
});
