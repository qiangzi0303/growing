(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GrowingEnglishPomodoro = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STUDY = 1500000, REST = 300000, LIMIT = 3000000;
  function integer(value) { return Number.isSafeInteger(value) && value >= 0; }
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function check(ok, message) { if (!ok) throw new Error(message); }
  function checkTargets(r) {
    check(typeof r.planId === 'string' && r.planId.trim() && typeof r.title === 'string' && r.title.trim() && ['mixed','words','grammar','sentences','reading','review'].includes(r.kind) && Array.isArray(r.targets) && r.targets.length > 0, '番茄记录目标格式错误');
    var ids = new Set(), events = new Set();
    r.targets.forEach(function (t) {
      check(object(t) && ['id','eventId','kind','title'].every(function (k) { return typeof t[k] === 'string' && t[k].trim(); }) && ['word','point','lesson','sentence'].includes(t.kind) && typeof t.newWord === 'boolean' && typeof t.review === 'boolean' && (!t.newWord || (t.kind === 'word' && !t.review)) && !ids.has(t.id) && !events.has(t.eventId), '番茄记录目标格式错误');
      ids.add(t.id); events.add(t.eventId);
    });
    check(r.goal === r.targets.filter(function (t) { return t.newWord; }).length && r.goal <= 10, '番茄记录目标数量错误');
  }
  function goalsMet(r) {
    return r.targets ? r.targets.every(function (t) { return r.items.some(function (i) { return (i.eventId || i.id) === t.eventId && (!t.newWord || i.newWord); }); }) : newCount(r) >= r.goal;
  }
  function checkItem(item, from, to, message) {
    check(object(item) && ['id', 'kind', 'title', 'detail'].every(function (key) {
      return typeof item[key] === 'string' && (key === 'detail' || item[key].trim().length > 0);
    }) && (item.eventId === undefined || (typeof item.eventId === 'string' && item.eventId.trim().length > 0)) && typeof item.newWord === 'boolean' && integer(item.at) && item.at >= from && item.at <= to, message);
  }
  function restore(raw, unitId) {
    check(typeof unitId === 'string' && /^english-8a-0[1-8]$/.test(unitId), '单元不受支持');
    if (raw == null) return {version: 1, unitId: unitId, rounds: []};
    check(object(raw) && raw.unitId === unitId, '番茄记录单元不匹配');
    check(raw.version === 1 && Array.isArray(raw.rounds), '番茄记录格式错误');
    var ids = new Set(), plans = new Map();
    raw.rounds.forEach(function (r, index) {
      check(object(r) && typeof r.id === 'string' && r.id.length > 0 && !ids.has(r.id) && r.index === index, '番茄记录编号错误');
      ids.add(r.id);
      check(['learning', 'break', 'finished'].includes(r.phase) && integer(r.elapsedMs) && integer(r.restMs) && r.restMs <= REST && integer(r.lastAt) && integer(r.createdAt) && r.createdAt <= r.lastAt && (r.targets !== undefined ? integer(r.goal) && r.goal <= 10 : [0,8,10].includes(r.goal)) && Array.isArray(r.items), '番茄记录状态错误');
      if (r.targets !== undefined) checkTargets(r);
      if (r.retryOf !== undefined) {
        var previous = raw.rounds.slice(0, index).find(function (old) { return old.id === r.retryOf; });
        check(previous && previous.phase === 'finished' && ['manual','timeout'].includes(previous.endReason) && previous.planId === r.planId && r.createdAt >= previous.lastAt &&
          !raw.rounds.slice(0, index).some(function (old) { return old.retryOf === r.retryOf; }), '番茄重学历史关联错误');
      }
      if (r.planId) {
        check(!plans.has(r.planId) || plans.get(r.planId) === r.retryOf, '番茄重学计划记录不匹配');
        plans.set(r.planId, r.id);
      }
      check(r.pauseUntil === null || (integer(r.pauseUntil) && r.pauseUntil > r.lastAt), '番茄记录暂停时间错误');
      check(r.phase === 'finished' ? integer(r.finishedAt) && r.finishedAt >= r.createdAt && r.finishedAt <= r.lastAt && r.restMs === 0 && r.pauseUntil === null : r.finishedAt === null && index === raw.rounds.length - 1, '番茄记录结束状态错误');
      check(r.endReason === undefined || (r.phase === 'finished' && (r.endReason === 'manual' || r.endReason === 'timeout' && r.elapsedMs === LIMIT)), '番茄记录结束或超时状态错误');
      var itemIds = new Set();
      r.items.forEach(function (item) {
        checkItem(item, r.createdAt, r.lastAt, '番茄记录内容错误');
        check(!itemIds.has(item.id), '番茄记录内容重复'); itemIds.add(item.id);
      });
      // Already resting or finished records may come from the former 20-minute rule.
      check(r.phase === 'learning' ? r.restMs === REST : r.endReason === 'manual' || r.elapsedMs >= 1200000, '番茄记录阶段错误');
      check(r.phase === 'learning' || r.endReason !== undefined || goalsMet(r), '番茄记录目标未完成');
    });
    return copy(raw);
  }
  function newCount(r) { return r.items.filter(function (item) { return item.newWord; }).length; }
  function active(s) { var r = s.rounds[s.rounds.length - 1]; return r && r.phase !== 'finished' ? r : null; }
  function expire(r, at) {
    if (r.elapsedMs > LIMIT) r.previousElapsedMs = r.elapsedMs;
    r.elapsedMs = LIMIT; r.phase = 'finished'; r.endReason = 'timeout';
    r.restMs = 0; r.pauseUntil = null; r.finishedAt = at;
  }
  function advance(raw, unitId, at) {
    check(integer(at), '番茄时间错误');
    var s = restore(raw, unitId), r = active(s);
    if (!r) return s;
    var now = Math.max(at, r.lastAt), from = r.lastAt;
    r.lastAt = now;
    // Old open rounds may already exceed the new cap; preserve their original duration.
    if (r.phase === 'learning' && r.elapsedMs >= LIMIT) { expire(r, now); return s; }
    if (r.pauseUntil !== null) {
      if (now < r.pauseUntil) return s;
      from = r.pauseUntil; r.pauseUntil = null;
    }
    var delta = now - from;
    if (r.phase === 'learning') {
      if (!goalsMet(r)) {
        var studyConsumed = Math.min(delta, LIMIT - r.elapsedMs);
        r.elapsedMs += studyConsumed;
        if (r.elapsedMs >= LIMIT) expire(r, from + studyConsumed);
        return s;
      }
      var consumed = Math.min(delta, Math.max(0, STUDY - r.elapsedMs));
      r.elapsedMs += consumed; delta -= consumed; from += consumed;
      if (r.elapsedMs >= STUDY) r.phase = 'break';
    }
    if (r.phase === 'break') {
      var restConsumed = Math.min(delta, r.restMs);
      r.restMs -= restConsumed;
      if (r.restMs === 0) { r.phase = 'finished'; r.finishedAt = from + restConsumed; }
    }
    return s;
  }
  function start(raw, unitId, at, options) {
    var s = advance(raw, unitId, at), r = active(s);
    if (r) {
      check(r.phase !== 'break', '请等待休息结束');
      if (!r.targets && r.goal === 0 && options && options.newWords) r.goal = 10;
      return s;
    }
    var previous = s.rounds[s.rounds.length - 1];
    at = Math.max(at, previous ? previous.lastAt : 0);
    r = {id: unitId + ':' + (s.rounds.length + 1) + ':' + at, index: s.rounds.length, phase: 'learning', elapsedMs: 0, restMs: REST, lastAt: at, pauseUntil: null, goal: options && options.newWords ? 10 : 0, items: [], createdAt: at, finishedAt: null};
    if (options && options.planRound !== undefined) {
      var p = options.planRound;
      check(object(p) && Array.isArray(p.targets), '番茄记录目标格式错误');
      r.planId = p.id; r.title = p.title; r.kind = p.kind; r.targets = copy(p.targets);
      r.goal = r.targets.filter(function (t) { return t && t.newWord; }).length; checkTargets(r);
    }
    s.rounds.push(r);
    return s;
  }
  function pause(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (r && r.pauseUntil === null) {
      check(integer(r.lastAt + REST), '番茄时间超出范围'); r.pauseUntil = r.lastAt + REST;
    }
    return s;
  }
  function restart(raw, unitId, at, options) {
    var s = advance(raw, unitId, at), current = active(s);
    var previous = s.rounds.find(function (r) { return r.id === options?.roundId; });
    check(previous && previous.phase === 'finished' && ['manual','timeout'].includes(previous.endReason), '请选择已结束或超时的番茄重新学习');
    if (current && current.retryOf === previous.id) return s;
    check(!current, '请先结束当前番茄，再重新学习');
    check(!s.rounds.some(function (r) { return r.retryOf === previous.id; }), '该次记录已重学，请选择最新一轮');
    var planRound = options.planRound || (previous.targets ? {id:previous.planId,title:previous.title,kind:previous.kind,targets:previous.targets} : undefined);
    check(!planRound || planRound.id === previous.planId, '番茄重学目标不匹配');
    s = start(s, unitId, at, planRound ? {planRound:planRound} : {newWords:previous.goal > 0});
    var next = s.rounds[s.rounds.length - 1];
    next.retryOf = previous.id;
    if (!next.targets) next.goal = previous.goal;
    return s;
  }
  function resume(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (r) r.pauseUntil = null;
    return s;
  }
  function finish(raw, unitId, at, options) {
    var s = advance(raw, unitId, at), r = active(s);
    if (!r) return s;
    check(!options || !options.roundId || options.roundId === r.id, '当前番茄已变化，请重新打开后操作');
    r.phase = 'finished'; r.endReason = 'manual'; r.finishedAt = r.lastAt;
    r.restMs = 0; r.pauseUntil = null;
    return s;
  }
  function complete(raw, unitId, at, item) {
    var s = advance(raw, unitId, at), r = active(s);
    if (!r || r.phase !== 'learning') return s;
    check(object(item), '学习内容错误');
    var recorded = Object.assign({}, item, {at: r.lastAt});
    checkItem(recorded, r.createdAt, r.lastAt, '学习内容错误');
    if (r.items.some(function (existing) { return existing.id === recorded.id; })) return s;
    r.items.push(copy(recorded));
    if (!r.targets && recorded.newWord && r.goal === 0) r.goal = 10;
    if (r.elapsedMs >= STUDY && goalsMet(r)) { r.phase = 'break'; r.pauseUntil = null; }
    return s;
  }
  return {restore: restore, start: start, restart: restart, pause: pause, resume: resume, finish: finish, advance: advance, complete: complete};
});
