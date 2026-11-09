/* Keep old three-question evidence separate from the expanded application round. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingPracticeProgress=factory();})(globalThis,()=>{
  'use strict';
  const valid=p=>p&&p.version===1&&p.total===10&&Number.isInteger(p.best)&&p.best>=0&&p.best<=10;
  function result(record){
    if(record?.practicePhoto!==undefined){
      const p=record.practicePhoto,items=photo(p)?p.items:[],score=items.length?items.reduce((n,q)=>n+(q.score??0),0)/items.length:0;
      return {score,total:100,passed:items.length>0&&items.every(q=>q.score!==null&&q.score>=80&&q.passed!==false),legacy:false};
    }
    if(record?.practice10!==undefined){const score=valid(record.practice10)?record.practice10.best:0;return {score,total:10,passed:score===10,legacy:false};}
    if(Array.isArray(record?.exams)){const exams=record.exams.filter(e=>e?.real===false&&Number.isInteger(e.total)&&e.total>0&&Number.isInteger(e.correct)&&e.correct>=0&&e.correct<=e.total),score=Math.max(0,...exams.map(e=>e.correct/e.total*100));return {score,total:100,passed:score===100,legacy:true};}
    const score=Number.isInteger(record?.bestQuiz)&&record.bestQuiz>=0&&record.bestQuiz<=3?record.bestQuiz:0;
    return {score,total:3,passed:score===3,legacy:true};
  }
  function choices(value){return Object.fromEntries(Object.entries(value&&typeof value==='object'&&!Array.isArray(value)?value:{}).filter(([id,v])=>id.length<=120&&Number.isInteger(v)&&v>=0&&v<4).slice(0,10));}
  function photo(p){const total=p?.version===1?10:p?.version===2&&Number.isInteger(p.total)&&p.total>0&&p.total<=100?p.total:0;return total>0&&Array.isArray(p.items)&&p.items.length===total&&new Set(p.items.map(q=>q?.id)).size===total&&p.items.every((q,i)=>q&&typeof q.id==='string'&&q.id.endsWith('-application-'+(i+1))&&(q.passed===undefined||typeof q.passed==='boolean')&&(q.score===null||Number.isInteger(q.score)&&q.score>=0&&q.score<=100&&/^growing-handwriting-v1:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(q.key)&&Number.isInteger(q.revision)&&q.revision>=0&&typeof q.at==='string'&&Number.isFinite(Date.parse(q.at))));}
  function mastery(record){
    const attempts=(Array.isArray(record?.attempts)?record.attempts:[]).filter(a=>a&&typeof a.score==='number'&&Number.isFinite(a.score)&&a.score>=0&&a.score<=10&&typeof a.feedback==='string'&&Array.isArray(a.criticalErrors)&&a.criticalErrors.every(v=>typeof v==='string'));
    const latest=attempts.at(-1),feynman=latest&&!latest.criticalErrors.length?latest.score*10:0,q=result(record),application=q.score/q.total*100;
    return {feynman,application,score:Math.round((feynman*.3+application*.7)*10)/10};
  }
  function fraction(record,historical=false){const attempts=(Array.isArray(record?.attempts)?record.attempts:[]).filter(a=>a?.valid===true).map(a=>({...a,feedback:a.feedback??a.comment??'',criticalErrors:a.criticalErrors||[]})),r=mastery({...record,attempts});if(!attempts.length&&historical){r.feynman=100;r.score=Math.round((30+r.application*.7)*10)/10;}return r;}
  return {valid,result,choices,photo,mastery,fraction};
});
