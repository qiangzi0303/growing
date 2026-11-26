(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GrowingMathPomodoro = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STUDY = 1500000, REST = 300000, LONG_REST = 900000;
  var phases = ['learning', 'ready', 'break', 'finished', 'stopped'];
  var kinds = ['read', 'recall', 'question', 'doubt'];
  var statuses = ['read', 'graded', 'submitted', 'correct', 'incorrect', 'corrected', 'pending', 'answered'];
  function integer(value) { return Number.isSafeInteger(value) && value >= 0; }
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function text(value) { return typeof value === 'string' && value.trim().length > 0; }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function check(ok, message) { if (!ok) throw new Error(message); }
  function checkItem(item, from, to) {
    check(object(item) && ['id', 'nodeId', 'title'].every(function (key) { return text(item[key]); }) &&
      kinds.includes(item.kind) && statuses.includes(item.status) && typeof item.detail === 'string' &&
      integer(item.at) && item.at >= from && item.at <= to &&
      (item.score === undefined || Number.isFinite(item.score) && item.score >= 0 && item.score <= 10) &&
      (item.attempts === undefined || integer(item.attempts)), '番茄学习记录格式错误');
  }
  function restore(raw, unitId) {
    check(typeof unitId === 'string' && /^math-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(unitId), '数学单元不受支持');
    if (raw == null) return {version: 1, unitId: unitId, rounds: []};
    check(object(raw) && raw.unitId === unitId, '番茄记录单元不匹配');
    check(raw.version === 1 && Array.isArray(raw.rounds), '番茄记录版本或格式错误');
    var ids = new Set(), completed = 0;
    raw.rounds.forEach(function (r, index) {
      check(object(r) && text(r.id) && !ids.has(r.id) && r.index === index, '番茄记录编号错误');
      ids.add(r.id);
      check(text(r.nodeId) && text(r.nodeTitle) && phases.includes(r.phase) &&
        integer(r.elapsedMs) && r.elapsedMs <= STUDY && integer(r.pauseMs) &&
        integer(r.createdAt) && integer(r.lastAt) && r.lastAt >= r.createdAt &&
        r.elapsedMs + r.pauseMs <= r.lastAt - r.createdAt && Array.isArray(r.items), '番茄记录状态错误');
      var full = r.phase === 'ready' || r.phase === 'break' || r.phase === 'finished';
      check(full ? r.elapsedMs === STUDY : r.elapsedMs < STUDY, '番茄记录专注时长错误');
      check(r.phase === 'learning' ? r.endedAt === null : integer(r.endedAt) &&
        r.endedAt >= r.createdAt + r.elapsedMs + r.pauseMs && r.endedAt <= r.lastAt, '番茄记录结束时间错误');
      check(r.pausedAt === null || r.phase === 'learning' && integer(r.pausedAt) &&
        r.pausedAt >= r.createdAt && r.pausedAt <= r.lastAt, '番茄记录暂停时间错误');
      var expectedRest = (completed + 1) % 4 === 0 ? LONG_REST : REST;
      check(r.restTotalMs === expectedRest && integer(r.restMs) && r.restMs <= r.restTotalMs, '番茄记录休息时长错误');
      check(r.phase === 'finished' || r.phase === 'stopped' ? r.restMs === 0 :
        r.phase === 'break' ? r.restMs > 0 : r.restMs === r.restTotalMs, '番茄记录休息状态错误');
      check(r.phase === 'finished' || r.phase === 'stopped' || index === raw.rounds.length - 1, '番茄记录有多个进行中的计时');
      if (full) completed++;
      var itemIds = new Set();
      r.items.forEach(function (item) {
        checkItem(item, r.createdAt, r.lastAt);
        check(!itemIds.has(item.id), '番茄学习记录重复'); itemIds.add(item.id);
      });
    });
    return copy(raw);
  }
  function active(s) {
    var r = s.rounds[s.rounds.length - 1];
    return r && r.phase !== 'finished' && r.phase !== 'stopped' ? r : null;
  }
  function advance(raw, unitId, at) {
    check(integer(at), '番茄时间错误');
    var s = restore(raw, unitId), r = active(s);
    if (!r) return s;
    var now = Math.max(at, r.lastAt), from = r.lastAt, delta = now - from;
    r.lastAt = now;
    if (r.phase === 'learning') {
      if (r.pausedAt !== null) { r.pauseMs += delta; return s; }
      var consumed = Math.min(delta, STUDY - r.elapsedMs);
      r.elapsedMs += consumed;
      if (r.elapsedMs === STUDY) { r.phase = 'ready'; r.endedAt = from + consumed; }
    } else if (r.phase === 'break') {
      r.restMs = Math.max(0, r.restMs - delta);
      if (r.restMs === 0) r.phase = 'finished';
    }
    return s;
  }
  function start(raw, unitId, at, options) {
    var s = advance(raw, unitId, at);
    if (active(s)) return s;
    check(object(options) && text(options.nodeId) && text(options.nodeTitle), '请选择本轮数学知识点');
    var previous = s.rounds[s.rounds.length - 1];
    at = Math.max(at, previous ? previous.lastAt : 0);
    var completed = s.rounds.filter(function (r) { return r.phase === 'finished'; }).length;
    var rest = (completed + 1) % 4 === 0 ? LONG_REST : REST;
    s.rounds.push({id: unitId + ':' + (s.rounds.length + 1) + ':' + at, index: s.rounds.length,
      nodeId: options.nodeId, nodeTitle: options.nodeTitle, phase: 'learning', elapsedMs: 0,
      pauseMs: 0, pausedAt: null, restMs: rest, restTotalMs: rest, createdAt: at,
      lastAt: at, endedAt: null, items: []});
    return s;
  }
  function pause(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (r && r.phase === 'learning' && r.pausedAt === null) r.pausedAt = r.lastAt;
    return s;
  }
  function resume(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (r && r.phase === 'learning') r.pausedAt = null;
    return s;
  }
  function finish(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (r) {
      if (r.phase === 'learning') { r.phase = 'stopped'; r.endedAt = r.lastAt; }
      else r.phase = 'finished';
      r.pausedAt = null; r.restMs = 0;
    }
    return s;
  }
  function startBreak(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (!r || r.phase === 'break') return s;
    check(r.phase === 'ready', '请先完成本轮专注，再开始休息');
    r.phase = 'break';
    return s;
  }
  function skipBreak(raw, unitId, at) {
    var s = advance(raw, unitId, at), r = active(s);
    if (!r) return s;
    check(r.phase !== 'learning', '请先结束本轮专注');
    r.phase = 'finished'; r.restMs = 0;
    return s;
  }
  function record(raw, unitId, at, item, roundId) {
    var s = advance(raw, unitId, at), r;
    if (roundId !== undefined && roundId !== null) {
      r = s.rounds.find(function (entry) { return entry.id === roundId; });
      check(r, '原学习番茄记录不存在');
    } else {
      r = active(s);
      if (!r || r.phase !== 'learning' || r.pausedAt !== null) return s;
    }
    check(object(item), '番茄学习记录格式错误');
    var existing = r.items.find(function (entry) { return entry.id === item.id; });
    check(!existing || existing.kind === item.kind && existing.nodeId === item.nodeId, '番茄学习记录归属不匹配');
    var now = Math.max(at, r.lastAt), entry = Object.assign({}, existing, item, {at: existing ? existing.at : now});
    checkItem(entry, r.createdAt, now);
    if (existing) r.items[r.items.indexOf(existing)] = copy(entry);
    else r.items.push(copy(entry));
    // A delayed grade may update its originating round after study has ended.
    r.lastAt = now;
    return s;
  }
  return {restore: restore, advance: advance, start: start, pause: pause, resume: resume,
    finish: finish, startBreak: startBreak, skipBreak: skipBreak, record: record};
});
