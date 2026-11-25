import {HttpError} from './database';

const endpoint='https://open.bigmodel.cn/api/paas/v4/layout_parsing';
const maxResponseBytes=1_000_000;
const timeoutMs=60_000;
export type GlmOcrResult={markdown:string;raw:string;model:string;providerRequestId:string;usage:unknown};

/** Dedicated document OCR, not the chat-completions protocol. Callers persist raw privately. */
export async function recognizeGlmPage(
 env:{ZHIPU_API_KEY?:string}, signal:AbortSignal, upstream:typeof fetch,
 image:string, requestId:string,
):Promise<GlmOcrResult>{
 const key=env.ZHIPU_API_KEY?.trim();
 if(!key||key.length>512||/[\r\n]/.test(key))throw new HttpError(503,'GLM-OCR 尚未配置后台密钥，原稿和任务已保留。');
 if(typeof image!=='string'||image.length>500000||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(image)||
    typeof requestId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(requestId))throw new HttpError(400,'OCR 图片或请求编号无效。');
 if(signal.aborted)throw new HttpError(499,'识别已取消，原稿和任务已保留。');

 const controller=new AbortController();
 let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
 let rejectStopped!:(reason:HttpError)=>void;
 const stopped=new Promise<never>((_resolve,reject)=>{rejectStopped=reject;});
 const stop=(cancelled:boolean)=>{
  controller.abort();
  // A custom/failed transport may ignore AbortSignal even after headers. Cancel its reader too.
  void reader?.cancel().catch(()=>{});
  rejectStopped(new HttpError(cancelled?499:502,cancelled?'识别已取消，原稿和任务已保留。':'GLM-OCR 响应超时，原稿和任务已保留，可重试。'));
 };
 const abort=()=>stop(true);
 signal.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>stop(false),timeoutMs);
 try{
  const response=await Promise.race([upstream(endpoint,{
   method:'POST',redirect:'manual',signal:controller.signal,
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
   body:JSON.stringify({model:'glm-ocr',file:image,return_crop_images:false,need_layout_visualization:false,request_id:requestId}),
  }),stopped]);
  if(!response.ok){
   void response.body?.cancel().catch(()=>{});
   throw new HttpError(response.status===429?429:502,response.status===429?'GLM-OCR 请求频率受限，请稍后重试。':`GLM-OCR 服务暂时不可用（HTTP ${response.status}），任务已保留。`);
  }
  if(!response.body)throw new HttpError(502,'GLM-OCR 返回内容为空，任务已保留。');
  reader=response.body.getReader();
  let bytes=0,raw='';const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:false});
  while(true){
   const {done,value}=await Promise.race([reader.read(),stopped]);
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>maxResponseBytes){void reader.cancel().catch(()=>{});throw new HttpError(502,'GLM-OCR 返回内容超过处理限制，任务已保留。');}
   raw+=decoder.decode(value,{stream:true});
  }
  raw+=decoder.decode();
  const value=JSON.parse(raw);
  if(!value||value.error||value.model!=='glm-ocr'||typeof value.md_results!=='string'||!value.md_results.trim()||value.md_results.length>300000)
   throw new HttpError(502,'GLM-OCR 返回内容不完整或格式无效，任务已保留。');
  if(signal.aborted)throw new HttpError(499,'识别已取消，原稿和任务已保留。');
  const id=value.id;
  const providerRequestId=typeof id==='string'&&id.length<=200&&!/[\x00-\x1f\x7f]/.test(id)?id:'';
  const usage=value.usage;
  const knownUsage=usage&&['prompt_tokens','completion_tokens','total_tokens'].every(k=>Number.isSafeInteger(usage[k])&&usage[k]>=0)&&usage.prompt_tokens+usage.completion_tokens===usage.total_tokens
   ?{prompt_tokens:usage.prompt_tokens,completion_tokens:usage.completion_tokens,total_tokens:usage.total_tokens}:null;
  return {markdown:value.md_results,raw,model:'glm-ocr',providerRequestId,usage:knownUsage};
 }catch(error){
  if(error instanceof HttpError)throw error;
  if(signal.aborted)throw new HttpError(499,'识别已取消，原稿和任务已保留。');
  // Provider bodies and exception messages can contain credentials/image data; never echo them.
  throw new HttpError(502,'GLM-OCR 连接失败或返回格式无效，原稿和任务已保留。');
 }finally{
  clearTimeout(timer);signal.removeEventListener('abort',abort);controller.abort();
  void reader?.cancel().catch(()=>{});
 }
}
