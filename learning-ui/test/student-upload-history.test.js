import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';

test('upload records expand with matching originals and feedback, including ungraded replacements',async()=>{
 const component=fileURLToPath(new URL('../src/StudentUploadHistory.vue',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[vue(),{name:'uploads-test',enforce:'pre',resolveId:id=>id.endsWith('uploads-test')?'\0uploads-test':null,load:id=>id==='\0uploads-test'?`import {createApp,h} from 'vue';import Component from ${JSON.stringify(component)};export function mount(el,uploads){const app=createApp({render:()=>h(Component,{uploads})});app.mount(el);return app;}`:null}],build:{write:false,lib:{entry:'uploads-test',name:'UploadsTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const code=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(r=>r.type==='chunk').code;
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.test'}),w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.eval(code);
 const app=w.UploadsTest.mount(w.document.querySelector('#root'),[{key:'new',updatedAt:'2026-11-14T04:00:00Z',status:'pending',photos:['/new.jpg'],grades:[]},{key:'old',updatedAt:'2026-11-13T04:00:00Z',status:'graded',photos:['/old.jpg'],grades:[{score:80,at:'2026-11-13T04:00:00Z',feedback:'第一份反馈'}]}]);
 const tick=()=>new Promise(r=>setTimeout(r,30));await tick();
 const details=w.document.querySelector('details');assert.equal(details.open,false);details.querySelector('summary').click();await tick();assert.equal(details.open,true);
 const records=w.document.querySelectorAll('article');assert.equal(records.length,2);assert.match(records[0].textContent,/尚无批改记录/);assert.doesNotMatch(records[0].textContent,/第一份反馈/);assert.match(records[1].textContent,/第一份反馈/);
 assert.equal(records[0].querySelector('img').getAttribute('src'),'/new.jpg');assert.equal(records[1].querySelector('img').getAttribute('src'),'/old.jpg');
 records[1].querySelector('button').click();await tick();assert.ok(w.document.querySelector('.van-image-preview'));assert.equal(w.localStorage.length,0);
 app.unmount();w.close();
});
