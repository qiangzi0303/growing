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
  // Consume the tiny real KV fixture when the handler discards it, so cleanup
  // finishes before the next test. Production code still cancels streamed APKs.
  const realFiles=files;
  const drainOnCancel=(stream:ReadableStream|null)=>{
    if(stream)stream.cancel=async()=>{const reader=stream.getReader();try{while(!(await reader.read()).done){/* Drain fixture bytes. */}}finally{reader.releaseLock();}};
    return stream;
  };
  files=new Proxy(realFiles,{get(target,property){
    if(property==='getWithMetadata')return async(...args:any[])=>{const result=await (target.getWithMetadata as any)(...args);if(args[1]?.type==='stream')drainOnCancel(result.value);return result;};
    if(property==='get')return async(...args:any[])=>{const value=await (target.get as any)(...args);return args[1]?.type==='stream'?drainOnCancel(value):value;};
    const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;
  }});
  const sql=await readFile(new URL('../migrations/0002_app_releases.sql',import.meta.url),'utf8');
  await db.query(sql);
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
