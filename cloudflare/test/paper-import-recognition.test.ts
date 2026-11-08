import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planPage,transcribeQuestion} from '../src/paper-import-recognition';
const image='data:image/jpeg;base64,/9j/AA==';
const env={HANDWRITING_VISION_MODELS:JSON.stringify([{name:'test',model:'test',endpoint:'https://vision.test',apiKey:'private-test'}]),AI_LIMITER:{limit:async()=>({success:true})}};
const signal=()=>new AbortController().signal;
const source=[{page:1,image}];
const region={page:1,x:.1,y:.2,width:.6,height:.3};
const task={number:'1',pages:[1],regions:[region]};
const rawQuestion=(subject='math')=>({format:subject+'-text-v1',complete:true,warnings:[],questions:[{number:'1',text:subject==='math'?String.raw`若\(\sqrt{3x-6}\)有意义，求\(x\)的范围。`:'Read the passage.',answer:'',unitId:subject+'-8a-01',confidence:.9,reason:'题设依据',uncertain:[],pages:[1],figures:[{page:1,x:.25,y:.5,width:.25,height:.25}],drawing:null}]});
function upstream(value:any,inspect?:(body:any)=>void){return (async(_url:any,options:any)=>{inspect?.(JSON.parse(options.body));return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});}) as typeof fetch;}
test('transcription rejects incomplete output and includes the original page beside an advisory crop',async()=>{
 await assert.rejects(()=>transcribeQuestion(env,signal(),upstream({...rawQuestion(),complete:false}),'math',task,source,[]));
 await transcribeQuestion(env,signal(),upstream({...rawQuestion(),complete:true},body=>{
  assert.equal(body.messages[1].content.filter((p:any)=>p.type==='image_url').length,2);
  const context=JSON.parse(body.messages[1].content[0].text);
  assert.equal(context.sourcePages[0].originalImage,1);
  assert.equal(context.sourcePages[0].cropImage,2);
 }), 'math',task,source,[{page:1,image,region}]);
});
test('planning is a bounded page inventory, preserving continuation and actual source coordinates',async()=>{
 const value={title:'期中复习卷',complete:true,classification:{examType:'other',confidence:.95,evidence:'标题是复习卷',unitIds:[],termName:''},warnings:[],questions:[{number:'2',regions:[region]}],continuesPrevious:true,continuationRegions:[{...region,y:0,height:.15}]};
 const result=await planPage(env,signal(),upstream(value,body=>{assert.ok(body.max_tokens<=4000);assert.equal(body.messages[1].content.filter((p:any)=>p.type==='image_url').length,1);assert.ok(!JSON.stringify(body).includes('geometryModels'));}),'math',image,1,2,'1');
 assert.equal(result.questions[0].number,'2');assert.deepEqual(result.questions[0].regions,[region]);assert.equal(result.continuesPrevious,true);
 assert.notEqual(result.classification.examType,'midterm');
 assert.equal(result.classification.examType,'other');
});
test('duplicate or incomplete inventories fail instead of accepting a partial page',async()=>{
 for(const extra of [{complete:false},{questions:[{number:'1',regions:[]},{number:'1',regions:[]}]},{continuesPrevious:true}]){
  const value={title:'测试',complete:true,warnings:[],questions:[{number:'1',regions:[]}],continuesPrevious:false,continuationRegions:[],...extra};
  await assert.rejects(()=>planPage(env,signal(),upstream(value),'math',image,1,1,''));
 }
});
test('transcription sends the actual crop, excludes grading catalogs, keeps figures in original page coordinates',async()=>{
 const result=await transcribeQuestion(env,signal(),upstream(rawQuestion(),body=>{
  assert.ok(body.max_tokens<=4000);const context=JSON.parse(body.messages[1].content[0].text);assert.ok(!context.knowledgePoints);assert.ok(!context.geometryModels);assert.equal(body.messages[1].content.find((p:any)=>p.type==='image_url').image_url.url,image);
 }), 'math',task,source,[{page:1,image,region}]);
 assert.equal(result.question.number,'1');assert.equal(result.question.answer,'');assert.equal(result.question.drawing,null);assert.equal(result.question.figures[0].x,.25);assert.equal(result.question.figures[0].y,.5);assert.deepEqual(result.question.pages,[1]);
 assert.ok(!('assessment' in result.question));assert.match(result.question.text,/3x-6/);
});
test('cross-page question retains both sources and rejects wrong question identity and crop provenance',async()=>{
 const multi={...task,pages:[1,2],regions:[region,{...region,page:2}]};
 const value=rawQuestion();value.questions[0].pages=[1,2];
 const result=await transcribeQuestion(env,signal(),upstream(value),'math',multi,[...source,{page:2,image}],[]);
 assert.deepEqual(result.question.pages,[1,2]);
 const bad=rawQuestion();bad.questions[0].number='2';
 await assert.rejects(()=>transcribeQuestion(env,signal(),upstream(bad),'math',task,source,[]));
 let calls=0;
 await assert.rejects(()=>transcribeQuestion(env,signal(),upstream(value,()=>{calls++;}),'math',task,source,[{page:1,image,region:{...region,x:.5}}]));assert.equal(calls,0);
});
test('English and physics retain their formats and real figures without SVG or grade output',async()=>{
 for(const subject of ['english','physics']){
  const result=await transcribeQuestion(env,signal(),upstream(rawQuestion(subject)),subject,task,source,[]);
  assert.ok(result.question.text);assert.equal(result.question.drawing,null);assert.equal(result.question.answer,'');assert.equal(result.question.figures.length,1);
 }
});
