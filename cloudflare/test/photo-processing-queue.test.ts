import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {connect,HttpError,type Database} from '../src/database';
import {consumePhotoJobs,enqueuePhotoJob,recoverPhotoJobs} from '../src/photo-processing-agent';
import {PaperImportJobs} from '../src/paper-import-jobs';
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database,env:any;const sent:any[]=[];const student=crypto.randomUUID();
before(async()=>{
 const binding=await mf.getD1Database('DB');db=connect(binding as any);
 for(const f of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
  const sql=await readFile(new URL('../migrations/'+f,import.meta.url),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
 }
 await db.query(`INSERT INTO GrowingUsers(Id,Username,NormalizedName,DisplayName,Role,PasswordHash,CreatedAt,SearchName,RoleConfirmed) VALUES (?1,'queue','queue','queue','Student','x','2026','queue',1)`,[student]);
 env={DB:binding,PHOTO_PROCESSING_QUEUE:{send:async(m:any)=>{sent.push(m);}},AI_LIMITER:{limit:async()=>({success:true})}};
});
after(async()=>mf.dispose());
async function create(extra:any={}){const id=crypto.randomUUID();await db.query('INSERT INTO GrowingPaperImportJobs(Id,StudentId,RequestId,Fingerprint,Subject,State,CreatedAt) VALUES (?1,?2,?1,?1,\'math\',?3,\'2026\')',[id,student,JSON.stringify({processor:'photo-agent-v1',actorId:student,error:'',paperId:null,...extra})]);return id;}
async function consume(id:string,revision=0,attempts=1){let ack=0,retry=0;await consumePhotoJobs({messages:[{body:{id,revision},attempts,ack(){ack++;},retry(){retry++;}}]} as any,env,{} as any);return {ack,retry};}
test('queue dispatch injects actual account and policy; stale revision never advances',async()=>{
 const id=await create();let calls=0;const original=PaperImportJobs.prototype.backendStep;
 PaperImportJobs.prototype.backendStep=async function(s,j,e){calls++;assert.equal(s,student);assert.equal(e.MANAGED_AI_CONTEXT?.userId,student);assert.ok(e.PHOTO_AGENT_INSTRUCTIONS?.length);await db.query('UPDATE GrowingPaperImportJobs SET Revision=Revision+1 WHERE Id=?1',[j]);return {status:'recognizing',revision:1} as any;};
 try{assert.deepEqual(await consume(id),{ack:1,retry:0});assert.deepEqual(sent.at(-1),{id,revision:1});assert.deepEqual(await consume(id),{ack:1,retry:0});assert.equal(calls,1);}finally{PaperImportJobs.prototype.backendStep=original;}
});
test('missing submitting actor stops task without model calls',async()=>{const id=await create({actorId:crypto.randomUUID()});assert.deepEqual(await consume(id),{ack:1,retry:0});const [r]=await db.query<any>('SELECT State FROM GrowingPaperImportJobs WHERE Id=?1',[id]);assert.match(JSON.parse(r.State).error,/权限/);});

test('administrator role follows HTTP authorization without requiring student role selection',async()=>{
 const admin=crypto.randomUUID();
 await db.query(`INSERT INTO GrowingUsers(Id,Username,NormalizedName,DisplayName,Role,PasswordHash,CreatedAt,RoleConfirmed) VALUES(?1,'queue-admin','queue-admin','admin','Student','x','2026',0)`,[admin]);
 await db.query('INSERT INTO GrowingAdministrators(UserId,CreatedAt) VALUES(?1,\'2026\')',[admin]);
 const id=await create({actorId:admin});const original=PaperImportJobs.prototype.backendStep;let called=false;
 PaperImportJobs.prototype.backendStep=async function(_s,_j,e){called=true;assert.equal(e.MANAGED_AI_CONTEXT?.userId,admin);return {status:'complete',revision:1} as any;};
 try{assert.deepEqual(await consume(id),{ack:1,retry:0});assert.ok(called);}finally{PaperImportJobs.prototype.backendStep=original;}
});
test('lease conflicts retry boundedly and recovery skips active leases and failed jobs',async()=>{
 const id=await create();await db.query('UPDATE GrowingPaperImportJobs SET LeaseUntil=?2 WHERE Id=?1',[id,Date.now()+120000]);assert.deepEqual(await consume(id),{ack:0,retry:1});assert.deepEqual(await consume(id,0,5),{ack:1,retry:0});
 const failed=await create({error:'failed'}),ready=await create();sent.length=0;await recoverPhotoJobs(env);assert.ok(sent.some(m=>m.id===ready));assert.ok(!sent.some(m=>m.id===id||m.id===failed));
});
test('enqueue failure leaves uploaded job available for scheduled recovery',async()=>{await enqueuePhotoJob({...env,PHOTO_PROCESSING_QUEUE:{send:async()=>{throw Error('offline');}}} as any,{id:'test',revision:0,processor:'photo-agent-v1',status:'planning'});});
test('rate limits requeue current revision but cannot restart retry budget indefinitely',async()=>{
 const id=await create();const original=PaperImportJobs.prototype.backendStep;
 PaperImportJobs.prototype.backendStep=async function(s,j){await db.query('UPDATE GrowingPaperImportJobs SET Revision=Revision+1 WHERE Id=?1',[j]);throw new HttpError(429,'limited');};
 try{
  for(let i=0;i<5;i++){assert.deepEqual(await consume(id,i),{ack:1,retry:0});if(i<4)assert.deepEqual(sent.at(-1),{id,revision:i+1});}
  const [r]=await db.query<any>('SELECT State FROM GrowingPaperImportJobs WHERE Id=?1',[id]);assert.match(JSON.parse(r.State).error,/持续受限/);
 }finally{PaperImportJobs.prototype.backendStep=original;}
});
