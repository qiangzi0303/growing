/* Native offline lessons keep saving locally. Upload only; cloud pulls happen in the sync center. */
(()=>{
  'use strict';
  if(!window.GrowingNative)return;
  if(window.top!==window){for(const name of ['pointerdown','keydown','touchstart'])document.addEventListener(name,()=>window.top.GrowingCloudActivity?.(location.href),{passive:true});return;}
  if(location.pathname.includes('/cloud/'))return;
  const raw=window.localStorage,base=String(GrowingNative.cloudApiUrl?.()||'').replace(/\/$/,'');
  if(!base)return;
  let session;try{session=JSON.parse(raw.getItem('growing-cloud-session-v1')||'null');}catch{return;}
  if(!session?.token||session.user?.role!=='Student'||raw.getItem('growing-cloud-binding-v1')!==session.user.id)return;
  const id=session.user.id,metaKey='growing-cloud-meta-v1:'+id;
  let busy=false,status='云同步待连接',lastAction=Date.now(),lastTick=Date.now(),subject='';
  function label(text){status=text;const badge=document.getElementById('growing-cloud-status');if(badge)badge.textContent=text;}
  function activity(url){lastAction=Date.now();subject=/english|word-ops/.test(url)?'英语':/physics/.test(url)?'物理':/math-course|fraction-ops/.test(url)?'数学':'';}
  window.GrowingCloudActivity=activity;activity(location.href);
  for(const name of ['pointerdown','keydown','touchstart'])document.addEventListener(name,()=>activity(location.href),{passive:true});
  function tick(){
    const now=Date.now(),seconds=Math.min(15,Math.max(0,(now-lastTick)/1000));lastTick=now;
    if(document.hidden||now-lastAction>60000||!subject)return;
    let device=raw.getItem('growing-cloud-device:'+id);if(!device){device=crypto.randomUUID();raw.setItem('growing-cloud-device:'+id,device);}
    const key='growing-activity-v1:'+device,data=JSON.parse(raw.getItem(key)||'{"days":{}}'),date=new Date().toLocaleDateString('sv-SE');
    data.days[date]??={};data.days[date][subject]=(data.days[date][subject]||0)+seconds;raw.setItem(key,JSON.stringify(data));
  }
  async function api(path,options={}){
    const response=await fetch(base+'/api'+path,{...options,credentials:'omit',headers:{'Content-Type':'application/json','X-Growing-Client':'1',Authorization:'Bearer '+session.token}});
    if(!response.ok)throw Error(response.status===409?'记录冲突，请到云同步中心选择版本':response.status===401?'云登录已失效，请重新登录':'暂未同步（'+response.status+'）');
    return response.json();
  }
  async function sync(){
    if(busy||document.hidden)return;busy=true;
    try{
      const remote=Object.fromEntries((await api('/student/state')).map(r=>[r.key,r])),local={};
      for(let i=0;i<raw.length;i++){const k=raw.key(i);if(GrowingSync.allowed(k))local[k]=GrowingSync.clean(k,raw.getItem(k));}
      const meta=JSON.parse(raw.getItem(metaKey)||'{}');let pending=false;
      for(const a of GrowingSync.plan(local,remote,meta)){
        if(a.type==='push'){const saved=await api('/student/state/'+encodeURIComponent(a.key),{method:'PUT',body:JSON.stringify({value:a.value,revision:a.server.revision})});meta[a.key]={value:saved.value,revision:saved.revision};}
        else if(a.type==='same')meta[a.key]={value:a.server.value,revision:a.server.revision};
        else pending=true;
      }
      raw.setItem(metaKey,JSON.stringify(meta));label(pending?'云端记录有变化 · 请到云同步中心处理':'云同步正常');
    }catch(e){label('本机已保存 · '+e.message);}finally{busy=false;}
  }
  const ready=()=>{const badge=document.createElement('a');badge.id='growing-cloud-status';badge.textContent=status;badge.href='/assets/web/cloud/index.html';badge.style.cssText='position:fixed;bottom:5px;right:7px;font:12px system-ui;background:#edf3e9;color:#35513d;border:1px solid #bccfb4;border-radius:7px;padding:6px 9px;z-index:9000;max-width:90vw;text-decoration:none';document.body.append(badge);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  setInterval(()=>{try{tick();}catch{}},10000);setInterval(sync,15000);window.addEventListener('online',sync);sync();
})();
