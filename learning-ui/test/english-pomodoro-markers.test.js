import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import {JSDOM} from 'jsdom';

const result=await build({configFile:false,logLevel:'silent',build:{write:false,lib:{entry:fileURLToPath(new URL('../src/english-pomodoro-markers.js',import.meta.url)),name:'Markers',formats:['iife']}}});
const code=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).find(o=>o.type==='chunk').code;
const unitId='english-8a-01',word={id:'word:w1',eventId:'word:w1',kind:'word',wordId:'w1',newWord:true,unitId};
const review={...word,id:'word:w2',eventId:'review:w2',wordId:'w2',newWord:false,review:true};
const setup=()=>{const dom=new JSDOM('<head></head><body><div id="node"><input value="draft"></div></body>',{runScripts:'outside-only',pretendToBeVisual:true});dom.window.eval(code);return dom;};

test('markers follow only the current learning round and unit, including paused rounds',()=>{
 const dom=setup(),pending=dom.window.Markers.pendingPomodoroTargets;
 try{
  const round={phase:'learning',targets:[word,review,{...word,id:'foreign',unitId:'english-8a-02'}],items:[],pauseUntil:123};
  assert.equal(pending({rounds:[round]},unitId).map(t=>t.id).join(','),'word:w1,word:w2');
  for(const phase of ['break','finished'])assert.equal(pending({rounds:[{...round,phase}]},unitId).length,0);
  assert.equal(pending({rounds:[],plan:{rounds:[round]}},unitId).length,0);
  assert.equal(pending({rounds:[round,{...round,targets:[review]}]},unitId).map(t=>t.id).join(','),'word:w2');
 }finally{dom.window.close();}
});

test('saved completion removes a target only with the matching event and new-word credit',()=>{
 const dom=setup(),pending=dom.window.Markers.pendingPomodoroTargets;
 try{
  const round={phase:'learning',targets:[word,review],items:[{id:word.eventId,newWord:false},{id:'word:w2',newWord:true}]};
  assert.equal(pending({rounds:[round]},unitId).length,2);
  round.items[0].newWord=true;assert.equal(pending({rounds:[round]},unitId)[0].id,review.id);
  round.items.push({eventId:review.eventId,newWord:false});assert.equal(pending({rounds:[round]},unitId).length,0);
 }finally{dom.window.close();}
});

test('iframe markers update and disappear without replacing the editor or its focus',()=>{
 const dom=setup(),w=dom.window,node=w.document.querySelector('#node'),input=node.firstChild,mark=w.Markers.markPomodoroNode;
 try{
  input.focus();input.setSelectionRange(2,2);mark(node,word);const marker=node.lastChild;
  mark(node,word,true);assert.equal(node.lastChild,marker);assert.ok(marker.classList.contains('is-paused'));
  assert.equal(w.document.querySelectorAll('#english-pomo-marker-style').length,1);
  mark(node,null);assert.equal(node.children.length,1);assert.equal(node.firstChild,input);assert.equal(input.value,'draft');assert.equal(input.selectionStart,2);assert.equal(w.document.activeElement,input);
 }finally{w.close();}
});
