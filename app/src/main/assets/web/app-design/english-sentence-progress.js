/* Completion is counted per sentence, independently of course mastery and rewards. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EnglishSentenceProgress=api;})(globalThis,()=>{
  'use strict';
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  function key(unit){if(!/^english-8a-0[1-8]$/.test(unit))throw Error('无效的英语单元');return 'growing-english-sentences-v1:'+unit;}
  function restore(raw){
    if(raw==null)return {version:1,sentences:{}};
    if(!object(raw)||raw.version!==1||!object(raw.sentences))throw Error('句子完成记录格式无法识别，原记录已保留');
    return {...raw,sentences:{...raw.sentences}};
  }
  const valid=(sentence,record)=>object(record)&&record.protocol==='sentence-typing-v1'&&record.answer===sentence.en&&
    Number.isSafeInteger(record.wrong)&&record.wrong>=0&&Number.isSafeInteger(record.hints)&&record.hints>=0&&
    typeof record.revealed==='boolean'&&Number.isSafeInteger(record.at)&&record.at>0;
  function complete(raw,sentence,result,at=Date.now()){
    const state=restore(raw);
    if(valid(sentence,state.sentences[sentence.id]))return state;
    const record={protocol:'sentence-typing-v1',answer:sentence.en,wrong:result.wrong,hints:result.hints,revealed:result.revealed,at};
    if(!valid(sentence,record))throw Error('句子完成记录不完整');
    state.sentences[sentence.id]=record;return state;
  }
  function summary(sentences,raw){
    const records=raw?.version===1&&object(raw.sentences)?raw.sentences:{};
    return {completed:sentences.filter(s=>valid(s,records[s.id])).length,total:sentences.length};
  }
  return {key,restore,valid,complete,summary};
});
