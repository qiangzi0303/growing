/* Deterministic classroom goals; estimates organize work, never award mastery. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.GrowingCoursePomodoroPlan=factory();
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
 function order(chapter){
  const nodes=new Map(chapter.nodes.map(n=>[n.id,n])),done=new Set(),pending=new Set(),result=[];
  function visit(n){
   if(done.has(n.id))return;
   if(pending.has(n.id))throw Error('知识点先修关系存在循环，请先核对课程');
   pending.add(n.id);
   for(const edge of chapter.edges||[])if(edge.to===n.id&&nodes.has(edge.from))visit(nodes.get(edge.from));
   pending.delete(n.id);done.add(n.id);result.push(n);
  }
  chapter.nodes.forEach(visit);return result;
 }
 function build(chapter,subject,questionsForNode,{legacy=false}={}){
  if(!['math','physics'].includes(subject))throw Error('番茄计划暂不支持此学科');
  if(!chapter||!chapter.id?.startsWith(subject+'-')||!Array.isArray(chapter.nodes)||!chapter.nodes.length||typeof questionsForNode!=='function')throw Error('单元内容未完整加载，暂不能安排番茄');
  if(chapter.nodes.some(n=>!n.id||!n.title)||new Set(chapter.nodes.map(n=>n.id)).size!==chapter.nodes.length)throw Error('单元知识点信息不完整');
  const nodes=order(chapter),byId=new Map(nodes.map(n=>[n.id,n])),bank=new Map(),allIds=new Set(),work=[];
  const task=(kind,n,title,goal,tab,questionIds,minutes)=>({kind,nodeId:n.id,title,goal,tab,questionIds,minutes});
  const questionMinutes=q=>q.type==='solution'?(q.level==='comprehensive'?(legacy?10:8):(legacy?8:6)):q.level==='improved'?(legacy?3:2):(legacy?2:1);
  function practice(n,qs,group){
   const numbers=group.map(q=>qs.indexOf(q)+1);
   return task('practice',n,n.title+' · 第 '+numbers.join('、')+' 题','完成第 '+numbers.join('、')+' 题并订正通过；说明理由'+(subject==='physics'?'，写清适用条件与单位。':'。'),'practice',group.map(q=>q.id),group.reduce((sum,q)=>sum+questionMinutes(q),0));
  }
  for(const n of nodes){
   const qs=questionsForNode(n,subject);
   if(!Array.isArray(qs)||qs.length!==10||qs.some(q=>!q.id||allIds.has(q.id))||new Set(qs.map(q=>q.id)).size!==10)throw Error('“'+n.title+'”的十题练习不完整或题号重复');
   qs.forEach(q=>allIds.add(q.id));bank.set(n.id,qs);
   const steps=(n.steps||[]).map(clean).filter(Boolean),point=steps[0]||clean(n.criterion)||clean(n.review)||n.title;
   const study=Math.min(12,5+steps.length+Math.floor(clean(n.example).length/160));
   work.push(task('learn',n,'理解 · '+n.title,'结合讲解与例子说明：'+point,'learn',[],study));
   work.push(task('recall',n,'复述 · '+n.title,'合上讲解，说明“'+n.title+'”的条件、方法并举例；有效评分至少 8 分且无核心错误。','recall',[],legacy?4:3));
   let group=[],minutes=0;
   function flush(){if(!group.length)return;work.push(practice(n,qs,group));group=[];minutes=0;}
   for(const q of qs){
    // Short concept choices are grouped; written reasoning keeps a separate time allowance.
    const duration=questionMinutes(q);
    if(q.type==='solution'){flush();group=[q];minutes=duration;flush();continue;}
    if(group.length===(legacy?3:6)||minutes+duration>6)flush();
    group.push(q);minutes+=duration;
   }
   flush();
  }
  const plans=[],taught=[],assigned=new Set();
  function review(n,minutes,entry=false){
   const choices=bank.get(n.id).filter(q=>q.type!=='solution'&&assigned.has(q.id));
   const ids=choices.length?[choices[0].id,...(legacy&&choices.length>1?[choices.at(-1).id]:[])]:[];
   const point=clean(n.steps?.[0]||n.criterion||n.review||n.title);
   return task('review',n,(entry?'入门回忆 · ':'复习 · ')+n.title,entry?'先尝试回忆并口述：'+point+'；不确定的地方对照讲解补齐。':ids.length?'重新作答指定旧题并订正通过，回忆“'+n.title+'”的条件与易错点。':'合上讲解重新说明：'+point+'；复述评分至少 8 分且无核心错误。',entry?'learn':ids.length?'practice':'recall',ids,minutes);
  }
  function push(tasks,recap=false){
   const index=plans.length,id=chapter.id+(legacy?':p1:':':p2:')+(index+1),focus=tasks.filter(t=>t.kind!=='review'),names=[...new Set((focus.length?focus:tasks).map(t=>byId.get(t.nodeId).title))];
   const title=(recap?'综合复习 · ':'')+names.join('、');
   function questionRange(group,nodeId){
    const qs=bank.get(nodeId),numbers=group.flatMap(t=>t.questionIds).map(id=>qs.findIndex(q=>q.id===id)+1).sort((a,b)=>a-b),ranges=[];
    for(let i=0;i<numbers.length;i++){const start=numbers[i];while(i+1<numbers.length&&numbers[i+1]===numbers[i]+1)i++;ranges.push(start===numbers[i]?String(start):start+'–'+numbers[i]);}
    return ranges.join('、');
   }
   const goals=[...new Set(focus.map(t=>t.nodeId))].map(nodeId=>{
    const group=focus.filter(t=>t.nodeId===nodeId),name='“'+byId.get(nodeId).title+'”',numbers=questionRange(group,nodeId),explain=group.some(t=>t.kind==='learn'||t.kind==='recall');
    return (explain?'说明'+name+'的条件与方法':'运用'+name)+(numbers?'，完成第 '+numbers+' 题并订正':'');
   });
   const goal=focus.length?'先复习，再'+goals.join('；')+'。'+(recap?'最后回顾本单元重点。':''):'回顾“'+names[0]+'”'+(names.length>1?'等 '+names.length+' 个知识点':'')+'，完成 '+tasks.reduce((sum,t)=>sum+t.questionIds.length,0)+' 道复习题并订正。';
   plans.push({id,title,goal,minutes:tasks.reduce((sum,t)=>sum+t.minutes,0),recap,tasks:tasks.map((t,i)=>({...t,id:id+':task:'+(i+1)}))});
  }
  while(work.length){
   // Alternate the immediately preceding content with an earlier topic for spaced recall.
   const previous=taught.length?(plans.length%2?taught.at(-1):taught[Math.floor(plans.length/2)%taught.length]):nodes[0];
   const reviewMinutes=legacy?4:2,tasks=[review(previous,reviewMinutes,!taught.length)];let budget=25-reviewMinutes;
   while(work.length){
    const next=work[0];
    if(next.minutes<=budget){tasks.push(work.shift());budget-=next.minutes;continue;}
    if(!legacy&&next.kind==='practice'&&next.questionIds.length>1){
     const n=byId.get(next.nodeId),qs=bank.get(n.id),group=next.questionIds.map(id=>qs.find(q=>q.id===id));let count=0,used=0;
     while(count<group.length&&used+questionMinutes(group[count])<=budget)used+=questionMinutes(group[count++]);
     if(count){tasks.push(practice(n,qs,group.slice(0,count)));work[0]=practice(n,qs,group.slice(count));}
    }
    break;
   }
   push(tasks);
   for(const t of tasks){if(t.kind==='learn'&&!taught.some(n=>n.id===t.nodeId))taught.push(byId.get(t.nodeId));if(t.kind==='practice')t.questionIds.forEach(id=>assigned.add(id));}
  }
  // Reuse spare time in the last round before adding a full-unit recap round.
  if(legacy){for(let i=0;i<nodes.length;i+=5)push(nodes.slice(i,i+5).map(n=>review(n,4)),true);}
  else{
   const recap=nodes.map(n=>review(n,2)),last=plans.pop();
   let tasks=last.tasks.map(({id,...task})=>task),minutes=last.minutes;
   while(recap.length){
    if(minutes+recap[0].minutes>25){push(tasks,tasks.some(t=>t.recap));tasks=[];minutes=0;}
    const next={...recap.shift(),recap:true};tasks.push(next);minutes+=next.minutes;
   }
   if(tasks.length)push(tasks,true);
  }
  return plans;
 }
 return {build};
});
