/* Reviewed paper references; never copy the photographed student's work into a viewer's scores. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./math-week13/paper.json'));
 else root.GrowingWeek13=factory(root.GrowingWeek13Data);
})(globalThis,data=>{
 'use strict';
 const prompt=q=>[q.body,...q.options.map((s,i)=>'ABCD'[i]+'. '+s),...q.parts.map((s,i)=>'（'+(i+1)+'）'+s)].join('\n');
 const questions=(unit='all',node='',wrongOnly=false)=>data.questions.filter(q=>(unit==='all'||q.practice.unitId===unit)&&(!node||q.practice.nodeId===node)&&(!wrongOnly||q.originalReview.wrong));
 const paperHref=q=>'math-week13.html#q'+q.number;
 const writingHref=q=>'handwriting.html?'+new URLSearchParams({subject:'math',unit:q.practice.unitId,practice:q.id,task:q.id});
 const tasks=unit=>questions(unit).filter(q=>!q.review).map(q=>({id:q.id,title:'第十三周周练 · 第'+q.number+'题',prompt:prompt(q),nodes:[q.practice.nodeId],nodeId:q.practice.nodeId,figures:q.figures,reference:q.answer+'\n'+q.explanation,question:q,returnHref:paperHref(q)}));
 async function questionImage(task){
  if(!task?.figures?.length)return undefined;
  const images=await Promise.all(task.figures.map(async src=>{const image=new Image();image.src=src;await image.decode();return image;}));
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=images.length*500;
  const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);
  images.forEach((im,i)=>{const scale=Math.min(680/im.naturalWidth,460/im.naturalHeight);ctx.drawImage(im,(720-im.naturalWidth*scale)/2,i*500+20,im.naturalWidth*scale,im.naturalHeight*scale);});
  return canvas.toDataURL('image/png');
 }
 return {id:data.id,title:data.title,questions,prompt,paperHref,writingHref,tasks,questionImage};
});
