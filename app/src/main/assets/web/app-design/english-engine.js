/* 校验实际作答记录，页面访问和点击不计掌握。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingEnglishEngine=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  const normalize=x=>String(x??'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/…/g,'...').replace(/\s*\.\.\.\s*/g,' ... ').replace(/\s*-\s*/g,'-').replace(/\s+/g,' ').trim();
  const variants={humour:['humor'],programme:['program'],'sec.':['sec']};
  const matches=(word,answer)=>[word,...(variants[word]||[])].some(w=>normalize(w)===normalize(answer));
  function restore(raw){
    if(raw==null)return {version:1,words:{},lessons:{},feynman:{}};
    if(raw.version!==1||!raw.words||!raw.lessons||Array.isArray(raw.words)||Array.isArray(raw.lessons)||typeof raw.words!=='object'||typeof raw.lessons!=='object')throw Error('学习记录格式无法识别，原记录已保留');
    if(raw.feynman!==undefined&&(!raw.feynman||typeof raw.feynman!=='object'||Array.isArray(raw.feynman)))throw Error('概念复述记录格式无法识别，原记录已保留');
    if(Object.values(raw.feynman||{}).some(r=>!r||typeof r!=='object'||Array.isArray(r)||r.draft!==undefined&&typeof r.draft!=='string'||r.attempts!==undefined&&!Array.isArray(r.attempts)))throw Error('概念复述记录格式无法识别，原记录已保留');
    if(raw.learningTime!==undefined&&(!raw.learningTime||raw.learningTime.version!==1||!raw.learningTime.days||typeof raw.learningTime.days!=='object'||Array.isArray(raw.learningTime.days)))throw Error('学习计时记录格式无法识别，原记录已保留');
    return {version:1,words:{...raw.words},lessons:{...raw.lessons},feynman:{...raw.feynman},...(typeof raw.wordCursor==='string'?{wordCursor:raw.wordCursor}:{}),...(raw.learningTime?{learningTime:{...raw.learningTime,days:{...raw.learningTime.days}}}:{})};
  }
  const rules=typeof module==='object'&&module.exports?require('./word-mastery-rules.js'):globalThis.WordMasteryRules;
  const wordPassed=(word,record)=>!word.optional&&(record?.protocol==='word-mastery-v2'?rules?.passed(word,record):record?.protocol==='seven-recalls'&&Array.isArray(record.answers)&&record.answers.length===7&&record.answers.every(a=>typeof a==='string'&&matches(word.word,a)));
  const lessonPassed=(lesson,record)=>record?.protocol==='three-correct'&&Array.isArray(record.answers)&&record.answers.length===lesson.questions.length&&record.answers.every((a,i)=>a===lesson.questions[i].answer);
  function progress(words,lessons,state){return {done:words.filter(w=>wordPassed(w,state.words[w.id])).length+lessons.filter(l=>lessonPassed(l,state.lessons[l.id])).length,total:words.filter(w=>!w.optional).length+lessons.length};}
  return {normalize,matches,restore,wordPassed,lessonPassed,progress};
});
