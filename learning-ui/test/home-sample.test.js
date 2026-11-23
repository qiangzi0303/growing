import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('compiled menu retains calendar navigation and ignores stale calendar loads', async()=>{
 const server=await createServer({server:{middlewareMode:true}});
 let bundle;
 try { await readFile(new URL('../src/HomeSample.vue',import.meta.url)); } finally { await server.close(); }
 // Exercise the production IIFE, not a string or mocked Vant component.
 const { build }=await import('vite');
 await build({logLevel:'silent'});
 bundle=await readFile(new URL('../dist/learning-ui.js',import.meta.url),'utf8');
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.test'});
 const w=dom.window;w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};
 w.eval(bundle);
 let saved,signal,resolveTest,reads=0,rejectSave=false,lateCalendar=false,resolveCalendar;
 let infoSignal,delayInfo=false,resolveInfo;
 const service={info:s=>{infoSignal=s;return delayInfo?new Promise(r=>resolveInfo=r):{configured:true,baseUrl:'https://api.example.test',model:'deepseek-chat'};},save:async values=>{if(rejectSave)throw Error('保存失败，请重试');saved=values;},clear:async()=>{},test:s=>{signal=s;return new Promise(r=>resolveTest=r);}};
 const app=w.GrowingVantHome.mount(w.document.querySelector('#root'),{identity:'测试学生',deepseek:service,voice:{...service,voices:['alloy']},calendar:{units:async()=>[{id:'math-1',label:'数学 第一单元'},{id:'math-2',label:'数学 第二单元'}],read:async id=>{reads++;if(lateCalendar&&id==='math-1')return new Promise(r=>resolveCalendar=r);return {days:{},baseline:id==='math-2'?7:2,datedMastery:true};}},actions:{}});
 const tick=()=>new Promise(r=>setTimeout(r,60));
 const click=async selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.click();await tick();};
 await tick();assert.ok(w.document.querySelector('#vant-menu-trigger .van-icon'));
 await click('#vant-menu-trigger');await click('[data-vant-action="calendar"]');assert.equal(reads,1);assert.match(w.document.body.textContent,/2 项历史/);
 assert.equal(w.document.querySelectorAll('button[aria-label="上个月"]').length,1,'calendar has exactly one keyboard reachable previous-month control');
 const beforeMonth=w.document.querySelector('.van-calendar__header-subtitle').textContent;await click('button[aria-label="上个月"]');assert.notEqual(w.document.querySelector('.van-calendar__header-subtitle').textContent,beforeMonth);
 app.close();await tick();lateCalendar=true;await click('#vant-menu-trigger');await click('[data-vant-action="calendar"]');
 await click('[data-vant-unit]');
 const second=[...w.document.querySelectorAll('.van-picker-column__item')].find(el=>el.textContent==='数学 第二单元');assert.ok(second);second.click();await tick();await click('.van-picker__confirm');
 assert.match(w.document.body.textContent,/7 项历史/);resolveCalendar({days:{},baseline:99,datedMastery:true});await tick();assert.doesNotMatch(w.document.body.textContent,/99 项历史/);
 app.destroy();await tick();assert.equal(w.document.querySelector('#vant-menu-trigger'),null);dom.window.close();
});
