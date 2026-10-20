/* Original learning material aligned to the verified SuKe chapter outline. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingMathBuilder=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  function chapter(number,title,sections,figure){
    const term=number<=5?'upper':'lower',id=`math-8${number<=5?'a':'b'}-${String(number).padStart(2,'0')}`;
    return {id,number,title,term,sections,figure,nodes:[],edges:[],questions:[]};
  }
  function add(c,id,section,title,review,steps,example,pitfall,prereqs,items){
    const code=section.split(' ')[0];
    const n={id,title,chapter:c.id,section,sectionCode:code,criterion:steps.join('；')+'。',review,steps,example,pitfall,
      recall:`请合上讲解，用自己的话说明“${title}”的条件与方法，再举一个例子。`,
      source:`苏科版八${c.term==='upper'?'上':'下'}第${c.number}章 ${code}；内容与例题为本项目独立编写`,reviewStatus:'待教师审核',figure:c.figure};
    n.practice=items.map((q,i)=>({id:id+'-practice-'+i,prompt:q[0],options:q[1],answer:q[2],explanation:q[3]}));
    c.nodes.push(n);
    items.slice(0,2).forEach((q,i)=>c.questions.push({...n.practice[i],id:id+'-'+(i+1),topic:id,difficulty:i?'basic':'standard',origin:'本项目原创，待教师审核'}));
    prereqs.forEach(p=>{const [from,reason,strength='hard']=typeof p==='string'?[p,'需要先掌握“'+p+'”所对应的方法。']:p;c.edges.push({from,to:id,strength,reason});});
    return n;
  }
  return {chapter,add};
});
