import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

test('guidance reveals one hint at a time, links steps to figures and resets reasons without grading',async()=>{
 const component=fileURLToPath(new URL('../src/StudentGeometryGuidance.vue',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[vue(),{name:'guidance-test',enforce:'pre',resolveId:id=>id.endsWith('guidance-test')?'\0guidance-test':null,load:id=>id==='\0guidance-test'?`import {createApp,shallowRef,h} from 'vue';import Component from ${JSON.stringify(component)};export function mount(el,guide){const data=shallowRef(guide);const app=createApp({setup:()=>()=>h(Component,{guide:data.value})});app.mount(el);return {update:v=>data.value=v,destroy:()=>app.unmount()};}`:null}],build:{write:false,lib:{entry:'guidance-test',name:'GuidanceTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const code=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(r=>r.type==='chunk').code;
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.test'}),w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.eval(code);
 const svg=value=>`<svg viewBox="0 0 400 240" role="img"><text>${value}</text></svg>`;
 const guide={id:'pilot-9',svg:svg('题设'),hints:[1,2,3].map(i=>({text:'提示内容'+i,svg:svg('提示图'+i)})),steps:[1,2].map(i=>({title:'步骤标题'+i,text:'推导'+i,svg:svg('步骤图'+i),why:{goal:'目标'+i,noticed:'条件'+i,reason:'理由'+i}}))};
 const app=w.GuidanceTest.mount(w.document.querySelector('#root'),guide),tick=()=>new Promise(r=>setTimeout(r,20));
 const click=async text=>{const b=[...w.document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);assert.ok(b,text);b.click();await tick();};
 const body=()=>w.document.body.textContent;
 await tick();assert.match(body(),/题设/);assert.doesNotMatch(body(),/提示内容|推导|理由1/);
 await click('给我一点提示');assert.match(body(),/提示内容1/);assert.doesNotMatch(body(),/提示内容2|推导/);
 await click('再给一点提示');assert.match(body(),/提示内容2/);assert.doesNotMatch(body(),/提示内容3/);
 await click('再给一点提示');assert.match(body(),/提示内容3/);assert.match(w.document.querySelector('.guidance-figure').textContent,/提示图3/);
 await click('看解题思路');assert.match(body(),/推导1/);assert.doesNotMatch(body(),/推导2|理由1/);
 await click('为什么这样想');assert.match(body(),/目标1/);assert.match(body(),/条件1/);assert.match(body(),/理由1/);
 assert.equal(w.document.querySelector('[data-guidance-why]').getAttribute('aria-expanded'),'true');
 await click('下一步');assert.match(w.document.querySelector('.guidance-figure').textContent,/步骤图2/);assert.doesNotMatch(body(),/理由1|理由2/);
 await click('为什么这样想');assert.match(body(),/理由2/);
 app.update({...guide});await tick();assert.match(body(),/理由2/); // Parent classroom clock must not reset this question.
 await click('自己再想想');assert.match(w.document.querySelector('.guidance-figure').textContent,/题设/);assert.doesNotMatch(body(),/提示内容|推导|理由2/);
 await click('看解题思路');app.update({...guide,id:'pilot-10'});await tick();assert.doesNotMatch(body(),/推导|理由/);
 assert.equal(w.localStorage.length,0);assert.equal(w.document.querySelectorAll('input,canvas').length,0);
 app.destroy();w.close();
});
