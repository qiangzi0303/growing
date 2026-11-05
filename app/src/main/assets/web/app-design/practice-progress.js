/* Keep old three-question evidence separate from the expanded application round. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingPracticeProgress=factory();})(globalThis,()=>{
  'use strict';
  const valid=p=>p&&p.version===1&&p.total===10&&Number.isInteger(p.best)&&p.best>=0&&p.best<=10;
  function result(record){
    if(record?.practice10!==undefined){const score=valid(record.practice10)?record.practice10.best:0;return {score,total:10,passed:score===10,legacy:false};}
    const score=Number.isInteger(record?.bestQuiz)&&record.bestQuiz>=0&&record.bestQuiz<=3?record.bestQuiz:0;
    return {score,total:3,passed:score===3,legacy:true};
  }
  function choices(value){return Object.fromEntries(Object.entries(value&&typeof value==='object'&&!Array.isArray(value)?value:{}).filter(([id,v])=>id.length<=120&&Number.isInteger(v)&&v>=0&&v<4).slice(0,10));}
  return {valid,result,choices};
});
