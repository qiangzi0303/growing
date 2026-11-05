import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { createHandler, type Env } from '../src/index';
import { connect, type Database } from '../src/database';
import handwriting from '../../app/src/main/assets/web/app-design/handwriting-core.js';

const mf = new Miniflare(convertV4MiniflareOptions({ modules:true, script:'export default {fetch(){return new Response("ok")}}', compatibilityDate:'2026-10-22', d1Databases:['DB'] }));
let db: Database;
let aiCalls = 0;
const handler = createHandler(() => db, (async () => { aiCalls++; throw Error('No AI in history'); }) as typeof fetch);
const env = { AUTH_LIMITER:{ limit:async()=>({success:true}) }, ASSETS:{ fetch:async()=>new Response('asset') } } as unknown as Env;
async function call(path:string, token?:string, data?:unknown) {
  return handler(new Request('https://learn.test/api'+path, { method:data===undefined?'GET':'POST', headers:{'Content-Type':'application/json','X-Growing-Client':'1',...(token?{Authorization:'Bearer '+token}:{})}, ...(data===undefined?{}:{body:JSON.stringify(data)}) }),env,{waitUntil(){}});
}
async function register(role='Student') {
  const response=await call('/auth/register',undefined,{username:'hist_'+crypto.randomUUID().replaceAll('-','').slice(0,12),displayName:'历史测试',password:'History-Only-123!',role});
  assert.equal(response.status,200,await response.clone().text()); return response.json() as Promise<any>;
}
before(async()=>{
  db=connect(await mf.getD1Database('DB') as unknown as D1Database);
  for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()) {
    const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');
    await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
  }
});
after(async()=>{await mf.dispose();});

test('read-only unit answer discovery enforces current bindings and scoped detail without AI or writes',async()=>{
  const student=await register(), other=await register(), parent=await register('Parent'), admin=await register();
  await db.query('INSERT INTO "GrowingAdministrators" ("UserId") VALUES (?1)',[admin.user.id]);
  const created=await call('/question-bank/unit-wrong',student.token,{studentId:student.user.id,questionId:'1025141010-28'});
  assert.equal(created.status,200);
  const {question}=await created.json() as any;
  for(const [index,verdict] of ['partial','correct'].entries()) await db.query('INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt") VALUES (?1,?2,?3,?4,1,\'correction\',?5,?6,?7)',[crypto.randomUUID(),question.id,crypto.randomUUID(),'fixture-'+index,'答案'+index,JSON.stringify({verdict,score:index?100:50,feedback:'批改'+index,corrections:[],knowledge:[],models:[],answerPages:['fixture-image-'+index]}),'2026-11-0'+(index+1)+'T00:00:00Z']);
  const url='/question-bank/unit-wrong-history?studentId='+student.user.id;
  assert.equal((await call(url)).status,401);
  assert.equal((await call(url,parent.token)).status,404);
  await db.query('INSERT INTO "GrowingFamilyLinks" ("ParentId","StudentId","CreatedAt") VALUES (?1,?2,?3)',[parent.user.id,student.user.id,'2026-11-05T00:00:00Z']);
  const counts=()=>db.query('SELECT (SELECT count(*) FROM "GrowingQuestionPapers") AS papers,(SELECT count(*) FROM "GrowingPhotoQuestions") AS questions,(SELECT count(*) FROM "GrowingPhotoGrades") AS grades,(SELECT count(*) FROM "GrowingDocuments") AS documents');
  const before=await counts();
  for(const token of [parent.token,admin.token]) {
    const response=await call(url,token); assert.equal(response.status,200);
    const result=await response.json() as any;
    assert.equal(result.pageSize,20); assert.equal(result.total,1);
    assert.equal(result.rows[0].gradeCount,2);
    assert.ok(result.rows.some((row:any)=>row.id===question.id));
    assert.ok(result.rows.every((row:any)=>!('grades' in row)&&!('answerPages' in row)&&!('pages' in row)));
    const detail=await call('/question-bank/questions/'+question.id+'/review?studentId='+student.user.id,token);
    assert.equal(detail.status,200);
    assert.deepEqual(((await detail.json() as any).question.grades).map((g:any)=>g.result.answerPages),[['fixture-image-0'],['fixture-image-1']]);
  }
  assert.equal((await call(url+'&page=0',parent.token)).status,400);
  assert.equal((await call(url+'&page=2',parent.token)).status,200);
  assert.equal((await call('/question-bank/questions/'+question.id+'/review?studentId='+other.user.id,admin.token)).status,404);
  assert.equal((await call('/question-bank/unit-wrong-history?studentId='+other.user.id,parent.token)).status,404);
  assert.deepEqual(await counts(),before); assert.equal(aiCalls,0);
  await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "ParentId"=?1',[parent.user.id]);
  assert.equal((await call(url,parent.token)).status,404);
  assert.equal((await call('/question-bank/questions/'+question.id+'/review?studentId='+student.user.id,parent.token)).status,404);
});

test('manuscript key reads keep originals within the selected student and recheck revoked links',async()=>{
  const student=await register(), other=await register(), parent=await register('Parent');
  const key='growing-handwriting-v1:'+crypto.randomUUID();
  const original={version:1,subject:'math',unitId:'math-8a-01',mode:'solution',prompt:'只读原稿',pages:[[]],revision:0,recognition:null,grades:[],updatedAt:'2026-11-05T00:00:00Z'};
  assert.equal(handwriting.validate(original),true);
  await db.query('INSERT INTO "GrowingDocuments" ("StudentId","Key","Value","Revision","UpdatedAt") VALUES (?1,?2,?3,1,?4)',[student.user.id,key,JSON.stringify(original),original.updatedAt]);
  await db.query('INSERT INTO "GrowingFamilyLinks" ("ParentId","StudentId","CreatedAt") VALUES (?1,?2,?3)',[parent.user.id,student.user.id,original.updatedAt]);
  const url='/parent/children/'+student.user.id+'/handwriting?key='+encodeURIComponent(key);
  const read=await call(url,parent.token);assert.equal(read.status,200);assert.deepEqual((await read.json() as any).original,original);
  assert.equal((await call('/parent/children/'+other.user.id+'/handwriting?key='+encodeURIComponent(key),parent.token)).status,404);
  await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "ParentId"=?1',[parent.user.id]);
  assert.equal((await call(url,parent.token)).status,404);
  assert.equal(aiCalls,0);
});
