import { type Database, type Statement, type User, HttpError, nowSql } from './database';
import { hash } from './auth';
import { visionCompletion, type VisionEnv } from './handwriting-vision';
import { type PhotoAssessment, assessmentLinks, assessmentInstructionsFor, learningContextFor, validateAssessment, validateAnswerAnnotations } from './photo-assessment';
import mathFormat from '../../platform-web/math-format.js';
import archiveQuestions from './math-wrong-question-rules.json';

const fail=(status:number,message:string):never=>{throw new HttpError(status,message);};
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const gradeSelect='"Id" AS id,"QuestionId" AS questionId,"RequestId" AS requestId,"Fingerprint" AS fingerprint,"QuestionRevision" AS revision,"Kind" AS kind,"StudentAnswer" AS studentAnswer,"Result" AS result,"CreatedAt" AS at';
const decodeGrade=(g:any)=>{const {fingerprint,requestId,...publicGrade}=g;return {...publicGrade,result:assessmentLinks(JSON.parse(g.result))};};
export async function attachPhotoGrades(db:Database,questions:any[]){
  if(!questions.length)return questions;
  const grades=await db.query<any>(`SELECT ${gradeSelect} FROM "GrowingPhotoGrades" WHERE "QuestionId" IN (${questions.map(()=>'?').join(',')}) ORDER BY "CreatedAt",rowid`,questions.map(q=>q.id));
  return questions.map(q=>({...q,figures:typeof q.figures==='string'?JSON.parse(q.figures):q.figures||[],regions:typeof q.regions==='string'?JSON.parse(q.regions):q.regions||[],grades:grades.filter(g=>g.questionId===q.id).map(decodeGrade)}));
}
export function photoGradeStatements(questionId:string,student:string,actor:string,result:PhotoAssessment,kind:'initial'|'correction',requestId:string,fingerprint:string,revision=1,mathId?:string):Statement[]{
  const id=crypto.randomUUID();
  const statements:Statement[]=[{sql:`INSERT INTO "GrowingPhotoGrades" ("Id","QuestionId","RequestId","Fingerprint","QuestionRevision","Kind","StudentAnswer","Result","CreatedAt")
    SELECT ?1,?2,?3,?4,?5,?6,?7,?8,${nowSql} WHERE EXISTS (SELECT 1 FROM "GrowingPhotoQuestions" WHERE "Id"=?2 AND "Revision"=?5) ON CONFLICT DO NOTHING`,
    params:[id,questionId,requestId,fingerprint,revision,kind,result.studentAnswer,JSON.stringify(result)]}];
  if(!['review','unanswered'].includes(result.verdict))statements.push({sql:`INSERT INTO "GrowingQuestionAttempts" ("StudentId","AttemptId","Kind","QuestionId","Correct","ActorId","CreatedAt")
    SELECT ?1,?2,'${mathId?'math':'photo'}',?3,?4,?5,${nowSql} WHERE EXISTS (SELECT 1 FROM "GrowingPhotoGrades" WHERE "Id"=?2) ON CONFLICT DO NOTHING`,params:[student,id,mathId||questionId,result.verdict==='correct'?1:0,actor]});
  return statements;
}
export class PhotoReview{
  constructor(private db:Database,private user:User,private authorize:(id:unknown)=>Promise<string>){}
  private async question(student:string,id:string){
    const [q]=await this.db.query<any>(`SELECT p."Subject" AS subject,p."Mode" AS mode,q."PaperWrong" AS paperWrong,q."Id" AS id,q."PaperId" AS paperId,q."Number" AS number,q."Text" AS text,q."Answer" AS answer,q."UnitId" AS unitId,q."Revision" AS revision,q."Pages" AS pages,q."Uncertain" AS uncertain,q."Regions" AS regions
      FROM "GrowingPhotoQuestions" q JOIN "GrowingQuestionPapers" p ON p."Id"=q."PaperId" WHERE p."StudentId"=?1 AND q."Id"=?2`,[student,id]);
    if(!q)fail(404,'未找到题目。');
    const [figure]=await this.db.query<any>('SELECT "Figures" AS figures,"FigureVersion" AS figureVersion,(length("FigureImage")>0) AS hasFigureImage,(length("FigureDrawing")>0) AS hasDrawing,"DrawingReviewed" AS drawingReviewed,"DrawingRevision" AS drawingRevision FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[id]);
    return {...q,...figure,pages:JSON.parse(q.pages),uncertain:JSON.parse(q.uncertain)};
  }
  private async images(q:any){
    const original=(await this.db.query<{image:string}>(`SELECT "Image" AS image FROM "GrowingQuestionPages" WHERE "PaperId"=?1 AND "Page" IN (${q.pages.map(()=>'?').join(',')}) ORDER BY "Page"`,[q.paperId,...q.pages])).map(p=>p.image);
    const [figure]=await this.db.query<any>('SELECT "FigureImage" AS image FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[q.id]);
    return [...original,...(figure?.image?[figure.image]:[])];
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
    const isolatedEnglish=q.subject!=='math'&&(JSON.parse(grade.result).answerPages||[]).length>0;
    const pages=isolatedEnglish?[]:await this.images(q);
    const [illustration]=isolatedEnglish?await this.db.query<any>('SELECT "FigureImage" AS image FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[id]):[];
    const questionFigures=illustration?.image?[illustration.image]:[];
    if(isolatedEnglish&&JSON.parse(q.figures||'[]').length&&!questionFigures.length)fail(409,'本题独立题设插图缺失，请先补回题图再追问；原批改保留。');
    const [figure]=await this.db.query<any>('SELECT "FigureDrawing" AS drawing,"DrawingReviewed" AS reviewed,"DrawingRevision" AS revision FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[id]);
    const question={...q,drawing:figure?.reviewed&&figure.revision===q.revision?JSON.parse(figure.drawing||'null'):null};
    const {answerPages=[],...assessment}=JSON.parse(grade.result);
    const response=await visionCompletion(env,signal,upstream,
      assessmentInstructionsFor(q.subject)+'当前任务仅解释当前题的错因，不重新评分，不改动原评分。结合给定批改、真实知识点、原始手写及追问历史解释。如answerPageCount大于0，前answerPageCount页是所选批改的订正原稿，后续图片仅用于核对题设，不能把旧答案当成本次作答。用户选择“只提示下一步”时，只给下一步提示，不能直接公布完整答案；“为什么错”要引用实际步骤；“换一种讲法”用不同例子解释。没有原图时不得声称看过图片。条件模糊就先问清楚，不捏造。只返回JSON {"reply":"讲解"}。',
      {question,assessment,...learningContextFor(q.subject),history:history.filter(h=>h.gradeId===grade.id).slice(-8),prompt:data.prompt,answerPageCount:answerPages.length,questionFigureCount:questionFigures.length,imageSourcePages:isolatedEnglish?[]:q.pages,hasOriginalImages:pages.length>0},[...answerPages,...questionFigures,...pages],
      v=>{try{return v&&typeof v.reply==='string'&&v.reply.trim()&&v.reply.length<=12000?{reply:q.subject==='english'?v.reply:mathFormat.normalize(v.reply)}:null;}catch{return null;}});
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
    const handwritten=data.answerPages!==undefined;
    if(Object.keys(data).some(k=>!['studentId','requestId','revision','studentAnswer','answerPages'].includes(k))||!uuid(data.requestId)||!Number.isSafeInteger(data.revision)||
      (handwritten?data.studentAnswer!==undefined||!Array.isArray(data.answerPages)||!data.answerPages.length||data.answerPages.length>4||data.answerPages.some(p=>typeof p!=='string'||!/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(p))||data.answerPages.reduce((n,p)=>n+p.length,0)>600000:
        typeof data.studentAnswer!=='string'||!data.studentAnswer.trim()||data.studentAnswer.length>6000))fail(400,'请提交最多4页、总大小600KB以内的PNG手写答案，或6000字以内的订正过程。');
    const q=await this.question(student,id);
    if(q.revision!==data.revision)fail(409,'题目已更新，请刷新后再提交订正。');
    const fingerprint=await hash(JSON.stringify({revision:q.revision,...(handwritten?{answerPages:data.answerPages}:{studentAnswer:data.studentAnswer})}));
    const existing=async()=>{
      const [g]=await this.db.query<any>(`SELECT ${gradeSelect} FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1 AND "RequestId"=?2`,[id,data.requestId]);
      if(g&&g.fingerprint!==fingerprint)fail(409,'本次作答内容已变化，请重新提交。');return g;
    };
    const old=await existing();if(old)return {grade:decodeGrade(old),duplicate:true};
    const [count]=await this.db.query<{total:number}>('SELECT count(*) AS total FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[id]);
    if(count.total>=20)fail(413,'本题已保存20次批改，请新建练习。');
    if(!(await env.AI_LIMITER.limit({key:'vision:'+this.user.id})).success)fail(429,'订正批改过于频繁，请稍后重试。');
    // Old paper photos contain previous answers and must never enter a new handwriting grade.
    const pages=handwritten?[]:await this.images(q);
    const [illustration]=handwritten&&q.subject!=='math'?await this.db.query<any>('SELECT "FigureImage" AS image FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[id]):[];
    const questionFigures=illustration?.image?[illustration.image]:[];
    if(handwritten&&q.subject!=='math'&&JSON.parse(q.figures||'[]').length&&!questionFigures.length)fail(409,'本题需要独立题设插图，请先核对并补传独立题图，再提交批改；本次未评分，手写原稿保留。');
    const [drawing]=handwritten?await this.db.query<any>('SELECT "FigureDrawing" AS drawing,"DrawingReviewed" AS reviewed,"DrawingRevision" AS revision FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[id]):[];
    const question=handwritten?{subject:q.subject,number:q.number,text:q.text,referenceAnswer:q.answer,unitId:q.unitId,uncertain:q.uncertain,
      figures:JSON.parse(q.figures||'[]'),drawing:drawing?.reviewed&&drawing.revision===q.revision?JSON.parse(drawing.drawing||'null'):null}:q;
    const annotationInstructions=handwritten?'在assessment中另外返回answerAnnotations数组，把可可靠定位的正误步骤标到本次手写原稿。每项为{"page":1,"x":0.1,"y":0.2,"width":0.5,"height":0.1,"kind":"correct|partial|incorrect","comment":"本步骤的判断与具体批改，可含LaTeX公式"}。坐标相对对应手写页左上角归一化到0至1，矩形不能越界，page只能为前answerPageCount页；最多24处，框住实际作答，不能把原题或旧答案标作本次作答。正确步骤也可标correct。定位不可靠时不猜坐标，用空数组并在feedback或corrections说明。':'';
    const response=await visionCompletion(env,signal,upstream,
      assessmentInstructionsFor(q.subject)+annotationInstructions+(handwritten?'当前任务是单题手写订正批改，前answerPageCount张是本次新作答，其后questionFigureCount张是独立题设插图，不含原试卷整页或旧答案。题设使用question.text、独立插图及已审核的question.drawing，referenceAnswer仅供独立核验，不是学生作答。不得从参考答案、题设或目录抄写studentAnswer；忠实转录图片中的实际笔迹。缺少必要题图条件或笔迹不清时使用review，不猜测。填空题只填写正确答案即可判correct，不强求未要求的解题过程。空白用unanswered。':'当前仅批改本题新提交的文字订正过程，原图用于核对题设和几何条件，原图里的旧答案不是本次作答，不拿旧错误扣分。studentAnswer字段必须记录这次给定的订正文字。')+'不得重新批改其他题。只返回一个assessment JSON对象。',
      {question,...(handwritten?{answerPageCount:(data.answerPages as string[]).length}:{studentAnswer:data.studentAnswer}),questionFigureCount:questionFigures.length,...learningContextFor(q.subject),imageSourcePages:handwritten?[]:q.pages,hasOriginalImages:pages.length>0},
      [...(handwritten?data.answerPages as string[]:[]),...questionFigures,...pages],v=>{
        const result=validateAssessment(handwritten?v:{...v,studentAnswer:data.studentAnswer},q.unitId,undefined,q.subject);
        if(!result||!handwritten)return result;
        const annotations=validateAnswerAnnotations(v.answerAnnotations,(data.answerPages as string[]).length,q.subject);
        return annotations?{...result,answerAnnotations:annotations}:null;
      },false,true);
    const result=await response.json() as PhotoAssessment;
    if(handwritten){result.answerPages=data.answerPages as string[];result.answerSource='handwriting-only';}
    if(signal.aborted)fail(499,'订正批改已取消，原评分保留。');
    await this.authorize(student);
    const mathId=q.mode?.startsWith('unit-wrong-')?archiveQuestions.find(item=>item.sourceId===q.mode.slice(11)&&String(item.number)===q.number)?.id:undefined;
    await this.db.batch(photoGradeStatements(id,student,this.user.id,result,'correction',data.requestId as string,fingerprint,q.revision,mathId).map(s=>s.sql.includes('INSERT INTO "GrowingPhotoGrades"')?{...s,sql:s.sql.replace('ON CONFLICT DO NOTHING','AND (SELECT count(*) FROM "GrowingPhotoGrades" WHERE "QuestionId"=?2)<20 ON CONFLICT DO NOTHING')}:s));
    const saved=await existing();if(!saved)fail(409,'批改期间题目已变化或批改次数已满，请刷新后重试。');
    return {grade:decodeGrade(saved)};
  }
}
