import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assess,visionCompletion} from '../src/handwriting-vision';
import {planPage,transcribeQuestion} from '../src/paper-import-recognition';

const config=(name:string)=>JSON.stringify([{name,model:name,endpoint:`https://${name}.test/v1`,apiKey:`${name}-private-test`}]);
const env={HANDWRITING_VISION_MODELS:config('deepseek'),PAPER_RECOGNITION_MODELS:config('qwen'),AI_LIMITER:{limit:async()=>({success:true})}};
const signal=()=>new AbortController().signal;
const image='data:image/jpeg;base64,/9j/AA==';
function upstream(model:string,result:object){
 return (async(url,options)=>{
  assert.equal(url,`https://${model}.test/v1/chat/completions`);
  assert.equal(new Headers(options?.headers).get('Authorization'),`Bearer ${model}-private-test`);
  assert.equal(JSON.parse(String(options?.body)).model,model);
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]});
 }) as typeof fetch;
}

test('page planning and individual transcription use the dedicated OCR configuration',async()=>{
 const planned=await planPage(env,signal(),upstream('qwen',{title:'复习卷',complete:true,warnings:[],questions:[{number:'1',regions:[]}],continuesPrevious:false,continuationRegions:[]}),'math',image,1,1,'');
 assert.equal(planned.questions[0].number,'1');
 const result=await transcribeQuestion(env,signal(),upstream('qwen',{format:'math-text-v1',complete:true,warnings:[],questions:[{number:'1',text:String.raw`计算\(1+1\)。`,answer:'',unitId:'',confidence:0,reason:'',uncertain:[],pages:[1],figures:[],drawing:null}]}),'math',{number:'1',pages:[1],regions:[]},[{page:1,image}]);
 assert.equal(result.question.number,'1');
 assert.equal(result.question.answer,'');
});

test('original-paper grading stays on DeepSeek when Qwen OCR is configured',async()=>{
 const response=await assess({kind:'review-original',questionNumber:'1',prompt:'计算1+1',pages:['data:image/png;base64,iVBORw0KGgoAAA==']},env,'student',signal(),upstream('deepseek',{needsReview:false,verdict:'correct',feedback:'正确',corrections:[],answerAnnotations:[]}));
 assert.equal((await response.json() as any).verdict,'correct');
});

test('OCR inventories preserve duplicate printed numbers with location labels and never use estimated boxes',async()=>{
 const result=await planPage(env,signal(),upstream('qwen',{title:'复习卷',complete:true,warnings:[],questions:[{number:'11（左栏）',regions:[{page:1,x:0,y:2,width:1,height:1}]},{number:'11（右栏）',regions:[]}],continuesPrevious:false,continuationRegions:[]}),'math',image,1,1,'');
 assert.deepEqual(result.questions.map(q=>q.number),['11（左栏）','11（右栏）']);
 assert.ok(result.questions.every(q=>q.regions.length===0));
 assert.ok(result.warnings.length>0);
 const continued=await planPage(env,signal(),upstream('qwen',{title:'',complete:true,warnings:[],questions:[],continuesPrevious:true,continuationRegions:[]}),'math',image,2,2,'11（右栏）');
 assert.equal(continued.continuesPrevious,true);
 assert.deepEqual(continued.continuationRegions,[]);
});

test('other vision operations and grading cannot be redirected to the OCR model',async()=>{
 for(const [paper,grading,options] of [[true,false,{}],[false,false,{}],[true,true,{paperRecognition:true}]] as const){
  const response=await visionCompletion(env,signal(),upstream('deepseek',{ok:true}),'system',{},[],v=>v?.ok?{ok:true}:null,paper,grading,options);
  assert.deepEqual(await response.json(),{ok:true});
 }
});

test('an invalid OCR configuration fails closed without sending photos to the grading provider',async()=>{
 for(const config of ['','[]','invalid']){
  let calls=0;
  await assert.rejects(()=>visionCompletion({...env,PAPER_RECOGNITION_MODELS:config},signal(),(async()=>{calls++;throw Error('must not call');}) as typeof fetch,'system',{},[],v=>v,true,false,{paperRecognition:true}),{status:503});
  assert.equal(calls,0);
 }
});

test('deployments without the new binding retain their previous configuration',async()=>{
 const response=await visionCompletion({...env,PAPER_RECOGNITION_MODELS:undefined},signal(),upstream('deepseek',{ok:true}),'system',{},[],v=>v,true,false,{paperRecognition:true});
 assert.deepEqual(await response.json(),{ok:true});
});
