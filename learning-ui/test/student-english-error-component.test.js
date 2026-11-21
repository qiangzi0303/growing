import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {JSDOM} from 'jsdom';
test('English error model renders its message and return link without a unit',async()=>{
 const component=fileURLToPath(new URL('../src/StudentEnglishCourse.vue',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[vue(),{name:'error-entry',enforce:'pre',resolveId:id=>id.endsWith('error-entry')?'\0error-entry':null,load:id=>id==='\0error-entry'?`import {createApp} from 'vue';import C from ${JSON.stringify(component)};export function mount(el,controller){const app=createApp(C,{controller});app.config.errorHandler=e=>{throw e};app.mount(el);return app;}`:null}],build:{write:false,lib:{entry:'error-entry',name:'ErrorTest',formats:['iife']},minify:false},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://test.invalid'}),w=dom.window;w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.eval((Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code);
 try{const app=w.ErrorTest.mount(w.document.querySelector('#root'),{model:{kind:'error',title:'课程不可用',message:'请重新选择单元',backHref:'units.html?subject=english'},actions:{},subscribe:()=>()=>{}});assert.match(w.document.body.textContent,/请重新选择单元/);assert.ok(w.document.querySelector('a[href="units.html?subject=english"]'));assert.equal(w.document.querySelector('a[href*="question-bank"]'),null);app.unmount();}finally{w.close();}
});
