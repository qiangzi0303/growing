import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { connect, type Database } from '../src/database';
import { createHandler, type Env } from '../src/index';

const mf = new Miniflare(convertV4MiniflareOptions({ modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB'],kvNamespaces:['APK_FILES'] }));
let db:Database,files:KVNamespace,env:Env;
const handler=createHandler(()=>db),ctx={waitUntil:(_p:Promise<unknown>)=>{}},token='test-only-independent-publisher';
const data=new Uint8Array([80,75,3,4,...new TextEncoder().encode('APK test fixture')]);
const sha=()=>crypto.subtle.digest('SHA-256',data).then(a=>Array.from(new Uint8Array(a)).map(v=>v.toString(16).padStart(2,'0')).join(''));
async function request(path:string,method='GET',body?:BodyInit,authorized=false,headers:Record<string,string>={}){
  return handler(new Request('https://learn.test'+path,{method,headers:{'X-Growing-Client':'1',...(authorized?{Authorization:'Bearer '+token}:{}),...headers},body}),env,ctx);
}
async function manifest(version:number){return {schemaVersion:1,packageName:'com.qiangzi0303.growing',versionCode:version,versionName:'1.0.'+version,apkUrl:'growing-1.0.'+version+'.apk',notes:'更新课程',sha256:await sha(),sizeBytes:data.length};}
before(async()=>{
  db=connect(await mf.getD1Database('DB') as unknown as D1Database);
  files=await mf.getKVNamespace('APK_FILES') as unknown as KVNamespace;
  // Miniflare's Node RPC stream may reject after early cancel (ERR_INVALID_STATE).
  // Consume real KV bytes when the handler discards a stream, so cleanup
  // finishes before the next test. Production code still cancels streamed APKs.
  const realFiles=files;
  const drainOnCancel=(stream:ReadableStream|null)=>{
    if(!stream)return null;
    const reader=stream.getReader();let cancelled=false;
    return new ReadableStream({
      async pull(controller){const next=await reader.read();if(cancelled)return;if(next.done){reader.releaseLock();controller.close();}else controller.enqueue(next.value);},
      async cancel(){cancelled=true;try{while(!(await reader.read()).done){/* Drain Node RPC bytes without its early-cancel bug. */}}finally{reader.releaseLock();}},
    });
  };
  files=new Proxy(realFiles,{get(target,property){
    if(property==='getWithMetadata')return async(...args:any[])=>{const result=await (target.getWithMetadata as any)(...args);if(args[1]?.type==='stream')result.value=drainOnCancel(result.value);return result;};
    if(property==='get')return async(...args:any[])=>{const value=await (target.get as any)(...args);return args[1]?.type==='stream'?drainOnCancel(value):value;};
    const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;
  }});
  const sql=await readFile(new URL('../migrations/0002_app_releases.sql',import.meta.url),'utf8');
  await db.query(sql);
  const upgrade=await readFile(new URL('../migrations/0006_chunked_releases.sql',import.meta.url),'utf8');
  await db.batch(upgrade.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
  env={APK_FILES:files,APK_PUBLISH_TOKEN:token,ASSETS:{fetch:async()=>new Response('asset')},AUTH_LIMITER:{limit:async()=>({success:true})}} as unknown as Env;
});
after(async()=>{await mf.dispose();});

test('release publishing requires its dedicated credential and does not accept cloud user tokens',async()=>{
  const path='/api/releases/files/'+await sha()+'.apk';
  assert.equal((await request(path,'PUT',data)).status,401);
  assert.equal((await request(path,'PUT',data,false,{Authorization:'Bearer student-token'})).status,401);
  assert.equal((await request('/downloads/update.json')).status,404);
  assert.equal((await request('/api/releases/publish','POST','{}',true)).status,400);
});
test('APK uploads enforce size, format and actual SHA-256 before storing',async()=>{
  assert.equal((await request('/api/releases/files/'+'0'.repeat(64)+'.apk','PUT',data,true)).status,400);
  assert.equal((await request('/api/releases/files/'+await sha()+'.apk','PUT','not an APK',true)).status,400);
  assert.equal((await request('/api/releases/files/'+await sha()+'.apk','PUT','x',true,{'Content-Length':'26214401'})).status,413);
  assert.equal((await request('/api/releases/files/'+await sha()+'.apk','PUT',data,true)).status,201);
  assert.equal((await request('/api/releases/files/'+await sha()+'.apk','PUT',data,true)).status,200);
});
test('publish follows upload; metadata matches binary; public downloads need no account',async()=>{
  const input=await manifest(7);
  assert.equal((await request('/api/releases/publish','POST',JSON.stringify({...input,sha256:'0'.repeat(64)}),true)).status,503);
  assert.equal((await request('/api/releases/publish','POST',JSON.stringify({...input,apkUrl:'https://other.test/a.apk'}),true)).status,400);
  assert.equal((await request('/api/releases/publish','POST',JSON.stringify({...input,sizeBytes:100}),true)).status,400);
  assert.equal((await request('/api/releases/publish','POST',JSON.stringify(input),true)).status,200);
  assert.deepEqual(await (await request('/downloads/update.json')).json(),input);
  const response=await request('/downloads/'+input.apkUrl);
  assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'application/vnd.android.package-archive');
  assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Content-Length'),String(data.length));
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),data);
  assert.equal((await request('/downloads/'+input.apkUrl,'HEAD')).status,200);
  assert.equal((await request('/downloads/'+input.apkUrl,'GET',undefined,false,{'If-None-Match':'"'+await sha()+'"'})).status,304);
});
test('published versions are immutable and older builds cannot replace the newest manifest',async()=>{
  const publish=async(input:unknown)=>request('/api/releases/publish','POST',JSON.stringify(input),true);
  assert.equal((await publish(await manifest(8))).status,200);
  assert.equal((await publish(await manifest(7))).status,200);
  assert.equal((await publish({...await manifest(8),notes:'different metadata'})).status,409);
  assert.equal((await (await request('/downloads/update.json')).json() as any).versionCode,8);
  assert.equal((await request('/downloads/missing.apk')).status,404);
  assert.equal((await request('/downloads/update.json','POST','{}')).status,405);
});
test('a manifest is not advertised before its APK is available at the requesting KV location',async()=>{
  await files.delete('apk:'+await sha());
  assert.equal((await request('/downloads/update.json')).status,503);
  assert.equal((await request('/downloads/growing-1.0.8.apk')).status,503);
});

const checksum=(bytes:Uint8Array)=>crypto.subtle.digest('SHA-256',bytes).then(a=>Array.from(new Uint8Array(a)).map(v=>v.toString(16).padStart(2,'0')).join(''));
async function uploadPart(bytes:Uint8Array){
  const sha256=await checksum(bytes);
  const response=await request('/api/releases/parts/'+sha256,'PUT',bytes,true);
  assert.ok([200,201].includes(response.status));
  return {sha256,sizeBytes:bytes.length};
}
test('chunk uploads enforce dedicated authentication, bounded sizes and content hashes',async()=>{
  const path='/api/releases/parts/'+await sha();
  assert.equal((await request(path,'PUT',data)).status,401);
  assert.equal((await request(path,'PUT',data,false,{Authorization:'Bearer student-token'})).status,401);
  assert.equal((await request('/api/releases/parts/'+'0'.repeat(64),'PUT',data,true)).status,400);
  assert.equal((await request(path,'PUT','x',true,{'Content-Length':String(20*1024*1024+1)})).status,413);
  assert.equal((await request('/api/releases/parts/'+await checksum(new Uint8Array()),'PUT',new Uint8Array(),true)).status,400);
  await uploadPart(data);await uploadPart(data);
});
test('chunk completion verifies order, actual bytes, sizes and APK signature before creating a file',async()=>{
  const first=await uploadPart(data.slice(0,4)),last=await uploadPart(data.slice(4));
  const path='/api/releases/files/'+await sha()+'.apk/complete';
  const complete=(parts:unknown)=>request(path,'POST',JSON.stringify({parts}),true);
  assert.equal((await request(path,'POST',JSON.stringify({parts:[first,last]}))).status,401);
  for(const parts of [[],[first,...Array(5).fill(last)],[{...first,sizeBytes:0}],[{...first,sha256:'invalid'}]])assert.equal((await complete(parts)).status,400);
  assert.equal((await complete([{sha256:'0'.repeat(64),sizeBytes:4}])).status,503);
  assert.equal((await complete([{...first,sizeBytes:3},last])).status,400);
  assert.equal((await complete([last,first])).status,400);
  // A hash naming the wrong bytes may never become a downloadable file.
  assert.equal((await request('/api/releases/files/'+'0'.repeat(64)+'.apk/complete','POST',JSON.stringify({parts:[first,last]}),true)).status,400);
  assert.equal((await complete([first,last])).status,201);
  assert.equal((await complete([first,last])).status,200);
  assert.equal((await request('/api/releases/publish','POST',JSON.stringify(await manifest(9)),true)).status,200);
  const download=await request('/downloads/growing-1.0.9.apk');assert.deepEqual(new Uint8Array(await download.arrayBuffer()),data);
  const head=await request('/downloads/growing-1.0.9.apk','HEAD');assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
  const cancelled=await request('/downloads/growing-1.0.9.apk');await cancelled.body!.cancel();
  await files.delete('apk-part:'+last.sha256);
  assert.equal((await request('/downloads/update.json')).status,503);
  assert.equal((await request('/downloads/growing-1.0.9.apk')).status,503);
});
test('an APK larger than one KV value uploads in parts and downloads with the same hash',async()=>{
  const bytes=new Uint8Array(26*1024*1024+7).fill(7);bytes.set([80,75,3,4]);
  const sha256=await checksum(bytes),parts=[];
  for(let i=0;i<bytes.length;i+=20*1024*1024)parts.push(await uploadPart(bytes.slice(i,i+20*1024*1024)));
  assert.equal((await request('/api/releases/files/'+sha256+'.apk/complete','POST',JSON.stringify({parts}),true)).status,201);
  const input={...await manifest(10),sha256,sizeBytes:bytes.length};
  assert.equal((await request('/api/releases/publish','POST',JSON.stringify({...input,sizeBytes:100*1024*1024+1}),true)).status,400);
  assert.equal((await request('/api/releases/publish','POST',JSON.stringify(input),true)).status,200);
  assert.deepEqual(await (await request('/downloads/update.json')).json(),input);
  const response=await request('/downloads/'+input.apkUrl);
  assert.equal(response.status,200);assert.equal(response.headers.get('Content-Length'),String(bytes.length));
  assert.equal(await checksum(new Uint8Array(await response.arrayBuffer())),sha256);
  // A location missing a newer build's chunk can still advertise an available older build.
  await uploadPart(data.slice(4));await files.delete('apk-part:'+parts[1].sha256);
  assert.equal((await (await request('/downloads/update.json')).json() as any).versionCode,9);
  assert.equal((await request('/downloads/'+input.apkUrl)).status,503);
});
test('catalog upgrade preserves legacy release records and is safe to apply again',async()=>{
  await db.query('INSERT INTO "GrowingAppReleases" ("VersionCode","VersionName","Filename","Sha256","SizeBytes","Manifest") VALUES (1,?1,?2,?3,?4,?5)', ['1.0.1','growing-1.0.1.apk',await sha(),data.length,JSON.stringify(await manifest(1))]);
  const statements=(await readFile(new URL('../migrations/0006_chunked_releases.sql',import.meta.url),'utf8')).replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql}));
  await db.batch(statements);await db.batch(statements);
  const old=await db.query('SELECT * FROM "GrowingAppReleases" WHERE "VersionCode"=1');
  assert.deepEqual(await db.query('SELECT * FROM "GrowingAppReleasesV2" WHERE "VersionCode"=1'),old);
  assert.equal((await db.query('SELECT * FROM "GrowingAppReleasesV2" WHERE "VersionCode"=10')).length,1);
});
