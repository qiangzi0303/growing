(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GrowingEnglishPomodoro = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STUDY = 1200000, REST = 300000;
  function integer(value) { return Number.isSafeInteger(value) && value >= 0; }
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function check(ok, message) { if (!ok) throw new Error(message); }
  function checkItem(item, from, to, message) {
    check(object(item) && ['id', 'kind', 'title', 'detail'].every(function (key) {
      return typeof item[key] === 'string' && (key === 'detail' || item[key].trim().length > 0);
    }) && typeof item.newWord === 'boolean' && integer(item.at) && item.at >= from && item.at <= to, message);
  }
  function restore(raw, unitId) {
    check(typeof unitId === 'string' && /^english-8a-0[1-8]$/.test(unitId), '单元不受支持');
    if (raw == null) return {version: 1, unitId: unitId, rounds: []};
    check(object(raw) && raw.unitId === unitId, '番茄记录单元不匹配');
    check(raw.version === 1 && Array.isArray(raw.rounds), '番茄记录格式错误');
    var ids = new Set();
    raw.rounds.forEach(function (r, index) {
      check(object(r) && typeof r.id === 'string' && r.id.length > 0 && !ids.has(r.id) && r.index === index, '番茄记录编号错误');
      ids.add(r.id);
      check(['learning', 'break', 'finished'].includes(r.phase) && integer(r.elapsedMs) && integer(r.restMs) && r.restMs <= REST && integer(r.lastAt) && integer(r.createdAt) && r.createdAt <= r.lastAt && (r.goal === 0 || r.goal === 8) && Array.isArray(r.items), '番茄记录状态错误');
      check(r.pauseUntil === null || (integer(r.pauseUntil) && r.pauseUntil > r.lastAt), '番茄记录暂停时间错误');
      check(r.phase === 'finished' ? integer(r.finishedAt) && r.finishedAt >= r.createdAt && r.finishedAt <= r.lastAt && r.restMs === 0 && r.pauseUntil === null : r.finishedAt === null && index === raw.rounds.length - 1, '番茄记录结束状态错误');
      var itemIds = new Set();
      r.items.forEach(function (item) {
        checkItem(item, r.createdAt, r.lastAt, '番茄记录内容错误');
        check(!itemIds.has(item.id), '番茄记录内容重复'); itemIds.add(item.id);
      });
      check(r.phase === 'learning' ? r.restMs === REST : r.elapsedMs >= STUDY, '番茄记录阶段错误');
      check(r.goal !== 8 || r.phase === 'learning' || newCount(r) >= 8, '番茄记录新词数量错误');
    });
    return copy(raw);
  }
  function newCount(r) { return r.items.filter(function (item) { return item.newWord; }).length; }
  function active(s) { var r = s.rounds[s.rounds.length - 1]; return r && r.phase !== 'finished' ? r : null; }
  function advance(raw, unitId, at) {
    check(integer(at), '番茄时间错误');
    var s = restore(raw, unitId), r = active(s);
    if (!r) return s;
    var now = Math.max(at, r.lastAt), from = r.lastAt;
    r.lastAt = now;
    if (r.pauseUntil !== null) {
      if (now < r.pauseUntil) return s;
      from = r.pauseUntil; r.pauseUntil = null;
    }
    var delta = now - from;
    if (r.phase === 'learning') {
      if (r.goal === 8 && newCount(r) < 8) { r.elapsedMs += delta; return s; }
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
      if (options && options.newWords) r.goal = 8;
      return s;
    }
    var previous = s.rounds[s.rounds.length - 1];
    at = Math.max(at, previous ? previous.lastAt : 0);
    s.rounds.push({id: unitId + ':' + (s.rounds.length + 1) + ':' + at, index: s.rounds.length, phase: 'learning', elapsedMs: 0, restMs: REST, lastAt: at, pauseUntil: null, goal: options && options.newWords ? 8 : 0, items: [], createdAt: at, finishedAt: null});
    return s;
  }
  function pause(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (r && r.pauseUntil === null) {
      check(integer(r.lastAt + REST), '番茄时间超出范围'); r.pauseUntil = r.lastAt + REST;
    }
    return s;
  }
  function resume(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (r) r.pauseUntil = null;
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
    if (recorded.newWord) r.goal = 8;
    if (r.elapsedMs >= STUDY && (r.goal === 0 || newCount(r) >= 8)) { r.phase = 'break'; r.pauseUntil = null; }
    return s;
  }
  return {restore: restore, start: start, pause: pause, resume: resume, advance: advance, complete: complete};
});
