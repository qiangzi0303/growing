/* Resource links keep their original destinations; opening personal papers stays account-bound. */
(()=>{
 'use strict';
 window.GrowingStudentResources={create({subject,params=new URLSearchParams(),openPapers=()=>{}}){
  const name={math:'数学',english:'英语',physics:'物理'}[subject];
  if(!name)throw Error('没有找到这个学科的资源');
  const term=params.get('term')==='lower'?'lower':'upper',unit=params.get('unit');
  let backHref='units.html?'+new URLSearchParams({subject,term});
  if(subject==='english'&&/^english-8[ab]-\d{2}$/.test(unit||''))backHref=unit==='english-8a-03'?'../word-ops-unit3/index.html':'english-course.html?unit='+encodeURIComponent(unit);
  if(subject==='physics'&&/^physics-8[ab]-\d{2}$/.test(unit||''))backHref='physics-course.html?chapter='+encodeURIComponent(unit);
  return {kind:'resources',subject,subjectName:name,title:'试卷',backHref,backLabel:'返回'+name+(unit&&subject!=='math'?'课堂':'目录'),groups:subject==='math'?[{title:'第十三周周练',links:[{title:'电子试卷 · 34题',href:'math-week13.html'},{title:'原卷错题',href:'math-week13.html?wrong=1'},{title:'交互知识图谱',href:'math-week13-graph.html'}]},{title:'期中复习卷',links:[{title:'无答案试卷',href:'math-exam-midterm.html'},{title:'检测卷2',href:'math-exam-practice.html'},{title:'交互知识图谱',href:'math-exam-midterm-graph.html'}]}]:[],openPapers:()=>openPapers(subject)};
 }};
})();
