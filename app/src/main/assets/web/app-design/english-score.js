/* English scores use only required-word dictation and completed sentence challenges. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./word-mastery-rules.js'):root.WordMasteryRules,typeof module==='object'&&module.exports?require('./english-sentence-progress.js'):root.EnglishSentenceProgress);if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingEnglishScore=api;})(globalThis,(words,sentences)=>{
  'use strict';
  const formula='单词默写 × 50% + 句子闯关 × 50%';
  function wordPassed(word,record,legacy=false){
    if(word.optional)return false;
    if(record?.protocol==='word-mastery-v2')return words.passed(word,record);
    if(record?.protocol!=='seven-recalls'||!Array.isArray(record.answers)||record.answers.length!==7||record.answers.some(a=>typeof a!=='string'))return false;
    if(!legacy)return words.seven(word,record);
    const normalize=s=>s.normalize('NFKC').trim().replace(/[’‘]/g,"'").replace(/\s+/g,' '),expected=normalize(word.word??word.en);
    return record.answers.every(a=>word.id==='w34'?normalize(a)===expected:normalize(a).toLowerCase()===expected.toLowerCase());
  }
  function summary(vocabulary,records,items,saved,legacy=false){
    const required=vocabulary.filter(w=>!w.optional),word={completed:required.filter(w=>wordPassed(w,records?.[w.id],legacy)).length,total:required.length};
    const sentence=sentences.summary(items,saved);
    const points=Math.round((word.total?5000*word.completed/word.total:0)+(sentence.total?5000*sentence.completed/sentence.total:0));
    return {words:word,sentences:sentence,points,score:points/100};
  }
  return {formula,wordPassed,summary};
});
