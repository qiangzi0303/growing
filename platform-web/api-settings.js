/* Account-level connection settings remain available outside every course iframe. */
(()=>{
  'use strict';
  const menu=document.querySelector('#account-menu'),identity=document.querySelector('#account-identity');
  function entry(id,label){
    const button=document.getElementById(id)||document.createElement('button');
    button.id=id;button.type='button';button.textContent=label;
    button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','api-settings-dialog');
    if(!button.isConnected)identity.after(button);return button;
  }
  const button=entry('open-api-settings','DeepSeek 密钥设置'),voiceButton=entry('open-voice-settings','语音 Key 设置');
  const dialog=document.createElement('dialog');dialog.id='api-settings-dialog';dialog.setAttribute('aria-labelledby','api-settings-title');
  dialog.innerHTML='<div class="actions api-settings-heading"><h2 id="api-settings-title">AI 密钥设置</h2><button type="button" id="close-api-settings" autofocus>关闭</button></div><nav class="actions api-settings-tabs" aria-label="选择密钥设置"><button type="button" data-api-tab="deepseek">DeepSeek 密钥</button><button type="button" data-api-tab="voice">语音 Key</button></nav><div id="api-settings-content"></div>';
  document.body.append(dialog);
  const content=dialog.querySelector('#api-settings-content');let loading,version=0;
  function load(){
    if(window.GrowingCourseAI)return Promise.resolve();
    if(loading)return loading;
    const path='./';
    if(!document.querySelector('[data-api-settings-style]')){
      const style=document.createElement('link');style.rel='stylesheet';style.href=path+'course-ai.css';style.dataset.apiSettingsStyle='';document.head.append(style);
    }
    loading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=path+'course-ai.js';
      script.onload=()=>window.GrowingCourseAI?resolve():reject(Error('连接设置未能加载，请重试。'));
      script.onerror=()=>{script.remove();reject(Error('连接设置加载失败，请检查网络后重新打开。'));};document.head.append(script);
    }).catch(error=>{loading=null;throw error;});return loading;
  }
  function reset(){
    version++;const panel=content.querySelector('.course-ai-settings');if(panel)window.GrowingCourseAI?.cancelTest(panel);
    content.replaceChildren();
  }
  dialog.addEventListener('close',()=>{reset();window.dispatchEvent(new Event('growing:settings-closed'));});
  dialog.querySelector('#close-api-settings').addEventListener('click',()=>dialog.close());
  function select(kind){
    const voice=kind==='voice';
    dialog.querySelector('#api-settings-title').textContent=voice?'语音 Key 设置':'DeepSeek 密钥设置';
    dialog.querySelectorAll('[data-api-tab]').forEach(tab=>tab.setAttribute('aria-pressed',tab.dataset.apiTab===kind));
    content.querySelectorAll('.course-ai-settings').forEach(panel=>{panel.hidden=panel.classList.contains('realtime-settings')!==voice;});
  }
  dialog.querySelectorAll('[data-api-tab]').forEach(tab=>tab.addEventListener('click',()=>select(tab.dataset.apiTab)));
  async function open(kind='deepseek'){
    if(menu.hidden||dialog.open)return;
    // Capture the same account-bound storage proxy used by the active classroom.
    const storage=window.GrowingCloud.storage();window.GrowingCourseAIStorage=()=>storage;
    const current=++version;menu.open=false;content.innerHTML='<p role="status">正在加载连接设置…</p>';dialog.showModal();
    try{
      await load();if(!dialog.open||current!==version)return;
      content.innerHTML=window.GrowingCourseAI.settingsMarkup();
      window.GrowingRealtime?.hydrate(content.querySelector('.realtime-settings'));
      if(window.GrowingNative){
        const test=document.createElement('button');test.type='button';test.dataset.courseAiTest='';test.textContent='测试已保存的连接';
        content.querySelector('.course-ai-status').before(test);
      }
      select(kind);
    }catch(error){if(dialog.open&&current===version)content.textContent=error.message;}
  }
  button.addEventListener('click',()=>open('deepseek'));
  voiceButton.addEventListener('click',()=>open('voice'));
  window.GrowingApiSettings={open};
  // Logout and account changes discard draft keys and abort in-flight tests.
  const close=()=>{if(dialog.open)dialog.close();reset();};
  new MutationObserver(close).observe(identity,{childList:true,subtree:true,characterData:true});
  new MutationObserver(()=>{if(menu.hidden)close();}).observe(menu,{attributes:true,attributeFilter:['hidden']});
})();
