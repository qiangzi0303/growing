import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
async function setup(name,props){
 const component=fileURLToPath(new URL('../src/'+name+'.vue',import.meta.url));
 const result=await build({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,logLevel:'silent',plugins:[vue(),{name:'frame-entry',resolveId:id=>id.endsWith('frame-entry')?'\0frame-entry':null,load:id=>id==='\0frame-entry'?`import {createApp,h,reactive,nextTick} from 'vue';import C from ${JSON.stringify(component)};export {nextTick};export function mount(el,props){const state=reactive(props);const app=createApp({render:()=>h(C,state)});app.mount(el);return {app,state};}`:null}],build:{write:false,lib:{entry:'frame-entry',name:'FrameTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const dom=new JSDOM('<div id="root"></div>',{url:'https://test.invalid/app/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.ResizeObserver=class{observe(){}disconnect(){}};
 w.eval((Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code);
 const mounted=w.FrameTest.mount(w.document.querySelector('#root'),props),frame=w.document.querySelector('iframe');
 const flush=async()=>{await w.FrameTest.nextTick();await Promise.resolve();await w.FrameTest.nextTick();};
 return {w,frame,state:mounted.state,flush,load:async()=>{frame.dispatchEvent(new w.Event('load'));await flush();},close(){mounted.app.unmount();w.close();}};
}
test('grammar target requests select once without refreshing same lesson and report refusal',async()=>{
 const calls=[],errors=[],s=await setup('StudentGrammarScene',{unit:'english-8a-05',lesson:'reading',target:{lessonId:'reading',pointId:'growth',requestId:1},actions:{pomodoroTargetError:m=>errors.push(m)}});
 try{const src=s.frame.src;let ok=true;s.frame.contentDocument.write('<main></main>');s.frame.contentWindow.GrowingEnglishPointStudy={connect(){calls.push('connect');},selectPoint(id){calls.push(id);return ok;}};
 await s.load();assert.deepEqual(calls,['connect','growth']);await s.load();assert.deepEqual(calls,['connect','growth']);
 s.state.target={lessonId:'reading',pointId:'growth',requestId:2};await s.flush();assert.equal(calls.at(-1),'growth');assert.equal(calls.length,3);assert.equal(s.frame.src,src);
 ok=false;s.state.target={lessonId:'reading',pointId:'habitat',requestId:3};await s.flush();assert.equal(errors.length,1);
 }finally{s.close();}
});
test('sentence navigation preserves iframe src, awaits promises and reports failures',async()=>{
 const calls=[],errors=[],s=await setup('StudentSentenceFrame',{src:'english-sentence-demo.html?embed=1&unit=english-8a-05',target:{topicId:'reading',sentenceId:'s1',requestId:1},actions:{pomodoroTargetError:m=>errors.push(m)}});
 try{const src=s.frame.src;s.frame.contentDocument.write('<main id="sentence-app"></main>');s.frame.contentWindow.GrowingEnglishSentenceStudy={navigate:async url=>{calls.push(url);return true;}};
 await s.load();await s.load();assert.equal(calls.length,1);assert.equal(new URL(calls[0]).searchParams.get('sentence'),'s1');
 s.frame.contentWindow.GrowingEnglishSentenceStudy.navigate=async()=>{throw Error('未保存');};s.state.target={topicId:'reading',sentenceId:'s2',requestId:2};await s.flush();assert.match(errors[0],/未保存/);assert.equal(s.frame.src,src);
 }finally{s.close();}
});
test('real point classroom reloads the same point and refuses navigation with unsaved answers',()=>{
 const base=new URL('../../app/src/main/assets/web/app-design/',import.meta.url),dom=new JSDOM(readFileSync(new URL('english-point-scenes.html',base),'utf8'),{url:'https://test.invalid/english-point-scenes.html?embed=1&unit=english-8a-05&lesson=reading',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.matchMedia=()=>({matches:true,addEventListener(){}});
 for(const file of ['grammar-scenes/unit5-lessons.js','grammar-scenes/unit5-practice.js','grammar-scenes/unit5-study.js'])w.eval(readFileSync(new URL(file,base),'utf8'));
 try{let saved=null,fail=false;const P=w.GrowingUnit5Practice,api=w.GrowingEnglishPointStudy;
 api.connect({read:()=>saved,write:(lesson,id,value)=>{if(fail)throw Error('quota');saved=value;return value;}});
 assert.equal(api.selectPoint('growth'),true);const radio=w.document.querySelector('#options input');radio.checked=true;radio.dispatchEvent(new w.Event('change',{bubbles:true}));assert.ok(saved.answers);
 saved=P.empty();assert.equal(api.selectPoint('growth'),true);assert.equal(w.document.querySelector('#options input:checked'),null,'fresh review record replaces old checked choice');
 assert.equal(api.selectPoint('missing'),false);fail=true;const choice=w.document.querySelector('#options input');choice.checked=true;choice.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(api.selectPoint('habitat'),false);assert.equal(w.document.querySelector('#point-tabs [aria-selected=true]').id,'point-tab-growth');
 }finally{w.close();}
});

test('point markers identify exact lesson points and leave answers intact when completed',async()=>{
 const target={id:'point:reading:growth',kind:'point',unitId:'english-8a-05',lessonId:'reading',pointId:'growth'};
 const s=await setup('StudentGrammarScene',{unit:'english-8a-05',lesson:'reading',actions:{},pomodoroTargets:[target]});
 try{
  s.frame.contentDocument.write('<main><div id="point-tabs"><button id="point-tab-growth" data-point="0">Growth</button><button id="point-tab-habitat" data-point="1">Habitat</button></div><input value="draft"></main>');
  s.frame.contentWindow.GrowingEnglishPointStudy={connect(){}};await s.load();
  const doc=s.frame.contentDocument,input=doc.querySelector('input');
  assert.equal(doc.querySelectorAll('[data-pomodoro-target]').length,1);assert.ok(doc.querySelector('#point-tab-growth [data-pomodoro-target]'));
  s.state.pomodoroPaused=true;await s.flush();assert.ok(doc.querySelector('.english-pomo-marker.is-paused'));
  s.state.pomodoroTargets=[];await s.flush();assert.equal(doc.querySelector('[data-pomodoro-target]'),null);assert.equal(doc.querySelector('input'),input);assert.equal(input.value,'draft');
 }finally{s.close();}
});

test('sentence markers follow topic navigation and sentence renders without reloading iframe',async()=>{
 const target={id:'sentence:s1',kind:'sentence',unitId:'english-8a-05',topicId:'reading',sentenceId:'s1'};
 const s=await setup('StudentSentenceFrame',{src:'english-sentence-demo.html?embed=1&unit=english-8a-05',pomodoroTargets:[target]});
 try{
  const doc=s.frame.contentDocument,child=s.frame.contentWindow,src=s.frame.src;
  doc.write('<main id="sentence-app"><a data-pomodoro-topic="reading">Reading</a><a data-pomodoro-topic="grammar">Grammar</a></main>');await s.load();
  assert.equal(doc.querySelectorAll('[data-pomodoro-target]').length,1);
  doc.querySelector('main').innerHTML='<h1 data-pomodoro-sentence="s1">Sentence</h1><input value="draft">';child.dispatchEvent(new child.Event('english-sentence-rendered'));
  assert.ok(doc.querySelector('h1 [data-pomodoro-target]'));const input=doc.querySelector('input');
  s.state.pomodoroTargets=[];await s.flush();assert.equal(doc.querySelector('[data-pomodoro-target]'),null);assert.equal(doc.querySelector('input'),input);assert.equal(s.frame.src,src);
 }finally{s.close();}
});
