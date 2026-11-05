const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/web/app-design/handwriting-ai.js'),'utf8');
test('original review uses the visual endpoint with cookie or native auth, cancellation and validated image feedback',async()=>{
  for(const native of [false,true]){
    const window=native?{GrowingNative:{cloudApiUrl:()=> 'https://cloud.test'}}:{};
    let reply={source:'original-paper',needsReview:false,verdict:'partial',feedback:'第（1）问正确。',corrections:[{location:'第（2）问',original:'原稿中的等式',issue:'漏了条件',correction:'补全已知条件'}],answerAnnotations:[{page:1,x:.1,y:.2,width:.5,height:.1,kind:'incorrect',comment:'漏了条件'}]};
    const calls=[],fetch=async(url,options)=>{calls.push({url,options});return Response.json(reply);};
    vm.runInNewContext(source,{window,fetch,localStorage:{getItem:key=>key==='growing-cloud-session-v1'?JSON.stringify({token:'test-session',user:{id:'test-user',role:'Admin'}}):null}});
    const controller=new AbortController(),input={questionNumber:'22',prompt:'题设',pages:['test-image']};
    const result=await window.GrowingHandwritingAI.reviewOriginal(input,controller.signal);
    assert.equal(result.corrections[0].original,'原稿中的等式');
    assert.equal(result.solution,undefined);
    assert.equal(result.answerAnnotations[0].kind,'incorrect');
    const call=calls[0];assert.equal(call.url,native?'https://cloud.test/api/handwriting/ai':'/api/handwriting/ai');
    assert.equal(call.options.credentials,native?'omit':'same-origin');assert.equal(call.options.signal,controller.signal);
    assert.equal(call.options.headers['X-Growing-Client'],'1');
    if(native)assert.equal(call.options.headers.Authorization,'Bearer test-session');
    assert.deepEqual(JSON.parse(call.options.body),{...input,kind:'review-original'});
    for(const patch of [{source:'handwriting'},{verdict:'invented'},{needsReview:true},{answerAnnotations:[{...reply.answerAnnotations[0],page:2}]},{answerAnnotations:[{...reply.answerAnnotations[0],x:.9}]},{corrections:[{issue:'没有原句'}]}]){
      const original=reply;reply={...original,...patch};await assert.rejects(()=>window.GrowingHandwritingAI.reviewOriginal(input),/不完整/);reply=original;
    }
  }
});
