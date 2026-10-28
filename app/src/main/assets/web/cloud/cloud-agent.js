/* Course writes queue an automatic server save. Restore happens before opening native lessons. */
(()=>{
  'use strict';
  if(!window.GrowingNative)return;
  if(window.top!==window){for(const name of ['pointerdown','keydown','touchstart'])document.addEventListener(name,()=>window.top.GrowingCloudActivity?.(location.href),{passive:true});window.addEventListener('growing-storage-change',event=>window.top.dispatchEvent(new window.top.CustomEvent('growing-storage-change',{detail:event.detail})));return;}
  if(location.pathname.includes('/cloud/'))return;
  const raw=window.localStorage,base=String(GrowingNative.cloudApiUrl?.()||'').replace(/\/$/,'');
  if(!base)return;
  let session;try{session=JSON.parse(raw.getItem('growing-cloud-session-v1')||'null');}catch{return;}
  if(!session?.token||session.user?.role!=='Student'||raw.getItem('growing-cloud-binding-v1')!==session.user.id)return;
  const id=session.user.id,metaKey='growing-cloud-meta-v1:'+id;
  let busy=false,again=false,saveTimer,lastAction=Date.now(),lastTick=Date.now(),subject='';
  function activity(url){lastAction=Date.now();subject=/english|word-ops/.test(url)?'英语':/physics/.test(url)?'物理':/math-course|fraction-ops/.test(url)?'数学':'';}
  window.GrowingCloudActivity=activity;activity(location.href);
  for(const name of ['pointerdown','keydown','touchstart'])document.addEventListener(name,()=>activity(location.href),{passive:true});
  function tick(){
    const now=Date.now(),seconds=Math.min(15,Math.max(0,(now-lastTick)/1000));lastTick=now;
    if(document.hidden||now-lastAction>60000||!subject)return;
    let device=raw.getItem('growing-cloud-device:'+id);if(!device){device=crypto.randomUUID();raw.setItem('growing-cloud-device:'+id,device);}
    const key='growing-activity-v1:'+device,data=JSON.parse(raw.getItem(key)||'{"days":{}}'),date=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
    data.days[date]??={};data.days[date][subject]=(data.days[date][subject]||0)+seconds;raw.setItem(key,JSON.stringify(data));
  }
  async function api(path,options={}){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
    try{const response=await fetch(base+'/api'+path,{...options,signal:controller.signal,keepalive:!options.body||new TextEncoder().encode(options.body).length<60000,credentials:'omit',headers:{'Content-Type':'application/json','X-Growing-Client':'1',Authorization:'Bearer '+session.token}});
    if(!response.ok)throw Error(response.status===409?'记录冲突，请到云同步中心选择版本':response.status===401?'云登录已失效，请重新登录':'暂未同步（'+response.status+'）');
    return await response.json();}finally{clearTimeout(timeout);}
  }
  function queue(){if(busy)again=true;clearTimeout(saveTimer);saveTimer=setTimeout(sync,400);}
  async function sync(){
    if(busy){again=true;return false;}busy=true;
    try{
      const current=JSON.parse(raw.getItem('growing-cloud-session-v1')||'null');
      if(current?.token!==session.token||current?.user?.id!==id||raw.getItem('growing-cloud-binding-v1')!==id)throw Error('登录已切换，请重新进入课堂');
      const remote=Object.fromEntries((await api('/student/state')).map(r=>[r.key,r])),local={};
      for(let i=0;i<raw.length;i++){const k=raw.key(i);if(GrowingSync.allowed(k))local[k]=GrowingSync.clean(k,raw.getItem(k));}
      const meta=JSON.parse(raw.getItem(metaKey)||'{}');let pending=false;
      for(const a of GrowingSync.plan(local,remote,meta)){
        if(a.type==='push'){const saved=await api('/student/state/'+encodeURIComponent(a.key),{method:'PUT',body:JSON.stringify({value:a.value,revision:a.server.revision})});meta[a.key]={value:saved.value,revision:saved.revision};}
        else if(a.type==='same')meta[a.key]={value:a.server.value,revision:a.server.revision};
        else pending=true;
      }
      raw.setItem(metaKey,JSON.stringify(meta));return !pending;
    }catch(e){console.warn('Background save incomplete:',e.name);return false;}finally{busy=false;if(again){again=false;clearTimeout(saveTimer);saveTimer=setTimeout(sync,400);}}
  }
  window.GrowingCloudFlush=sync;
  window.addEventListener('growing-storage-change',event=>{if(event.detail?.key===null||GrowingSync.allowed(event.detail?.key||''))queue();});
  window.addEventListener('pagehide',()=>{tick();sync();});
  document.addEventListener('visibilitychange',()=>{tick();sync();});
  setInterval(()=>{try{tick();}catch(e){console.warn('Activity save incomplete:',e.name);}},10000);setInterval(sync,15000);window.addEventListener('online',sync);sync();
})();
