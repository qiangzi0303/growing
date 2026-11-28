(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./english-sentence-progress.js') : root.EnglishSentenceProgress);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GrowingEnglishPomodoroCatalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (sentenceDefault) {
  'use strict';
  function check(ok, message) { if (!ok) throw Error('番茄目录：' + message); }
  function object(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function text(v) { return typeof v === 'string' && v.trim().length > 0; }
  function build(unitId, options) {
    check(/^english-8a-0[1-8]$/.test(unitId) && object(options), '单元或参数错误');
    var words=options.words, lessons=options.lessons, engine=options.engine, practice=options.practice;
    check(Array.isArray(words) && Array.isArray(lessons) && engine && typeof engine.restore==='function' && typeof engine.wordPassed==='function' && typeof engine.lessonPassed==='function', '课程数据不完整');
    var state=engine.restore(options.state), out={words:[],grammar:[],reading:[],sentences:[],review:[]}, seen=new Set();
    [state.words,state.lessons].forEach(function(map){Object.keys(map).forEach(function(id){check(object(map[id]),'学习记录格式错误');});});
    function add(kind, fields, mastered) {
      check(!seen.has(fields.id), '目标重复'); seen.add(fields.id);
      var t=Object.assign({unitId:unitId,category:kind,review:!!mastered,newWord:kind==='words'&&!mastered},fields);
      if(mastered && t.kind==='word')t.eventId='review:'+t.wordId;
      out[mastered?'review':kind].push(t);
    }
    words.forEach(function(w){
      check(object(w)&&text(w.id)&&text(w.word), '单词格式错误'); if(w.optional)return;
      add('words',{id:'word:'+w.id,eventId:'word:'+w.id,kind:'word',title:w.word,wordId:w.id},engine.wordPassed(w,state.words[w.id]));
    });
    var lessonMap=new Map();
    lessons.forEach(function(l){check(object(l)&&text(l.id)&&text(l.title)&&!lessonMap.has(l.id), '课程格式错误');lessonMap.set(l.id,l);});
    function reading(l){return /(^|[-_])reading($|[-_])/i.test(l.id)||/^阅读/.test(l.title);}
    check(practice && object(practice.groups) && typeof practice.validate==='function' && typeof practice.score==='function', '知识点课程未载入');
    var records=state.pointPractice;
    check(records===undefined||object(records),'知识点记录格式错误');
    Object.keys(records||{}).forEach(function(lid){
      check(Array.isArray(practice.groups[lid])&&object(records[lid]),'未知知识点课程记录');
      Object.keys(records[lid]).forEach(function(pid){check(practice.groups[lid].some(function(p){return p.id===pid;}),'未知知识点记录');});
    });
    Object.keys(practice.groups).forEach(function(lid){
      var l=lessonMap.get(lid), group=practice.groups[lid];
      check(l&&Array.isArray(group),'知识点课程不匹配');
      group.forEach(function(p){
        check(object(p)&&text(p.id)&&text(p.title)&&Array.isArray(p.questions)&&p.questions.length>0,'知识点格式错误');
        var record=records&&records[lid]&&records[lid][p.id], mastered=false;
        if(record!==undefined&&record!==null){
          practice.validate(p,record);
          check(record.best===undefined||(Number.isSafeInteger(record.best)&&record.best>=0),'知识点历史成绩错误');
          mastered=(practice.best?practice.best(p,record):record.best)>=p.questions.length||practice.score(p,record)===p.questions.length;
        }
        add(reading(l)?'reading':'grammar',{id:'point:'+lid+':'+p.id,eventId:'point:'+lid+':'+p.id,kind:'point',title:p.title,lessonId:lid,pointId:p.id},mastered);
      });
    });
    lessons.filter(reading).forEach(function(l){
      check(Array.isArray(l.questions)&&l.questions.length>0,'阅读检测缺失');
      add('reading',{id:'lesson:'+l.id,eventId:'lesson:'+l.id,kind:'lesson',title:l.title+' · 综合检测',lessonId:l.id},engine.lessonPassed(l,state.lessons[l.id]));
    });
    var su=options.sentenceUnit, sp=options.sentenceProgress, validator=options.sentenceValidator||sentenceDefault;
    check(object(su)&&su.id===unitId&&Array.isArray(su.topics)&&object(sp)&&sp.version===1&&object(sp.sentences)&&validator&&typeof validator.valid==='function','句子课程或记录错误');
    su.topics.forEach(function(topic){
      check(object(topic)&&text(topic.id)&&Array.isArray(topic.sentences),'句子主题错误');
      topic.sentences.forEach(function(s){
        check(object(s)&&text(s.id)&&text(s.en),'句子内容错误');
        add('sentences',{id:'sentence:'+s.id,eventId:'sentence:'+s.id,kind:'sentence',title:s.en,topicId:topic.id,sentenceId:s.id},validator.valid(s,sp.sentences[s.id]));
      });
    });
    if(options.wordReview){
      check(typeof options.wordReview.plan==='function'&&Number.isSafeInteger(options.now)&&options.now>=0,'复习排期参数错误');
      var due=new Set(options.wordReview.plan(words,state.wordReview||{},function(id){return engine.wordPassed(words.find(function(w){return w.id===id;}),state.words[id]);},options.now).dueIds);
      out.review.sort(function(a,b){return Number(b.kind==='word'&&due.has(b.wordId))-Number(a.kind==='word'&&due.has(a.wordId));});
    }
    return out;
  }
  return {build:build};
});
