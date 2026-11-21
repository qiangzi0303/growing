const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const tick=()=>new Promise(r=>setImmediate(r));
async function fixture(){
 const dom=new JSDOM('<main><article></article></main>',{runScripts:'outside-only'}),w=dom.window,forces=[];
 let calls=0;
 w.GrowingCourseAI={request:async()=>{if(++calls>1)throw Error('offline');return 'successful solution';}};
 w.GrowingMathFormat={html:x=>x,solutionHtml:x=>x};w.GrowingGradedAnswer={mount(){}};
 const api=async()=>({revision:2});api.paperCache={ai:async(s,q,k,produce,options)=>{forces.push(options.force);return produce();}};
 w.eval(fs.readFileSync(require('node:path').join(__dirname,'../platform-web/paper-ai.js'),'utf8'));
 const root=w.document.querySelector('main'),q={id:'q',revision:1,number:1,pages:[],text:'question',questionType:'written'};
 const controller=w.GrowingPaperAI.mount(root,api,x=>x,()=>true,'s',{subject:'math',pages:[],questions:[q]},()=>root.querySelector('article'));
 return {w,root,forces,close(){controller.dispose();w.close();}};
}
test('successful legacy AI exposes regeneration; forced failure preserves prior result',async()=>{
 const f=await fixture();try{
  f.root.querySelector('[aria-controls="paper-solve-q"]').click();await tick();
  const panel=f.root.querySelector('#paper-solve-q'),retry=panel.querySelector('button');
  assert.equal(retry.hidden,false);assert.equal(retry.textContent,'重新生成');
  retry.click();await tick();assert.deepEqual(f.forces,[false,true]);
  assert.match(panel.textContent,/successful solution/);assert.match(panel.textContent,/offline/);
 }finally{f.close();}
});
test('editing question type clears visible legacy AI results from previous revision',async()=>{
 const f=await fixture();try{
  f.root.querySelector('[aria-controls="paper-solve-q"]').click();await tick();
  const select=f.root.querySelector('select');select.value='fill';select.dispatchEvent(new f.w.Event('change'));await tick();
  assert.equal(f.root.querySelector('#paper-solve-q').hidden,true);
  assert.doesNotMatch(f.root.querySelector('#paper-solve-q').textContent,/successful solution/);
 }finally{f.close();}
});
