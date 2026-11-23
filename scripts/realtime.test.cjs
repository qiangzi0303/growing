const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/course-ai.js'),'utf8');
function setup({native=false}={}){
 const data=new Map(),calls=[];let account='a';
 const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const config={id:'realtime',purpose:'realtime',model:'managed-voice',endpoint:'https://voice.example/realtime',apiKey:'test-managed-key',revision:2,voice:'Tina'};
 const window={};window.top=window;
 const setAccount=id=>{account=id;data.set('growing-cloud-session-v1',JSON.stringify({token:'session-'+id,user:{id}}));};setAccount('a');
 if(native)window.GrowingNative={cloudApiUrl:()=> 'https://learn.example',realtimeSettings(){throw Error('old config read');},aiKey(){throw Error('old key read');}};
 else window.GrowingCloud={aiContext(){const captured=account;return {key:captured,current:()=>account===captured,async api(path,options){calls.push({url:path,options});return {models:[config]};}};}};
 vm.runInNewContext(source,{window,localStorage,URL,Event,AbortController,DOMException,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout,
  fetch:async(url,options)=>{calls.push({url,options});return url.endsWith('/api/ai/config')?Response.json({models:[config]}):new Response('v=0\r\nanswer');}});
 return {api:window.GrowingRealtime,window,data,calls,setAccount};
}
test('realtime fetches managed configuration once and sends SDP directly to supplier',async()=>{
 const t=setup(),info=await t.api.settingsInfo();assert.equal(info.voice,'Tina');assert.equal(info.apiKey,undefined);
 const connection=await t.api.connectionInfo();const signal=new AbortController().signal;
 assert.equal((await t.api.connect('v=0\r\noffer',{handle:connection.handle,signal})).sdp,'v=0\r\nanswer');
 assert.equal(t.calls.filter(c=>c.url==='/ai/config').length,1);
 const direct=t.calls.at(-1);assert.equal(direct.url,'https://voice.example/realtime?model=managed-voice');
 assert.equal(direct.options.body,'v=0\r\noffer');assert.equal(direct.options.headers.Authorization,'Bearer test-managed-key');assert.equal(direct.options.signal,signal);
 assert(!JSON.stringify([...t.data]).includes('test-managed-key'));
});
test('personal realtime settings cannot be saved and clearing keeps learning records',async()=>{
 const t=setup();t.data.set('growing-math-lessons-v1','learning');
 assert.throws(()=>t.api.save({apiKey:'old-personal'}),/管理员/);assert.equal(t.api.settingsMarkup(),'');
 await t.api.connectionInfo();t.api.clear();await t.api.connectionInfo();
 assert.equal(t.calls.filter(c=>c.url==='/ai/config').length,2);assert.equal(t.data.get('growing-math-lessons-v1'),'learning');
});
test('account switch invalidates captured realtime handle before supplier request',async()=>{
 const t=setup(),connection=await t.api.connectionInfo();t.setAccount('b');
 await assert.rejects(t.api.connect('offer',{handle:connection.handle}),/切换/);
 await t.api.connectionInfo();assert.equal(t.calls.length,2);assert(t.calls.every(c=>c.url==='/ai/config'));
});
test('native uses authenticated cloud config without reading old personal voice key',async()=>{
 const t=setup({native:true});await t.api.connectionInfo();await t.api.connect('offer');
 assert.equal(t.calls[0].url,'https://learn.example/api/ai/config');assert.equal(t.calls[0].options.headers.Authorization,'Bearer session-a');
 assert.equal(t.calls[1].url,'https://voice.example/realtime?model=managed-voice');
 t.setAccount('b');await t.api.connectionInfo();assert.equal(t.calls[2].options.headers.Authorization,'Bearer session-b');
 assert(!JSON.stringify([...t.data]).includes('test-managed-key'));
});
test('a late SDP response is discarded after the account changes',async()=>{
 const t=setup(),connection=await t.api.connectionInfo();
 const pending=t.api.connect('offer',{handle:connection.handle});t.setAccount('b');
 await assert.rejects(pending,/切换/);
});
