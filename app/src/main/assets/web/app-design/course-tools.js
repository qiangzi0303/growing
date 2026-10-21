/* Course-local calendar, conversations and review records. No reward rules are changed. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingCourseTools=factory();})(globalThis,()=>{
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const empty=()=>({version:1,days:{},mastery:{},doubts:{}});
  function day(at=Date.now()){const d=new Date(at);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:null;}
  const count=x=>Number.isFinite(x)&&x>=0?x:0;
  function restore(raw){
    if(raw==null)return empty();
    if(raw.version!==1||!raw.days||!raw.mastery||!raw.doubts)throw Error('学习日历与答疑记录格式不匹配，原记录已保留。');
    const data=empty();
    for(const [date,topics] of Object.entries(raw.days))if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&topics&&typeof topics==='object'){
      data.days[date]={};
      for(const [id,r] of Object.entries(topics))if(r&&typeof r==='object')data.days[date][id]={reads:count(r.reads),grades:count(r.grades),practice:count(r.practice),special:count(r.special),correct:count(r.correct),total:count(r.total),best:Math.min(10,count(r.best)),ms:count(r.ms)};
    }
    for(const [id,date] of Object.entries(raw.mastery))if(date===null||/^\d{4}-\d{2}-\d{2}$/.test(date))data.mastery[id]=date;
    for(const [id,r] of Object.entries(raw.doubts))if(r&&typeof r==='object')data.doubts[id]={draft:typeof r.draft==='string'?r.draft.slice(0,2000):'',messages:Array.isArray(r.messages)?r.messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string').map(m=>({role:m.role,text:m.text.slice(0,12000),at:typeof m.at==='string'?m.at:''})).slice(-100):[]};
    return data;
  }
  function log(data,id,event,at=Date.now()){
    const date=day(at);if(!date)throw Error('学习日期无效');
    const topics=data.days[date]||(data.days[date]={});
    const r=topics[id]||(topics[id]={reads:0,grades:0,practice:0,special:0,correct:0,total:0,best:0,ms:0});
    if(event.kind==='read')r.reads++;
    if(event.kind==='grade'){r.grades++;r.best=Math.max(r.best,count(event.score));}
    if(event.kind==='practice'||event.kind==='special'){r[event.kind]++;r.correct+=count(event.correct);r.total+=count(event.total);}
    if(event.kind==='time')r.ms+=count(event.ms);
    if(event.mastered&&!Object.hasOwn(data.mastery,id))data.mastery[id]=date;
    return data;
  }
  function reset(data,ids){
    const next=clone(data),targets=new Set(ids);
    for(const topics of Object.values(next.days))for(const id of targets)delete topics[id];
    for(const date of Object.keys(next.days))if(!Object.keys(next.days[date]).length)delete next.days[date];
    for(const id of targets){delete next.mastery[id];delete next.doubts[id];}
    return next;
  }
  function totals(data,date,ids){const targets=new Set(ids),rows=Object.entries(data.days[date]||{}).filter(([id])=>targets.has(id)).map(([,r])=>r);return {ms:rows.reduce((n,r)=>n+r.ms,0),grades:rows.reduce((n,r)=>n+r.grades,0),practice:rows.reduce((n,r)=>n+r.practice,0),special:rows.reduce((n,r)=>n+r.special,0),newCount:Object.entries(data.mastery).filter(([id,d])=>targets.has(id)&&d===date).length};}
  function format(ms){const s=Math.floor(ms/1000);return s<60?s+'秒':s<3600?Math.floor(s/60)+'分'+s%60+'秒':Math.floor(s/3600)+'小时'+Math.floor(s%3600/60)+'分';}
  return {empty,restore,day,log,reset,totals,format};
});
