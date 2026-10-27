import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { createHandler, type Env } from "../src/index";
import { connect, type Database, Store, nowSql } from "../src/database";
import { hash, passwordHash, verifyPassword } from "../src/auth";
import { rankingStatements } from '../src/rankings';
import rankingRules from '../src/ranking-rules.json';
import diagnosis from '../../app/src/main/assets/web/app-design/diagnosis-engine.js';
import diagnosisRules from '../src/diagnosis-rules.json';

const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', compatibilityDate: '2026-10-22', d1Databases: ['DB'] }));
let db: Database;
let aiMode = 'ok', aiRequests: {url:string;headers:Headers;data:any}[] = [];
let paperOutput:any={format:'math-text-v1',title:'混合试卷',warnings:['第2页有图形，请核对原图'],questions:[
  {number:'1',text:String.raw`计算 \(\frac{x^{2}-1}{x-1}\)，其中 \(x\ne1\)。`,answer:'',unitId:'math-8b-10',confidence:.98,reason:'分式化简',uncertain:[],pages:[1]},
  {number:'2',text:'图中给定条件【不清楚】',answer:'',unitId:'invented-unit',confidence:.99,reason:'不能匹配',uncertain:['图中条件需核对'],pages:[2]},
  {number:'3',text:'Read about friendship.',answer:'',unitId:'english-8a-01',confidence:.5,reason:'仅凭主题不能确定',uncertain:[],pages:[2]},
]};
let formatOutput:any={format:'math-text-v1',text:String.raw`计算 \(\frac{x^{2}-1}{x-1}\)。`,answer:'',uncertain:[]};
let formatHook:(()=>Promise<void>)|undefined;
const handler = createHandler(() => db, (async (url: string | URL | Request, options?: RequestInit) => {
  aiRequests.push({url:String(url),headers:new Headers(options?.headers),data:JSON.parse(options?.body as string)});
  if(aiMode==='network')throw Error('upstream-private-details');
  if(aiMode==='failure')return new Response('upstream-private-details',{status:401});
  if(aiMode==='forbidden')return new Response('upstream-private-details',{status:403});
  if(aiMode==='invalid')return Response.json({not:'a completion'});
  if(aiMode==='large')return new Response('x'.repeat(256001));
  if(aiMode==='format'){const hook=formatHook;formatHook=undefined;if(hook)await hook();return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(formatOutput)}}]});}
  if(aiMode==='paper')return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(paperOutput)}}]});
  const content=aiMode==='bad-recognition'?'{"text":"","uncertain":[]}':'{"text":"第1页：x=2","uncertain":[]}';
  return Response.json({choices:[{finish_reason:aiMode==='truncated'?'length':'stop',message:{content:aiMode==='empty'?'':content,reasoning_content:'private reasoning'}}],private:'must-not-return'});
}) as typeof fetch);
const pg = { query: async <T = Record<string, any>>(sql: string, params: unknown[] = []) => ({ rows: await db.query<T>(sql, params) }) };
let limited = false;
let aiLimited = false;
const env = {
  ASSETS: { fetch: async (request: Request) => {
    const path = new URL(request.url).pathname;
    try {
      const file = await readFile(new URL("../public" + path, import.meta.url));
      return new Response(new Uint8Array(file), { headers: { "Content-Type": path.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript" } });
    } catch { return new Response("Not found", { status: 404 }); }
  } },
  AUTH_LIMITER: { limit: async () => ({ success: !limited }) },
  AI_LIMITER: { limit: async () => ({ success: !aiLimited }) },
  HANDWRITING_VISION_MODELS: JSON.stringify([{name:'test-vision',model:'test-vision',endpoint:'https://vision.test/v1',apiKey:'server-only-test-secret'}]),
} as unknown as Env;
const context = { waitUntil: (_promise: Promise<unknown>) => {} };
let counter = 0;
const password = "Test-Only-1987!";
async function call(path: string, method = "GET", data?: unknown, token?: string, extra: Record<string, string> = {}) {
  const request = new Request("https://learn.test" + path, { method, headers: { "X-Growing-Client": "1", "CF-Connecting-IP": "192.0.2.1", "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...extra }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  return handler(request, env, context);
}
async function register(role = "Student") {
  const name = "user_" + ++counter;
  const response = await call("/api/auth/register", "POST", { username: name, displayName: name, role, password });
  assert.equal(response.status, 200, await response.clone().text());
  return { ...await response.json() as any, name, response };
}
const invite = async (token: string) => (await (await call("/api/student/invitations", "POST", undefined, token)).json() as any).code;
before(async () => {
  db = connect(await mf.getD1Database('DB') as unknown as D1Database);
  const sql = await readFile(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8');
  const statements = sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql}));
  await db.batch(statements); await db.batch(statements);
  const rankings=await readFile(new URL('../migrations/0003_rankings.sql',import.meta.url),'utf8');
  await db.batch(rankings.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
  const diagnosisMigration=await readFile(new URL('../migrations/0004_diagnosis_rankings.sql',import.meta.url),'utf8');
  const fixture=crypto.randomUUID();
  await db.query(`INSERT INTO "GrowingUsers" ("Id","Username","NormalizedName","DisplayName","Role","PasswordHash","CreatedAt") VALUES (?1,?2,?2,'migration','Student','test-only',${nowSql})`,[fixture,'migration_'+fixture.slice(0,8)]);
  await db.query(`INSERT INTO "GrowingDocuments" ("StudentId","Key","Value","Revision","UpdatedAt") VALUES (?1,'growing-math-lessons-v1','{"preserved":true}',1,${nowSql})`,[fixture]);
  await db.query(`INSERT INTO "GrowingRankings" ("StudentId","BoardId","Kind","Subject","Term","Title","ConceptDone","ConceptTotal","TestDone","TestTotal","Score","UpdatedAt") VALUES (?1,'math-8a-01','unit','math','upper','migration',6,12,12,12,8500,${nowSql})`,[fixture]);
  await db.batch(diagnosisMigration.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
  const [migrated]=await db.query<any>('SELECT * FROM "GrowingRankings" WHERE "StudentId"=?1',[fixture]);
  assert.equal(migrated.Score,5500);assert.equal(migrated.DiagnosisDone,0);assert.equal(migrated.DiagnosisTotal,12);
  assert.equal((await db.query<any>('SELECT "Value" FROM "GrowingDocuments" WHERE "StudentId"=?1',[fixture]))[0].Value,'{"preserved":true}');
  const roleMigration=await readFile(new URL('../migrations/0005_role_confirmation.sql',import.meta.url),'utf8');
  await db.batch(roleMigration.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
  const [legacyRole]=await db.query<any>('SELECT "Role", "RoleConfirmed" FROM "GrowingUsers" WHERE "Id"=?1',[fixture]);
  assert.equal(legacyRole.Role,'Student');assert.equal(legacyRole.RoleConfirmed,0);
  assert.equal((await db.query<any>('SELECT "Value" FROM "GrowingDocuments" WHERE "StudentId"=?1',[fixture]))[0].Value,'{"preserved":true}');
  await db.batch(['GrowingRankings','GrowingDocuments'].map(table=>({sql:`DELETE FROM "${table}" WHERE "StudentId"=?1`,params:[fixture]})));
  await db.query('DELETE FROM "GrowingUsers" WHERE "Id"=?1',[fixture]);
  const photoMigration=await readFile(new URL('../migrations/0007_photo_question_bank.sql',import.meta.url),'utf8');
  const photoStatements=photoMigration.split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql}));
  await db.batch(photoStatements);await db.batch(photoStatements);
  const timeMigration=await readFile(new URL('../migrations/0008_study_time.sql',import.meta.url),'utf8');
  const timeStatements=timeMigration.split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql}));
  await db.batch(timeStatements);await db.batch(timeStatements);
  const attemptMigration=await readFile(new URL('../migrations/0009_question_attempts.sql',import.meta.url),'utf8');
  const attemptStatements=attemptMigration.split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql}));
  await db.batch(attemptStatements);await db.batch(attemptStatements);
  const mathMigration=await readFile(new URL('../migrations/0010_math_question_format.sql',import.meta.url),'utf8');
  await db.batch(mathMigration.split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
});
after(async () => { await mf.dispose(); });

const photoPages=['data:image/jpeg;base64,/9j/AA==','data:image/jpeg;base64,/9j/AQ=='];
test('question attempts count repeated mistakes per student and keep lifetime mistakes after correct answers',async()=>{
  const s=await register(),other=await register(),p=await register('Parent'),a=await administrator();await bindStudent(s,p);
  const path='/api/question-bank/attempts',questionId='1025141010-28';
  const input={studentId:s.user.id,kind:'math',questionId,attemptId:crypto.randomUUID(),correct:false};
  const duplicates=await Promise.all([call(path,'POST',input,s.token),call(path,'POST',input,s.token)]);
  for(const r of duplicates){assert.equal(r.status,200);assert.equal((await r.json() as any).wrongCount,1);}
  assert.equal((await call(path,'POST',{...input,correct:true},s.token)).status,409);
  assert.equal((await call(path,'POST',{...input,questionId:'1025141010-29'},s.token)).status,409);
  let response=await call(path,'POST',{...input,attemptId:crypto.randomUUID()},p.token);assert.equal(response.status,200);
  let report=await response.json() as any;assert.equal(report.wrongCount,2);assert.equal(report.totalCount,2);
  response=await call(path,'POST',{...input,attemptId:crypto.randomUUID(),correct:true},s.token);report=await response.json() as any;
  assert.equal(report.wrongCount,2);assert.equal(report.correctCount,1);assert.equal(report.totalCount,3);
  assert.equal(report.rows.length,3);assert.equal(report.rows[0].correct,1);assert.ok(report.rows.every((r:any)=>Number.isFinite(Date.parse(r.at))));
  const repeatedPath='/api/question-bank/repeated?studentId='+s.user.id;
  const repeated=await (await call(repeatedPath,'GET',undefined,p.token)).json() as any;
  assert.equal(repeated.total,1);assert.equal(repeated.rows[0].questionId,questionId);assert.equal(repeated.rows[0].wrongCount,2);assert.ok(repeated.rows[0].title.includes('分式'));
  assert.equal((await call(repeatedPath,'GET',undefined,other.token)).status,404);
  assert.equal((await call(repeatedPath+'&page=0','GET',undefined,s.token)).status,400);
  const query='?studentId='+s.user.id+'&kind=math&questionId='+questionId;
  assert.equal((await call(path+query,'GET',undefined,other.token)).status,404);
  assert.equal((await call(path,'POST',{...input,attemptId:crypto.randomUUID()},other.token)).status,404);
  assert.equal((await call(path+query,'GET',undefined,a.token)).status,200);
  const own=await (await call('/api/question-bank/attempt-stats?studentId='+other.user.id+'&kind=math','GET',undefined,other.token)).json();assert.deepEqual(own,[]);
  await call('/api/student/parents/'+p.user.id,'DELETE',undefined,s.token);
  assert.equal((await call(path+query,'GET',undefined,p.token)).status,404);
  assert.equal((await call(repeatedPath,'GET',undefined,p.token)).status,404);
  assert.equal((await call(path,'POST',{...input,attemptId:crypto.randomUUID()},p.token)).status,404);
});

test('question attempts reject forged counters and unknown questions, and history is paginated without losing totals',async()=>{
  const s=await register(),path='/api/question-bank/attempts';
  const input={studentId:s.user.id,kind:'math',questionId:'1025141010-01',attemptId:crypto.randomUUID(),correct:false};
  assert.equal((await call(path,'POST',input)).status,401);
  for(const patch of [{correct:0},{correct:'false'},{attemptId:'bad'},{wrongCount:100},{totalCount:100},{createdAt:'2020-01-01'}])
    assert.equal((await call(path,'POST',{...input,...patch},s.token)).status,400);
  assert.equal((await call(path,'POST',{...input,questionId:'1025141010-99'},s.token)).status,404);
  assert.equal((await call(path,'POST',{...input,kind:'invented'},s.token)).status,400);
  for(let i=0;i<23;i++)assert.equal((await call(path,'POST',{...input,attemptId:crypto.randomUUID(),correct:i%2===0},s.token)).status,200);
  const query='?studentId='+s.user.id+'&kind=math&questionId='+input.questionId;
  const first=await (await call(path+query,'GET',undefined,s.token)).json() as any;
  const second=await (await call(path+query+'&page=2','GET',undefined,s.token)).json() as any;
  assert.equal(first.totalCount,23);assert.equal(first.wrongCount,11);assert.equal(first.correctCount,12);
  assert.equal(first.rows.length,20);assert.equal(second.rows.length,3);assert.equal(second.totalCount,23);
  assert.equal(new Set([...first.rows,...second.rows].map(r=>r.attemptId)).size,23);
  assert.equal((await call(path+query+'&page=0','GET',undefined,s.token)).status,400);
});

test('photo question mistake counts survive edits and repeated-only filtering is applied before pagination',async()=>{
  const s=await register(),other=await register();aiMode='paper';
  let imported:any;try{imported=await (await call('/api/question-bank/import','POST',{studentId:s.user.id,requestId:crypto.randomUUID(),pages:photoPages},s.token)).json();}finally{aiMode='ok';}
  const q=imported.questions[0],path='/api/question-bank/attempts';
  for(let i=0;i<2;i++)assert.equal((await call(path,'POST',{studentId:s.user.id,kind:'photo',questionId:q.id,attemptId:crypto.randomUUID(),correct:false},s.token)).status,200);
  assert.equal((await call(path,'POST',{studentId:other.user.id,kind:'photo',questionId:q.id,attemptId:crypto.randomUUID(),correct:false},other.token)).status,404);
  const list='/api/question-bank/questions?studentId='+s.user.id+'&repeated=1';
  let filtered=await (await call(list,'GET',undefined,s.token)).json() as any;assert.equal(filtered.total,1);assert.equal(filtered.rows[0].id,q.id);
  assert.equal((await call('/api/question-bank/questions/'+q.id,'PUT',{studentId:s.user.id,number:'新题号',text:q.text,answer:q.answer,unitId:'math-8a-01',revision:q.revision},s.token)).status,200);
  filtered=await (await call(list+'&unitId=math-8a-01','GET',undefined,s.token)).json() as any;assert.equal(filtered.total,1);
  const counts=await (await call('/api/question-bank/attempt-stats?studentId='+s.user.id+'&kind=photo','GET',undefined,s.token)).json() as any[];
  assert.equal(counts[0].wrongCount,2);assert.equal(counts[0].questionId,q.id);
  assert.deepEqual(await (await call('/api/question-bank/attempt-stats?studentId='+s.user.id+'&kind=math','GET',undefined,s.token)).json(),[]);
});

test('subject time reports keep today and lifetime totals, deduplicate syncs and survive course reset',async()=>{
  const s=await register(),p=await register('Parent'),a=await administrator();await bindStudent(s,p);
  const today=new Date(Date.now()+8*3600000).toISOString().slice(0,10),yesterday=new Date(Date.parse(today+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  const key='growing-activity-v1:'+crypto.randomUUID(),path='/api/student/state/'+key,activity={days:{[yesterday]:{数学:60},[today]:{数学:120,英语:240,物理:30}}};
  const save=async(key:string,value:any,revision:number)=>{const response=await call('/api/student/state/'+key,'PUT',{revision,value:value===null?null:JSON.stringify(value)},s.token);assert.equal(response.status,200,await response.clone().text());};
  await save(key,activity,0);await save(key,activity,1);
  const course='growing-math-lessons-v1';await save(course,{tools:{days:{[today]:{a:{ms:300000}}}}},0);
  const report=async()=>await (await call('/api/admin/students/'+s.user.id+'/report?days=7','GET',undefined,a.token)).json() as any;
  let r=await report();assert.equal(r.report.today,today);assert.equal(r.report.timezone,'Asia/Shanghai');
  assert.equal(r.report.subjects[0].todayMinutes,5);assert.equal(r.report.subjects[0].totalMinutes,6);
  assert.equal(r.report.subjects[1].todayMinutes,4);assert.equal(r.report.subjects[2].todayMinutes,.5);
  await save(course,{topics:{}},1);r=await report();assert.equal(r.report.subjects[0].totalMinutes,6);
  await save(key,null,2);r=await report();assert.equal(r.report.subjects[0].todayMinutes,5);assert.equal(r.report.subjects[1].totalMinutes,4);
  assert.equal(r.growth.points.at(-1).subjects[0].minutes,5);
  const parent=await (await call('/api/parent/children/'+s.user.id+'/report','GET',undefined,p.token)).json() as any;assert.deepEqual(parent.subjects,r.report.subjects);
  const second=await register();const isolated=await (await call('/api/admin/students/'+second.user.id+'/report','GET',undefined,a.token)).json() as any;assert.ok(isolated.report.subjects.every((x:any)=>x.totalMinutes===0&&x.todayMinutes===0));
});
test('photo bank authenticates uploads and rejects invalid images or target students before AI',async()=>{
  const s=await register(),p=await register('Parent'),input={studentId:s.user.id,requestId:crypto.randomUUID(),pages:photoPages},path='/api/question-bank/import';
  const before=aiRequests.length;
  assert.equal((await call(path,'POST',input)).status,401);
  assert.equal((await call(path,'POST',input,p.token)).status,404);
  assert.equal((await call(path,'POST',input,s.token,{'X-Growing-Client':''})).status,400);
  for(const patch of [{pages:[]},{pages:Array(5).fill(photoPages[0])},{pages:['https://private.test/photo']},{pages:['data:image/svg+xml;base64,AA==']},{pages:['data:image/jpeg;base64,/9j/'+'A'.repeat(500000)]},{requestId:'invalid'},{model:'override'},{endpoint:'https://private.test'}])
    assert.equal((await call(path,'POST',{...input,...patch},s.token)).status,400);
  assert.equal(aiRequests.length,before);
  aiLimited=true;try{assert.equal((await call(path,'POST',input,s.token)).status,429);}finally{aiLimited=false;}
  const catalog=await (await call('/api/question-bank/catalog','GET',undefined,s.token)).json() as any[];
  assert.equal(catalog.length,24);assert.ok(catalog.some(u=>u.id==='math-8b-10'));assert.ok(!catalog.some(u=>u.id.startsWith('english-8b')));
});

test('photo imports persist standard math without originals atomically, classify uncertain questions, deduplicate concurrent retries and allow reviewed corrections',async()=>{
  const s=await register(),other=await register(),p=await register('Parent'),a=await administrator();await bindStudent(s,p);
  const input={studentId:s.user.id,requestId:crypto.randomUUID(),pages:photoPages},path='/api/question-bank/import';aiMode='paper';
  try{
    const responses=await Promise.all([call(path,'POST',input,p.token),call(path,'POST',{...input,requestId:crypto.randomUUID()},s.token)]);
    for(const r of responses)assert.equal(r.status,200,await r.clone().text());
    const [first,second]=await Promise.all(responses.map(r=>r.json())) as any[];
    assert.equal(first.paperId,second.paperId);assert.equal(first.questions.length,3);assert.ok(first.questions.every((q:any)=>!q.reviewed));
    assert.deepEqual(first.questions.map((q:any)=>q.unitId),['math-8b-10','','']);
    assert.ok(first.questions.every((q:any)=>q.answer===''));
    const sent=aiRequests.at(-1)!;assert.equal(sent.data.messages[1].content.filter((c:any)=>c.type==='image_url').length,2);
    assert.equal(sent.headers.get('Authorization'),'Bearer server-only-test-secret');
    assert.equal(JSON.stringify(first).includes('server-only-test-secret'),false);
    const before=aiRequests.length;
    const retry=await call(path,'POST',input,s.token);assert.equal(retry.status,200);assert.equal((await retry.json() as any).duplicate,true);assert.equal(aiRequests.length,before);
    assert.equal((await call(path,'POST',{...input,pages:[photoPages[1]]},s.token)).status,409);
    const query='?studentId='+s.user.id;
    const all=await (await call('/api/question-bank/questions'+query,'GET',undefined,s.token)).json() as any;
    assert.equal(all.total,3);assert.equal((await (await call('/api/question-bank/questions'+query+'&unitId=','GET',undefined,p.token)).json() as any).total,2);
    const originalPath='/api/question-bank/papers/'+first.paperId+query;
    const source=await call(originalPath,'GET',undefined,p.token);assert.equal(source.status,200);assert.equal(source.headers.get('cache-control'),'no-store');
    assert.deepEqual((await source.json() as any).pages,[]);
    assert.ok(first.questions.every((q:any)=>q.format==='math-text-v1'));
    assert.equal((await db.query<any>('SELECT count(*) AS n FROM "GrowingQuestionPages" WHERE "PaperId"=?1',[first.paperId]))[0].n,0);
    for(const token of [other.token])for(const target of [originalPath,'/api/question-bank/questions'+query])assert.equal((await call(target,'GET',undefined,token)).status,404);
    assert.equal((await call(originalPath,'GET',undefined,a.token)).status,200);
    const q=all.rows.find((q:any)=>q.unitId===''),edit={studentId:s.user.id,revision:q.revision,number:q.number,text:'核对后的完整题目',answer:'家长补充的答案',unitId:'physics-8a-02'},editPath='/api/question-bank/questions/'+q.id;
    assert.equal((await call(editPath,'PUT',edit,other.token)).status,404);
    assert.equal((await call(editPath,'PUT',{...edit,unitId:'made-up'},p.token)).status,400);
    assert.equal((await call(editPath,'PUT',edit,p.token)).status,200);
    assert.equal((await call(editPath,'PUT',edit,s.token)).status,409);
    const corrected=await (await call('/api/question-bank/questions'+query+'&unitId=physics-8a-02','GET',undefined,s.token)).json() as any;
    assert.equal(corrected.total,1);assert.equal(corrected.rows[0].reviewed,true);assert.equal(corrected.rows[0].text,edit.text);
    await call('/api/student/parents/'+p.user.id,'DELETE',undefined,s.token);
    assert.equal((await call(originalPath,'GET',undefined,p.token)).status,404);
    assert.equal((await call(editPath,'PUT',{...edit,revision:2},p.token)).status,404);
  }finally{aiMode='ok';}
});

test('legacy photo questions become standard math without changing identity, review state or attempt history',async()=>{
  const s=await register(),other=await register(),parent=await register('Parent');await bindStudent(s,parent);
  let q:any;
  aiMode='paper';try{q=(await (await call('/api/question-bank/import','POST',{studentId:s.user.id,requestId:crypto.randomUUID(),pages:photoPages},s.token)).json() as any).questions[0];}finally{aiMode='ok';}
  await db.query(`UPDATE "GrowingPhotoQuestions" SET "Text"='计算 (x²-1)/(x-1)。',"Format"='legacy',"Reviewed"=1,"Revision"=4 WHERE "Id"=?1`,[q.id]);
  await db.query('INSERT INTO "GrowingQuestionPages" ("PaperId","Page","Image") VALUES (?1,1,?2)',[q.paperId,photoPages[0]]);
  await call('/api/question-bank/attempts','POST',{studentId:s.user.id,kind:'photo',questionId:q.id,attemptId:crypto.randomUUID(),correct:false},s.token);
  const path='/api/question-bank/questions/'+q.id+'/format',input={studentId:s.user.id,revision:4},before=aiRequests.length,original=structuredClone(formatOutput);
  assert.equal((await call(path,'POST',input,other.token)).status,404);
  assert.equal((await call(path,'POST',{...input,revision:3},s.token)).status,409);
  assert.equal(aiRequests.length,before);
  aiMode='format';
  try{
    formatOutput={...original,text:String.raw`\(\frac{x}{\)`};
    assert.equal((await call(path,'POST',input,parent.token)).status,502);
    assert.equal((await db.query<any>('SELECT "Revision" AS r,"Format" AS f FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[q.id]))[0].r,4);
    formatOutput=original;
    assert.equal((await call(path,'POST',input,parent.token)).status,200);
    const sent=aiRequests.at(-1)!;assert.equal(sent.data.messages[1].content.filter((p:any)=>p.type==='image_url').length,0,'reviewed text is authoritative');
    const converted=(await (await call('/api/question-bank/questions?studentId='+s.user.id,'GET',undefined,s.token)).json() as any).rows[0];
    assert.equal(converted.id,q.id);assert.equal(converted.revision,5);assert.equal(converted.reviewed,true);assert.equal(converted.unitId,q.unitId);assert.equal(converted.format,'math-text-v1');assert.equal(converted.text,original.text);
    const stats=await (await call('/api/question-bank/attempt-stats?studentId='+s.user.id+'&kind=photo','GET',undefined,s.token)).json() as any[];assert.equal(stats.find(r=>r.questionId===q.id).wrongCount,1);
    const count=aiRequests.length;assert.equal((await call(path,'POST',input,s.token)).status,200);assert.equal(aiRequests.length,count);
    for(const text of [String.raw`\(\unknowncommand{x}\)`,'<img src=x>','计算 x²=1'])assert.equal((await call('/api/question-bank/questions/'+q.id,'PUT',{...input,revision:5,number:q.number,text,answer:'',unitId:q.unitId},s.token)).status,400);
  }finally{aiMode='ok';formatOutput=original;formatHook=undefined;}
});

test('legacy math conversion cannot overwrite a concurrent correction or outlive a parent binding',async()=>{
  const s=await register(),p=await register('Parent');await bindStudent(s,p);
  let q:any;aiMode='paper';try{q=(await (await call('/api/question-bank/import','POST',{studentId:s.user.id,requestId:crypto.randomUUID(),pages:photoPages},s.token)).json() as any).questions[0];}finally{aiMode='ok';}
  await db.query(`UPDATE "GrowingPhotoQuestions" SET "Format"='legacy' WHERE "Id"=?1`,[q.id]);
  const path='/api/question-bank/questions/'+q.id+'/format';aiMode='format';
  try{
    formatHook=async()=>{await db.query(`UPDATE "GrowingPhotoQuestions" SET "Text"='人工核对内容',"Revision"="Revision"+1 WHERE "Id"=?1`,[q.id]);};
    assert.equal((await call(path,'POST',{studentId:s.user.id,revision:1},s.token)).status,409);
    assert.equal((await db.query<any>('SELECT "Text" AS t FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[q.id]))[0].t,'人工核对内容');
    formatHook=async()=>{await call('/api/student/parents/'+p.user.id,'DELETE',undefined,s.token);};
    assert.equal((await call(path,'POST',{studentId:s.user.id,revision:2},p.token)).status,404);
    assert.equal((await db.query<any>('SELECT "Revision" AS r FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[q.id]))[0].r,2);
  }finally{aiMode='ok';formatHook=undefined;}
});

test('incomplete photo recognition, missing configuration and provider failures leave the bank empty',async()=>{
  const s=await register(),input={studentId:s.user.id,requestId:crypto.randomUUID(),pages:photoPages},path='/api/question-bank/import',original=structuredClone(paperOutput),config=env.HANDWRITING_VISION_MODELS;
  try{
    env.HANDWRITING_VISION_MODELS='[]';assert.equal((await call(path,'POST',input,s.token)).status,503);env.HANDWRITING_VISION_MODELS=config;
    aiMode='paper';paperOutput={...original,questions:[]};assert.equal((await call(path,'POST',input,s.token)).status,502);
    paperOutput=structuredClone(original);paperOutput.questions[0].pages=[3];assert.equal((await call(path,'POST',input,s.token)).status,502);
    for(const text of [String.raw`\(\frac{x}{\)`,'![题目](https://example.test/photo.png)','计算 x²=1']){paperOutput=structuredClone(original);paperOutput.questions[0].text=text;assert.equal((await call(path,'POST',input,s.token)).status,502);}
    paperOutput=original;aiMode='truncated';assert.equal((await call(path,'POST',input,s.token)).status,502);
    aiMode='failure';const failed=await call(path,'POST',input,s.token);assert.equal(failed.status,502);assert.equal((await failed.text()).includes('upstream-private-details'),false);
    const rows=await (await call('/api/question-bank/questions?studentId='+s.user.id,'GET',undefined,s.token)).json() as any;assert.equal(rows.total,0);
    assert.equal((await db.query<any>('SELECT count(*) AS n FROM "GrowingQuestionPages" p JOIN "GrowingQuestionPapers" b ON b."Id"=p."PaperId" WHERE b."StudentId"=?1',[s.user.id]))[0].n,0);
  }finally{paperOutput=original;env.HANDWRITING_VISION_MODELS=config;aiMode='ok';}
});

test('handwriting vision authenticates, validates images, protects credentials and falls back', async()=>{
  const student=await register(),parent=await register('Parent'),path='/api/handwriting/ai';
  const input={kind:'recognize',subject:'math',unitId:'math-8b-10',prompt:'计算 2+3',pages:['data:image/png;base64,iVBORw0KGgoAAA==','data:image/png;base64,iVBORw0KGgoAAA==']};
  const count=aiRequests.length;
  assert.equal((await call(path,'POST',input)).status,401);
  assert.equal((await call(path,'POST',input,parent.token)).status,403);
  assert.equal((await call(path,'POST',input,student.token,{'X-Growing-Client':''})).status,400);
  for(const patch of [{pages:[]},{pages:Array(9).fill(input.pages[0])},{pages:['https://private.test/image.png']},{pages:['data:image/svg+xml;base64,AA==']},{unitId:'other'},{subject:'other'},{kind:'grade'},{prompt:''},{model:'override'},{endpoint:'https://private.test'},{key:'client-key'},{messages:[]}])
    assert.equal((await call(path,'POST',{...input,...patch},student.token)).status,400);
  assert.equal(aiRequests.length,count);
  const response=await call(path,'POST',input,student.token);
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const output=await response.json() as any;assert.deepEqual(output,{text:'第1页：x=2',uncertain:[]});
  const sent=aiRequests.at(-1)!;
  assert.equal(sent.url,'https://vision.test/v1/chat/completions');
  assert.equal(sent.headers.get('Authorization'),'Bearer server-only-test-secret');
  assert.equal(sent.data.model,'test-vision');assert.equal(sent.data.stream,false);
  assert.equal(sent.data.messages[1].content.filter((c:any)=>c.type==='image_url').length,2);
  assert.equal(sent.data.messages[1].content[2].image_url.url,input.pages[0]);
  assert.equal((await call(path,'POST',input,undefined,{Cookie:student.response.headers.get('set-cookie')!.split(';')[0]})).status,200);
  const native=await call(path,'POST',input,student.token,{Origin:'https://appassets.androidplatform.net'});
  assert.equal(native.status,200);assert.equal(native.headers.get('access-control-allow-origin'),'https://appassets.androidplatform.net');
  const before=aiRequests.length;
  aiLimited=true;assert.equal((await call(path,'POST',input,student.token)).status,429);aiLimited=false;
  const config=env.HANDWRITING_VISION_MODELS!;
  env.HANDWRITING_VISION_MODELS='';assert.equal((await call(path,'POST',input,student.token)).status,503);env.HANDWRITING_VISION_MODELS=config;
  assert.equal(aiRequests.length,before);
  for(const mode of ['failure','forbidden','network','invalid','large','truncated','empty','bad-recognition']){
    aiMode=mode;const failed=await call(path,'POST',input,student.token);assert.equal(failed.status,502);
    const message=await failed.text();assert.ok(!message.includes('private'));assert.ok(!message.includes('server-only-test-secret'));
  }
  aiMode='ok';
  env.HANDWRITING_VISION_MODELS=JSON.stringify([...JSON.parse(config),...JSON.parse(config)]);
  let tried=0;
  const fallback=createHandler(()=>db,(async(...args:Parameters<typeof fetch>)=>{tried++;return tried===1?new Response('private',{status:429}):Response.json({choices:[{finish_reason:'stop',message:{content:'{"text":"2","uncertain":[]}'}}]});}) as typeof fetch);
  const retry=await fallback(new Request('https://learn.test'+path,{method:'POST',headers:{'X-Growing-Client':'1',Authorization:'Bearer '+student.token},body:JSON.stringify(input)}),env,context);
  assert.equal(retry.status,200);assert.equal(tried,2);env.HANDWRITING_VISION_MODELS=config;
  assert.equal((await call(path,'POST',input,student.token,{'Content-Length':'8100001'})).status,413);
});

test('handwritten originals sync independently; parents see only bound children and credentials never sync',async()=>{
  const student=await register(),parent=await register('Parent'),other=await register('Parent');
  const key='growing-handwriting-v1:'+crypto.randomUUID();
  const original={version:1,subject:'math',unitId:'math-8a-01',mode:'solution',prompt:'求解 x² = 4，写出过程',pages:[[{tool:'pen',width:4,points:[[10,10,.2],[50,60,.8]]}]],revision:0,recognition:null,grades:[],updatedAt:new Date().toISOString()};
  const path='/api/student/state/'+key;
  assert.equal((await call(path,'PUT',{revision:0,value:JSON.stringify(original)},student.token)).status,200);
  assert.equal((await call(path,'PUT',{revision:0,value:JSON.stringify(original)},student.token)).status,409);
  const rows=await (await call('/api/student/state','GET',undefined,student.token)).json() as any[];assert.deepEqual(JSON.parse(rows.find(d=>d.key===key).value),original);
  assert.deepEqual((await (await call('/api/student/rankings','GET',undefined,student.token)).json() as any).boards,[]);
  for(const bad of [{...original,apiKey:'must-not-upload'},{...original,unitId:'math-8a-99'},{...original,pages:[[{tool:'pen',width:4,points:[[999,1,.5]]}]]}])assert.equal((await call(path,'PUT',{revision:1,value:JSON.stringify(bad)},student.token)).status,400);
  assert.equal((await call('/api/student/state/growing-vision-ai-v1','PUT',{revision:0,value:'{"key":"not-uploaded"}'},student.token)).status,400);
  await call('/api/parent/children','POST',{code:await invite(student.token)},parent.token);
  const parentPath='/api/parent/children/'+student.user.id+'/handwriting';
  const list=await (await call(parentPath,'GET',undefined,parent.token)).json() as any;assert.equal(list.total,1);assert.equal(list.rows[0].pages,1);assert.equal(list.rows[0].original,undefined);
  const detail=await (await call(parentPath+'?key='+key,'GET',undefined,parent.token)).json() as any;assert.deepEqual(detail.original,original);
  assert.equal((await call(parentPath+'?key='+key,'GET',undefined,other.token)).status,404);
  assert.equal((await call(parentPath,'GET',undefined,student.token)).status,403);
  assert.equal((await call(parentPath+'?key=bad','GET',undefined,parent.token)).status,400);
  assert.equal((await call(parentPath+'?page=0','GET',undefined,parent.token)).status,400);
  await call('/api/student/parents/'+parent.user.id,'DELETE',undefined,student.token);
  assert.equal((await call(parentPath+'?key='+key,'GET',undefined,parent.token)).status,404);
});

test('per-node handwritten assessment syncs and remains restricted to bound families',async()=>{
  const student=await register(),parent=await register('Parent'),other=await register('Parent');
  const key='growing-handwriting-v1:'+crypto.randomUUID(),at=new Date().toISOString();
  const grade={revision:0,at,score:65,parts:[15,20,20,10],feedback:'第2步通分错误',needsReview:false,knowledge:[{nodeId:'add',score:45,feedback:'通分后应保留减号'},{nodeId:'sign',score:70,feedback:'分母变号需同时改变分子符号'}]};
  const original={version:1,subject:'math',unitId:'math-8b-10',mode:'solution',prompt:'计算分式并写出过程',pages:[[{tool:'pen',width:4,points:[[10,10,.5]]}]],revision:0,recognition:{revision:0,text:'解题过程',uncertain:[],confirmed:true},grades:[grade],updatedAt:at};
  const path='/api/student/state/'+key;
  assert.equal((await call(path,'PUT',{revision:0,value:JSON.stringify(original)},student.token)).status,200);
  for(const bad of [{...original,unitId:'math-8a-01'},{...original,grades:[{...grade,knowledge:[{...grade.knowledge[0],nodeId:'other-unit'}]}]},{...original,grades:[{...grade,knowledge:[grade.knowledge[0],grade.knowledge[0]]}]}])assert.equal((await call(path,'PUT',{revision:1,value:JSON.stringify(bad)},student.token)).status,400);
  await call('/api/parent/children','POST',{code:await invite(student.token)},parent.token);
  const endpoint='/api/parent/children/'+student.user.id+'/handwriting';
  const detail=await (await call(endpoint+'?key='+key,'GET',undefined,parent.token)).json() as any;
  assert.deepEqual(detail.original.grades[0].knowledge,grade.knowledge);
  assert.equal((await call(endpoint+'?key='+key,'GET',undefined,other.token)).status,404);
  assert.deepEqual((await (await call('/api/student/rankings','GET',undefined,student.token)).json() as any).boards,[]);
});

test("password hashes are salted; correct password verifies and incorrect does not", async () => {
  const a = await passwordHash(password), b = await passwordHash(password);
  assert.notEqual(a, b); assert.ok(!a.includes(password));
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("wrong-password", a), false);
});
test("registration, case-insensitive login, secure cookie, token hashing and logout", async () => {
  const student = await register();
  const cookie = student.response.headers.get("set-cookie")!;
  for (const flag of ["HttpOnly", "Secure", "SameSite=Lax"]) assert.ok(cookie.includes(flag));
  assert.equal((await handler(new Request("https://learn.test/api/auth/me", { headers: { Cookie: cookie.split(";")[0] } }), env, context)).status, 200);
  const rows = await pg.query<{ TokenHash: string }>('SELECT "TokenHash" FROM "GrowingSessions" WHERE "UserId"=?1', [student.user.id]);
  assert.notEqual(rows.rows[0].TokenHash, student.token); assert.equal(rows.rows[0].TokenHash, await hash(student.token));
  assert.equal((await call("/api/auth/login", "POST", { username: student.name.toUpperCase(), password })).status, 200);
  assert.equal((await call("/api/auth/login", "POST", { username: student.name, password: "incorrect-password" })).status, 401);
  assert.equal((await call("/api/auth/register", "POST", { username: student.name.toUpperCase(), displayName: "Duplicate", role: "Student", password })).status, 409);
  assert.equal((await call("/api/auth/logout", "POST", undefined, student.token)).status, 204);
  assert.equal((await call("/api/auth/me", "GET", undefined, student.token)).status, 401);
});
test('legacy users must confirm a role before business access; selection persists across sessions without changing documents',async()=>{
  assert.equal((await call('/api/auth/role','POST',{role:'Student'})).status,401);
  for(const role of ['Student','Parent']){
    const s=await register();assert.equal(s.user.roleSelectionRequired,false);
    await call('/api/student/state/growing-math-lessons-v1','PUT',{revision:0,value:'{"preserved":true}'},s.token);
    await db.query('UPDATE "GrowingUsers" SET "RoleConfirmed"=0 WHERE "Id"=?1',[s.user.id]);
    const login=await (await call('/api/auth/login','POST',{username:s.name,password})).json() as any;
    assert.equal(login.user.roleSelectionRequired,true);
    assert.equal((await (await call('/api/auth/me','GET',undefined,s.token)).json() as any).roleSelectionRequired,true);
    for(const path of ['/api/student/state','/api/parent/children','/learn/app-design/index.html'])
      assert.equal((await call(path,'GET',undefined,login.token)).status,403);
    assert.equal((await call('/api/student/state/growing-math-lessons-v1','PUT',{revision:1,value:'{}'},s.token)).status,403);
    for(const invalid of ['',null,'Admin','student'])assert.equal((await call('/api/auth/role','POST',{role:invalid},s.token)).status,400);
    const csrf=await handler(new Request('https://learn.test/api/auth/role',{method:'POST',headers:{Authorization:'Bearer '+s.token},body:JSON.stringify({role})}),env,context);
    assert.equal(csrf.status,400);
    const saved=await call('/api/auth/role','POST',{role,id:'ignored',roleConfirmed:0},login.token);
    assert.equal(saved.status,200,await saved.clone().text());
    const profile=await saved.json() as any;assert.equal(profile.id,s.user.id);assert.equal(profile.role,role);assert.equal(profile.roleSelectionRequired,false);
    const [stored]=await db.query<any>('SELECT "Role","RoleConfirmed" FROM "GrowingUsers" WHERE "Id"=?1',[s.user.id]);
    assert.equal(stored.Role,role);assert.equal(stored.RoleConfirmed,1);
    assert.equal((await call('/api/auth/role','POST',{role},s.token)).status,200);
    assert.equal((await call('/api/auth/role','POST',{role:role==='Student'?'Parent':'Student'},s.token)).status,409);
    const again=await (await call('/api/auth/login','POST',{username:s.name,password})).json() as any;
    assert.equal(again.user.roleSelectionRequired,false);assert.equal(again.user.role,role);
    assert.equal((await call(role==='Student'?'/api/student/state':'/api/parent/children','GET',undefined,again.token)).status,200);
    assert.equal((await call(role==='Student'?'/api/parent/children':'/api/student/state','GET',undefined,again.token)).status,403);
    assert.equal((await new Store(db).state(s.user.id))[0].value,'{"preserved":true}');
  }
});

test('role confirmation is atomic across devices, cannot target another account, and leaves admins exempt',async()=>{
  const s=await register(),other=await register();
  await db.query('UPDATE "GrowingUsers" SET "RoleConfirmed"=0 WHERE "Id" IN (?1,?2)',[s.user.id,other.user.id]);
  const responses=await Promise.all(['Student','Parent'].map(role=>call('/api/auth/role','POST',{role,userId:other.user.id},s.token)));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  assert.equal((await (await call('/api/auth/me','GET',undefined,other.token)).json() as any).roleSelectionRequired,true);
  await db.query('INSERT INTO "GrowingAdministrators" ("UserId") VALUES (?1)',[other.user.id]);
  const admin=await (await call('/api/auth/me','GET',undefined,other.token)).json() as any;
  assert.equal(admin.role,'Admin');assert.equal(admin.roleSelectionRequired,false);
  assert.equal((await call('/api/admin/overview','GET',undefined,other.token)).status,200);
  assert.equal((await call('/api/auth/role','POST',{role:'Student'},other.token)).status,403);
  assert.equal((await (await call('/api/auth/me','GET',undefined,other.token)).json() as any).role,'Admin');
  assert.equal((await call('/api/auth/logout','POST',undefined,other.token)).status,204);
});

test('registration rejects an omitted role instead of silently defaulting to student',async()=>{
  for(const role of [undefined,'','Admin']){
    const response=await call('/api/auth/register','POST',{username:'no_role_'+(++counter),displayName:'未选身份',password,role});
    assert.equal(response.status,400);
  }
});

test("students are isolated; concurrent stale writes cannot overwrite and tombstones keep revisions", async () => {
  const a = await register(), b = await register(), path = "/api/student/state/growing-math-lessons-v1";
  const responses = await Promise.all([call(path, "PUT", { revision: 0, value: '{"topics":{"one":{"seen":true}}}' }, a.token), call(path, "PUT", { revision: 0, value: "{}" }, a.token)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.deepEqual(await (await call("/api/student/state", "GET", undefined, b.token)).json(), []);
  const first = await (await call("/api/student/state", "GET", undefined, a.token)).json() as any[];
  assert.equal(first[0].revision, 1); assert.ok(first[0].updatedAt.endsWith("Z"));
  assert.equal((await call(path, "PUT", { revision: 1, value: null }, a.token)).status, 200);
  const deleted = await (await call("/api/student/state", "GET", undefined, a.token)).json() as any[];
  assert.equal(deleted[0].revision, 2); assert.equal(deleted[0].value, null);
  assert.equal((await call(path, "PUT", { revision: 1, value: "{}" }, a.token)).status, 409);
});
test("parents need binding; concurrent invitation consumption has one winner; revocation works", async () => {
  const s = await register(), p = await register("Parent"), stranger = await register("Parent");
  const report = `/api/parent/children/${s.user.id}/report`;
  assert.equal((await call(report, "GET", undefined, p.token)).status, 404);
  const code = await invite(s.token);
  const results = await Promise.all([call("/api/parent/children", "POST", { code }, p.token), call("/api/parent/children", "POST", { code }, stranger.token)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 400]);
  const parent = results[0].ok ? p : stranger, unbound = results[0].ok ? stranger : p;
  assert.equal((await call(report, "GET", undefined, parent.token)).status, 200);
  assert.equal((await call(report, "GET", undefined, unbound.token)).status, 404);
  assert.equal((await call("/api/student/state", "GET", undefined, parent.token)).status, 403);
  assert.equal((await call(`/api/student/parents/${parent.user.id}`, "DELETE", undefined, s.token)).status, 204);
  assert.equal((await call(report, "GET", undefined, parent.token)).status, 404);
  assert.equal((await call('/api/parent/children','POST',{code},parent.token)).status,400);
  assert.equal((await call(report, "GET", undefined, parent.token)).status, 404);
});
test("expired sessions and invitations cannot authenticate or bind", async () => {
  const s = await register(), p = await register("Parent"), code = await invite(s.token);
  await pg.query('UPDATE "GrowingInvitations" SET "ExpiresAt"=strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\',\'-1 second\') WHERE "CodeHash"=?1', [await hash(code)]);
  assert.equal((await call("/api/parent/children", "POST", { code }, p.token)).status, 400);
  await pg.query('UPDATE "GrowingSessions" SET "ExpiresAt"=strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\',\'-1 second\') WHERE "UserId"=?1', [s.user.id]);
  assert.equal((await call("/api/auth/me", "GET", undefined, s.token)).status, 401);
});
test("secret keys, connection settings, malformed/deep JSON and missing CSRF header are rejected", async () => {
  const s = await register();
  for (const [key, value, revision] of [
    ["growing-course-ai-v1", "{}", 0], ["growing-cloud-session-v1", "{}", 0],
    ["fraction-minute-v1", '{"connection":{"apiKey":"fake-test-only"}}', 0],
    ["fraction-minute-v1", "not json", 0], ["fraction-minute-v1", "[]", 0],
    ["fraction-minute-v1", "{}", -1], ["fraction-minute-v1", "{}", 0.5],
    ["fraction-minute-v1", '{"a":'.repeat(65) + '{}' + '}'.repeat(65), 0],
  ]) assert.equal((await call("/api/student/state/" + key, "PUT", { value, revision }, s.token)).status, 400);
  assert.equal((await call("/api/auth/logout", "POST", undefined, s.token, { "X-Growing-Client": "" })).status, 400);
  const oversized = new Request("https://learn.test/api/auth/login", { method: "POST", headers: { "X-Growing-Client": "1", "Content-Length": "2200001" }, body: "{}" });
  assert.equal((await handler(oversized, env, context)).status, 413);
});
test("document count is enforced with D1 atomic batches", async () => {
  const s = await register();
  await db.batch(Array.from({length:256},(_,n)=>({sql:`INSERT INTO "GrowingDocuments" ("StudentId","Key","Value","Revision","UpdatedAt") VALUES (?1,?2,'{}',1,${nowSql})`,params:[s.user.id,'existing-'+n]})));
  assert.equal((await call("/api/student/state/growing-math-lessons-v1", "PUT", { revision: 0, value: "{}" }, s.token)).status, 413);
  const concurrent=await register();
  await db.batch(Array.from({length:255},(_,n)=>({sql:`INSERT INTO "GrowingDocuments" ("StudentId","Key","Value","Revision","UpdatedAt") VALUES (?1,?2,'{}',1,${nowSql})`,params:[concurrent.user.id,'existing-'+n]})));
  const results=await Promise.all(['growing-math-lessons-v1','growing-physics-lessons-v1'].map(key=>call('/api/student/state/'+key,'PUT',{revision:0,value:'{}'},concurrent.token)));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,413]);
  assert.equal((await new Store(db).state(concurrent.user.id)).length,256);
});

test('UTF-8 document byte limits prevent D1 oversized rows before writing',async()=>{
  const s=await register();
  const value=JSON.stringify({text:'汉'.repeat(700000)});
  assert.equal((await call('/api/student/state/growing-math-lessons-v1','PUT',{revision:0,value},s.token)).status,413);
  assert.deepEqual(await new Store(db).state(s.user.id),[]);
});
test("courses including encoded paths require a student and receive isolated-storage bootstrap", async () => {
  const p = await register("Parent"), s = await register();
  for (const path of ["/learn/app-design/index.html", "/%6cearn/app-design/index.html", "/learn%2fapp-design/index.html"]) {
    assert.equal((await call(path)).status, 401);
    assert.equal((await call(path, "GET", undefined, p.token)).status, 403);
    const response = await call(path, "GET", undefined, s.token);
    assert.equal(response.status, 200); assert.ok((await response.text()).includes('/cloud-storage.js'));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  assert.equal((await call("/learn/missing.html", "GET", undefined, s.token)).status, 404);
  assert.equal((await call("/")).status, 200);
});
test("native CORS is explicit and rate limiting rejects login attempts", async () => {
  for (const origin of ["https://appassets.androidplatform.net", "https://untrusted.example.org"]) {
    const response = await call("/api/auth/login", "OPTIONS", undefined, undefined, { Origin: origin });
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin.includes("appassets") ? origin : null);
  }
  limited = true;
  try { assert.equal((await call("/api/auth/login", "POST", { username: "unknown", password })).status, 429); } finally { limited = false; }
});
test("health checks runtime; readiness queries actual D1 tables", async () => {
  assert.equal((await (await call("/api/health")).json() as any).framework, "Cloudflare Workers");
  assert.equal((await call("/api/ready")).status, 200);
  const missing = await createHandler()(new Request("https://learn.test/api/ready"), env, context);
  assert.equal(missing.status, 503); assert.ok(!(await missing.text()).includes("postgres://"));
});
test("D1 rolls back all statements on a failed CAS and retries writes to different documents", async () => {
  const s=await register();
  const responses=await Promise.all([
    call('/api/student/state/growing-math-lessons-v1','PUT',{revision:0,value:'{"topics":{"a":{"seen":true}}}'},s.token),
    call('/api/student/state/growing-physics-lessons-v1','PUT',{revision:0,value:'{"topics":{"b":{"seen":true}}}'},s.token),
  ]);
  assert.deepEqual(responses.map(r=>r.status),[200,200]);
  assert.equal((await new Store(db).state(s.user.id)).length,2);
  await assert.rejects(db.batch([
    {sql:'UPDATE "GrowingDocuments" SET "Value"=\'{}\' WHERE "StudentId"=?1',params:[s.user.id]},
    {sql:'UPDATE "GrowingUsers" SET "SyncRevision"=-1 WHERE "Id"=?1',params:[s.user.id]},
  ]),/growing_sync_cas/);
  assert.ok((await new Store(db).state(s.user.id)).every(d=>d.value?.includes('seen')));
});

async function administrator() {
  const a = await register("Parent");
  await pg.query('INSERT INTO "GrowingAdministrators" ("UserId") VALUES (?1)', [a.user.id]);
  return a;
}
async function bindStudent(s: any, p: any) {
  assert.equal((await call('/api/parent/children', 'POST', { code: await invite(s.token) }, p.token)).status, 200);
}
test("admin grants are private, effective on existing sessions and revoked immediately", async () => {
  assert.equal((await call('/api/auth/register', 'POST', { username: 'public_admin', displayName: 'Admin', role: 'Admin', password })).status, 400);
  const s = await register(), p = await register('Parent'), a = await administrator();
  for (const token of [s.token,p.token]) for (const route of ['/overview','/members','/redemptions'])
    assert.equal((await call('/api/admin'+route,'GET',undefined,token)).status,403);
  assert.equal((await (await call('/api/auth/me','GET',undefined,a.token)).json() as any).role,'Admin');
  assert.equal((await (await call('/api/auth/login','POST',{username:a.name,password})).json() as any).user.role,'Admin');
  assert.equal((await call('/api/admin/overview','GET',undefined,a.token)).status,200);
  assert.equal((await call('/api/parent/children','GET',undefined,a.token)).status,200);
  assert.equal((await call('/learn/app-design/index.html','GET',undefined,a.token)).status,200);
  await pg.query('DELETE FROM "GrowingAdministrators" WHERE "UserId"=?1',[a.user.id]);
  assert.equal((await call('/api/admin/overview','GET',undefined,a.token)).status,403);
  assert.equal((await call('/learn/app-design/index.html','GET',undefined,a.token)).status,403);
});

test('admins view all courses and unbound student reports without impersonating students or parents',async()=>{
  const a=await administrator(),s=await register(),p=await register('Parent');
  for(const path of ['/learn/app-design/index.html','/%6cearn/app-design/index.html','/learn%2fapp-design/index.html']){
    const response=await call(path,'GET',undefined,a.token);
    assert.equal(response.status,200);
    assert.ok((await response.text()).includes('/cloud-storage.js'));
    assert.equal((await call(path,'HEAD',undefined,a.token)).status,200);
  }
  for(const suffix of ['report','growth?days=7','rewards']){
    const path='/api/parent/children/'+s.user.id+'/'+suffix;
    assert.equal((await call(path,'GET',undefined,a.token)).status,200);
    assert.equal((await call(path,'GET',undefined,p.token)).status,404);
    assert.equal((await call(path,'GET',undefined,s.token)).status,403);
  }
  assert.equal((await call('/api/parent/children/'+p.user.id+'/report','GET',undefined,a.token)).status,404);
  assert.equal((await call('/api/student/state','GET',undefined,a.token)).status,403);
  assert.equal((await call('/api/student/state/growing-math-lessons-v1','PUT',{revision:0,value:'{}'},a.token)).status,403);
  assert.equal((await call('/api/parent/children/'+s.user.id+'/confirm-redemption','POST',{},a.token)).status,403);
  await bindStudent(s,a);
  assert.equal((await (await call('/api/parent/children','GET',undefined,a.token)).json() as any[])[0].id,s.user.id);
  assert.deepEqual(await new Store(db).state(s.user.id),[]);
  await pg.query('DELETE FROM "GrowingAdministrators" WHERE "UserId"=?1',[a.user.id]);
  assert.equal((await call('/learn/app-design/index.html','GET',undefined,a.token)).status,403);
});
test("admin member filters, pagination and details expose safe profiles and family relationships", async () => {
  const a=await administrator(),s=await register(),p=await register('Parent');await bindStudent(s,p);
  let data=await (await call('/api/admin/members?q='+s.name+'&role=Student','GET',undefined,a.token)).json() as any;
  assert.equal(data.total,1);assert.equal(data.rows[0].id,s.user.id);assert.equal(data.rows[0].connections,1);assert.equal(data.rows[0].mastered,null);
  assert.ok(!JSON.stringify(data).match(/password|TokenHash|token/i));
  data=await (await call('/api/admin/members?role=Student','GET',undefined,a.token)).json() as any;
  assert.ok(data.rows.every((r:any)=>r.role==='Student'));assert.ok(data.rows.length<=20);
  for(let i=0;i<21;i++) {
    const name='page_'+(++counter);
    await pg.query('INSERT INTO "GrowingUsers" ("Id","Username","NormalizedName","DisplayName","Role","PasswordHash","CreatedAt") SELECT ?1,?2,upper(?2),?2,\'Student\',"PasswordHash",?4 FROM "GrowingUsers" WHERE "Id"=?3',[crypto.randomUUID(),name,s.user.id,new Date().toISOString()]);
  }
  const first=await (await call('/api/admin/members?role=Student&page=1','GET',undefined,a.token)).json() as any;
  const second=await (await call('/api/admin/members?role=Student&page=2','GET',undefined,a.token)).json() as any;
  assert.equal(first.rows.length,20);assert.ok(second.rows.length>0);assert.equal(first.total,second.total);
  assert.ok(second.rows.every((row:any)=>!first.rows.some((f:any)=>f.id===row.id)));
  assert.equal((await (await call('/api/admin/members?q='+s.name+'&page=2','GET',undefined,a.token)).json() as any).rows.length,0);
  assert.equal((await (await call('/api/admin/members/'+s.user.id,'GET',undefined,a.token)).json() as any).parents[0].id,p.user.id);
  assert.equal((await (await call('/api/admin/members/'+p.user.id,'GET',undefined,a.token)).json() as any).children[0].id,s.user.id);
  for(const route of ['/members?page=0','/members?role=Root','/members?q='+('x'.repeat(41)),'/redemptions?student=bad'])
    assert.equal((await call('/api/admin'+route,'GET',undefined,a.token)).status,400);
  assert.equal((await call('/api/admin/members/not-a-uuid','GET',undefined,a.token)).status,404);
  assert.equal((await call('/api/admin/students/'+p.user.id+'/report','GET',undefined,a.token)).status,404);
});
test('admin password changes revoke all target sessions, preserve student records and reject stale login proofs',async()=>{
  const a=await administrator(),s=await register(),p=await register('Parent');await bindStudent(s,p);
  const second=await (await call('/api/auth/login','POST',{username:s.name,password})).json() as any;
  await call('/api/student/state/growing-math-lessons-v1','PUT',{revision:0,value:'{"topics":{"sentinel":{"seen":true}}}'},s.token);
  const before=await new Store(db).state(s.user.id),oldHash=(await new Store(db).findUser(s.name.toUpperCase()))!.passwordHash;
  const newPassword='Changed-Test-Only-1987!';
  const changed=await call('/api/admin/members/'+s.user.id+'/password','POST',{newPassword,confirmPassword:newPassword},a.token);
  assert.equal(changed.status,200);assert.deepEqual(await changed.json(),{changed:true,reauthenticate:false});
  for(const token of [s.token,second.token])assert.equal((await call('/api/auth/me','GET',undefined,token)).status,401);
  assert.equal((await call('/api/auth/login','POST',{username:s.name,password})).status,401);
  const logged=await (await call('/api/auth/login','POST',{username:s.name,password:newPassword})).json() as any;
  assert.equal(logged.user.id,s.user.id);assert.equal(logged.user.role,'Student');
  assert.deepEqual(await new Store(db).state(s.user.id),before);assert.equal((await new Store(db).parents(s.user.id))[0].id,p.user.id);
  const updated=(await new Store(db).findUser(s.name.toUpperCase()))!;
  assert.notEqual(updated.passwordHash,oldHash);assert.ok(!updated.passwordHash.includes(newPassword));assert(await verifyPassword(newPassword,updated.passwordHash));
  await assert.rejects(new Store(db).createSession(await hash('stale-login-proof'),s.user.id,new Date(Date.now()+60000).toISOString(),oldHash),/登录信息已变更/);
  assert.equal((await call('/api/auth/me','GET',undefined,a.token)).status,200);
});

test('password reset requires administrator and matching valid passwords; rejected input leaves credentials intact',async()=>{
  const a=await administrator(),s=await register(),p=await register('Parent'),path='/api/admin/members/'+s.user.id+'/password';
  const input={newPassword:'Valid-Test-Only-1987!',confirmPassword:'Valid-Test-Only-1987!'};
  assert.equal((await call(path,'POST',input)).status,401);
  for(const token of [s.token,p.token])assert.equal((await call(path,'POST',input,token)).status,403);
  assert.equal((await call(path,'POST',input,a.token,{'X-Growing-Client':''})).status,400);
  for(const data of [{},{newPassword:123,confirmPassword:123},{newPassword:'short',confirmPassword:'short'},{newPassword:' '.repeat(8),confirmPassword:' '.repeat(8)},{newPassword:'x'.repeat(129),confirmPassword:'x'.repeat(129)},{...input,confirmPassword:'different'}])
    assert.equal((await call(path,'POST',data,a.token)).status,400);
  assert.equal((await call('/api/admin/members/'+crypto.randomUUID()+'/password','POST',input,a.token)).status,404);
  assert.equal((await call('/api/admin/members/not-a-uuid/password','POST',input,a.token)).status,404);
  assert.equal((await call(path,'GET',undefined,a.token)).status,404);
  assert.equal((await call('/api/auth/me','GET',undefined,s.token)).status,200);
  assert.equal((await call('/api/auth/login','POST',{username:s.name,password})).status,200);
});

test('admins can reset parent, other admin and own passwords without changing roles or family links',async()=>{
  const a=await administrator(),p=await register('Parent'),other=await administrator(),s=await register();await bindStudent(s,p);
  const newPassword='New-Role-Test-Only-1987!';
  for(const member of [p,other,a]){
    const response=await call('/api/admin/members/'+member.user.id+'/password','POST',{newPassword,confirmPassword:newPassword},a.token);
    assert.equal(response.status,200);assert.equal((await response.json() as any).reauthenticate,member===a);
    if(member===a)assert.ok(response.headers.get('Set-Cookie')?.includes('Max-Age=0'));
    assert.equal((await call('/api/auth/me','GET',undefined,member.token)).status,401);
    const login=await call('/api/auth/login','POST',{username:member.name,password:newPassword});assert.equal(login.status,200);
    const result=await login.json() as any;assert.equal(result.user.role,member===p?'Parent':'Admin');
    if(member===p)assert.equal((await (await call('/api/parent/children','GET',undefined,result.token)).json() as any[])[0].id,s.user.id);
  }
});

test('password and session revocation roll back together when the database transaction fails',async()=>{
  const s=await register(),original=(await new Store(db).findUser(s.name.toUpperCase()))!.passwordHash;
  const failing=new Store({...db,batch:statements=>db.batch([...statements,{sql:'SELECT * FROM "__password_reset_test_missing_table__"'}])});
  await assert.rejects(failing.changePassword(s.user.id,await passwordHash('Rollback-Test-Only-1987!')));
  assert.equal((await new Store(db).findUser(s.name.toUpperCase()))!.passwordHash,original);
  assert.equal((await call('/api/auth/me','GET',undefined,s.token)).status,200);
});

test("daily growth snapshots use Shanghai dates, preserve gaps and allow reset decreases", async () => {
  const a=await administrator(),s=await register(),p=await register('Parent');await bindStudent(s,p);
  const path='/api/student/state/growing-math-lessons-v1';
  const value=JSON.stringify({topics:{one:{seen:true,bestQuiz:3,attempts:[{score:9,feedback:'正确',criticalErrors:[]}]}}});
  assert.equal((await call(path,'PUT',{revision:0,value},s.token)).status,200);
  const snapshots=await pg.query<any>('SELECT "Day" AS day,"Mastered" AS mastered FROM "GrowingDailySnapshots" WHERE "StudentId"=?1',[s.user.id]);
  assert.equal(snapshots.rows.length,3);
  const today=new Date(Date.now()+8*3600000).toISOString().slice(0,10);assert.ok(snapshots.rows.every(r=>r.day===today));
  let data=await (await call('/api/admin/students/'+s.user.id+'/report?days=7','GET',undefined,a.token)).json() as any;
  assert.equal(data.growth.points.length,7);assert.equal(data.growth.points[0].subjects[0].mastered,null);
  assert.equal(data.growth.points[6].subjects[0].mastered,1);
  assert.equal((await call(path,'PUT',{revision:0,value:'{}'},s.token)).status,409);
  data=await (await call('/api/parent/children/'+s.user.id+'/growth?days=7','GET',undefined,p.token)).json() as any;
  assert.equal(data.points[6].subjects[0].mastered,1);
  assert.equal((await call(path,'PUT',{revision:1,value:'{}'},s.token)).status,200);
  const yesterday=new Date(Date.parse(today+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  await call('/api/student/state/growing-activity-v1:'+crypto.randomUUID(),'PUT',{revision:0,value:JSON.stringify({days:{[yesterday]:{'数学':120}}})},s.token);
  data=await (await call('/api/admin/students/'+s.user.id+'/report?days=7','GET',undefined,a.token)).json() as any;
  assert.equal(data.growth.points[6].subjects[0].mastered,0);assert.equal(data.growth.points[5].subjects[0].mastered,null);assert.equal(data.growth.points[5].subjects[0].minutes,2);
  assert.equal((await call('/api/parent/children/'+s.user.id+'/growth?days=365','GET',undefined,p.token)).status,400);
});
test("parent confirmations verify stored rewards and binding, are idempotent and survive source deletion", async () => {
  const a=await administrator(),s=await register(),p=await register('Parent'),other=await register('Parent');await bindStudent(s,p);
  const key='growing-unit-rewards-v1:math-8a-03',prefix='/api/parent/children/'+s.user.id;
  const entry={kind:'cash',amount:250,parent:'自填妈妈',at:Date.now()};
  await call('/api/student/state/'+key,'PUT',{revision:0,value:JSON.stringify({version:1,paidCash:250,paidGame:5,history:[entry,entry,{legacy:true,cash:100},{kind:'cash',amount:-10,parent:'fake',at:1}]})},s.token);
  let data=await (await call(prefix+'/rewards','GET',undefined,p.token)).json() as any;
  assert.equal(data.entries.length,1);assert.equal(data.entries[0].confirmation,null);assert.equal(data.invalid,1);assert.equal(data.summaries[0].legacy,true);
  const payload={documentKey:key,hash:data.entries[0].hash,confirm:true,amount:999999,parentId:other.user.id};
  assert.equal((await call(prefix+'/rewards','GET',undefined,other.token)).status,404);
  assert.equal((await call(prefix+'/confirm-redemption','POST',payload,other.token)).status,404);
  for(const token of [s.token,a.token])assert.equal((await call(prefix+'/confirm-redemption','POST',payload,token)).status,403);
  assert.equal((await call(prefix+'/confirm-redemption','POST',{...payload,confirm:false},p.token)).status,400);
  assert.equal((await call(prefix+'/confirm-redemption','POST',{...payload,hash:'0'.repeat(64)},p.token)).status,409);
  const responses=await Promise.all([call(prefix+'/confirm-redemption','POST',payload,p.token),call(prefix+'/confirm-redemption','POST',payload,p.token)]);
  assert.ok(responses.every(r=>r.status===200));
  assert.deepEqual((await Promise.all(responses.map(r=>r.json() as any))).map(r=>r.alreadyConfirmed).sort(),[false,true]);
  data=await (await call(prefix+'/rewards','GET',undefined,p.token)).json() as any;
  assert.equal(data.confirmations.length,1);assert.equal(data.confirmations[0].amount,250);assert.equal(data.confirmations[0].parentId,p.user.id);assert.equal(data.entries[0].confirmation.parentName,p.user.displayName);
  await call('/api/student/state/'+key,'PUT',{revision:1,value:null},s.token);
  data=await (await call(prefix+'/rewards','GET',undefined,p.token)).json() as any;
  assert.equal(data.entries.length,0);assert.equal(data.confirmations.length,1);
  const ledger=await (await call('/api/admin/redemptions?student='+s.user.id+'&parent='+p.user.id,'GET',undefined,a.token)).json() as any;
  assert.equal(ledger.total,1);assert.equal(ledger.rows[0].parentUsername,p.name);
  const overview=await (await call('/api/admin/overview','GET',undefined,a.token)).json() as any;
  assert.ok(overview.confirmations>=1);assert.ok(overview.cashCents>=250);
  await call('/api/student/parents/'+p.user.id,'DELETE',undefined,s.token);
  assert.equal((await call(prefix+'/confirm-redemption','POST',payload,p.token)).status,404);
  assert.equal((await call(prefix+'/growth','GET',undefined,p.token)).status,404);
  assert.equal((await (await call('/api/admin/redemptions?student='+s.user.id,'GET',undefined,a.token)).json() as any).total,1);
});

test('rankings use real D1 scoring, ties, privacy, pagination and bound-parent authorization',async()=>{
  const a=await register(),b=await register(),c=await register(),parent=await register('Parent'),stranger=await register('Parent');
  const rule=rankingRules.find(r=>r.id==='physics-8a-05')!;
  const saveDiagnosis=async(s:any)=>{
    const graph=diagnosis.graph(diagnosisRules.physics);
    let session=diagnosis.createAssessment(graph,rule.diagnosisTopics!),view;
    while((view=diagnosis.inspect(graph,session)).next){const q=view.next.question;session=diagnosis.answer(graph,session,q.id,q.answer);}
    const value=JSON.stringify({version:1,records:Object.fromEntries(rule.diagnosisTopics!.map(id=>[id,session]))});
    const response=await call('/api/student/state/growing-diagnosis-v1:'+rule.id,'PUT',{revision:0,value},s.token);
    assert.equal(response.status,200,await response.clone().text());
  };
  const save=async(s:any,quiz:number,revision=0)=>{
    const topics=Object.fromEntries(rule.topics!.map(id=>[id,{seen:true,bestQuiz:quiz,attempts:[{score:8,feedback:'解释准确',criticalErrors:[]}]}]));
    const response=await call('/api/student/state/growing-physics-lessons-v1','PUT',{revision,value:JSON.stringify({topics})},s.token);
    assert.equal(response.status,200,await response.clone().text());
  };
  await save(a,3);await save(b,3);await save(c,0);
  await saveDiagnosis(a);await saveDiagnosis(b);
  const path='/api/student/rankings?board='+rule.id;
  const first=await (await call(path,'GET',undefined,a.token)).json() as any;
  assert.equal(first.self.rank,1);assert.equal(first.self.score,100);assert.equal(first.total,3);
  assert.equal(first.self.diagnosisPercent,100);assert.equal(first.self.testPercent,100);
  assert.deepEqual(first.rows.map((r:any)=>r.rank),[1,1,3]);
  assert.equal(first.rows.filter((r:any)=>r.isSelf).length,1);
  const text=JSON.stringify(first);for(const secret of [a.user.id,b.user.id,c.user.id,b.name,c.name,'解释准确','passwordHash'])assert.ok(!text.includes(secret));
  assert.ok(first.rows.filter((r:any)=>!r.isSelf).every((r:any)=>/^同学 [A-F0-9]{8}$/.test(r.label)));
  const overview=await (await call('/api/student/rankings','GET',undefined,a.token)).json() as any;
  assert.deepEqual(overview.boards.map((r:any)=>r.id).sort(),[rule.id,'physics:upper'].sort());
  assert.equal((await call('/api/student/rankings?board=math:upper','GET',undefined,a.token)).status,404);
  assert.equal((await call(path+'&page=0','GET',undefined,a.token)).status,400);
  assert.equal((await call(path)).status,401);
  assert.equal((await call(path,'GET',undefined,parent.token)).status,403);
  assert.equal((await call('/api/admin/leaderboards/rebuild','POST',undefined,a.token)).status,403);
  const pp='/api/parent/children/'+a.user.id+'/rankings';
  assert.equal((await call(pp,'GET',undefined,parent.token)).status,404);
  await call('/api/parent/children','POST',{code:await invite(a.token)},parent.token);
  assert.equal((await call(pp,'GET',undefined,parent.token)).status,200);
  const family=await (await call(pp+'?board='+rule.id,'GET',undefined,parent.token)).json() as any;
  assert.equal(family.self.label,a.name);assert.equal(family.self.rank,1);
  assert.equal((await call(pp,'GET',undefined,stranger.token)).status,404);
  await call('/api/student/parents/'+parent.user.id,'DELETE',undefined,a.token);
  assert.equal((await call(pp,'GET',undefined,parent.token)).status,404);
  // More than a page of participants: own rank must remain visible off-page.
  for(let i=0;i<20;i++){
    const id=crypto.randomUUID(),name='ranking_'+id.slice(0,8);
    await db.query(`INSERT INTO "GrowingUsers" ("Id","Username","NormalizedName","DisplayName","Role","PasswordHash","CreatedAt") SELECT ?1,?2,?2,?2,'Student',"PasswordHash",${nowSql} FROM "GrowingUsers" WHERE "Id"=?3`,[id,name,a.user.id]);
    await db.batch(rankingStatements(id,[{key:'growing-physics-lessons-v1',value:JSON.stringify({topics:Object.fromEntries(rule.topics!.map(id=>[id,{seen:true,bestQuiz:3,attempts:[]}]))}),revision:1,updatedAt:new Date().toISOString()}]));
  }
  const last=await (await call(path,'GET',undefined,c.token)).json() as any;
  assert.equal(last.rows.length,20);assert.equal(last.self.rank,23);assert.equal(last.total,23);assert.equal(last.self.score,30);
  const second=await (await call(path+'&page=2','GET',undefined,c.token)).json() as any;
  assert.equal(second.rows.length,3);assert.ok(second.rows.some((r:any)=>r.isSelf));
  await save(c,3,1);await saveDiagnosis(c);assert.equal((await (await call(path,'GET',undefined,c.token)).json() as any).self.rank,1);
  await call('/api/student/state/growing-physics-lessons-v1','PUT',{revision:2,value:null},c.token);
  assert.equal((await (await call(path,'GET',undefined,c.token)).json() as any).self.score,30);
  await call('/api/student/state/growing-diagnosis-v1:'+rule.id,'PUT',{revision:1,value:null},c.token);
  assert.equal((await call(path,'GET',undefined,c.token)).status,404);
});

test('historical rank rebuild is idempotent, admin-only and guarded against concurrent newer sync',async()=>{
  const admin=await register('Parent'),student=await register();
  await db.query('INSERT INTO "GrowingAdministrators" ("UserId") VALUES (?1)',[admin.user.id]);
  const rule=rankingRules.find(r=>r.id==='math-8a-03')!,key='growing-math-lessons-v1';
  const value=JSON.stringify({topics:{[rule.topics![0]]:{seen:true,bestQuiz:3,attempts:[]}}});
  await db.query(`INSERT INTO "GrowingDocuments" ("StudentId","Key","Value","Revision","UpdatedAt") VALUES (?1,?2,?3,1,${nowSql})`,[student.user.id,key,value]);
  for(let run=0;run<2;run++){
    let page:number|null=1;
    while(page!==null){const response=await call('/api/admin/leaderboards/rebuild?page='+page,'POST',undefined,admin.token);assert.equal(response.status,200);page=(await response.json() as any).nextPage;}
  }
  const path='/api/student/rankings?board='+rule.id;
  assert.ok((await call(path,'GET',undefined,student.token)).ok);
  const oldDocs=await new Store(db).state(student.user.id);
  await call('/api/student/state/'+key,'PUT',{revision:1,value:null},student.token);
  await db.batch(rankingStatements(student.user.id,oldDocs,0));
  assert.equal((await call(path,'GET',undefined,student.token)).status,404);
  assert.equal((await db.query('SELECT "Value" FROM "GrowingDocuments" WHERE "StudentId"=?1 AND "Key"=?2',[student.user.id,key]))[0].Value,null);
});

test('parents add multiple children by verified student credentials without student invitations',async()=>{
  const parent=await register('Parent'),other=await register('Parent'),a=await register(),b=await register(),pending=await register();
  const path='/api/parent/children/account';
  const credentials=(child:any)=>({studentUsername:child.name.toLowerCase(),studentPassword:password});
  const linked=async()=>await (await call('/api/parent/children','GET',undefined,parent.token)).json() as any[];
  const sessionsBefore=await db.query('SELECT * FROM "GrowingSessions" WHERE "UserId" IN (?1,?2)',[a.user.id,b.user.id]);
  assert.equal((await call(path,'POST',credentials(a))).status,401);
  assert.equal((await call(path,'POST',credentials(b),a.token)).status,403);
  assert.equal((await call(path,'POST',{...credentials(a),studentPassword:'incorrect-password'},parent.token)).status,400);
  assert.equal((await call(path,'POST',{...credentials(a),studentUsername:'no_such_student'},parent.token)).status,400);
  assert.equal((await call(path,'POST',credentials(other),parent.token)).status,400);
  await db.query('UPDATE "GrowingUsers" SET "RoleConfirmed"=0 WHERE "Id"=?1',[pending.user.id]);
  assert.equal((await call(path,'POST',credentials(pending),parent.token)).status,400);
  assert.deepEqual(await linked(),[]);
  limited=true;
  try{assert.equal((await call(path,'POST',credentials(a),parent.token)).status,429);}finally{limited=false;}
  assert.deepEqual(await linked(),[]);
  for(const student of [a,b,a]){
    const response=await call(path,'POST',credentials(student),parent.token);
    assert.equal(response.status,200,await response.clone().text());
    assert.deepEqual(await response.json(),{studentId:student.user.id});
  }
  assert.deepEqual((await linked()).map(c=>c.id).sort(),[a.user.id,b.user.id].sort());
  assert.equal((await (await call('/api/auth/me','GET',undefined,parent.token)).json() as any).id,parent.user.id);
  assert.deepEqual(await db.query('SELECT * FROM "GrowingSessions" WHERE "UserId" IN (?1,?2)',[a.user.id,b.user.id]),sessionsBefore);
  assert.deepEqual(await db.query('SELECT * FROM "GrowingInvitations" WHERE "StudentId" IN (?1,?2)',[a.user.id,b.user.id]),[]);
  for(const student of [a,b]){
    assert.equal((await call('/api/parent/children/'+student.user.id+'/report','GET',undefined,parent.token)).status,200);
    assert.equal((await call('/api/parent/children/'+student.user.id+'/report','GET',undefined,other.token)).status,404);
  }
});

// Unit reports use exactly the same family and administrator boundaries as child state.
test('cloud learning archives follow the student across device sessions including unfinished work',async()=>{
  const student=await register(),other=await register(),parent=await register('Parent');
  const keys=['growing-diagnosis-year8-v1:math-8a-01','growing-diagnosis-physics-v1:physics-8a-01','growing-assessment-v1','growing-original-quadrant-v1','growing-english-doubts-v1:english-8a-01'];
  for(const key of keys){
    const response=await call('/api/student/state/'+key,'PUT',{revision:0,value:JSON.stringify({version:1,draft:'未完成的记录',records:[]})},student.token);
    assert.equal(response.status,200,await response.clone().text());
  }
  await call('/api/auth/logout','POST',{},student.token);
  const login=await call('/api/auth/login','POST',{username:student.name,password});
  assert.equal(login.status,200);const next=await login.json() as any;
  assert.equal(next.user.id,student.user.id);assert.notEqual(next.token,student.token);
  const rows=await (await call('/api/student/state','GET',undefined,next.token)).json() as any[];
  assert.deepEqual(rows.map(r=>r.key).sort(),keys.sort());
  for(const row of rows)assert.equal(JSON.parse(row.value).draft,'未完成的记录');
  assert.deepEqual(await (await call('/api/student/state','GET',undefined,other.token)).json(),[]);
  assert.equal((await call('/api/student/state','GET',undefined,parent.token)).status,403);
  const row=rows[0],route='/api/student/state/'+row.key;
  assert.equal((await call(route,'PUT',{value:row.value,revision:0},next.token)).status,409);
  assert.equal((await call(route,'PUT',{value:'{}',revision:row.revision},other.token)).status,409);
  assert.equal((await call('/api/student/state/growing-course-ai-v1','PUT',{value:'{}',revision:0},next.token)).status,400);
});

test('unit reports are read-only and enforce role, family binding and admin revocation',async()=>{
  const s=await register(), p=await register('Parent'), other=await register('Parent'), a=await administrator();
  const route='/api/parent/children/'+s.user.id+'/unit-report', adminRoute='/api/admin/students/'+s.user.id+'/unit-report';
  assert.equal((await call(route)).status,401);
  assert.equal((await call(route,'GET',undefined,s.token)).status,403);
  assert.equal((await call(route,'GET',undefined,p.token)).status,404);
  assert.equal((await call(adminRoute,'GET',undefined,p.token)).status,403);
  await bindStudent(s,p);
  const path='/api/student/state/growing-math-lessons-v1';
  assert.equal((await call(path,'PUT',{revision:0,value:JSON.stringify({version:1,topics:{'tri-lines':{seen:true}},tools:{days:{'2026-10-24':{'tri-lines':{ms:60000}}}}})},s.token)).status,200);
  for(const [target,token] of [[route,p.token],[adminRoute,a.token],[route,a.token]]){
    const response=await call(target,'GET',undefined,token);assert.equal(response.status,200);
    const data=await response.json() as any;assert.equal(data.units[0].activeMinutes,1);assert.equal(data.units[0].mastered,0);assert.equal(data.units[0].id,'math-8a-01');
    assert.equal(data.units[0].topics,undefined);
  }
  assert.equal((await call(route,'GET',undefined,other.token)).status,404);
  assert.equal((await call('/api/admin/students/'+p.user.id+'/unit-report','GET',undefined,a.token)).status,404);
  await pg.query('DELETE FROM "GrowingAdministrators" WHERE "UserId"=?1',[a.user.id]);
  assert.equal((await call(adminRoute,'GET',undefined,a.token)).status,403);
  await call('/api/student/parents/'+p.user.id,'DELETE',undefined,s.token);
  assert.equal((await call(route,'GET',undefined,p.token)).status,404);
});
