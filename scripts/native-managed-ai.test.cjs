/* Load both production scripts: isolated course-ai tests miss Android fetch interceptors. */
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const assets=path.join(__dirname,'../app/src/main/assets');
function setup(endpoint='https://api.deepseek.com/chat/completions'){
 const data=new Map([['growing-cloud-session-v1',JSON.stringify({token:'session-a'})]]),calls=[];
 const ok=value=>JSON.stringify({ok:true,value});let personalReads=0,settingsOpened=0,mode='ok';
 const native={get:k=>ok(data.get(k)??null),put:(k,v)=>{data.set(k,v);return ok();},remove:k=>{data.delete(k);return ok();},clear:()=>{data.clear();return ok();},keys:()=>ok([...data.keys()]),cloudApiUrl:()=> 'https://learn.test',aiKey:()=>{personalReads++;return '';},configureAi:()=>settingsOpened++};
 const window={GrowingNative:native,document:{addEventListener(){}},location:{href:'https://appassets.androidplatform.net/assets/web/app-design/english-course.html',origin:'https://appassets.androidplatform.net',pathname:'/assets/web/app-design/english-course.html'},URL,URLSearchParams,Request,Response,Headers,AbortController,DOMException,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout,
  fetch:async(input,options={})=>{
   const url=input instanceof Request?input.url:String(input);calls.push({input,url,options});
   if(url==='https://learn.test/api/ai/config')return Response.json({models:[{id:'chat',purpose:'chat',endpoint,model:'managed-model',apiKey:'managed-test-key',revision:6}]});
   if(url==='https://learn.test/api/ai/usage')return Response.json({ok:true});
   if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
   if(mode==='http')return Response.json({error:'unavailable'},{status:429});
   if(mode==='network')throw new TypeError('Failed to fetch');
   const body=options.body?JSON.parse(options.body):{};
   return Response.json({usage:{prompt_tokens:5,completion_tokens:3,total_tokens:8},choices:[{finish_reason:mode==='length'?'length':'stop',message:{content:mode==='empty'?'':body.response_format?.type==='json_object'?'{"meaningCorrect":true,"posCorrect":true}':'answer'}}]});
  }};
 window.window=window;window.top=window;const context=vm.createContext(window);
 vm.runInContext(fs.readFileSync(path.join(assets,'bootstrap.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(assets,'web/app-design/course-ai.js'),'utf8'),context);
 return {window,data,calls,endpoint,setMode:value=>mode=value,personalReads:()=>personalReads,settingsOpened:()=>settingsOpened};
}
test('Android classroom sends the managed DeepSeek credential and reports successful grading',async()=>{
 const t=setup(),ctrl=new AbortController();
 const answer=await t.window.GrowingCourseAI.request({task:'Grade the meaning and part of speech of honest; return JSON.',format:'json_object',signal:ctrl.signal});
 assert.equal(JSON.parse(answer).meaningCorrect,true);
 const provider=t.calls.find(c=>c.url===t.endpoint);assert(provider,'the provider must receive the request');
 assert.equal(new Headers(provider.options.headers).get('Authorization'),'Bearer managed-test-key');assert.equal(provider.options.signal,ctrl.signal);
 assert.equal(JSON.parse(provider.options.body).model,'managed-model');assert.equal(t.personalReads(),0);assert.equal(t.settingsOpened(),0);
 const report=JSON.parse(t.calls.find(c=>c.url.endsWith('/ai/usage')).options.body);
 assert.equal(report.status,'success');assert.equal(report.totalTokens,8);assert.equal(report.configRevision,6);
 await t.window.GrowingCourseAI.request({task:'Explain sound.'});
 assert.equal(t.calls.filter(c=>c.url.endsWith('/ai/config')).length,1);
 assert.equal(JSON.parse(t.calls.filter(c=>c.url===t.endpoint).at(-1).options.body).response_format.type,'text');
});
test('Android preserves direct companion Request credentials and cancellation',async()=>{
 const t=setup(),controller=new AbortController();
 const request=new Request(t.endpoint,{method:'POST',headers:{Authorization:'Bearer managed-stream-key','Content-Type':'application/json'},body:'{"stream":true}'});
 await t.window.fetch(request,{signal:controller.signal});
 assert.equal(t.calls[0].input,request);assert.equal(request.headers.get('Authorization'),'Bearer managed-stream-key');
 assert.equal(t.calls[0].options.signal,controller.signal);assert.equal(t.personalReads(),0);assert.equal(t.settingsOpened(),0);
});
test('Android rejects provider errors and cancellation without producing a passing answer',async()=>{
 for(const mode of ['http','network','empty','length']){
  const t=setup();t.setMode(mode);await assert.rejects(t.window.GrowingCourseAI.request({task:'Grade honest.',format:'json_object'}));
  assert.equal(t.calls.filter(c=>c.url===t.endpoint).length,1);
  assert.equal(JSON.parse(t.calls.find(c=>c.url.endsWith('/ai/usage')).options.body).status,'error');
  assert.equal(t.personalReads(),0);assert.equal(t.settingsOpened(),0);
 }
 const t=setup(),controller=new AbortController();controller.abort();
 await assert.rejects(t.window.GrowingCourseAI.request({task:'Grade honest.',signal:controller.signal}),{name:'AbortError'});
 assert.equal(t.calls.filter(c=>c.url===t.endpoint).length,0);
});
test('Android keeps stored progress and reloads configuration after account change',async()=>{
 const t=setup('https://provider.test/chat/completions'),store=t.window.localStorage;
 const progress='{"words":{"honest":{"practice":{"stage":"describe","draft":"honest answer"}}}}';
 store.setItem('growing-english-course-v1:english-8a-01',progress);store.setItem('growing-unit-rewards-v1:math-8a-01','reward');
 store.setItem('temporary','x');store.removeItem('temporary');const handle=await t.window.GrowingCourseAI.prepare();
 store.setItem('growing-cloud-session-v1',JSON.stringify({token:'session-b'}));assert.equal(handle.current(),false);
 await t.window.GrowingCourseAI.request({task:'Question under the new account.'});
 const configs=t.calls.filter(c=>c.url.endsWith('/ai/config'));assert.equal(configs.length,2);assert.equal(configs[1].options.headers.Authorization,'Bearer session-b');
 assert.equal(store.getItem('growing-english-course-v1:english-8a-01'),progress);assert.equal(store.getItem('growing-unit-rewards-v1:math-8a-01'),'reward');assert.equal(store.getItem('temporary'),null);
 assert(![...t.data.values()].some(v=>v.includes('managed-test-key')));
});
