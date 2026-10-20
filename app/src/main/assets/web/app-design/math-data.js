(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./knowledge-data.js'),require('./math-upper.js'),require('./math-lower.js'));
  else {root.GrowingFractionKnowledge=root.GrowingKnowledge;root.GrowingMath=factory(root.GrowingKnowledge,root.GrowingMathUpper,root.GrowingMathLower);root.GrowingKnowledge=root.GrowingMath;}
})(typeof globalThis!=='undefined'?globalThis:this,(base,upper,lower)=>{
  'use strict';
  const fraction={id:'math-8b-10',number:10,title:'分式',term:'lower',sections:['10.1','10.2','10.3','10.4','10.5'],figure:'fraction',nodes:base.nodes.filter(n=>n.chapter),edges:[],questions:[]};
  const chapters=[...upper,...lower,fraction].sort((a,b)=>a.number-b.number);
  const byId=new Map(base.nodes.map(n=>[n.id,{...n}]));
  for(const c of [...upper,...lower])for(const n of c.nodes)byId.set(n.id,n);
  const edges=new Map();
  for(const e of [...base.edges,...upper.flatMap(c=>c.edges),...lower.flatMap(c=>c.edges)])edges.set(e.from+'>'+e.to,e);
  edges.set('factor-difference>reduce',{from:'factor-difference',to:'reduce',strength:'hard',reason:'约分标准题含x²−1，需要先用平方差公式分解，再检查原分母限制。'});
  const questions=new Map(base.questions.map(q=>[q.id,q]));
  for(const q of [...upper.flatMap(c=>c.questions),...lower.flatMap(c=>c.questions)])questions.set(q.id,q);
  // Each chapter can select its own content; prerequisites remain visible across chapters.
  const nodes=[...byId.values()];
  for(const c of chapters)c.nodes=nodes.filter(n=>n.chapter===c.id);
  for(const e of edges.values()){
    if(e.reason.includes('所对应的方法'))e.reason=`需要先理解“${byId.get(e.from)?.title||e.from}”，再学习“${byId.get(e.to)?.title||e.to}”。`;
  }
  return {version:'suke-year8-1',title:'八年级数学知识图谱',chapters,nodes,edges:[...edges.values()],questions:[...questions.values()]};
});
