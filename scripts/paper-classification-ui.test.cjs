const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const source=n=>fs.readFileSync(require('node:path').join(__dirname,'../platform-web',n),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,20));
async function fixture(classification,fail=false,subject='physics'){
 const dom=new JSDOM('<main></main>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window,requests=[];
 w.GrowingLegacy={target:async()=> 's1'};w.GrowingMathFormat={questionHtml:s=>s};w.GrowingPaperReview={mount:()=>({dispose(){}})};
 w.GrowingQuestionFigures={photo:async()=> 'prepared-image'};
 w.eval(source('my-papers.js'));
 const paper={id:'p1',title:'测试卷',subject,mode:'paper',createdAt:'2026-11-07',questionCount:0,warnings:[],questions:[],pages:[],classification,units:[{id:'u1',title:'光现象',subject,termName:'上册'},{id:'u2',title:'声现象',subject,termName:'上册'},{id:'u3',title:'下册内容',subject,termName:'下册'}]};
 const api=async(url,options)=>{requests.push({url,body:options&&JSON.parse(options.body)});if(options){if(fail)throw Error('保存失败');Object.assign(paper,{classification:{...JSON.parse(options.body).classification,confirmed:true,source:'manual'}});}return url.includes('/papers/')?paper:[paper];};
 const root=w.document.querySelector('main');await w.GrowingPapers.mount(root,api,String,()=>true,{role:'Student',id:'s1'},{subject,paperId:'p1'});
 return {dom,w,root,requests};
}
test('physics paper shows automatic classification and permits correcting saved papers',async()=>{
 const {dom,root}=await fixture({examType:'unit',unitIds:['u1'],termName:'上册',evidence:'卷头第四章',warnings:[],confirmed:false,source:'ai'});
 assert.match(root.querySelector('[data-classification-summary]').textContent,/单元测试.*光现象.*待核对/);
 assert.equal(root.querySelector('[data-exam-type]').value,'unit');assert.equal(root.querySelector('[data-paper-unit="u1"]').checked,true);
 assert.ok(root.querySelector('[data-confirm]'));dom.window.close();
});
test('changing exam type clears unit association and sends persisted classification',async()=>{
 const {dom,w,root,requests}=await fixture({examType:'unit',unitIds:['u1'],termName:'上册',warnings:[],confirmed:false});
 const select=root.querySelector('[data-exam-type]');select.value='final';select.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(root.querySelectorAll('[data-paper-unit]:checked').length,0);
 root.querySelector('[data-confirm]').click();await tick();
 assert.deepEqual(requests.find(r=>r.body).body.classification,{examType:'final',unitIds:[],termName:'上册'});
 assert.match(root.querySelector('[data-status]').textContent,/已保存/);dom.window.close();
});
test('manual same-term multiunit selection saves and reopening displays it',async()=>{
 const {dom,w,root,requests}=await fixture({examType:'unit',unitIds:['u1'],termName:'上册',warnings:[],confirmed:false});
 assert.equal(root.querySelector('[data-paper-unit="u3"]'),null);
 root.querySelector('[data-paper-unit="u2"]').checked=true;root.querySelector('[data-confirm]').click();await tick();
 assert.deepEqual(requests.find(r=>r.body).body.classification.unitIds,['u1','u2']);
 assert.match(root.querySelector('[data-classification-summary]').textContent,/光现象.*声现象.*已确认/);dom.window.close();
});
test('legacy metadata stays pending and failed saves retain user selection',async()=>{
 const {dom,w,root}=await fixture(undefined,true,'math');
 assert.match(root.querySelector('[data-classification-summary]').textContent,/待核对/);
 const select=root.querySelector('[data-exam-type]');select.value='midterm';select.dispatchEvent(new w.Event('change',{bubbles:true}));root.querySelector('[data-confirm]').click();await tick();
 assert.match(root.querySelector('[data-status]').textContent,/保存失败/);assert.equal(select.value,'midterm');dom.window.close();
});
test('physics legacy links retain subject',()=>{
 const dom=new JSDOM('',{runScripts:'outside-only'});dom.window.eval(source('legacy-navigation.js'));
 const nav=dom.window.GrowingLegacy,url=new URL(nav.link('my-papers','/console/home','s1',undefined,'physics'),'https://test.invalid');
 assert.equal(nav.parse(url.search,'').subject,'physics');dom.window.close();
});
test('changing term clears stale units and limits options to that term',async()=>{
 const {dom,w,root}=await fixture({examType:'unit',unitIds:['u1'],termName:'上册',warnings:[]});
 const term=root.querySelector('[data-paper-term]');term.value='下册';term.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(root.querySelector('[data-paper-unit="u1"]'),null);assert.equal(root.querySelector('[data-paper-unit="u3"]').checked,false);dom.window.close();
});
test('physics list displays classification and upload uses physics context',async()=>{
 const {dom,w,root,requests}=await fixture({examType:'midterm',unitIds:[],termName:'上册',warnings:[],confirmed:true});
 root.querySelector('[data-library]').click();await tick();
 assert.match(root.querySelector('.papers-card').textContent,/物理.*期中考试.*已确认/);
 root.querySelector('[data-new]').click();
 const album=root.querySelector('[data-album]');Object.defineProperty(album,'files',{value:[{}]});album.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();
 root.querySelector('[data-import]').click();await tick();
 assert.equal(requests.find(r=>r.url==='/question-bank/import').body.subject,'physics');dom.window.close();
});
test('physics review displays real attached illustration and never offers SVG generation',async()=>{
 const dom=new JSDOM('<main></main>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;
 w.GrowingQuestionDrawing={normalize:()=>{throw Error('物理不能走数学SVG');}};
 w.eval(source('question-figures.js'));
 const api=async url=>url.includes('/papers/')?{subject:'physics',pages:[]}:{image:'data:image/png;base64,test'};
 const figures=w.GrowingQuestionFigures.create(api,String,()=>true,'s1',async()=>{}),host=w.document.querySelector('main');
 await figures.mount(host,{id:'q1',paperId:'p1',subject:'physics',number:'1',hasFigureImage:true,pages:[]},{originals:false,minimal:true});
 assert.equal(host.querySelector('img').getAttribute('src'),'data:image/png;base64,test');assert.equal(host.querySelector('[data-drawing-generate]'),null);figures.dispose();dom.window.close();
});
