/* Standalone home menu. Account shells and Android already provide their own menu. */
(()=>{
  'use strict';
  const button=document.getElementById('open-home-settings');
  if(!button)return;
  let shell=false;try{shell=window.top!==window&&!!window.top.GrowingCloud;}catch{}
  if(window.GrowingNative||shell){button.closest('.home-settings-entry').remove();return;}
  const resources=new URL('./',document.currentScript.src),entry=button.closest('.home-settings-entry');
  entry.innerHTML='<details id="home-account-menu"><summary id="open-home-settings" aria-label="设置" title="设置"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></summary><div class="home-menu-panel"><a data-home-rankings>我的排行榜</a><button type="button" data-home-calendar>学习日历</button><a data-home-account>云账号</a><p role="status"></p></div></details>';
  const menu=entry.querySelector('details'),toggle=menu.querySelector('summary'),status=entry.querySelector('[role=status]');
  const account=new URL('/?legacy=1',location.href);
  // The static course preview runs separately from the local account application.
  if(['localhost','127.0.0.1'].includes(location.hostname)&&location.port==='8796')account.port='8791';
  entry.querySelector('[data-home-account]').href=account.href;
  account.hash='my-rankings';entry.querySelector('[data-home-rankings]').href=account.href;
  document.addEventListener('click',event=>{if(!entry.contains(event.target))menu.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;toggle.focus();}});
  let calendarLoad;
  entry.querySelector('[data-home-calendar]').addEventListener('click',async()=>{
    status.textContent='';
    try{
      if(!window.GrowingLearningCalendar){
        if(!calendarLoad)calendarLoad=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('learning-calendar.js',resources);script.onload=resolve;script.onerror=()=>{script.remove();calendarLoad=null;reject(Error('日历加载失败，请重试。'));};document.head.append(script);});
        await calendarLoad;
      }
      menu.open=false;await window.GrowingLearningCalendar.open();
    }catch(error){status.textContent=error.message;menu.open=true;}
  });
})();
