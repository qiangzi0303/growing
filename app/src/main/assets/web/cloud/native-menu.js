/* Account menu for top-level offline Android lessons; reuse the shell's settings and rankings. */
(()=>{
  'use strict';
  const native=window.GrowingNative;
  if(!native||window.top!==window||document.getElementById('account-menu'))return;
  const resources=new URL('./',document.currentScript.src),loaded=new Map();
  const style=name=>{const el=document.createElement('link');el.rel='stylesheet';el.href=new URL(name,resources).href;document.head.append(el);};
  function script(name){
    if(loaded.has(name))return loaded.get(name);
    const promise=new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=new URL(name,resources).href;el.onload=resolve;el.onerror=()=>{el.remove();loaded.delete(name);reject(Error('功能加载失败，请关闭后重试。'));};document.head.append(el);});
    loaded.set(name,promise);return promise;
  }
  function session(){
    const value=JSON.parse(localStorage.getItem('growing-cloud-session-v1')||'null');
    if(!value?.token||!value.user?.id||native.identityAccount&&native.identityAccount()!==value.user.id)throw Error('登录状态已失效，请重新登录。');
    return value;
  }
  let profile;try{profile=session().user;}catch{profile={displayName:'当前账号'};}
  style('native-menu.css?v=unified-account-1');
  const bar=document.createElement('header');bar.className='native-account-bar';
  bar.innerHTML=`<details id="account-menu"><summary aria-label="设置" title="设置"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></summary><div class="account-menu-panel"><p id="account-identity"></p><button id="open-api-settings" type="button">DeepSeek 密钥设置</button><button id="open-voice-settings" type="button">语音 Key 设置</button><button id="my-rankings" type="button" aria-haspopup="dialog" aria-controls="native-rankings-dialog" hidden>我的排行榜</button><button id="logout" type="button">退出云账号</button><p id="native-account-status" role="status" aria-live="polite"></p></div></details><a class="native-account-brand" href="/assets/web/app-design/index.html"><img src="${new URL('vendor/brand/logo.webp',resources).href}" width="44" height="44" alt="">逆流</a>`;
  bar.querySelector('#account-identity').textContent=profile.username||'当前账号';
  document.body.prepend(bar);
  const calendarButton=document.createElement('button');calendarButton.type='button';calendarButton.textContent='学习日历';calendarButton.id='open-learning-calendar';
  bar.querySelector('#my-rankings').after(calendarButton);
  const menu=bar.querySelector('#account-menu'),toggle=menu.querySelector('summary'),rankButton=bar.querySelector('#my-rankings'),status=bar.querySelector('#native-account-status');
  rankButton.hidden=profile.role!=='Student'||profile.roleSelectionRequired!==false;
  calendarButton.hidden=profile.role!=='Student'||profile.roleSelectionRequired!==false;
  calendarButton.addEventListener('click',async()=>{
    status.textContent='';
    try{
      if(window.GrowingCourseAccount){menu.open=false;window.GrowingCourseAccount.open('calendar');return;}
      if(!window.GrowingLearningCalendar)await script('../app-design/learning-calendar.js');
      menu.open=false;await window.GrowingLearningCalendar.open(toggle);
    }catch(error){status.textContent=error.message;menu.open=true;}
  });
  document.addEventListener('click',event=>{if(!event.target.closest('#account-menu'))menu.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;toggle.focus();}});
  const settings=script('api-settings.js?v=unified-account-1');
  settings.catch(error=>{status.textContent=error.message;});
  if(!window.GrowingInteractionSounds){const sounds=document.createElement('script');sounds.type='module';sounds.src=new URL('interaction-sounds.js',resources).href;document.head.append(sounds);}
  let dialog;
  rankButton.addEventListener('click',async()=>{
    if(dialog?.open)return;
    menu.open=false;
    if(!dialog){
      style('rankings.css');dialog=document.createElement('dialog');dialog.id='native-rankings-dialog';dialog.className='native-account-dialog';dialog.setAttribute('aria-labelledby','native-rankings-title');
      dialog.innerHTML='<div class="native-dialog-heading"><h2 id="native-rankings-title">我的排行榜</h2><button type="button" aria-label="关闭排行榜" title="关闭排行榜" style="width:44px;height:44px;padding:0;font-size:28px;line-height:1;flex:0 0 44px" autofocus>×</button></div><section data-rankings-root></section>';
      dialog.querySelector('button').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('close',()=>{dialog.querySelector('[data-rankings-root]').replaceChildren();toggle.focus();});document.body.append(dialog);
    }
    const root=document.createElement('section');dialog.querySelector('[data-rankings-root]').replaceChildren(root);root.textContent='正在读取排行榜…';dialog.showModal();
    try{
      const current=session(),base=String(native.cloudApiUrl()).replace(/\/$/,'');
      const alive=()=>{try{const latest=session();return dialog.open&&root.isConnected&&latest.token===current.token&&latest.user.id===current.user.id;}catch{return false;}};
      const api=async path=>{
        if(!alive())throw Error('登录状态已变更，请重新打开。');
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
        try{
          const response=await fetch(base+'/api'+path,{signal:controller.signal,credentials:'omit',headers:{'X-Growing-Client':'1',Authorization:'Bearer '+current.token}});
          if(!alive())throw Error('登录状态已变更，请重新打开。');
          if(!response.ok)throw Error(response.status===401?'登录已过期，请重新登录。':'排行榜暂不可用，请稍后重试。');
          return await response.json();
        }finally{clearTimeout(timer);}
      };
      if(!window.GrowingRankings)await script('rankings.js');
      if(!alive())return;
      const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      await window.GrowingRankings.mount(root,api,esc,alive,'/student/rankings','学习排行榜',()=>window.GrowingCloudFlush?.());
    }catch(error){if(dialog.open&&root.isConnected)root.textContent=error.name==='AbortError'?'读取超时，请关闭后重试。':error.message;}
  });
  bar.querySelector('#logout').addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;status.textContent='';
    try{
      if(window.GrowingCloudFlush&&await window.GrowingCloudFlush()===false)throw Error('学习记录尚未同步，请稍后重试退出。');
      const current=session(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      try{
        const response=await fetch(String(native.cloudApiUrl()).replace(/\/$/,'')+'/api/auth/logout',{method:'POST',signal:controller.signal,credentials:'omit',headers:{'X-Growing-Client':'1',Authorization:'Bearer '+current.token}});
        if(!response.ok&&response.status!==401)throw Error('暂时无法退出，请稍后重试。');
        if(session().token!==current.token)throw Error('账号已切换，请重新打开菜单。');
        localStorage.removeItem('growing-cloud-session-v1');native.logout();
      }finally{clearTimeout(timer);}
    }catch(error){status.textContent=error.name==='AbortError'?'退出超时，请检查网络后重试。':error.message;}
    finally{button.disabled=false;}
  });
})();
