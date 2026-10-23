import rulesData from "./english-rules.json";
import type { Document } from "./database";

type ObjectData = Record<string, any>;
const obj = (v: unknown): ObjectData => v !== null && typeof v === "object" && !Array.isArray(v) ? v : {};
const arr = (v: unknown): any[] => Array.isArray(v) ? v : [];
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const rules = rulesData as ObjectData;
const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/[’‘]/g, "'")
  .replace(/…/g, "...").replace(/\s*\.\.\.\s*/g, " ... ").replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").trim();
function wordPassed(word: any, record: any) {
  const variants: Record<string, string[]> = { humour: ["humour", "humor"], programme: ["programme", "program"], "sec.": ["sec.", "sec"] };
  return record?.protocol === "seven-recalls" && Array.isArray(record.answers) && record.answers.length === 7 &&
    record.answers.every((answer: unknown) => (variants[word.word] ?? [word.word]).some(v => normalize(v) === normalize(answer)));
}
export function buildReport(docs: Document[]) {
  const subjects = ["数学", "英语", "物理"].map(subject => ({ subject, read: 0, mastered: 0, practice: 0, activeMinutes: 0, dailyMinutes: {} as Record<string, number> }));
  const [math, english, physics] = subjects, warnings: string[] = [];
  const addDays = (report: typeof math, days: unknown) => {
    for (const [date, ms] of Object.entries(obj(days))) report.dailyMinutes[date] = (report.dailyMinutes[date] ?? 0) + Math.min(num(ms), 86_400_000) / 60_000;
  };
  for (const doc of docs.filter(d => d.value !== null && !d.key.startsWith("growing-activity-v1:") && !d.key.startsWith('growing-handwriting-v1:'))) {
    try {
      const parsed = JSON.parse(doc.value!);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("Invalid record");
      const data = obj(parsed);
      if (["growing-math-lessons-v1", "growing-physics-lessons-v1"].includes(doc.key)) {
        const report = doc.key.includes("physics") ? physics : math;
        for (const topic of Object.values(obj(data.topics))) {
          if (topic?.seen === true) report.read++;
          if (arr(topic?.attempts).some(a => Number.isInteger(a?.score) && a.score >= 8 && a.score <= 10 && typeof a.feedback === "string" && Array.isArray(a.criticalErrors) && a.criticalErrors.length === 0) && num(topic?.bestQuiz) === 3) report.mastered++;
        }
        for (const [date, rows] of Object.entries(obj(data.tools?.days))) {
          const topics = Object.values(obj(rows));
          const ms = topics.reduce((sum, t) => sum + Math.min(num(t?.ms), 86_400_000), 0);
          report.dailyMinutes[date] = (report.dailyMinutes[date] ?? 0) + ms / 60_000;
          report.practice += Math.trunc(Math.min(100_000, topics.reduce((sum, t) => sum + num(t?.practice) + num(t?.special), 0)));
        }
      }
      if (doc.key.startsWith("growing-english-course-v1:")) {
        english.read += Object.keys(obj(data.words)).length;
        english.practice += Object.keys(obj(data.lessons)).length;
        const unit = rules[doc.key.slice("growing-english-course-v1:".length)];
        for (const word of arr(unit?.words)) if (wordPassed(word, data.words?.[word.id])) english.mastered++;
        for (const lesson of arr(unit?.lessons)) {
          const record = data.lessons?.[lesson.id];
          if (record?.protocol === "three-correct" && Array.isArray(record.answers) && record.answers.length === lesson.answers.length &&
              record.answers.every((answer: unknown, i: number) => String(answer) === String(lesson.answers[i]))) english.mastered++;
        }
      }
      if (doc.key === "fraction-minute-v1") {
        for (const id of rules.__legacy.fractionTopics) {
          const topic = data.topics?.[id], mastery = Object.hasOwn(obj(data.learning?.mastery), id);
          if (String(topic?.draft ?? "").length || arr(topic?.attempts).length || arr(topic?.exams).length || mastery) math.read++;
          if (mastery || arr(topic?.attempts).some(a => a?.valid === true && typeof a.score === "number" && a.score >= 8 && a.score <= 10 && (!Array.isArray(a.criticalErrors) || a.criticalErrors.length === 0))) math.mastered++;
          math.practice += arr(topic?.exams).length;
        }
        addDays(math, data.activity?.days);
      }
      if (doc.key === "wordops_8A_unit3") {
        const legacy = rules.__legacy, seen = new Set(legacy.seenIds);
        english.read += new Set(arr(data.seen).filter(v => seen.has(v))).size;
        const oldNormalize = (v: unknown) => String(v ?? "").normalize("NFKC").trim().replace(/[’‘]/g, "'").replace(/\s+/g, " ");
        for (const word of legacy.words) {
          const record = data.mastered?.[word.id];
          if (record?.protocol === "seven-recalls" && Array.isArray(record.answers) && record.answers.length === 7 && record.answers.every((answer: unknown) =>
            word.id === "w34" ? oldNormalize(answer) === oldNormalize(word.word) : oldNormalize(answer).toLowerCase() === oldNormalize(word.word).toLowerCase())) english.mastered++;
        }
        for (const id of legacy.tests) if (num(data.best?.[id]) >= 80 && num(data.best?.[id]) <= 100) english.mastered++;
        english.practice += arr(data.records).length;
        addDays(english, data.learningTime?.days);
      }
    } catch { warnings.push("一份学习记录无法汇总，原存档保留。"); }
  }
  const measured: Record<string, Record<string, number>> = {};
  for (const doc of docs.filter(d => d.key.startsWith("growing-activity-v1:") && d.value !== null)) {
    try {
      const data = JSON.parse(doc.value!);
      for (const [date, entries] of Object.entries(obj(data?.days))) for (const report of subjects) {
        const minutes = Math.min(num(obj(entries)[report.subject]), 86_400) / 60;
        if (!minutes) continue;
        const days = measured[report.subject] ??= {};
        days[date] = (days[date] ?? 0) + minutes;
      }
    } catch { warnings.push("一份活跃时长记录格式异常，原存档保留。"); }
  }
  for (const report of subjects) {
    for (const [date, minutes] of Object.entries(measured[report.subject] ?? {})) report.dailyMinutes[date] = Math.max(report.dailyMinutes[date] ?? 0, minutes);
    report.activeMinutes = Object.values(report.dailyMinutes).reduce((sum, n) => sum + n, 0);
  }
  return {
    subjects, lastSyncedAt: docs.length ? docs.map(d => d.updatedAt).sort().at(-1)! : null,
    note: "显示最近同步的设备记录；离线未同步内容不显示。掌握沿用各课堂规则：数学/物理普通微课需解释和练习均达标，原分式按有效AI评分达8分，英语单词需连续7次正确。每日时长取课程已有计时与新增前台活跃计时的较大值，避免重复累计。练习记录口径随课堂存档而异，非统一考试次数。",
    warnings,
  };
}
