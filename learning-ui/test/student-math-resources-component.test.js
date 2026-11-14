import test from 'node:test';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {build} from 'vite';import vue from '@vitejs/plugin-vue';import {JSDOM} from 'jsdom';
test('paper component offers photo upload and history selection with read-only legacy originals',async()=>{
 const component=fileURLToPath(new URL('../src/StudentMathResources.vue',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[vue(),{name:'resource-test',enforce:'pre',resolveId:id=>id.endsWith('resource-test')?'\0resource-test':null,load:id=>id==='\0resource-test'?`import {createApp} from 'vue';import Component from ${JSON.stringify(component)};export const mount=(el,controller)=>createApp(Component,{controller}).mount(el);`:null}],define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,minify:false,lib:{entry:'resource-test',name:'ResourceTest',formats:['iife']}}});
 const code=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(r=>r.type==='chunk').code,dom=new JSDOM('<div id="root"></div>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.eval(code);let selected,painted=0;
 const model={kind:'paper',title:'检测',questions:[{n:16,type:'solution',points:6,promptHtml:'证明',uploads:[{key:'saved',at:'2026-11-14T00:00:00Z',photos:['/photo.jpg']}]}],writing:{16:[[{tool:'pen',points:[[1,2]]}]]},answers:{},backHref:'units.html',clock:'00:00'};
 w.ResourceTest.mount(w.document.querySelector('#root'),{snapshot:()=>model,subscribe:()=>()=>{},actions:{paint(){painted++;},selectPhoto(n,key){selected={n,key};}}});await new Promise(r=>setTimeout(r,30));
 assert.equal(w.document.querySelectorAll('input[type=file]').length,1);assert.doesNotMatch(w.document.body.textContent,/手写解答|钢笔|橡皮/);assert.match(w.document.body.textContent,/历史原稿（只读）/);assert.equal(painted,1);
 [...w.document.querySelectorAll('button')].find(b=>b.textContent==='使用这份照片').click();assert.deepEqual(selected,{n:16,key:'saved'});dom.window.close();
});
