import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),base=new URL('../../app/src/main/assets/web/',import.meta.url),wait=()=>new Promise(r=>setTimeout(r,35));
test('compiled Unit3 uses Vant and hides English and previous answers during all seven independent recalls',async()=>{
 const component=fileURLToPath(new URL('../src/StudentUnit3Course.vue',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[vue(),{name:'unit3-test-entry',enforce:'pre',resolveId:id=>id.endsWith('unit3-test-entry')?'\0unit3-test-entry':null,load:id=>id==='\0unit3-test-entry'?`import {createApp} from 'vue';import Component from ${JSON.stringify(component)};export function mount(el,controller){const app=createApp(Component,{controller});app.mount(el);return app;}`:null}],build:{write:false,lib:{entry:'unit3-test-entry',name:'Unit3Test',fileName:'unit3-test',cssFileName:'unit3-test',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const code=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(r=>r.type==='chunk').code,dom=new JSDOM('<div id="root"></div>',{url:'https://learn.test/word-ops-unit3/index.html',runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 const html=await readFile(new URL('word-ops-unit3/index.html',base),'utf8');for(const source of ['data.js','word-details.js','exam-data.js','word-practice.js','study.js','word-efficiency.js','learning-time.js']){const script=[...html.matchAll(/<script\b[^>]*data-source="([^"]+)"[^>]*>([\s\S]*?)<\/script>/gi)].find(match=>match[1]===source);assert.ok(script,source);w.eval(script[2]);}
 for(const [name,file] of Object.entries({WordMasteryRules:'word-mastery-rules.js',GrowingRewards:'reward-engine.js',GrowingEnglishUnitScore:'english-unit-score.js',GrowingEnglishScore:'english-score.js',GrowingEnglishWordReview:'english-word-review.js'}))w[name]=require('../../app/src/main/assets/web/app-design/'+file);
 w.UnitRewards={register(){},update(){}};w.GrowingCourseSpeech={create:()=>({play(){},stop(){}})};w.GrowingCourseAI={request:async()=>JSON.stringify({meaningPassed:true,posPassed:true,feedback:'准确',errors:[]}),info:()=>({configured:false})};w.SentenceDemo={units:{'english-8a-03':{topics:[]}}};
 w.eval(await readFile(new URL('app-design/student-unit3-course.js',base),'utf8'));w.eval(code);const c=w.GrowingStudentUnit3Course.create({storage:w.localStorage}),app=w.Unit3Test.mount(w.document.querySelector('#root'),c);
 try{
  await wait();assert.equal(w.document.querySelectorAll('.study-word-row').length,62);
  w.document.querySelector('[data-study-word="w1"]').click();await wait();
  w.document.querySelector('[data-action="formal-recall"]').click();await wait();
  async function answer(value,key='Enter'){
   const input=w.document.querySelector('[data-formal-answer]');assert.ok(input);input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));await wait();input.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));await wait();
  }
  await answer('learner');assert.equal(c.snapshot().wordRun.answers.length,1);
  c.studyActions.navigate('word');await wait();
  const practiceTitle=[...w.document.querySelectorAll('.van-collapse-item__title')].find(el=>el.textContent.includes('本词知识与考核'));assert.ok(practiceTitle,'partial recall must not hide word practice after returning to its card');practiceTitle.click();await wait();
  const practiceButton=[...w.document.querySelectorAll('button')].find(el=>el.textContent==='开始本词5题考核');assert.ok(practiceButton);practiceButton.click();await wait();assert.equal(c.snapshot().quiz.mode,'word');assert.equal(c.snapshot().quiz.items.length,5);
  c.studyActions.word('w1');c.studyActions.recall();await wait();assert.equal([...w.document.querySelectorAll('.van-collapse-item__title')].some(el=>el.textContent.includes('本词知识与考核')),false);
  await answer('wrong',' ');assert.equal(c.snapshot().wordRun.answers.length,0);
  for(let i=0;i<7;i++){assert.doesNotMatch(w.document.querySelector('.formal-study').textContent,/learner/);await answer('learner',i%2?' ':'Enter');}
  assert.ok(w.document.querySelector('[data-stage="plural"]'));await answer('learners');assert.ok(w.document.querySelector('[data-stage="oral"] textarea'));
  assert.equal(w.document.querySelector('[data-stage="oral"]').textContent.includes(c.snapshot().card.cn),false);
  c.actions.open('knowledge');await wait();assert.ok(w.document.querySelectorAll('.course-panel article').length);
  c.actions.startQuiz('word','w1');await wait();assert.ok(w.document.querySelector('.van-radio-group')||w.document.querySelector('.van-field'));
 }finally{app.unmount();w.close();}
});
