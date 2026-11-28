const clamp=n=>Math.max(0,Math.min(1,n));

// A complete local Blob is seekable even on static/offline hosts without Range
// responses. Each short MP3 is downloaded once and released with its component.
export function createProofAudioSource(audio,{fetchFile=fetch,createURL=URL.createObjectURL,revokeURL=URL.revokeObjectURL}={}){
 const src=audio.src,abort=new AbortController();let url='',pending=null,disposed=false;
 return {
  prepare(){
   if(disposed)return Promise.reject(new Error('Audio source disposed'));
   if(url)return Promise.resolve();
   if(!pending)pending=(async()=>{
    try{
     const response=await fetchFile(src,{signal:abort.signal});
     if(!response.ok)throw new Error('Narration download failed');
     const blob=await response.blob();
     if(disposed)return;
     url=createURL(blob);audio.src=url;audio.load();
    }finally{pending=null;}
   })();
   return pending;
  },
  dispose(){disposed=true;abort.abort();if(url)revokeURL(url);url='';}
 };
}

export function proofTimeline(entry){
 const starts=[0,1,2,3].map(stage=>entry.cues.find(c=>c.stage===stage).start);
 const ends=[...starts.slice(1),entry.duration];
 return {
  timeAt(progress){const p=clamp(progress),stage=Math.min(3,Math.floor(p*4));return starts[stage]+(p*4-stage)*(ends[stage]-starts[stage]);},
  progressAt(time){const t=Math.max(0,Math.min(entry.duration,time)),stage=Math.max(0,starts.findLastIndex(start=>t>=start));return (stage+(t-starts[stage])/(ends[stage]-starts[stage]))/4;},
  captionAt(time){return entry.cues.findLast(c=>time>=c.start)?.text||entry.cues[0].text;}
 };
}

// The media clock owns narrated playback. A stalled audio download must never
// advance the diagram or captions. Silent playback retains the original pace.
export function createProofPlayback({audio,entry,onChange,prepareAudio=()=>{},releaseAudio=()=>{},events=window,raf=requestAnimationFrame,caf=cancelAnimationFrame}){
 const timeline=proofTimeline(entry);
 let progress=0,playing=false,loading=false,voice=true,error='',frame=0,last=null,token=0,disposed=false,announcing=false;
 const emit=()=>onChange({progress,playing,loading,voice,error,caption:timeline.captionAt(timeline.timeAt(progress))});
 function pause(){token++;playing=false;loading=false;caf(frame);frame=0;last=null;audio.pause();emit();}
 function position(){if(audio.readyState>0)audio.currentTime=timeline.timeAt(progress);}
 function seek(p){pause();progress=clamp(Number(p));position();emit();}
 function tick(now){
  if(!playing||disposed)return;
  if(voice)progress=timeline.progressAt(audio.currentTime);
  else if(last!==null)progress=clamp(progress+Math.min(.1,(now-last)/1000)/28);
  last=now;emit();
  if(progress>=1){pause();return;}
  frame=raf(tick);
 }
 function fail(){if(!playing||!voice||disposed)return;pause();error='语音暂时无法播放，请重试，或关闭语音继续看字幕。';emit();}
 function startFrames(){
  if(!playing||disposed||!voice)return;
  loading=false;caf(frame);frame=raf(tick);emit();
 }
 function ended(){if(!playing||!voice)return;progress=1;pause();}
 function waiting(){if(playing&&voice){loading=true;emit();}}
 function interrupted(){if(!announcing)pause();}
 function announce(){
  announcing=true;
  try{events.dispatchEvent(new Event('duck:stop-course-audio'));events.dispatchEvent(new Event('duck:course-audio-start'));}
  finally{announcing=false;}
 }
 async function play(){
  if(disposed)return;
  if(playing){pause();return;}
  if(progress>=1)progress=0;
  error='';announce();playing=true;loading=voice;last=null;const id=++token;emit();
  if(!voice){frame=raf(tick);return;}
  try{
   await prepareAudio();
   if(id!==token||disposed)return;
   if(audio.error)audio.load();
   position();
   await audio.play();
   // A paused/seeked/unmounted pending play must not restart the story.
   if(id!==token||disposed)return;
   startFrames();
  }catch{if(id===token&&!disposed)fail();}
 }
 function setVoice(enabled){pause();voice=Boolean(enabled);error='';emit();}
 const listeners={loadedmetadata:position,playing:startFrames,ended,error:fail,waiting,stalled:waiting};
 for(const [name,handler] of Object.entries(listeners))audio.addEventListener(name,handler);
 for(const name of ['duck:stop-course-audio','duck:course-audio-start'])events.addEventListener(name,interrupted);
 function dispose(){
  pause();disposed=true;
  for(const [name,handler] of Object.entries(listeners))audio.removeEventListener(name,handler);
  for(const name of ['duck:stop-course-audio','duck:course-audio-start'])events.removeEventListener(name,interrupted);
  audio.removeAttribute('src');audio.load();releaseAudio();
 }
 emit();return {play,pause,seek,setVoice,dispose};
}
