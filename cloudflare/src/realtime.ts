import { HttpError } from './database';
import type { ManagedModel } from './managed-ai';

export interface RealtimeEnv { QWEN_REALTIME_KEY?: string; QWEN_REALTIME_BASE?: string; QWEN_REALTIME_VOICE?: string }
const model='qwen3.8-omni-flash-realtime';
const fail=(status:number,message:string):never=>{throw new HttpError(status,message);};
function endpoint(base:unknown,modelName=model){
  let url:URL;
  try{url=new URL(String(base));}catch{return fail(400,'百炼服务地址无效。');}
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||
      !/^(?:dashscope(?:-intl)?\.aliyuncs\.com|[a-z0-9-]+\.(?:cn-beijing|ap-southeast-1)\.maas\.aliyuncs\.com)$/.test(url.hostname))
    return fail(400,'仅支持百炼官方 HTTPS 服务或业务空间地址。');
  return url.origin+'/api/v1/webrtc/realtime?model='+encodeURIComponent(modelName);
}
export function realtimeInfo(env:RealtimeEnv){
  const base=env.QWEN_REALTIME_BASE||'https://dashscope.aliyuncs.com';
  return Response.json({model,configured:!!env.QWEN_REALTIME_KEY,base:new URL(endpoint(base)).origin,voice:env.QWEN_REALTIME_VOICE||'Tina'});
}
/** Credentials are transient: never stored, logged, or returned to the browser. */
export async function connectRealtime(data:Record<string,unknown>,env:RealtimeEnv,signal:AbortSignal,upstream:typeof fetch){
  if(Object.keys(data).some(k=>!['sdp','apiKey','base','voice'].includes(k))||typeof data.sdp!=='string'||!data.sdp.startsWith('v=0')||data.sdp.length>120000||
      data.voice!==undefined&&(typeof data.voice!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(data.voice)))
    fail(400,'实时语音会话参数无效。');
  const key=data.apiKey===undefined?env.QWEN_REALTIME_KEY:data.apiKey;
  if(typeof key!=='string'||!key)return fail(503,'请在连接设置中填写 Qwen 实时语音密钥。');
  if(key.length<8||key.length>512||/\s/.test(key))fail(400,'Qwen 密钥格式不正确。');
  const target=endpoint(data.base??env.QWEN_REALTIME_BASE??'https://dashscope.aliyuncs.com');
  // A server credential is only ever sent to its configured host.
  if(data.apiKey===undefined&&data.base!==undefined&&target!==endpoint(env.QWEN_REALTIME_BASE||'https://dashscope.aliyuncs.com'))fail(400,'服务端连接地址不能由客户端更改。');
  return exchangeRealtime(data.sdp as string,target,key,signal,upstream);
}
export async function connectManagedRealtime(data:Record<string,unknown>,config:ManagedModel,signal:AbortSignal,upstream:typeof fetch){
  if(Object.keys(data).some(k=>!['sdp','configRevision'].includes(k))||typeof data.sdp!=='string'||!data.sdp.startsWith('v=0')||data.sdp.length>120000)
    fail(400,'实时语音会话参数无效。');
  if(data.configRevision!==config.revision)fail(409,'语音配置已更新，请刷新课程后重试。');
  if(new URL(config.endpoint).pathname!=='/api/v1/webrtc/realtime')fail(400,'实时语音须配置完整的百炼 WebRTC SDP 地址，请联系管理员。');
  return exchangeRealtime(data.sdp as string,endpoint(config.endpoint,config.model),config.apiKey,signal,upstream);
}
async function exchangeRealtime(sdp:string,target:string,key:string,signal:AbortSignal,upstream:typeof fetch){
  const controller=new AbortController(),abort=()=>controller.abort();
  signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
  const timer=setTimeout(abort,40000);
  try{
    if(controller.signal.aborted)throw Error();
    const response=await upstream(target,{method:'POST',redirect:'manual',signal:controller.signal,
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/sdp'},body:sdp});
    if(!response.ok){
      await response.body?.cancel();
      const reasons:Record<number,string>={401:'密钥无效，请重新填写。',403:'请确认业务空间已开通该模型及调用权限。',429:'调用过于频繁或额度不足。'};
      return Response.json({error:'Qwen 实时语音连接失败：'+(reasons[response.status]||'服务暂不可用，请稍后重试。')},{status:502});
    }
    if(!response.body)throw Error();
    const reader=response.body.getReader(),decoder=new TextDecoder();let length=0,answer='';
    while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>150000){await reader.cancel();throw Error();}answer+=decoder.decode(part.value,{stream:true});}
    answer+=decoder.decode();
    if(controller.signal.aborted||!answer.trimStart().startsWith('v=0')||answer.includes(key))throw Error();
    return Response.json({sdp:answer});
  }catch{return Response.json({error:signal.aborted?'实时语音连接已取消。':'实时语音连接失败或超时，请检查网络后重试。'},{status:signal.aborted?499:504});}
  finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
}
