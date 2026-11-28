const stages={locate:'定位原题',transcribe:'转录文字',review:'核对题面与配图',draw:'绘制题图',verify:'核对题图',grade:'批改作答'};
export function paperProgress(job={}){
 const value=job.progressPercent,percent=typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100?value:null;
 const count=x=>Number.isFinite(Number(x))&&Number(x)>=0?Number(x):0;
 const total=count(job.totalQuestions),pageTotal=count(job.pageCount);
 let label=job.status==='planning'?'清点试卷页数':job.status==='failed'?'处理失败，可重试':job.status==='complete'?(job.mode==='grade'?'批改完成':'整理完成，待核对'):'等待处理';
 if(job.status==='processing')label=job.next?.number?'第 '+job.next.number+' 题 · '+(stages[job.next.stage]||'处理中'):'正在处理试卷';
 return {percent,label,pages:count(job.plannedPages)+' / '+(pageTotal||'?')+' 页',questions:count(job.mode==='paper'?job.recognizedQuestions:job.completedQuestions)+' / '+(total||'?')+' 题',background:job.processor==='photo-agent-v1'};
}
