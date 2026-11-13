import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

async function models(){const context={window:{},URLSearchParams};vm.createContext(context);vm.runInContext(await readFile(new URL('../../app/src/main/assets/web/app-design/student-resources-model.js',import.meta.url),'utf8'),context);return context.window.GrowingStudentResources;}
test('resources retain subject, semester, Unit 3 and original maths destinations',async()=>{
 const factory=await models(),opened=[];
 const math=factory.create({subject:'math',params:new URLSearchParams('term=lower'),openPapers:subject=>opened.push(subject)});
 assert.equal(math.backHref,'units.html?subject=math&term=lower');
 assert.deepEqual(Array.from(math.groups.flatMap(g=>g.links.map(l=>l.href))),['math-exam-midterm.html','math-exam-practice.html','math-exam-midterm-graph.html','geometry-models.html']);
 await math.openPapers();assert.deepEqual(opened,['math']);
 assert.equal(factory.create({subject:'english',params:new URLSearchParams('unit=english-8a-03')}).backHref,'../word-ops-unit3/index.html');
 assert.equal(factory.create({subject:'physics',params:new URLSearchParams('unit=physics-8a-02')}).backHref,'physics-course.html?chapter=physics-8a-02');
 assert.equal(factory.create({subject:'english',params:new URLSearchParams('unit=not-a-course')}).backHref,'units.html?subject=english&term=upper');
});
test('production resources render Vant links and report actual paper-opening failures',async()=>{
 const component=fileURLToPath(new URL('../src/StudentResources.vue',import.meta.url));
 const result=await build({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,logLevel:'silent',plugins:[vue(),{name:'resources-test',enforce:'pre',resolveId:id=>id.endsWith('resources-test')?'\0resources-test':null,load:id=>id==='\0resources-test'?`import {createApp} from 'vue';import Component from ${JSON.stringify(component)};export function mount(el,model){return createApp(Component,{model}).mount(el);}`:null}],build:{write:false,lib:{entry:'resources-test',name:'ResourcesTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const code=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(r=>r.type==='chunk').code;
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'dangerously',pretendToBeVisual:true,url:'https://learn.test'});dom.window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});dom.window.eval(code);
 const model=(await models()).create({subject:'math',params:new URLSearchParams(),openPapers:async()=>{throw Error('service unavailable');}});
 dom.window.ResourcesTest.mount(dom.window.document.querySelector('#root'),model);
 const button=dom.window.document.querySelector('[data-open-papers]');assert.ok(button.classList.contains('van-button'));button.click();
 await new Promise(r=>setTimeout(r,30));assert.match(dom.window.document.querySelector('[role=status]').textContent,/service unavailable/);assert.ok(dom.window.document.querySelector('a.van-cell[href="math-exam-practice.html"]'));
 dom.window.close();
});
