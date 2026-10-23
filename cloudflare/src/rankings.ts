import catalogData from './ranking-rules.json';
import { HttpError, type Database, type Document, type Statement } from './database';

type Data = Record<string, any>;
const object = (v: unknown): Data => v && typeof v === 'object' && !Array.isArray(v) ? v as Data : {};
const array = (v: unknown): any[] => Array.isArray(v) ? v : [];
const ratio = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? v / max : 0;
const grade = (v: any) => v && Number.isInteger(v.score) && v.score >= 8 && v.score <= 10 && typeof v.feedback === 'string' &&
  Array.isArray(v.criticalErrors) && v.criticalErrors.length === 0;
const normalize = (v: unknown) => typeof v === 'string' ? v.trim().toLowerCase().replace(/[’‘]/g,"'").replace(/…/g,'...')
  .replace(/\s*\.\.\.\s*/g,' ... ').replace(/\s*-\s*/g,'-').replace(/\s+/g,' ').trim() : '';
const catalog = catalogData as Data[];
export interface Mastery {
  id: string; title: string; subject: string; subjectName: string; term: string; termName: string;
  kind: 'unit' | 'course'; conceptDone: number; conceptTotal: number; testDone: number; testTotal: number; score: number;
}
const score = (r: Omit<Mastery,'score'>): Mastery => ({...r,score:Math.round(3000*r.conceptDone/r.conceptTotal+7000*r.testDone/r.testTotal)});
export function masteryBoards(docs: Document[]): Mastery[] {
  const states = new Map<string,Data>();
  for (const doc of docs) if (doc.value !== null) {
    try { states.set(doc.key,object(JSON.parse(doc.value))); } catch { /* Invalid records earn no points. */ }
  }
  const units: (Mastery & {started: boolean})[] = catalog.map(unit => {
    let conceptDone=0,testDone=0,conceptTotal=unit.topics?.length??unit.rules?.lessons.length??0;
    const testTotal=unit.kind==='english'?unit.rules.words.length+unit.rules.lessons.length:unit.tests?.length??conceptTotal;
    let started=false;
    if (unit.kind==='math'||unit.kind==='physics'||unit.kind==='fraction') {
      const state=states.get(unit.kind==='fraction'?'fraction-minute-v1':`growing-${unit.kind}-lessons-v1`)??{};
      for (const id of unit.topics) {
        const record=object(object(state.topics)[id]);
        started ||= record.seen===true || typeof record.draft==='string'&&record.draft.trim().length>0 || array(record.attempts).length>0 ||
          array(record.exams).length>0 || ratio(record.bestQuiz,3)>0 || unit.kind==='fraction'&&Object.hasOwn(object(state.learning?.mastery),id);
        if (unit.kind==='fraction') {
          // Old fraction AI results carry a validated flag; historical mastery is retained.
          conceptDone += Object.hasOwn(object(state.learning?.mastery),id)||array(record.attempts).some(a=>a?.valid===true&&ratio(a.score,10)>=.8&&
            (!Object.hasOwn(a,'criticalErrors')||Array.isArray(a.criticalErrors)&&a.criticalErrors.length===0)) ? 1 : 0;
          testDone += Math.max(0,...array(record.exams).filter(e=>e?.real===false&&Number.isInteger(e.total)&&e.total>0&&Number.isInteger(e.correct)).map(e=>ratio(e.correct,e.total)));
        } else {
          conceptDone += array(record.attempts).some(grade)?1:0;
          testDone += Number.isInteger(record.bestQuiz)?ratio(record.bestQuiz,3):0;
        }
      }
    } else if (unit.kind==='english') {
      const state=states.get('growing-english-course-v1:'+unit.id)??{},words=object(state.words),lessons=object(state.lessons),feynman=object(state.feynman);
      started=unit.rules.words.some((w:any)=>Object.hasOwn(words,w.id))||unit.rules.lessons.some((l:any)=>Object.hasOwn(lessons,l.id)||Object.hasOwn(feynman,l.id));
      for (const word of unit.rules.words) {
        const record=words[word.id],variants:Data={humour:['humour','humor'],programme:['programme','program'],'sec.':['sec.','sec']};
        if (record?.protocol==='seven-recalls'&&array(record.answers).length===7&&record.answers.every((a:unknown)=>typeof a==='string'&&(variants[word.word]??[word.word]).some((v:string)=>normalize(v)===normalize(a))))testDone++;
      }
      for (const lesson of unit.rules.lessons) {
        if (array(feynman[lesson.id]?.attempts).some(grade))conceptDone++;
        const record=lessons[lesson.id];
        if (record?.protocol==='three-correct'&&array(record.answers).length===lesson.answers.length)
          testDone += record.answers.filter((a:unknown,i:number)=>typeof a==='string'&&a===lesson.answers[i]).length/lesson.answers.length;
      }
    } else {
      const state=states.get('wordops_8A_unit3')??{},best=object(state.best);
      started=array(state.seen).length>0||Object.keys(object(state.mastered)).length>0||Object.keys(object(state.drafts)).length>0||array(state.records).length>0||unit.tests.some((id:string)=>Object.hasOwn(best,id));
      for (const id of unit.topics) {
        const records=Object.values(object(state.studyHistory?.days)).map((d:any)=>object(d?.feynman)[id]);
        if (records.some(r=>Number.isInteger(r?.best)&&r.best>=80&&r.best<=100&&Number.isInteger(r.attempts)&&r.attempts>0))conceptDone++;
        started ||= records.some(r=>r?.attempts>0);
      }
      for (const id of unit.tests)testDone+=ratio(best[id],100);
    }
    return {...score({id:unit.id,title:unit.title,subject:unit.subject,subjectName:unit.subjectName,term:unit.term,termName:unit.termName,kind:'unit',conceptDone,conceptTotal,testDone,testTotal}),started};
  });
  const result:Mastery[]=units.filter(u=>u.started).map(({started,...u})=>u);
  for (const key of new Set(units.map(u=>u.subject+':'+u.term))) {
    const group=units.filter(u=>u.subject+':'+u.term===key);
    if (!group.some(u=>u.started))continue;
    const first=group[0];
    result.push(score({id:key,title:first.termName+' · '+first.subjectName,subject:first.subject,subjectName:first.subjectName,term:first.term,termName:first.termName,kind:'course',
      conceptDone:group.reduce((n,u)=>n+u.conceptDone,0),conceptTotal:group.reduce((n,u)=>n+u.conceptTotal,0),
      testDone:group.reduce((n,u)=>n+u.testDone,0),testTotal:group.reduce((n,u)=>n+u.testTotal,0)}));
  }
  return result;
}

// Called inside the same CAS transaction as the source documents. Rebuilds use a
// revision guard, so a concurrent sync cannot be replaced by an older snapshot.
export function rankingStatements(student:string,docs:Document[],revision?:number):Statement[] {
  const guard=revision===undefined?'':' AND EXISTS (SELECT 1 FROM "GrowingUsers" WHERE "Id"=?1 AND "SyncRevision"=?2)';
  const statements:Statement[]=[{sql:'DELETE FROM "GrowingRankings" WHERE "StudentId"=?1'+guard,params:revision===undefined?[student]:[student,revision]}];
  for(const row of masteryBoards(docs))statements.push({
    sql:`INSERT INTO "GrowingRankings" ("StudentId","BoardId","Kind","Subject","Term","Title","ConceptDone","ConceptTotal","TestDone","TestTotal","Score","UpdatedAt")
      SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,strftime('%Y-%m-%dT%H:%M:%fZ','now')`+
      (revision===undefined?'':' WHERE EXISTS (SELECT 1 FROM "GrowingUsers" WHERE "Id"=?1 AND "SyncRevision"=?12)'),
    params:[student,row.id,row.kind,row.subject,row.term,row.title,row.conceptDone,row.conceptTotal,row.testDone,row.testTotal,row.score,...(revision===undefined?[]:[revision])],
  });
  return statements;
}

const eligible=`FROM "GrowingRankings" r JOIN "GrowingUsers" u ON u."Id"=r."StudentId" WHERE u."Role"='Student'
  AND NOT EXISTS (SELECT 1 FROM "GrowingAdministrators" a WHERE a."UserId"=u."Id")`;
const fields=`r."BoardId" AS id,r."Kind" AS kind,r."Subject" AS subject,r."Term" AS term,r."Title" AS title,
  r."ConceptDone" AS conceptDone,r."ConceptTotal" AS conceptTotal,r."TestDone" AS testDone,r."TestTotal" AS testTotal,r."Score" AS points,r."UpdatedAt" AS updatedAt`;
export class Rankings {
  constructor(private db:Database){}
  async list(student:string){
    const rows=await this.db.query<Data>(`SELECT ${fields},(SELECT COUNT(*) FROM "GrowingRankings" peer JOIN "GrowingUsers" pu ON pu."Id"=peer."StudentId"
      WHERE peer."BoardId"=r."BoardId" AND pu."Role"='Student' AND NOT EXISTS (SELECT 1 FROM "GrowingAdministrators" a WHERE a."UserId"=pu."Id")) AS participants
      ${eligible} AND r."StudentId"=?1 ORDER BY r."Subject",r."Term",r."Kind",r."BoardId"`,[student]);
    return {boards:rows.map(r=>this.percentages(r)),formula:'概念定义掌握率 × 30% + 测试掌握率 × 70%',note:'按最近云同步记录排名；学期按教材上册/下册划分，不是按自然日期清零。科目榜分母为本学期全部已开放单元，未掌握部分记 0。同分并列。'};
  }
  percentages(row:Data){const {points,...rest}=row;return {...rest,score:points/100,conceptPercent:100*row.conceptDone/row.conceptTotal,testPercent:100*row.testDone/row.testTotal};}
  async board(student:string,id:string,page:number){
    const own=await this.db.query<Data>(`SELECT ${fields} ${eligible} AND r."StudentId"=?1 AND r."BoardId"=?2`,[student,id]);
    if(!own.length)throw new HttpError(404,'该学生尚未开始学习此课程，暂无对应排行榜。');
    const ranked=`WITH ranked AS (SELECT ${fields},r."StudentId" AS studentId,u."DisplayName" AS displayName,
      RANK() OVER (ORDER BY r."Score" DESC) AS rank,COUNT(*) OVER () AS participants ${eligible} AND r."BoardId"=?1)`;
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
