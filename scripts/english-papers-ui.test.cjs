const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,'../platform-web',name),'utf8');
const ctx={window:{},URLSearchParams};
vm.runInNewContext(source('legacy-navigation.js'),ctx);
test('English paper context survives legacy links and registration',()=>{
 const nav=ctx.window.GrowingLegacy;
 const url=new URL(nav.link('my-papers','/console/home','student1',undefined,'english'),'https://test.invalid');
 assert.equal(url.searchParams.get('subject'),'english');
 const context=nav.parse(url.search,'#register');
 assert.equal(context.subject,'english');
 assert.match(nav.destination({role:'Parent',roleSelectionRequired:false},false,context),/subject=english/);
});
test('unknown and duplicate paper subjects are rejected',()=>{
 const nav=ctx.window.GrowingLegacy;
 assert.ok(nav.parse('?legacy=1&action=my-papers&subject=chemistry','').error);
 assert.ok(nav.parse('?legacy=1&action=my-papers&subject=math&subject=english','').error);
});
const {JSDOM}=require('../console-web/node_modules/jsdom');
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
async function mount(subject,paperId,questions,questionId){
 const dom=new JSDOM('<body><main></main></body>',{url:'https://test.invalid/',runScripts:'outside-only'}),w=dom.window,requests=[];
 w.GrowingLegacy={target:async()=> 'student1'};
 w.GrowingQuestionFigures={photo:async()=> 'test-photo'};
 w.GrowingMathFormat={html:s=>s,questionHtml:s=>s};
 let onSaved;
 w.GrowingPaperReview={mount:(...args)=>{onSaved=args[7];return {dispose(){},close(){}};}};
 w.eval(source('my-papers.js'));
 const root=w.document.querySelector('main');
 const api=async(path,opts)=>{requests.push({path,body:opts&&JSON.parse(opts.body)});if(path==='/question-bank/import-jobs'&&opts)return {id:'j1',subject,status:'complete',paperId:'paper1',pageCount:1,plannedPages:1,recognizedQuestions:1,totalQuestions:1};if(path.includes('/papers/'))return {id:'paper1',subject:'english',title:'English',mode:'paper',warnings:[],questions:questions||[{id:'q1',number:'1',text:'Read  this\nA. One',figures:[],uncertain:[]}],pages:[]};return [];};
 await w.GrowingPapers.mount(root,api,s=>String(s),()=>true,{role:'Student',id:'student1'},{...(subject?{subject}:{}),...(paperId?{paperId}:{}),...(questionId?{questionId}:{})});
 return {dom,w,root,requests,refreshPaper:saved=>onSaved(saved)};
}

test('graph question entry focuses the matching stable question ID within the paper',async()=>{
 const questions=['q1','q2'].map(id=>({id,number:'11',text:'Question',figures:[],uncertain:[]}));
 const {dom,w,root}=await mount('math','paper1',questions,'q2');
 assert.equal(w.document.activeElement,root.querySelector('[data-q="q2"]'));
 assert.equal(root.querySelector('[data-only-wrong]').checked,false);dom.window.close();
});

test('only-wrong filter includes partial grades and manual marks, excludes correct and stale results, and preserves cards',async()=>{
 const grade=(verdict,revision=1)=>({revision,result:{verdict}});
 const questions=[
  {id:'partial',paperWrong:false,grades:[grade('partial')]},
  {id:'incorrect',grades:[grade('incorrect')]},
  {id:'correct',paperWrong:true,grades:[grade('incorrect'),grade('correct')]},
  {id:'stale',grades:[grade('incorrect',0)]},
  {id:'manual',paperWrong:true},
  {id:'blank',grades:[grade('unanswered')]},
  {id:'review',grades:[grade('review')]}
 ].map((q,i)=>({number:String(i+1),revision:1,text:'Question',figures:[],uncertain:[],...q}));
 const {dom,w,root,requests}=await mount('english','paper1',questions);
 const filter=root.querySelector('[data-only-wrong]'),card=root.querySelector('[data-q="partial"]'),before=requests.length;
 assert.equal(filter.checked,false);
 assert.equal(root.querySelectorAll('.paper-question:not([hidden])').length,7);
 filter.checked=true;filter.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.deepEqual([...root.querySelectorAll('.paper-question:not([hidden])')].map(q=>q.dataset.q),['partial','incorrect','manual']);
 assert.equal(root.querySelector('[data-wrong-empty]').hidden,true);
 filter.checked=false;filter.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(root.querySelectorAll('.paper-question:not([hidden])').length,7);
 assert.equal(root.querySelector('[data-q="partial"]'),card);
 assert.equal(requests.length,before);
 dom.window.close();
});

test('active filter refreshes after grading, shows an empty state and survives reopening the paper',async()=>{
 const questions=[{id:'q1',number:'1',revision:1,text:'Question',figures:[],uncertain:[],grades:[{revision:1,result:{verdict:'partial'}}]}];
 const {dom,w,root,refreshPaper}=await mount('english','paper1',questions);
 const filter=root.querySelector('[data-only-wrong]');filter.checked=true;filter.dispatchEvent(new w.Event('change',{bubbles:true}));
 questions[0].grades.push({revision:1,result:{verdict:'correct'}});
 refreshPaper({id:'paper1',questions});
 assert.equal(root.querySelector('[data-q="q1"]').hidden,true);
 assert.equal(root.querySelector('[data-wrong-empty]').hidden,false);
 root.querySelector('[data-confirm]').click();await tick();
 assert.equal(root.querySelector('[data-only-wrong]').checked,true);
 assert.equal(root.querySelector('[data-wrong-empty]').hidden,false);
 dom.window.close();
});
test('English mount filters the real list request and imports with English subject',async()=>{
 const {dom,w,root,requests}=await mount('english');
 assert.match(requests[0].path,/subject=english/);
 assert.equal(root.querySelector('.papers-heading .muted').textContent,'英语 · 我的试卷');
 root.querySelector('[data-new]').click();
 const input=root.querySelector('[data-album]');Object.defineProperty(input,'files',{value:[{}]});input.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();
 root.querySelector('[data-import]').click();await tick();
 assert.equal(requests.find(r=>r.path==='/question-bank/import-jobs').body.subject,'english');dom.window.close();
});
test('missing English source preserves other questions and refuses incomplete printing',async()=>{
 const questions=[{id:'q1',number:'1',text:'Look at the picture',figures:[{page:1,x:0,y:0,width:1,height:1}],uncertain:[]},{id:'q2',number:'2',text:'Read this',figures:[],uncertain:[]}];
 const {dom,root}=await mount('english','paper1',questions);
 assert.equal(root.querySelectorAll('.paper-question').length,2);
 root.querySelector('[data-print]').click();await tick();
 assert.match(root.querySelector('[data-status]').textContent,/题图.*(?:缺失|未完成)/);
 assert.equal(dom.window.document.querySelector('.papers-print-frame'),null);dom.window.close();
});
test('shared management selector filters subjects without changing layout',async()=>{
 const {dom,w,root,requests}=await mount();
 const select=root.querySelector('[data-subject]');assert.ok(select);
 select.value='math';select.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();
 assert.match(requests.at(-1).path,/subject=math/);
 assert.ok(root.querySelector('.papers-heading'));dom.window.close();
});
test('paper deep link uses actual subject and preserves English passage whitespace',async()=>{
 const {dom,root}=await mount('math','paper1');
 assert.equal(root.querySelector('.papers-heading .muted').textContent,'英语 · 我的试卷');
 assert.equal(root.querySelector('.math-prose').style.whiteSpace,'pre-wrap');
 assert.match(root.querySelector('.math-prose').textContent,/Read  this/);
 assert.ok(root.querySelector('.math-prose br'));dom.window.close();
});
async function reviewFixture(failedFigure=false){
 const dom=new JSDOM('<body><main><section data-workbench></section></main></body>',{url:'https://test.invalid/',runScripts:'outside-only'}),w=dom.window,requests=[];
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 w.GrowingMathFormat={html:s=>'MATH('+s+')',questionHtml:s=>'QUESTION('+s+')'};
 w.GrowingGradedAnswer={mount:(host,g,q,p,e,render)=>{host.innerHTML=render(g.result.studentAnswer);}};
 w.GrowingCorrectionPad={mount:()=>({lock(){},dispose(){},images:()=>['new-answer-only']})};
 w.GrowingQuestionFigures={englishFigureImage:async()=> {if(failedFigure)throw Error('题图来源页缺失');return 'independent-figure';}};
 const grade={id:'g1',revision:1,kind:'initial',result:{verdict:'incorrect',studentAnswer:'$3 ____\nanswer',knowledge:[],models:[]}};
 const q={id:'q1',paperId:'p1',subject:'english',number:'1',revision:1,figureVersion:1,text:'$3 ____\nRead  here',pages:[1],figures:[{page:1,x:0,y:0,width:.5,height:.5}],grades:[grade],uncertain:[]};
 const paper={id:'p1',subject:'english',title:'English',questions:[q],pages:[]};
 const api=async(path,opts)=>{requests.push({path,body:opts&&JSON.parse(opts.body)});if(path.endsWith('/figures'))return {figureVersion:2,figures:q.figures};if(path.includes('/correct'))return {grade:{...grade,id:'g2',kind:'correction'}};if(path.includes('/review'))return {question:q,followups:[{gradeId:'g1',prompt:'why',reply:'$3 ____\nreply'}]};return paper;};
 w.eval(source('photo-review.js'));const root=w.document.querySelector('main'),review=w.GrowingPhotoReview.create(root,api,esc,()=>true,'student1',async()=>{},{mount(){},dispose(){}});
 await review.open(q);return {dom,w,root,review,requests,q};
}
test('English review leaves dollar signs and blanks literal in question, history and replies',async()=>{
 const {dom,root}=await reviewFixture();
 assert.doesNotMatch(root.textContent,/MATH\(|QUESTION\(/);
 assert.match(root.querySelector('[data-graded-answer]').textContent,/\$3 ____/);
 assert.ok(root.querySelector('[data-followup-history] br'));dom.window.close();
});
test('English correction persists a separate figure before grading and sends only new answer',async()=>{
 const {dom,w,root,requests,q}=await reviewFixture();
 root.querySelector('[data-correction]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
 const put=requests.findIndex(r=>r.path.endsWith('/figures')),correct=requests.findIndex(r=>r.path.endsWith('/correct'));
 assert.ok(put>=0&&correct>put);
 assert.equal(requests[put].body.image,'independent-figure');
 assert.deepEqual(requests[correct].body.answerPages,['new-answer-only']);
 assert.equal(q.hasFigureImage,true);assert.equal(q.figureVersion,2);dom.window.close();
});
test('English illustration helper crops only specified figure regions into one bounded image',async()=>{
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window,draws=[];
 w.Image=class {naturalWidth=1000;naturalHeight=1000;async decode(){}};
 w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},drawImage(...args){draws.push(args);}});
 w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,test';
 w.eval(source('question-figures.js'));
 const image=await w.GrowingQuestionFigures.englishFigureImage({figures:[{page:1,x:.2,y:.3,width:.4,height:.2},{page:2,x:0,y:0,width:.5,height:.3}]},{pages:[{page:1,image:'page-one'},{page:2,image:'page-two'}]});
 assert.equal(image,'data:image/jpeg;base64,test');assert.equal(draws.length,2);assert.equal(draws[0][1],200);assert.equal(draws[0][2],300);assert.equal(draws[0][3],400);assert.equal(draws[0][4],200);
 await assert.rejects(()=>w.GrowingQuestionFigures.englishFigureImage({figures:[{page:3,x:0,y:0,width:1,height:1}]},{pages:[]}),/题图.*缺失/);dom.window.close();
});
test('failed figure preparation keeps correction draft and does not submit grading',async()=>{
 const {dom,w,root,requests}=await reviewFixture(true);
 root.querySelector('[data-correction]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert.equal(requests.some(r=>r.path.endsWith('/correct')),false);
 assert.match(root.querySelector('[data-review-status]').textContent,/题图来源页缺失.*订正内容保留/);
 assert.ok(root.querySelector('[data-correction-pad]'));dom.window.close();
});
test('missing stored English image is isolated and refuses print',async()=>{
 const {dom,root}=await mount('english','paper1',[{id:'q1',number:'1',text:'Image question',hasFigureImage:true,figures:[],uncertain:[]}]);
 assert.equal(root.querySelectorAll('.paper-question').length,1);
 assert.match(root.querySelector('[data-figure-missing]').textContent,/题图缺失/);
 assert.ok(root.querySelector('[data-edit-figure]'));
 root.querySelector('[data-print]').click();await tick();
 assert.match(root.querySelector('[data-status]').textContent,/题图缺失或未完成/);dom.window.close();
});
