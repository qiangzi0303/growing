import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connectRealtime,realtimeInfo} from '../src/realtime';
const config={apiKey:'test-personal-key',base:'https://workspace.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',voice:'Tina',sdp:'v=0\r\noffer'};
const signal=()=>new AbortController().signal;
test('Qwen SDP proxy uses only the fixed official path and never returns credentials',async()=>{
  let requested='';
  const response=await connectRealtime(config,{},signal(),(async(url,options)=>{
    requested=String(url);assert.equal(new Headers(options?.headers).get('Authorization'),'Bearer test-personal-key');assert.equal(options?.body,config.sdp);assert.equal(options?.redirect,'manual');
    return new Response('v=0\r\nanswer',{headers:{'Content-Type':'application/sdp'}});
  }) as typeof fetch);
  assert.equal(requested,'https://workspace.cn-beijing.maas.aliyuncs.com/api/v1/webrtc/realtime?model=qwen3.8-omni-flash-realtime');
  assert.deepEqual(await response.json(),{sdp:'v=0\r\nanswer'});
  assert.ok(!(await realtimeInfo({QWEN_REALTIME_KEY:config.apiKey}).text()).includes(config.apiKey));
});
test('invalid credentials, SDP and credential redirect targets are rejected before contacting upstream',async()=>{
  let calls=0;const upstream=(async()=>{calls++;return new Response('v=0');}) as typeof fetch;
  for(const change of [{base:'https://unrelated.example'},{base:'http://dashscope.aliyuncs.com'},{base:'https://secret@dashscope.aliyuncs.com'},{apiKey:'bad key'},{sdp:'not SDP'},{sdp:'v=0'+'x'.repeat(120000)}])await assert.rejects(connectRealtime({...config,...change},{},signal(),upstream));
  await assert.rejects(connectRealtime({sdp:config.sdp,base:config.base},{QWEN_REALTIME_KEY:config.apiKey},signal(),upstream));
  assert.equal(calls,0);
});
test('provider failures and malformed or oversized SDP never expose upstream text',async()=>{
  for(const remote of [()=>new Response('private-provider-body test-personal-key',{status:403}),()=>new Response('not SDP'),()=>new Response('v=0'+config.apiKey),()=>new Response('v=0'+'x'.repeat(150001))]){
    const response=await connectRealtime(config,{},signal(),(async()=>remote()) as typeof fetch);
    assert.notEqual(response.status,200);const text=await response.text();assert.ok(!text.includes(config.apiKey));assert.ok(!text.includes('private-provider-body'));
  }
});
test('cancelled connections are not sent to the provider',async()=>{
  const controller=new AbortController();controller.abort();let called=false;
  const response=await connectRealtime(config,{},controller.signal,(async()=>{called=true;return new Response('v=0');}) as typeof fetch);
  assert.equal(response.status,499);assert.equal(called,false);
});
