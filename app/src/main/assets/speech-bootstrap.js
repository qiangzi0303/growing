/* Course-compatible Web Speech adapter backed by Android TextToSpeech, not WebView speech. */
(() => {
  'use strict';
  if (!window.GrowingSpeech) throw new Error('Android speech bridge unavailable');
  const native=window.GrowingSpeech;
  class Utterance extends EventTarget {
    constructor(text='') {
      super();this.text=String(text);this.lang='';this.rate=1;this.pitch=1;this.volume=1;this.voice=null;
    }
  }
  const queue=[];
  let current=null,paused=false,sequence=0;
  const pageId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const event=(utterance,type,detail={})=>{
    const value=new Event(type);Object.assign(value,{utterance,...detail});
    utterance.dispatchEvent(value);
    if(typeof utterance['on'+type]==='function') {
      try{utterance['on'+type](value);}catch(error){setTimeout(()=>{throw error;},0);}
    }
  };
  const start=()=>{
    if(paused || current || !queue.length)return;
    const utterance=queue.shift();current={utterance,id:pageId+'-'+(++sequence),started:false};
    native.speak(current.id,utterance.text,utterance.lang||utterance.voice?.lang||'en-GB',Number(utterance.rate)||1,Number(utterance.pitch)||1);
  };
  const speech=new EventTarget();
  Object.assign(speech,{
    speak(utterance){if(!(utterance instanceof Utterance))throw new TypeError('Expected SpeechSynthesisUtterance');queue.push(utterance);start();},
    cancel(){
      const canceled=[...(current?[current.utterance]:[]),...queue];
      current=null;queue.length=0;paused=false;native.stop();
      canceled.forEach(u=>event(u,'error',{error:'canceled'}));
    },
    getVoices(){return [];}, // Android chooses an installed voice for the requested language.
    pause(){
      if(paused)return;paused=true;
      if(current){native.stop();current.id=null;event(current.utterance,'pause');}
    },
    resume(){
      if(!paused)return;paused=false;
      if(current){
        current.id=pageId+'-'+(++sequence);const u=current.utterance;
        // Android TTS cannot resume a stream: restart the current short course segment.
        native.speak(current.id,u.text,u.lang||u.voice?.lang||'en-GB',Number(u.rate)||1,Number(u.pitch)||1);
        event(u,'resume');
      }else start();
    },
  });
  Object.defineProperties(speech,{
    speaking:{get:()=>!!current},pending:{get:()=>queue.length>0},paused:{get:()=>paused},
  });
  Object.defineProperty(window,'__growingSpeechEvent',{value:result=>{
    if(!current || result.id!==current.id)return;
    const item=current;
    if(result.type==='start'){
      if(!item.started){item.started=true;event(item.utterance,'start');}
    }else if(result.type==='end' || result.type==='error'){
      current=null;event(item.utterance,result.type,{error:result.error,message:result.message});
      start();
    }
  }});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:Utterance,configurable:true});
  Object.defineProperty(window,'speechSynthesis',{value:speech,configurable:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)speech.cancel();});
  window.addEventListener('pagehide',()=>speech.cancel());
})();
