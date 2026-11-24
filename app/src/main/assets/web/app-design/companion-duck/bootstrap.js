const params=new URLSearchParams(location.search);
let realtime=params.get('realtime')==='1';
if(!params.has('legacy')&&!realtime){try{realtime=(await window.GrowingRealtime.settingsInfo()).configured===true;}catch{}}
try {
  if(realtime)await import('./classroom.js?studentUi=20261124-duck-loading-1');else await import('./companion.js?studentUi=20261121-shared-ai-only-1');
} catch(error) {
  console.error('Duck initialization failed:',error);
  const notice=document.querySelector('#voice-notice');
  if(notice)notice.textContent='课堂初始化失败：'+error.message+'。请刷新页面重试。';
}
