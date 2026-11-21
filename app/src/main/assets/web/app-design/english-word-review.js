/* Local calendar dates, independent from formal mastery scores. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingEnglishWordReview=api;})(globalThis,()=>{
 'use strict';
 const intervals=[1,3,7,14,30];
 const day=time=>{const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const later=(time,n)=>{const d=new Date(time);d.setDate(d.getDate()+n);return day(d);};
 function answer(old,correct,hinted,time){const today=day(time);
  if(!correct||hinted)return {level:0,due:later(time,1),lastDay:today,failedDay:today};
  if(old&&(old.lastDay===today||old.due>today))return {...old};
  const level=Math.min(5,(old?.level||0)+1);return {level,due:later(time,intervals[level-1]),lastDay:today};
 }
 function plan(words,records,passed,time){const today=day(time),dueIds=[],freshIds=[],scheduledIds=[],dates=[];
  for(const w of words){if(w.optional)continue;const r=records[w.id];if(r){if(r.due<=today)dueIds.push(w.id);else {scheduledIds.push(w.id);dates.push(r.due);}}else if(passed(w.id))dueIds.push(w.id);else freshIds.push(w.id);}
  return {dueIds,freshIds,scheduledIds,nextDue:dates.sort()[0]||null};
 }
 return {day,answer,plan};
});
