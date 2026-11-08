const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const source=fs.readFileSync(require('node:path').join(__dirname,'../platform-web/my-papers.js'),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,25));
async function fixture(fail=false,options={}){
 const dom=new JSDOM('<main></main>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window,requests=[];
 const region={page:1,x:0,y:0,width:.5,height:.5};let job={id:'j1',subject:'math',status:'recognizing',revision:1,pageCount:2,plannedPages:2,recognizedQuestions:0,totalQuestions:1,next:{kind:'question',number:'1',pages:[1,2],regions:[region]}};
 w.GrowingLegacy={target:async()=> 's1'};w.GrowingQuestionFigures={photo:async()=> 'image',importFragments:async(next,pages)=>next.regions.map(region=>({page:region.page,region,image:'cropped'}))};w.GrowingMathFormat={questionHtml:s=>s};w.GrowingPaperReview={mount:()=>({dispose(){}})};
 const api=async(path,request)=>{const body=request&&JSON.parse(request.body);requests.push({path,body});if(options.api){const override=await options.api(path,body,requests);if(override!==undefined)return override;}if(path==='/parent/children')return [{id:'s1',displayName:'One'},{id:'s2',displayName:'Two'}];if(path.includes('/papers/'))return {id:'p1',subject:'math',title:'试卷',mode:'paper-draft',warnings:[],questions:[],pages:[]};if(path.includes('/papers?'))return [];if(path.includes('/step')){if(fail)throw Error('模型失败');job={...job,status:'complete',paperId:'p1',next:null};return job;}if(path.includes('/import-jobs/'))return {...job,sourcePages:[{page:1,image:'original1'},{page:2,image:'original2'}]};return [job];};
 w.eval(source);const root=w.document.querySelector('main');await w.GrowingPapers.mount(root,api,String,()=>true,{role:options.parent?'Parent':'Student',id:'s1'},{subject:'math'});return {dom,w,root,requests};
}
test('saved import resumes with cropped fragments and opens only completed paper',async()=>{const {dom,root,requests}=await fixture();assert.ok(root.querySelector('[data-resume]'));root.querySelector('[data-resume]').click();await tick();assert.equal(requests.find(r=>r.path.endsWith('/step')).body.fragments[0].image,'cropped');assert.ok(root.querySelector('[data-paper-title]'));dom.window.close();});
test('failed step keeps resumable task and actionable error',async()=>{const {dom,root}=await fixture(true);root.querySelector('[data-resume]').click();await tick();assert.match(root.querySelector('[data-status]').textContent,/模型失败/);assert.ok(root.querySelector('[data-resume]'));dom.window.close();});
test('exit while step is pending saves progress without opening the completed response',async()=>{
 let finish;const {dom,root,requests}=await fixture(false,{api:(path)=>path.endsWith('/step')?new Promise(resolve=>{finish=resolve;}):undefined});root.querySelector('[data-resume]').click();await tick();root.querySelector('[data-pause-import]').click();assert.match(root.querySelector('[data-status]').textContent,/进度已保存，可继续整理/);finish({status:'complete',paperId:'p1'});await tick();assert.equal(requests.filter(r=>r.path.includes('/papers/')).length,0);assert.ok(root.querySelector('[data-resume]'));dom.window.close();
});
test('student switch ignores an old pending recognition result',async()=>{
 let finish;const {dom,w,root,requests}=await fixture(false,{parent:true,api:path=>path.endsWith('/step')?new Promise(resolve=>{finish=resolve;}):undefined});root.querySelector('[data-resume]').click();await tick();const select=root.querySelector('[data-student]');assert.equal(select.disabled,false);select.value='s2';select.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();finish({status:'complete',paperId:'p1'});await tick();assert.equal(requests.filter(r=>r.path.includes('/papers/')).length,0);assert.equal(select.value,'s2');assert.ok(requests.some(r=>r.path.includes('studentId=s2')));dom.window.close();
});
test('rate limit preserves progress and allows exit during automatic retry wait',async()=>{
 const {dom,root}=await fixture(false,{api:path=>{if(path.endsWith('/step'))throw Object.assign(Error('繁忙'),{status:429});}});root.querySelector('[data-resume]').click();await tick();assert.match(root.querySelector('[data-status]').textContent,/等待后自动继续/);assert.equal(root.querySelector('[data-pause-import]').disabled,false);root.querySelector('[data-pause-import]').click();assert.match(root.querySelector('[data-status]').textContent,/进度已保存/);dom.window.close();
});
test('upload failure retains photographs and retry request identifier',async()=>{
 const {dom,w,root,requests}=await fixture(false,{api:(path,body)=>{if(path==='/question-bank/import-jobs'&&body)throw Error('上传失败');}});root.querySelector('[data-new]').click();const input=root.querySelector('[data-album]');Object.defineProperty(input,'files',{value:[{}]});input.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();root.querySelector('[data-import]').click();await tick();assert.equal(root.querySelectorAll('[data-photos] img').length,1);assert.match(root.querySelector('[data-status]').textContent,/上传失败/);root.querySelector('[data-import]').click();await tick();const uploads=requests.filter(r=>r.path==='/question-bank/import-jobs');assert.equal(uploads.length,2);assert.equal(uploads[0].body.requestId,uploads[1].body.requestId);dom.window.close();
});
test('import crop keeps independent original-page coordinates for every source region',async()=>{
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window,draws=[];
 w.Image=class{naturalWidth=1000;naturalHeight=800;decode(){return Promise.resolve();}};
 w.HTMLCanvasElement.prototype.getContext=function(){return {drawImage(...args){draws.push(args);},translate(){},rotate(){}};};w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,crop';
 w.eval(fs.readFileSync(require('node:path').join(__dirname,'../platform-web/question-figures.js'),'utf8'));
 const regions=[{page:1,x:.1,y:.2,width:.3,height:.4},{page:2,x:.2,y:.1,width:.5,height:.2}];const result=await w.GrowingQuestionFigures.importFragments({pages:[1,2],regions},[{page:1,image:'one'},{page:2,image:'two'}]);
 assert.equal(result.length,2);assert.deepEqual(JSON.parse(JSON.stringify(result.map(r=>r.region))),regions);assert.equal(draws[0][1],100);assert.equal(draws[0][2],160);assert.equal(draws[2][1],200);assert.equal(draws[2][2],80);assert.ok(result.every(r=>r.image.length<=500000));
 await assert.rejects(w.GrowingQuestionFigures.importFragments({pages:[1],regions:[{...regions[0],page:2}]},[{page:2,image:'two'}]),/区域无效/);dom.window.close();
});
test('preview rotation changes only the prepared upload, then creates a saved job',async()=>{
 const {dom,w,root,requests}=await fixture(false,{api:(path,body)=>{if(path==='/question-bank/import-jobs'&&body)return {id:'new',subject:'math',status:'complete',paperId:'p1',pageCount:1,plannedPages:1,recognizedQuestions:0,totalQuestions:0};}});let inputSource;
 w.GrowingQuestionFigures.rotatePhoto=async image=>{inputSource=image;return 'rotated-image';};root.querySelector('[data-new]').click();const input=root.querySelector('[data-album]');const file={name:'unchanged.jpg'};Object.defineProperty(input,'files',{value:[file]});input.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();root.querySelector('[data-rotate]').click();await tick();assert.equal(inputSource,'image');assert.equal(file.name,'unchanged.jpg');assert.equal(root.querySelector('[data-photos] img').getAttribute('src'),'rotated-image');root.querySelector('[data-import]').click();await tick();assert.deepEqual(requests.find(r=>r.path==='/question-bank/import-jobs').body.pages,['rotated-image']);assert.equal(root.querySelectorAll('[data-photos] img').length,0);assert.ok(root.querySelector('[data-paper-title]'));dom.window.close();
});
test('saved task cards stay hidden while viewing a paper',async()=>{
 const {dom,w,root}=await fixture();const style=w.document.createElement('style');style.textContent=fs.readFileSync(require('node:path').join(__dirname,'../platform-web/my-papers.css'),'utf8');w.document.head.append(style);root.querySelector('[data-resume]').click();await tick();assert.equal(w.getComputedStyle(root.querySelector('.papers-import-jobs')).display,'none');dom.window.close();
});
test('rate-limited task refreshes server revision and retries automatically',async()=>{
 let steps=0;const {dom,w,root,requests}=await fixture(false,{api:path=>{if(path.endsWith('/step')&&++steps===1)throw Object.assign(Error('繁忙'),{status:429,retryAfter:1});}});const timer=w.setTimeout.bind(w);w.setTimeout=(callback,delay)=>timer(callback,delay>=1000?0:delay);root.querySelector('[data-resume]').click();await tick();await tick();assert.equal(steps,2);assert.equal(requests.filter(r=>r.path.endsWith('/step')).length,2);assert.ok(root.querySelector('[data-paper-title]'));dom.window.close();
});

test('draft review is explicit, preserves question versions, and exposes figure editing even without detected figures',async()=>{
 let reviewed=false;const question={id:'q1',number:'1',text:'题面',answer:'',unitId:'',revision:3,figureVersion:2,figures:[],uncertain:[]};
 const {dom,root,requests}=await fixture(false,{api:(path,body)=>{
  if(path==='/question-bank/questions/q1'&&body){assert.equal(body.reviewed,true);assert.equal(body.revision,3);assert.equal(body.figureVersion,2);assert.equal(body.text,undefined);reviewed=true;return {saved:true};}
  if(path.includes('/papers/'))return {id:'p1',subject:'math',title:'试卷',mode:'paper-draft',warnings:[],units:[],pages:[],questions:[{...question,reviewed}]};
 }});
 root.querySelector('[data-resume]').click();await tick();
 assert.ok(root.querySelector('[data-edit-figure="q1"]'));
 assert.equal(root.querySelector('[data-confirm]').disabled,true);
 root.querySelector('[data-review="q1"]').click();await tick();
 assert.ok(requests.some(r=>r.body?.reviewed));assert.equal(root.querySelector('[data-confirm]').disabled,false);
 dom.window.close();
});
