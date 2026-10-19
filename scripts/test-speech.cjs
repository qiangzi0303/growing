/* Run the shipped adapter with absent/broken Web Speech, then drive native callbacks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/speech-bootstrap.js'),'utf8');
for(const brokenBrowserSpeech of [false,true]) {
  const calls=[];const document=new EventTarget();document.hidden=false;
  const window=new EventTarget();
  window.GrowingSpeech={speak:(...args)=>calls.push(['speak',...args]),stop:()=>calls.push(['stop'])};
  if(brokenBrowserSpeech)window.speechSynthesis={speak:()=>{throw Error('WebView speech must not be used');}};
  vm.runInNewContext(source,{window,document,Event,EventTarget,setTimeout});
  const speech=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
  const first=new Utterance('learner');first.lang='en-GB';first.rate=.8;
  let starts=0,ends=0,error;
  first.addEventListener('start',()=>starts++);first.onend=()=>ends++;
  speech.speak(first);
  assert.equal(speech.speaking,true);
  let id=calls.at(-1)[1];assert.deepEqual(calls.at(-1).slice(2),['learner','en-GB',.8,1]);
  window.__growingSpeechEvent({id,type:'start'});assert.equal(starts,1);
  const second=new Utterance('example sentence');speech.speak(second);assert.equal(speech.pending,true);
  window.__growingSpeechEvent({id,type:'end'});assert.equal(ends,1);assert.equal(speech.pending,false);
  const secondId=calls.at(-1)[1];assert.notEqual(secondId,id);
  window.__growingSpeechEvent({id,type:'error',error:'synthesis-failed'});assert.equal(speech.speaking,true);
  second.onerror=e=>error=e.error;
  window.__growingSpeechEvent({id:secondId,type:'error',error:'language-unavailable',message:'Install English data'});
  assert.equal(error,'language-unavailable');assert.equal(speech.speaking,false);
  speech.speak(first);id=calls.at(-1)[1];speech.pause();assert.equal(speech.paused,true);
  window.__growingSpeechEvent({id,type:'end'});assert.equal(ends,1);
  speech.resume();assert.equal(speech.paused,false);assert.notEqual(calls.at(-1)[1],id);
  assert.equal(calls.at(-1)[2],'learner');
  speech.cancel();assert.equal(calls.at(-1)[0],'stop');assert.equal(speech.speaking,false);
  speech.speak(first);speech.speak(second);speech.cancel();assert.equal(speech.pending,false);
  speech.speak(first);document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(speech.speaking,false);assert.equal(calls.at(-1)[0],'stop');
  console.log(`PASS: native speech routing, callbacks, queue, errors, cancel, resume, visibility (browser speech ${brokenBrowserSpeech?'broken':'absent'})`);
}
