import { type Database, type User, HttpError, nowSql } from './database';
import mathQuestions from './math-wrong-question-rules.json';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fail=(status:number,message:string):never=>{throw new HttpError(status,message);};
const fields=`"QuestionId" AS questionId,count(*) AS totalCount,sum(1-"Correct") AS wrongCount,
  sum("Correct") AS correctCount,max("CreatedAt") AS lastAt`;
export class QuestionAttempts {
  constructor(private db:Database,private user:User){}
  private kind(kind:unknown):string {
    if(kind!=='math'&&kind!=='photo')return fail(400,'题目来源无效。');
    return kind;
  }
  private async question(student:string,kind:unknown,id:unknown){
    this.kind(kind);
    if(typeof id!=='string'||(kind==='math'?!mathQuestions.some(q=>q.id===id):!uuid.test(id)))fail(404,'未找到题目。');
    if(kind==='photo'&&!(await this.db.query(`SELECT q."Id" FROM "GrowingPhotoQuestions" q JOIN "GrowingQuestionPapers" p
      ON p."Id"=q."PaperId" WHERE q."Id"=?1 AND p."StudentId"=?2`,[id,student])).length)fail(404,'未找到题目。');
  }
  async stats(student:string,kind:unknown){
    this.kind(kind);
    return this.db.query(`SELECT ${fields} FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1 AND "Kind"=?2 GROUP BY "QuestionId"`,[student,kind]);
  }
  async history(student:string,kind:unknown,id:unknown,page:number){
    await this.question(student,kind,id);
    const [stats]=await this.db.query<any>(`SELECT ${fields} FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1 AND "Kind"=?2 AND "QuestionId"=?3`,[student,kind,id]);
    const rows=await this.db.query(`SELECT "AttemptId" AS attemptId,"Correct" AS correct,"CreatedAt" AS at
      FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1 AND "Kind"=?2 AND "QuestionId"=?3
      ORDER BY "CreatedAt" DESC,rowid DESC LIMIT 20 OFFSET ?4`,[student,kind,id,(page-1)*20]);
    return {questionId:id,totalCount:stats.totalCount,wrongCount:stats.wrongCount||0,correctCount:stats.correctCount||0,lastAt:stats.lastAt,rows,page,pageSize:20};
  }
  async repeated(student:string,page:number){
    const rows=await this.db.query<any>(`SELECT a."Kind" AS kind,a."QuestionId" AS questionId,count(*) AS totalCount,
      sum(1-a."Correct") AS wrongCount,sum(a."Correct") AS correctCount,max(a."CreatedAt") AS lastAt,
      q."UnitId" AS unitId,q."Number" AS number,substr(q."Text",1,200) AS title
      FROM "GrowingQuestionAttempts" a LEFT JOIN "GrowingPhotoQuestions" q ON a."Kind"='photo' AND q."Id"=a."QuestionId"
      LEFT JOIN "GrowingQuestionPapers" p ON p."Id"=q."PaperId"
      WHERE a."StudentId"=?1 AND (a."Kind"='math' OR p."StudentId"=?1)
      GROUP BY a."Kind",a."QuestionId" HAVING sum(1-a."Correct")>=2
      ORDER BY wrongCount DESC,lastAt DESC,a."QuestionId"`,[student]);
    const known=rows.filter(r=>r.kind==='photo'||mathQuestions.some(q=>q.id===r.questionId));
    return {total:known.length,page,pageSize:20,rows:known.slice((page-1)*20,page*20).map(r=>{
      const q=r.kind==='math'?mathQuestions.find(q=>q.id===r.questionId):null;
      return {...r,...(q?{unitId:q.unitId,title:q.title,number:String(q.number)}:{})};
    })};
  }
  async record(student:string,data:Record<string,unknown>){
    if(Object.keys(data).some(k=>!['studentId','attemptId','kind','questionId','correct'].includes(k))||typeof data.attemptId!=='string'||!uuid.test(data.attemptId)||typeof data.correct!=='boolean')fail(400,'作答记录无效。');
    await this.question(student,data.kind,data.questionId);
    await this.db.query(`INSERT INTO "GrowingQuestionAttempts" ("StudentId","AttemptId","Kind","QuestionId","Correct","ActorId","CreatedAt")
      VALUES (?1,?2,?3,?4,?5,?6,${nowSql}) ON CONFLICT ("StudentId","AttemptId") DO NOTHING`,
      [student,data.attemptId,data.kind,data.questionId,data.correct?1:0,this.user.id]);
    const [saved]=await this.db.query<any>(`SELECT "Kind" AS kind,"QuestionId" AS questionId,"Correct" AS correct FROM "GrowingQuestionAttempts" WHERE "StudentId"=?1 AND "AttemptId"=?2`,[student,data.attemptId]);
    if(saved.kind!==data.kind||saved.questionId!==data.questionId||saved.correct!==(data.correct?1:0))fail(409,'本次作答已记录，不能改作另一题或另一结果。');
    return this.history(student,data.kind,data.questionId,1);
  }
}
