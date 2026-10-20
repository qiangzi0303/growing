(() => {
  'use strict';
  const data=window.GrowingCurriculum;
  const params=new URLSearchParams(location.search);
  const subject=params.get('subject')||'math';
  const term=params.get('term')||'upper';
  const course=Object.hasOwn(data,subject)?data[subject]:null;
  const book=course && Object.hasOwn(course.terms,term)?course.terms[term]:null;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const catalogLink=(value=term)=>'units.html?'+new URLSearchParams({subject,term:value});
  const studyLink=unit=>'study.html?'+new URLSearchParams({subject,term,unit:unit.id});
  const label=unit=>subject==='math'?`第 ${unit.number} 章`:`Unit ${unit.number}`;
  const state=unit=>!book.verified?'目录待核对':unit.entry?'可学习':'内容筹备中';
  const target=document.getElementById(document.body.dataset.page==='catalog'?'catalog':'study');
  const fail=()=>{document.title='页面未找到 · 成长';target.innerHTML='<main class="route-error"><h1>没有找到这个学习目录</h1><p>请从学科入口重新选择。</p><a class="primary-link" href="index.html">返回选科</a></main>';};
  if(!book){fail();return;}
  document.body.classList.add(subject);
  if(document.body.dataset.page==='catalog'){
    document.title=`${course.name}单元目录 · 成长`;
    const available=book.units.filter(u=>u.entry).length;
    target.innerHTML=`
      <header class="catalog-heading">
        <div><p class="eyebrow">八年级 · ${course.edition}</p><h1>${course.name}<span>一步一步，学会每一课。</span></h1></div>
        <div class="subject-stamp" aria-hidden="true">${subject==='math'?'x²':'Aa'}</div>
      </header>
      <nav class="term-switch" aria-label="选择学期">${Object.entries(course.terms).map(([key,value])=>`<a href="${catalogLink(key)}" ${key===term?'aria-current="page"':''}>${value.name}<span>${key==='upper'?'上学期':'下学期'}</span></a>`).join('')}</nav>
      ${subject==='math'?`<section class="knowledge-entry" aria-label="数学知识图谱与诊断"><div><strong>学不顺，先找卡住的那一步。</strong><p>上下册11章 · 图文微课、知识关联与先修诊断</p></div><div class="knowledge-actions"><a href="knowledge.html?chapter=${book.units[0].id}">知识图谱 ↗</a><a href="knowledge.html?chapter=${book.units[0].id}&mode=diagnosis">先测一下 →</a></div></section>`:''}
      ${!book.verified?'<p class="verification-note"><span aria-hidden="true">ⓘ</span> 下册教材目录待核对，目前预留 8 个单元位置，名称与数量以教材为准。</p>':''}
      <section class="unit-section" aria-labelledby="unit-list-title">
        <div class="list-heading"><h2 id="unit-list-title">${book.name}<span> / ${course.label}目录</span></h2><p>${book.units.length} ${book.verified?(subject==='math'?'章':'个单元'):'个预留单元'}${available?`<span class="available-count"> · ${available} ${subject==='math'?'章':'个'}可学习</span>`:''}</p></div>
        <ol class="unit-list">${book.units.map(unit=>`<li><a class="unit-row ${unit.entry?'is-ready':''}" data-unit="${unit.id}" href="${studyLink(unit)}">
          <span class="unit-number" aria-hidden="true">${String(unit.number).padStart(2,'0')}</span>
          <div class="unit-copy"><span class="unit-label">${label(unit)}</span><h3>${escape(unit.title)}</h3><p>${escape(unit.summary)}</p></div>
          <span class="unit-state">${state(unit)}</span><span class="unit-arrow" aria-hidden="true">↗</span>
        </a></li>`).join('')}</ol>
      </section>
      <p class="catalog-footnote">${subject==='math'?'各章均可进入学习，并查看本章图谱与薄弱点诊断。':`选择一个${course.label}进入。课程内容将陆续补充。`}</p>`;
    for(const u of book.units){
      const slot=document.createElement('div');slot.className='unit-reward-catalog';
      try{const raw=localStorage.getItem('growing-unit-rewards-v1:'+u.id);
        if(raw){const d=window.GrowingRewards.restore(JSON.parse(raw)),a=window.GrowingRewards.amounts(d),ratio=d.total?d.done/d.total:0;slot.innerHTML=`掌握 ${Math.floor(ratio*1000)/10}% · 已获 ${a.game}分钟游戏 / ${(a.cash/100).toFixed(2)}元<progress max="100" value="${ratio*100}" aria-label="${escape(u.title)}掌握进度"></progress>`;}
        else slot.textContent=u.entry?'奖励进度：进入单元后同步':'奖励可单独设置 · 内容筹备中';
      }catch{slot.textContent='奖励记录暂不可用';}
      target.querySelector('[data-unit="'+u.id+'"] .unit-copy').append(slot);
    }
    return;
  }
  const unit=book.units.find(item=>item.id===params.get('unit'));
  if(!unit){fail();return;}
  document.title=`${unit.title} · ${course.name} · 成长`;
  const knowledgeLink='knowledge.html?'+new URLSearchParams({chapter:unit.id});
  const toolbar=`<header class="study-toolbar"><a class="back-link" href="${catalogLink()}">← ${course.name}目录</a><div class="study-location"><span>${book.name} · ${label(unit)}</span><strong>${escape(unit.title)}</strong></div>${subject==='math'?`<a class="knowledge-link" href="${knowledgeLink}">图谱 · 诊断</a>`:''}<a class="home-link" href="index.html">成长</a></header>`;
  if(unit.entry){
    document.body.classList.add('has-course');
    const tools=subject==='math'?`<section class="study-tools" aria-label="${escape(unit.title)}知识图谱与诊断入口"><div><strong>${escape(unit.title)} · 知识图谱与诊断</strong><p>看知识关联，找出卡住的那一步</p></div><nav aria-label="选择数学工具"><a href="${knowledgeLink}">知识图谱 →</a><a class="diagnosis-button" href="${knowledgeLink}&mode=diagnosis">薄弱点诊断 →</a></nav></section>`:'';
    const frameEntry=unit.entry+(subject==='math'&&unit.id!=='math-8b-10'&&params.get('node')?'&node='+encodeURIComponent(params.get('node')):'');
    target.innerHTML=`${toolbar}${tools}<iframe class="course-frame" title="${escape(course.name+' · '+unit.title+'完整学习页')}" src="${escape(frameEntry)}" allow="autoplay"></iframe>`;
    return;
  }
  target.innerHTML=`${toolbar}<main class="pending-shell">
    <div class="pending-emblem" aria-hidden="true">${subject==='math'?'∠':'Aa'}</div>
    <p class="eyebrow">${book.name} · ${label(unit)}</p><h1>${escape(unit.title)}</h1>
    <p class="pending-state">${state(unit)}</p>
    <p class="pending-description">${book.verified?'这一课还在准备中，完整学习内容将陆续开放。':'本单元暂为目录占位，待核对下册教材后补充准确名称与内容。'}</p>
    ${window.UnitRewards.placeholder(unit.id)}
    ${unit.outline.length?`<section class="outline"><h2>本${course.label}内容</h2><ol>${unit.outline.map((topic,i)=>`<li><span>${subject==='math'?unit.number+'.'+(i+1):String(i+1).padStart(2,'0')}</span>${escape(topic)}</li>`).join('')}</ol></section>`:''}
    <a class="primary-link" href="${catalogLink()}">返回${course.name}目录 <span aria-hidden="true">→</span></a>
  </main>`;
  window.UnitRewards.register(unit.id,{title:unit.title,rule:'当前仅可约定奖励总额，课程开放并有正式达标记录后开始累计。',progress:()=>({done:0,total:0})});
})();
