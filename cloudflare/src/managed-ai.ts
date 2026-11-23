import { type Database, HttpError, nowSql } from './database';

// Workers secret: exactly 32 random bytes encoded as 64 hexadecimal characters.
// Keep this stable across deployments; changing it requires re-entering stored API keys.
export interface ManagedAIEnv { AI_CONFIG_ENCRYPTION_KEY?: string }
const ids = ['chat','realtime','vision','paperRecognition','paperFigure'] as const;
export type ManagedModelId = typeof ids[number];
export interface ManagedModel { id:string; purpose:string; model:string; endpoint:string; apiKey:string; revision:number; voice?:string }
interface Row { Id:string; Model:string; Endpoint:string; EncryptedKey:string; KeyHint:string; Enabled:number; Revision:number; Voice:string|null }
const fail=(message:string,status=400):never=>{throw new HttpError(status,message)};
const idCheck=(id:string)=>{if(!ids.includes(id as ManagedModelId))fail('不支持的模型用途。')};
const b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes));
const bytes=(value:string)=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
async function master(env:ManagedAIEnv) {
 const hex=env.AI_CONFIG_ENCRYPTION_KEY;
 if(!hex||!/^[a-f\d]{64}$/i.test(hex))return fail('AI 配置加密密钥尚未配置。',503);
 return crypto.subtle.importKey('raw',Uint8Array.from(hex.match(/../g)!,v=>parseInt(v,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function encrypt(value:string,id:string,env:ManagedAIEnv){const iv=crypto.getRandomValues(new Uint8Array(12));return b64(iv)+'.'+b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(id)},await master(env),new TextEncoder().encode(value))))}
async function decrypt(value:string,id:string,env:ManagedAIEnv){const key=await master(env);try{const [iv,data]=value.split('.');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:new TextEncoder().encode(id)},key,bytes(data)))}catch{return fail('AI 配置无法解密，请联系管理员。',503)}}
const masked=(row:Row)=>({id:row.Id,purpose:row.Id,model:row.Model,endpoint:row.Endpoint,enabled:!!row.Enabled,revision:row.Revision,configured:!!row.EncryptedKey,keyHint:row.KeyHint,...(row.Voice?{voice:row.Voice}:{})});
export async function resolveManagedModel(db:Database,env:ManagedAIEnv,id:string):Promise<ManagedModel|undefined>{
 idCheck(id);const row=(await db.query<Row>('SELECT * FROM GrowingAIModels WHERE Id=? AND Enabled=1',[id]))[0];
 if(!row)return undefined;
 return {id:row.Id,purpose:row.Id,model:row.Model,endpoint:row.Endpoint,apiKey:await decrypt(row.EncryptedKey,row.Id,env),revision:row.Revision,...(row.Voice?{voice:row.Voice}:{})};
}
function short(value:unknown,max:number,label:string){if(typeof value!=='string'||!value.trim()||value.length>max||/[\x00-\x1f\x7f]/.test(value))return fail(label+'格式不正确。');return value.trim()}
export interface UsageInput {requestId:string;feature:string;status:string;inputTokens:number|null;outputTokens:number|null;totalTokens:number|null;providerRequestId?:string}
export async function recordManagedUsage(db:Database,userId:string,config:Pick<ManagedModel,'id'|'revision'>,data:UsageInput,source:'server'|'client'='server') {
 const requestId=short(data.requestId,160,'请求标识'),feature=short(data.feature,100,'功能名称');
 if(!['success','error','cancelled'].includes(data.status))fail('调用状态无效。');
 const counts=[data.inputTokens,data.outputTokens,data.totalTokens].map(v=>v===undefined?null:v);
 if(!counts.every(v=>v===null)&&(!counts.every(v=>Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=1_000_000_000)||counts[2]!==Number(counts[0])+Number(counts[1])))fail('Token 用量无效。');
 if(!Number.isSafeInteger(config.revision)||config.revision<1)fail('配置版本无效。');
 const history=(await db.query<{Model:string}>('SELECT Model FROM GrowingAIModelHistory WHERE ConfigId=? AND Revision=?',[config.id,config.revision]))[0];
 if(!history)fail('配置版本不存在。');
 const providerId=data.providerRequestId==null?null:short(data.providerRequestId,200,'供应商请求标识');
 await db.query(`INSERT INTO GrowingAIUsage(UserId,RequestId,ConfigId,ConfigRevision,Model,Feature,Status,Source,InputTokens,OutputTokens,TotalTokens,ProviderRequestId,CreatedAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,${nowSql}) ON CONFLICT(UserId,RequestId) DO NOTHING`,[userId,requestId,config.id,config.revision,history.Model,feature,data.status,source,...counts,providerId]);
 return {ok:true};
}
export class ManagedAI {
 constructor(private db:Database,private env:ManagedAIEnv){}
 async list(){const rows=await this.db.query<Row>('SELECT * FROM GrowingAIModels');return {models:ids.map(id=>{const row=rows.find(r=>r.Id===id);return row?masked(row):{id,purpose:id,model:'',endpoint:'',enabled:false,revision:0,configured:false,keyHint:''}})}}
 async save(id:string,data:Record<string,unknown>){
  idCheck(id);const model=short(data.model,200,'模型名称'),endpoint=short(data.endpoint,2000,'API 地址');
  let url:URL;try{url=new URL(endpoint)}catch{return fail('API 地址无效。')}
  if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search)fail('API 地址必须为不带凭据和参数的 HTTPS 地址。');
  if(typeof data.enabled!=='boolean')fail('启用状态无效。');
  if(data.apiKey!==undefined&&typeof data.apiKey!=='string')fail('Key 格式无效。');
  const old=(await this.db.query<Row>('SELECT * FROM GrowingAIModels WHERE Id=?',[id]))[0];
  const key=typeof data.apiKey==='string'?data.apiKey.trim():'';
  if(!key&&!old)fail('首次配置必须填写 Key。');
  if(key&&(key.length>4096||/[\s\x00-\x1f\x7f]/.test(key)))fail('Key 格式无效。');
  await master(this.env);
  const encrypted=key?await encrypt(key,id,this.env):old!.EncryptedKey,hint=key?'••••'+(key.length>8?key.slice(-4):''):old!.KeyHint;
  const voice=data.voice==null||data.voice===''?null:short(data.voice,80,'音色');
  const revision=(old?.Revision||0)+1;
  try{await this.db.batch([
   {sql:`INSERT INTO GrowingAIModelHistory(ConfigId,Revision,Model) VALUES(?,?,?)`,params:[id,revision,model]},
   {sql:`INSERT INTO GrowingAIModels(Id,Model,Endpoint,EncryptedKey,KeyHint,Enabled,Revision,Voice,UpdatedAt) VALUES(?,?,?,?,?,?,?,?,${nowSql}) ON CONFLICT(Id) DO UPDATE SET Model=excluded.Model,Endpoint=excluded.Endpoint,EncryptedKey=excluded.EncryptedKey,KeyHint=excluded.KeyHint,Enabled=excluded.Enabled,Revision=excluded.Revision,Voice=excluded.Voice,UpdatedAt=excluded.UpdatedAt`,params:[id,model,endpoint,encrypted,hint,data.enabled?1:0,revision,voice]}
  ])}catch(e){if(String(e).includes('UNIQUE constraint'))fail('配置已被其他管理员更新，请刷新后重试。',409);throw e}
  return masked({Id:id,Model:model,Endpoint:endpoint,EncryptedKey:encrypted,KeyHint:hint,Enabled:data.enabled?1:0,Revision:revision,Voice:voice});
 }
 async config(){const models:ManagedModel[]=[];for(const id of ids){const value=await resolveManagedModel(this.db,this.env,id);if(value)models.push(value)}return {models}}
 usage(userId:string,data:Record<string,unknown>){return recordManagedUsage(this.db,userId,{id:String(data.configId||''),revision:data.configRevision as number},data as unknown as UsageInput,'client')}
 async stats(params:URLSearchParams){
  const clauses:string[]=[],values:unknown[]=[];
  for(const key of ['from','to']){const value=params.get(key);if(!value)continue;const date=new Date(value+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)fail('日期格式无效。');const at=new Date(value+'T00:00:00+08:00').getTime()+(key==='to'?86400000:0);clauses.push('a.CreatedAt'+(key==='from'?'>=':'<')+'?');values.push(new Date(at).toISOString())}
  if(params.get('from')&&params.get('to')&&params.get('from')!>params.get('to')!)fail('日期范围无效。');
  for(const [key,column] of [['userId','UserId'],['configId','ConfigId']]){const value=params.get(key);if(value){if(key==='configId')idCheck(value);clauses.push('a.'+column+'=?');values.push(short(value,160,key))}}
  const page=Number(params.get('page')||1),pageSize=Number(params.get('pageSize')||20);if(!Number.isSafeInteger(page)||page<1||page>100000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100)fail('分页参数无效。');
  const where=clauses.length?' WHERE '+clauses.join(' AND '):'';
  const sums='COALESCE(SUM(a.InputTokens),0) AS inputTokens,COALESCE(SUM(a.OutputTokens),0) AS outputTokens,COALESCE(SUM(a.TotalTokens),0) AS totalTokens,COUNT(*) AS requests,COALESCE(SUM(a.TotalTokens IS NULL),0) AS unknownRequests,COALESCE(SUM(a.Status<>\'success\'),0) AS failedRequests';
  const from=' FROM GrowingAIUsage a JOIN GrowingUsers u ON u.Id=a.UserId'+where;
  const [summaryRows,accounts,calls]=await this.db.batch([
   {sql:'SELECT '+sums+from,params:values},
   {sql:'SELECT a.UserId AS userId,u.Username AS username,u.DisplayName AS displayName,'+sums+from+' GROUP BY a.UserId ORDER BY totalTokens DESC,a.UserId',params:values},
   {sql:'SELECT a.RequestId AS requestId,a.UserId AS userId,u.Username AS username,u.DisplayName AS displayName,a.ConfigId AS configId,a.Model AS model,a.Feature AS feature,a.Status AS status,a.Source AS source,a.InputTokens AS inputTokens,a.OutputTokens AS outputTokens,a.TotalTokens AS totalTokens,a.CreatedAt AS createdAt'+from+' ORDER BY a.CreatedAt DESC,a.UserId,a.RequestId LIMIT ? OFFSET ?',params:[...values,pageSize,(page-1)*pageSize]}
  ]);
  const summary=summaryRows[0];
  return {summary,accounts,calls,total:summary.requests,page,pageSize};
 }
}
