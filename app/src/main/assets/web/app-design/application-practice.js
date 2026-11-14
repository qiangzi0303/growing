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
  const prompt=q=>q.prompt+(q.type==='choice'?'\n'+q.options.map((o,i)=>'ABCD'[i]+' · '+o).join('\n'):'');
  function results(storage,subject,unit,qs){
    const byPrompt=new Map((qs?qs.map(q=>({id:q.id,prompt:prompt(q),nodes:[q.topic]})):tasks(subject,unit)).map(t=>[t.prompt,t])),found={},history={},uploads={};
    for(let i=0;i<storage.length;i++){
      const key=storage.key(i);if(!C.KEY.test(key||''))continue;
      const raw=storage.getItem(key);
      try{
        const doc=JSON.parse(raw);
        if(doc.subject!==subject||doc.unitId!==unit)continue;
        const task=byPrompt.get(doc.prompt);if(!task||!C.validate(doc))continue;
        (history[task.id]||= []).push(...doc.grades.filter(g=>g.source==='handwriting'&&(g.needsReview||C.matchesKnowledge(g,task))).map(grade=>({grade,key})));
        const grade=doc.grades.filter(g=>g.revision===doc.revision&&g.source==='handwriting').at(-1);
        const evaluated=grade&&!grade.needsReview&&C.matchesKnowledge(grade,task)&&grade.knowledge.every(k=>k.score!==null)&&doc.pages.some((p,i)=>doc.photos?.[i]||p.some(s=>s.tool==='pen'));
        if(doc.photos?.some(Boolean))(uploads[task.id]||=[]).push({key,createdAt:doc.createdAt||doc.updatedAt,updatedAt:doc.updatedAt,photos:doc.photos.filter(Boolean),status:evaluated?'graded':'pending',grades:doc.grades.filter(g=>g.source==='handwriting'&&(g.needsReview||C.matchesKnowledge(g,task))).map(g=>({...g,historical:g.revision!==doc.revision}))});
        if(found[task.id]&&found[task.id].updatedAt>=doc.updatedAt)continue;
        found[task.id]={key,doc,grade,updatedAt:doc.updatedAt,status:evaluated?'graded':'pending',passed:!!(evaluated&&grade.score>=80&&grade.knowledge.every(k=>k.score!==null&&k.score>=80)),feedback:grade?.feedback||''};
      }catch{/* An unrelated unreadable draft must not hide the current question. */}
    }
    for(const [id,r] of Object.entries(found)){r.history=(history[id]||[]).sort((a,b)=>a.grade.at.localeCompare(b.grade.at));r.uploads=(uploads[id]||[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
    return found;
  }
  function score(qs,choices,solutions){
    if(qs.some(q=>q.type==='choice'&&(!Number.isInteger(choices[q.id])||choices[q.id]<0||choices[q.id]>3)))return null;
    let score=0,pending=0;
    for(const q of qs)if(q.type==='choice')score+=Number(choices[q.id]===q.answer);else {const r=solutions[q.id];if(r?.status!=='graded')pending++;else score+=Number(r.passed);}
    return {score,total:qs.length,pending};
  }
  function snapshot(qs,results){return {...(qs.length===10?{version:1}:{version:2,total:qs.length}),items:qs.map(q=>{const r=results[q.id];return {id:q.id,key:r?.key||null,revision:r?.doc.revision??0,at:r?.grade?.at||null,score:r?.status==='graded'?r.grade.score:null,passed:r?.passed===true};})};}
  return {labels,questions,tasks,link,results,score,prompt,snapshot};
});
