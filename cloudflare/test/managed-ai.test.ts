import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { connect, Store, type Database } from '../src/database';
import { hash } from '../src/auth';
import { createHandler, type Env } from '../src/index';
import { ManagedAI, resolveManagedModel, recordManagedUsage } from '../src/managed-ai';
import { visionCompletion } from '../src/handwriting-vision';

const mf = new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database; let limited=false;
const env={AI_CONFIG_ENCRYPTION_KEY:'ab'.repeat(32),AI_LIMITER:{limit:async()=>({success:!limited})},AI_USAGE_LIMITER:{limit:async()=>({success:!limited})}} as unknown as Env;
const handler=createHandler(()=>db);
const tokens={admin:'a'.repeat(64),alice:'b'.repeat(64),bob:'c'.repeat(64)};
async function call(path:string,method='GET',data?:unknown,who:keyof typeof tokens|'none'='admin') {
  return handler(new Request('https://example.test'+path,{method,headers:{'X-Growing-Client':'1',...(who==='none'?{}:{Authorization:'Bearer '+tokens[who]}),'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)}),env,{waitUntil(){}});
}
before(async()=>{
 const d1=await mf.getD1Database('DB');db=connect(d1);
 for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
  const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');
  for(const statement of sql.replace(/^\s*--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean))await db.query(statement);
 }
 const store=new Store(db);
 for(const name of ['admin','alice','bob'] as const){await store.register({id:name,username:name,displayName:name,role:'Student',roleConfirmed:1,passwordHash:'test'});await store.createSession(await hash(tokens[name]),name,new Date(Date.now()+86400000).toISOString(),'test','Student');}
 await db.query('INSERT INTO GrowingAdministrators(UserId) VALUES (?)',['admin']);
});
after(async()=>{await mf.dispose()});
test('managed config permissions, encrypted storage, secret retention and no-store delivery',async()=>{
 assert.equal((await call('/api/ai/config','GET',undefined,'none')).status,401);
 assert.equal((await call('/api/admin/ai/models','GET',undefined,'alice')).status,403);
 let r=await call('/api/admin/ai/models/chat','PUT',{model:'test-model',endpoint:'https://provider.test/v1/chat/completions',apiKey:'secret-test-key',enabled:true});assert.equal(r.status,200);
 assert.ok(!(await r.text()).includes('secret-test-key'));
 const raw=await db.query('SELECT * FROM GrowingAIModels');assert.ok(!JSON.stringify(raw).includes('secret-test-key'));
 r=await call('/api/ai/config','GET',undefined,'alice');assert.match(r.headers.get('Cache-Control')||'',/no-store/);let data:any=await r.json();assert.equal(data.models[0].apiKey,'secret-test-key');assert.equal(data.models[0].revision,1);
 r=await call('/api/admin/ai/models/chat','PUT',{model:'new-model',endpoint:'https://provider.test/v1/chat/completions',enabled:true});assert.equal(r.status,200);
 data=await (await call('/api/ai/config')).json();assert.equal(data.models[0].apiKey,'secret-test-key');assert.equal(data.models[0].revision,2);
 assert.equal((await call('/api/admin/ai/models/unknown','PUT',{})).status,400);
 assert.equal((await call('/api/admin/ai/models/chat','PUT',{model:'x',endpoint:'http://provider.test',enabled:true})).status,400);
});
test('usage belongs to session, deduplicates per account, preserves old revision and unknown totals',async()=>{
 const usage={requestId:'request-1',configId:'chat',configRevision:1,feature:'lesson',status:'success',inputTokens:10,outputTokens:5,totalTokens:15,userId:'bob'};
 for(let i=0;i<2;i++)assert.equal((await call('/api/ai/usage','POST',usage,'alice')).status,200);
 assert.equal((await call('/api/ai/usage','POST',{...usage,inputTokens:null,outputTokens:null,totalTokens:null,status:'error'},'bob')).status,200);
 let data:any=await (await call('/api/admin/ai/usage')).json();assert.equal(data.summary.requests,2);assert.equal(data.summary.totalTokens,15);assert.equal(data.summary.unknownRequests,1);assert.equal(data.summary.failedRequests,1);assert.equal(data.calls.find((c:any)=>c.userId==='alice').model,'test-model');assert.ok(data.calls.every((c:any)=>c.source==='client'));
 data=await (await call('/api/admin/ai/usage?userId=alice&pageSize=1')).json();assert.equal(data.total,1);assert.equal(data.accounts.length,1);
 assert.equal((await call('/api/admin/ai/usage','GET',undefined,'alice')).status,403);
 for(const change of [{totalTokens:-1},{inputTokens:1.5},{configRevision:999},{status:'fake'},{totalTokens:999},{inputTokens:null}])assert.equal((await call('/api/ai/usage','POST',{...usage,requestId:crypto.randomUUID(),...change},'alice')).status,400);
 assert.equal((await call('/api/admin/ai/usage?from=2026-02-31')).status,400);
 assert.equal((await call('/api/admin/ai/usage?from=2026-99-01')).status,400);
 limited=true;assert.equal((await call('/api/ai/usage','POST',usage,'alice')).status,429);limited=false;
});
test('usage reporting is independent of the slow model request quota',async()=>{
 const previous=env.AI_LIMITER;env.AI_LIMITER={limit:async()=>({success:false})};
 try{assert.equal((await call('/api/ai/usage','POST',{requestId:'request-1',configId:'chat',configRevision:1,feature:'lesson',status:'success',inputTokens:10,outputTokens:5,totalTokens:15},'alice')).status,200);}
 finally{env.AI_LIMITER=previous;}
});
test('Beijing dates include only the selected local day and server records have trusted source',async()=>{
 const config=await resolveManagedModel(db,env,'chat');assert.ok(config);
 await recordManagedUsage(db,'alice',config,{requestId:'server-boundary',feature:'recognize',status:'success',inputTokens:2,outputTokens:3,totalTokens:5});
 await db.query('UPDATE GrowingAIUsage SET CreatedAt=? WHERE RequestId=?',['2026-11-22T16:00:00.000Z','server-boundary']);
 let data:any=await(await call('/api/admin/ai/usage?from=2026-11-23&to=2026-11-23&userId=alice')).json();assert.ok(data.calls.some((c:any)=>c.requestId==='server-boundary'&&c.source==='server'));
 data=await(await call('/api/admin/ai/usage?from=2026-11-22&to=2026-11-22')).json();assert.ok(!data.calls.some((c:any)=>c.requestId==='server-boundary'));
});
test('disabled models are omitted; encryption failures never fall back to plaintext',async()=>{
 const model={model:'disabled',endpoint:'https://provider.test/v1/chat/completions',enabled:false};
 assert.equal((await call('/api/admin/ai/models/chat','PUT',model)).status,200);
 const data:any=await(await call('/api/ai/config')).json();assert.equal(data.models.length,0);
 const key=env.AI_CONFIG_ENCRYPTION_KEY;delete env.AI_CONFIG_ENCRYPTION_KEY;
 assert.equal((await call('/api/admin/ai/models/chat','PUT',{...model,enabled:true})).status,503);env.AI_CONFIG_ENCRYPTION_KEY=key;
 assert.equal((await call('/api/admin/ai/models/chat','PUT',{...model,enabled:true})).status,200);
 env.AI_CONFIG_ENCRYPTION_KEY='cd'.repeat(32);const response=await call('/api/ai/config');assert.equal(response.status,503);assert.ok(!(await response.text()).includes('secret-test-key'));env.AI_CONFIG_ENCRYPTION_KEY=key;
});
test('existing vision uses managed full endpoint and bills invalid completions; disabled never falls back',async()=>{
 await call('/api/admin/ai/models/vision','PUT',{model:'managed-vision',endpoint:'https://provider.test/v1/chat/completions',apiKey:'vision-test-key',enabled:true});
 const visionEnv={...env,HANDWRITING_VISION_MODELS:JSON.stringify([{name:'legacy',model:'legacy',apiKey:'legacy-key',endpoint:'https://legacy.test/v1'}]),MANAGED_AI_CONTEXT:{db,userId:'alice',feature:'vision-test'}};
 let attempts=0;
 const upstream=(async(url:any,options:any)=>{attempts++;assert.equal(String(url),'https://provider.test/v1/chat/completions');assert.equal(new Headers(options.headers).get('Authorization'),'Bearer vision-test-key');return Response.json({usage:{prompt_tokens:5,completion_tokens:7,total_tokens:12},choices:[{finish_reason:'stop',message:{content:'{}'}}]})}) as typeof fetch;
 await assert.rejects(visionCompletion(visionEnv,new AbortController().signal,upstream,'test',{},[],()=>null));
 let data:any=await(await call('/api/admin/ai/usage?configId=vision')).json();assert.equal(data.summary.totalTokens,12);assert.equal(data.summary.failedRequests,1);assert.equal(data.calls[0].source,'server');
 await call('/api/admin/ai/models/vision','PUT',{model:'managed-vision',endpoint:'https://provider.test/v1/chat/completions',enabled:false});
 await assert.rejects(visionCompletion(visionEnv,new AbortController().signal,upstream,'test',{},[],()=>({ok:true})),/停用/);assert.equal(attempts,1);
});
test('legacy fallback attempts retain exact model names and unknown usage',async()=>{
 const visionEnv={...env,PAPER_RECOGNITION_MODELS:JSON.stringify([{name:'first',model:'first',apiKey:'legacy-key',endpoint:'https://legacy.test/v1'},{name:'second',model:'second',apiKey:'legacy-key',endpoint:'https://legacy.test/v1'}]),MANAGED_AI_CONTEXT:{db,userId:'alice',feature:'legacy-test'}};
 let attempts=0;const upstream=(async()=>{attempts++;return attempts===1?new Response('',{status:502}):Response.json({choices:[{finish_reason:'stop',message:{content:'{}'}}]})}) as typeof fetch;
 await visionCompletion(visionEnv,new AbortController().signal,upstream,'test',{},[],()=>({ok:true}),true,false,{paperRecognition:true});
 const data:any=await(await call('/api/admin/ai/usage?configId=paperRecognition')).json();assert.equal(data.summary.requests,2);assert.equal(data.summary.unknownRequests,2);assert.deepEqual(data.calls.map((c:any)=>c.model).sort(),['first','second']);
});
test('a concurrent administrator disable cannot restore a legacy vision provider',async()=>{
 await call('/api/admin/ai/models/vision','PUT',{model:'managed-vision',endpoint:'https://provider.test/v1/chat/completions',enabled:true});
 let reads=0,attempts=0;
 const racing:Database={...db,async query<T>(sql:string,params?:unknown[]){const rows=await db.query<T>(sql,params);if(sql.startsWith('SELECT Enabled FROM GrowingAIModels')){reads++;await db.query('UPDATE GrowingAIModels SET Enabled=0 WHERE Id=?',['vision']);}return rows;}};
 const e={...env,HANDWRITING_VISION_MODELS:JSON.stringify([{name:'legacy',model:'legacy',apiKey:'legacy-key',endpoint:'https://legacy.test/v1'}]),MANAGED_AI_CONTEXT:{db:racing,userId:'alice',feature:'race-test'}};
 await assert.rejects(visionCompletion(e,new AbortController().signal,(async()=>{attempts++;return Response.json({choices:[{finish_reason:'stop',message:{content:'{}'}}]});}) as typeof fetch,'test',{},[],()=>({ok:true})),/停用/);
 assert.equal(reads,1);assert.equal(attempts,0);
});
test('statistics share one database snapshot even when new usage arrives during reading',async()=>{
 let inserted=false;
 const interleaved:Database={...db,async query<T>(sql:string,params?:unknown[]){const rows=await db.query<T>(sql,params);if(!inserted&&sql.includes('COUNT(*) AS requests')){inserted=true;await recordManagedUsage(db,'alice',{id:'chat',revision:1},{requestId:'between-stats-reads',feature:'stats-race',status:'success',inputTokens:1,outputTokens:1,totalTokens:2});}return rows;}};
 const result=await new ManagedAI(interleaved,env).stats(new URLSearchParams('pageSize=100'));
 assert.equal(result.total,result.calls.length);assert.equal(result.summary.requests,result.accounts.reduce((n:any,a:any)=>n+a.requests,0));
});
test('legacy realtime endpoints retire without a provider request',async()=>{
 let called=false;const h=createHandler(()=>db,(async()=>{called=true;return new Response('v=0');}) as typeof fetch);
 for(const path of ['/api/realtime/config','/api/realtime/connect']){
  const response=await h(new Request('https://example.test'+path,{method:path.endsWith('connect')?'POST':'GET',headers:{Authorization:'Bearer '+tokens.alice,'X-Growing-Client':'1'}}),env,{waitUntil(){}});
  assert.equal(response.status,410);assert.match(await response.text(),/升级|刷新/);
 }
 assert.equal(called,false);
});
