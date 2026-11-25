/* Shared four-part English score, with validated word and sentence evidence. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./word-mastery-rules.js'):root.WordMasteryRules,typeof module==='object'&&module.exports?require('./english-sentence-progress.js'):root.EnglishSentenceProgress);if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingEnglishScore=api;})(globalThis,(words,sentences)=>{
  'use strict';
  const unitScore=()=>typeof module==='object'&&module.exports?require('./english-unit-score.js'):globalThis.GrowingEnglishUnitScore;
  const formula='必会词35分＋句子闯关25分＋课时30分＋错词库10分';
  function wordPassed(word,record,legacy=false){
    if(word.optional)return false;
    if(record?.protocol==='word-mastery-v2')return words.passed(word,record);
    if(record?.protocol!=='seven-recalls'||!Array.isArray(record.answers)||record.answers.length!==7||record.answers.some(a=>typeof a!=='string'))return false;
    if(!legacy)return words.seven(word,record);
    const normalize=s=>s.normalize('NFKC').trim().replace(/[’‘]/g,"'").replace(/\s+/g,' '),expected=normalize(word.word??word.en);
    return record.answers.every(a=>word.id==='w34'?normalize(a)===expected:normalize(a).toLowerCase()===expected.toLowerCase());
  }
  function summary(vocabulary,records,items,saved,legacy=false,{state={},lessons=[]}={}){
    const required=vocabulary.filter(w=>!w.optional),word={completed:required.filter(w=>wordPassed(w,records?.[w.id],legacy)).length,total:required.length};
    const sentence=sentences.summary(items,saved);
    return unitScore().compute({words:word,sentences:sentence,vocabulary,state,lessons,legacy});
  }
  return {formula,wordPassed,summary};
});
