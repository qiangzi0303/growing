/* Original lessons aligned to the supplied SuKe upper (2025) and lower (2012/2015) textbooks. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingPhysicsBuilder=factory();})(globalThis,()=>{
  'use strict';
  const chapter=(number,title,sections)=>({id:'physics-8'+(number<=5?'a':'b')+'-'+String(number).padStart(2,'0'),number,title,term:number<=5?'upper':'lower',sections,nodes:[],edges:[],questions:[]});
  function add(c,key,section,title,pages,figure,review,steps,example,pitfall,prereqs,items){
    const id='phy-'+key,n={id,title,chapter:c.id,section,sectionCode:section.split(' ')[0],criterion:steps.join('；')+'。',review,steps,example,pitfall,figure,
      recall:`合上讲解，用自己的话说明“${title}”：条件是什么，证据或方法是什么？再用一个例子解释，并注明有关单位。`,
      source:`依据《义务教育教科书·物理·八年级${c.term==='upper'?'上':'下'}册》苏科版${c.term==='upper'?'2025年7月第4版':'2012年11月第3版（2015年10月印刷）'}，第${c.number}章，印刷页${pages}；讲解、例题及练习为本项目原创教学补充`,reviewStatus:'待教师审核'};
    n.practice=items.map((q,i)=>{const shift=(c.number+c.nodes.length+i)%4;return {id:id+'-practice-'+i,prompt:q[0],options:q[1].slice(shift).concat(q[1].slice(0,shift)),answer:(q[2]-shift+4)%4,explanation:q[3]};});
    c.nodes.push(n);
    n.practice.slice(0,2).forEach((q,i)=>c.questions.push({...q,id:id+'-diagnosis-'+i,topic:id,difficulty:i?'basic':'standard',origin:'本项目原创；与应用练习共享题目，诊断结果不计课程达标'}));
    for(const [from,reason] of prereqs)c.edges.push({from:'phy-'+from,to:id,strength:'hard',reason});
    return n;
  }
  return {chapter,add};
});
