const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){let account='a',failReport=false,hangReport=false,resolveConfig;const calls=[];
 const config={models:[{id:'chat',purpose:'chat',model:'configured-model',endpoint:'https://provider.test/chat',apiKey:'test-secret',revision:1},{id:'realtime',purpose:'realtime',model:'voice-model',endpoint:'https://provider.test/realtime',apiKey:'voice-secret',revision:2}]};
 const window={GrowingCloud:{aiContext(){const key=account;if(!key)throw Error('登录');return {key,current:()=>account===key,api:async(path,options)=>{calls.push({path,options});if(path==='/ai/config')return resolveConfig?await new Promise(r=>resolveConfig=r):config;if(path==='/realtime/connect')return {sdp:'v=0\r\n'};if(hangReport)return new Promise(()=>{});if(failReport)throw Error('offline');return {ok:true};}};}}};window.top=window;
 vm.runInNewContext(fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/course-ai.js'),'utf8'),{window,localStorage:{getItem(){return null;}},document:{addEventListener(){}},crypto:require('node:crypto').webcrypto,URL,AbortController,DOMException,setTimeout,clearTimeout,fetch:async(url,options)=>{calls.push({url,options});return {ok:true,text:async()=>'v=0\r\n',json:async()=>({usage:{prompt_tokens:12,completion_tokens:3,total_tokens:15},choices:[{message:{content:'answer'}}]})};}});
 return {api:window.GrowingCourseAI,realtime:window.GrowingRealtime,calls,change:v=>account=v,fail:()=>failReport=true,hang:()=>hangReport=true,delay:()=>resolveConfig=true,release:()=>resolveConfig(config)};
}
test('config cached; provider direct; usage attributed; safe metadata',async()=>{const t=setup();assert.equal(await t.api.request({task:'q'}),'answer');await t.api.request({task:'q'});assert.equal(t.calls.filter(c=>c.path==='/ai/config').length,1);assert.equal(t.calls.find(c=>c.url).options.headers.Authorization,'Bearer test-secret');const r=JSON.parse(t.calls.find(c=>c.path==='/ai/usage').options.body);assert.equal(r.totalTokens,15);assert.equal(r.configId,'chat');assert(!JSON.stringify(t.api.info()).includes('secret'));assert(!t.api.settingsMarkup().includes('name="apiKey"'));});
test('report failure preserves answer and account change resets config',async()=>{const t=setup();t.fail();assert.equal(await t.api.request({task:'q'}),'answer');t.change('b');await t.api.prepare();assert.equal(t.calls.filter(c=>c.path==='/ai/config').length,2);t.change(null);await assert.rejects(t.api.request({task:'q'}));});
test('a report that never responds times out and preserves the provider answer',{timeout:8000},async()=>{const t=setup();t.hang();const started=Date.now();assert.equal(await t.api.request({task:'q'}),'answer');assert(Date.now()-started>=4900);assert(Date.now()-started<7500);assert.equal(t.calls.find(c=>c.path==='/ai/usage').options.signal.aborted,true);});
test('late config cannot start request under different account',async()=>{const t=setup();t.delay();const pending=t.api.request({task:'q'});t.change('b');t.release();await assert.rejects(pending);assert.equal(t.calls.filter(c=>c.url).length,0);});
test('concurrent configuration callers share one load',async()=>{const t=setup();t.delay();const one=t.api.prepare(),two=t.api.prepare();t.release();await Promise.all([one,two]);assert.equal(t.calls.filter(c=>c.path==='/ai/config').length,1);});
test('usage handles deduplicate and normalize missing or malformed usage',async()=>{const t=setup(),h=await t.api.prepare(),meter=t.api.begin(h,'realtime');await meter.report({usage:{input_tokens:9},status:'cancelled'});await meter.report({usage:{input_tokens:9,output_tokens:2,total_tokens:11}});const reports=t.calls.filter(c=>c.path==='/ai/usage');assert.equal(reports.length,1);const body=JSON.parse(reports[0].options.body);assert.equal(body.status,'cancelled');assert.equal(body.inputTokens,null);assert.equal(body.totalTokens,null);});
test('captured usage cannot be charged to the next account',async()=>{const t=setup(),h=await t.api.prepare(),meter=t.api.begin(h,'course');t.change('b');assert.equal(await meter.report({usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}}),false);assert.equal(t.calls.filter(c=>c.path==='/ai/usage').length,0);});
test('realtime SDP uses the managed relay without sending a provider key',async()=>{const t=setup(),c=await t.realtime.connectionInfo();const result=await t.realtime.connect('offer',{handle:c.handle});assert.equal(result.sdp,'v=0\r\n');const call=t.calls.find(c=>c.path==='/realtime/connect');assert.deepEqual(JSON.parse(call.options.body),{sdp:'offer',configRevision:2});assert.equal(call.options.headers.Authorization,undefined);assert.equal(call.options.headers['Content-Type'],'application/json');assert.equal(t.calls.some(c=>c.url),false);t.change('b');await assert.rejects(t.realtime.connect('offer',{handle:c.handle}));});
test('native uses only current login token and never reads a personal key',async()=>{let token='session-a';const calls=[];const window={GrowingNative:{cloudApiUrl:()=> 'https://app.test',aiKey(){throw Error('must not read');}}};window.top=window;
 vm.runInNewContext(fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/course-ai.js'),'utf8'),{window,localStorage:{getItem(key){assert.equal(key,'growing-cloud-session-v1');return JSON.stringify({token});}},crypto:require('node:crypto').webcrypto,URL,fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({models:[{id:'chat',purpose:'chat',endpoint:'https://provider.test/chat',model:'native-managed',apiKey:'managed-key',revision:1}]})};}});
 const h=await window.GrowingCourseAI.prepare();assert.equal(h.config.model,'native-managed');assert.equal(calls[0].url,'https://app.test/api/ai/config');assert.equal(calls[0].options.headers.Authorization,'Bearer session-a');token='session-b';assert.equal(h.current(),false);await window.GrowingCourseAI.prepare();assert.equal(calls[1].options.headers.Authorization,'Bearer session-b');
});

function localSetup(url='http://127.0.0.1:8797/app-design/english-course.html',cloud){
 const calls=[],window={location:new URL(url),GrowingCloud:cloud};window.top=window;
 let status=200,release,delayed=false;
 vm.runInNewContext(fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/course-ai.js'),'utf8'),{window,URL,crypto:require('node:crypto').webcrypto,AbortController,DOMException,setTimeout,clearTimeout,localStorage:{getItem(){throw Error('Local credentials must not be persisted');}},fetch:async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/api/local-course-ai/config')){
   if(delayed)await new Promise(resolve=>release=resolve);
   return {ok:status===200,json:async()=>status===200?{models:[{id:'chat',purpose:'chat',endpoint:'https://provider.test/chat',apiKey:'local-test-secret',model:'managed-local',revision:1}]}:{error:'Cloudflare 本机授权已过期，请重新登录后重试。'}};
  }
  return {ok:true,json:async()=>({choices:[{message:{content:'{"meaningPassed":true,"posPassed":true,"feedback":"正确","errors":[]}'}}],usage:{prompt_tokens:1,completion_tokens:2,total_tokens:3}})};
 }});
 return {api:window.GrowingCourseAI,window,calls,fail:()=>status=503,delay:()=>delayed=true,release:()=>release()};
}
test('standalone loopback classroom reads managed config once and directly grades without a cloud login',async()=>{
 const t=localSetup(),signal=new AbortController().signal;
 assert.equal(JSON.parse(await t.api.request({task:'评测学生的词义与词类',format:'json_object',signal})).meaningPassed,true);
 await t.api.request({task:'another question'});
 const configs=t.calls.filter(c=>c.url.endsWith('/api/local-course-ai/config'));
 assert.equal(configs.length,1);assert.equal(configs[0].options.headers['X-Growing-Local'],'1');assert.equal(configs[0].options.cache,'no-store');assert.equal(configs[0].options.credentials,'omit');
 const provider=t.calls.find(c=>c.url==='https://provider.test/chat');assert.equal(provider.options.headers.Authorization,'Bearer local-test-secret');assert.equal(provider.options.signal,signal);
 assert.equal(t.calls.some(c=>c.url.endsWith('/ai/usage')),false,'local preview does not charge a cloud account');
 assert(!JSON.stringify(t.api.info()).includes('secret'));
});
test('local authorization failures are actionable, retryable and never submit to the provider',async()=>{
 const t=localSetup();t.fail();await assert.rejects(t.api.request({task:'grade'}),/授权已过期/);
 assert.equal(t.calls.length,1);await assert.rejects(t.api.request({task:'retry'}),/授权已过期/);assert.equal(t.calls.length,2);
});
test('public sites, LAN pages and signed-out local portal retain the existing login requirement',async()=>{
 for(const url of ['https://learn.test/app-design/english-course.html','http://192.168.1.5:8797/app-design/english-course.html','file:///english-course.html']){
  const t=localSetup(url);await assert.rejects(t.api.request({task:'grade'}),/登录/);assert.equal(t.calls.length,0);
 }
 const t=localSetup(undefined,{aiContext(){throw Error('请先登录');}});await assert.rejects(t.api.request({task:'grade'}),/登录/);assert.equal(t.calls.length,0);
});
test('switching from standalone to a cloud session rejects a late local configuration',async()=>{
 const t=localSetup();t.delay();const request=t.api.request({task:'grade'});t.window.GrowingCloud={aiContext(){throw Error('new session');}};t.release();await assert.rejects(request,/会话已变化/);assert.equal(t.calls.length,1);
});
