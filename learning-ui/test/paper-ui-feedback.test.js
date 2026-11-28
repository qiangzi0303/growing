import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {paperProgress} from '../src/paper-ui.js';
import {createPopupFocus} from '../src/popup-focus.js';

test('paper progress uses only reported counts and percentages, with honest unknown and failed states',()=>{
 const unknown=paperProgress({status:'planning',plannedPages:1,pageCount:3});
 assert.equal(unknown.percent,null);assert.equal(unknown.label,'清点试卷页数');
 assert.equal(unknown.pages,'1 / 3 页');assert.equal(unknown.questions,'0 / ? 题');
 const partial=paperProgress({status:'processing',mode:'paper',completedQuestions:0,recognizedQuestions:3,totalQuestions:8,progressPercent:37.5,next:{number:4,stage:'transcribe'},processor:'photo-agent-v1'});
 assert.equal(partial.percent,37.5);assert.equal(partial.label,'第 4 题 · 转录文字');assert.equal(partial.questions,'3 / 8 题');assert.equal(partial.background,true);
 assert.equal(paperProgress({status:'failed',progressPercent:35,error:'网络中断'}).percent,35);
 assert.equal(paperProgress({status:'processing',progressPercent:103}).percent,null);
 assert.equal(paperProgress({status:'complete',progressPercent:100,mode:'paper'}).label,'整理完成，待核对');
 assert.equal(paperProgress({status:'complete',mode:'grade'}).label,'批改完成');
});

test('popup keyboard loop and nested closure return to the actual trigger',()=>{
 const dom=new JSDOM('<button id="open">打开</button><section id="outer"><button id="inner-open">更多</button><button id="last">最后</button></section><section id="inner"><button id="close">关闭</button></section>',{pretendToBeVisual:true});
 const d=dom.window.document,focus=createPopupFocus(d),outer=d.querySelector('#outer'),inner=d.querySelector('#inner');
 // jsdom has no layout; make visible controls measurable like browser controls.
 for(const el of d.querySelectorAll('button'))el.getClientRects=()=>[{}];
 let closes=0;const a=focus.bind('outer',()=>closes++),b=focus.bind('inner',()=>closes++);
 outer.setAttribute('data-popup-focus',a['data-popup-focus']);inner.setAttribute('data-popup-focus',b['data-popup-focus']);
 d.querySelector('#open').focus();a.onOpen();a.onOpened();assert.equal(d.activeElement.id,'inner-open');
 d.querySelector('#last').focus();let prevented=false;
 a.onKeydown({key:'Tab',shiftKey:false,currentTarget:outer,preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(d.activeElement.id,'inner-open');
 b.onOpen();b.onOpened();assert.equal(d.activeElement.id,'close');b.onClosed();assert.equal(d.activeElement.id,'inner-open');
 a.onKeydown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(closes,1);
 a.onClosed();assert.equal(d.activeElement.id,'open');focus.dispose();dom.window.close();
});
