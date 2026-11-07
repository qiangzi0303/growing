import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {createHandler,type Env} from '../src/index';
import {connect,type Database} from '../src/database';
import {validatePaper} from '../src/question-bank';
import {validateAssessment} from '../src/photo-assessment';
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database,output:any,calls:any[]=[];
const env={AUTH_LIMITER:{limit:async()=>({success:true})},AI_LIMITER:{limit:async()=>({success:true})},HANDWRITING_VISION_MODELS:JSON.stringify([{name:'test',model:'test',endpoint:'https://vision.test/v1',apiKey:'test-only'}]),ASSETS:{fetch:async()=>new Response('asset')}} as unknown as Env;
const handler=createHandler(()=>db,(async(_url,options)=>{calls.push(JSON.parse(options!.body as string));return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]});}) as typeof fetch);
const pages=['data:image/jpeg;base64,/9j/AA==','data:image/jpeg;base64,/9j/AQ=='];
const grade=()=>({verdict:'unanswered',score:null,studentAnswer:'',feedback:'空白',corrections:[],knowledge:[],models:[]});
const paper=()=>({format:'english-text-v1',title:'English paper',warnings:[],questions:[{number:'Reading 1 (1–5)',text:'Read the passage.\n  Alice said, "I am in Class A."\n\n(1) Who is Alice?\nA. A pupil  B. A teacher\n(2) Write TWO words: ____ ____',answer:'',unitId:'english-8a-01',confidence:.95,reason:'阅读理解',uncertain:[],pages:[1,2],regions:[],figures:[{page:1,x:.1,y:.1,width:.2,height:.2}],...grade()}]});
async function call(path:string,method='GET',data?:unknown,token?:string){return handler(new Request('https://learn.test/api'+path,{method,headers:{'Content-Type':'application/json','X-Growing-Client':'1',...(token?{Authorization:'Bearer '+token}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})}),env,{waitUntil:()=>{}});}
async function register(role='Student'){const r=await call('/auth/register','POST',{username:'english_'+crypto.randomUUID().replaceAll('-','').slice(0,12),displayName:'测试',password:'Test-Only-1987!',role});assert.equal(r.status,200);return r.json() as Promise<any>;}
before(async()=>{db=connect(await mf.getD1Database('DB') as unknown as D1Database);for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));}});
after(async()=>{await mf.dispose();});
test('English paper lifecycle preserves grouped material, subject filtering, authorization and immutable original images',async()=>{
 const u=await register(),other=await register(),parent=await register('Parent');output=paper();
 const input={studentId:u.user.id,requestId:crypto.randomUUID(),pages,mode:'paper',subject:'english'};
 let r=await call('/question-bank/import','POST',input,u.token);assert.equal(r.status,200,await r.clone().text());const saved=await r.json() as any;
 assert.equal(saved.questions[0].subject,'english');assert.equal(saved.questions[0].format,'english-text-v1');assert.equal(saved.questions[0].text,paper().questions[0].text);assert.ok(!saved.questions[0].uncertain.some((s:string)=>s.includes('SVG')));
 const context=JSON.parse(calls.at(-1).messages[1].content[0].text);assert.ok(context.units.every((x:any)=>x.subject==='english'));assert.deepEqual(context.geometryModels,[]);
 r=await call('/question-bank/papers/'+saved.paperId+'?studentId='+u.user.id,'GET',undefined,u.token);const detail=await r.json() as any;assert.equal(detail.subject,'english');assert.equal(detail.pages.length,2);
 assert.equal((await (await call('/question-bank/import','POST',input,u.token)).json() as any).paperId,saved.paperId);
 output={...paper(),format:'math-text-v1',questions:[{...paper().questions[0],text:'计算。',unitId:'math-8a-01',figures:[]}]};
 const legacy=await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),pages,mode:'paper'},u.token);assert.equal(legacy.status,200);assert.notEqual((await legacy.json() as any).paperId,saved.paperId);
 for(const subject of ['english','math']){const rows=await (await call('/question-bank/papers?studentId='+u.user.id+'&subject='+subject,'GET',undefined,u.token)).json() as any[];assert.equal(rows.length,1);assert.equal(rows[0].subject,subject);}
 assert.equal((await (await call('/question-bank/papers?studentId='+u.user.id,'GET',undefined,u.token)).json() as any[]).length,2);
 assert.equal((await call('/question-bank/import','POST',{...input,subject:'unknown'},u.token)).status,400);
 assert.equal((await call('/question-bank/papers?studentId='+u.user.id+'&subject=unknown','GET',undefined,u.token)).status,400);
 assert.equal((await call('/question-bank/papers?studentId='+u.user.id+'&subject=english','GET',undefined,other.token)).status,404);
 assert.equal((await call('/question-bank/papers?studentId='+u.user.id+'&subject=english','GET',undefined,parent.token)).status,404);
 await db.query('INSERT INTO "GrowingFamilyLinks" ("StudentId","ParentId","CreatedAt") VALUES (?1,?2,?)',[u.user.id,parent.user.id,'2026-11-07']);assert.equal((await call('/question-bank/papers?studentId='+u.user.id+'&subject=english','GET',undefined,parent.token)).status,200);
 const q=saved.questions[0];r=await call('/question-bank/questions/'+q.id,'PUT',{studentId:u.user.id,revision:1,number:q.number,text:q.text,answer:'',unitId:'math-8a-01'},u.token);assert.equal(r.status,400);
 output={...grade(),verdict:'correct',score:100,studentAnswer:'Alice',feedback:'Correct.'};r=await call('/question-bank/questions/'+q.id+'/correct','POST',{studentId:u.user.id,revision:1,requestId:crypto.randomUUID(),studentAnswer:'Alice'},u.token);assert.equal(r.status,200,await r.clone().text());const corrected=await r.json() as any;
 assert.deepEqual(JSON.parse(calls.at(-1).messages[1].content[0].text).geometryModels,[]);assert.match(calls.at(-1).messages[0].content,/英语/);
 output={reply:'Alice is a pupil.'};assert.equal((await call('/question-bank/questions/'+q.id+'/followup','POST',{studentId:u.user.id,gradeId:corrected.grade.id,requestId:crypto.randomUUID(),prompt:'Why?'},u.token)).status,200);assert.match(calls.at(-1).messages[0].content,/英语/);
});
test('English validation never truncates groups and rejects cross-subject units and mathematical knowledge even without a unit',()=>{
 const p=paper();assert.ok(validatePaper(p,2,'english'));assert.equal(validatePaper({...p,questions:[{...p.questions[0],unitId:'math-8a-01'}]},2,'english'),null);
 assert.ok(validatePaper({...p,questions:Array.from({length:80},(_,i)=>({...p.questions[0],number:String(i+1)}))},2,'english'));
 assert.equal(validatePaper({...p,questions:Array.from({length:121},(_,i)=>({...p.questions[0],number:String(i+1)}))},2,'english'),null);
 assert.equal(validateAssessment({...grade(),knowledge:[{nodeId:'add',role:'tested',confidence:.95,reason:'数学'}]},'',undefined,'english'),null);
});
test('incomplete and oversized English results save no partial papers; blank and unclear work remain ungraded',async()=>{
 const u=await register();
 for(const questions of [[],Array.from({length:121},(_,i)=>({...paper().questions[0],number:String(i+1)})),[paper().questions[0],{...paper().questions[0],text:''}]]){
  output={...paper(),questions};const r=await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),pages,mode:'paper',subject:'english'},u.token);assert.equal(r.status,502);
  assert.equal((await (await call('/question-bank/papers?studentId='+u.user.id,'GET',undefined,u.token)).json() as any[]).length,0);
 }
 output=paper();output.questions[0]={...output.questions[0],verdict:'review',score:null,studentAnswer:'【不清楚】',feedback:'无法确认手写',answerRegions:[]};
 const r=await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),pages,mode:'paper',subject:'english'},u.token);assert.equal(r.status,200);
 const q=(await r.json() as any).questions[0];assert.equal(q.answer,'');assert.equal(q.grades[0].result.studentAnswer,'');assert.equal(q.grades[0].result.score,null);assert.deepEqual(q.grades[0].result.corrections,[]);
 assert.equal((await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1',[u.user.id])).length,0);
});
test('English handwritten image questions require isolated illustrations and never send old answer pages',async()=>{
 const u=await register();output=paper();const saved=await (await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),pages,mode:'paper',subject:'english'},u.token)).json() as any,q=saved.questions[0];
 const path='/question-bank/questions/'+q.id,answer='data:image/png;base64,iVBORw0KGgoAAA==',figure='data:image/jpeg;base64,/9j/Ag==';
 const input={studentId:u.user.id,revision:1,requestId:crypto.randomUUID(),answerPages:[answer]};
 output={...grade(),verdict:'correct',score:100,studentAnswer:'Alice',feedback:'Correct.',answerAnnotations:[]};
 const beforeCalls=calls.length;assert.equal((await call(path+'/correct','POST',input,u.token)).status,409);assert.equal(calls.length,beforeCalls);
 assert.equal((await call(path+'/figures','PUT',{studentId:u.user.id,figureVersion:q.figureVersion,image:figure},u.token)).status,200);
 const corrected=await call(path+'/correct','POST',input,u.token);assert.equal(corrected.status,200);const savedGrade=(await corrected.json() as any).grade;
 const body=calls.at(-1),ctx=JSON.parse(body.messages[1].content[0].text);assert.equal(ctx.answerPageCount,1);assert.equal(ctx.questionFigureCount,1);assert.deepEqual(ctx.imageSourcePages,[]);
 assert.deepEqual(body.messages[1].content.filter((x:any)=>x.type==='image_url').map((x:any)=>x.image_url.url),[answer,figure]);
 output={reply:'Compare the illustration.'};assert.equal((await call(path+'/followup','POST',{studentId:u.user.id,gradeId:savedGrade.id,requestId:crypto.randomUUID(),prompt:'Why?'},u.token)).status,200);
 const follow=calls.at(-1),followContext=JSON.parse(follow.messages[1].content[0].text);assert.equal(followContext.questionFigureCount,1);assert.deepEqual(followContext.imageSourcePages,[]);assert.deepEqual(follow.messages[1].content.filter((x:any)=>x.type==='image_url').map((x:any)=>x.image_url.url),[answer,figure]);
});
