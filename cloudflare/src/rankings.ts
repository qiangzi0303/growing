import catalogData from './ranking-rules.json';
import mathFeedback from '../../app/src/main/assets/web/app-design/math-feedback.js';
import diagnosisData from './diagnosis-rules.json';
import diagnosis from '../../app/src/main/assets/web/app-design/diagnosis-engine.js';
import practice from '../../app/src/main/assets/web/app-design/practice-progress.js';
import englishScore from '../../app/src/main/assets/web/app-design/english-score.js';
import englishData from './english-rules.json';
import sentenceData from './english-sentence-rules.json';
import { HttpError, type Database, type Document, type Statement } from './database';

type Data = Record<string, any>;
const object = (v: unknown): Data => v && typeof v === 'object' && !Array.isArray(v) ? v as Data : {};
const array = (v: unknown): any[] => Array.isArray(v) ? v : [];
const catalog = catalogData as Data[];
const diagnosisGraphs = Object.fromEntries(Object.entries(diagnosisData).map(([subject,data])=>[subject,diagnosis.graph(data)]));
export interface Mastery {
  id: string; title: string; subject: string; subjectName: string; term: string; termName: string;
  kind: 'unit' | 'course'; conceptDone: number; conceptTotal: number; testDone: number; testTotal: number;
  diagnosisDone: number; diagnosisTotal: number; score: number;
}
const weights = {concept:3000,practice:7000};
const score = (r: Omit<Mastery,'score'>): Mastery => ({...r,score:Math.round((r.conceptTotal?(r.subject==='english'?5000:weights.concept)*r.conceptDone/r.conceptTotal:0)+(r.testTotal?(r.subject==='english'?5000:weights.practice)*r.testDone/r.testTotal:0))});
export function masteryBoards(docs: Document[]): Mastery[] {
  const states = new Map<string,Data>();
  for (const doc of docs) if (doc.value !== null) {
    try { states.set(doc.key,object(JSON.parse(doc.value))); } catch { /* Invalid records earn no points. */ }
  }
  const units: (Mastery & {started: boolean})[] = catalog.map(unit => {
    let conceptDone=0,testDone=0,conceptTotal=unit.topics?.length??unit.rules?.lessons.length??0;
    let testTotal=unit.kind==='english'?unit.rules.words.length+unit.rules.lessons.length:unit.tests?.length??conceptTotal;
    let started=false;
    let diagnosisDone=0;
    const diagnosisTopics:string[]=unit.diagnosisTopics??[],diagnosisTotal=diagnosisTopics.length||conceptTotal;
    const evidence=object(states.get('growing-diagnosis-v1:'+unit.id));
    if(evidence.version===1&&diagnosisGraphs[unit.subject])for(const id of diagnosisTopics){
      const session=object(evidence.records)[id];
      if(!session||!Array.isArray(session.targets)||!session.targets.every((target:unknown)=>typeof target==='string'&&diagnosisTopics.includes(target)))continue;
      try{
        const credit=diagnosis.assessmentCredit(diagnosisGraphs[unit.subject],session);
        if(credit&&Object.hasOwn(credit,id)){diagnosisDone+=credit[id];started=true;}
      }catch{/* Only complete, valid question paths earn diagnostic credit. */}
    }
    if (unit.kind==='math'||unit.kind==='physics'||unit.kind==='fraction') {
      const state=states.get(unit.kind==='fraction'?'fraction-minute-v1':`growing-${unit.kind}-lessons-v1`)??{};
      for (const id of unit.topics) {
        const record=object(object(state.topics)[id]);
        started ||= record.seen===true || typeof record.draft==='string'&&record.draft.trim().length>0 || array(record.attempts).length>0 ||
          array(record.exams).length>0 || practice.result(record).score>0 || unit.kind==='fraction'&&Object.hasOwn(object(state.learning?.mastery),id);
        if (unit.kind==='fraction') {
          // Old fraction AI results carry a validated flag; historical mastery is retained.
          const marks=practice.fraction(record,Object.hasOwn(object(state.learning?.mastery),id));
          conceptDone += marks.feynman/100;
          testDone += marks.application/100;
        } else {
          conceptDone += practice.mastery({...record,attempts:array(record.attempts).filter(mathFeedback.validGrade)}).feynman/100;
          const quiz=practice.result(record);testDone += quiz.score/quiz.total;
        }
      }
    } else {
      const legacy=unit.kind==='legacy-english',state=states.get(legacy?'wordops_8A_unit3':'growing-english-course-v1:'+unit.id)??{};
      const vocabulary=legacy?englishData.__legacy.words:unit.rules.words,records=legacy?object(state.mastered):object(state.words);
      const saved=states.get('growing-english-sentences-v1:'+unit.id),sentences=(sentenceData as Data)[unit.id]??[];
      const marks=englishScore.summary(vocabulary,records,sentences,saved,legacy);
      conceptDone=marks.words.completed;conceptTotal=marks.words.total;testDone=marks.sentences.completed;testTotal=marks.sentences.total;
      started=!!marks.sentences.completed||Object.keys(records).length>0||Object.keys(object(state.lessons)).length>0||Object.keys(object(state.feynman)).length>0||array(state.seen).length>0||Object.keys(object(state.best)).length>0;
    }
    return {...score({id:unit.id,title:unit.title,subject:unit.subject,subjectName:unit.subjectName,term:unit.term,termName:unit.termName,kind:'unit',conceptDone,conceptTotal,testDone,testTotal,diagnosisDone,diagnosisTotal}),started};
  });
  const result:Mastery[]=units.filter(u=>u.started).map(({started,...u})=>u);
  for (const key of new Set(units.map(u=>u.subject+':'+u.term))) {
    const group=units.filter(u=>u.subject+':'+u.term===key);
    if (!group.some(u=>u.started))continue;
    const first=group[0];
    result.push(score({id:key,title:first.termName+' · '+first.subjectName,subject:first.subject,subjectName:first.subjectName,term:first.term,termName:first.termName,kind:'course',
      conceptDone:group.reduce((n,u)=>n+u.conceptDone,0),conceptTotal:group.reduce((n,u)=>n+u.conceptTotal,0),
      testDone:group.reduce((n,u)=>n+u.testDone,0),testTotal:group.reduce((n,u)=>n+u.testTotal,0),
      diagnosisDone:group.reduce((n,u)=>n+u.diagnosisDone,0),diagnosisTotal:group.reduce((n,u)=>n+u.diagnosisTotal,0)}));
  }
  return result;
}

// Called inside the same CAS transaction as the source documents. Rebuilds use a
// revision guard, so a concurrent sync cannot be replaced by an older snapshot.
export function rankingStatements(student:string,docs:Document[],revision?:number):Statement[] {
  const guard=revision===undefined?'':' AND EXISTS (SELECT 1 FROM "GrowingUsers" WHERE "Id"=?1 AND "SyncRevision"=?2)';
  const statements:Statement[]=[{sql:'DELETE FROM "GrowingRankings" WHERE "StudentId"=?1'+guard,params:revision===undefined?[student]:[student,revision]}];
  for(const row of masteryBoards(docs))statements.push({
    sql:`INSERT INTO "GrowingRankings" ("StudentId","BoardId","Kind","Subject","Term","Title","ConceptDone","ConceptTotal","TestDone","TestTotal","DiagnosisDone","DiagnosisTotal","Score","UpdatedAt")
      SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,strftime('%Y-%m-%dT%H:%M:%fZ','now')`+
      (revision===undefined?'':' WHERE EXISTS (SELECT 1 FROM "GrowingUsers" WHERE "Id"=?1 AND "SyncRevision"=?14)'),
    params:[student,row.id,row.kind,row.subject,row.term,row.title,row.conceptDone,row.conceptTotal,row.testDone,row.testTotal,row.diagnosisDone,row.diagnosisTotal,row.score,...(revision===undefined?[]:[revision])],
  });
  return statements;
}

const eligible=`FROM "GrowingRankings" r JOIN "GrowingUsers" u ON u."Id"=r."StudentId" WHERE u."Role"='Student'
  AND NOT EXISTS (SELECT 1 FROM "GrowingAdministrators" a WHERE a."UserId"=u."Id")`;
// Derive totals on reads so older cached scores use the current weights immediately.
const currentPoints=`CAST(ROUND((CASE WHEN r."Subject"='english' THEN 5000.0 ELSE ${weights.concept}.0 END)*r."ConceptDone"/r."ConceptTotal"+(CASE WHEN r."Subject"='english' THEN 5000.0 ELSE ${weights.practice}.0 END)*r."TestDone"/r."TestTotal") AS INTEGER)`;
const fields=`r."BoardId" AS id,r."Kind" AS kind,r."Subject" AS subject,r."Term" AS term,r."Title" AS title,
  r."ConceptDone" AS conceptDone,r."ConceptTotal" AS conceptTotal,r."TestDone" AS testDone,r."TestTotal" AS testTotal,
  r."DiagnosisDone" AS diagnosisDone,r."DiagnosisTotal" AS diagnosisTotal,${currentPoints} AS points,r."UpdatedAt" AS updatedAt`;
export class Rankings {
  constructor(private db:Database){}
  private async refreshEnglish(){
    // Old English rows contain Feynman/quiz counts, so changing weights alone is insufficient.
    const expected=catalog.filter(u=>u.subject==='english').map(u=>({id:u.id,term:u.term,conceptTotal:u.kind==='legacy-english'?englishData.__legacy.words.length:u.rules.words.length,testTotal:((sentenceData as Data)[u.id]??[]).length}));
    const totals=new Map(expected.map(r=>[r.id,r]));
    for(const term of new Set(expected.map(r=>r.term))){const group=expected.filter(r=>r.term===term);totals.set('english:'+term,{id:'english:'+term,term,conceptTotal:group.reduce((n,r)=>n+r.conceptTotal,0),testTotal:group.reduce((n,r)=>n+r.testTotal,0)});}
    const rows=await this.db.query<Data>('SELECT "StudentId" AS student,"BoardId" AS id,"ConceptTotal" AS words,"TestTotal" AS sentences FROM "GrowingRankings" WHERE "Subject"=\'english\'');
    const students=new Set(rows.filter(r=>r.words!==totals.get(r.id)?.conceptTotal||r.sentences!==totals.get(r.id)?.testTotal).map(r=>String(r.student)));
    const prefix='growing-english-sentences-v1:';
    const missing=await this.db.query<Data>(`SELECT d."StudentId" AS student,d."Key" AS key,d."Value" AS value FROM "GrowingDocuments" d WHERE d."Key" LIKE '${prefix}%' AND d."Value" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "GrowingRankings" r WHERE r."StudentId"=d."StudentId" AND r."BoardId"=substr(d."Key",${prefix.length+1}))`);
    for(const r of missing){try{if(englishScore.summary([],{},(sentenceData as Data)[r.key.slice(prefix.length)]??[],JSON.parse(r.value)).sentences.completed)students.add(String(r.student));}catch{/* Invalid source archives earn no points. */}}
    for(const student of students){
      const [users,docs]=await this.db.batch([{sql:'SELECT "SyncRevision" AS revision FROM "GrowingUsers" WHERE "Id"=?1',params:[student]},{sql:'SELECT "Key" AS key,"Value" AS value,"Revision" AS revision,"UpdatedAt" AS updatedAt FROM "GrowingDocuments" WHERE "StudentId"=?1',params:[student]}]);
      if(users.length)await this.db.batch(rankingStatements(student,docs as Document[],users[0].revision));
    }
  }
  async list(student:string){
    await this.refreshEnglish();
    const rows=await this.db.query<Data>(`SELECT ${fields},(SELECT COUNT(*) FROM "GrowingRankings" peer JOIN "GrowingUsers" pu ON pu."Id"=peer."StudentId"
      WHERE peer."BoardId"=r."BoardId" AND pu."Role"='Student' AND NOT EXISTS (SELECT 1 FROM "GrowingAdministrators" a WHERE a."UserId"=pu."Id")) AS participants
      ${eligible} AND r."StudentId"=?1 ORDER BY r."Subject",r."Term",r."Kind",r."BoardId"`,[student]);
    return {boards:rows.map(r=>this.percentages(r)),formula:'英语：'+englishScore.formula+'；数学/物理：费曼学习 × 30% + 应用练习 × 70%',note:'按最近云同步记录排名；学期按教材上册/下册划分。科目榜两项分别按本学期全部已开放单元的总题量计算，未完成记0，同分并列。英语其他学习活动不计分。'};
  }
  percentages(row:Data){const {points,...rest}=row;return {...rest,score:points/100,conceptPercent:100*row.conceptDone/row.conceptTotal,testPercent:100*row.testDone/row.testTotal,diagnosisPercent:100*row.diagnosisDone/row.diagnosisTotal};}
  async board(student:string,id:string,page:number){
    await this.refreshEnglish();
    const own=await this.db.query<Data>(`SELECT ${fields} ${eligible} AND r."StudentId"=?1 AND r."BoardId"=?2`,[student,id]);
    if(!own.length)throw new HttpError(404,'该学生尚未开始学习此课程，暂无对应排行榜。');
    const ranked=`WITH ranked AS (SELECT ${fields},r."StudentId" AS studentId,u."DisplayName" AS displayName,
      RANK() OVER (ORDER BY ${currentPoints} DESC) AS rank,COUNT(*) OVER () AS participants ${eligible} AND r."BoardId"=?1)`;
    const [rows,mine]=await this.db.batch([
      {sql:ranked+' SELECT * FROM ranked ORDER BY points DESC,studentId LIMIT 20 OFFSET ?2',params:[id,(page-1)*20]},
      {sql:ranked+' SELECT * FROM ranked WHERE studentId=?2',params:[id,student]},
    ]);
    const present=async (r:Data)=>{
      const {studentId,displayName,...rest}=r;
      const alias=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('growing-ranking:'+studentId)))).slice(0,4).map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
      return {...this.percentages(rest),isSelf:studentId===student,label:studentId===student?displayName:'同学 '+alias};
    };
    if(!mine.length)throw new HttpError(409,'学习记录刚刚更新，请刷新排行榜。');
    return {board:this.percentages(own[0]),rows:await Promise.all(rows.map(present)),self:await present(mine[0]),total:mine[0].participants,page,pageSize:20};
  }
  async rebuild(page:number){
    const students=await this.db.query<{id:string}>(`SELECT "Id" AS id FROM "GrowingUsers" WHERE "Role"='Student' ORDER BY "Id" LIMIT 20 OFFSET ?1`,[(page-1)*20]);
    for(const student of students){
      const [users,docs]=await this.db.batch([
        {sql:'SELECT "SyncRevision" AS revision FROM "GrowingUsers" WHERE "Id"=?1',params:[student.id]},
        {sql:'SELECT "Key" AS key,"Value" AS value,"Revision" AS revision,"UpdatedAt" AS updatedAt FROM "GrowingDocuments" WHERE "StudentId"=?1',params:[student.id]},
      ]);
      if(users.length)await this.db.batch(rankingStatements(student.id,docs as Document[],users[0].revision));
    }
    return {indexed:students.length,nextPage:students.length===20?page+1:null};
  }
}
