import {test} from 'node:test';
import assert from 'node:assert/strict';
import {locateQuestionRegions,recognizeQuestionText,reviewQuestion,redrawQuestion,verifyQuestionDrawing,assessReviewedQuestion} from '../src/paper-visual-workflow';
const image='data:image/jpeg;base64,/9j/AA==';
const model=(name:string)=>JSON.stringify([{name,model:name,endpoint:'https://'+name+'.test',apiKey:'test-only'}]);
const env={HANDWRITING_VISION_MODELS:model('grade'),PAPER_RECOGNITION_MODELS:model('ocr'),PAPER_FIGURE_MODELS:model('visual'),AI_LIMITER:{limit:async()=>({success:true})}};
const signal=()=>new AbortController().signal;
const region={page:2,x:.1,y:.2,width:.5,height:.4};
const task={number:'11（右栏）',pages:[2],regions:[region]};
const pages=[{page:2,image}];
const fragments=[{page:2,image,region}];
const question={number:task.number,text:String.raw`若\(\frac{1}{a}-\frac{1}{b}=2\)，求\(\frac{ab}{a-b}\)。`,answer:'',questionType:'fill',unitId:'',confidence:0,reason:'原图',uncertain:[],pages:[2],figures:[],drawing:null};
const checks={stem:true,options:true,subquestions:true,formula:true,figures:true};
const vector={version:'question-svg-v1',warnings:[],figures:[{width:200,height:160,title:'原题图',elements:[{tag:'line',x1:30,y1:120,x2:100,y2:30},{tag:'text',x:100,y:20,text:'A'}]}]};
const response=(value:any)=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
function provider(value:any,inspect?:(body:any,url:string)=>void):typeof fetch{return (async(url:any,options:any)=>{inspect?.(JSON.parse(options.body),String(url));return response(value);}) as typeof fetch;}

test('localization uses visual models and actual original-page coordinates, including second-page repeated numbers',async()=>{
 const result=await locateQuestionRegions(env,signal(),provider({number:task.number,complete:true,regions:[region],warnings:[]},(body,url)=>{
  assert.match(url,/visual.test/);assert.equal(JSON.parse(body.messages[1].content[0].text).number,task.number);
  assert.match(body.messages[1].content[1].text,/实际来源第2页/);
 }),'math',{...task,regions:[]},pages);
 assert.equal(result.regions[0].page,2);
 await assert.rejects(locateQuestionRegions(env,signal(),provider({number:task.number,complete:true,regions:[{...region,page:1}],warnings:[]}),'math',task,pages));
});

test('OCR stage only calls OCR once and does not require figure localization',async()=>{
 let calls=0;
 const result=await recognizeQuestionText(env,signal(),provider({format:'math-text-v1',complete:true,warnings:[],questions:[question]},(_body,url)=>{calls++;assert.match(url,/ocr.test/);}),'math',task,pages,fragments);
 assert.equal(calls,1);assert.equal(result.question.number,task.number);
});

test('blind review reads originals plus advisory crops without an OCR draft or answer and fixes formula semantics',async()=>{
 const result=await reviewQuestion(env,signal(),provider({number:task.number,complete:true,hasFigures:false,checks,warnings:[],question},(body,url)=>{
  assert.match(url,/visual.test/);const context=JSON.parse(body.messages[1].content[0].text);
  assert.ok(!('draft' in context));assert.ok(!('questionText' in context));assert.ok(!('answer' in context));
  const labels=body.messages[1].content.filter((p:any)=>p.type==='text').slice(1).map((p:any)=>p.text);
  assert.match(labels[0],/实际来源第2页.*完整原页/);assert.match(labels[1],/实际来源第2页.*裁剪/);
  assert.ok(!labels.includes('第2页'));assert.notEqual(body.thinking?.type,'disabled');
 }),'math',task,pages,fragments);
 assert.match(result.question.text,/a-b/);assert.equal(result.question.answer,'');assert.equal(result.hasFigures,false);
 for(const extra of [{complete:false},{checks:{...checks,options:false}},{hasFigures:true}]){
  await assert.rejects(reviewQuestion(env,signal(),provider({number:task.number,complete:true,hasFigures:false,checks,warnings:[],question,...extra}),'math',task,pages,fragments));
 }
 await assert.rejects(reviewQuestion(env,signal(),provider({number:task.number,complete:true,hasFigures:false,checks,warnings:['题设提及如图但未找到'],question:{...question,text:'如图，求面积。'}}),'math',task,pages,fragments));
});

test('crop canonicalization accepts a returned region without trusting unrelated coordinates',async()=>{
 const canonical={...region,width:.1+.2};const cropped={page:2,image,region:canonical};
 await reviewQuestion(env,signal(),provider({number:task.number,complete:true,hasFigures:false,checks,warnings:[],question}),'math',{...task,regions:[canonical]},pages,[cropped]);
 let calls=0;
 await assert.rejects(reviewQuestion(env,signal(),provider({},()=>{calls++;}),'math',task,pages,[{page:2,image,region:{...region,x:.6}}]));assert.equal(calls,0);
});

test('single-source review recovers omitted figure page and adjacent fill-in equals without weakening validation',async()=>{
 const {page:_page,...box}=region;
 const value={number:task.number,complete:true,hasFigures:true,checks,warnings:[],question:{...question,text:String.raw`求\(\frac{a}{b}\) = ______。`,figures:[box]}};
 const result=await reviewQuestion(env,signal(),provider(value),'math',task,pages,fragments);
 assert.equal(result.question.figures[0].page,2);assert.match(result.question.text,/b\}=\\\)/);
 for(const q of [{...value.question,figures:[{...box,page:1}]},{...value.question,text:String.raw`求\(a\) = b。`}]){
  await assert.rejects(reviewQuestion(env,signal(),provider({...value,question:q}),'math',task,pages,fragments));
 }
 await assert.rejects(reviewQuestion(env,signal(),provider({...value,question:{...value.question,pages:[1,2]}}),'math',{...task,pages:[1,2]},[{page:1,image},...pages],[]));
});

test('cross-page review canonicalizes source order and clamps model boundary tolerances before browser cropping',async()=>{
 const other={...region,page:1},multi={...task,pages:[1,2],regions:[other,region]};
 const q={...question,pages:[2,1]};
 const result=await reviewQuestion(env,signal(),provider({number:task.number,complete:true,hasFigures:false,checks,warnings:[],question:q}),'math',multi,[{page:1,image},...pages],[]);
 assert.deepEqual(result.question.pages,[1,2]);
 const located=await locateQuestionRegions(env,signal(),provider({number:task.number,complete:true,regions:[{...region,x:.5,width:.500005}],warnings:[]}),'math',task,pages);
 assert.equal(located.regions[0].x+located.regions[0].width,1);
});

test('redrawing uses the shared restricted vector validator and rejects embedded scripts',async()=>{
 const q={...question,figures:[region]};
 const result=await redrawQuestion(env,signal(),provider({number:task.number,complete:true,drawing:vector,warnings:[]}),'math',task,pages,fragments,q,[]);
 assert.equal(result.drawing.figures[0].elements[1].text,'A');
 await assert.rejects(redrawQuestion(env,signal(),provider({number:task.number,complete:true,drawing:{...vector,onclick:'alert(1)'},warnings:[]}),'math',task,pages,fragments,q,[]));
});

test('rendered figure review requires original evidence, every rendered image, and explicit visual checks',async()=>{
 const review={number:task.number,complete:true,matches:false,checks:{labels:true,relations:false,clean:true,layout:true},issues:['E应位于D下方']};
 const result=await verifyQuestionDrawing(env,signal(),provider(review,(body)=>{
  assert.equal(body.messages[1].content.filter((p:any)=>p.type==='image_url').length,3);
  assert.match(body.messages[1].content.filter((p:any)=>p.type==='text').at(-1).text,/重绘预览/);
 }),'math',task,pages,question,vector as any,[image],fragments);
 assert.equal(result.matches,false);assert.match(result.issues[0],/E/);
 const partial=await verifyQuestionDrawing(env,signal(),provider({...review,complete:false}),'math',task,pages,question,vector as any,[image]);
 assert.equal(partial.matches,false);assert.deepEqual(partial.issues,review.issues);
 await assert.rejects(verifyQuestionDrawing(env,signal(),provider({...review,complete:false,matches:true,checks:{labels:true,relations:true,clean:true,layout:true},issues:[]}),'math',task,pages,question,vector as any,[image]));
 await assert.rejects(verifyQuestionDrawing(env,signal(),provider({...review,matches:true}),'math',task,pages,question,vector as any,[image]));
 await assert.rejects(verifyQuestionDrawing(env,signal(),provider({...review,matches:true,checks:{labels:true,relations:true,clean:true,layout:true},issues:[]}),'math',task,pages,question,vector as any,[]));
});

test('assessment uses verified question context and actual handwriting, never an OCR solution',async()=>{
 const result=await assessReviewedQuestion(env,signal(),provider({verdict:'incorrect',score:0,studentAnswer:'1/2',feedback:'符号有误',corrections:[],knowledge:[],models:[]},(body,url)=>{
  assert.match(url,/visual.test/);assert.notEqual(body.thinking?.type,'disabled');const context=JSON.parse(body.messages[1].content[0].text);
  assert.equal(context.questionText,question.text);assert.ok(!context.answer);assert.ok(context.knowledgePoints);
  assert.equal(body.messages[1].content.filter((p:any)=>p.type==='image_url').length,2);
 }),'math',task,pages,fragments,question);
 assert.equal(result.studentAnswer,'1/2');assert.equal(result.verdict,'incorrect');
});

test('reviewed answer formula escaping is recovered without correcting the student arithmetic',async()=>{
 const actual=String.raw`\(\frac{2x-2y}{x-y}=2(x-y)\)`,encoded=actual.replace(/\\/g,'\\\\');
 for(const text of [actual,encoded]){
  const result=await assessReviewedQuestion(env,signal(),provider({verdict:'incorrect',score:0,studentAnswer:text,feedback:'运算错误',corrections:[],knowledge:[],models:[]}),'math',task,pages,fragments,question);
  assert.equal(result.studentAnswer,actual);
 }
});
