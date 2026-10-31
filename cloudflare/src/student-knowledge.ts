import catalogData from './ranking-rules.json';
import graphsData from './diagnosis-rules.json';
import english from './english-rules.json';
import titlesData from './knowledge-titles.json';
import mathQuestions from './math-wrong-question-rules.json';
import feedback from '../../app/src/main/assets/web/app-design/math-feedback.js';
import diagnosis from '../../app/src/main/assets/web/app-design/diagnosis-engine.js';
import handwriting from '../../app/src/main/assets/web/app-design/handwriting-core.js';
import { buildUnitReports, wordPassed } from './unit-reports';
import { HttpError, type Database, type Document, type User, Store } from './database';

type Data = Record<string, any>;
const obj = (v: any): Data => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const arr = (v: any): any[] => Array.isArray(v) ? v : [];
const text = (v: any, limit = 300) => typeof v === 'string' ? v.slice(0, limit) : '';
const titles = titlesData as Record<string, string>;
const catalog = catalogData as Data[];
const NOTES = 'growing-student-notes-v1';
const graphs = Object.fromEntries(Object.entries(graphsData).map(([s, g]) => [s, diagnosis.graph(g)]));
const iso = (v: any) => (typeof v === 'number' || typeof v === 'string') && v && Number.isFinite(new Date(v).getTime()) ? new Date(v).toISOString() : null;
export interface KnowledgeTopic {
  id: string; unitId: string; unitTitle: string; subject: string; title: string;
  status: 'unknown' | 'learning' | 'mastered' | 'weak' | 'review';
  courseMastered: boolean; diagnosis: string | null; evidence: string[]; lastEvidenceAt: string | null;
}

export interface MistakeEvidence {
  id: string; unitId: string; topicIds: string[]; title: string;
  source: 'question-bank' | 'paper-question' | 'written-work'; sourceLabel: string;
  association: 'title-keyword' | 'graded-node' | 'unit-only';
  status: 'needs-review' | 'latest-correct' | 'historical';
  cause: string | null; causeSource: 'handwriting-node-feedback' | 'unrecorded';
  at: string | null; questionNumber?: string; paperTitle?: string; sourceRevision?: number;
}

// Conservative links within the same unit. A unit match alone never identifies an error in a particular concept.
const aliases: Record<string, string[]> = {
  'tri-lines': ['中线','高线','角平分线'], 'tri-angles': ['内角','外角'], 'tri-inequality': ['三边关系'],
  congruence: ['全等三角形','对应关系'], 'perp-bisector': ['垂直平分线'], 'angle-bisector': ['角平分线'],
  isosceles: ['等腰三角形'], equilateral: ['等边三角形'], 'square-root': ['平方根','算术平方根'],
  'root-estimate': ['估计','整数部分'], 'cube-root': ['立方根'], 'real-types': ['有理数','无理数'],
  'factor-difference': ['平方差'], 'factor-perfect': ['完全平方'], factor: ['提公因式'],
  meaning: ['取值限制','分母不能为零'], reduce: ['约分'], common: ['通分','公分母'],
  add: ['分式加减','分式相减'], multiply: ['分式乘除','分式乘法','分式除法'], extraneous: ['增根','检验'],
};
const normalized = (v: string) => v.toLowerCase().replace(/[\s，。、：:（）()·]/g, '');
function linkedTopics(title: string, unitId: string, topics: KnowledgeTopic[]) {
  const source = normalized(title);
  return topics.filter(t => t.unitId === unitId && [t.title, ...(aliases[t.id] ?? []),
    ...t.title.split(/[、与和的：:·（）()]/)].some(k => {
      const key = normalized(k); return key.length >= 2 && !['三角形','分式','性质','应用','关系','初步认识'].includes(key) && source.includes(key);
    })).map(t => t.id);
}

function mistakeEvidence(states: Map<string, Data>, wrong: Data[], topics: KnowledgeTopic[]): MistakeEvidence[] {
  const result: MistakeEvidence[] = wrong.map(q => {
    const topicIds = linkedTopics(text(q.title, 1200), q.unitId, topics);
    return {id: q.kind + ':' + q.questionId, unitId: q.unitId, topicIds, title: text(q.title, 400),
      source: q.kind === 'photo' ? 'paper-question' : 'question-bank', sourceLabel: q.kind === 'photo' ? '试卷/拍照题库作答记录' : '错题库作答记录',
      association: topicIds.length ? 'title-keyword' : 'unit-only', status: q.lastCorrect === 1 ? 'latest-correct' : 'needs-review',
      cause: null, causeSource: 'unrecorded', at: iso(q.lastAt), questionNumber: text(String(q.number ?? ''), 40), paperTitle: text(q.paperTitle, 160)};
  });
  for (const [key, work] of states) {
    if (!handwriting.KEY.test(key) || !handwriting.validate(work) || !work.pages.some((p: Data[]) => p.some(s => s.tool === 'pen'))) continue;
    const grades = arr(work.grades).filter(g => g.source === 'handwriting').sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const ids = new Set<string>(grades.filter(g => !g.needsReview).flatMap(g => arr(g.knowledge).filter(k => k.score !== null && k.score < 80).map(k => k.nodeId)));
    for (const id of ids) {
      if (!topics.some(t => t.id === id && t.unitId === work.unitId)) continue;
      const error = grades.filter(g => !g.needsReview && arr(g.knowledge).some(k => k.nodeId === id && k.score !== null && k.score < 80)).at(-1);
      const node = error.knowledge.find((k: Data) => k.nodeId === id);
      const latest = grades.filter(g => g.revision === work.revision).at(-1), current = !latest?.needsReview && arr(latest?.knowledge).find(k => k.nodeId === id);
      result.push({id: key + ':' + id, unitId: work.unitId, topicIds: [id], title: text(work.prompt, 240) || '手写作答',
        source: 'written-work', sourceLabel: '手写作答批改记录', association: 'graded-node',
        status: current && current.score !== null ? current.score >= 80 ? 'latest-correct' : 'needs-review' : 'historical',
        cause: text(node.feedback, 600), causeSource: 'handwriting-node-feedback', at: iso(error.at), sourceRevision: error.revision});
    }
  }
  return result;
}

/** Derived from retained evidence. Never writes mastery, grades, rewards or invented history. */
export function buildKnowledge(docs: Document[], wrongQuestions: Data[] = [], now = new Date()) {
  const states = new Map<string, Data>(), warnings: string[] = [];
  for (const d of docs) if (d.value !== null) try { states.set(d.key, obj(JSON.parse(d.value))); }
  catch { warnings.push('一份记录无法读取，原记录保留。'); }
  const topics: KnowledgeTopic[] = [];
  for (const unit of catalog) {
    const old = unit.kind === 'fraction', legacyEnglish = unit.kind === 'legacy-english';
    const key = old ? 'fraction-minute-v1' : legacyEnglish ? 'wordops_8A_unit3' : unit.kind === 'english' ? 'growing-english-course-v1:' + unit.id : `growing-${unit.subject}-lessons-v1`;
    const state = states.get(key) ?? {};
    const entries: Data[] = unit.kind === 'english' ? [...unit.rules.words.map((w: Data) => ({...w, type: 'word'})), ...unit.rules.lessons.map((l: Data) => ({...l, type: 'lesson'}))] : legacyEnglish ? [...english.__legacy.words.map(w => ({...w, type: 'legacyWord'})), ...unit.tests.map((id: string) => ({id, type: 'legacyTest'}))] : unit.topics.map((id: string) => ({id, type: 'topic'}));
    for (const item of entries) {
      const id = item.id, r = obj(item.type === 'word' ? state.words?.[id] : item.type === 'lesson' ? state.lessons?.[id] : item.type === 'legacyWord' ? state.mastered?.[id] : item.type === 'legacyTest' ? undefined : state.topics?.[id]);
      const attempts = arr(item.type === 'lesson' ? state.feynman?.[id]?.attempts : r.attempts).filter(a => old ? a?.valid === true && typeof a.score === 'number' && a.score >= 0 && a.score <= 10 && Array.isArray(a.criticalErrors) : feedback.validGrade(a));
      const ordered = attempts.map((a, i) => ({a, i, at: iso(a.at)})).sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '') || a.i - b.i);
      const latest = ordered.at(-1)?.a;
      const concept = attempts.some(a => a.score >= 8 && !a.criticalErrors.length);
      let mastered = false;
      if (item.type === 'word') mastered = wordPassed(item, r);
      else if (item.type === 'legacyWord') mastered = wordPassed(item, r, true);
      else if (item.type === 'legacyTest') mastered = typeof state.best?.[id] === 'number' && state.best[id] >= 80 && state.best[id] <= 100;
      else if (item.type === 'lesson') mastered = r.protocol === 'three-correct' && Array.isArray(r.answers) && r.answers.length === item.answers.length && r.answers.every((a: any, i: number) => typeof a === 'string' && a === item.answers[i]);
      else if (old) mastered = (concept || Object.hasOwn(obj(state.learning?.mastery), id)) && arr(r.exams).some(e => e?.real === false && Number.isInteger(e.total) && e.total > 0 && e.correct === e.total);
      else mastered = concept && r.bestQuiz === 3;
      const evidence: string[] = [];
      if (mastered) evidence.push('按该课堂现有达标规则已通过；不是对所有能力的保证。');
      if (latest) {
        evidence.push('留存最近概念评测：' + latest.score + '/10');
        evidence.push(...arr(latest.criticalErrors).map(v => '核心问题：' + text(v)), ...arr(latest.gaps).map(v => '待补充：' + text(v)));
        if (latest.score < 8) evidence.push(text(latest.feedback));
      }
      if (r.bestQuiz > 0 && r.bestQuiz < 3) evidence.push('应用练习留存最好结果：' + r.bestQuiz + '/3');
      if (r.oral && (r.oral.meaningPassed === false || r.oral.posPassed === false)) evidence.push('词义或词类口述尚未通过：' + text(r.oral.feedback));
      let diagnostic: string | null = null;
      const archive = states.get('growing-diagnosis-v1:' + unit.id), session = archive?.records?.[id];
      if (archive?.version === 1 && session && graphs[unit.subject] && arr(session.targets).length && session.targets.every((t: string) => unit.diagnosisTopics?.includes(t))) try {
        const credit = diagnosis.assessmentCredit(graphs[unit.subject], session)?.[id];
        if (credit !== undefined) { diagnostic = credit === 1 ? 'passed' : credit === .5 ? 'shaky' : 'weak'; evidence.push('完整图谱诊断：' + ({passed: '初筛通过', shaky: '不稳', weak: '薄弱'}[diagnostic])); }
      } catch { /* Partial or corrupted paths provide no diagnostic conclusion. */ }
      const weak = latest && (latest.score < 8 || latest.criticalErrors.length > 0) || diagnostic === 'shaky' || diagnostic === 'weak' || r.oral?.meaningPassed === false || r.oral?.posPassed === false;
      const started = Object.keys(r).length > 0 || attempts.length > 0 || diagnostic !== null || item.type === 'legacyTest' && Object.hasOwn(obj(state.best), id);
      const status = weak ? mastered ? 'review' : 'weak' : mastered ? 'mastered' : started ? 'learning' : 'unknown';
      topics.push({id, unitId: unit.id, unitTitle: unit.title, subject: unit.subject, title: item.word ?? titles[unit.id + ':' + id] ?? titles[(old ? 'fraction:' : '') + id] ?? id,
        status, courseMastered: mastered, diagnosis: diagnostic, evidence: evidence.filter(Boolean).slice(0, 10), lastEvidenceAt: ordered.at(-1)?.at ?? iso(r.at)});
    }
  }
  const report = buildUnitReports(docs);
  const mistakes = mistakeEvidence(states, wrongQuestions, topics);
  const notes = arr(states.get(NOTES)?.notes).filter(n => n && typeof n.id === 'string' && typeof n.text === 'string' && typeof n.unitId === 'string').map(n => ({id: n.id, unitId: n.unitId, text: text(n.text, 1200), at: iso(n.at), source: 'student-note'}));
  const counts = {total: topics.length, mastered: topics.filter(t => t.courseMastered).length, weak: topics.filter(t => t.status === 'weak' || t.status === 'review').length, learning: topics.filter(t => t.status === 'learning').length, unknown: topics.filter(t => t.status === 'unknown').length};
  const reminders = [
    ...wrongQuestions.filter(q => q.lastCorrect === 0).map(q => ({kind: 'mistake', unitId: q.unitId, title: q.title, reason: `这道题留存错 ${q.wrongCount} 次，最近一次仍未答对，建议重新独立作答。`})),
    ...topics.filter(t => t.status === 'weak' || t.status === 'review').map(t => ({kind: 'weak', unitId: t.unitId, title: t.title, reason: t.evidence.join('；')})),
  ].slice(0, 100);
  return {version: 1, generatedAt: now.toISOString(), lastSyncedAt: report.lastSyncedAt, counts, units: report.units, topics, wrongQuestions, mistakes, notes, reminders,
    summary: `已记录课程达标 ${counts.mastered}/${counts.total} 项，${counts.weak} 项有待巩固证据，${counts.unknown} 项暂无评测记录；留存错题 ${wrongQuestions.length} 道。`,
    warnings: [...new Set([...warnings, ...report.warnings])],
    coverage: '只代表系统中已保存和同步的学习证据。未测不等于薄弱，历史达标不保证永不遗忘；没有留存的逐题作答不能补造，学生总结不直接改变评分。'};
}

export function knowledgeContext(profile: ReturnType<typeof buildKnowledge>, unitId: string, query = '', topicId = '') {
  if (!profile.topics.some(t => t.id === topicId && t.unitId === unitId)) topicId = '';
  const q = query.toLowerCase().slice(0, 150), tokens = q.match(/[a-z]{3,}|[\u4e00-\u9fff]{2,}/g) ?? [];
  const keywords = tokens.flatMap(t => /[a-z]/.test(t) ? [t] : Array.from({length:t.length-1}, (_,i)=>t.slice(i,i+2)));
  const matches = (v: any) => !!q && keywords.some(k => JSON.stringify(v).toLowerCase().includes(k));
  const requestedSubject = (['math','physics','english'] as const).find((s,i)=>q.includes(['数学','物理','英语'][i]));
  const priority = (t: KnowledgeTopic) => (t.unitId === unitId && t.id === topicId ? 500 : 0) + (matches({title: t.title, evidence: t.evidence}) ? 100 : 0) + (requestedSubject===t.subject ? 150 : 0) + (t.unitId === unitId ? 20 : 0) + (['weak','review'].includes(t.status) ? 5 : 0);
  const topics = profile.topics.filter(t => t.status !== 'unknown' || t.unitId === unitId || matches(t.title)).sort((a, b) => priority(b) - priority(a)).slice(0, 32).map(t => ({...t,evidence:t.evidence.slice(0,4).map(e=>e.slice(0,180))}));
  const mistakeFocus = profile.mistakes.filter(m => m.unitId === unitId && !!topicId && m.topicIds.includes(topicId))
    .sort((a, b) => Number(b.status === 'needs-review') - Number(a.status === 'needs-review') || Number(!!b.cause) - Number(!!a.cause) || (b.at ?? '').localeCompare(a.at ?? '')).slice(0, 4);
  return {unitId, topicId, mistakeFocus, summary: profile.summary, coverage: profile.coverage, units: profile.units.map(u => ({id: u.id, title: u.title, mastered: u.mastered, total: u.total})), topics,
    wrongQuestions: profile.wrongQuestions.filter(q => q.unitId === unitId || matches(q) || q.lastCorrect === 0).slice(0, 12), notes: profile.notes.filter(n => n.unitId === unitId || matches(n)).slice(-8),
    reminders: profile.reminders.filter(r => r.unitId === unitId).slice(0, 2), retrievedTopics: topics.length, totalTopics: profile.topics.length};
}

export class StudentKnowledge {
  constructor(private db: Database, private user: User, private store: Store) {}
  async read(unitId = '', query = '', topicId = '') {
    const docs = await this.store.state(this.user.id);
    const rows = await this.db.query<Data>(`SELECT a."Kind" AS kind,a."QuestionId" AS questionId,count(*) AS totalCount,
      sum(1-a."Correct") AS wrongCount,max(a."CreatedAt") AS lastAt,
      (SELECT z."Correct" FROM "GrowingQuestionAttempts" z WHERE z."StudentId"=a."StudentId" AND z."Kind"=a."Kind" AND z."QuestionId"=a."QuestionId" ORDER BY z."CreatedAt" DESC,z.rowid DESC LIMIT 1) AS lastCorrect,
      q."UnitId" AS unitId,substr(q."Text",1,1200) AS title,q."Number" AS number,p."Title" AS paperTitle
      FROM "GrowingQuestionAttempts" a LEFT JOIN "GrowingPhotoQuestions" q ON a."Kind"='photo' AND q."Id"=a."QuestionId"
      LEFT JOIN "GrowingQuestionPapers" p ON p."Id"=q."PaperId"
      WHERE a."StudentId"=?1 AND (a."Kind"='math' OR p."StudentId"=?1)
      GROUP BY a."Kind",a."QuestionId" HAVING sum(1-a."Correct")>0 ORDER BY lastAt DESC`, [this.user.id]);
    const wrong = rows.flatMap(r => {const known = r.kind === 'math' ? mathQuestions.find(q => q.id === r.questionId) : null; return r.kind === 'math' && !known ? [] : [{...r, title: known?.title ?? r.title ?? '拍照错题', number: known?.number ?? r.number, unitId: known?.unitId ?? r.unitId, status: r.lastCorrect === 1 ? 'latest-correct' : 'needs-review'}];});
    const profile = buildKnowledge(docs, wrong);
    return {...profile, student: {id: this.user.id, displayName: this.user.displayName}, context: knowledgeContext(profile, unitId, query, topicId)};
  }
  async addNote(data: Data) {
    if (Object.keys(data).some(k => !['unitId','text'].includes(k)) || typeof data.text !== 'string' || !data.text.trim() || data.text.length > 1200 || !catalog.some(u => u.id === data.unitId)) throw new HttpError(400, '请选择课程并填写 1–1200 字的学习总结。');
    const doc = (await this.store.state(this.user.id)).find(d => d.key === NOTES);
    let notes: any[] = [];
    if (doc?.value) try {const raw = JSON.parse(doc.value); if (!Array.isArray(raw.notes)) throw Error(); notes = raw.notes;} catch {throw new HttpError(409, '原总结记录无法读取，已停止覆盖。');}
    if (notes.length >= 500) throw new HttpError(400, '总结已达 500 条，请先导出整理。');
    const note = {id: crypto.randomUUID(), unitId: data.unitId, text: data.text.trim(), at: new Date().toISOString(), source: 'student-note'};
    await this.store.save(this.user.id, NOTES, JSON.stringify({version: 1, notes: [...notes, note]}), doc?.revision ?? 0);
    return note;
  }
}
