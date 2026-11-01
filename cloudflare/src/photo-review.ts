import { type Database, type Statement, type User, HttpError, nowSql } from './database';
import { hash } from './auth';
import { visionCompletion, type VisionEnv } from './handwriting-vision';
import { type PhotoAssessment, assessmentLinks, assessmentInstructions, photoLearningContext, validateAssessment } from './photo-assessment';
import mathFormat from '../../platform-web/math-format.js';

const fail=(status:number,message:string):never=>{throw new HttpError(status,message);};
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const gradeSelect='"Id" AS id,"QuestionId" AS questionId,"RequestId" AS requestId,"Fingerprint" AS fingerprint,"QuestionRevision" AS revision,"Kind" AS kind,"StudentAnswer" AS studentAnswer,"Result" AS result,"CreatedAt" AS at';
const decodeGrade=(g:any)=>{const {fingerprint,requestId,...publicGrade}=g;return {...publicGrade,result:assessmentLinks(JSON.parse(g.result))};};
export async function attachPhotoGrades(db:Database,questions:any[]){
  if(!questions.length)return questions;
  const grades=await db.query<any>(`SELECT ${gradeSelect} FROM "GrowingPhotoGrades" WHERE "QuestionId" IN (${questions.map(()=>'?').join(',')}) ORDER BY "CreatedAt",rowid`,questions.map(q=>q.id));
  return questions.map(q=>({...q,regions:typeof q.regions==='string'?JSON.parse(q.regions):q.regions||[],grades:grades.filter(g=>g.questionId===q.id).map(decodeGrade)}));
}
export function photoGradeStatements(questionId:string,student:string,actor:string,result:PhotoAssessment,kind:'initial'|'correction',requestId:string,fingerprint:string,revision=1):Statement[]{
  const id=crypto.randomUUID();
  const statements:Statement[]=[{sql:`INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt")
    SELECT ?1,?2,?3,?4,?5,?6,?7,?8,${nowSql} WHERE EXISTS (SELECT 1 FROM "GrowingPhotoQuestions" WHERE "Id"=?2 AND "Revision"=?5) ON CONFLICT DO NOTHING`,
    params:[id,questionId,requestId,fingerprint,revision,kind,result.studentAnswer,JSON.stringify(result)]}];
  if(!['review','unanswered'].includes(result.verdict))statements.push({sql:`INSERT INTO "GrowingQuestionAttempts" ("StudentId","AttemptId","Kind","QuestionId","Correct","ActorId","CreatedAt")
    SELECT ?1,?2,'photo',?3,?4,?5,${nowSql} WHERE EXISTS (SELECT 1 FROM "GrowingPhotoGrades" WHERE "Id"=?2) ON CONFLICT DO NOTHING`,params:[student,id,questionId,result.verdict==='correct'?1:0,actor]});
  return statements;
}
export class PhotoReview{
  constructor(private db:Database,private user:User,private authorize:(id:unknown)=>Promise<string>){}
  private async question(student:string,id:string){
    const [q]=await this.db.query<any>(`SELECT q."Id" AS id,q."PaperId" AS paperId,q."Number" AS number,q."Text" AS text,q."Answer" AS answer,q."UnitId" AS unitId,q."Revision" AS revision,q."Pages" AS pages,q."Uncertain" AS uncertain,q."Regions" AS regions
      FROM "GrowingPhotoQuestions" q JOIN "GrowingQuestionPapers" p ON p."Id"=q."PaperId" WHERE p."StudentId"=?1 AND q."Id"=?2`,[student,id]);
    if(!q)fail(404,'未找到题目。');return {...q,pages:JSON.parse(q.pages),uncertain:JSON.parse(q.uncertain)};
  }
  private async images(q:any){
    return (await this.db.query<{image:string}>(`SELECT "Image" AS image FROM "GrowingQuestionPages" WHERE "PaperId"=?1 AND "Page" IN (${q.pages.map(()=>'?').join(',')}) ORDER BY "Page"`,[q.paperId,...q.pages])).map(p=>p.image);
  }
  async read(student:string,id:string){
    const q=await this.question(student,id);
    const [question]=await attachPhotoGrades(this.db,[q]);
    const followups=await this.db.query('SELECT "Id" AS id,"GradeId" AS gradeId,"Prompt" AS prompt,"Reply" AS reply,"CreatedAt" AS at FROM "GrowingPhotoFollowups" WHERE "QuestionId"=?1 ORDER BY "CreatedAt",rowid',[id]);
    return {question,followups};
  }
  async followup(student:string,id:string,data:Record<string,unknown>,env:VisionEnv,signal:AbortSignal,upstream:typeof fetch){
    if(Object.keys(data).some(k=>!['studentId','gradeId','requestId','prompt'].includes(k))||!uuid(data.gradeId)||!uuid(data.requestId)||typeof data.prompt!=='string'||!data.prompt.trim()||data.prompt.length>1600)fail(400,'请选择批改记录并输入1600字以内的追问。');
    const q=await this.question(student,id);
    const [grade]=await this.db.query<any>(`SELECT ${gradeSelect} FROM "GrowingPhotoGrades" WHERE "Id"=?1 AND "QuestionId"=?2`,[data.gradeId,id]);
    if(!grade)fail(404,'未找到本题的批改记录。');
    if(q.revision!==grade.revision)fail(409,'题干已修改，请先重新提交作答批改，再围绕新记录追问。');
    const existing=async()=>{
      const [row]=await this.db.query<any>('SELECT "GradeId" AS gradeId,"Prompt" AS prompt,"Reply" AS reply FROM "GrowingPhotoFollowups" WHERE "QuestionId"=?1 AND "RequestId"=?2',[id,data.requestId]);
      if(row&&(row.gradeId!==data.gradeId||row.prompt!==data.prompt))fail(409,'追问内容已变化，请重新发送。');return row;
    };
    const old=await existing();if(old)return {reply:old.reply,duplicate:true};
    const history=await this.db.query<any>('SELECT "GradeId" AS gradeId,"Prompt" AS prompt,"Reply" AS reply FROM "GrowingPhotoFollowups" WHERE "QuestionId"=?1 ORDER BY "CreatedAt",rowid',[id]);
    if(history.length>=30)fail(413,'本题已保存30次追问，请结合已有讲解完成订正。');
    if(!(await env.AI_LIMITER.limit({key:'vision:'+this.user.id})).success)fail(429,'追问过于频繁，请稍后重试。');
    const pages=await this.images(q);
    const response=await visionCompletion(env,signal,upstream,
      assessmentInstructions+'当前任务仅解释当前题的错因，不重新评分，不改动原评分。结合给定批改、真实知识点、原始手写及追问历史解释。用户选择“只提示下一步”时，只给下一步提示，不能直接公布完整答案；“为什么错”要引用实际步骤；“换一种讲法”用不同例子解释。没有原图时不得声称看过图片。条件模糊就先问清楚，不捏造。只返回JSON {"reply":"讲解"}。',
      {question:q,assessment:JSON.parse(grade.result),...photoLearningContext,history:history.filter(h=>h.gradeId===grade.id).slice(-8),prompt:data.prompt,imageSourcePages:q.pages,hasOriginalImages:pages.length>0},pages,
      v=>{try{return v&&typeof v.reply==='string'&&v.reply.trim()&&v.reply.length<=12000?{reply:mathFormat.normalize(v.reply)}:null;}catch{return null;}});
    const result=await response.json() as {reply:string};
    if(signal.aborted)fail(499,'追问已取消，原批改保留。');
    await this.authorize(student);
    await this.db.query(`INSERT INTO "GrowingPhotoFollowups" ("Id","QuestionId","GradeId","RequestId","Prompt","Reply","CreatedAt")
      SELECT ?1,?2,?3,?4,?5,?6,${nowSql} WHERE EXISTS (SELECT 1 FROM "GrowingPhotoQuestions" WHERE "Id"=?2 AND "Revision"=?7)
      AND (SELECT count(*) FROM "GrowingPhotoFollowups" WHERE "QuestionId"=?2)<30 ON CONFLICT DO NOTHING`,[crypto.randomUUID(),id,data.gradeId,data.requestId,data.prompt,result.reply,q.revision]);
    const saved=await existing();if(!saved)fail(409,'题目已变化或追问次数已满，请刷新本题。');
    return {reply:saved.reply};
  }
  async correct(student:string,id:string,data:Record<string,unknown>,env:VisionEnv,signal:AbortSignal,upstream:typeof fetch){
    if(Object.keys(data).some(k=>!['studentId','requestId','revision','studentAnswer'].includes(k))||!uuid(data.requestId)||!Number.isSafeInteger(data.revision)||typeof data.studentAnswer!=='string'||!data.studentAnswer.trim()||data.studentAnswer.length>6000)fail(400,'请填写6000字以内的订正过程。');
    const q=await this.question(student,id);
    if(q.revision!==data.revision)fail(409,'题目已更新，请刷新后再提交订正。');
    const fingerprint=await hash(JSON.stringify({revision:q.revision,studentAnswer:data.studentAnswer}));
    const existing=async()=>{
      const [g]=await this.db.query<any>(`SELECT ${gradeSelect} FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1 AND "RequestId"=?2`,[id,data.requestId]);
      if(g&&g.fingerprint!==fingerprint)fail(409,'本次作答内容已变化，请重新提交。');return g;
    };
    const old=await existing();if(old)return {grade:decodeGrade(old),duplicate:true};
    const [count]=await this.db.query<{total:number}>('SELECT count(*) AS total FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[id]);
    if(count.total>=20)fail(413,'本题已保存20次批改，请新建练习。');
    if(!(await env.AI_LIMITER.limit({key:'vision:'+this.user.id})).success)fail(429,'订正批改过于频繁，请稍后重试。');
    const pages=await this.images(q);
    const response=await visionCompletion(env,signal,upstream,
      assessmentInstructions+'当前仅批改本题新提交的文字订正过程，原图用于核对题设和几何条件，原图里的旧答案不是本次作答，不拿旧错误扣分。studentAnswer字段必须记录这次给定的订正文字。不得重新批改其他题。只返回一个assessment JSON对象。',
      {question:q,studentAnswer:data.studentAnswer,...photoLearningContext,imageSourcePages:q.pages,hasOriginalImages:pages.length>0},pages,v=>validateAssessment({...v,studentAnswer:data.studentAnswer},q.unitId),false,true);
    const result=await response.json() as PhotoAssessment;
    if(signal.aborted)fail(499,'订正批改已取消，原评分保留。');
    await this.authorize(student);
    await this.db.batch(photoGradeStatements(id,student,this.user.id,result,'correction',data.requestId as string,fingerprint,q.revision).map(s=>s.sql.includes('INSERT INTO "GrowingPhotoGrades"')?{...s,sql:s.sql.replace('ON CONFLICT DO NOTHING','AND (SELECT count(*) FROM "GrowingPhotoGrades" WHERE "QuestionId"=?2)<20 ON CONFLICT DO NOTHING')}:s));
    const saved=await existing();if(!saved)fail(409,'批改期间题目已变化或批改次数已满，请刷新后重试。');
    return {grade:decodeGrade(saved)};
  }
}
