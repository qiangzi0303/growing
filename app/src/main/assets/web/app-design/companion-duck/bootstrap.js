const params=new URLSearchParams(location.search);
let realtime=params.get('realtime')==='1';
if(!params.has('legacy')&&!realtime){try{realtime=(await (await fetch('./api/health')).json()).realtimeConfigured===true;}catch{}}
try {
  if(realtime)await import('./classroom.js');else await import('./companion.js');
} catch(error) {
  console.error('Duck initialization failed:',error);
  const notice=document.querySelector('#voice-notice');
  if(notice)notice.textContent='课堂初始化失败：'+error.message+'。请刷新页面重试。';
}
