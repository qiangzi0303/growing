import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

test('pilot keeps input focus while saving each character and moves focus only after submitting',async()=>{
 const component=fileURLToPath(new URL('../src/StudentWordPilot.vue',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[vue(),{name:'pilot-entry',enforce:'pre',resolveId:id=>id.endsWith('pilot-entry')?'\0pilot-entry':null,load:id=>id==='\0pilot-entry'?`import {createApp,nextTick} from 'vue';import C from ${JSON.stringify(component)};export {nextTick};export function mount(el,controller){const app=createApp(C,{controller});app.config.errorHandler=e=>{throw e};app.mount(el);return app;}`:null}],build:{write:false,lib:{entry:'pilot-entry',name:'PilotTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://test.invalid'}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const file of ['english-engine','english-word-pilot-data','english-word-pilot-core','student-word-pilot'])w.eval(readFileSync(new URL('../../app/src/main/assets/web/app-design/'+file+'.js',import.meta.url),'utf8'));
 w.eval((Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code);
 const c=w.GrowingStudentWordPilot.create({storage:w.localStorage}),app=w.PilotTest.mount(w.document.querySelector('#root'),c);
 const flush=async()=>{await w.PilotTest.nextTick();await w.PilotTest.nextTick();};
 try{
  c.actions.start();
  while(c.model.step.kind==='intro')c.actions.next();
  while(c.model.options.length){c.actions.answer(c.model.word.word);c.actions.next();}
  await flush();
  const input=w.document.querySelector('#pilot-answer');input.focus();
  for(const letter of 'cheerful'){
   input.value+=letter;input.dispatchEvent(new w.Event('input',{bubbles:true}));await flush();
   assert.equal(w.document.activeElement,input,'saving a character must keep the editor focused');
   assert.equal(c.model.state.session.draft,input.value);
  }
  const index=c.model.state.session.index;
  input.closest('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await flush();
  assert.ok(w.document.querySelector('.pilot-feedback'));
  assert.equal(c.model.state.session.index,index);
  assert.equal(w.document.activeElement,w.document.querySelector('.word-pilot'));
  const repeats=new w.KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true,cancelable:true});
  w.document.activeElement.dispatchEvent(repeats);await flush();assert.equal(c.model.state.session.index,index);
 }finally{app.unmount();c.destroy();w.close();}
});
