import catalogData from './ranking-rules.json';
import mathFeedback from '../../app/src/main/assets/web/app-design/math-feedback.js';
import wordMastery from '../../app/src/main/assets/web/app-design/word-mastery-rules.js';
import englishData from './english-rules.json';
import diagnosisData from './diagnosis-rules.json';
import diagnosis from '../../app/src/main/assets/web/app-design/diagnosis-engine.js';
import handwriting from '../../app/src/main/assets/web/app-design/handwriting-core.js';
import { masteryBoards } from './rankings';
import type { Document } from './database';

type Data = Record<string, any>;
const obj = (v: any): Data => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const arr = (v: any): any[] => Array.isArray(v) ? v : [];
const grade = (a: any) => mathFeedback.validGrade(a);
const pass = (a: any) => grade(a) && a.score >= 8 && !a.criticalErrors.length;
const validDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const dayOf = (v: any) => {
  if (typeof v !== 'number' && typeof v !== 'string' || !v) return null;
  const n = new Date(v).getTime();
  return Number.isFinite(n) && Math.abs(n + 8 * 3600000) <= 8640000000000000 ? new Date(n + 8 * 3600000).toISOString().slice(0, 10) : null;
};
const norm = (v: any) => String(v ?? '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/…/g, '...').replace(/\s*\.\.\.\s*/g, ' ... ').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
function wordPassed(w: any, r: any, legacy = false) {
  if(r?.protocol==='word-mastery-v2')return wordMastery.passed(w,r);
  const variants: Data = { humour: ['humour', 'humor'], programme: ['programme', 'program'], 'sec.': ['sec.', 'sec'] };
  const oldNorm = (v: string) => v.normalize('NFKC').trim().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  return r?.protocol === 'seven-recalls' && arr(r.answers).length === 7 && r.answers.every((a: any) => typeof a === 'string' && (legacy ?
    (w.id === 'w34' ? oldNorm(a) === oldNorm(w.word) : oldNorm(a).toLowerCase() === oldNorm(w.word).toLowerCase()) :
    (variants[w.word] ?? [w.word]).some((v: string) => norm(v) === norm(a))));
}

/** A read-only, unit-scoped report. Sync timestamps never substitute for study time. */
export function buildUnitReports(docs: Document[]) {
  const states = new Map<string, Data>(), warnings: string[] = [];
  for (const d of docs) if (d.value !== null) {
    try { const raw = JSON.parse(d.value); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error(); states.set(d.key, raw); }
    catch { warnings.push('一份学习记录格式异常，未计入单元报告，原存档保留。'); }
  }
  const boards = new Map(masteryBoards(docs).filter(b => b.kind === 'unit').map(b => [b.id, b]));
  const graphs = Object.fromEntries(Object.entries(diagnosisData).map(([k, v]) => [k, diagnosis.graph(v)]));
  const legacy = englishData.__legacy;
  const units = (catalogData as Data[]).flatMap(unit => {
    const board = boards.get(unit.id);
    let started = !!board, mastered = 0, total = 0, minutes = 0, hasTime = false;
    const dates = new Set<string>(), grades: any[] = [], daily = new Map<string, number>();
    const remember = (v: any) => { const d = dayOf(v); if (d) dates.add(d); };
    const time = (day: string, ms: any) => {
      if (!validDay(day) || typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return;
      hasTime = started = true; dates.add(day); daily.set(day, Math.min(86400000, (daily.get(day) ?? 0) + ms));
    };
    const attempts = (r: any, old = false) => {
      const list = arr(r?.attempts).filter(a => old ? a?.valid === true && typeof a.score === 'number' && a.score >= 0 && a.score <= 10 && (!a.criticalErrors || Array.isArray(a.criticalErrors)) : grade(a));
      list.forEach(a => { grades.push(a); remember(a.at); });
      return list;
    };
    if (['math', 'physics', 'fraction'].includes(unit.kind)) {
      const old = unit.kind === 'fraction', s = states.get(old ? 'fraction-minute-v1' : `growing-${unit.kind}-lessons-v1`) ?? {};
      total = unit.topics.length;
      for (const id of unit.topics) {
        const r = obj(s.topics?.[id]), list = attempts(r, old);
        if (old) {
          const exams = arr(r.exams).filter(e => e?.real === false && Number.isInteger(e.total) && e.total > 0 && Number.isInteger(e.correct) && e.correct >= 0 && e.correct <= e.total);
          exams.forEach(e => remember(e.at));
          const concept = Object.hasOwn(obj(s.learning?.mastery), id) || list.some(a => a.score >= 8 && !arr(a.criticalErrors).length);
          if (concept && exams.some(e => e.correct === e.total)) mastered++;
        } else if (list.some(pass) && r.bestQuiz === 3) mastered++;
      }
      if (old) {
        for (const [d, ms] of Object.entries(obj(s.activity?.days))) time(d, ms);
        for (const [d, rows] of Object.entries(obj(s.learning?.days))) if (validDay(d) && unit.topics.some((id: string) => Object.values(obj(obj(rows)[id])).some(v => typeof v === 'number' && v > 0))) { dates.add(d); started = true; }
      } else for (const [d, rows] of Object.entries(obj(s.tools?.days))) for (const id of unit.topics) {
        const row = obj(obj(rows)[id]); time(d, row.ms);
        if (validDay(d) && ['reads','grades','practice','special'].some(k => typeof row[k] === 'number' && row[k] > 0)) { dates.add(d); started = true; }
      }
    } else if (unit.kind === 'english') {
      const s = states.get('growing-english-course-v1:' + unit.id) ?? {};
      total = unit.rules.words.length + unit.rules.lessons.length;
      for (const w of unit.rules.words) { const r = s.words?.[w.id]; if (wordPassed(w, r)) mastered++; if (r) remember(r.at); }
      for (const l of unit.rules.lessons) {
        const r = s.lessons?.[l.id];
        if (r?.protocol === 'three-correct' && arr(r.answers).length === l.answers.length && r.answers.every((a: any, i: number) => typeof a === 'string' && a === l.answers[i])) mastered++;
        if (r) remember(r.at); attempts(s.feynman?.[l.id]);
      }
      for (const [d, ms] of Object.entries(obj(s.learningTime?.days))) time(d, ms);
    } else {
      const s = states.get('wordops_8A_unit3') ?? {};
      total = legacy.words.length + unit.tests.length;
      for (const w of legacy.words) { const r = s.mastered?.[w.id]; if (wordPassed(w, r, true)) mastered++; if (r) remember(r.at); }
      for (const id of unit.tests) if (typeof s.best?.[id] === 'number' && s.best[id] >= 80 && s.best[id] <= 100) mastered++;
      arr(s.records).forEach(r => remember(r?.at));
      for (const [d, ms] of Object.entries(obj(s.learningTime?.days))) time(d, ms);
      for (const [d, row] of Object.entries(obj(s.studyHistory?.days))) if (validDay(d) && ['words','cards','quizzes','feynman'].some(k => Object.keys(obj(row)[k] ?? {}).length)) { dates.add(d); started = true; }
    }
    const diagnostic = { passed: 0, shaky: 0, weak: 0, tested: 0, total: unit.diagnosisTopics?.length ?? 0 };
    const archive = states.get('growing-diagnosis-v1:' + unit.id);
    if (archive?.version === 1 && graphs[unit.subject]) {
      const cache = new Map<any, Record<string, number> | null>();
      for (const id of unit.diagnosisTopics ?? []) {
        const session = obj(archive.records)[id];
        if (!session || !arr(session.targets).length || !session.targets.every((t: any) => unit.diagnosisTopics.includes(t))) continue;
        try {
          if (!cache.has(session)) cache.set(session, diagnosis.assessmentCredit(graphs[unit.subject], session));
          const credit = cache.get(session)?.[id]; if (credit === undefined) continue;
          diagnostic.tested++; started = true;
          if (credit === 1) diagnostic.passed++; else if (credit === .5) diagnostic.shaky++; else diagnostic.weak++;
        } catch { /* Unverifiable or unfinished assessments do not certify results. */ }
      }
    }
    const written: any[] = [];
    for (const [key, s] of states) if (handwriting.KEY.test(key) && s.unitId === unit.id && handwriting.validate(s) && s.pages.some((p: any[]) => p.length)) {
      started = true; remember(s.updatedAt);
      const g = s.grades.filter((g: any) => g.revision === s.revision).at(-1);
      if (g) written.push({ score: g.score, needsReview: g.needsReview, at: g.at });
    }
    if (!started) return [];
    minutes = [...daily.values()].reduce((n, ms) => n + ms / 60000, 0);
    const ordered = [...dates].sort();
    const timedGrades = grades.filter(a => dayOf(a.at)).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    written.sort((a, b) => a.at.localeCompare(b.at));
    return [{ id: unit.id, title: unit.title, subject: unit.subject, subjectName: unit.subjectName, term: unit.term, termName: unit.termName,
      activeMinutes: hasTime ? minutes : null, firstStudyDay: ordered[0] ?? null, lastStudyDay: ordered.at(-1) ?? null, studyDays: ordered.length,
      mastered, total, masteryPercent: Math.round(100 * mastered / total),
      concept: { passed: board?.conceptDone ?? 0, total: board?.conceptTotal ?? unit.topics?.length ?? unit.rules?.lessons.length, retainedAttempts: grades.length,
        best: grades.length ? Math.max(...grades.map(g => g.score)) : null, latest: timedGrades.at(-1)?.score ?? null },
      practice: { done: board?.testDone ?? 0, total: board?.testTotal ?? total }, diagnostic,
      handwriting: { graded: written.length, latest: written.at(-1) ?? null },
    }];
  });
  return { units, lastSyncedAt: docs.map(d => d.updatedAt).sort().at(-1) ?? null, warnings: [...new Set(warnings)],
    note: '仅显示已有学习记录的已开放单元。时长为课程实际保存的有效学习计时，缺失时不补算；学习日期来自留存活动与评测，不代表完整历史。课程达标沿用各课堂标准：数学/物理须概念与应用均通过，英语按必会词汇和阅读语法检测（Unit 3含知识关卡）。图谱初筛单独展示，不计作课程达标。' };
}
