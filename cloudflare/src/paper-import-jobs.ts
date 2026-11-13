import {type Database,type User,HttpError,nowSql,type Statement} from './database';
import {hash} from './auth';
import {QuestionBank,validatePaper} from './question-bank';
import {type VisionEnv} from './handwriting-vision';
import {validateAssessment,type PhotoRegion} from './photo-assessment';
import {photoGradeStatements} from './photo-review';
import {normalizeClassification} from './paper-classification';
import {planPage,transcribeQuestion,gradeQuestion,mergePageRegions,sameRegion,type ImportedQuestion} from './paper-import-recognition';
import {locateQuestionRegions,recognizeQuestionText,reviewQuestion,redrawQuestion,verifyQuestionDrawing,assessReviewedQuestion} from './paper-visual-workflow';

type Task={number:string;pages:number[];regions:PhotoRegion[]};
type Stage='locate'|'transcribe'|'review'|'draw'|'verify'|'grade';
type Pending={number:string;stage:Stage;draft?:ImportedQuestion;question?:ImportedQuestion;issues?:string[];drawingHash?:string};
type State={workflow?:'visual-v1';pending?:Pending;mode?:'grade';pages:string[];planned:number;tasks:Task[];results:any[];title:string;classification:any;warnings:string[];error:string;paperId:string|null};
type Row={Id:string;StudentId:string;RequestId:string;Fingerprint:string;Subject:string;State:string;Revision:number;LeaseUntil:number};
const fail=(status:number,message:string):never=>{throw new HttpError(status,message);};
const uuid=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const image=(v:unknown):v is string=>typeof v==='string'&&v.length<=500000&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(v);
const subject=(v:unknown)=>['math','english','physics'].includes(String(v));
const packed=(s:State)=>JSON.stringify({...s,pages:s.pages.map(()=> '')});
export class PaperImportJobs{
 constructor(private db:Database,private user:User,private recognition={planPage,transcribeQuestion:recognizeQuestionText,locateQuestionRegions,reviewQuestion,redrawQuestion,verifyQuestionDrawing},private grade=assessReviewedQuestion){}
 private bank(){return new QuestionBank(this.db,this.user);}
 private async row(student:string,id:string){
  await this.bank().authorize(student);
  const [row]=await this.db.query<Row>('SELECT * FROM "GrowingPaperImportJobs" WHERE "StudentId"=?1 AND "Id"=?2',[student,id]);
  if(!row)fail(404,'未找到录入任务。');
  const pages=await this.db.query<{Page:number;Image:string}>('SELECT "Page","Image" FROM "GrowingPaperImportJobPages" WHERE "JobId"=?1 ORDER BY "Page"',[id]);
  const state=JSON.parse(row.State);
  if(pages.length!==state.pages.length||pages.some((p,i)=>p.Page!==i+1||!image(p.Image)))fail(409,'试卷原页缺失或损坏，不能继续录入。');
  state.pages=pages.map(p=>p.Image);row.State=JSON.stringify(state);return row;
 }
 private view(r:Row){const s:State=JSON.parse(r.State),planned=s.planned===s.pages.length;return {id:r.Id,subject:r.Subject,mode:s.mode||'paper',status:s.paperId?'complete':s.error?'failed':!planned?'planning':s.mode==='grade'?'grading':'recognizing',revision:r.Revision,pageCount:s.pages.length,plannedPages:s.planned,recognizedQuestions:s.results.length,completedQuestions:s.results.length,totalQuestions:s.tasks.length,progressPercent:s.paperId?100:planned&&s.tasks.length?Math.floor(s.results.length*100/s.tasks.length):null,paperId:s.paperId,error:s.error,next:s.paperId?null:!planned?{kind:'plan',page:s.planned+1}:s.tasks[s.results.length]?{kind:'question',...s.tasks[s.results.length],stage:s.pending?.stage??'locate',...(s.pending?.stage==='verify'?{drawing:s.pending.question?.drawing,drawingHash:s.pending.drawingHash}:{})}:null};}
 async create(data:Record<string,unknown>){
  const student=await this.bank().authorize(data.studentId);
  if(Object.keys(data).some(k=>!['studentId','requestId','subject','pages','mode'].includes(k))||data.mode!==undefined&&data.mode!=='grade'||typeof data.requestId!=='string'||!uuid.test(data.requestId)||!subject(data.subject)||!Array.isArray(data.pages)||!data.pages.length||data.pages.length>4||!data.pages.every(image))fail(400,'请上传最多4页清晰JPG照片。');
  const fingerprint=await hash(JSON.stringify({subject:data.subject,pages:data.pages,...(data.mode==='grade'?{mode:'grade'}:{})}));
  const find=async()=> (await this.db.query<Row>('SELECT * FROM "GrowingPaperImportJobs" WHERE "StudentId"=?1 AND "RequestId"=?2',[student,data.requestId]))[0];
  let old=await find();if(old){if(old.Fingerprint!==fingerprint)fail(409,'上传内容已变化，请新建任务。');return this.view(old);}
  const state:State={...(data.mode==='grade'?{mode:'grade' as const}:{}),pages:data.pages as string[],planned:0,tasks:[],results:[],title:'待核对试卷',classification:null,warnings:[],error:'',paperId:null};
  const id=crypto.randomUUID();
  await this.db.batch([{sql:`INSERT INTO "GrowingPaperImportJobs" ("Id","StudentId","RequestId","Fingerprint","Subject","State","CreatedAt") SELECT ?1,?2,?3,?4,?5,?6,${nowSql} WHERE (SELECT count(*) FROM "GrowingPaperImportJobs" WHERE "StudentId"=?2)<100 AND (SELECT count(*) FROM "GrowingQuestionPapers" WHERE "StudentId"=?2)<100 ON CONFLICT DO NOTHING`,params:[id,student,data.requestId,fingerprint,data.subject,packed(state)]},...state.pages.map((image,i)=>({sql:'INSERT INTO "GrowingPaperImportJobPages" ("JobId","Page","Image") SELECT ?1,?2,?3 WHERE EXISTS (SELECT 1 FROM "GrowingPaperImportJobs" WHERE "Id"=?1)',params:[id,i+1,image]}))]);
  old=await find();if(!old)fail(413,'本学生试卷录入容量已满。');if(old.Fingerprint!==fingerprint)fail(409,'上传内容已变化，请新建任务。');return this.view(old);
 }
 async list(student:string,filter?:string|null){await this.bank().authorize(student);if(filter!=null&&!subject(filter))fail(400,'学科无效。');return (await this.db.query<Row>('SELECT * FROM "GrowingPaperImportJobs" WHERE "StudentId"=?1 AND (?2 IS NULL OR "Subject"=?2) ORDER BY "CreatedAt" DESC LIMIT 100',[student,filter??null])).map(r=>this.view(r));}
 async get(student:string,id:string){const r=await this.row(student,id),s:State=JSON.parse(r.State);return {...this.view(r),sourcePages:s.pages.map((image,i)=>({page:i+1,image}))};}
 async remove(student:string,id:string,revision:unknown){
  await this.bank().authorize(student);
  if(!Number.isSafeInteger(revision)||Number(revision)<0)fail(400,'任务版本无效，请刷新后再删除。');
  const [r]=await this.db.query<Row>('SELECT * FROM "GrowingPaperImportJobs" WHERE "StudentId"=?1 AND "Id"=?2',[student,id]);
  if(!r)fail(404,'未找到录入任务。');
  if(JSON.parse(r.State).paperId)fail(409,'任务已生成试卷，不能从待整理列表删除。');
  const guard='"Id"=?1 AND "StudentId"=?2 AND "Revision"=?3 AND "LeaseUntil"<=?4 AND json_extract("State",\'$.paperId\') IS NULL',params=[id,student,revision,Date.now()];
  const [,removed]=await this.db.batch([
   {sql:`DELETE FROM "GrowingPaperImportJobPages" WHERE "JobId"=?1 AND EXISTS (SELECT 1 FROM "GrowingPaperImportJobs" WHERE ${guard})`,params},
   {sql:`DELETE FROM "GrowingPaperImportJobs" WHERE ${guard} RETURNING "Id"`,params}
  ]);
  if(!removed.length)fail(409,'任务正在识别或进度已更新，请稍后刷新再删除。');
  return {deleted:true};
 }
 async progress(student:string,id:string){
  await this.bank().authorize(student);
  const [r]=await this.db.query<Row>('SELECT * FROM "GrowingPaperImportJobs" WHERE "StudentId"=?1 AND "Id"=?2',[student,id]);
  if(!r)fail(404,'未找到批改任务。');
  return {...this.view(r),processing:r.LeaseUntil>Date.now()};
 }
 async step(student:string,id:string,data:Record<string,unknown>,env:VisionEnv,signal:AbortSignal,upstream:typeof fetch){
  const r=await this.row(student,id),s:State=JSON.parse(r.State);if(s.paperId)return this.view(r);
  if(Object.keys(data).some(k=>!['studentId','revision','fragments','diagramImages','drawingHash','workflow'].includes(k))||!Number.isSafeInteger(data.revision)||data.revision!==r.Revision)fail(409,'任务进度已更新，请刷新后继续。');
  if(data.workflow!==undefined&&data.workflow!=='visual-v1')fail(400,'不支持的试卷整理版本。');
  const visual=data.workflow==='visual-v1';
  if(s.workflow==='visual-v1'&&!visual)fail(426,'此任务已启用逐题视觉复核，请更新应用或刷新网页后继续；原稿和进度已保留。');
  const task=s.tasks[s.results.length];
  const fragments=data.fragments as any[]|undefined;
  if(fragments!==undefined&&(!Array.isArray(fragments)||s.planned<s.pages.length||!task||fragments.length>task.regions.length||new Set(fragments.map(f=>f?.page)).size!==fragments.length||fragments.some(f=>!f||!image(f.image)||f.page!==f.region?.page||!task.regions.some(r=>sameRegion(r,f.region)))))fail(400,'题目裁剪区域与规划不一致。');
  const stage=s.pending?.stage??'locate';
  if(visual&&s.planned===s.pages.length&&task&&['transcribe','review','draw','verify','grade'].includes(stage)&&task.pages.some(p=>!fragments?.some(f=>f.page===p)))fail(400,'本题辅助裁剪缺失，请刷新页面后继续整理。');
  if(data.diagramImages!==undefined||data.drawingHash!==undefined){
   if(!visual||stage!=='verify'||s.planned!==s.pages.length||data.drawingHash!==s.pending?.drawingHash||!Array.isArray(data.diagramImages)||data.diagramImages.length!==s.pending?.question?.drawing?.figures.length||data.diagramImages.some(i=>!image(i)||i.length>180000)||fragments?.some(f=>f.image.length>100000))fail(400,'重绘预览与当前题目版本不一致。');
  }else if(visual&&s.planned===s.pages.length&&stage==='verify')fail(400,'缺少本题重绘预览，请刷新后重试。');
  const token=crypto.randomUUID(),now=Date.now();
  const lease=await this.db.query('UPDATE "GrowingPaperImportJobs" SET "LeaseToken"=?3,"LeaseUntil"=?4 WHERE "Id"=?1 AND "Revision"=?2 AND "LeaseUntil"<=?5 RETURNING "Id"',[id,r.Revision,token,now+180000,now]);
  if(!lease.length)fail(409,'任务正在识别，请稍后刷新。');
  try{
   if(!(await env.AI_LIMITER.limit({key:'vision:'+this.user.id})).success)fail(429,'识别请求过于频繁，请稍后继续。');
   s.error='';if(visual)s.workflow='visual-v1';
   if(s.planned<s.pages.length){
    const page=s.planned+1,previous=s.tasks.at(-1);
    const plan=await this.recognition.planPage(env,signal,upstream,r.Subject as any,s.pages[s.planned],page,s.pages.length,previous?.number??'');
    if(plan.continuesPrevious){if(!previous)throw new HttpError(502,'第一页不能承接前页。');previous.pages.push(page);previous.regions=mergePageRegions([...previous.regions,...plan.continuationRegions]);}
    for(const q of plan.questions){if(s.tasks.some(t=>t.number===q.number))fail(502,'题号重复，请核对分页。');s.tasks.push({number:q.number,pages:[page],regions:mergePageRegions(q.regions)});}
    if(!plan.questions.length&&!plan.continuesPrevious)fail(502,'本页没有完整题目规划，请核对原图。');
    if(s.tasks.length>(r.Subject==='english'?120:40))fail(413,'试卷题目过多，请分卷上传。');
    if(page===1){s.title=plan.title;s.classification=plan.classification;}
    else if(plan.classification?.warnings.some(w=>/冲突|不符/.test(w))){s.classification={...s.classification,examType:'unknown',unitIds:[],confidence:0,warnings:[...(s.classification?.warnings??[]),'后续页的学科或分类存在冲突，请核对。']};}
    s.warnings.push(...plan.warnings,...(plan.classification?.warnings??[]));s.planned++;
   }else{
    if(!task)fail(502,'题目规划不完整。');
    if(!visual){
     // Older installed clients cannot prepare rendered previews; keep their existing job contract.
     const result=await (s.mode==='grade'?gradeQuestion:transcribeQuestion)(env,signal,upstream,r.Subject,task,s.pages.map((image,i)=>({page:i+1,image})),fragments??[]);
     const q=result.question,assessment=s.mode==='grade'?validateAssessment(result.assessment,q.unitId,undefined,r.Subject):undefined;
     if(q.number!==task.number||JSON.stringify(q.pages)!==JSON.stringify(task.pages)||q.answer||q.drawing||s.mode==='grade'&&!assessment)fail(502,'题目识别与规划不一致，请重试。');
     s.results.push({...q,regions:task.regions,...(assessment?{assessment}:{})});s.warnings.push(...result.warnings);
    }else{
    const pending=s.pending??(s.pending={number:task.number,stage:'locate'}),pages=s.pages.map((image,i)=>({page:i+1,image}));
    if(pending.number!==task.number)fail(409,'题目处理阶段与当前进度不符。');
    let finished=false,assessment;
    const next=()=>{if(s.mode==='grade')pending.stage='grade';else finished=true;};
    switch(pending.stage){
     case 'locate':{
      const located=await this.recognition.locateQuestionRegions(env,signal,upstream,r.Subject,task,pages);
      task.regions=mergePageRegions(located.regions);s.warnings.push(...located.warnings);pending.stage='transcribe';break;
     }
     case 'transcribe':{
      try{const draft=await this.recognition.transcribeQuestion(env,signal,upstream,r.Subject,task,pages,fragments??[]);pending.draft=draft.question;}
      catch(error){if(!(error instanceof HttpError)||error.status!==502)throw error;s.warnings.push('部分OCR草稿失败，题面以独立原图复核为准。');}
      pending.stage='review';break;
     }
     case 'review':{
      const reviewed=await this.recognition.reviewQuestion(env,signal,upstream,r.Subject,task,pages,fragments??[]);
      pending.question=reviewed.question;delete pending.draft;s.warnings.push(...reviewed.warnings);
      // Re-crop with independently found figures, including diagrams printed above the stem.
      task.regions=mergePageRegions([...task.regions,...reviewed.question.figures]);
      if(r.Subject==='math'&&reviewed.hasFigures)pending.stage='draw';else next();break;
     }
     case 'draw':{
      if(!pending.question)fail(409,'缺少已复核题面。');
      const vector=await this.recognition.redrawQuestion(env,signal,upstream,r.Subject,task,pages,fragments??[],pending.question!,pending.issues??[]);
      pending.question!.drawing=vector.drawing;pending.drawingHash=await hash(JSON.stringify(vector.drawing));s.warnings.push(...vector.warnings);pending.stage='verify';break;
     }
     case 'verify':{
      if(!pending.question?.drawing||await hash(JSON.stringify(pending.question.drawing))!==data.drawingHash)fail(409,'重绘题图版本已变化。');
      const checked=await this.recognition.verifyQuestionDrawing(env,signal,upstream,r.Subject,task,pages,pending.question!,pending.question!.drawing!,data.diagramImages as string[],fragments??[]);
      if(checked.matches){pending.issues=[];next();}
      else{pending.issues=checked.issues;pending.stage='draw';pending.question!.drawing=null;delete pending.drawingHash;s.error='本题重绘未通过原图复核：'+checked.issues.join('；')+'。重试将只修正本题图形。';}
      break;
     }
     case 'grade':{
      if(!pending.question)fail(409,'缺少已复核题面。');
      assessment=validateAssessment(await this.grade(env,signal,upstream,r.Subject,task,pages,fragments??[],pending.question!),pending.question!.unitId,undefined,r.Subject);
      if(!assessment)fail(502,'本题批改结果不完整，请重试。');finished=true;break;
     }
    }
    if(finished){
     const q=pending.question;
     if(!q||q.number!==task.number||JSON.stringify(q.pages)!==JSON.stringify(task.pages)||q.answer)fail(502,'题目识别与规划不一致，请重试。');
     s.results.push({...q,regions:task.regions,...(assessment?{assessment}:{})});delete s.pending;
    }
    }
   }
   s.warnings=[...new Set(s.warnings)].slice(0,20);
   if(signal.aborted)fail(499,'识别已取消，任务已保留。');
   await this.bank().authorize(student);
   const statements:Statement[]=[];
   if(s.planned===s.pages.length&&s.results.length===s.tasks.length){
    if(!s.results.length||s.pages.some((_,i)=>!s.tasks.some(t=>t.pages.includes(i+1))))fail(502,'试卷存在漏页，不能完成。');
    const format=r.Subject+'-text-v1',result=validatePaper({format,title:s.title,warnings:[...new Set(s.warnings)].slice(0,20),classification:s.classification,questions:s.results.map(q=>({...q,confidence:q.unitId?1:0}))},s.pages.length,r.Subject);
    if(!result)throw new HttpError(502,'试卷内容未通过完整性校验。');
    const paperId=crypto.randomUUID(),guard='EXISTS (SELECT 1 FROM "GrowingPaperImportJobs" WHERE "Id"=?1 AND "LeaseToken"=?2 AND "Revision"=?3)';
    statements.push({sql:`INSERT INTO "GrowingQuestionPapers" ("Id","StudentId","RequestId","Fingerprint","Title","Warnings","CreatedAt","Mode","Subject","Classification") SELECT ?4,?5,?6,?7,?8,?9,${nowSql},?12,?10,?11 WHERE ${guard} AND (SELECT count(*) FROM "GrowingQuestionPapers" WHERE "StudentId"=?5)<100`,params:[id,token,r.Revision,paperId,student,'job:'+id,'job:'+id,result.title,JSON.stringify(result.warnings),r.Subject,JSON.stringify(normalizeClassification(s.classification,r.Subject,result.title)),s.mode==='grade'?'grade':'paper-draft']});
    for(let i=0;i<s.pages.length;i++)statements.push({sql:'INSERT INTO "GrowingQuestionPages" ("PaperId","Page","Image") SELECT ?1,?2,?3 WHERE EXISTS (SELECT 1 FROM "GrowingQuestionPapers" WHERE "Id"=?1)',params:[paperId,i+1,s.pages[i]]});
    result.questions.forEach((q,i)=>{
     const qid=crypto.randomUUID();
     statements.push({sql:`INSERT INTO "GrowingPhotoQuestions" ("Id","PaperId","Number","Text","Answer","UnitId","Reason","Uncertain","Pages","Format","Regions","Figures","QuestionType","FigureDrawing","DrawingRevision") SELECT ?1,?2,?3,?4,'',?5,?6,?7,?8,?9,?10,?11,?12,?13,?14 WHERE EXISTS (SELECT 1 FROM "GrowingQuestionPapers" WHERE "Id"=?2)`,params:[qid,paperId,q.number,q.text,q.unitId,q.reason,JSON.stringify(q.uncertain),JSON.stringify(q.pages),format,JSON.stringify(s.results[i].regions),JSON.stringify(q.figures),q.questionType,q.drawing?JSON.stringify(q.drawing):'',q.drawing?1:0]});
     if(s.mode==='grade')statements.push(...photoGradeStatements(qid,student,this.user.id,s.results[i].assessment,'initial',qid,r.Fingerprint));
    });
    s.paperId=paperId;
   }
   const state=packed(s);if(new TextEncoder().encode(state).length>1800000)fail(413,'本卷图形数据过大，请分卷整理。');
   statements.push({sql:'UPDATE "GrowingPaperImportJobs" SET "State"=?4,"Revision"="Revision"+1,"LeaseToken"=\'\',"LeaseUntil"=0 WHERE "Id"=?1 AND "LeaseToken"=?2 AND "Revision"=?3'+(s.paperId?' AND EXISTS (SELECT 1 FROM "GrowingQuestionPapers" WHERE "Id"=?5)':'')+' RETURNING "Id"',params:[id,token,r.Revision,state,...(s.paperId?[s.paperId]:[])]});
   const saved=await this.db.batch(statements);if(!saved.at(-1)?.length)fail(409,'任务状态已变化或试卷容量已满，请刷新后重试。');
  }catch(error){
   // Preserve the pre-step snapshot, so partial planning/recognition cannot skip work.
   const previous:State=JSON.parse(r.State);previous.error=error instanceof HttpError&&error.status===429?'':error instanceof HttpError&&[413,502,503].includes(error.status)?error.message:'本步识别失败，已保存进度，请重试。';
   await this.db.query('UPDATE "GrowingPaperImportJobs" SET "State"=?4,"Revision"="Revision"+1,"LeaseToken"=\'\',"LeaseUntil"=0 WHERE "Id"=?1 AND "LeaseToken"=?2 AND "Revision"=?3',[id,token,r.Revision,packed(previous)]);
   if(error instanceof HttpError&&[429,499,404,409].includes(error.status))throw error;
  }
  return this.view(await this.row(student,id));
 }
}
