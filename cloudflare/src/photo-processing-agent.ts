import {connect,HttpError,requiresRoleSelection,type Database,type User} from './database';
import {PaperImportJobs} from './paper-import-jobs';
import {QuestionBank} from './question-bank';
import type {VisionEnv} from './handwriting-vision';
import policy from '../skills/photo-exam-to-question-bank/policy.json';

export type PhotoJobMessage={id:string;revision:number};
export interface PhotoProcessingEnv extends VisionEnv {DB?:D1Database;PHOTO_PROCESSING_QUEUE?:Queue<PhotoJobMessage>}
type Runtime=NonNullable<ConstructorParameters<typeof PaperImportJobs>[4]>;
type Row={Id:string;StudentId:string;State:string;Revision:number;LeaseUntil:number};
const maxAttempts=5;
const active=(s:any)=>s.processor==='photo-agent-v1'&&!s.paperId&&!s.error;
const read=(db:Database,id:string)=>db.query<Row>('SELECT "Id","StudentId","State","Revision","LeaseUntil" FROM "GrowingPaperImportJobs" WHERE "Id"=?1',[id]).then(r=>r[0]);
async function stop(db:Database,r:Row,message:string){
 const state=JSON.parse(r.State);state.error=message;
 await db.query('UPDATE "GrowingPaperImportJobs" SET "State"=?3,"Revision"="Revision"+1 WHERE "Id"=?1 AND "Revision"=?2 AND "LeaseUntil"<=?4',[r.Id,r.Revision,JSON.stringify(state),Date.now()]);
}
export async function enqueuePhotoJob(env:PhotoProcessingEnv,job:{id:string;processor?:string;status?:string;revision?:number}){
 if(!env.PHOTO_PROCESSING_QUEUE||job.processor!=='photo-agent-v1'||['complete','failed'].includes(job.status??'')||!Number.isSafeInteger(job.revision))return;
 try{await env.PHOTO_PROCESSING_QUEUE.send({id:job.id,revision:job.revision!});}
 catch{console.warn('Photo processing enqueue unavailable; scheduled recovery will retry.');}
}
export async function consumePhotoJobs(batch:MessageBatch<PhotoJobMessage>,env:PhotoProcessingEnv,runtime:Runtime){
 if(!env.DB||!env.PHOTO_PROCESSING_QUEUE){batch.retryAll({delaySeconds:60});return;}
 const db=connect(env.DB);
 try{for(const message of batch.messages){
  let row:Row|undefined;
  try{
   const body=message.body;
   if(!body||typeof body.id!=='string'||body.id.length>128||!Number.isSafeInteger(body.revision)||body.revision<0){message.ack();continue;}
   row=await read(db,body.id);
   if(!row||row.Revision!==body.revision||!active(JSON.parse(row.State))){message.ack();continue;}
   if(row.LeaseUntil>Date.now()){if(message.attempts>=maxAttempts)message.ack();else message.retry({delaySeconds:Math.min(180,Math.max(5,Math.ceil((row.LeaseUntil-Date.now())/1000)))});continue;}
   const state=JSON.parse(row.State);
   const users=await db.query<User>(`SELECT "Id" AS id,"Username" AS username,"DisplayName" AS displayName,
    CASE WHEN EXISTS(SELECT 1 FROM "GrowingAdministrators" a WHERE a."UserId"="GrowingUsers"."Id") THEN 'Admin' ELSE "Role" END AS role,
    "RoleConfirmed" AS roleConfirmed,'' AS passwordHash FROM "GrowingUsers" WHERE "Id"=?1`,[state.actorId]);
   const user=users[0];
   if(!user||requiresRoleSelection(user)){
    await stop(db,row,'提交账户权限已失效，请确认账户后重试。');message.ack();continue;
   }
   await new QuestionBank(db,user).authorize(row.StudentId);
   const scoped={...env,PHOTO_AGENT_INSTRUCTIONS:policy.instructions,MANAGED_AI_CONTEXT:{db,userId:user.id,feature:'photo-processing-agent'}};
   const next=await new PaperImportJobs(db,user,undefined,undefined,runtime).backendStep(row.StudentId,row.Id,scoped,new AbortController().signal,fetch);
   if(next.status!=='complete'&&next.status!=='failed')await env.PHOTO_PROCESSING_QUEUE.send({id:row.Id,revision:next.revision});
   message.ack();
  }catch(error){
   if(row&&error instanceof HttpError&&[400,401,403,404].includes(error.status)){
    await stop(db,row,'账户或学生关联已失效，后台处理已停止。');message.ack();continue;
   }
   const latest=row?await read(db,row.Id):undefined;
   if(latest&&!active(JSON.parse(latest.State))){message.ack();continue;}
   if(message.attempts>=maxAttempts){
    if(latest)await stop(db,latest,'后台处理连续重试失败，已保留进度，请稍后重试。');
    message.ack();continue;
   }
   // A rate limit releases the lease and increments revision. Carry the retry
   // count in private state so new queue messages cannot reset the retry bound.
   if(latest&&latest.Revision!==message.body.revision){
    const s=JSON.parse(latest.State);s.queueRetries=(s.queueRetries??0)+1;
    if(s.queueRetries>=maxAttempts){await stop(db,latest,'后台请求持续受限，已保留进度，请稍后重试。');message.ack();continue;}
    await db.query('UPDATE "GrowingPaperImportJobs" SET "State"=?3 WHERE "Id"=?1 AND "Revision"=?2 AND "LeaseUntil"<=?4',[latest.Id,latest.Revision,JSON.stringify(s),Date.now()]);
    await env.PHOTO_PROCESSING_QUEUE.send({id:latest.Id,revision:latest.Revision},{delaySeconds:30*s.queueRetries});message.ack();
   }else message.retry({delaySeconds:Math.min(180,15*message.attempts)});
  }
 }}finally{await db.close();}
}
export async function recoverPhotoJobs(env:PhotoProcessingEnv){
 if(!env.DB||!env.PHOTO_PROCESSING_QUEUE)return;
 const db=connect(env.DB);
 try{
  const rows=await db.query<Row>(`SELECT "Id","Revision","State" FROM "GrowingPaperImportJobs" WHERE "LeaseUntil"<=?1
   AND json_extract("State",'$.processor')='photo-agent-v1' AND coalesce(json_extract("State",'$.error'),'')=''
   AND coalesce(json_extract("State",'$.paperId'),'')='' ORDER BY random() LIMIT 50`,[Date.now()]);
  for(const row of rows)await env.PHOTO_PROCESSING_QUEUE.send({id:row.Id,revision:row.Revision});
 }finally{await db.close();}
}
