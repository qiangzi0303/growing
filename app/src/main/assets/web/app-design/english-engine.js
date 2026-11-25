/* 校验实际作答记录，页面访问和点击不计掌握。 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingEnglishEngine=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  const normalize=x=>String(x??'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/…/g,'...').replace(/\s*\.\.\.\s*/g,' ... ').replace(/\s*-\s*/g,'-').replace(/\s+/g,' ').trim();
  const variants={humour:['humor'],programme:['program'],'sec.':['sec']};
  const matches=(word,answer)=>[word,...(variants[word]||[])].some(w=>normalize(w)===normalize(answer));
  function restore(raw){
    const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
    if(raw==null)return {version:1,words:{},lessons:{},feynman:{}};
    if(raw.version!==1||!raw.words||!raw.lessons||Array.isArray(raw.words)||Array.isArray(raw.lessons)||typeof raw.words!=='object'||typeof raw.lessons!=='object')throw Error('学习记录格式无法识别，原记录已保留');
    if(raw.feynman!==undefined&&(!raw.feynman||typeof raw.feynman!=='object'||Array.isArray(raw.feynman)))throw Error('概念复述记录格式无法识别，原记录已保留');
    if(Object.values(raw.feynman||{}).some(r=>!r||typeof r!=='object'||Array.isArray(r)||r.draft!==undefined&&typeof r.draft!=='string'||r.attempts!==undefined&&!Array.isArray(r.attempts)))throw Error('概念复述记录格式无法识别，原记录已保留');
    if(raw.learningTime!==undefined&&(!raw.learningTime||raw.learningTime.version!==1||!raw.learningTime.days||typeof raw.learningTime.days!=='object'||Array.isArray(raw.learningTime.days)))throw Error('学习计时记录格式无法识别，原记录已保留');
    if(raw.wordReview!==undefined&&(!raw.wordReview||typeof raw.wordReview!=='object'||Array.isArray(raw.wordReview)||Object.values(raw.wordReview).some(r=>!r||!Number.isInteger(r.level)||r.level<0||r.level>5||!date(r.due)||!date(r.lastDay)||r.failedDay!==undefined&&!date(r.failedDay)||r.conqueredDay!==undefined&&!date(r.conqueredDay))))throw Error('单词复习计划格式无法识别，原记录已保留');
    if(raw.wordReviewSession!=null){const s=raw.wordReviewSession,f=s.feedback;if(!Array.isArray(s.ids)||!s.ids.length||!s.ids.every(x=>typeof x==='string'&&x.length)||!Number.isInteger(s.index)||s.index<0||s.index>s.ids.length||typeof s.draft!=='string'||typeof s.hinted!=='boolean'||typeof s.finished!=='boolean'||s.finished!==(s.index===s.ids.length)||!Number.isInteger(s.firstCount)||s.firstCount<1||s.firstCount>s.ids.length||s.ids.length>s.firstCount*2||!Number.isInteger(s.correct)||s.correct<0||s.correct>s.firstCount||s.hintCount!==undefined&&(!Number.isInteger(s.hintCount)||s.hintCount<0||s.hintCount>s.firstCount)||f!=null&&(s.finished||typeof f!=='object'||typeof f.correct!=='boolean'||typeof f.hinted!=='boolean'||typeof f.retry!=='boolean'||typeof f.answer!=='string'||f.wordId!==s.ids[s.index]||f.retry!==(s.index>=s.firstCount)))throw Error('单词复习进度格式无法识别，原记录已保留');}
    const extensions={...raw};for(const field of ['version','activeWordRecall','words','lessons','feynman','wordCursor','learningTime','wordPilot','wordReview','wordReviewSession'])delete extensions[field];
    return {...extensions,version:1,...(typeof raw.activeWordRecall==='string'?{activeWordRecall:raw.activeWordRecall}:{}),words:{...raw.words},lessons:{...raw.lessons},feynman:{...raw.feynman},...(typeof raw.wordCursor==='string'?{wordCursor:raw.wordCursor}:{}),...(raw.learningTime?{learningTime:{...raw.learningTime,days:{...raw.learningTime.days}}}:{}),...(raw.wordPilot!==undefined?{wordPilot:raw.wordPilot}:{}),...(raw.wordReview!==undefined?{wordReview:raw.wordReview}:{}),...(raw.wordReviewSession!==undefined?{wordReviewSession:raw.wordReviewSession}:{})};
  }
  const rules=typeof module==='object'&&module.exports?require('./word-mastery-rules.js'):globalThis.WordMasteryRules;
  const wordPassed=(word,record)=>!word.optional&&(record?.protocol==='word-mastery-v2'?rules?.passed(word,record):record?.protocol==='seven-recalls'&&Array.isArray(record.answers)&&record.answers.length===7&&record.answers.every(a=>typeof a==='string'&&matches(word.word,a)));
  const lessonPassed=(lesson,record)=>{if(record?.bestQuiz&&lessonPassed(lesson,record.bestQuiz))return true;return record?.protocol==='three-correct'&&Array.isArray(record.answers)&&record.answers.length===lesson.questions.length&&record.answers.every((a,i)=>a===lesson.questions[i].answer);};
  function progress(words,lessons,state,items=[],saved=null){const scoring=typeof module==='object'&&module.exports?require('./english-score.js'):globalThis.GrowingEnglishScore;return scoring.summary(words,state.words,items,saved,false,{state,lessons}).progress;}
  return {normalize,matches,restore,wordPassed,lessonPassed,progress};
});
