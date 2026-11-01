import type {Database} from './database';
import catalog from './photo-learning-catalog.json';
import {validateAssessment} from './photo-assessment';

/** Read only owned grades; photos, reference answers and student answer bodies stay out of the archive. */
export async function photoKnowledge(db:Database,studentId:string,wrong:any[]){
  if(!wrong.some(q=>q.kind==='photo'))return wrong;
  const rows=await db.query<any>(`SELECT g."Id" AS id,g."QuestionId" AS questionId,g."QuestionRevision" AS revision,
    g."Kind" AS kind,g."CreatedAt" AS at,g."Result" AS result,q."Revision" AS currentRevision
    FROM "GrowingPhotoGrades" g JOIN "GrowingPhotoQuestions" q ON q."Id"=g."QuestionId"
    JOIN "GrowingQuestionPapers" p ON p."Id"=q."PaperId"
    WHERE p."StudentId"=?1 AND EXISTS (SELECT 1 FROM "GrowingQuestionAttempts" a
      WHERE a."StudentId"=?1 AND a."Kind"='photo' AND a."QuestionId"=q."Id" AND a."Correct"=0)
    AND (g."Id"=(SELECT z."Id" FROM "GrowingPhotoGrades" z WHERE z."QuestionId"=q."Id" ORDER BY z."CreatedAt" DESC,z.rowid DESC LIMIT 1)
      OR g."Id"=(SELECT z."Id" FROM "GrowingPhotoGrades" z WHERE z."QuestionId"=q."Id"
        AND json_extract(z."Result",'$.verdict') IN ('partial','incorrect') ORDER BY z."CreatedAt" DESC,z.rowid DESC LIMIT 1))
    ORDER BY g."CreatedAt",g.rowid`,[studentId]);
  const byQuestion=new Map<string,any[]>();
  for(const row of rows){
    let result;try{result=validateAssessment(JSON.parse(row.result),'');}catch{}
    if(!result)continue;
    const grade={id:row.id,revision:row.revision,kind:row.kind,at:row.at,score:result.score,verdict:result.verdict,
      feedback:result.feedback,corrections:result.corrections,
      knowledge:result.knowledge.map(k=>{const n=catalog.knowledge.find(n=>n.id===k.nodeId)!;return {...k,title:n.title,unitId:n.unitId};}),
      models:result.models.map(m=>{const n=catalog.models.find(n=>n.id===m.modelId)!;return {modelId:m.modelId,title:n.title};}),currentRevision:row.currentRevision};
    const grades=byQuestion.get(row.questionId)||[];grades.push(grade);byQuestion.set(row.questionId,grades);
  }
  return wrong.map(q=>{
    const grades=byQuestion.get(q.questionId);if(q.kind!=='photo'||!grades?.length)return q;
    const latest=grades.at(-1)!,error=grades.filter(g=>['partial','incorrect'].includes(g.verdict)).at(-1);
    const stale=latest.revision!==latest.currentRevision||!!error&&error.revision!==latest.currentRevision;
    const uncertain=['review','unanswered'].includes(latest.verdict);
    const status=stale||uncertain?'historical':q.lastCorrect===1?'latest-correct':'needs-review';
    const summary=(g:any)=>({id:g.id,revision:g.revision,kind:g.kind,at:g.at,score:g.score,verdict:g.verdict});
    return {...q,status,photoReview:{status,currentRevision:latest.currentRevision,
      latest:{...summary(latest),outcomeSource:q.lastAttemptId===latest.id?'photo-grade':'self-check'},
      error:error?{...summary(error),feedback:error.feedback,corrections:error.corrections,knowledge:error.knowledge,models:error.models}:null}};
  });
}
