import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assess,type VisionEnv} from '../src/handwriting-vision';
const env={HANDWRITING_VISION_MODELS:JSON.stringify([{name:'fixture',model:'vision',endpoint:'https://vision.test/v1',apiKey:'test-only'}]),AI_LIMITER:{limit:async()=>({success:true})}} as VisionEnv;
const data={kind:'grade',subject:'math',unitId:'math-8b-10',prompt:'计算分式',nodeIds:['add'],pages:['data:image/png;base64,iVBORw0KGgoAAA==']};
const review={needsReview:true,score:null,parts:null,feedback:'图片模糊，请重拍。',corrections:[]};
const grade={needsReview:false,score:100,parts:[20,30,30,20],feedback:'正确',corrections:[],knowledge:[{nodeId:'add',score:100,feedback:'通分正确'}]};
const upstream=(content:string)=>(async()=>Response.json({choices:[{finish_reason:'stop',message:{content}}]})) as typeof fetch;
test('a readable unrelated answer is accepted as a scored incorrect submission',async()=>{
 const wrong={...grade,score:0,parts:[0,0,0,0],feedback:'所写为另一道题的解答，未回答本题。',knowledge:[{nodeId:'add',score:0,feedback:'本次作答未体现本题要求的分式加法。'}]};
 const response=await assess(data,env,'test',new AbortController().signal,upstream(JSON.stringify(wrong)));
 const result=await response.json() as any;
 assert.equal(result.needsReview,false);assert.equal(result.score,0);assert.deepEqual(result.parts,[0,0,0,0]);assert.equal(result.source,'handwriting');
});
test('unscored reviews tolerate an empty optional knowledge list, never fabricate a score',async()=>{
 for(const knowledge of [[],null]){
  const res=await assess(data,env,'test',new AbortController().signal,upstream(JSON.stringify({...review,knowledge})));
  const body=await res.json() as any;assert.equal(body.needsReview,true);assert.equal(body.score,null);assert.equal('knowledge' in body,false);
 }
});
test('grading accepts safely repaired LaTeX delimiters without changing mathematics',async()=>{
 const content=JSON.stringify({...grade,feedback:'结果为 FORMULA'}).replace('FORMULA',String.raw`\(x+1\)`);
 const res=await assess(data,env,'test',new AbortController().signal,upstream(content));
 assert.equal((await res.json() as any).feedback,String.raw`结果为 \(x+1\)`);
});
test('HTTP, truncated output and invalid grades have distinct safe failures',async()=>{
 await assert.rejects(assess(data,env,'test',new AbortController().signal,(async()=>new Response('secret provider payload',{status:401})) as typeof fetch),/HTTP 401/);
 await assert.rejects(assess(data,env,'test',new AbortController().signal,upstream(JSON.stringify({...grade,score:99}))),/评分格式无效/);
 await assert.rejects(assess(data,env,'test',new AbortController().signal,(async()=>Response.json({choices:[{finish_reason:'length',message:{content:'partial'}}]})) as typeof fetch),/被截断/);
 await assert.rejects(assess(data,env,'test',new AbortController().signal,upstream(JSON.stringify({...review,knowledge:grade.knowledge}))),/评分格式无效/);
});
