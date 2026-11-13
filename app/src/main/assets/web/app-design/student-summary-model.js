/* Read-only Vue view model; mastery remains owned by GrowingUnitSummary. */
(()=>{
 'use strict';
 window.GrowingStudentSummary={async create({params,storage,load,active}){
  active();
  const need=async(file,global)=>{if(!global||!window[global]){await load(file);active();}};
  await need('curriculum.js','GrowingCurriculum');
  const subject=params.get('subject')||'math',course=Object.hasOwn(window.GrowingCurriculum,subject)?window.GrowingCurriculum[subject]:null;
  const entry=course&&Object.entries(course.terms).flatMap(([term,book])=>book.units.map(unit=>({term,book,unit}))).find(e=>e.unit.id===params.get('unit'));
  const backHref=course?'units.html?subject='+subject:'index.html';
  const fail=message=>({kind:'error',title:'暂时无法显示总结',message,backHref});
  if(!entry||!entry.book.verified||!entry.unit.entry)return fail('本单元尚未开放，请选择已核对教材的单元。');
  const {unit,term,book}=entry;
  try{
   await need('practice-progress.js','GrowingPracticeProgress');
   await need('unit-summary-core.js','GrowingUnitSummary');
   const files=subject==='english'?unit.number===3?['english-engine.js','unit-summary-legacy.js']:['english-engine.js','english-vocabulary.js','english-lessons.js']:subject==='physics'?['physics-builder.js','physics-sound.js','physics-light.js','physics-lenses.js','physics-thermal.js','physics-motion.js','physics-data.js','diagnosis-engine.js']:['knowledge-data.js','math-builder.js','math-upper.js','math-lower.js','math-data.js','diagnosis-engine.js'];
   if(unit.id==='math-8b-10')files.push('handwriting-core.js','fraction-paper-tasks.js');
   if(subject==='english')await need('word-mastery-rules.js?v=1','GrowingWordMasteryRules');
   for(const file of files)await need(subject==='english'?file+'?v=word-mastery-2':file);
  }catch(error){active();return fail(error.message||'课程资源加载失败，请检查连接后刷新。');}
  const read=key=>{active();const raw=storage.getItem(key);return raw===null?null:JSON.parse(raw);};
  let summary;
  try{
   const E=window.GrowingUnitSummary;
   if(subject==='english')summary=unit.number===3?E.legacyEnglish({data:window.GrowingSummaryLegacy,raw:read('wordops_8A_unit3'),engine:window.GrowingEnglishEngine}):E.english({words:window.GrowingEnglishVocabulary[unit.number],lessons:window.GrowingEnglishLessons[unit.number],raw:read('growing-english-course-v1:'+unit.id),engine:window.GrowingEnglishEngine});
   else{
    const data=subject==='physics'?window.GrowingPhysics:window.GrowingMath,H=window.GrowingHandwriting,documents=[];
    let unreadable=false;
    if(H&&unit.id==='math-8b-10')for(let i=0;i<storage.length;i++){active();const key=storage.key(i);if(key&&H.KEY.test(key)){try{documents.push(read(key));}catch{active();unreadable=true;}}}
    summary=E.math({subject,chapter:data.chapters.find(c=>c.id===unit.id),data,read,diagnosis:window.GrowingDiagnosis,handwriting:H&&unit.id==='math-8b-10'?H.evidence(documents,window.GrowingFractionPaperTasks.tasks):[]});
    if(unreadable)summary.warnings.push('部分手写原稿无法读取，原记录未改动。');
   }
  }catch{active();return fail('本机学习记录暂时无法读取，原记录未改动。请检查存储权限或修复存档后刷新。');}
  active();
  const groups=[['passed','已掌握知识点'],['weak','薄弱点'],['untested','未测点'],['shaky','待巩固'],['pending','待复测'],['screened','初筛通过'],['unknown','记录不可用']].map(([key,label])=>({key,label,rows:summary.rows.filter(row=>(row.status==='passed'&&row.screened?'screened':row.status)===key)})).filter((g,i)=>i<3||g.rows.length);
  return {kind:'summary',title:unit.title+' · 单元总结',eyebrow:course.name+' · '+book.name+' · '+(subject==='english'?'Unit '+unit.number:'第 '+unit.number+' 章'),backHref:'units.html?subject='+subject+'&term='+term,backLabel:'返回'+course.name+'目录',groups,warnings:summary.warnings.filter(w=>/无法|不可用/.test(w))};
 }};
})();
