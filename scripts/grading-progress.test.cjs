const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const source=fs.readFileSync(path.join(__dirname,'../platform-web/grading-progress.js'),'utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
function fixture(){
 const dom=new JSDOM('<main></main>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.GrowingQuestionFigures={importStage:()=> '处理题目',prepareImportStep(){throw Error('client preparation forbidden');}};w.eval(source);return {dom,w};
}
test('background grading failure displays server error and only explicit retry advances it',async()=>{
 const {dom,w}=fixture(),calls=[];let retried=false;
 const job={id:'j1',processor:'photo-agent-v1',status:'failed',revision:4,error:'图形无法确认'};
 const result=w.GrowingGradingProgress.run({studentId:'s1',job,alive:()=>true,api:async(p,o)=>{calls.push({p,o});if(p.endsWith('/retry')){retried=true;return {...job,status:'grading',revision:5};}assert.match(p,/\/progress\?/);return retried?{...job,status:'complete',revision:6,paperId:'p1'}:job;}});
 await tick();assert.match(w.document.querySelector('[data-error]').textContent,/图形无法确认/);assert.equal(calls.some(c=>c.p.endsWith('/retry')),false);
 w.document.querySelector('[data-retry]').click();await tick();assert.deepEqual(JSON.parse(calls.find(c=>c.p.endsWith('/retry')).o.body),{studentId:'s1',revision:4});
 w.document.querySelector('[data-close]').click();assert.equal((await result).paperId,'p1');dom.window.close();
});
test('closing background grading ignores an in-flight completion and sends no cancellation',async()=>{
 const {dom,w}=fixture(),calls=[];let release;const job={id:'j1',processor:'photo-agent-v1',status:'grading',revision:1};
 const result=w.GrowingGradingProgress.run({studentId:'s1',job,alive:()=>true,api:async(p,o)=>{calls.push({p,o});return new Promise(r=>release=r);}});
 await tick();w.document.querySelector('[data-close]').click();assert.equal(await result,null);release({...job,status:'complete',revision:2});await tick();assert.equal(calls.length,1);assert.match(calls[0].p,/\/progress\?/);assert.equal(calls[0].o,undefined);assert.equal(w.document.querySelector('dialog'),null);dom.window.close();
});
