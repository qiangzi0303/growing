import catalog from './photo-learning-catalog.json';

export const practiceLevels=['basic','improved','hard','comprehensive'] as const;
export type PhotoPractice={nodeId:string;level:typeof practiceLevels[number]};
export function normalizePractice(value:any,subject:string,unitId:string):PhotoPractice|null {
  if(!value||!practiceLevels.includes(value.level)||!catalog.knowledge.some(n=>n.id===value.nodeId&&n.subject===subject&&n.unitId===unitId))return null;
  return {nodeId:value.nodeId,level:value.level};
}
export function readPractice(value:unknown,subject:string,unitId:string){
  try{return normalizePractice(typeof value==='string'?JSON.parse(value):value,subject,unitId);}catch{return null;}
}
export const practiceInstructions='每题另外返回practice:{nodeId:"主考知识点ID",level:"basic|improved|hard|comprehensive",confidence:0.9}。只按题设在给定knowledgePoints中选一个同单元的主考知识点，basic为直接应用，improved为条件辨析或组合步骤，hard为较难推理，comprehensive为情境或跨方法综合应用。不按题号猜难度。不能可靠确定时practice=null，不编造知识点。';
export const practiceCatalog=(subject:string)=>catalog.knowledge.filter(n=>n.subject===subject).map(({id,title,unitId})=>({id,title,unitId}));
