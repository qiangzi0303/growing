(()=>{
  'use strict';
  const C=window.GrowingCurriculum,E=window.GrowingUnitSummary,root=document.getElementById('summary'),params=new URLSearchParams(location.search);
  const subject=params.get('subject')||'math',unitId=params.get('unit'),course=Object.hasOwn(C,subject)?C[subject]:null;
  const entry=course&&Object.entries(course.terms).flatMap(([term,book])=>book.units.map(unit=>({term,book,unit}))).find(x=>x.unit.id===unitId);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link=(s,u)=>'unit-summary.html?'+new URLSearchParams({subject:s,unit:u});
  const fail=message=>{root.innerHTML=`<nav class="summary-nav"><a href="index.html" target="_top">← 选择课程</a></nav><header><h1>暂时无法显示总结</h1><p>${esc(message)}</p><a href="${course?'units.html?subject='+subject:'index.html'}" target="_top">返回目录 →</a></header>`;};
  if(!entry||!entry.book.verified||!entry.unit.entry){fail('本单元尚未开放，请选择已核对教材的单元。');return;}
  const {unit,term,book}=entry;
  let filter='all',summary,visible=12;
  const load=name=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=name;s.onload=resolve;s.onerror=()=>reject(Error('课程资源加载失败，请检查连接后刷新。'));document.head.append(s);});
  const read=key=>{const raw=localStorage.getItem(key);return raw===null?null:JSON.parse(raw);};
  const handwritten=()=>{
    const H=window.GrowingHandwriting,documents=[];
    if(!H||unit.id!=='math-8b-10')return [];
    for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(H.KEY.test(key)){try{documents.push(read(key));}catch{/* Preserve unreadable originals. */}}}
    return H.evidence(documents,window.GrowingFractionPaperTasks.tasks);
  };
  const href=node=>{const url=new URL(unit.entry,location.href);url.searchParams.set('node',node.id);return unit.entry.split('?')[0]+'?'+url.searchParams;};
  function refresh(){
    try{
      if(subject==='english')summary=unit.number===3?E.legacyEnglish({data:window.GrowingSummaryLegacy,raw:read('wordops_8A_unit3'),engine:window.GrowingEnglishEngine}):E.english({words:window.GrowingEnglishVocabulary[unit.number],lessons:window.GrowingEnglishLessons[unit.number],raw:read('growing-english-course-v1:'+unit.id),engine:window.GrowingEnglishEngine});
      else{const data=subject==='physics'?window.GrowingPhysics:window.GrowingMath;summary=E.math({subject,chapter:data.chapters.find(c=>c.id===unit.id),data,read,diagnosis:window.GrowingDiagnosis,handwriting:handwritten()});}
      render();
    }catch{fail('本机学习记录暂时无法读取，原记录未改动。请检查存储权限或修复存档后刷新。');}
  }
  function render(){
    const counts=Object.fromEntries(Object.keys(E.labels).map(s=>[s,summary.rows.filter(r=>r.status===s).length]));
    document.title=`${unit.title} · 单元总结 · 成长`;
    root.innerHTML=`<nav class="summary-nav"><a href="units.html?subject=${subject}&term=${term}" target="_top">← ${course.name}目录</a><a href="index.html" target="_top">成长 ✦</a></nav>
      <header><p class="eyebrow">${course.name} · ${book.name} · ${subject==='english'?'Unit':'第'} ${unit.number}${subject==='english'?'':' 章'}</p><h1>${esc(unit.title)} · 单元总结</h1><p class="summary-overview">${summary.rows.length}个学习节点，已通过 <strong>${counts.passed}</strong> 个。先补薄弱，再巩固不稳，最后检查未测。</p></header>
      <div class="summary-pickers"><label>科目<select id="summary-subject">${Object.entries(C).map(([s,c])=>`<option value="${s}" ${s===subject?'selected':''}>${c.name}</option>`).join('')}</select></label><label>学期<select id="summary-term">${Object.entries(course.terms).filter(([,b])=>b.verified&&b.units.some(u=>u.entry)).map(([t,b])=>`<option value="${t}" ${t===term?'selected':''}>${b.name}</option>`).join('')}</select></label><label>单元<select id="summary-unit">${book.units.filter(u=>u.entry).map(u=>`<option value="${u.id}" ${u.id===unit.id?'selected':''}>${subject==='english'?'Unit':'第'} ${u.number}${subject==='english'?'':' 章'} · ${esc(u.title)}</option>`).join('')}</select></label></div>
      <div class="summary-actions"><a href="${esc(unit.entry)}" target="_top">继续本单元学习 →</a>${subject!=='english'?`<a href="${subject==='physics'?'physics-knowledge.html':'knowledge.html'}?chapter=${unit.id}&mode=diagnosis" target="_top">开始 / 继续诊断 →</a>`:''}</div>
      <div class="summary-stats" role="group" aria-label="按状态筛选节点">${['weak','shaky','untested','pending','passed'].map(s=>`<button type="button" class="summary-stat ${s}" data-filter="${s}" aria-pressed="${filter===s}" aria-controls="summary-nodes"><strong>${counts[s]}</strong><span>${E.labels[s]}</span></button>`).join('')}</div>
      <p class="summary-hint">点击上方数字筛选，点击下方节点直接进入对应学习内容。未测不表示不会；诊断初筛通过与课程达标分别标注。</p>
      ${summary.warnings.map(w=>`<p class="summary-warning" role="status">${esc(w)}</p>`).join('')}${counts.unknown?`<p class="summary-warning">${counts.unknown}个节点的记录不可用，未计为未测或已通过。</p>`:''}
      <section aria-labelledby="summary-list-title"><div class="summary-list-heading"><h2 id="summary-list-title">${filter==='all'?'全部节点':E.labels[filter]}</h2><button type="button" data-filter="all">查看全部</button></div><p id="summary-count" class="summary-hint" aria-live="polite"></p><ul class="summary-nodes" id="summary-nodes"></ul><button type="button" id="summary-more" hidden></button></section>
      <footer class="summary-footer">${esc(summary.note||(unit.id==='math-8b-10'?'实卷按当前原稿的最近有效知识点评分标出薄弱、不稳；需要复核的结果不改变已有判定。本题通过不等于课程达标。其他节点参考诊断与课程记录。':'诊断以最近一轮直接作答为先，其他节点参考已保存的历史诊断和课程记录；未完成的一题证据仅列待复测。'))}<br>仅汇总当前账号在本设备上的已保存记录；重新进入或同步后会更新。不修改原稿、奖励或学习记录。</footer>`;
    renderRows();
  }
  function renderRows(){
    const order=['weak','shaky','pending','untested','unknown','passed'],rows=summary.rows.filter(n=>filter==='all'||n.status===filter).sort((a,b)=>order.indexOf(a.status)-order.indexOf(b.status));
    root.querySelector('#summary-list-title').textContent=filter==='all'?'全部节点':E.labels[filter];
    root.querySelector('#summary-count').textContent=rows.length>visible?`显示前${visible}个，共${rows.length}个节点`:rows.length+'个节点';
    root.querySelector('#summary-nodes').innerHTML=rows.length?rows.slice(0,visible).map(n=>`<li><a class="summary-node ${n.status}" data-summary-node="${esc(n.id)}" href="${esc(href(n))}" target="_top"><span class="status-tag">${E.labels[n.status]}</span><span><span class="node-title">${esc(n.title)}</span><span class="node-detail">${esc(n.section)} · ${esc(n.detail)}</span></span><span aria-hidden="true">→</span></a></li>`).join(''):'<li class="summary-empty">当前没有这类节点。可查看全部，或继续本单元学习。</li>';
    const more=root.querySelector('#summary-more');more.hidden=rows.length<=visible;more.textContent=`展开其余${Math.max(0,rows.length-visible)}个节点 ↓`;
    root.querySelectorAll('[data-filter]').forEach(b=>{if(b.dataset.filter!=='all')b.setAttribute('aria-pressed',b.dataset.filter===filter);});
  }
  root.addEventListener('click',e=>{if(e.target.id==='summary-more'){visible=Infinity;renderRows();return;}const b=e.target.closest('[data-filter]');if(!b||!summary)return;filter=b.dataset.filter;visible=12;renderRows();});
  root.addEventListener('change',e=>{
    if(e.target.id==='summary-subject'){const s=e.target.value,b=Object.values(C[s].terms).find(b=>b.verified&&b.units.some(u=>u.entry));location.href=link(s,b.units.find(u=>u.entry).id);}
    if(e.target.id==='summary-term')location.href=link(subject,course.terms[e.target.value].units.find(u=>u.entry).id);
    if(e.target.id==='summary-unit')location.href=link(subject,e.target.value);
  });
  (async()=>{
    try{
      const files=subject==='english'?unit.number===3?['english-engine.js','unit-summary-legacy.js']:['english-engine.js','english-vocabulary.js','english-lessons.js']:subject==='physics'?['physics-builder.js','physics-sound.js','physics-light.js','physics-lenses.js','physics-thermal.js','physics-motion.js','physics-data.js','diagnosis-engine.js']:['knowledge-data.js','math-builder.js','math-upper.js','math-lower.js','math-data.js','diagnosis-engine.js'];
      if(unit.id==='math-8b-10')files.push('handwriting-core.js','fraction-paper-tasks.js');
      if(subject==='english')await load('word-mastery-rules.js?v=1');
      for(const f of files)await load(subject==='english'?f+'?v=word-mastery-2':f);refresh();
      window.addEventListener('pageshow',refresh);window.addEventListener('storage',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
    }catch(e){fail(e.message);}
  })();
})();
