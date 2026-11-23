import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'vite';
import {JSDOM} from 'jsdom';

test('student menu removes personal credential forms while keeping calendar and device actions',async()=>{
 await build({logLevel:'silent'});
 const bundle=await readFile(new URL('../dist/learning-ui.js',import.meta.url),'utf8');
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.test'}),w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};w.eval(bundle);
 let device=0,reads=0;
 const forbidden=()=>{throw Error('personal credential service must not be called');};
 const app=w.GrowingVantHome.mount(w.document.querySelector('#root'),{identity:'测试账户',deepseek:{info:forbidden,save:forbidden},voice:{info:forbidden,save:forbidden},actions:{device:()=>{device++;}},calendar:{units:async()=>[{id:'math',label:'数学'}],read:async()=>{reads++;return {days:{},baseline:2,datedMastery:true};}}});
 const tick=()=>new Promise(r=>setTimeout(r,70));
 try{
  await tick();w.document.querySelector('#vant-menu-trigger').click();await tick();
  assert.equal(w.document.querySelector('[data-vant-action="deepseek"]'),null);
  assert.equal(w.document.querySelector('[data-vant-action="voice"]'),null);
  assert.equal(w.document.querySelector('input[type=password]'),null);
  w.document.querySelector('[data-vant-action="device"]').click();await tick();assert.equal(device,1);
  w.document.querySelector('#vant-menu-trigger').click();await tick();w.document.querySelector('[data-vant-action="calendar"]').click();await tick();
  assert.equal(reads,1);assert.match(w.document.body.textContent,/2 项历史/);
 }finally{app.destroy();dom.window.close();}
});
