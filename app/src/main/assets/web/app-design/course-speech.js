/* All course narration uses packaged MP3 files, with no device speech dependency. */
(()=>{
 'use strict';
 window.GrowingCourseSpeech={create({assets={},onStatus,label='老师讲解'}){
  let audio=null,token=0;
  function stop(){token++;if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}}
  function play(n,{rate=1}={}){
   stop();const id=token,entry=assets[n.id];
   if(!entry){onStatus('这段内置音频暂未加载，请刷新课程后重试。');return;}
   const a=new Audio(new URL(entry.file,document.baseURI).href);audio=a;a.preload='auto';
   a.playbackRate=Number.isFinite(rate)?Math.max(.5,Math.min(1.5,rate)):1;a.preservesPitch=true;
   const failed=()=>{if(id!==token||audio!==a)return;audio=null;onStatus('内置音频未能播放，请重新加载课程后再试。');};
   a.onplaying=()=>{if(id===token&&audio===a)onStatus('正在播放内置'+label+'，无需浏览器语音服务。');};
   a.onended=()=>{if(id===token&&audio===a){audio=null;onStatus('播放已结束，可以继续学习。');}};
   a.onerror=failed;onStatus('正在加载内置'+label+'音频…');
   try{const p=a.play();p?.catch(e=>{if(id!==token||audio!==a)return;if(e.name==='NotAllowedError'){audio=null;onStatus('播放被设备暂停，请再次点击播放按钮。');}else failed();});}catch{failed();}
  }
  return {play,stop};
 }};
})();
