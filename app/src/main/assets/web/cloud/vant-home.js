/* Vue/Vant home menu. All business actions keep their existing account boundaries. */
(()=>{
  'use strict';
  if(new URLSearchParams(location.search).get('ui')==='legacy')return;
  const source=new URL(document.currentScript.src),resources=source.pathname.includes('/app-design/')?new URL('./',source):window.GrowingNative?new URL('../app-design/',source):new URL('/learn/app-design/',source);
  const loads=new Map();let current,pending,failed,generation=0,disposed=false;
  const assetUrl=name=>{const url=new URL(name,resources);url.searchParams.set('studentUi','20261112-vant-style-4');return url;};
  function load(name,kind='script'){
    if(loads.has(name))return loads.get(name);
    const promise=new Promise((resolve,reject)=>{
      const el=document.createElement(kind==='style'?'link':'script');
      if(kind==='style'){el.rel='stylesheet';el.href=assetUrl(name);}else el.src=assetUrl(name);
      el.onload=resolve;el.onerror=()=>{el.remove();loads.delete(name);reject(Error('新菜单加载失败，可继续使用当前菜单。'));};document.head.append(el);
    });loads.set(name,promise);return promise;
  }
  const own=()=>document.querySelector('.home');
  function context(){
    if(disposed||window.GrowingStudentPlatform?.navigationActive)return null;
    const menu=document.querySelector('#account-menu');
    if(window.GrowingCloud){
      const frame=document.querySelector('#course');let doc;
      try{doc=frame?.contentDocument;}catch{return null;}
      if(!menu||menu.hidden||!doc?.location.pathname.endsWith('/app-design/index.html'))return null;
      return {legacy:menu,doc,identity:document.querySelector('#account-identity')?.textContent||'',rankings:!document.querySelector('#my-rankings')?.hidden,device:!!document.querySelector('#open-device-settings')};
    }
    if(window.GrowingNative){
      if(!own()||!menu||menu.hidden||window.GrowingNative.configureDevice&&!document.querySelector('#open-device-settings'))return null;
      return {legacy:menu,doc:document,identity:document.querySelector('#account-identity')?.textContent||'',rankings:!document.querySelector('#my-rankings')?.hidden,device:!!document.querySelector('#open-device-settings')};
    }
    const nav=own()?.querySelector('.home-settings-entry:not([data-vant-home-root])');
    return nav?{legacy:nav,doc:document,identity:'',standalone:true}:null;
  }
  const same=(a,b)=>!!a&&!!b&&a.legacy===b.legacy&&a.doc===b.doc&&a.identity===b.identity&&a.rankings===b.rankings&&a.device===b.device;
  function teardown(){
    if(current){current.app.destroy();current.legacy.style.display=current.display;current.root.remove();current=null;}
    pending=null;
  }
  function adapter(ctx,version){
    const store=window.GrowingCloud?window.GrowingCloud.storage():localStorage,nativeIdentity=window.GrowingNative?.identityAccount?.();
    const active=()=>{if(version!==generation||!same(context(),ctx)||nativeIdentity&&window.GrowingNative.identityAccount()!==nativeIdentity)throw Error('学习会话已退出或变更，请重新打开菜单。');};
    const configured=fn=>(...args)=>{active();const previous=window.GrowingCourseAIStorage;window.GrowingCourseAIStorage=()=>store;try{return fn(...args);}finally{if(previous===undefined)delete window.GrowingCourseAIStorage;else window.GrowingCourseAIStorage=previous;}};
    const click=id=>()=>{active();const button=document.getElementById(id);if(!button||button.hidden)throw Error('当前账号无法使用此功能。');button.click();};
    const actions={};
    if(ctx.standalone){
      const account=new URL('/?legacy=1',location.href);account.searchParams.set('ui','vant');
      if(['localhost','127.0.0.1'].includes(location.hostname)&&location.port==='8796')account.port='8791';
      actions.account=()=>{active();location.assign(account.href);};
      actions.rankings=()=>{active();account.hash='my-rankings';location.assign(account.href);};
    }else{
      for(const [action,id] of Object.entries({rankings:'my-rankings',device:'open-device-settings',logout:'logout'}))if(document.getElementById(id)&&!document.getElementById(id).hidden)actions[action]=click(id);
      const learning=document.querySelector('[data-account-view=settings]');
      if(learning&&!learning.hidden)actions.learningSettings=()=>{active();learning.click();};
    }
    const ai=window.GrowingCourseAI,voice=window.GrowingRealtime;
    async function calendarAssets(){
      await Promise.all([window.GrowingCurriculum||load('curriculum.js'),window.GrowingUnitCalendar||load('unit-calendar.js'),window.GrowingHandwriting||load('handwriting-core.js')]);active();
    }
    return {
      identity:ctx.identity,actions,
      deepseek:{info:configured(()=>ai.info()),save:configured(values=>ai.save(values)),clear:configured(()=>ai.clear()),test:configured(async signal=>{await ai.request({task:'只回复“连接成功”。',signal});active();})},
      voice:{info:configured(async signal=>{const info=await (voice.settingsInfo?voice.settingsInfo({signal}):voice.info());active();return info;}),save:configured(values=>voice.save(values)),clear:configured(()=>voice.clear()),voices:voice.voices,test:configured(async signal=>{await voice.connectionInfo({signal});active();})},
      calendar:{
        async units(){await calendarAssets();return Object.values(window.GrowingCurriculum).flatMap(subject=>Object.values(subject.terms).filter(term=>term.verified).flatMap(term=>term.units.map(unit=>({id:unit.id,label:`${subject.name} · ${term.name} · ${unit.number} ${unit.title}`}))));},
        async read(unit){await calendarAssets();const topics=Object.entries(window.GrowingHandwriting.knowledgeNodes).map(([id,title])=>({id,title,unitId:window.GrowingHandwriting.nodeUnit(id)}));return window.GrowingUnitCalendar.collect(unit,key=>{active();const raw=store.getItem(key);return raw===null?null:JSON.parse(raw);},topics);}
      }
    };
  }
  async function reconcile(){
    const ctx=context();
    if(!ctx){if(current||pending){generation++;teardown();}failed=null;return;}
    if(same(current,ctx)||same(pending,ctx)||same(failed,ctx))return;
    generation++;teardown();pending=ctx;const version=generation;
    document.querySelector('[data-vant-load-error]')?.remove();
    try{
      await Promise.all([window.GrowingVantHome||load('vendor/learning-ui/learning-ui.js'),load('vendor/learning-ui/learning-ui.css','style'),window.GrowingCourseAI||load('course-ai.js?v=unified-account-1')]);
      if(version!==generation||!same(context(),ctx))return;
      const root=document.createElement(ctx.standalone?'nav':'span');root.dataset.vantHomeRoot='';root.setAttribute('aria-label','首页设置');if(ctx.standalone)root.className='vant-sample-entry';
      ctx.legacy.after(root);
      let app;try{app=window.GrowingVantHome.mount(root,adapter(ctx,version));}catch(error){root.remove();throw error;}
      const display=ctx.legacy.style.display;ctx.legacy.style.display='none';ctx.legacy.open=false;
      current={...ctx,root,app,display};pending=null;failed=null;
    }catch(error){
      if(version!==generation||!same(context(),ctx))return;
      pending=null;failed=ctx;
      const message=document.createElement('p');message.dataset.vantLoadError='';message.setAttribute('role','status');message.textContent=error.message+' ';
      const retry=document.createElement('button');retry.type='button';retry.textContent='重试新菜单';retry.onclick=()=>{failed=null;message.remove();reconcile();};message.append(retry);ctx.legacy.after(message);
    }
  }
  const observer=new MutationObserver(()=>reconcile());
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('growing:course-ready',reconcile);
  window.addEventListener('pagehide',()=>{disposed=true;generation++;observer.disconnect();window.removeEventListener('growing:course-ready',reconcile);teardown();});
  window.addEventListener('pageshow',event=>{if(event.persisted&&disposed){disposed=false;observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});window.addEventListener('growing:course-ready',reconcile);reconcile();}});
  reconcile();
})();
