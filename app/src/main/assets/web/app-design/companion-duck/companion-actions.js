// Local UI commands and summaries never change an assessment or lesson progress.
export function visibilityIntent(value){
  if(typeof value!=='string'||value.length>60)return null;
  const text=value.replace(/[\s，,。.!！?？]/g,'').replace(/^(?:小鸭子?|鸭鸭)[呀啊]?/,'').replace(/^(?:请你|请|你)/,'').replace(/(?:一下)?(?:吧|啦|呀|啊|好吗)$|一下$/,'');
  if(/^(?:隐身|隐藏|躲起来|藏起来|隐藏自己)$/.test(text))return 'hide';
  if(/^(?:出来|现身|回来|出现|显示自己)$/.test(text))return 'show';
  return null;
}

const clean=(value,max)=>typeof value==='string'?value.replace(/<[^>]*>/g,'').replace(/[`#*_]/g,'').replace(/\s+/g,' ').trim().slice(0,max):'';
export function assessmentSummary(data){
  if(!data||typeof data.courseId!=='string'||!data.courseId||data.courseId.length>200||typeof data.id!=='string'||!data.id||data.id.length>120)return null;
  const grade=data.grade;
  if(!grade||!Number.isFinite(grade.score)||grade.score<0||grade.score>10||!Array.isArray(grade.criticalErrors)||!grade.criticalErrors.every(x=>typeof x==='string')||typeof (grade.feedback??grade.comment)!=='string')return null;
  if(grade.gaps!==undefined&&(!Array.isArray(grade.gaps)||!grade.gaps.every(x=>typeof x==='string')))return null;
  const feedback=clean(grade.feedback??grade.comment,90),title=clean(data.title,45);
  const gaps=[...grade.criticalErrors,...(grade.gaps||[])].map(x=>clean(x,65).replace(/[。；;]+$/,'')).filter(Boolean);
  const priority=[...new Set(gaps)].slice(0,2);
  const pass=grade.score>=8&&!grade.criticalErrors.length;
  const text=['这次'+(title?'“'+title+'”的':'')+'概念复述，AI老师给了你'+grade.score+'分，满分10分。',feedback,priority.length?'接下来先巩固：'+priority.join('；')+'。':pass?'这次概念解释已达标，接着用练习检验理解吧。':'再补充关键概念和使用条件，然后试着复述一遍。'].filter(Boolean).join('');
  return {id:data.id,courseId:data.courseId,text};
}
