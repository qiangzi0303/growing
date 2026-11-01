import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {createHandler,type Env} from '../src/index';
import {connect,type Database} from '../src/database';
import {validateAssessment,validateRegions} from '../src/photo-assessment';

const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
let db:Database,output:any,calls:any[]=[],hook:(()=>Promise<void>)|undefined;
const env={AUTH_LIMITER:{limit:async()=>({success:true})},AI_LIMITER:{limit:async()=>({success:true})},HANDWRITING_VISION_MODELS:JSON.stringify([{name:'test',model:'test',endpoint:'https://vision.test/v1',apiKey:'test-only'}]),ASSETS:{fetch:async()=>new Response('asset')}} as unknown as Env;
const handler=createHandler(()=>db,(async(_url,options)=>{
  const body=JSON.parse(options!.body as string);calls.push(body);const callback=hook;hook=undefined;if(callback)await callback();
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]});
}) as typeof fetch);
const pages=['data:image/jpeg;base64,/9j/AA==','data:image/jpeg;base64,/9j/AQ=='];
const assessment=(overrides:any={})=>({verdict:'partial',score:50,studentAnswer:'第1页：通分时漏了负号',feedback:'通分应保留减号。',corrections:[{location:'第1页第2步',issue:'漏负号',correction:'把减号分配到括号内每一项'}],knowledge:[{nodeId:'add',role:'tested',confidence:.95,reason:'本题考查分式加减'},{nodeId:'add',role:'gap',confidence:.95,reason:'第2步漏了负号'}],models:[],...overrides});
const paper=()=>({format:'math-text-v1',title:'整页作业',warnings:['第4题不清楚'],questions:[
  {number:'1',text:'计算分式加减。',answer:'',unitId:'math-8b-10',confidence:.98,reason:'分式加减',uncertain:[],pages:[1],regions:[{page:1,x:.1,y:.1,width:.8,height:.3}],assessment:assessment()},
  {number:'2',text:'角平分线上一点到角两边的距离相等。',answer:'',unitId:'math-8a-01',confidence:.98,reason:'角平分线',uncertain:[],pages:[1,2],regions:[{page:2,x:0,y:.2,width:1,height:.4}],assessment:assessment({verdict:'correct',score:100,studentAnswer:'作两条垂线，利用公共斜边、相等的直角和锐角，以AAS证明全等。',corrections:[],knowledge:[{nodeId:'angle-bisector',role:'tested',confidence:.95,reason:'角平分线等距性质'}],models:[{modelId:10,confidence:.95,reason:'题中存在角平分线及到角两边的垂线，先核对垂足位置。'}]})},
  {number:'3',text:'另一道分式题。',answer:'',unitId:'math-8b-10',confidence:.9,reason:'分式',uncertain:[],pages:[2],regions:[],assessment:assessment({verdict:'unanswered',score:null,studentAnswer:'',feedback:'未看到作答。',corrections:[],knowledge:[]})},
  {number:'4',text:'图中条件【不清楚】。',answer:'',unitId:'',confidence:.1,reason:'模糊',uncertain:['第2页缺少图形条件'],pages:[2],regions:[],assessment:assessment({verdict:'review',score:null,studentAnswer:'【不清楚】',feedback:'请补拍第2页第4题。',corrections:[],knowledge:[]})}
]});
async function call(path:string,method='GET',data?:unknown,token?:string){return handler(new Request('https://learn.test/api'+path,{method,headers:{'Content-Type':'application/json','X-Growing-Client':'1',...(token?{Authorization:'Bearer '+token}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})}),env,{waitUntil:()=>{}});}
async function register(role='Student'){
  const r=await call('/auth/register','POST',{username:'photo_'+crypto.randomUUID().replaceAll('-','').slice(0,12),displayName:'拍照验证',password:'Test-Only-1987!',role});assert.equal(r.status,200);return r.json() as Promise<any>;
}
async function importPaper(user:any,photoPages=pages){output=paper();const input={studentId:user.user.id,requestId:crypto.randomUUID(),mode:'grade',pages:photoPages};const r=await call('/question-bank/import','POST',input,user.token);assert.equal(r.status,200);return {input,data:await r.json() as any};}
before(async()=>{
  db=connect(await mf.getD1Database('DB') as unknown as D1Database);
  for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
    const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
  }
});
after(async()=>{await mf.dispose();});

test('assessment validators reject invented links, invalid scores and regions; low confidence is withheld',()=>{
  assert.ok(validateAssessment(assessment(),'math-8b-10'));
  assert.equal(validateAssessment(assessment({score:100}),'math-8b-10'),null);
  assert.equal(validateAssessment(assessment({knowledge:[{nodeId:'invented',role:'gap',confidence:1,reason:'x'}]}),'math-8b-10'),null);
  assert.equal(validateAssessment(assessment({models:[{modelId:30,confidence:1,reason:'x'}]}),'math-8a-01'),null);
  const low=validateAssessment(assessment({knowledge:[{nodeId:'add',role:'gap',confidence:.5,reason:'不确定'}]}),'math-8b-10');assert.deepEqual(low?.knowledge,[]);
  assert.equal(validateRegions([{page:1,x:.8,y:0,width:.3,height:1}],[1]),null);
  assert.equal(validateRegions([{page:2,x:0,y:0,width:1,height:1}],[1]),null);
});

test('real figure crops survive both modes; attachment repairs preserve grades and enforce ownership and versions',async()=>{
  const u=await register(),other=await register();output=paper();
  const region={page:1,x:.2,y:.3,width:.25,height:.2};output.questions[1].figures=[region];
  const response=await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),mode:'transcribe',pages},u.token);
  assert.equal(response.status,200);const data=await response.json() as any,q=data.questions[1];
  assert.deepEqual(q.figures,[region]);assert.equal(q.grades.length,0);
  assert.equal((await (await call('/question-bank/papers/'+data.paperId+'?studentId='+u.user.id,'GET',undefined,u.token)).json() as any).pages.length,2);
  const path='/question-bank/questions/'+q.id+'/figures',query='?studentId='+u.user.id;
  const input={studentId:u.user.id,figureVersion:1,figures:[region]};
  assert.equal((await call(path+query,'GET',undefined,other.token)).status,404);
  assert.equal((await call(path,'PUT',input,other.token)).status,404);
  assert.equal((await call(path,'PUT',{...input,figures:[{...region,page:3}]},u.token)).status,400);
  assert.equal((await call(path,'PUT',input,u.token)).status,200);
  assert.equal((await call(path,'PUT',input,u.token)).status,409);
  assert.equal((await call(path,'PUT',{studentId:u.user.id,figureVersion:2,image:'<svg onload=alert(1)>'},u.token)).status,400);
  assert.equal((await call(path,'PUT',{studentId:u.user.id,figureVersion:2,image:pages[0]},u.token)).status,200);
  const image=await call(path+query,'GET',undefined,u.token);assert.equal(image.headers.get('cache-control'),'no-store');assert.equal((await image.json() as any).image,pages[0]);
  const list=await (await call('/question-bank/questions?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;
  const updated=list.rows.find((r:any)=>r.id===q.id);assert.equal(updated.hasFigureImage,1);assert.equal(updated.revision,1);assert.ok(!JSON.stringify(list).includes('data:image'));
  const graded=await importPaper(u,['data:image/jpeg;base64,/9j/Ag==',pages[1]]);const g=graded.data.questions[0],before=structuredClone(g.grades);
  assert.equal((await call('/question-bank/questions/'+g.id+'/figures','PUT',{studentId:u.user.id,figureVersion:1,image:pages[0]},u.token)).status,200);
  const review=await (await call('/question-bank/questions/'+g.id+'/review'+query,'GET',undefined,u.token)).json() as any;assert.deepEqual(review.question.grades,before);assert.equal(review.question.revision,1);
  output={reply:'依据补传题图解释'};
  assert.equal((await call('/question-bank/questions/'+g.id+'/followup','POST',{studentId:u.user.id,gradeId:before[0].id,requestId:crypto.randomUUID(),prompt:'图中的线段在哪里'},u.token)).status,200);
  assert.equal(calls.at(-1).messages[1].content.filter((c:any)=>c.type==='image_url').length,2,'follow-up includes the source and attached figure');
});

test('duplicate upload repairs discarded legacy originals; missing pages can be restored without replacing existing evidence',async()=>{
  const u=await register(),{input,data}=await importPaper(u),q=data.questions[0];
  await db.query('DELETE FROM "GrowingQuestionPages" WHERE "PaperId"=?1',[data.paperId]);
  const before=calls.length,retry=await call('/question-bank/import','POST',input,u.token);assert.equal(retry.status,200);assert.equal(calls.length,before);
  assert.equal((await retry.json() as any).questions[0].id,q.id);
  const path='/question-bank/papers/'+data.paperId+'/pages',restore={studentId:u.user.id,page:1,image:pages[0]};
  assert.equal((await call(path,'POST',restore,u.token)).status,200);
  assert.equal((await call(path,'POST',{...restore,image:pages[1]},u.token)).status,409);
  assert.equal((await call(path,'POST',{...restore,page:4},u.token)).status,404);
  await db.query('DELETE FROM "GrowingQuestionPages" WHERE "PaperId"=?1 AND "Page"=1',[data.paperId]);
  assert.equal((await call('/question-bank/questions/'+q.id+'/figures','PUT',{studentId:u.user.id,figureVersion:1,figures:[{page:1,x:0,y:0,width:1,height:1}]},u.token)).status,400);
  assert.equal((await call(path,'POST',restore,u.token)).status,200);
  const review=await (await call('/question-bank/questions/'+q.id+'/review?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;assert.deepEqual(review.question.grades,data.questions[0].grades);
});
test('whole-paper import atomically retains sources and grades, maps real lessons, and counts only reliable answers once',async()=>{
  const u=await register(),{input,data}=await importPaper(u);assert.equal(data.questions.length,4);
  const [q1,q2,q3,q4]=data.questions;assert.equal(q1.grades[0].result.score,50);assert.equal(q1.answer,'');assert.equal(q1.regions.length,1);
  assert.match(q1.grades[0].result.knowledge[0].href,/knowledge.html\?chapter=math-8b-10&node=add/);assert.equal(q2.grades[0].result.models[0].href,'app-design/geometry-models.html#model-10');
  const source=await (await call('/question-bank/papers/'+data.paperId+'?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;assert.equal(source.pages.length,2);assert.equal(source.questions.length,4);
  const count=await db.query<any>('SELECT "QuestionId" AS id,"Correct" AS correct FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1',[u.user.id]);assert.equal(count.length,2);assert.equal(count.find(r=>r.id===q1.id).correct,0);assert.ok(!count.some(r=>[q3.id,q4.id].includes(r.id)));
  const before=calls.length;
  for(const retry of [input,{...input,requestId:crypto.randomUUID()}]){const r=await call('/question-bank/import','POST',retry,u.token);assert.equal(r.status,200);assert.equal((await r.json() as any).duplicate,true);}
  assert.equal(calls.length,before);assert.equal((await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1',[u.user.id])).length,2);
  assert.equal((await call('/question-bank/import','POST',{...input,mode:'transcribe'},u.token)).status,409);
});
test('cross-student access is denied; bound parents can review and revocation during generation prevents saving',async()=>{
  const u=await register(),other=await register(),parent=await register('Parent'),{data}=await importPaper(u),q=data.questions[0];
  for(const suffix of ['/papers/'+data.paperId,'/questions/'+q.id+'/review'])assert.equal((await call('/question-bank'+suffix+'?studentId='+u.user.id,'GET',undefined,other.token)).status,404);
  const prompt={studentId:u.user.id,gradeId:q.grades[0].id,requestId:crypto.randomUUID(),prompt:'为什么错'};
  assert.equal((await call('/question-bank/questions/'+q.id+'/followup','POST',prompt,other.token)).status,404);
  const invite=await (await call('/student/invitations','POST',undefined,u.token)).json() as any;
  assert.equal((await call('/parent/children','POST',{code:invite.code},parent.token)).status,200);
  assert.equal((await call('/question-bank/questions/'+q.id+'/review?studentId='+u.user.id,'GET',undefined,parent.token)).status,200);
  output={reply:'检查括号外减号。'};hook=async()=>{await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "StudentId"=?1 AND "ParentId"=?2',[u.user.id,parent.user.id]);};
  assert.equal((await call('/question-bank/questions/'+q.id+'/followup','POST',prompt,parent.token)).status,404);
  assert.equal((await db.query('SELECT * FROM "GrowingPhotoFollowups" WHERE "QuestionId"=?1',[q.id])).length,0);
});
test('follow-up uses the selected grade and original images, survives retry, and never changes the score or attempts',async()=>{
  const u=await register(),{data}=await importPaper(u),q=data.questions[0],path='/question-bank/questions/'+q.id+'/followup';
  output={reply:'只提示下一步：先检查括号外的减号。'};const input={studentId:u.user.id,gradeId:q.grades[0].id,requestId:crypto.randomUUID(),prompt:'只提示下一步'};
  assert.equal((await call(path,'POST',input,u.token)).status,200);
  const context=JSON.parse(calls.at(-1).messages[1].content[0].text);assert.equal(context.assessment.studentAnswer,q.grades[0].result.studentAnswer);assert.equal(context.prompt,'只提示下一步');assert.ok(calls.at(-1).messages[1].content.some((c:any)=>c.type==='image_url'));
  const before=calls.length;assert.equal((await call(path,'POST',input,u.token)).status,200);assert.equal(calls.length,before);
  assert.equal((await call(path,'POST',{...input,prompt:'不同的问题'},u.token)).status,409);
  assert.equal((await db.query('SELECT * FROM "GrowingPhotoFollowups" WHERE "QuestionId"=?1',[q.id])).length,1);
  assert.equal((await db.query('SELECT * FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[q.id])).length,1);
  assert.equal((await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "QuestionId"=?1',[q.id])).length,1);
});
test('correction is a new immutable grade and attempt; concurrent retries preserve the first grade exactly',async()=>{
  const u=await register(),{data}=await importPaper(u),q=data.questions[0],first=structuredClone(q.grades[0]);
  output=assessment({verdict:'correct',score:100,corrections:[],knowledge:[{nodeId:'add',role:'tested',confidence:.95,reason:'正确保留符号'}]});
  const input={studentId:u.user.id,requestId:crypto.randomUUID(),revision:1,studentAnswer:'订正：把减号分配给每一项。'},path='/question-bank/questions/'+q.id+'/correct';
  for(const response of await Promise.all([call(path,'POST',input,u.token),call(path,'POST',input,u.token)]))assert.equal(response.status,200);
  const result=await (await call('/question-bank/questions/'+q.id+'/review?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;
  assert.equal(result.question.grades.length,2);assert.deepEqual(result.question.grades[0],first);assert.equal(result.question.grades[1].studentAnswer,input.studentAnswer);assert.equal(result.question.grades[1].result.score,100);
  assert.equal((await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "QuestionId"=?1',[q.id])).length,2);
  assert.equal((await call(path,'POST',{...input,studentAnswer:'改了内容'},u.token)).status,409);
});
test('incomplete AI results save nothing; edited questions invalidate stale follow-ups and in-flight corrections',async()=>{
  const u=await register();output=paper();output.questions[1].assessment.models[0].modelId=30;
  const before=(await db.query('SELECT * FROM "GrowingQuestionPapers" WHERE "StudentId"=?1',[u.user.id])).length;
  assert.equal((await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),mode:'grade',pages},u.token)).status,502);
  assert.equal((await db.query('SELECT * FROM "GrowingQuestionPapers" WHERE "StudentId"=?1',[u.user.id])).length,before);
  const {data}=await importPaper(u),q=data.questions[0];output=assessment();hook=async()=>{await db.query('UPDATE "GrowingPhotoQuestions" SET "Revision"=2 WHERE "Id"=?1',[q.id]);};
  assert.equal((await call('/question-bank/questions/'+q.id+'/correct','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),revision:1,studentAnswer:'我的订正'},u.token)).status,409);
  assert.equal((await db.query('SELECT * FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[q.id])).length,1);
  output={reply:'不应调用'};const beforeCalls=calls.length;
  assert.equal((await call('/question-bank/questions/'+q.id+'/followup','POST',{studentId:u.user.id,gradeId:q.grades[0].id,requestId:crypto.randomUUID(),prompt:'为什么错'},u.token)).status,409);assert.equal(calls.length,beforeCalls);
});

test('the documented 6000-character correction accepts UTF-8 text without a smaller byte limit',async()=>{
  const u=await register(),{data}=await importPaper(u),q=data.questions[0];
  output=assessment();
  const studentAnswer='订'.repeat(6000),path='/question-bank/questions/'+q.id+'/correct';
  const response=await call(path,'POST',{studentId:u.user.id,requestId:crypto.randomUUID(),revision:1,studentAnswer},u.token);
  assert.equal(response.status,200);
  assert.equal((await response.json() as any).grade.studentAnswer,studentAnswer);
  assert.equal((await call(path,'POST',{studentId:u.user.id,requestId:crypto.randomUUID(),revision:1,studentAnswer:studentAnswer+'正'},u.token)).status,400);
});

test('photo mistakes enter the owned learning archive with grade causes; correction and uncertain outcomes update duck context conservatively',async()=>{
  const u=await register(),other=await register(),{data}=await importPaper(u),q=data.questions[0];
  const archive=async(unit='math-8b-10',topic='add',token=u.token)=>{
    const response=await call('/student/knowledge?unit='+unit+'&topic='+topic+'&studentId='+u.user.id,'GET',undefined,token);
    assert.equal(response.status,200);return response.json() as Promise<any>;
  };
  let p=await archive(),entry=p.wrongQuestions.find((r:any)=>r.questionId===q.id),focus=p.context.mistakeFocus[0];
  assert.equal(entry.photoReview.latest.verdict,'partial');assert.equal(entry.photoReview.error.score,50);
  assert.equal(focus.causeSource,'photo-grade-gap');assert.match(focus.cause,/漏了负号/);
  assert.equal(focus.questionNumber,'1');assert.equal(focus.status,'needs-review');
  assert.equal(p.topics.find((t:any)=>t.id==='add').status,'weak');assert.equal(p.counts.mastered,0);
  assert.ok(!JSON.stringify(p).includes('"studentAnswer"'));assert.ok(!JSON.stringify(p).includes('data:image'));
  assert.equal((await archive('math-8b-10','common')).context.mistakeFocus.length,0);
  const isolated=await archive('math-8b-10','add',other.token);assert.equal(isolated.wrongQuestions.length,0);assert.equal(isolated.student.id,other.user.id);
  for(const correct of [true,false]){
    assert.equal((await call('/question-bank/attempts','POST',{studentId:u.user.id,kind:'photo',questionId:q.id,attemptId:crypto.randomUUID(),correct},u.token)).status,200);
    const checked=await archive(),review=checked.wrongQuestions.find((r:any)=>r.questionId===q.id).photoReview;
    assert.equal(review.latest.outcomeSource,'self-check');assert.equal(review.latest.verdict,'partial');assert.equal(review.latest.score,50);
    assert.equal(checked.context.mistakeFocus[0].status,correct?'latest-correct':'needs-review');
  }
  output=assessment({verdict:'correct',score:100,corrections:[],knowledge:[{nodeId:'add',role:'tested',confidence:.95,reason:'订正通过'}]});
  assert.equal((await call('/question-bank/questions/'+q.id+'/correct','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),revision:1,studentAnswer:'PRIVATE_CORRECTED_ANSWER'},u.token)).status,200);
  p=await archive();entry=p.wrongQuestions.find((r:any)=>r.questionId===q.id);
  assert.equal(entry.status,'latest-correct');assert.equal(entry.photoReview.latest.outcomeSource,'photo-grade');assert.equal(entry.photoReview.error.score,50);
  assert.equal(p.context.mistakeFocus[0].status,'latest-correct');assert.equal(p.topics.find((t:any)=>t.id==='add').status,'unknown');
  assert.ok(!p.reminders.some((r:any)=>r.kind==='mistake'));assert.ok(!JSON.stringify(p.context).includes('PRIVATE_CORRECTED_ANSWER'));
  output=assessment({verdict:'review',score:null,feedback:'新作答无法判断',corrections:[],knowledge:[]});
  assert.equal((await call('/question-bank/questions/'+q.id+'/correct','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),revision:1,studentAnswer:'待核对过程'},u.token)).status,200);
  p=await archive();assert.equal(p.context.mistakeFocus[0].status,'historical');assert.equal(p.wrongQuestions[0].photoReview.latest.verdict,'review');
  assert.ok(!p.reminders.some((r:any)=>r.kind==='mistake'));
  await db.query('UPDATE "GrowingPhotoQuestions" SET "Revision"=2 WHERE "Id"=?1',[q.id]);
  p=await archive();assert.equal(p.context.mistakeFocus[0].status,'historical');
});

test('a graded test topic is distinct from an evidenced gap and cannot establish that topic as weak',async()=>{
  const u=await register();output=paper();output.questions[0].assessment.knowledge=output.questions[0].assessment.knowledge.filter((k:any)=>k.role==='tested');
  const response=await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),mode:'grade',pages},u.token);assert.equal(response.status,200);
  const p=await (await call('/student/knowledge?unit=math-8b-10&topic=add','GET',undefined,u.token)).json() as any;
  assert.equal(p.context.mistakeFocus[0].association,'graded-topic');assert.equal(p.context.mistakeFocus[0].cause,null);
  assert.equal(p.topics.find((t:any)=>t.id==='add').status,'unknown');assert.ok(p.wrongQuestions[0].photoReview.error.corrections.length);
});
