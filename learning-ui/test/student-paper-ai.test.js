import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
async function fixture(api=async()=>({}),request=async()=> '独立解答'){
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;let active=true;
 w.GrowingCourseAI={request};w.GrowingMathFormat={html:s=>s,solutionHtml:s=>s};
 w.eval(await readFile(new URL('../../app/src/main/assets/web/app-design/student-paper-ai.js',import.meta.url),'utf8'));
 const q={id:'q1',number:11,revision:3,questionType:'written',pages:[2],text:'求解'},paper={subject:'math',pages:[{page:2,image:'original'}],questions:[q]};
 const c=w.GrowingStudentPaperAI.create({api,paper,question:q,studentId:7,active:()=>active});return {c,q,w,close(){active=false;c.destroy();w.close();}};
}
test('independent solve never calls photo review and preserves original source',async()=>{
 const calls=[],f=await fixture(async(...args)=>{calls.push(args);return {};});try{await f.c.actions.toggle('solve');assert.equal(calls.length,0);assert.equal(f.c.snapshot().solve.result,'独立解答');assert.equal(f.c.snapshot().originals[0].image,'original');}finally{f.close();}
});
test('figure context and review use exact revision and independent states',async()=>{
 const calls=[],f=await fixture(async(path,options)=>{const body=JSON.parse(options.body);calls.push(body);return body.kind==='context'?{context:'已核对条件'}:{verdict:'incorrect',feedback:'检查步骤'};});try{f.q.hasDrawing=true;await f.c.actions.toggle('solve');await f.c.actions.toggle('review');assert.deepEqual(calls.map(x=>x.kind),['context','review']);assert.ok(calls.every(x=>x.studentId===7&&x.revision===3));assert.equal(f.c.snapshot().solve.result,'独立解答');assert.equal(f.c.snapshot().review.result.verdict,'incorrect');}finally{f.close();}
});
test('cancel and disposal reject late results; choice type cannot invoke review',async()=>{
 let done;const f=await fixture(async()=>({}),()=>new Promise(r=>done=r));try{const task=f.c.actions.toggle('solve');f.c.actions.cancel('solve');done('迟到');await task;assert.equal(f.c.snapshot().solve.result,null);f.q.questionType='choice';await f.c.actions.toggle('review');assert.equal(f.c.snapshot().review.open,false);}finally{f.close();}
});
test('type save changes revision response only after successful write',async()=>{
 let fail=true;const f=await fixture(async()=>{if(fail)throw Error('保存失败');return {revision:4};});try{await f.c.actions.questionType('fill');assert.equal(f.q.questionType,'written');assert.match(f.c.snapshot().status,/保存失败/);fail=false;await f.c.actions.questionType('fill');assert.equal(f.q.questionType,'fill');assert.equal(f.q.revision,4);}finally{f.close();}
});
test('review failures never clear successful solution and timed-out solve rejects late content',async()=>{
 let deferred=false,finish,expire;const f=await fixture(async()=>{throw Error('照片服务暂不可用');},async()=>deferred?new Promise(r=>finish=r):'已完成解答');try{await f.c.actions.toggle('solve');await f.c.actions.toggle('review');assert.equal(f.c.snapshot().solve.result,'已完成解答');assert.match(f.c.snapshot().review.status,/照片服务/);deferred=true;const originalTimeout=f.w.setTimeout;f.w.setTimeout=(fn,ms)=>ms===220000?(expire=fn,123):originalTimeout(fn,ms);const task=f.c.actions.retry('solve');expire();finish('迟到解答');await task;assert.equal(f.c.snapshot().solve.result,'已完成解答');assert.match(f.c.snapshot().solve.status,/超时/);f.w.setTimeout=originalTimeout;}finally{f.close();}
});
