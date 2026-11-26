(()=>{
  'use strict';
  const renderLegacy=()=>{
  const C=window.GrowingCurriculum,E=window.GrowingUnitSummary,root=document.getElementById('summary'),params=new URLSearchParams(location.search);
  const subject=params.get('subject')||'math',unitId=params.get('unit'),course=Object.hasOwn(C,subject)?C[subject]:null;
  const entry=course&&Object.entries(course.terms).flatMap(([term,book])=>book.units.map(unit=>({term,book,unit}))).find(x=>x.unit.id===unitId);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fail=message=>{root.innerHTML=`<nav class="summary-nav"><a href="index.html" target="_top">选择课程</a></nav><header><h1>暂时无法显示总结</h1><p>${esc(message)}</p><a href="${course?'units.html?subject='+subject:'index.html'}" target="_top">返回目录</a></header>`;};
  if(!entry||!entry.book.verified||!entry.unit.entry){fail('本单元尚未开放，请选择已核对教材的单元。');return;}
  const {unit,term,book}=entry;
  let summary;
  const load=name=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=name==='english-unit-score.js'?name+'?v=20261126-english-zero-1':name;s.onload=resolve;s.onerror=()=>reject(Error('课程资源加载失败，请检查连接后刷新。'));document.head.append(s);});
  const read=key=>{const raw=localStorage.getItem(key);return raw===null?null:JSON.parse(raw);};
  const handwritten=()=>{
    const H=window.GrowingHandwriting,documents=[];
    if(!H||unit.id!=='math-8b-10')return [];
    for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(H.KEY.test(key)){try{documents.push(read(key));}catch{/* Preserve unreadable originals. */}}}
    return H.evidence(documents,window.GrowingFractionPaperTasks.tasks);
  };
  function refresh(){
    try{
      if(subject==='english')summary=E.english({words:window.GrowingEnglishVocabulary[unit.number],lessons:window.GrowingEnglishLessons[unit.number],raw:read('growing-english-course-v1:'+unit.id),engine:window.GrowingEnglishEngine,items:window.SentenceDemo.units[unit.id].topics.flatMap(t=>t.sentences),saved:read('growing-english-sentences-v1:'+unit.id)});
      else{const data=subject==='physics'?window.GrowingPhysics:window.GrowingMath;summary=E.math({subject,chapter:data.chapters.find(c=>c.id===unit.id),data,read,diagnosis:window.GrowingDiagnosis,handwriting:handwritten()});}
      render();
    }catch{fail('本机学习记录暂时无法读取，原记录未改动。请检查存储权限或修复存档后刷新。');}
  }
  function render(){
    const groups=[['passed','已掌握知识点'],['weak','薄弱点'],['untested','未测点'],['shaky','待巩固'],['pending','待复测'],['screened','初筛通过'],['unknown','记录不可用']];
    const status=row=>row.status==='passed'&&row.screened?'screened':row.status;
    document.title=`${unit.title} · 单元总结 · 逆流`;
    root.innerHTML=`<nav class="summary-nav"><a href="units.html?subject=${subject}&term=${term}" target="_top">返回${course.name}目录</a><a class="brand" href="index.html" target="_top">选择课程</a></nav>
      <header><p class="eyebrow">${course.name} · ${book.name} · ${subject==='english'?'Unit':'第'} ${unit.number}${subject==='english'?'':' 章'}</p><h1>${esc(unit.title)} · 单元总结</h1></header>
      ${summary.scoreDescription?`<section class="summary-group"><h2>英语单元评分</h2><p>${esc(summary.scoreDescription)}</p></section>`:""}
      <div class="summary-groups">${groups.map(([key,label],i)=>{
        const rows=summary.rows.filter(row=>status(row)===key);
        if(i>2&&!rows.length)return '';
        return `<section class="summary-group ${key}" aria-labelledby="summary-${key}"><h2 id="summary-${key}">${label}<span>${rows.length}</span></h2>${rows.length?`<ul>${rows.map(row=>`<li data-summary-node="${esc(row.id)}">${esc(row.title)}</li>`).join('')}</ul>`:'<p class="summary-empty">暂无</p>'}</section>`;
      }).join('')}</div>
      ${summary.warnings.some(w=>/无法|不可用/.test(w))?'<p class="summary-warning" role="status">部分学习记录暂不可用。</p>':''}`;
  }
  (async()=>{
    try{
      const files=subject==='english'?['english-engine.js','english-vocabulary.js','english-lessons.js','english-unit3-data.js']:subject==='physics'?['physics-builder.js','physics-sound.js','physics-light.js','physics-lenses.js','physics-thermal.js','physics-motion.js','physics-data.js','diagnosis-engine.js']:['knowledge-data.js','math-builder.js','math-upper.js','math-lower.js','math-data.js','diagnosis-engine.js'];
      if(unit.id==='math-8b-10')files.push('handwriting-core.js','fraction-paper-tasks.js');
      if(subject==='english')for(const asset of ['word-mastery-rules.js','english-sentence-units-13.js','english-sentence-units-2.js','english-sentence-units-45.js','english-sentence-units-678.js','english-sentence-data.js','english-sentence-progress.js','english-unit-score.js','english-score.js'])await load(asset);
   if(subject==='english')await load('word-mastery-rules.js?v=1');
      for(const f of files)await load(subject==='english'?f+'?v=word-mastery-2':f);refresh();
      window.addEventListener('pageshow',refresh);window.addEventListener('storage',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
    }catch(e){fail(e.message);}
  })();
  };
  if(!window.GrowingStudentPages?.registerLegacy(renderLegacy))renderLegacy();
})();
