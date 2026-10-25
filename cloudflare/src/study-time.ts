import { buildReport, shanghaiDay, validStudyDay } from './reports';
import { nowSql, type Database, type Document, type Statement } from './database';

export function studyTimeStatements(student: string, docs: Document[], previous: Document[] = []): Statement[] {
  const report=buildReport(docs);
  for(const old of buildReport(previous).subjects){
    const current=report.subjects.find(s=>s.subject===old.subject)!;
    for(const [day,minutes] of Object.entries(old.dailyMinutes))current.dailyMinutes[day]=Math.max(current.dailyMinutes[day]??0,minutes);
  }
  const rows=report.subjects.flatMap(s=>Object.entries(s.dailyMinutes).filter(([,n])=>n>0).map(([day,minutes])=>({day,subject:s.subject,seconds:Math.round(minutes*60*1000)/1000})));
  if(!rows.length)return [];
  // A single SQL statement keeps batches bounded even when old devices upload years of history.
  return [{sql:`INSERT INTO "GrowingStudyTime" ("StudentId","Day","Subject","Seconds","UpdatedAt")
    SELECT ?1,json_extract(value,'$.day'),json_extract(value,'$.subject'),json_extract(value,'$.seconds'),${nowSql}
    FROM json_each(?2) WHERE 1
    ON CONFLICT ("StudentId","Day","Subject") DO UPDATE SET "Seconds"=max("GrowingStudyTime"."Seconds",excluded."Seconds"),"UpdatedAt"=excluded."UpdatedAt"`,params:[student,JSON.stringify(rows)]}];
}

export async function studyReport(db: Database, student: string, docs: Document[], now = new Date()) {
  const report=buildReport(docs,now),today=shanghaiDay(now);
  const rows=await db.query<{day:string;subject:string;seconds:number}>('SELECT "Day" AS day,"Subject" AS subject,"Seconds" AS seconds FROM "GrowingStudyTime" WHERE "StudentId"=?1 AND "Day"<=?2',[student,today]);
  for(const row of rows){
    const subject=report.subjects.find(s=>s.subject===row.subject);
    if(subject&&validStudyDay(row.day,today))subject.dailyMinutes[row.day]=Math.max(subject.dailyMinutes[row.day]??0,Math.min(86400,row.seconds)/60);
  }
  for(const subject of report.subjects){
    subject.totalMinutes=Object.values(subject.dailyMinutes).reduce((sum,n)=>sum+n,0);
    subject.activeMinutes=subject.totalMinutes;
    subject.todayMinutes=subject.dailyMinutes[today]??0;
  }
  report.timeNote+=' 已成功同步的按日时长独立保留，课程重置不会清除；旧设备历史在下一次学习记录同步时留存。';
  return report;
}
