import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

test('quiz selection survives timer emissions, submits, and resets only for a new quiz or lesson',async()=>{
 const component=fileURLToPath(new URL('../src/StudentEnglishCourse.vue',import.meta.url));
 const result=await build({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,logLevel:'silent',plugins:[vue(),{name:'quiz-selection-entry',resolveId:id=>id.endsWith('quiz-selection-entry')?'\0quiz-selection-entry':null,load:id=>id==='\0quiz-selection-entry'?`import {createApp,nextTick} from 'vue';import C from ${JSON.stringify(component)};export {nextTick};export function mount(el,controller){const app=createApp(C,{controller});app.config.errorHandler=e=>{throw e};app.mount(el);return app;}`:null}],build:{write:false,lib:{entry:'quiz-selection-entry',name:'QuizSelectionTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://test.invalid'}),w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 w.eval((Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code);
 let listener=()=>{},submitted;
 const questions=[{prompt:'I look forward to ____ Chinese.',options:['learning','learns','learn'],answer:'learning'},{prompt:'The school offers courses ____ us.',options:['for','to','with'],answer:'for'}];
 const model={kind:'english',view:'quiz',unit:{number:2,id:'english-8a-02',title:'School life'},words:[],query:'',filter:'all',state:{words:{},feynman:{}},lesson:{id:'reading',title:'比较不同的校园生活',questions},attempt:{options:questions.map(q=>q.options.slice())}};
 const controller={model,actions:{submitQuiz(answers){submitted=Array.from(answers);}},subscribe(fn){listener=fn;return ()=>{listener=()=>{};};}};
 const app=w.QuizSelectionTest.mount(w.document.querySelector('#root'),controller);
 const flush=async()=>{await w.QuizSelectionTest.nextTick();await new Promise(r=>setTimeout(r,0));await w.QuizSelectionTest.nextTick();};
 const emit=async()=>{listener({...model});await flush();};
 const groups=()=>w.document.querySelectorAll('[role=radiogroup]');
 const selected=()=>w.document.querySelectorAll('[role=radio][aria-checked=true]');
 try{
  groups()[0].querySelector('[role=radio]').click();await flush();assert.equal(selected().length,1);
  for(let i=0;i<4;i++){model.notice='';await emit();assert.equal(selected().length,1,'timer model emissions must keep the selected answer');}
  groups()[1].querySelector('[role=radio]').click();await flush();await emit();assert.equal(selected().length,2);
  w.document.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await flush();await flush();assert.deepEqual(submitted,['learning','for']);
  model.attempt={options:questions.map(q=>q.options.slice())};await emit();assert.equal(selected().length,0,'retrying the same quiz starts with empty answers');
  groups()[0].querySelectorAll('[role=radio]')[1].click();await flush();await emit();assert.equal(selected().length,1);
  model.lesson={...model.lesson,id:'different-lesson'};await emit();assert.equal(selected().length,0,'another lesson cannot inherit the previous answers');
 }finally{app.unmount();w.close();}
});
