const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/course-ai.js'),'utf8');
function setup(native,respond){
  const data=new Map(),calls=[],events=[];
  const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const window={GrowingNative:native,dispatchEvent:e=>events.push(e.type)};window.top=window;
  vm.runInNewContext(source,{window,localStorage,location:{hostname:'127.0.0.1',port:'8793'},document:{addEventListener(){}},URL,Event,AbortController,setTimeout,clearTimeout,
    fetch:async(url,options)=>{calls.push({url,options});if(respond)return respond(url,options);return Response.json(options.method==='POST'?{sdp:'v=0\r\nanswer'}:{configured:true,voice:'Tina',base:'https://workspace.cn-beijing.maas.aliyuncs.com'});}});
  return {api:window.GrowingRealtime,window,data,calls,events};
}
test('personal key and selected voice survive blank-key saves and reach the SDP proxy only',async()=>{
  const t=setup();t.api.save({apiKey:'test-personal-key',voice:'Cherry',base:'https://workspace.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'});
  t.api.save({apiKey:'',voice:'Tina',base:'https://workspace.cn-beijing.maas.aliyuncs.com'});
  assert.equal(t.api.info().voice,'Tina');assert.equal(t.api.info().configured,true);
  assert(!JSON.stringify(t.api.info()).includes('test-personal-key'));assert(!t.api.settingsMarkup().includes('test-personal-key'));
  const signal=new AbortController().signal,config=await t.api.connectionInfo({signal});assert.equal(config.apiKey,undefined);assert.equal(t.calls.length,0);
  assert.equal((await t.api.connect('v=0\r\noffer',{signal})).sdp,'v=0\r\nanswer');
  const call=t.calls[0],body=JSON.parse(call.options.body);assert.equal(body.apiKey,'test-personal-key');assert.equal(body.voice,'Tina');assert.equal(call.url,'./api/realtime/connect');assert.equal(call.options.signal,signal);
});
test('invalid edits do not replace saved config; clearing does not touch learning records',()=>{
  const t=setup();t.api.save({apiKey:'test-existing-key'});const before=t.data.get('growing-realtime-settings-v1');
  for(const base of ['http://dashscope.aliyuncs.com','https://unrelated.example','https://dashscope.aliyuncs.com.evil.example','https://secret@dashscope.aliyuncs.com'])assert.throws(()=>t.api.save({base}),/地址/);
  assert.equal(t.data.get('growing-realtime-settings-v1'),before);
  t.data.set('growing-math-lessons-v1','learning');t.api.clear();assert.equal(t.api.info().configured,false);assert.equal(t.data.get('growing-math-lessons-v1'),'learning');
});
test('voice-only configuration uses server credentials without copying them into settings',async()=>{
  const t=setup();t.api.save({voice:'Ethan'});assert.equal((await t.api.connectionInfo()).voice,'Ethan');
  await t.api.connect('v=0\r\noffer');const body=JSON.parse(t.calls.at(-1).options.body);assert.equal(body.voice,'Ethan');assert.equal(body.apiKey,undefined);
});
test('accounts are isolated and stale account adapters do not fall back to global storage',()=>{
  const t=setup(),accounts=new Map();let account='a';
  t.window.GrowingCourseAIStorage=()=>({getItem:k=>accounts.get(account+':'+k)||null,setItem:(k,v)=>accounts.set(account+':'+k,v),removeItem:k=>accounts.delete(account+':'+k)});
  t.api.save({apiKey:'test-account-a'});account='b';assert.equal(t.api.info().configured,false);t.api.save({apiKey:'test-account-b'});
  account='a';assert.equal(t.api.info().configured,true);assert.equal(t.data.size,0);
  t.window.GrowingCourseAIStorage=()=>{throw Error('expired');};assert.throws(()=>t.api.save({apiKey:'replacement-key'}),/无法读取/);
});
test('Android keeps voice credentials in account settings and uses its authenticated cloud origin',async()=>{
  let config={apiKey:'',voice:'Tina',base:'https://dashscope.aliyuncs.com'};
  const native={realtimeSettings:()=>JSON.stringify({ok:true,value:config}),saveRealtimeSettings:json=>{config=JSON.parse(json)||{};return '{"ok":true}';},cloudApiUrl:()=> 'https://learn.example'};
  const t=setup(native);t.api.save({apiKey:'test-native-key',voice:'Cherry'});t.data.set('growing-cloud-session-v1',JSON.stringify({token:'session-token'}));
  await t.api.connect('v=0\r\noffer');assert.equal(t.calls[0].url,'https://learn.example/api/realtime/connect');assert.equal(t.calls[0].options.headers.Authorization,'Bearer session-token');assert.equal(config.voice,'Cherry');assert.equal(t.data.has('growing-realtime-settings-v1'),false);
});

test('a delayed server default never overwrites edits already made in the settings form',async()=>{
  let finish;const response=new Promise(resolve=>finish=resolve),t=setup(undefined,()=>response);
  const form={dataset:{},elements:{base:{value:'https://dashscope.aliyuncs.com'},voice:{value:'Tina'},customVoice:{value:''}},querySelector:()=>({hidden:true})};
  const panel={isConnected:true,querySelector:selector=>selector==='form'?form:{textContent:''}};
  const pending=t.api.hydrate(panel);
  form.elements.voice.value='Ethan';form.dataset.realtimeDirty='1';
  finish(Response.json({configured:true,voice:'Tina',base:'https://workspace.cn-beijing.maas.aliyuncs.com'}));
  await pending;assert.equal(form.elements.voice.value,'Ethan');assert.equal(form.elements.base.value,'https://dashscope.aliyuncs.com');
});
