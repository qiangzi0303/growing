import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recognizeGlmPage} from '../src/glm-ocr';
import {HttpError} from '../src/database';

const image='data:image/jpeg;base64,/9j/AA==';
const env={ZHIPU_API_KEY:'private-test-key'};
const signal=()=>new AbortController().signal;
const valid={model:'glm-ocr',id:'ocr-response-1',md_results:'# 数学\n\n1. 计算 $2^3$。',layout_details:[],usage:{prompt_tokens:12,completion_tokens:8,total_tokens:20}};
const reply=(value:unknown)=>(async()=>Response.json(value)) as typeof fetch;
const rejected=(status:number)=>(e:unknown)=>e instanceof HttpError&&e.status===status&&!e.message.includes(env.ZHIPU_API_KEY)&&!e.message.includes('/9j/');

test('uses layout_parsing exactly once and preserves complete raw OCR alongside md_results',async()=>{
 let calls=0;
 const raw=JSON.stringify(valid,null,2);
 const upstream=(async(url,options)=>{
  calls++;assert.equal(url,'https://open.bigmodel.cn/api/paas/v4/layout_parsing');
  assert.equal(options?.method,'POST');assert.equal(options?.redirect,'manual');
  assert.equal(new Headers(options?.headers).get('Authorization'),'Bearer '+env.ZHIPU_API_KEY);
  assert.deepEqual(JSON.parse(String(options?.body)),{model:'glm-ocr',file:image,return_crop_images:false,need_layout_visualization:false,request_id:'job-page-1'});
  return new Response(raw);
 }) as typeof fetch;
 const result=await recognizeGlmPage(env,signal(),upstream,image,'job-page-1');
 assert.equal(calls,1);assert.equal(result.raw,raw);assert.equal(result.markdown,valid.md_results);
 assert.equal(result.model,'glm-ocr');assert.equal(result.providerRequestId,valid.id);assert.deepEqual(result.usage,valid.usage);
});

test('requires a configured key before any request',async()=>{
 let calls=0;const upstream=(async()=>{calls++;return Response.json(valid);}) as typeof fetch;
 await assert.rejects(recognizeGlmPage({},signal(),upstream,image,'job-page-1'),rejected(503));
 await assert.rejects(recognizeGlmPage({ZHIPU_API_KEY:'   '},signal(),upstream,image,'job-page-1'),rejected(503));
 assert.equal(calls,0);
});

test('rejects URLs, unsupported images, oversized payloads and malformed request IDs before fetch',async()=>{
 const upstream=(async()=>{throw new Error('must not call provider');}) as typeof fetch;
 for(const input of ['https://example.test/image.jpg','data:image/png;base64,AAAA',image+'!','data:image/jpeg;base64,/9j/'+'A'.repeat(500000)]){
  await assert.rejects(recognizeGlmPage(env,signal(),upstream,input,'job-page-1'),rejected(400));
 }
 for(const id of ['', 'a'.repeat(129),'line\nbreak'])await assert.rejects(recognizeGlmPage(env,signal(),upstream,image,id),rejected(400));
});

test('never follows redirects, leaks provider errors or falls back to another model',async()=>{
 for(const status of [302,401,429,500]){
  let calls=0;const upstream=(async()=>{calls++;return new Response(env.ZHIPU_API_KEY+' '+image,{status});}) as typeof fetch;
  await assert.rejects(recognizeGlmPage(env,signal(),upstream,image,'job-page-1'),rejected(status===429?429:502));
  assert.equal(calls,1);
 }
});

test('requires genuine nonempty glm-ocr layout result rather than chat-completions or an error envelope',async()=>{
 for(const value of [{...valid,model:'another-model'},{...valid,md_results:'  '},{...valid,md_results:null},{...valid,error:{message:env.ZHIPU_API_KEY}}, {choices:[{message:{content:'answer'}}]},[]]){
  await assert.rejects(recognizeGlmPage(env,signal(),reply(value),image,'job-page-1'),rejected(502));
 }
 await assert.rejects(recognizeGlmPage(env,signal(),(async()=>new Response('bad JSON '+env.ZHIPU_API_KEY)) as typeof fetch,image,'job-page-1'),rejected(502));
});

test('stream byte limit cancels an oversized response without exposing its body',async()=>{
 let cancelled=false;
 const body=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(1_000_001));},cancel(){cancelled=true;}});
 await assert.rejects(recognizeGlmPage(env,signal(),(async()=>new Response(body)) as typeof fetch,image,'job-page-1'),rejected(502));
 assert.equal(cancelled,true);
});

test('aborted requests never fetch, and in-flight cancellation propagates to provider signal',async()=>{
 const controller=new AbortController();controller.abort();let calls=0;
 await assert.rejects(recognizeGlmPage(env,controller.signal,(async()=>{calls++;return Response.json(valid);}) as typeof fetch,image,'job-page-1'),rejected(499));
 assert.equal(calls,0);
 const active=new AbortController();let reached!:()=>void;const ready=new Promise<void>(r=>reached=r);
 const upstream=(async(_url,options)=>{reached();return new Promise<Response>((_resolve,reject)=>options!.signal!.addEventListener('abort',()=>reject(new Error('secret '+env.ZHIPU_API_KEY)),{once:true}));}) as typeof fetch;
 const pending=recognizeGlmPage(env,active.signal,upstream,image,'job-page-1');
 await ready;active.abort();await assert.rejects(pending,rejected(499));
});

test('provider timeout is bounded even when response headers arrived and body stalls',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});let cancelled=false;
 const stream=new ReadableStream<Uint8Array>({cancel(){cancelled=true;}});
 const pending=recognizeGlmPage(env,signal(),(async()=>new Response(stream)) as typeof fetch,image,'job-page-1');
 const rejection=assert.rejects(pending,rejected(502));
 await Promise.resolve();await Promise.resolve();t.mock.timers.tick(60001);
 await rejection;assert.equal(cancelled,true);
});

test('untrusted transport exception messages never escape',async()=>{
 await assert.rejects(recognizeGlmPage(env,signal(),(async()=>{throw Error(env.ZHIPU_API_KEY+image);}) as typeof fetch,image,'job-page-1'),rejected(502));
});
