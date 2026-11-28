import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

const component=name=>fileURLToPath(new URL('../src/'+name+'.vue',import.meta.url));
const bundle=await build({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,logLevel:'silent',plugins:[vue(),{
 name:'feedback-test',enforce:'pre',resolveId:id=>id.endsWith('feedback-entry')?'\0feedback-entry':null,
 load:id=>id==='\0feedback-entry'?`
 import {createApp,h,reactive,nextTick} from 'vue';
 import Button from ${JSON.stringify(component('ActionFeedbackButton'))};
 import Mark from ${JSON.stringify(component('CompletionMark'))};
 import Track from ${JSON.stringify(component('StudyStepTrack'))};
 export {nextTick};
 export function mount(el){
  const state=reactive({loading:false,resultKey:10,contextKey:'one',failed:false,cancelled:false,done:false,completed:0,current:0});
  const app=createApp({render:()=>h('div',[
   h(Button,{loading:state.loading,resultKey:state.resultKey,contextKey:state.contextKey,failed:state.failed,cancelled:state.cancelled,onClick:()=>state.clicks=(state.clicks||0)+1},()=> '保存作答'),
   h(Mark,{done:state.done}),h(Track,{label:'连续正确默写',total:7,completed:state.completed,current:state.current})
  ])});app.mount(el);return {state,app};
 }`:null
}],build:{write:false,lib:{entry:'feedback-entry',name:'FeedbackTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
const code=(Array.isArray(bundle)?bundle:[bundle]).flatMap(r=>r.output).find(o=>o.type==='chunk').code;

function setup(){
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://test.invalid'}),w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 w.eval(code);const {state,app}=w.FeedbackTest.mount(w.document.querySelector('#root'));
 return {w,state,button:w.document.querySelector('button'),flush:async()=>{await w.FeedbackTest.nextTick();await w.FeedbackTest.nextTick();},close:()=>{app.unmount();w.close();}};
}

test('feedback only acknowledges a new saved result and preserves button events',async()=>{
 const s=setup();try{
  const {button,state}=s;
  assert.equal(button.dataset.feedback,'idle','existing result must not animate');
  button.click();assert.equal(state.clicks,1);
  state.loading=true;await s.flush();
  assert.equal(button.dataset.feedback,'loading');assert.equal(button.getAttribute('aria-busy'),'true');
  button.click();assert.equal(state.clicks,1,'pending action must not submit twice');
  state.resultKey=11;await s.flush();assert.equal(button.dataset.feedback,'loading');
  state.loading=false;await s.flush();assert.equal(button.dataset.feedback,'success');
  assert.match(button.querySelector('[role=status]').textContent,/已保存/);
  state.contextKey='another-question';await s.flush();assert.equal(button.dataset.feedback,'idle');
  state.loading=true;await s.flush();state.loading=false;await s.flush();
  assert.equal(button.dataset.feedback,'retry','cancel/failure without a new result is never success');
  state.loading=true;await s.flush();state.resultKey=12;state.failed=true;state.loading=false;await s.flush();
  assert.equal(button.dataset.feedback,'retry','unsaved result is never success');
  button.click();await s.flush();assert.equal(button.dataset.feedback,'retry','repeat save failure keeps retry visible');
  state.failed=false;state.resultKey=13;await s.flush();assert.equal(button.dataset.feedback,'success');
 }finally{s.close();}
});

test('completion markers and dictation progress follow state without offering fake completion controls',async()=>{
 const s=setup();try{
  const marker=s.w.document.querySelector('#root>div>.completion-mark');
  const track=s.w.document.querySelector('.study-step-track');
  assert.equal(track.querySelectorAll('button,input').length,0);
  s.state.done=true;s.state.completed=2;s.state.current=2;await s.flush();
  assert.ok(marker.classList.contains('just-completed'));
  assert.equal(track.querySelectorAll('.completion-mark.is-done').length,2);
  assert.match(track.getAttribute('aria-label'),/2 \/ 7，当前第 3 步/);
  s.state.completed=0;s.state.current=0;await s.flush();
  assert.equal(track.querySelectorAll('.completion-mark.is-done').length,0,'wrong answer resets the seven-recall track');
  assert.equal(s.w.document.querySelector('#root>div>.completion-mark'),marker,'unrelated progress update preserves the target node');
 }finally{s.close();}
});

test('explicit cancellation clears pending feedback and ignores a late result',async()=>{
 const s=setup();try{
  s.state.loading=true;await s.flush();
  s.state.cancelled=true;s.state.loading=false;await s.flush();
  assert.equal(s.button.dataset.feedback,'idle');
  s.state.resultKey=11;await s.flush();
  assert.equal(s.button.dataset.feedback,'idle','cancelled result cannot acknowledge a save');
  s.state.cancelled=false;s.state.loading=true;await s.flush();
  s.state.resultKey=12;s.state.loading=false;await s.flush();
  assert.equal(s.button.dataset.feedback,'success','a new action can complete normally');
 }finally{s.close();}
});
