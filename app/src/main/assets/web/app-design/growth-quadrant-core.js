/* Pansgo / xiaoyang111222: https://github.com/xiaoyang111222/life-quadrant . CC BY-NC 4.0. Original scoring preserved. */
'use strict';
// 计分、等级、类型、「下一步重点」判定。校验脚本（Node）和网页版（浏览器）共用这一份，所有参数都来自 content.json。
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Quad = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function matches(rule, levels) {
    if (rule.else) return true;
    if (rule.all != null) return levels.every((l) => l === rule.all);
    if (rule.has && !rule.has.every((x) => levels.includes(x))) return false;
    if (rule.lacks && rule.lacks.some((x) => levels.includes(x))) return false;
    if (rule.count && levels.filter((l) => l === rule.count.level).length < rule.count.min) return false;
    return true;
  }

  function classify(types, levels) {
    return types.find((t) => matches(t.rule, levels));
  }

  function levelOfScore(scoring, sum) {
    const b = scoring.bands.find((x) => sum >= x.from && sum <= x.to);
    return b ? b.level : null;
  }

  // answers[i] = 第 i 题（content.questions 的下标）选了第几个选项（0 起），没答为 null/undefined
  function quadrantSums(c, answers) {
    const sums = Object.fromEntries(c.quadrants.map((q) => [q.id, 0]));
    c.questions.forEach((q, i) => {
      const a = answers[i];
      if (a != null && q.options[a]) sums[q.quadrant] += q.options[a].s;
    });
    return sums;
  }

  // 总分最低的象限；并列时按 focus.priority 靠前者。结果是确定的。
  function pickFocus(c, sums) {
    const prio = c.focus.priority;
    const min = Math.min(...c.quadrants.map((q) => sums[q.id]));
    const tied = c.quadrants.map((q) => q.id).filter((id) => sums[id] === min);
    tied.sort((a, b) => prio.indexOf(a) - prio.indexOf(b));
    return { id: tied[0], tied };
  }

  function evaluate(c, answers) {
    const sums = quadrantSums(c, answers);
    const per = c.scoring.perQuadrant;
    const quadrants = c.quadrants.map((q) => {
      const level = levelOfScore(c.scoring, sums[q.id]);
      return { ...q, sum: sums[q.id], avg: sums[q.id] / per, level, result: c.results[q.id][level] };
    });
    const type = classify(c.types, quadrants.map((q) => q.level));
    const focus = pickFocus(c, sums);
    return { quadrants, type, focusId: focus.id, tied: focus.tied };
  }

  return { matches, classify, levelOfScore, quadrantSums, pickFocus, evaluate };
});

