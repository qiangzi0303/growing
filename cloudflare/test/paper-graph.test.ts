import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {createHandler,type Env} from '../src/index';
import {connect,type Database} from '../src/database';
import {paperAI} from '../src/paper-ai';
import catalog from '../src/photo-learning-catalog.json';
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database;
const handler=createHandler(()=>db),env={AUTH_LIMITER:{limit:async()=>({success:true})}} as unknown as Env;
async function call(path:string,token?:string,data?:unknown){return handler(new Request('https://learn.test/api'+path,{method:data?'POST':'GET',headers:{'X-Growing-Client':'1','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})}),env,{waitUntil:()=>{}});}
async function register(name:string,role='Student'){const r=await call('/auth/register',undefined,{username:name,displayName:name,role,password:'Testing-1987!'});assert.equal(r.status,200,await r.clone().text());return await r.json() as any;}
before(async()=>{db=connect(await mf.getD1Database('DB') as any);for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));}});
after(async()=>mf.dispose());
test('cross-unit reliable links deduplicate, tested is not a gap, static archives require personal evidence',async()=>{
 const a=await register('evidence_links');
 const p=await paper(a.user.id);const staticPaper=await paper(a.user.id,'unit-wrong-midterm-20261029');
 await db.query('UPDATE "GrowingPhotoQuestions" SET "PaperWrong"=1 WHERE "Id"=?1',[staticPaper.q]);
 const node=catalog.knowledge.find(n=>n.subject==='math'&&n.unitId!=='math-8a-01')!;
 const physics=catalog.knowledge.find(n=>n.subject==='physics')!;
 const knowledge=[{nodeId:node.id,role:'tested',confidence:.9},{nodeId:node.id,role:'tested',confidence:.9},{nodeId:physics.id,role:'gap',confidence:1}];
 const id=crypto.randomUUID();await db.query('INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt") VALUES (?1,?2,?1,?1,1,\'correction\',\'work\',?3,\'2026\')',[id,p.q,JSON.stringify({verdict:'partial',knowledge,models:[],corrections:[]})]);
 const route='/question-bank/unit-summary?studentId='+a.user.id+'&subject=math';
 const s=await (await call(route,a.token)).json() as any;
 assert.equal(s.units.find((u:any)=>u.id==='math-8a-01').wrongCount,1);
 assert.equal(s.units.find((u:any)=>u.id===node.unitId).wrongCount,1);
 const graph=await (await call('/question-bank/paper-graph?studentId='+a.user.id,a.token)).json() as any;
 assert.deepEqual(graph.questions[0].nodeIds,[node.id]);assert.deepEqual(graph.questions[0].gapNodeIds,[]);
 const wrong=await (await call('/question-bank/questions?studentId='+a.user.id+'&wrong=1&unitId='+node.unitId,a.token)).json() as any;assert.equal(wrong.total,1);
 await db.query('UPDATE "GrowingPhotoQuestions" SET "Revision"=2 WHERE "Id"=?1',[p.q]);
 const next=await (await call(route,a.token)).json() as any;assert.equal(next.units.find((u:any)=>u.id===node.unitId).wrongCount,0);
});
test('original review persists full response and reuses revision result without another AI call',async()=>{
 const a=await register('original_cache');const p=await paper(a.user.id,'paper-draft');
 await db.query('UPDATE "GrowingPhotoQuestions" SET "Pages"=\'[1]\',"QuestionType"=\'written\' WHERE "Id"=?1',[p.q]);
 await db.query('INSERT INTO "GrowingQuestionPages" ("PaperId","Page","Image") VALUES (?1,1,?2)',[p.id,'data:image/jpeg;base64,/9j/AA==']);
 let calls=0;const value={needsReview:false,verdict:'incorrect',feedback:'wrong step',corrections:[{location:'step 1',original:'1=2',issue:'unequal',correction:'1=1'}],answerAnnotations:[]};
 const upstream=(async()=>{calls++;return Response.json({choices:[{message:{content:JSON.stringify(value)},finish_reason:'stop'}]});}) as typeof fetch;
 const vision={HANDWRITING_VISION_MODELS:JSON.stringify([{name:'test',model:'test',endpoint:'https://test.invalid',apiKey:'test'}]),AI_LIMITER:{limit:async()=>({success:true})}};
 const run=(requestId=crypto.randomUUID(),force=false)=>paperAI(db,a.user.id,p.q,{studentId:a.user.id,revision:1,kind:'review',requestId,force},vision,a.user.id,new AbortController().signal,upstream);
 const requestId=crypto.randomUUID();const first=await (await run(requestId)).json();assert.equal(calls,1);
 assert.deepEqual(await (await run()).json(),first);assert.equal(calls,1);
 assert.deepEqual(await (await run(requestId,true)).json(),first);assert.equal(calls,1);
 await run(crypto.randomUUID(),true);assert.equal(calls,2);
 const grades=await db.query('SELECT "Id" FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[p.q]);assert.equal(grades.length,2);
 await db.query('UPDATE "GrowingPhotoQuestions" SET "FigureVersion"="FigureVersion"+1,"FigureImage"=?2 WHERE "Id"=?1',[p.q,'data:image/jpeg;base64,/9j/AQ==']);
 await assert.rejects(run(requestId),(e:any)=>e.status===409);
 await run();assert.equal(calls,3,'figure change must miss stored original review');
 let release!:()=>void,started!:()=>void;
 const gate=new Promise<void>(r=>release=r),entered=new Promise<void>(r=>started=r);
 const slow=(async(_url:any,options:any)=>{const body=JSON.parse(options.body);assert.ok(body.messages[1].content.some((c:any)=>c.image_url?.url==='data:image/jpeg;base64,/9j/AQ=='));started();await gate;return Response.json({choices:[{message:{content:JSON.stringify(value)},finish_reason:'stop'}]});}) as typeof fetch;
 const pending=paperAI(db,a.user.id,p.q,{revision:1,kind:'review',requestId:crypto.randomUUID(),force:true},vision,a.user.id,new AbortController().signal,slow);
 await entered;await db.query('UPDATE "GrowingPhotoQuestions" SET "FigureVersion"="FigureVersion"+1 WHERE "Id"=?1',[p.q]);release();
 await assert.rejects(pending,(e:any)=>e.status===409);
 assert.equal((await db.query('SELECT "Id" FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[p.q])).length,3);
});
test('unit summary and graph share unresolved evidence across review, correction and subjects',async()=>{
 const a=await register('evidence_owner');
 const p=await paper(a.user.id,'paper-draft','english',0,'english-8a-01');
 const add=async(verdict:string,revision=1)=>{const id=crypto.randomUUID();await db.query('INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt") VALUES (?1,?2,?1,?1,?3,\'correction\',\'work\',?4,\'2026\')',[id,p.q,revision,JSON.stringify({verdict,knowledge:[],models:[],corrections:[],feedback:'evidence'})]);};
 const summary=async()=>{const r=await call('/question-bank/unit-summary?studentId='+a.user.id+'&subject=english',a.token);assert.equal(r.status,200);return r.json() as any;};
 await add('incorrect');await add('review');await add('correct',0);
 assert.equal((await summary()).units.find((u:any)=>u.id==='english-8a-01').wrongCount,1);
 const graph=await (await call('/question-bank/paper-graph?studentId='+a.user.id+'&subject=english&paperId='+p.id,a.token)).json() as any;
 assert.equal(graph.questions[0].needsCorrection,true);assert.deepEqual(graph.questions[0].gapNodeIds,[]);
 const wrong=await (await call('/question-bank/questions?studentId='+a.user.id+'&unitId=english-8a-01&wrong=1',a.token)).json() as any;
 assert.equal(wrong.total,1);
 await add('correct');assert.equal((await summary()).units.find((u:any)=>u.id==='english-8a-01').wrongCount,0);
 assert.equal((await call('/question-bank/cache-access?studentId='+a.user.id,a.token)).status,200);
});
async function paper(student:string,mode='paper',subject='math',reviewed=1,unitId='math-8a-01'){
 const id=crypto.randomUUID(),q=crypto.randomUUID();
 await db.query('INSERT INTO "GrowingQuestionPapers" ("Id","StudentId","RequestId","Fingerprint","Title","Warnings","CreatedAt","Mode","Subject") VALUES (?1,?2,?1,?1,\'Photo paper\',\'[]\',\'2026\',?3,?4)',[id,student,mode,subject]);
 await db.query('INSERT INTO "GrowingPhotoQuestions" ("Id","PaperId","Number","Text","Answer","UnitId","Reason","Uncertain","Pages","Reviewed") VALUES (?1,?2,\'11\',\'Question\',\'\',?3,\'\',\'[]\',\'[]\',?4)',[q,id,unitId,reviewed]);
 return {id,q};
}

test('photo practice candidates stay scoped, retain all originals and select one reviewed written question per level',async()=>{
 const a=await register('practice_owner'),b=await register('practice_other');
 const node=catalog.knowledge.find(n=>n.subject==='math'&&n.unitId==='math-8a-01')!;
 const add=async(level:string,type='written',mode='paper',reviewed=1,owner=a.user.id)=>{
  const p=await paper(owner,mode,'math',reviewed);
  await db.query('UPDATE "GrowingPhotoQuestions" SET "Practice"=?2,"QuestionType"=?3,"Text"=?4 WHERE "Id"=?1',[p.q,JSON.stringify({nodeId:node.id,level}),type,level+' '+p.q]);return p;
 };
 const old=await add('hard'),newer=await add('hard'),comprehensive=await add('comprehensive');
 const basic=await add('basic','choice');await add('hard','written','paper-draft');await add('hard','written','paper',0);await add('hard','written','paper',1,b.user.id);
 const invalid=await add('hard');await db.query('UPDATE "GrowingPhotoQuestions" SET "Figures"=\'[{"page":1,"x":0,"y":0,"width":1,"height":1}]\' WHERE "Id"=?1',[invalid.q]);
 const route='/question-bank/practice-candidates?studentId='+a.user.id+'&unitId=math-8a-01';
 assert.equal((await call(route,b.token)).status,404);
 const response=await call(route,a.token);assert.equal(response.status,200,await response.clone().text());const data=await response.json() as any;
 assert.equal(data.totalPerNode,10);assert.equal(data.counts[node.id],5);
 assert.deepEqual(data.questions.map((q:any)=>q.id).sort(),[newer.q,comprehensive.q,basic.q].sort());
 assert.equal(data.questions[0].latestGrade,null);
 const all=await (await call('/question-bank/questions?studentId='+a.user.id+'&unitId=math-8a-01&nodeId='+node.id,a.token)).json() as any;
 assert.equal(all.total,6);assert.ok(all.rows.some((q:any)=>q.id===old.q),'unselected originals remain in the bank');
 for(let i=0;i<8;i++)await add('basic','choice');
 const capped=await (await call(route,a.token)).json() as any;
 assert.equal(capped.questions.filter((q:any)=>q.practice.level==='basic').length,6);
 assert.equal(capped.counts[node.id],13,'the full bank is retained beyond the six basic slots');
 const g=crypto.randomUUID();await db.query('INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt") VALUES (?1,?2,?1,?1,1,\'correction\',\'work\',?3,\'2026\')',[g,newer.q,JSON.stringify({verdict:'incorrect',knowledge:[],models:[],corrections:[]})]);
 const wrongRoute='/question-bank/questions?studentId='+a.user.id+'&unitId=math-8a-01&nodeId='+node.id+'&wrong=1';
 assert.equal(((await (await call(wrongRoute,a.token)).json()) as any).total,1,'primary classification routes wrong answers even without grade knowledge tags');
 await db.query('UPDATE "GrowingPhotoQuestions" SET "Revision"=2 WHERE "Id"=?1',[newer.q]);
 assert.equal(((await (await call(wrongRoute,a.token)).json()) as any).total,0,'stale wrong grades do not count');
});
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
 assert.equal((await call('/question-bank/cache-access?studentId='+a.user.id,p.token)).status,404);
 await db.query('INSERT INTO "GrowingFamilyLinks" ("ParentId","StudentId","CreatedAt") VALUES (?1,?2,\'2026\')',[p.user.id,a.user.id]);
 assert.equal((await call(route,p.token)).status,200);
 assert.deepEqual(await (await call('/question-bank/cache-access?studentId='+a.user.id,p.token)).json(),{authorized:true});
 await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "ParentId"=?1 AND "StudentId"=?2',[p.user.id,a.user.id]);
 assert.equal((await call(route,p.token)).status,404);
 assert.equal((await call('/question-bank/cache-access?studentId='+a.user.id,p.token)).status,404);
});
test('physics and individual archive records count only their own current evidence',async()=>{
 const a=await register('physics_evidence');
 const node=catalog.knowledge.find(n=>n.subject==='physics')!;
 const p=await paper(a.user.id,'grade','physics',0,node.unitId);
 const archive=await paper(a.user.id,'unit-wrong-midterm-20261029');
 for(const [q,knowledge] of [[p.q,[{nodeId:node.id,role:'gap',confidence:.95}]],[archive.q,[]]] as const){
  const id=crypto.randomUUID();await db.query('INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt") VALUES (?1,?2,?1,?1,1,\'correction\',\'work\',?3,\'2026\')',[id,q,JSON.stringify({verdict:'incorrect',knowledge,models:[],corrections:[{issue:'actual mistake'}]})]);
 }
 const g=await (await call('/question-bank/paper-graph?studentId='+a.user.id+'&subject=physics',a.token)).json() as any;
 assert.equal(g.questions.length,1);assert.equal(g.nodes.find((n:any)=>n.id===node.id).gapCount,1);
 assert.deepEqual(g.questions[0].errorReasons,['actual mistake']);
 const personalGraph=await (await call('/question-bank/paper-graph?studentId='+a.user.id+'&subject=math',a.token)).json() as any;
 assert.ok(personalGraph.questions.some((q:any)=>q.id===archive.q&&q.needsCorrection));
 const s=await (await call('/question-bank/unit-summary?studentId='+a.user.id+'&subject=math',a.token)).json() as any;
 assert.equal(s.units.find((u:any)=>u.id==='math-8a-01').wrongCount,1);
 assert.equal((await call('/question-bank/unit-summary?studentId='+a.user.id+'&subject=invalid',a.token)).status,400);
});
