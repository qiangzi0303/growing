import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {createHandler,type Env} from '../src/index';
import {connect,type Database} from '../src/database';
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database;
const handler=createHandler(()=>db),env={AUTH_LIMITER:{limit:async()=>({success:true})}} as unknown as Env;
async function call(path:string,token?:string,data?:unknown){return handler(new Request('https://learn.test/api'+path,{method:data?'POST':'GET',headers:{'X-Growing-Client':'1','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})}),env,{waitUntil:()=>{}});}
async function register(name:string,role='Student'){const r=await call('/auth/register',undefined,{username:name,displayName:name,role,password:'Testing-1987!'});assert.equal(r.status,200,await r.clone().text());return await r.json() as any;}
before(async()=>{db=connect(await mf.getD1Database('DB') as any);for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));}});
after(async()=>mf.dispose());
async function paper(student:string,mode='paper',subject='math',reviewed=1,unitId='math-8a-01'){
 const id=crypto.randomUUID(),q=crypto.randomUUID();
 await db.query('INSERT INTO "GrowingQuestionPapers" ("Id","StudentId","RequestId","Fingerprint","Title","Warnings","CreatedAt","Mode","Subject") VALUES (?1,?2,?1,?1,\'Photo paper\',\'[]\',\'2026\',?3,?4)',[id,student,mode,subject]);
 await db.query('INSERT INTO "GrowingPhotoQuestions" ("Id","PaperId","Number","Text","Answer","UnitId","Reason","Uncertain","Pages","Reviewed") VALUES (?1,?2,\'11\',\'Question\',\'\',?3,\'\',\'[]\',\'[]\',?4)',[q,id,unitId,reviewed]);
 return {id,q};
}
test('graph HTTP route isolates students and preserves current partial evidence, pending questions and distinct repeated numbers',async()=>{
 const a=await register('graph_owner'),b=await register('graph_other');
 const route='/question-bank/paper-graph?studentId='+a.user.id;
 assert.equal((await call(route)).status,401);assert.equal((await call(route,b.token)).status,404);
 const ready=await paper(a.user.id),otherNumber=await paper(a.user.id),draft=await paper(a.user.id,'paper-draft'),unreviewed=await paper(a.user.id,'paper','math',0),unknown=await paper(a.user.id,'paper','math',1,'');
 await paper(b.user.id);await paper(a.user.id,'exam');await paper(a.user.id,'unit-wrong-midterm-20261029');await paper(a.user.id,'paper','english');
 for(const [revision,verdict,node,at] of [[1,'partial','tri-angles','2026-01-01'],[0,'correct','isosceles','2026-01-02']] as const){
  const id=crypto.randomUUID();await db.query('INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt") VALUES (?1,?2,?1,?1,?3,\'initial\',\'work\',?4,?5)',[id,ready.q,revision,JSON.stringify({verdict,knowledge:[{nodeId:node,confidence:.9},{nodeId:node,confidence:.9},{nodeId:'fake',confidence:1},{nodeId:'congruence',confidence:.5}]}),at]);
 }
 const response=await call(route,a.token);assert.equal(response.status,200,await response.clone().text());const data=await response.json() as any;
 assert.equal(data.studentId,a.user.id);assert.equal(data.questions.length,5);
 const q=data.questions.find((q:any)=>q.id===ready.q);assert.equal(q.verdict,'partial');assert.deepEqual(q.nodeIds,['tri-angles']);assert.deepEqual(q.unitIds,['math-8a-01']);
 assert.ok(data.questions.some((q:any)=>q.id===otherNumber.q));
 for(const p of [draft,unreviewed]){const q=data.questions.find((q:any)=>q.id===p.q);assert.equal(q.pending,true);assert.deepEqual(q.unitIds,[]);assert.deepEqual(q.nodeIds,[]);assert.equal(q.verdict,null);}
 assert.deepEqual(data.questions.find((q:any)=>q.id===unknown.q).unitIds,[]);
 assert.ok(!JSON.stringify(data).includes('studentAnswer'));assert.ok(!JSON.stringify(data).includes('data:image'));
 await db.query('UPDATE "GrowingQuestionPapers" SET "Mode"=\'paper\' WHERE "Id"=?1',[draft.id]);
 const refreshed=await (await call(route,a.token)).json() as any;assert.equal(refreshed.questions.find((q:any)=>q.id===draft.q).pending,false);
});
test('parent graph access uses the live family link, and unlinking removes access',async()=>{
 const a=await register('graph_child'),p=await register('graph_parent','Parent');await paper(a.user.id);
 const route='/question-bank/paper-graph?studentId='+a.user.id;
 assert.equal((await call(route,p.token)).status,404);
 await db.query('INSERT INTO "GrowingFamilyLinks" ("ParentId","StudentId","CreatedAt") VALUES (?1,?2,\'2026\')',[p.user.id,a.user.id]);
 assert.equal((await call(route,p.token)).status,200);
 await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "ParentId"=?1 AND "StudentId"=?2',[p.user.id,a.user.id]);
 assert.equal((await call(route,p.token)).status,404);
});
