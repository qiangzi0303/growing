import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

async function setup(componentName='StudentWordStudy'){
 const component=fileURLToPath(new URL('../src/'+componentName+'.vue',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[vue(),{name:'study-test',enforce:'pre',resolveId:id=>id.endsWith('study-entry')?'\0study-entry':null,load:id=>id==='\0study-entry'?`import {createApp,h,reactive,nextTick} from 'vue';import C from ${JSON.stringify(component)};export {nextTick};export function mount(el,model,actions){const state=reactive(model);const app=createApp({render:()=>h(C,{model:state,actions})});app.config.errorHandler=e=>{throw e};app.mount(el);return {app,state};}`:null}],build:{write:false,lib:{entry:'study-entry',name:'StudyTest',formats:['iife'],cssFileName:'study-test'},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://test.invalid'}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.eval((Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code);
 const words=[{id:'friendship',word:'friendship',meaning:'n. 友谊'},{id:'patient',word:'patient',meaning:'adj. 有耐心的'},{id:'ponytail',word:'ponytail',meaning:'n. 马尾辫',optional:true}];
 const calls=[],actions=Object.fromEntries(['word','query','filter','startReview','startLearning','startWordReview','recall','navigate','speak','reviewInput','submitReview','reviewHint','reviewNext','retryReviewSave','reloadReview','recallInput','submitRecall','continueRecall','oralDraft','gradeOral','cancel','retryOralSave','nextWord'].map(name=>[name,(...args)=>calls.push([name,...args])]));
 const model={view:'words',words,word:words[0],wordPassed:{},query:'',filter:'all',state:{words:{}},description:{plurals:[]},reviewPlan:{dueIds:['friendship'],freshIds:['patient'],scheduledIds:[],nextDue:null},reviewStatus:{friendship:{label:'今天复习'},patient:{label:'待学习'}},studyCards:{friendship:{art:'friendship.webp',scene:'两位朋友坐在长椅上。',example:'Our friendship is strong.',translation:'我们的友谊很牢固。',collocation:'a close friendship',artSource:'https://github.com/designfuchen/word-atlas/blob/main/public/atlas/img/friendship.webp'},patient:{art:'patient.webp',scene:'老师耐心等孩子完成题目。',example:'Be patient with me.',translation:'请对我有耐心。',generated:true}},reviewSession:null,reviewUnsaved:false,reviewError:'',hideWordMeaning:false};
 const mounted=w.StudyTest.mount(w.document.querySelector('#root'),model,actions);
 return {w,calls,model:mounted.state,flush:async()=>{await w.StudyTest.nextTick();await w.StudyTest.nextTick();},close:()=>{mounted.app.unmount();w.close();}};
}

test('unified word study exposes due review, illustrated cards and existing dictation',async()=>{
 const s=await setup();try{
  assert.equal(s.w.document.querySelectorAll('[data-study-word]').length,3);
  s.w.document.querySelector('[data-action="review-due"]').click();assert.deepEqual(s.calls.at(-1),['startReview']);
  s.model.view='word';await s.flush();
  assert.ok(s.w.document.querySelector('.study-art img'));
  assert.equal(s.w.document.querySelector('.study-art-credit'),null);
  s.w.document.querySelector('[data-action="formal-recall"]').click();assert.deepEqual(s.calls.at(-1),['recall']);
  s.model.word=s.model.words[1];await s.flush();assert.ok(s.w.document.querySelector('.study-art img'));assert.equal(s.w.document.querySelector('.study-art-credit'),null);
  s.model.hideWordMeaning=true;await s.flush();assert.equal(s.w.document.querySelector('.study-art img'),null);
  assert.ok(!s.w.document.body.textContent.includes('Be patient with me.'));
 }finally{s.close();}
});

test('formal dictation keeps its input visible between attempts and hides meaning during oral verification',async()=>{
 const s=await setup('StudentWordFormal');try{
  s.model.view='recall';s.model.stage='recall';s.model.run={answers:[],draft:''};s.model.recallDraft='frien';await s.flush();
  assert.equal(s.w.document.querySelector('.study-art'),null);
  assert.equal(s.w.document.querySelector('[data-formal-answer]').value,'frien');
  assert.ok(!s.w.document.body.textContent.includes('friendship'));
  s.model.recallFeedback={correct:true,answer:'friendship'};await s.flush();
  assert.equal(s.w.document.querySelector('.study-art img'),null);
  assert.ok(s.w.document.querySelector('[data-formal-answer]'));
  assert.equal(s.w.document.querySelector('[data-continue-recall]'),null);
  s.model.reviewUnsaved=true;await s.flush();assert.ok(s.w.document.querySelector('[data-formal-answer]').disabled);
  s.model.reviewUnsaved=false;await s.flush();
  s.model.recallFeedback=null;s.model.recallDraft='';await s.flush();assert.equal(s.w.document.querySelector('.study-art'),null);
  s.model.stage='oral';await s.flush();assert.ok(s.w.document.querySelector('textarea'));assert.equal(s.w.document.querySelector('.study-art'),null);
  assert.ok(!s.w.document.body.textContent.includes('友谊'));
 }finally{s.close();}
});

test('formal Enter and Space submit once while phrase separators and composition remain editable',async()=>{
 const s=await setup('StudentWordFormal');try{
  s.model.view='recall';s.model.stage='recall';s.model.run={answers:[],draft:''};s.model.recallDraft='friendship';await s.flush();
  const field=s.w.document.querySelector('[data-formal-answer]');
  const press=(key,extra={})=>{const e=new s.w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...extra});field.dispatchEvent(e);return e;};
  assert.equal(press('Enter').defaultPrevented,true);await s.flush();assert.deepEqual(s.calls.at(-1),['submitRecall']);
  let count=s.calls.length;press('Enter',{repeat:true});press('Enter',{isComposing:true});await s.flush();assert.equal(s.calls.length,count);
  assert.equal(press(' ').defaultPrevented,true);await s.flush();assert.equal(s.calls.length,count+1);
  s.model.word={id:'keep secrets',word:'keep secrets',meaning:'保守秘密'};s.model.recallDraft='keep';await s.flush();field.setSelectionRange(4,4);
  count=s.calls.length;assert.equal(press(' ').defaultPrevented,false);await s.flush();assert.equal(s.calls.length,count);
  s.model.recallDraft='keep secrets';await s.flush();field.setSelectionRange(12,12);
  assert.equal(press(' ').defaultPrevented,true);await s.flush();assert.equal(s.calls.length,count+1);
  s.model.recallDraft='keep secretz';await s.flush();field.setSelectionRange(12,12);
  assert.equal(press(' ').defaultPrevented,true);await s.flush();assert.equal(s.calls.length,count+2);
 }finally{s.close();}
});

test('mobile Enter229 and line-break actions submit once without submitting IME candidates',async()=>{
 const s=await setup('StudentWordFormal');try{
  s.model.view='recall';s.model.stage='recall';s.model.run={answers:[],draft:''};s.model.recallDraft='friendship';await s.flush();
  const field=s.w.document.querySelector('[data-formal-answer]');
  const enter=()=>field.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Enter',keyCode:229,bubbles:true,cancelable:true}));
  const line=(extra={})=>field.dispatchEvent(new s.w.InputEvent('beforeinput',{inputType:'insertLineBreak',bubbles:true,cancelable:true,...extra}));
  enter();line();field.form.dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));await s.flush();assert.equal(s.calls.filter(c=>c[0]==='submitRecall').length,1);
  line();await s.flush();assert.equal(s.calls.filter(c=>c[0]==='submitRecall').length,2);
  field.dispatchEvent(new s.w.CompositionEvent('compositionstart',{bubbles:true}));enter();line();await s.flush();assert.equal(s.calls.filter(c=>c[0]==='submitRecall').length,2);
  field.dispatchEvent(new s.w.CompositionEvent('compositionend',{bubbles:true}));line({isComposing:true});await s.flush();assert.equal(s.calls.filter(c=>c[0]==='submitRecall').length,2);
  s.model.recallDraft='';await s.flush();line();await s.flush();assert.equal(s.calls.filter(c=>c[0]==='submitRecall').length,2);
 }finally{s.close();}
});

test('formal step track waits for successful persistence and resets after an incorrect recall',async()=>{
 const s=await setup('StudentWordFormal');try{
  s.model.view='recall';s.model.stage='recall';s.model.run={answers:['friendship','friendship'],draft:''};await s.flush();
  const track=s.w.document.querySelector('.study-step-track');
  assert.equal(track.querySelectorAll('.is-done').length,2);
  s.model.run.answers.push('friendship');s.model.reviewUnsaved=true;await s.flush();
  assert.equal(track.querySelectorAll('.is-done').length,2,'in-memory answer must not appear saved');
  assert.match(track.getAttribute('aria-label'),/保存未完成/);
  s.model.reviewUnsaved=false;await s.flush();assert.equal(track.querySelectorAll('.is-done').length,3);
  s.model.run.answers=[];await s.flush();assert.equal(track.querySelectorAll('.is-done').length,0);
 }finally{s.close();}
});

test('daily recall hides English and artwork until submitted and retains drafts on save failure',async()=>{
 const s=await setup();try{
  s.model.view='review';s.model.reviewSession={ids:['friendship'],index:0,draft:'frien',hinted:false,feedback:null,finished:false};await s.flush();
  assert.equal(s.w.document.querySelector('.study-art img'),null);
  assert.ok(!s.w.document.querySelector('.word-study').textContent.includes('friendship'));
  const input=s.w.document.querySelector('#study-review-answer');assert.equal(input.value,'frien');
  input.value='friendship';input.dispatchEvent(new s.w.Event('input',{bubbles:true}));assert.deepEqual(s.calls.at(-1),['reviewInput','friendship']);
  input.form.dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));assert.deepEqual(s.calls.at(-1),['submitReview']);
  s.model.reviewSession.feedback={correct:true,answer:'friendship',hinted:false,retry:false};s.model.reviewUnsaved=true;s.model.reviewError='本次未保存';await s.flush();
  assert.ok(s.w.document.querySelector('.study-art img'));assert.ok(s.w.document.querySelector('[data-action="review-next"]').disabled);
  s.w.document.querySelector('[data-action="retry-save"]').click();assert.deepEqual(s.calls.at(-1),['retryReviewSave']);
  assert.equal(s.w.document.querySelector('#study-review-answer').value,'frien');
  s.model.reviewUnsaved=false;s.model.reviewError='';await s.flush();s.w.document.querySelector('[data-action="review-next"]').click();assert.deepEqual(s.calls.at(-1),['reviewNext']);
 }finally{s.close();}
});
