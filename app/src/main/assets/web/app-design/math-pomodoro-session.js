/* Mathematics timers share the existing account-scoped course document. */
(()=>{
 'use strict';
 const W=window,KEY='growing-math-lessons-v1',object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 W.GrowingMathPomodoroSession={create({unitId,storage,active,now=()=>Date.now()}){
  const P=W.GrowingMathPomodoro;
  let cached={rounds:[]},error='',retryAction=null;
  const pending=[];
  function guard(){if(active()===false)throw Error('学习会话已退出，请重新进入课堂');}
  function read(){
   guard();const text=storage.getItem(KEY),data=text==null?{version:1,topics:{}}:JSON.parse(text);
   if(!object(data)||data.version!==1||!object(data.topics))throw Error('原课堂记录格式错误，已停止覆盖');
   if(data.pomodoro!==undefined&&!object(data.pomodoro))throw Error('番茄记录格式错误，已停止覆盖');
   for(const [id,state] of Object.entries(data.pomodoro||{}))P.restore(state,id);
   return data;
  }
  const last=s=>s.rounds.at(-1);
  const stamp=s=>JSON.stringify(s.rounds.map(r=>[r.id,r.phase,r.pausedAt,r.items]));
  function write(data){guard();storage.setItem(KEY,JSON.stringify(data));cached=data.pomodoro[unitId];}
  function model(){
   try{guard();const data=read();cached=P.advance(data.pomodoro?.[unitId],unitId,now());}
   catch(e){error='番茄记录未保存：'+e.message;}
   return {...cached,error};
  }
  function capture(){
   try{const data=read(),r=last(P.advance(data.pomodoro?.[unitId],unitId,now()));return r?.phase==='learning'&&r.pausedAt===null?r.id:null;}
   catch(e){error='番茄记录未保存：'+e.message;return null;}
  }
  function change(method,options){
   try{
    const data=read(),at=now(),map={...data.pomodoro};
    if(method==='start'||method==='resume')for(const id of Object.keys(map)){
     if(id===unitId)continue;const other=P.advance(map[id],id,at);
     map[id]=last(other)?.phase==='learning'?P.pause(other,id,at):other;
    }
    map[unitId]=P[method](map[unitId],unitId,at,options);data.pomodoro=map;write(data);
    retryAction=null;error='';return true;
   }catch(e){error='番茄记录未保存：'+e.message;retryAction=()=>change(method,options);return false;}
  }
  function commitItems(){
   if(!pending.length)return true;
   try{
    const data=read();let state=data.pomodoro?.[unitId],changed=false;
    for(const job of pending){
     const r=P.restore(state,unitId).rounds.find(r=>r.id===job.roundId);
     if(!r)throw Error('原番茄记录已变更，请重新进入课堂');
     const before=r.items.find(i=>i.id===job.item.id);
     if(before?.updatedAt>job.at)continue;
     if(before&&Object.keys(job.item).every(key=>before[key]===job.item[key]))continue;
     const wasIncorrect=P.restore(state,unitId).rounds.filter(previous=>previous.index<=r.index).some(previous=>previous.items.some(i=>i.id===job.item.id&&(i.hadIncorrect||i.status==='incorrect')));
     let item={...job.item,updatedAt:job.at,hadIncorrect:wasIncorrect||job.item.status==='incorrect'};
     if(item.status==='correct'&&(item.hadIncorrect||before?.status==='corrected'))item.status='corrected';
     state=P.record(state,unitId,job.at,item,job.roundId);
     changed=true;
    }
    if(changed){data.pomodoro={...data.pomodoro,[unitId]:state};write(data);}pending.length=0;if(!retryAction)error='';return true;
   }catch(e){error='番茄学习记录未保存：'+e.message;return false;}
  }
  function record(item,roundId=capture(),at=now()){
   if(!roundId)return;
   try{guard();}catch{return;}
   pending.push({item,roundId,at});commitItems();
  }
  function tick(){
   try{
    guard();if(pending.length&&!commitItems())return;
    const data=read(),raw=data.pomodoro?.[unitId],before=P.restore(raw,unitId),after=P.advance(raw,unitId,now());
    if(stamp(before)!==stamp(after)){data.pomodoro={...data.pomodoro,[unitId]:after};write(data);}
    cached=after;if(!retryAction)error='';
   }catch(e){error='番茄记录未保存：'+e.message;}
  }
  function retry(){if(retryAction&&!retryAction())return;commitItems();tick();}
  return {model,capture,change,record,tick,retry};
 }};
})();
