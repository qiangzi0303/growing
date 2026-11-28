(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GrowingEnglishPomodoroPlan = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function check(ok, message) { if (!ok) throw new Error(message); }
  function object(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function text(v) { return typeof v === 'string' && v.trim().length > 0; }
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  function unit(id) { check(text(id) && /^english-8a-0[1-8]$/.test(id), '计划单元不受支持'); }
  function task(t) {
    check(object(t) && ['id', 'eventId', 'title'].every(function (k) { return text(t[k]); }) &&
      ['word', 'point', 'lesson', 'sentence'].includes(t.kind) && typeof t.review === 'boolean' && typeof t.newWord === 'boolean', '计划目标格式错误');
    var fields = {word: ['wordId'], point: ['lessonId', 'pointId'], lesson: ['lessonId'], sentence: ['topicId', 'sentenceId']}[t.kind];
    check(fields.every(function (k) { return text(t[k]); }), '计划目标定位错误');
    check(!t.newWord || (t.kind === 'word' && !t.review), '计划目标新词状态错误');
    check(t.category === undefined || ['words','grammar','sentences','reading'].includes(t.category), '计划目标分类错误');
  }
  function validate(plan, unitId) {
    unit(unitId);
    check(object(plan) && plan.unitId === unitId, '计划单元不匹配');
    check(plan.version === 1 && Array.isArray(plan.rounds), '计划格式错误');
    check(plan.layout === undefined || ['mixed-v1','mixed-v2'].includes(plan.layout), '计划布局版本错误');
    var ids = new Set();
    plan.rounds.forEach(function (r) {
      check(object(r) && text(r.id) && !ids.has(r.id) && text(r.title) && ['mixed', 'words', 'grammar', 'sentences', 'reading', 'review'].includes(r.kind) && Array.isArray(r.targets) && r.targets.length > 0, '计划轮次格式错误');
      ids.add(r.id);
      var targets = new Set(), events = new Set(), count = 0;
      r.targets.forEach(function (t) {
        task(t); check(t.unitId === undefined || t.unitId === unitId, '计划目标单元不匹配');
        check(!targets.has(t.id) && !events.has(t.eventId), '计划目标重复');
        targets.add(t.id); events.add(t.eventId); if (t.newWord) count++;
      });
      check(count <= 10, '计划目标新词过多');
    });
    return copy(plan);
  }
  function review(t) {
    check(object(t), '计划目标格式错误');
    var out = copy(t); out.id = t.review ? t.id : 'review:' + t.id; out.review = true; out.newWord = false;
    if (t.kind === 'word') out.eventId = 'review:' + t.wordId;
    return out;
  }
  function key(t) { return t.kind === 'word' ? 'word:' + t.wordId : t.eventId; }
  function category(t) { return t.category || (t.kind === 'word' ? 'words' : t.kind === 'sentence' ? 'sentences' : t.kind === 'lesson' || /(^|[-_])reading($|[-_])/i.test(t.lessonId || '') ? 'reading' : 'grammar'); }
  function build(unitId, catalog, seedTargets) {
    unit(unitId); check(object(catalog), '计划目录格式错误');
    var kinds = ['words', 'grammar', 'sentences', 'reading'], queues = {}, seen = new Set();
    kinds.concat(['review']).forEach(function (k) {
      check(catalog[k] === undefined || Array.isArray(catalog[k]), '计划目录格式错误');
      queues[k] = (catalog[k] || []).map(function (t) {
        var out = k === 'review' ? review(t) : copy(t); out.category = k === 'review' ? category(out) : k; task(out);
        if (k !== 'review') {
          check((k === 'reading' ? ['point','lesson'].includes(out.kind) : out.kind === {words:'word',grammar:'point',sentences:'sentence'}[k]) && !out.review, '计划目标类别错误');
          check(!seen.has(key(out)), '计划目标重复'); seen.add(key(out));
        }
        return out;
      });
    });
    // Credit completed targets in the active round while rebalancing its remaining work.
    var seeds = (seedTargets || []).map(function(t) { var out=copy(t);out.category=category(out);task(out);return out; });
    var seedKeys = new Set(seeds.map(key)), seedReviews=seeds.filter(function(t){return t.review;});
    kinds.forEach(function(k){queues[k]=seeds.filter(function(t){return !t.review&&t.category===k;}).concat(queues[k].filter(function(t){return !seedKeys.has(key(t));}));});
    queues.review=seedReviews.concat(queues.review.filter(function(t){return !seedKeys.has(key(t));}));
    var grouped = {words:[], grammar:[], sentences:[], reading:[]};
    var count = Math.max(Math.ceil(queues.words.length/10),Math.ceil(queues.grammar.length/2),Math.ceil(queues.sentences.length/8),queues.reading.length);
    for (var i = 0; i < queues.words.length; i += 10) grouped.words.push(queues.words.slice(i, i + 10));
    var topics = new Map();
    queues.sentences.forEach(function (t) { if (!topics.has(t.topicId)) topics.set(t.topicId, []); topics.get(t.topicId).push(t); });
    queues.sentences=Array.from(topics.values()).flat();
    ['grammar','reading','sentences'].forEach(function(k){
      var completed=queues[k].filter(function(t){return seedKeys.has(key(t));});
      var remaining=completed.concat(queues[k].filter(function(t){return !seedKeys.has(key(t));}));
      for(var j=0;j<count;j++)grouped[k].push(remaining.splice(0,Math.max(j===0?completed.length:0,Math.ceil(remaining.length/(count-j)))));
    });
    var pool = [], poolKeys = new Set(), cursor = 0, rounds = [];
    function add(t) { if (!poolKeys.has(key(t))) { poolKeys.add(key(t)); pool.push(t); } }
    queues.review.forEach(add);
    function reviews(main, required) {
      var excluded = new Set(main.map(key)), candidates = pool.filter(function (t) { return !excluded.has(key(t)); }), picked = (required || []).slice();
      if (!candidates.length) return picked;
      function pick(t){if(t&&!picked.some(function(p){return key(p)===key(t);}))picked.push(t);}
      // Finished subjects continue as review, so later rounds remain mixed.
      kinds.forEach(function(k){
        if(main.concat(picked).some(function(t){return t.category===k;}))return;
        var same=candidates.filter(function(t){return t.category===k;});pick(same[cursor%same.length]);
      });
      if(main.length){
        // Fill missing subjects, plus at most one word review; avoid four automatic extras.
        var wordReviews=candidates.filter(function(t){return t.kind==='word';});
        if(picked.length<2&&!picked.some(function(t){return t.kind==='word';}))pick(wordReviews[cursor%wordReviews.length]);
      }else for (var n = 0; n < candidates.length && picked.length < 4; n++) pick(candidates[(cursor + n) % candidates.length]);
      cursor += 3; return picked.map(review);
    }
    function round(main) {
      var targets = reviews(main,rounds.length===0?seedReviews:[]).concat(main);
      rounds.push({id:'mixed-' + (rounds.length + 1), title:'综合学习', kind:'mixed', targets:targets}); main.forEach(add);
    }
    while (kinds.some(function (k) { return grouped[k].length; })) {
      var main=[];kinds.forEach(function (k) { if (grouped[k].length) main=main.concat(grouped[k].shift()); });round(main);
    }
    if (!rounds.length && pool.length) round([]);
    return validate({version:1, layout:'mixed-v2', unitId:unitId, rounds:rounds}, unitId);
  }
  return {build:build, validate:validate};
});
