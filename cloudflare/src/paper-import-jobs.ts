import {type Database,type User,HttpError,nowSql,type Statement} from './database';
import {hash} from './auth';
import {QuestionBank,validatePaper} from './question-bank';
import {type VisionEnv} from './handwriting-vision';
import {type PhotoRegion} from './photo-assessment';
import {normalizeClassification} from './paper-classification';
import {planPage,transcribeQuestion,mergePageRegions} from './paper-import-recognition';

type Task={number:string;pages:number[];regions:PhotoRegion[]};
type State={pages:string[];planned:number;tasks:Task[];results:any[];title:string;classification:any;warnings:string[];error:string;paperId:string|null};
type Row={Id:string;StudentId:string;RequestId:string;Fingerprint:string;Subject:string;State:string;Revision:number};
const fail=(status:number,message:string):never=>{throw new HttpError(status,message);};
const uuid=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const image=(v:unknown):v is string=>typeof v==='string'&&v.length<=500000&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(v);
const subject=(v:unknown)=>['math','english','physics'].includes(String(v));
const packed=(s:State)=>JSON.stringify({...s,pages:s.pages.map(()=> '')});
export class PaperImportJobs{
 constructor(private db:Database,private user:User,private recognition={planPage,transcribeQuestion}){}
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
 private view(r:Row){const s:State=JSON.parse(r.State);return {id:r.Id,subject:r.Subject,status:s.paperId?'complete':s.error?'failed':s.planned<s.pages.length?'planning':'recognizing',revision:r.Revision,pageCount:s.pages.length,plannedPages:s.planned,recognizedQuestions:s.results.length,totalQuestions:s.tasks.length,paperId:s.paperId,error:s.error,next:s.paperId?null:s.planned<s.pages.length?{kind:'plan',page:s.planned+1}:s.tasks[s.results.length]?{kind:'question',...s.tasks[s.results.length]}:null};}
 async create(data:Record<string,unknown>){
  const student=await this.bank().authorize(data.studentId);
  if(Object.keys(data).some(k=>!['studentId','requestId','subject','pages'].includes(k))||typeof data.requestId!=='string'||!uuid.test(data.requestId)||!subject(data.subject)||!Array.isArray(data.pages)||!data.pages.length||data.pages.length>4||!data.pages.every(image))fail(400,'请上传最多4页清晰JPG照片。');
  const fingerprint=await hash(JSON.stringify({subject:data.subject,pages:data.pages}));
  const find=async()=> (await this.db.query<Row>('SELECT * FROM "GrowingPaperImportJobs" WHERE "StudentId"=?1 AND "RequestId"=?2',[student,data.requestId]))[0];
  let old=await find();if(old){if(old.Fingerprint!==fingerprint)fail(409,'上传内容已变化，请新建任务。');return this.view(old);}
  const state:State={pages:data.pages as string[],planned:0,tasks:[],results:[],title:'待核对试卷',classification:null,warnings:[],error:'',paperId:null};
  const id=crypto.randomUUID();
  await this.db.batch([{sql:`INSERT INTO "GrowingPaperImportJobs" ("Id","StudentId","RequestId","Fingerprint","Subject","State","CreatedAt") SELECT ?1,?2,?3,?4,?5,?6,${nowSql} WHERE (SELECT count(*) FROM "GrowingPaperImportJobs" WHERE "StudentId"=?2)<100 AND (SELECT count(*) FROM "GrowingQuestionPapers" WHERE "StudentId"=?2)<100 ON CONFLICT DO NOTHING`,params:[id,student,data.requestId,fingerprint,data.subject,packed(state)]},...state.pages.map((image,i)=>({sql:'INSERT INTO "GrowingPaperImportJobPages" ("JobId","Page","Image") SELECT ?1,?2,?3 WHERE EXISTS (SELECT 1 FROM "GrowingPaperImportJobs" WHERE "Id"=?1)',params:[id,i+1,image]}))]);
  old=await find();if(!old)fail(413,'本学生试卷录入容量已满。');if(old.Fingerprint!==fingerprint)fail(409,'上传内容已变化，请新建任务。');return this.view(old);
 }
 async list(student:string,filter?:string|null){await this.bank().authorize(student);if(filter!=null&&!subject(filter))fail(400,'学科无效。');return (await this.db.query<Row>('SELECT * FROM "GrowingPaperImportJobs" WHERE "StudentId"=?1 AND (?2 IS NULL OR "Subject"=?2) ORDER BY "CreatedAt" DESC LIMIT 100',[student,filter??null])).map(r=>this.view(r));}
 async get(student:string,id:string){const r=await this.row(student,id),s:State=JSON.parse(r.State);return {...this.view(r),sourcePages:s.pages.map((image,i)=>({page:i+1,image}))};}
 async step(student:string,id:string,data:Record<string,unknown>,env:VisionEnv,signal:AbortSignal,upstream:typeof fetch){
  const r=await this.row(student,id),s:State=JSON.parse(r.State);if(s.paperId)return this.view(r);
  if(Object.keys(data).some(k=>!['studentId','revision','fragments'].includes(k))||!Number.isSafeInteger(data.revision)||data.revision!==r.Revision)fail(409,'任务进度已更新，请刷新后继续。');
  const task=s.tasks[s.results.length];
  const fragments=data.fragments as any[]|undefined;
  if(fragments!==undefined&&(!Array.isArray(fragments)||s.planned<s.pages.length||!task||fragments.length>task.regions.length||new Set(fragments.map(f=>f?.page)).size!==fragments.length||fragments.some(f=>!f||!image(f.image)||f.page!==f.region?.page||!task.regions.some(r=>['page','x','y','width','height'].every(k=>r[k as keyof PhotoRegion]===f.region[k])))))fail(400,'题目裁剪区域与规划不一致。');
  const token=crypto.randomUUID(),now=Date.now();
  const lease=await this.db.query('UPDATE "GrowingPaperImportJobs" SET "LeaseToken"=?3,"LeaseUntil"=?4 WHERE "Id"=?1 AND "Revision"=?2 AND "LeaseUntil"<=?5 RETURNING "Id"',[id,r.Revision,token,now+180000,now]);
  if(!lease.length)fail(409,'任务正在识别，请稍后刷新。');
  try{
   if(!(await env.AI_LIMITER.limit({key:'vision:'+this.user.id})).success)fail(429,'识别请求过于频繁，请稍后继续。');
   s.error='';
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
    const result=await this.recognition.transcribeQuestion(env,signal,upstream,r.Subject as any,task,s.pages.map((image,i)=>({page:i+1,image})),fragments??[]);
    const q=result.question;
    if(q.number!==task.number||JSON.stringify(q.pages)!==JSON.stringify(task.pages)||q.answer||q.drawing)fail(502,'题目识别与规划不一致，请重试。');
    s.results.push({...q,regions:task.regions});s.warnings.push(...result.warnings);
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
    statements.push({sql:`INSERT INTO "GrowingQuestionPapers" ("Id","StudentId","RequestId","Fingerprint","Title","Warnings","CreatedAt","Mode","Subject","Classification") SELECT ?4,?5,?6,?7,?8,?9,${nowSql},'paper-draft',?10,?11 WHERE ${guard} AND (SELECT count(*) FROM "GrowingQuestionPapers" WHERE "StudentId"=?5)<100`,params:[id,token,r.Revision,paperId,student,'job:'+id,'job:'+id,result.title,JSON.stringify(result.warnings),r.Subject,JSON.stringify(normalizeClassification(s.classification,r.Subject,result.title))]});
    for(let i=0;i<s.pages.length;i++)statements.push({sql:'INSERT INTO "GrowingQuestionPages" ("PaperId","Page","Image") SELECT ?1,?2,?3 WHERE EXISTS (SELECT 1 FROM "GrowingQuestionPapers" WHERE "Id"=?1)',params:[paperId,i+1,s.pages[i]]});
    result.questions.forEach((q,i)=>statements.push({sql:`INSERT INTO "GrowingPhotoQuestions" ("Id","PaperId","Number","Text","Answer","UnitId","Reason","Uncertain","Pages","Format","Regions","Figures","QuestionType") SELECT ?1,?2,?3,?4,'',?5,?6,?7,?8,?9,?10,?11,?12 WHERE EXISTS (SELECT 1 FROM "GrowingQuestionPapers" WHERE "Id"=?2)`,params:[crypto.randomUUID(),paperId,q.number,q.text,q.unitId,q.reason,JSON.stringify(q.uncertain),JSON.stringify(q.pages),format,JSON.stringify(s.results[i].regions),JSON.stringify(q.figures),q.questionType]}));
    s.paperId=paperId;
   }
   statements.push({sql:'UPDATE "GrowingPaperImportJobs" SET "State"=?4,"Revision"="Revision"+1,"LeaseToken"=\'\',"LeaseUntil"=0 WHERE "Id"=?1 AND "LeaseToken"=?2 AND "Revision"=?3'+(s.paperId?' AND EXISTS (SELECT 1 FROM "GrowingQuestionPapers" WHERE "Id"=?5)':'')+' RETURNING "Id"',params:[id,token,r.Revision,packed(s),...(s.paperId?[s.paperId]:[])]});
   const saved=await this.db.batch(statements);if(!saved.at(-1)?.length)fail(409,'任务状态已变化或试卷容量已满，请刷新后重试。');
  }catch(error){
   // Preserve the pre-step snapshot, so partial planning/recognition cannot skip work.
   const previous:State=JSON.parse(r.State);previous.error=error instanceof HttpError&&error.status===429?'':error instanceof HttpError&&[502,503].includes(error.status)?error.message:'本步识别失败，已保存进度，请重试。';
   await this.db.query('UPDATE "GrowingPaperImportJobs" SET "State"=?4,"Revision"="Revision"+1,"LeaseToken"=\'\',"LeaseUntil"=0 WHERE "Id"=?1 AND "LeaseToken"=?2 AND "Revision"=?3',[id,token,r.Revision,packed(previous)]);
   if(error instanceof HttpError&&[429,499,404,409].includes(error.status))throw error;
  }
  return this.view(await this.row(student,id));
 }
}
