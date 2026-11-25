/* Math chapter score (100) and wrong-question conquest records. Pure scoring; reward ledger stays in reward-engine.js.
   Per chapter: knowledge points 80 (split evenly; AI Feynman 40% + application practice 50% + study time 10%) + wrong questions 20.
   Reward ratio = 80% by score + 20% clear bonus when every knowledge point is mastered. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingMathScore=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const CONFIG=Object.freeze({points:80,wrong:20,feynman:0.4,practice:0.5,time:0.1,targetMinutes:20,bonus:0.2,gameMinutes:100,cashYuan:200});
 const KEY='growing-math-wrong-mastery-v1';
 const round1=n=>Math.round(n*10+1e-8)/10;
 const day=(at=Date.now())=>{const d=new Date(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const isDay=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
 // A wrong question is conquered after an AI error analysis and a correct redo on a later day.
 const conquered=w=>!!w&&isDay(w.analyzed)&&isDay(w.redo)&&w.redo>w.analyzed&&w.correct===true;
 function restoreWrong(raw){const out={};if(raw&&typeof raw==='object'&&!Array.isArray(raw))for(const [id,w] of Object.entries(raw))if(w&&typeof w==='object'&&id.length<=80)out[id]={analyzed:isDay(w.analyzed)?w.analyzed:null,redo:isDay(w.redo)?w.redo:null,correct:w.correct===true};return out;}
 function loadWrong(storage){const raw=JSON.parse(storage.getItem(KEY)||'null');if(raw&&(typeof raw!=='object'||Array.isArray(raw)))throw Error('错题攻克记录格式无效，原记录保留');return restoreWrong(raw);}
 function saveWrong(storage,data){storage.setItem(KEY,JSON.stringify(data));}
 function analyzed(storage,id,at){const d=loadWrong(storage),w=d[id]||{analyzed:null,redo:null,correct:false};if(!w.analyzed)w.analyzed=day(at);d[id]=w;saveWrong(storage,d);return w;}
 function redo(storage,id,correct,at){const d=loadWrong(storage),w=d[id];const today=day(at);
  if(!w||!w.analyzed)throw Error('请先完成AI错因分析，再重做。');
  if(today<=w.analyzed)throw Error('请隔天再重做，检验是不是真的会了。');
  if(conquered(w))return w;
  Object.assign(w,{redo:today,correct:correct===true});saveWrong(storage,d);return w;}
 /* nodes: [{id,title}]; topic(id) -> {feynman:0-10 best valid score, practice:{score,total}, ms, mastered:boolean}
    wrongIds: chapter wrong question ids; wrong: restored conquest records. */
 function compute(nodes,topic,wrongIds=[],wrong={}){
  const per=nodes.length?CONFIG.points/nodes.length:0,targetMs=CONFIG.targetMinutes*60000;
  const items=nodes.map(n=>{const t=topic(n.id)||{},f=Math.max(0,Math.min(10,Number(t.feynman)||0)),p=t.practice&&t.practice.total>0?Math.max(0,Math.min(1,t.practice.score/t.practice.total)):0,time=Math.max(0,Math.min(1,(Number(t.ms)||0)/targetMs));
   const parts={feynman:per*CONFIG.feynman*f/10,practice:per*CONFIG.practice*p,time:per*CONFIG.time*time};
   return {id:n.id,title:n.title,max:per,score:parts.feynman+parts.practice+parts.time,parts,feynman:f,practiceRatio:p,minutes:Math.floor((Number(t.ms)||0)/60000),mastered:t.mastered===true};});
  const ids=[...new Set(wrongIds)],done=ids.filter(id=>conquered(wrong[id])).length;
  const wrongScore=ids.length?CONFIG.wrong*done/ids.length:CONFIG.wrong;
  const pointScore=items.reduce((s,i)=>s+i.score,0),score=Math.min(100,round1(pointScore+wrongScore));
  const cleared=nodes.length>0&&items.every(i=>i.mastered);
  // Integer progress for the reward ledger: 800 by score, 200 by clearing.
  const units=Math.min(1000,Math.round(score*(1-CONFIG.bonus)*10)+(cleared?Math.round(CONFIG.bonus*1000):0));
  return {score,pointScore:round1(pointScore),wrongScore:round1(wrongScore),wrong:{total:ids.length,conquered:done,analyzed:ids.filter(id=>wrong[id]?.analyzed).length},items,cleared,mastered:items.filter(i=>i.mastered).length,progress:{done:units,total:1000}};
 }
 function describe(s){
  const weak=s.items.filter(i=>!i.mastered).slice(0,3).map(i=>`${i.title}（${round1(i.score)}/${round1(i.max)}${i.feynman<8?'，费曼'+i.feynman+'分':''}${i.practiceRatio<1?'，练习'+Math.round(i.practiceRatio*10)+'/10':''}）`);
  return `章节得分 ${s.score}/100：知识点 ${s.pointScore}/80（已掌握 ${s.mastered}/${s.items.length}）＋错题 ${s.wrongScore}/20（已攻克 ${s.wrong.conquered}/${s.wrong.total}）。`+
   `奖励按“章节得分×80%”实时累积，全部知识点掌握后再解锁20%通关大礼包${s.cleared?'（已解锁 🎉）':''}。`+(weak.length?`下一步可提分：${weak.join('、')}。`:'')+
   `每个知识点：AI费曼复述40%（取最高分）、应用练习50%（取最好一轮）、有效学习时间10%（满${CONFIG.targetMinutes}分钟即满分）。错题需AI错因分析＋隔天重做做对才算攻克。`;
 }
 // Retain validated evidence, not a bare cached score; new question sets stay separate.
 function keepBest(record,change,P,validGrade){
  const out={...change},next={...record,...change};
  if(change.attempts){const grades=[record.bestFeynman,...(record.attempts||[]),...change.attempts].filter(validGrade);out.bestFeynman=grades.sort((a,b)=>b.score-a.score)[0];}
  if(change.practiceRound){
   const rounds=[record.practiceBestRound,record.practiceRound,change.practiceRound].filter(r=>P.round(r)&&r.items[0].id===change.practiceRound.items[0].id&&(!next.practiceSet||next.practiceSet.every((key,i)=>key===(r.items[i].sourceKey||''))));
   out.practiceBestRound=rounds.sort((a,b)=>P.result({practiceRound:b}).score-P.result({practiceRound:a}).score)[0];
  }
  return out;
 }
 function fromRecords(nodes,records,learning,wrongIds,wrong,P,validGrade){
  return compute(nodes,id=>{
   const r=records[id]||{},grades=[r.bestFeynman,...(r.attempts||[])].filter(validGrade),current=P.result(r);
   const best=P.round(r.practiceBestRound)&&r.practiceBestRound.items[0].id===id+'-application-1'?P.result({...r,practiceRound:r.practiceBestRound}):current;
   const practice=best.score/best.total>current.score/current.total?best:current;
   const ms=Object.values(learning.days||{}).reduce((sum,rows)=>sum+(rows[id]?.ms||0),0);
   return {feynman:Math.max(0,...grades.map(g=>g.score)),practice,ms,mastered:grades.some(g=>g.score>=8&&!g.criticalErrors.length)&&current.passed};
  },wrongIds,wrong);
 }
 return {CONFIG,KEY,day,conquered,restoreWrong,loadWrong,analyzed,redo,compute,describe,keepBest,fromRecords};
});
