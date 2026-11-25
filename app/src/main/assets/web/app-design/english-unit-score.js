/* Shared by course rewards, catalogues and the server; only saved evidence earns credit. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingEnglishUnitScore=factory();})(globalThis,()=>{
 'use strict';
 const CONFIG=Object.freeze({words:35,sentences:25,lessons:30,wrong:10,feynman:.4,quiz:.5,time:.1,minutesPerLesson:20,bonus:.2,gameMinutes:100,cashYuan:200});
 const defaults=Object.freeze({key:'english-unit-score-v1',gameMinutes:100,cashYuan:200});
 const formula='必会词35分＋句子闯关25分＋课时30分＋错词库10分';
 const array=v=>Array.isArray(v)?v:[],num=v=>typeof v==='number'&&Number.isFinite(v)?v:0,ratio=v=>Math.max(0,Math.min(1,num(v)));
 const validDay=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
 const conquered=r=>validDay(r?.failedDay)&&validDay(r?.conqueredDay)&&r.conqueredDay>r.failedDay;
 const validGrade=g=>!!g&&Number.isFinite(g.score)&&g.score>=0&&g.score<=10&&typeof g.feedback==='string'&&Array.isArray(g.criticalErrors)&&g.criticalErrors.every(x=>typeof x==='string');
 const gradeScore=g=>g.criticalErrors.length?Math.min(7.5,g.score):g.score;
 function keepBest(record,attempt){
  const grades=[record?.bestFeynman,...array(record?.attempts),attempt].filter(validGrade);
  return grades.sort((a,b)=>gradeScore(b)-gradeScore(a)||Number(!b.criticalErrors.length)-Number(!a.criticalErrors.length))[0];
 }
 function quizCorrect(lesson,record){
  const expected=lesson.answers||array(lesson.questions).map(q=>q.answer);
  if(expected.length!==3||!['three-correct','three-question-attempt'].includes(record?.protocol)||!Array.isArray(record.answers)||record.answers.length!==3||!record.answers.every(a=>typeof a==='string'))return 0;
  return expected.reduce((n,a,i)=>n+Number(a===record.answers[i]),0);
 }
 function bestQuiz(lesson,record,attempt){
  return [record,record?.bestQuiz,attempt].filter(Boolean).sort((a,b)=>quizCorrect(lesson,b)-quizCorrect(lesson,a))[0];
 }
 function lessonResult(lesson,state,legacy){
  const r=state.feynman?.[lesson.id]||{},grades=[r.bestFeynman,...array(r.attempts)].filter(validGrade);
  if(legacy){
   // Old Unit 3 daily bests were validated 0–100 assessments without a critical-error field.
   for(const d of Object.values(state.studyHistory?.days||{})){
    const g=d?.feynman?.[lesson.id];
    if(g?.attempts>0&&Number.isInteger(g.best)&&g.best>=0&&g.best<=100)grades.push({score:g.best/10,criticalErrors:[],feedback:'历史评分'});
   }
  }
  const feynman=Math.max(0,...grades.map(gradeScore)),quiz=legacy?ratio(num(state.best?.[lesson.id])/100):Math.max(quizCorrect(lesson,state.lessons?.[lesson.id]),quizCorrect(lesson,state.lessons?.[lesson.id]?.bestQuiz))/3;
  return {id:lesson.id,title:lesson.title||lesson.id,feynman,quiz,mastered:grades.some(g=>g.score>=8&&!g.criticalErrors.length)&&quiz>=(legacy?.8:1)};
 }
 function compute({words,sentences,lessons=[],state={},vocabulary=[],legacy=false}){
  const ms=Object.entries(state.learningTime?.days||{}).reduce((sum,[day,value])=>sum+(validDay(day)?Math.max(0,Math.min(86400000,num(value))):0),0);
  const timeRatio=lessons.length?ratio(ms/(lessons.length*CONFIG.minutesPerLesson*60000)):0;
  const items=lessons.map(l=>{const r=lessonResult(l,state,legacy);return {...r,score:CONFIG.lessons/lessons.length*(CONFIG.feynman*r.feynman/10+CONFIG.quiz*r.quiz+CONFIG.time*timeRatio)};});
  const wrongIds=[...new Set(vocabulary.map(w=>w.id))].filter(id=>validDay(state.wordReview?.[id]?.failedDay));
  const wrong={total:wrongIds.length,conquered:wrongIds.filter(id=>conquered(state.wordReview[id])).length};
  const parts={words:words.total?CONFIG.words*ratio(words.completed/words.total):0,sentences:sentences.total?CONFIG.sentences*ratio(sentences.completed/sentences.total):0,lessons:items.reduce((s,i)=>s+i.score,0),wrong:wrong.total?CONFIG.wrong*wrong.conquered/wrong.total:CONFIG.wrong};
  const points=Math.round(Object.values(parts).reduce((a,b)=>a+b,0)*100),score=points/100;
  const cleared=words.total>0&&words.completed===words.total&&sentences.total>0&&sentences.completed===sentences.total&&items.length>0&&items.every(i=>i.mastered);
  return {words,sentences,lessons:{total:items.length,mastered:items.filter(i=>i.mastered).length,items,timeRatio},wrong,parts,points,score,cleared,progress:{done:Math.min(1000,Math.round(score*8)+(cleared?200:0)),total:1000}};
 }
 function describe(s){
  const next=[];
  if(s.words.completed<s.words.total)next.push(`还差${s.words.total-s.words.completed}个必会词`);
  if(s.sentences.completed<s.sentences.total)next.push(`还差${s.sentences.total-s.sentences.completed}个句子`);
  for(const l of s.lessons.items.filter(l=>!l.mastered))next.push(`${l.title}：费曼${l.feynman}分，检测${Math.round(l.quiz*100)}%`);
  if(s.wrong.conquered<s.wrong.total)next.push(`还有${s.wrong.total-s.wrong.conquered}个错词待隔天独立答对`);
  if(s.lessons.total&&s.lessons.timeRatio<1)next.push(`有效学习时间还差约${Math.ceil((1-s.lessons.timeRatio)*s.lessons.total*CONFIG.minutesPerLesson)}分钟`);
  const n=v=>Math.round(v*100)/100;
  return `单元得分 ${s.score}/100：必会词 ${n(s.parts.words)}/35＋句子 ${n(s.parts.sentences)}/25＋课时 ${n(s.parts.lessons)}/30＋错词库 ${n(s.parts.wrong)}/10。课时已掌握 ${s.lessons.mastered}/${s.lessons.total}，错词已攻克 ${s.wrong.conquered}/${s.wrong.total}。80%按得分累积，20%通关大礼包${s.cleared?'已解锁':'待解锁'}。`+(next.length?'下一步可提分：'+next.slice(0,3).join('；')+'。':'');
 }
 return {CONFIG,defaults,formula,validDay,conquered,validGrade,gradeScore,keepBest,quizCorrect,bestQuiz,lessonResult,compute,describe};
});
