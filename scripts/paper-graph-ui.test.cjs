const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/web/app-design/paper-knowledge-graph.js'),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,20));
const profile=id=>({studentId:id,units:[{id:'math-8a-01',title:'三角形'}],nodes:[{id:'tri-angles',unitId:'math-8a-01',title:'内角与外角',href:'app-design/math-course.html?chapter=math-8a-01&node=tri-angles'}],questions:[
 {id:'q1',paperId:'p1',number:'11',text:'<script>bad</script>',paperTitle:'My photo',unitIds:['math-8a-01'],nodeIds:['tri-angles'],verdict:'partial'},
 {id:'q2',paperId:'p2',number:'11',text:'Question',paperTitle:'Another paper',unitIds:['math-8a-01'],nodeIds:[],verdict:'correct'},
 {id:'draft',paperId:'p3',number:'1',text:'Pending',paperTitle:'Draft',unitIds:[],nodeIds:[],pending:true}
]});
async function mount(role='Student',custom){
 const dom=new JSDOM('<main><h1>图谱</h1><div id="fixed">Fixed reference</div></main>',{url:'https://test.invalid/learn/app-design/math-exam-midterm-graph.html',runScripts:'outside-only'}),w=dom.window,requests=[],opened=[];
 w.GrowingCloud={paperReviewContext:()=>({user:{role,id:'s1'},api:async url=>{requests.push(url);if(custom)return custom(url);if(url==='/parent/children')return [{id:'s1',displayName:'One'},{id:'s2',displayName:'Two'}];return profile(new URL('https://test.invalid'+url).searchParams.get('studentId'));}}),openPapers:async context=>opened.push(context)};
 w.eval(source);await tick();return {dom,w,root:w.document.querySelector('#paper-graph'),requests,opened};
}
test('auto-loads personal papers, filters by unit/node/pending, retains repeated numbers and escapes paper data',async()=>{
 const {dom,w,root,opened}=await mount();assert.equal(root.querySelectorAll('article').length,3);assert.equal(w.document.querySelector('#fixed').textContent,'Fixed reference');assert.equal(root.querySelectorAll('script').length,0);assert.match(root.textContent,/部分正确/);
 root.querySelector('[data-filter="n:tri-angles"]').click();assert.equal(root.querySelectorAll('article').length,1);assert.match(root.textContent,/内角与外角/);
 root.querySelector('[data-paper]').click();await tick();assert.deepEqual(JSON.parse(JSON.stringify(opened[0])),{subject:'math',studentId:'s1',paperId:'p1',questionId:'q1'});
 root.querySelector('[data-filter="pending"]').click();assert.equal(root.querySelectorAll('article').length,1);assert.match(root.querySelector('[data-questions]').textContent,/待核对/);
 root.querySelector('[data-filter="u:math-8a-01"]').click();assert.equal(root.querySelectorAll('article').length,2);dom.window.close();
});
test('refreshes automatically on paper changes, without duplicating questions, and clears private data on errors',async()=>{
 let fail=false;const {dom,w,root,requests}=await mount('Student',url=>{if(fail)throw Error('Access removed');return profile('s1');});
 w.dispatchEvent(new w.CustomEvent('growing:knowledge-changed',{detail:{studentId:'s2'}}));await tick();assert.equal(requests.length,1);
 w.dispatchEvent(new w.CustomEvent('growing:knowledge-changed',{detail:{studentId:'s1'}}));await tick();assert.equal(requests.length,2);assert.equal(root.querySelectorAll('article').length,3);
 fail=true;root.querySelector('[data-refresh]').click();await tick();assert.equal(root.querySelectorAll('article').length,0);assert.match(root.querySelector('[data-status]').textContent,/Access removed/);dom.window.close();
});
test('parents explicitly choose a linked child and late responses cannot restore the previous child',async()=>{
 let resolveFirst;const {dom,w,root,opened}=await mount('Parent',url=>url==='/parent/children'?[{id:'s1',displayName:'One'},{id:'s2',displayName:'Two'}]:url.endsWith('s1')?new Promise(r=>resolveFirst=r):profile('s2'));
 assert.equal(root.querySelectorAll('article').length,0);const select=root.querySelector('select');select.value='s1';select.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();select.value='s2';select.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();
 resolveFirst(profile('s1'));await tick();root.querySelector('[data-paper]').click();await tick();assert.equal(opened[0].studentId,'s2');assert.equal(root.querySelectorAll('article').length,3);dom.window.close();
});
test('missing cloud login leaves fixed graph usable and displays a clear message',async()=>{
 const dom=new JSDOM('<main><h1>图谱</h1><div id="fixed">Fixed reference</div></main>',{url:'https://test.invalid/',runScripts:'outside-only'});dom.window.eval(source);await tick();assert.match(dom.window.document.querySelector('[data-status]').textContent,/登录/);assert.ok(dom.window.document.querySelector('#fixed'));dom.window.close();
});
