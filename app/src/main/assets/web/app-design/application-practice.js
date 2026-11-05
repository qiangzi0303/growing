/* Curated application questions and exact-question links to the existing photo workspace. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./practice-math-upper.js'),require('./practice-math-lower.js'),require('./practice-physics.js'),require('./handwriting-core.js'));
  else root.GrowingApplicationPractice=factory(root.GrowingPracticeMathUpper,root.GrowingPracticeMathLower,root.GrowingPracticePhysics,root.GrowingHandwriting);
})(globalThis,(upper,lower,physics,C)=>{
  'use strict';
  const labels={basic:'基础题',improved:'提高题',hard:'难题',comprehensive:'综合应用题'};
  const levels=['basic','basic','basic','basic','basic','basic','improved','improved','hard','comprehensive'];
  const bank=subject=>subject==='physics'?physics:{...upper,...lower};
  const item=(q,id,i)=>({...q,id:id+'-application-'+(i+1),topic:id,level:levels[i],type:q.type==='solution'?'solution':'choice'});
  function questions(node,subject){
    const extra=bank(subject)?.[node.id];
    if(!extra||extra.length!==7||node.practice?.length!==3)throw Error('当前知识点的十题练习尚未完整加载，请刷新后重试。');
    return [...node.practice,...extra].map((q,i)=>item(q,node.id,i));
  }
  function tasks(subject,unit){
    if(!['math','physics'].includes(subject)||!unit.startsWith(subject+'-'))return [];
    return Object.keys(C.knowledgeUnits[unit]||{}).flatMap(id=>(bank(subject)?.[id]||[]).map((q,i)=>item(q,id,i+3)).filter(q=>q.type==='solution').map(q=>({id:q.id,title:labels[q.level]+' · '+C.knowledgeNodes[id],prompt:q.prompt,nodes:[id],nodeId:id,question:q})));
  }
  function link(q,subject,unit,key){
    const params=new URLSearchParams({subject,unit,practice:q.id,task:q.id});
    if(key&&C.KEY.test(key))params.set('id',key.slice(C.PREFIX.length));
    return 'handwriting.html?'+params;
  }
  function results(storage,subject,unit){
    const byPrompt=new Map(tasks(subject,unit).map(t=>[t.prompt,t])),found={};
    for(let i=0;i<storage.length;i++){
      const key=storage.key(i);if(!C.KEY.test(key||''))continue;
      const raw=storage.getItem(key);
      try{
        const doc=JSON.parse(raw);
        if(doc.subject!==subject||doc.unitId!==unit)continue;
        const task=byPrompt.get(doc.prompt);if(!task||!C.validate(doc))continue;
        if(found[task.id]&&found[task.id].updatedAt>=doc.updatedAt)continue;
        const grade=doc.grades.filter(g=>g.revision===doc.revision&&g.source==='handwriting').at(-1);
        const evaluated=grade&&!grade.needsReview&&C.matchesKnowledge(grade,task)&&doc.pages.some((p,i)=>doc.photos?.[i]||p.some(s=>s.tool==='pen'));
        found[task.id]={key,updatedAt:doc.updatedAt,status:evaluated?'graded':'pending',passed:!!(evaluated&&grade.score>=80&&grade.knowledge.every(k=>k.score!==null&&k.score>=80)),feedback:grade?.feedback||''};
      }catch{/* An unrelated unreadable draft must not hide the current question. */}
    }
    return found;
  }
  function score(qs,choices,solutions){
    if(qs.some(q=>q.type==='choice'&&(!Number.isInteger(choices[q.id])||choices[q.id]<0||choices[q.id]>3)))return null;
    let score=0,pending=0;
    for(const q of qs)if(q.type==='choice')score+=Number(choices[q.id]===q.answer);else {const r=solutions[q.id];if(r?.status!=='graded')pending++;else score+=Number(r.passed);}
    return {score,total:qs.length,pending};
  }
  return {labels,questions,tasks,link,results,score};
});
