/* English point courses. Full curriculum IDs isolate content and practice. */
(()=>{
 'use strict';
 const units=Object.create(null),object=x=>x&&typeof x==='object'&&!Array.isArray(x),safe=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
 const normalize=text=>text.normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
 const correct=(q,a)=>!!a&&(q.type==='fill'?Array.isArray(a.texts)&&a.texts.length===q.answers.length&&q.answers.every((forms,i)=>typeof a.texts[i]==='string'&&forms.some(answer=>normalize(answer)===normalize(a.texts[i]))):a.choice===q.answer);
 const score=(p,r)=>p.questions.filter(q=>r.answers[q.id]?.checked&&correct(q,r.answers[q.id])).length;
 const best=(p,r)=>Math.max(score(p,r),r.questionSet===p.questionSet?r.best||0:0);
 const savedRecord=(p,r,previous)=>({...previous,...r,questionSet:p.questionSet,total:p.questions.length,best:Math.max(previous?best(p,previous):0,score(p,r)),legacyBest:Math.max(previous?.legacyBest||0,previous&&previous.questionSet!==p.questionSet?previous.best||0:0)});
 function validate(p,r){
  if(!p||!object(r)||r.version!==1||!Number.isInteger(r.index)||r.index<0||r.index>=p.questions.length||!object(r.answers)||!Number.isInteger(r.best)||r.best<0||r.best>p.questions.length)throw Error('要点练习记录格式无法识别，原记录已保留');
  if(r.questionSet!==undefined&&r.questionSet!==p.questionSet)throw Error('练习题库版本不匹配，原记录已保留');
  for(const [id,a] of Object.entries(r.answers)){const q=[...p.questions,...p.legacyQuestions||[]].find(q=>q.id===id);if(!q||!object(a)||typeof a.checked!=='boolean'||(q.type==='fill'?!Array.isArray(a.texts)||a.texts.length!==q.answers.length||a.texts.some(t=>typeof t!=='string'||t.length>160||a.checked&&!t.trim()):!Number.isInteger(a.choice)||a.choice<0||a.choice>=q.options.length))throw Error('练习答案与题目不匹配，原记录已保留');}
  return r;
 }
 function define(unitId,data){
  if(!safe.test(unitId)||units[unitId])throw Error('单元 ID 无效或重复：'+unitId);
  const lessons={},groups={},animations={};
  for(const [lessonId,lesson] of Object.entries(data.lessons)){
   if(!safe.test(lessonId)||!lesson.points?.length)throw Error('课程 ID 或要点缺失');
   const seen=new Set();groups[lessonId]=[];
   const steps=lesson.points.map(p=>{
    if(!safe.test(p.id)||seen.has(p.id))throw Error('要点 ID 无效或重复');seen.add(p.id);
    if(p.rows?.length!==10)throw Error('每要点必须有 10 题');
    for(const name of ['title','rule','pitfall','sentence','translation','explain'])if(typeof p[name]!=='string'||!p[name].trim())throw Error('要点缺少 '+name);
    const scene=unitId+'-'+lessonId+'-'+p.id,questions=p.rows.map(([prompt,choices,explanation],i)=>{
     const source=choices.split('|'),shift=i%source.length,options=source.slice(shift).concat(source.slice(0,shift));
     if(source.length<2||new Set(source).size!==source.length||!prompt||!explanation)throw Error('题目、选项或解析无效');
     return {id:scene+'-'+String(i+1).padStart(2,'0'),prompt,options,answer:options.indexOf(source[0]),explanation,level:i<6?'基础':i<8?'提高':i===8?'难题':'综合应用',source:'原创易错题'};
    });
    if(new Set(questions.map(q=>q.prompt)).size!==10)throw Error('题干重复');
    if(!['compare','quantity','sequence','action','choice','transform','weather','reflexive'].includes(p.animation?.kind)||p.animation.labels?.length!==3)throw Error('动画分镜无效');
    animations[scene]=p.animation;
    groups[lessonId].push({id:p.id,title:p.title,rule:p.rule,pitfall:p.pitfall,questions});
    return {label:p.title,title:p.title,sentence:p.sentence,translation:p.translation,explain:p.explain,scene,at:4.6/8,playFrom:0,playUntil:6.1,plainText:true};
   });
   lessons[lessonId]={tab:lesson.tab,steps};
  }
  units[unitId]={lessons,animations,practice:{groups,point:(lesson,id)=>groups[lesson]?.find(p=>p.id===id),validate,score,correct,empty:()=>({version:1,index:0,answers:{},best:0})}};
 }
 const get=id=>id==='english-8a-05'&&window.GrowingUnit5Practice?{lessons:window.GrowingGrammarSceneLessons,practice:window.GrowingUnit5Practice}:units[id];
 function mix(unitId,data){
  const course=get(unitId),keys=Object.entries(course.practice.groups).flatMap(([lesson,ps])=>ps.map(p=>lesson+'.'+p.id));
  if(keys.length!==Object.keys(data).length||keys.some(key=>!data[key]))throw Error('填空题必须覆盖本单元全部要点');
  for(const key of keys){
   const [lesson,id]=key.split('.'),p=course.practice.point(lesson,id),rows=data[key].trim().split('\n');
   if(p.questionSet||rows.length!==5)throw Error('每要点须有五道新填空题');
   const fills=rows.map((row,i)=>{
    const [prompt,answer,explanation,...extra]=row.trim().split('|'),answers=answer?.split(';').map(a=>a.split('/').map(s=>s.trim()));
    if(extra.length||!prompt||!explanation||answers?.length!==(prompt.match(/___/g)||[]).length||answers.some(forms=>forms.some(s=>!s)))throw Error('填空题题干、答案、解析不匹配：'+key);
    return {id:unitId+'-'+lesson+'-'+id+'-fill-v1-'+(i+6),type:'fill',prompt,answers,explanation,level:i===0?'基础':i<3?'提高':i===3?'难题':'综合应用',source:'原创易错题'};
   });
   p.legacyQuestions=p.questions.slice(5);p.questions=p.questions.slice(0,5).concat(fills);p.questionSet='mixed-fill-v1';
  }
  Object.assign(course.practice,{validate,score,correct,best,savedRecord});
 }
 const assets=Object.fromEntries([1,2,3,4,6,7,8].map(n=>['english-8a-0'+n,['unit'+n+'-content.js']]));
 assets['english-8a-05']=['unit5-lessons.js','unit5-practice.js'];
 for(const [unit,files] of Object.entries(assets))files.push('unit'+Number(unit.slice(-2))+'-fill.js');
 window.GrowingEnglishPointCourses={assets,define,get,mix};
})();
