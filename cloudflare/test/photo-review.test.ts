import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {createHandler,type Env} from '../src/index';
import {connect,type Database} from '../src/database';
import {validateAssessment,validateRegions} from '../src/photo-assessment';
import drawing from '../../platform-web/question-drawing.js';
import {runInNewContext} from 'node:vm';

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

const vector=()=>({version:'question-svg-v1',figures:[{width:380,height:280,title:'题设三角形',elements:[{tag:'path',d:'M80 230 L180 30 L280 230 Z'},{tag:'text',x:180,y:22,text:'A'}]}],warnings:[]});

test('unit wrong questions save independent photo answers and immutable history in the student scope',async()=>{
  const u=await register(),other=await register(),parent=await register('Parent');
  const input={studentId:u.user.id,questionId:'1025141010-28'};
  let r=await call('/question-bank/unit-wrong','POST',input,u.token);assert.equal(r.status,200,await r.clone().text());
  const saved=await r.json() as any,q=saved.question;
  assert.equal(q.number,'28');assert.equal(q.unitId,'math-8b-10');assert.equal(saved.paper.questions.length,53);assert.equal(q.grades.length,0);
  assert.equal(saved.paper.mode,'unit-wrong-1025141010');
  const again=await (await call('/question-bank/unit-wrong','POST',input,u.token)).json() as any;assert.equal(again.question.id,q.id);
  assert.equal((await call('/question-bank/unit-wrong','POST',input,other.token)).status,404);
  assert.equal((await call('/question-bank/unit-wrong','POST',input,parent.token)).status,404);
  assert.equal((await call('/question-bank/unit-wrong','POST',{...input,questionId:'not-a-question'},u.token)).status,404);
  assert.equal((await call('/question-bank/unit-wrong','POST',{...input,text:'伪造题面'},u.token)).status,400);
  const image1='data:image/png;base64,iVBORw0KGgoAAA==',image2='data:image/png;base64,iVBORw0KGgoAAQ==';
  const body={studentId:u.user.id,revision:q.revision,requestId:crypto.randomUUID(),answerPages:[image1]};
  const path='/question-bank/questions/'+q.id;
  output=assessment({studentAnswer:'本次照片中的答案',answerAnnotations:[]});
  r=await call(path+'/correct','POST',body,u.token);assert.equal(r.status,200,await r.clone().text());
  const first=(await r.json() as any).grade;
  const context=JSON.parse(calls.at(-1).messages[1].content[0].text);
  assert.deepEqual(context.imageSourcePages,[]);assert.equal(context.answerPageCount,1);
  assert.deepEqual(calls.at(-1).messages[1].content.filter((p:any)=>p.type==='image_url').map((p:any)=>p.image_url.url),[image1]);
  const beforeCalls=calls.length;
  const retry=await (await call(path+'/correct','POST',body,u.token)).json() as any;assert.equal(retry.grade.id,first.id);assert.equal(calls.length,beforeCalls);
  output=assessment({verdict:'correct',score:100,studentAnswer:'第二次照片答案',corrections:[],answerAnnotations:[]});
  r=await call(path+'/correct','POST',{...body,requestId:crypto.randomUUID(),answerPages:[image2]},u.token);assert.equal(r.status,200);
  const history=await (await call(path+'/review?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;
  assert.equal(history.question.grades.length,2);assert.deepEqual(history.question.grades[0],first);
  assert.deepEqual(history.question.grades.map((g:any)=>g.result.answerPages),[[image1],[image2]]);
  const stats=await (await call('/question-bank/attempt-stats?studentId='+u.user.id+'&kind=math','GET',undefined,u.token)).json() as any[];
  assert.equal(stats.find(s=>s.questionId===input.questionId).totalCount,2);assert.equal(stats.find(s=>s.questionId===input.questionId).wrongCount,1);
  assert.equal((await call(path+'/review?studentId='+u.user.id,'GET',undefined,other.token)).status,404);
  await db.query('INSERT INTO "GrowingFamilyLinks" ("StudentId","ParentId","CreatedAt") VALUES (?1,?2,?)',[u.user.id,parent.user.id,'2026-11-04']);
  assert.equal((await call(path+'/review?studentId='+u.user.id,'GET',undefined,parent.token)).status,200);
  await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "StudentId"=?1',[u.user.id]);
  assert.equal((await call(path+'/review?studentId='+u.user.id,'GET',undefined,parent.token)).status,404);
  const photoRows=await (await call('/question-bank/questions?studentId='+u.user.id+'&unitId=all&wrong=1','GET',undefined,u.token)).json() as any;
  assert.equal(photoRows.total,0,'Bundled questions should not be duplicated in photographed wrong questions');
  const midterm=await (await call('/question-bank/unit-wrong','POST',{...input,questionId:'midterm-20261029-08'},u.token)).json() as any;
  assert.equal(midterm.paper.questions.length,23);assert.notEqual(midterm.question.id,q.id);
});

test('examination review keeps immutable submissions, raw handwriting and student scope without awarding imported scores',async()=>{
  const u=await register(),other=await register(),parent=await register('Parent');
  const image='data:image/png;base64,iVBORw0KGgoAAA==';
  const input={studentId:u.user.id,sourceId:'midterm-parallel-20261029',submissionId:crypto.randomUUID(),title:'检测卷',questions:[{number:'8',text:'根据题设求角度。',unitId:'math-8a-01',drawing:vector(),assessment:assessment({knowledge:[]}),answerPages:[image]}]};
  const r=await call('/question-bank/exams','POST',input,u.token);assert.equal(r.status,200);
  const saved=await r.json() as any,q=saved.questions[0];
  assert.equal(saved.mode,'exam');assert.deepEqual(saved.warnings,[]);assert.deepEqual(q.grades[0].result.answerPages,[image]);assert.equal(q.drawingReviewed,1);
  output={reply:'先核对角平分线对应的两个角。'};
  assert.equal((await call('/question-bank/questions/'+q.id+'/followup','POST',{studentId:u.user.id,gradeId:q.grades[0].id,requestId:crypto.randomUUID(),prompt:'只提示下一步'},u.token)).status,200);
  const followupContext=JSON.parse(calls.at(-1).messages[1].content[0].text);assert.deepEqual(followupContext.question.drawing,drawing.normalize(vector()));assert.equal(followupContext.answerPageCount,1);
  const again=await (await call('/question-bank/exams','POST',input,u.token)).json() as any;assert.equal(saved.id,again.id);assert.equal(again.questions[0].grades.length,1);
  assert.equal((await call('/question-bank/exams','POST',{...input,title:'覆盖旧试卷',questions:[{...input.questions[0],text:'不同题设'}]},u.token)).status,409);
  const newer=await (await call('/question-bank/exams','POST',{...input,submissionId:crypto.randomUUID()},u.token)).json() as any;assert.notEqual(newer.id,saved.id);
  const attempts=await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1',[u.user.id]);assert.equal(attempts.length,0);
  assert.equal((await call('/question-bank/exams','POST',input,other.token)).status,404);
  assert.equal((await call('/question-bank/exams','POST',input,parent.token)).status,404);
  await db.query('INSERT INTO "GrowingFamilyLinks" ("StudentId","ParentId","CreatedAt") VALUES (?1,?2,?)',[u.user.id,parent.user.id,'2026-11-03']);
  assert.equal((await call('/question-bank/exams','POST',input,parent.token)).status,200);
  const list=await (await call('/question-bank/papers?studentId='+u.user.id,'GET',undefined,u.token)).json() as any[];assert.equal(list.length,2);
});

test('blank examination registration is idempotent and rejects invalid vectors and answer sources',async()=>{
  const u=await register(),input={studentId:u.user.id,sourceId:'midterm-20261029',submissionId:'default',title:'无答案试卷',questions:[{number:'11',text:'求角度。',unitId:'math-8a-01'}]};
  const saved=await (await call('/question-bank/exams','POST',input,u.token)).json() as any;
  assert.equal(saved.questions[0].grades.length,0);assert.deepEqual(saved.pages,[]);
  const repeated=await (await call('/question-bank/exams','POST',input,u.token)).json() as any;assert.equal(saved.id,repeated.id);
  for(const q of [{...input.questions[0],drawing:{version:'arbitrary-svg'}},{...input.questions[0],answerPages:['data:image/jpeg;base64,/9j/AA==']},{...input.questions[0],assessment:assessment({score:900})}]){
    assert.equal((await call('/question-bank/exams','POST',{...input,questions:[q]},u.token)).status,400);
  }
});

test('unit wrong filter includes checked originals and retains corrected history',async()=>{
  const u=await register();
  const imported=await importPaper(u),q=imported.data.questions[0],path='/question-bank/questions/'+q.id;
  const wrong=async()=>await (await call('/question-bank/questions?'+new URLSearchParams({studentId:u.user.id,unitId:'all',wrong:'1'}),'GET',undefined,u.token)).json() as any;
  assert.ok((await wrong()).rows.some((row:any)=>row.id===q.id));
  output=assessment({verdict:'correct',score:100,corrections:[]});
  assert.equal((await call(path+'/correct','POST',{studentId:u.user.id,revision:1,requestId:crypto.randomUUID(),studentAnswer:'正确订正'},u.token)).status,200);
  assert.equal((await wrong()).rows.find((row:any)=>row.id===q.id).grades.at(-1).result.verdict,'correct');
  output=assessment({verdict:'partial'});
  assert.equal((await call(path+'/correct','POST',{studentId:u.user.id,revision:1,requestId:crypto.randomUUID(),studentAnswer:'部分订正'},u.token)).status,200);
  assert.ok((await wrong()).rows.some((row:any)=>row.id===q.id));
  // A checked original can be wrong even when no AI assessment exists.
  await db.query('DELETE FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[q.id]);
  await db.query('UPDATE "GrowingPhotoQuestions" SET "PaperWrong"=1 WHERE "Id"=?1',[q.id]);
  assert.ok((await wrong()).rows.some((row:any)=>row.id===q.id));
  const review=await (await call(path+'/review?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;
  assert.equal(review.question.paperWrong,1);
  await db.query('UPDATE "GrowingPhotoQuestions" SET "PaperWrong"=0 WHERE "Id"=?1',[q.id]);
  assert.equal((await wrong()).rows.some((row:any)=>row.id===q.id),false);
});

test('all bundled examination questions and course links can enter the shared review store',async()=>{
  const u=await register(),scope:any={window:{}};
  for(const file of ['math-exam-practice-data.js','math-exam-practice-links.js','math-midterm-20261029.js'])runInNewContext(await readFile(new URL('../../app/src/main/assets/web/app-design/'+file,import.meta.url),'utf8'),scope);
  const practice=scope.window.GrowingParallelPaper,links=scope.window.GrowingParallelLinks;
  const questions=practice.questions.map((q:any)=>({number:String(q.n),text:q.prompt+(q.options?'\n'+q.options.join('\n'):''),unitId:links[q.n].targets[0].chapter,assessment:assessment({verdict:'unanswered',score:null,studentAnswer:'',feedback:'本题未作答。\n'+q.solution,corrections:[],knowledge:links[q.n].targets.map((t:any)=>({nodeId:t.node,role:'tested',confidence:.95,reason:'本题考查'+t.title}))})}));
  for(const q of questions)assert.ok(validateAssessment(q.assessment,q.unitId,{feedback:8000,corrections:40,legacyText:true}),'第'+q.number+'题：'+JSON.stringify(q));
  let r=await call('/question-bank/exams','POST',{studentId:u.user.id,sourceId:practice.id,submissionId:crypto.randomUUID(),title:practice.title,questions},u.token);assert.equal(r.status,200,await r.text());
  r=await call('/question-bank/exams','POST',{studentId:u.user.id,sourceId:'midterm-20261029',submissionId:'default',title:'无答案试卷',questions:scope.window.GrowingMidterm.questions.map((q:any)=>({number:String(q.number),text:q.text,unitId:q.unitId||''}))},u.token);assert.equal(r.status,200,await r.text());
});

test('whole paper lifecycle persists handwriting crops, blank unreadable answers, draft confirmation and independent wrong marks',async()=>{
  const u=await register(),other=await register();output=paper();
  const region={page:1,x:.1,y:.2,width:.7,height:.12};
  output.questions[0].assessment.answerRegions=[region];
  output.questions[0].assessment.markedWrong=true;output.questions[0].answer='不得出现在净卷的答案';
  output.questions[3].assessment.markedWrong=true;
  output.questions[3].assessment.answerRegions=[{...region,page:2}];
  const input={studentId:u.user.id,requestId:crypto.randomUUID(),mode:'paper',pages};
  const response=await call('/question-bank/import','POST',input,u.token);assert.equal(response.status,200);
  const data=await response.json() as any,q=data.questions[0],missing=data.questions[3];
  assert.equal(q.answer,'');assert.deepEqual(q.grades[0].result.answerRegions,[region]);
  assert.equal(missing.grades[0].result.studentAnswer,'');assert.equal(missing.grades[0].result.feedback,'');
  assert.deepEqual(missing.grades[0].result.corrections,[]);assert.deepEqual(missing.grades[0].result.answerRegions,[]);
  assert.equal(missing.grades[0].result.markedWrong,true);
  const query='?studentId='+u.user.id,path='/question-bank/papers/'+data.paperId;
  assert.equal((await call('/question-bank/papers'+query,'GET',undefined,other.token)).status,404);
  let rows=await (await call('/question-bank/papers'+query,'GET',undefined,u.token)).json() as any[];
  assert.equal(rows.length,1);assert.equal(rows[0].mode,'paper-draft');assert.equal(rows[0].questionCount,4);assert.equal(rows[0].pages,undefined);
  const retry=await (await call('/question-bank/import','POST',input,u.token)).json() as any;assert.equal(retry.paperId,data.paperId);assert.equal(retry.duplicate,true);
  assert.equal((await call(path+'/confirm','POST',{studentId:u.user.id,title:'我的期中试卷'},other.token)).status,404);
  assert.equal((await call(path+'/confirm','POST',{studentId:u.user.id,title:'  '},u.token)).status,400);
  assert.equal((await call(path+'/confirm','POST',{studentId:u.user.id,title:'我的期中试卷'},u.token)).status,200);
  rows=await (await call('/question-bank/papers'+query,'GET',undefined,u.token)).json() as any[];assert.equal(rows[0].mode,'paper');assert.equal(rows[0].title,'我的期中试卷');
  const mark='/question-bank/questions/'+q.id+'/paper-mark',body={studentId:u.user.id,revision:1,markedWrong:false};
  assert.equal((await call(mark,'POST',body,other.token)).status,404);
  assert.equal((await call(mark,'POST',{...body,revision:99},u.token)).status,409);
  assert.equal((await call(mark,'POST',body,u.token)).status,200);
  let saved=await (await call(path+query,'GET',undefined,u.token)).json() as any;
  assert.equal(saved.questions[0].paperWrong,0);assert.deepEqual(saved.questions[0].grades,q.grades);
  assert.equal(saved.pages.length,2);assert.equal(saved.pages[0].image,pages[0]);
  assert.equal((await call('/question-bank/questions/'+q.id,'PUT',{studentId:u.user.id,number:q.number,text:'修改后的完整题干',answer:'',unitId:q.unitId,revision:1},u.token)).status,200);
  saved=await (await call(path+query,'GET',undefined,u.token)).json() as any;
  assert.equal(saved.questions[0].revision,2);assert.equal(saved.questions[0].paperWrong,null);assert.equal(saved.questions[0].grades[0].revision,1);
});

test('a linked parent imports a paper directly into the child library without exposing it to unrelated accounts',async()=>{
  const child=await register(),parent=await register('Parent'),other=await register(),otherParent=await register('Parent');
  const invite=await (await call('/student/invitations','POST',{},child.token)).json() as any;
  assert.equal((await call('/parent/children','POST',{code:invite.code},parent.token)).status,200);
  const input={studentId:child.user.id,requestId:crypto.randomUUID(),mode:'paper',pages};
  output=paper();
  assert.equal((await call('/question-bank/import','POST',input,otherParent.token)).status,404);
  const imported=await call('/question-bank/import','POST',input,parent.token);
  assert.equal(imported.status,200);
  const data=await imported.json() as any,query='?studentId='+child.user.id,path='/question-bank/papers/'+data.paperId;
  const childRows=await (await call('/question-bank/papers'+query,'GET',undefined,child.token)).json() as any[];
  const parentRows=await (await call('/question-bank/papers'+query,'GET',undefined,parent.token)).json();
  assert.deepEqual(parentRows,childRows);assert.equal(childRows.length,1);assert.equal(childRows[0].id,data.paperId);
  const opened=await call(path+query,'GET',undefined,child.token);assert.equal(opened.status,200);
  const saved=await opened.json() as any;
  assert.deepEqual(saved.pages.map((p:any)=>p.image),pages);assert.deepEqual(saved.questions,data.questions);
  assert.equal((await call(path+'/confirm','POST',{studentId:child.user.id,title:'家长拍照的试卷'},parent.token)).status,200);
  const confirmed=await (await call(path+query,'GET',undefined,child.token)).json() as any;
  assert.equal(confirmed.title,'家长拍照的试卷');assert.equal(confirmed.mode,'paper');
  for(const account of [other,otherParent]){
    assert.equal((await call('/question-bank/papers'+query,'GET',undefined,account.token)).status,404);
    assert.equal((await call(path+query,'GET',undefined,account.token)).status,404);
  }
  assert.equal((await call(path+'?studentId='+other.user.id,'GET',undefined,other.token)).status,404);
  await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "StudentId"=?1 AND "ParentId"=?2',[child.user.id,parent.user.id]);
  assert.equal((await call(path+query,'GET',undefined,parent.token)).status,404);
  assert.equal((await call(path+query,'GET',undefined,child.token)).status,200);
});

test('handwriting crops cannot refer to another question source page or exceed the image',async()=>{
  const u=await register();
  for(const region of [{page:2,x:0,y:0,width:.5,height:.5},{page:1,x:.9,y:0,width:.5,height:.5}]){
    output=paper();output.questions[0].assessment.answerRegions=[region];
    const r=await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),mode:'paper',pages},u.token);
    assert.equal(r.status,502);
  }
  const rows=await (await call('/question-bank/papers?studentId='+u.user.id,'GET',undefined,u.token)).json();assert.deepEqual(rows,[]);
});
test('SVG generation, confirmation and source replacement preserve grades and attempts',async()=>{
  const u=await register(),other=await register(),{data}=await importPaper(u),q=data.questions[1];
  const path='/question-bank/questions/'+q.id,query='?studentId='+u.user.id;
  const before=await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1',[u.user.id]);
  const input={studentId:u.user.id,figureVersion:q.figureVersion,revision:q.revision};output=vector();
  assert.equal((await call(path+'/drawing','POST',input,other.token)).status,404);
  assert.equal((await call(path+'/drawing','POST',input,u.token)).status,200);
  let attachment=await (await call(path+'/figures'+query,'GET',undefined,u.token)).json() as any;
  assert.deepEqual(attachment.drawing,drawing.normalize(vector()));assert.equal(attachment.drawingReviewed,0);assert.equal(attachment.drawingRevision,q.revision);
  const context=JSON.parse(calls.at(-1).messages[1].content[0].text);assert.equal(context.number,q.number);assert.equal(context.answer,undefined);assert.equal(context.studentAnswer,undefined);
  assert.match(calls.at(-1).messages[0].content,/手写答案和辅助线一律排除/);
  assert.match(calls.at(-1).messages[0].content,/\bJSON\b/,'JSON response-mode providers require the prompt to name JSON');
  assert.equal((await call(path+'/figures','PUT',{...input,figureVersion:attachment.figureVersion,revision:99,drawingReviewed:true},u.token)).status,409);
  assert.equal((await call(path+'/figures','PUT',{...input,figureVersion:attachment.figureVersion,drawingReviewed:true},u.token)).status,200);
  attachment=await (await call(path+'/figures'+query,'GET',undefined,u.token)).json() as any;assert.equal(attachment.drawingReviewed,1);
  assert.equal((await call(path+'/drawing','POST',input,u.token)).status,409);
  assert.equal((await call(path+'/figures','PUT',{studentId:u.user.id,figureVersion:attachment.figureVersion,image:pages[0]},u.token)).status,200);
  attachment=await (await call(path+'/figures'+query,'GET',undefined,u.token)).json() as any;assert.equal(attachment.drawing,null);assert.equal(attachment.drawingReviewed,0);
  const review=await (await call(path+'/review'+query,'GET',undefined,u.token)).json() as any;
  assert.equal(review.question.revision,q.revision);assert.deepEqual(review.question.grades,q.grades);
  assert.deepEqual(await db.query('SELECT * FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1',[u.user.id]),before);
});
test('SVG generation detects concurrent question edits and family revocation before saving',async()=>{
  const u=await register(),parent=await register('Parent'),{data}=await importPaper(u),q=data.questions[1],path='/question-bank/questions/'+q.id;
  output=vector();hook=async()=>{await db.query('UPDATE "GrowingPhotoQuestions" SET "Revision"=2 WHERE "Id"=?1',[q.id]);};
  assert.equal((await call(path+'/drawing','POST',{studentId:u.user.id,figureVersion:1,revision:1},u.token)).status,409);
  assert.equal((await db.query<any>('SELECT "FigureDrawing" AS drawing FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[q.id]))[0].drawing,'');
  const invite=await (await call('/student/invitations','POST',undefined,u.token)).json() as any;
  assert.equal((await call('/parent/children','POST',{code:invite.code},parent.token)).status,200);
  hook=async()=>{await db.query('DELETE FROM "GrowingFamilyLinks" WHERE "StudentId"=?1 AND "ParentId"=?2',[u.user.id,parent.user.id]);};
  assert.equal((await call(path+'/drawing','POST',{studentId:u.user.id,figureVersion:1,revision:2},parent.token)).status,404);
  assert.equal((await db.query<any>('SELECT "FigureDrawing" AS drawing FROM "GrowingPhotoQuestions" WHERE "Id"=?1',[q.id]))[0].drawing,'');
});
test('new photo imports automatically persist SVGs in default transcription and grading modes',async()=>{
  for(const mode of [undefined,'transcribe','grade']){
    const u=await register();output=paper();output.questions[1].drawing=vector();
    output.questions[1].figures=[{page:1,x:.2,y:.3,width:.25,height:.2}];
    const before=calls.length;
    const response=await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),...(mode?{mode}:{}),pages},u.token);assert.equal(response.status,200);
    const data=await response.json() as any,q=data.questions[1];assert.equal(q.hasDrawing,1);assert.equal(q.drawingReviewed,0);assert.equal(q.drawingRevision,q.revision);
    assert.equal(calls.length,before+1,'SVG is generated during import without a manual drawing request');
    assert.match(calls.at(-1).messages[0].content,/"drawing":null/,'both import schemas include the drawing field');
    const suffix='?studentId='+u.user.id;
    const attachment=await (await call('/question-bank/questions/'+q.id+'/figures'+suffix,'GET',undefined,u.token)).json() as any;
    assert.deepEqual(attachment.drawing,drawing.normalize(vector()));
    const source=await (await call('/question-bank/papers/'+data.paperId+suffix,'GET',undefined,u.token)).json() as any;assert.equal(source.pages.length,2);
    assert.equal(q.grades.length,mode==='grade'?1:0);
    const list=await (await call('/question-bank/questions'+suffix,'GET',undefined,u.token)).json() as any;
    assert.equal(list.rows.find((item:any)=>item.id===q.id).hasDrawing,1);
    assert.ok(!data.questions[0].uncertain.some((s:string)=>s.includes('SVG')),'text-only questions do not get spurious SVG warnings');
  }
});

test('missing or malformed SVGs stay explicitly pending while source evidence and valid grades survive',async()=>{
  for(const candidate of [undefined,null,{version:'question-svg-v1',figures:[{tag:'script'}],warnings:[]}]){
    const u=await register();output=paper();const sourceQuestion=output.questions[1];
    sourceQuestion.drawing=candidate;sourceQuestion.figures=[{page:1,x:.2,y:.3,width:.25,height:.2}];
    sourceQuestion.unitId='';sourceQuestion.uncertain=Array.from({length:10},(_,i)=>'original uncertainty '+i);
    const response=await call('/question-bank/import','POST',{studentId:u.user.id,requestId:crypto.randomUUID(),mode:'grade',pages},u.token);assert.equal(response.status,200);
    const data=await response.json() as any,q=data.questions[1];assert.equal(q.hasDrawing,0);assert.equal(q.drawingReviewed,0);
    assert.equal(q.uncertain.length,10);assert.ok(q.uncertain.some((s:string)=>s.includes('SVG')));assert.ok(q.uncertain.some((s:string)=>s.includes('单元未确定')));
    assert.equal(q.grades.length,1);assert.equal(q.grades[0].result.score,100);
    const source=await (await call('/question-bank/papers/'+data.paperId+'?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;assert.equal(source.pages.length,2);
    assert.deepEqual(q.figures,sourceQuestion.figures);
    const attachment=await (await call('/question-bank/questions/'+q.id+'/figures?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;
    assert.equal(attachment.drawing,null);
  }
});

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
test('handwritten correction excludes old answer photos and preserves each independent grade',async()=>{
  const u=await register(),other=await register(),{data}=await importPaper(u),q=data.questions[0],first=structuredClone(q.grades[0]);
  const answerPages=['data:image/png;base64,iVBORw0KGgoAAA=='],path='/question-bank/questions/'+q.id+'/correct';
  const input={studentId:u.user.id,revision:1,requestId:crypto.randomUUID(),answerPages};
  const answerAnnotations=[{page:1,x:.1,y:.2,width:.5,height:.1,kind:'correct',comment:'这一步保留了负号。'}];
  output=assessment({verdict:'correct',score:100,studentAnswer:'新手写：先通分再分配减号。',corrections:[],answerAnnotations});
  assert.equal((await call(path,'POST',input,other.token)).status,404);
  const response=await call(path,'POST',input,u.token);assert.equal(response.status,200);
  const {grade}=await response.json() as any;
  assert.deepEqual(grade.result.answerPages,answerPages);assert.equal(grade.result.studentAnswer,output.studentAnswer);
  assert.deepEqual(grade.result.answerAnnotations,answerAnnotations);
  assert.equal(grade.result.answerSource,'handwriting-only');
  const message=calls.at(-1).messages[1].content,context=JSON.parse(message[0].text);
  assert.equal(context.answerPageCount,1);assert.equal(context.studentAnswer,undefined);
  assert.deepEqual(message.filter((m:any)=>m.type==='image_url').map((m:any)=>m.image_url.url),answerPages);
  assert.equal(context.hasOriginalImages,false);assert.deepEqual(context.imageSourcePages,[]);
  assert.equal(context.question.studentAnswer,undefined);
  const before=calls.length;
  assert.equal((await (await call(path,'POST',input,u.token)).json() as any).duplicate,true);assert.equal(calls.length,before);
  assert.equal((await call(path,'POST',{...input,answerPages:['data:image/png;base64,iVBORw0KGgoAAB==']},u.token)).status,409);
  const saved=await (await call('/question-bank/questions/'+q.id+'/review?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;
  assert.deepEqual(saved.question.grades[0],first);assert.equal(saved.question.grades.length,2);
  assert.deepEqual(saved.question.grades[1].result.answerPages,answerPages);
  assert.deepEqual(saved.question.grades[1].result.answerAnnotations,answerAnnotations);
  output={reply:'根据新手写说明。'};
  assert.equal((await call('/question-bank/questions/'+q.id+'/followup','POST',{studentId:u.user.id,gradeId:grade.id,requestId:crypto.randomUUID(),prompt:'为什么'},u.token)).status,200);
  const followup=calls.at(-1).messages[1].content;
  assert.equal(JSON.parse(followup[0].text).assessment.answerPages,undefined);
  assert.equal(followup.find((m:any)=>m.type==='image_url').image_url.url,answerPages[0]);
  // A deliberate second submission is a new record, even with the same original.
  output=assessment({answerAnnotations:[{...answerAnnotations[0],kind:'incorrect',comment:'本次批改的独立说明。'}]});
  assert.equal((await call(path,'POST',{...input,requestId:crypto.randomUUID()},u.token)).status,200);
  const reopened=await (await call('/question-bank/questions/'+q.id+'/review?studentId='+u.user.id,'GET',undefined,u.token)).json() as any;
  assert.equal(reopened.question.grades.length,3);
  assert.deepEqual(reopened.question.grades[0],first);
  assert.deepEqual(reopened.question.grades[1],saved.question.grades[1]);
  assert.deepEqual(reopened.question.grades[2].result.answerPages,answerPages);
  assert.equal(reopened.question.grades[2].result.answerAnnotations[0].kind,'incorrect');
  assert.equal(reopened.question.grades[1].result.answerAnnotations[0].kind,'correct');
});

test('new handwriting uses reviewed current geometry without the original wrong answer image',async()=>{
  const u=await register(),{data}=await importPaper(u),q=data.questions[0];
  const geometry=vector();
  await db.query('UPDATE "GrowingPhotoQuestions" SET "Text"=?1,"Answer"=?2,"FigureDrawing"=?3,"DrawingReviewed"=1,"DrawingRevision"=1 WHERE "Id"=?4',
    ['OP=4，角平分线与射线的夹角为30度，求点到射线的最短距离。','2',JSON.stringify(geometry),q.id]);
  output=assessment({verdict:'correct',score:100,studentAnswer:'2',feedback:'答案正确。',corrections:[]});
  const response=await call('/question-bank/questions/'+q.id+'/correct','POST',
    {studentId:u.user.id,requestId:crypto.randomUUID(),revision:1,answerPages:['data:image/png;base64,iVBORw0KGgoAAA==']},u.token);
  assert.equal(response.status,200);
  const message=calls.at(-1).messages[1].content,context=JSON.parse(message[0].text);
  assert.deepEqual(context.question.drawing,geometry);assert.equal(context.question.referenceAnswer,'2');
  assert.equal(message.filter((m:any)=>m.type==='image_url').length,1);
  assert.equal((await response.json() as any).grade.result.studentAnswer,'2');
  await db.query('UPDATE "GrowingPhotoQuestions" SET "DrawingRevision"=0 WHERE "Id"=?1',[q.id]);
  await call('/question-bank/questions/'+q.id+'/correct','POST',
    {studentId:u.user.id,requestId:crypto.randomUUID(),revision:1,answerPages:['data:image/png;base64,iVBORw0KGgoAAA==']},u.token);
  assert.equal(JSON.parse(calls.at(-1).messages[1].content[0].text).question.drawing,null);
});

test('annotation pages and regions must belong to the submitted handwriting',async()=>{
  const u=await register(),{data}=await importPaper(u),q=data.questions[0],path='/question-bank/questions/'+q.id+'/correct';
  const mark={page:1,x:.1,y:.2,width:.5,height:.1,kind:'incorrect',comment:'漏负号'};
  for(const answerAnnotations of [[{...mark,page:2}],[{...mark,x:.8}],[{...mark,y:-.1}],[{...mark,kind:'guess'}],Array(25).fill(mark)]){
    output=assessment({answerAnnotations});
    assert.equal((await call(path,'POST',{studentId:u.user.id,revision:1,requestId:crypto.randomUUID(),answerPages:['data:image/png;base64,iVBORw0KGgoAAA==']},u.token)).status,502);
  }
  assert.equal((await db.query('SELECT * FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[q.id])).length,1);
});

test('handwritten corrections validate bounded image payloads and leave all grades intact on model failure',async()=>{
  const u=await register(),{data}=await importPaper(u),q=data.questions[0],path='/question-bank/questions/'+q.id+'/correct';
  const base={studentId:u.user.id,revision:1,requestId:crypto.randomUUID()},png='data:image/png;base64,iVBORw0KGgoAAA==';
  const before=calls.length;
  for(const answerPages of [[],[null],['https://external.test/image.png'],['data:image/jpeg;base64,/9j/AA=='],Array(5).fill(png),[png+'A'.repeat(600000)]]){
    assert.equal((await call(path,'POST',{...base,answerPages},u.token)).status,400);
  }
  assert.equal((await call(path,'POST',{...base,answerPages:[png],studentAnswer:'ambiguous'},u.token)).status,400);
  assert.equal(calls.length,before);
  // Exceeds the old 40 KB route limit, while staying inside the image budget.
  const answerPages=[png.slice(0,-2)+'A'.repeat(50000)+'=='];output={verdict:'correct',score:100};
  assert.equal((await call(path,'POST',{...base,answerPages},u.token)).status,502);
  assert.equal(calls.length,before+1);
  assert.equal((await db.query('SELECT * FROM "GrowingPhotoGrades" WHERE "QuestionId"=?1',[q.id])).length,1);
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
test('photo mistakes are automatically collected once per student and unit, retaining corrected history',async()=>{
  const u=await register(),other=await register();
  const {data}=await importPaper(u);
  const query=(unit:string,token=u.token,student=u.user.id)=>call('/question-bank/questions?'+new URLSearchParams({studentId:student,unitId:unit,wrong:'1'}),'GET',undefined,token);
  const all=await (await query('all')).json() as any;
  assert.equal(all.total,1);assert.equal(all.rows[0].number,'1');
  assert.equal((await (await query('math-8a-01')).json() as any).total,0);
  assert.equal((await query('all',other.token)).status,404);
  const q=all.rows[0];
  output=assessment({verdict:'correct',score:100,studentAnswer:'正确订正',corrections:[]});
  const corrected=await call('/question-bank/questions/'+q.id+'/correct','POST',{studentId:u.user.id,revision:q.revision,requestId:crypto.randomUUID(),studentAnswer:'正确订正'},u.token);
  assert.equal(corrected.status,200);
  const after=await (await query('math-8b-10')).json() as any;
  assert.equal(after.total,1);assert.equal(after.rows[0].id,q.id);assert.equal(after.rows[0].grades.length,2);
  await db.query('UPDATE "GrowingPhotoQuestions" SET "Revision"="Revision"+1 WHERE "Id"=?1',[q.id]);
  assert.equal((await (await query('all')).json() as any).total,0);
});
