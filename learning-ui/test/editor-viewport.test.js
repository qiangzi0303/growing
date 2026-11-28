import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import {JSDOM} from 'jsdom';

test('open editor follows keyboard viewport, keeps input and releases listeners when closed',async()=>{
 const helper=fileURLToPath(new URL('../src/editor-viewport.js',import.meta.url));
 const result=await build({configFile:false,logLevel:'silent',plugins:[{name:'editor-viewport-test',enforce:'pre',resolveId:id=>id.endsWith('viewport-test')?'\0viewport-test':null,load:id=>id==='\0viewport-test'?`import {createApp,h,ref} from 'vue';import {useEditorViewport} from ${JSON.stringify(helper)};export function mount(el){const open=ref(false);const app=createApp({setup(){const style=useEditorViewport(open);return ()=>h('section',{style:style.value},[h('input')]);}});app.mount(el);return {open:value=>open.value=value,close:()=>app.unmount()};}`:null}],define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,minify:false,lib:{entry:'viewport-test',name:'ViewportTest',formats:['iife']}}});
 const code=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(r=>r.type==='chunk').code;
 const dom=new JSDOM('<main></main>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window,viewport=new w.EventTarget();
 Object.assign(viewport,{height:844,offsetTop:0,scale:1});w.visualViewport=viewport;w.eval(code);
 const app=w.ViewportTest.mount(w.document.querySelector('main')),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
 const field=w.document.querySelector('input'),panel=w.document.querySelector('section');field.value='保留题面';app.open(true);await tick();
 viewport.height=380;viewport.offsetTop=80;viewport.dispatchEvent(new w.Event('resize'));await tick();
 assert.equal(panel.style.getPropertyValue('--editor-height'),'380px');assert.equal(panel.style.getPropertyValue('--editor-top'),'80px');assert.equal(field.value,'保留题面');
 viewport.scale=2;viewport.dispatchEvent(new w.Event('scroll'));await tick();assert.equal(panel.style.getPropertyValue('--editor-height'),'');
 viewport.scale=1;viewport.dispatchEvent(new w.Event('resize'));await tick();assert.equal(panel.style.getPropertyValue('--editor-height'),'380px');
 app.open(false);await tick();viewport.height=844;viewport.dispatchEvent(new w.Event('resize'));await tick();assert.equal(panel.style.getPropertyValue('--editor-height'),'');
 w.visualViewport=undefined;app.open(true);await tick();assert.equal(panel.style.getPropertyValue('--editor-height'),'');assert.equal(field.value,'保留题面');
 app.close();viewport.dispatchEvent(new w.Event('scroll'));await tick();assert.equal(w.document.querySelector('section'),null);w.close();
});
