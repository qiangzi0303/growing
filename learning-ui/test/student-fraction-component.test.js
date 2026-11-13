import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),assets=new URL('../../app/src/main/assets/web/',import.meta.url),wait=()=>new Promise(r=>setTimeout(r,35));
test('compiled fraction course mounts real Vant controls and preserves controller drafts and scene state',async()=>{
 const component=fileURLToPath(new URL('../src/StudentFractionCourse.vue',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[vue(),{name:'fraction-test-entry',enforce:'pre',resolveId:id=>id.endsWith('fraction-test-entry')?'\0fraction-test-entry':null,load:id=>id==='\0fraction-test-entry'?`import {createApp} from 'vue';import Component from ${JSON.stringify(component)};export function mount(el,controller){const app=createApp(Component,{controller});app.mount(el);return app;}`:null}],build:{write:false,lib:{entry:'fraction-test-entry',name:'FractionTest',fileName:'fraction-test',cssFileName:'fraction-test',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const code=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(r=>r.type==='chunk').code;
 const dom=new JSDOM('<div id="root"></div>',{url:'https://learn.test/fraction-ops/class.html',runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.URL.createObjectURL=()=> 'blob:photo';w.URL.revokeObjectURL=()=>{};
 const html=await readFile(new URL('fraction-ops/'+(await readdir(new URL('fraction-ops/',assets))).find(f=>f.endsWith('.html')),assets),'utf8');
 const dataScript=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].find(match=>match[1].includes('MINUTE_DATA'));
 assert.ok(dataScript,'fraction data script must be present');w.eval(dataScript[1].split('(function(root,factory)')[0]);
 for(const [key,file] of Object.entries({GrowingHandwriting:'handwriting-core.js',GrowingPracticeProgress:'practice-progress.js',GrowingApplicationPractice:'application-practice.js',GrowingRewards:'reward-engine.js'}))w[key]=require('../../app/src/main/assets/web/app-design/'+file);
 w.UnitRewards={register(){},update(){}};w.GrowingCourseAI={request:async()=>'',info:()=>({configured:false,model:'deepseek-chat'})};
 w.eval(await readFile(new URL('app-design/student-fraction-course.js',assets),'utf8'));w.eval(code);
 const c=w.GrowingStudentFractionCourse.create({storage:w.localStorage}),app=w.FractionTest.mount(w.document.querySelector('#root'),c);
 try{
  await wait();assert.equal(w.document.querySelectorAll('.lesson-tabs .van-button').length,3);assert.equal(w.document.querySelectorAll('select').length,0);assert.match(w.document.body.textContent,/什么是分式/);
  const clickText=text=>{const button=[...w.document.querySelectorAll('button,[role=tab]')].find(b=>b.textContent.trim()===text);assert.ok(button,text);button.click();};
  clickText('闭卷复述');await wait();const field=w.document.querySelector('textarea');assert.ok(field);field.value='分母含字母，且分母不能为零。';field.dispatchEvent(new w.Event('input',{bubbles:true}));await wait();assert.match(JSON.parse(w.localStorage.getItem('fraction-minute-v1')).topics.definition.draft,/分母含字母/);
  c.actions.choose('domain');c.actions.scene(1);await wait();assert.ok(w.document.querySelector('.van-slider'));c.actions.demo(2);await wait();assert.match(w.document.body.textContent,/无意义，x=2被排除/);
  clickText('应用练习');await wait();assert.ok(w.document.querySelector('.van-uploader'));assert.equal(w.document.querySelectorAll('input[type=file]').length,c.snapshot().questions.length);
  const tools=[...w.document.querySelectorAll('.van-collapse-item__title')].find(el=>el.textContent.includes('更多课堂工具'));tools.click();await wait();clickText('学习日历');await wait();assert.ok(w.document.querySelector('.van-calendar'));const close=w.document.querySelector('[aria-label="关闭学习日历"]');assert.ok(close);assert.equal(close.textContent.trim(),'');assert.ok(close.querySelector('.van-icon-cross'));close.click();await wait();assert.equal(c.snapshot().view,'listen');
  clickText('掌握与奖励');await wait();assert.equal(c.snapshot().view,'rewards');assert.match(w.document.body.textContent,/家长称呼/);assert.ok(w.document.querySelector('.van-checkbox'));assert.equal(w.document.querySelectorAll('select').length,0);
 }finally{app.unmount();w.close();}
});
