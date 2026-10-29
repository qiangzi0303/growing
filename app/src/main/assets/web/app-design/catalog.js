(() => {
  'use strict';
  const data=window.GrowingCurriculum;
  const params=new URLSearchParams(location.search);
  const subject=params.get('subject')||'math';
  const term=params.get('term')||'upper';
  const hasGraph=subject==='math'||subject==='physics',graphFile=subject==='physics'?'physics-knowledge.html':'knowledge.html';
  const course=Object.hasOwn(data,subject)?data[subject]:null;
  const book=course && Object.hasOwn(course.terms,term)?course.terms[term]:null;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const viewVersion='shared-ai-1';
  const catalogLink=(value=term)=>'units.html?'+new URLSearchParams({subject,term:value,v:viewVersion});
  const studyLink=unit=>'study.html?'+new URLSearchParams({subject,term,unit:unit.id,v:viewVersion});
  const label=unit=>hasGraph?`第 ${unit.number} 章`:`Unit ${unit.number}`;
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
        <div><p class="eyebrow">八年级 · ${book.edition||course.edition}</p><h1>${course.name}<span>一步一步，学会每一课。</span></h1></div>
        <div class="subject-stamp" aria-hidden="true">${subject==='physics'?'v = s/t':hasGraph?'x²':'Aa'}</div>
      </header>
      <nav class="term-switch" aria-label="选择学期">${Object.entries(course.terms).map(([key,value])=>`<a href="${catalogLink(key)}" ${key===term?'aria-current="page"':''}>${value.name}<span>${key==='upper'?'上学期':'下学期'}</span></a>`).join('')}</nav>
      ${subject==='math'?`<section class="my-papers" aria-labelledby="my-papers-title"><h2 id="my-papers-title">我的试卷</h2><div class="paper-entry"><div><h3>期中复习卷</h3><p>23 道题 · 题目与单元知识点对应</p></div><nav aria-label="期中复习卷资料"><a href="math-exam-midterm-graph.html">交互知识图谱 <span aria-hidden="true">→</span></a><a href="math-exam-midterm.html">无答案试卷 <span aria-hidden="true">→</span><small>可直接打印</small></a></nav></div><div class="paper-entry" style="margin-top:12px"><div><h3>期中掌握检测卷（二）</h3><p>同难度新题 · 100 分 · 选择、填空、手写解答</p></div><nav aria-label="同难度检测卷"><a href="math-exam-practice.html">开始检测 <span aria-hidden="true">→</span></a></nav></div></section>`:''}
      ${subject==='math'?`<section class="my-papers" aria-labelledby="geometry-models-title"><h2 id="geometry-models-title">模型推导</h2><div class="paper-entry"><div><h3>初中几何模型</h3><p>41 个模型 · 分步证明 · SVG 动画 · 应用题与单元知识关联</p></div><nav aria-label="模型推导"><a href="geometry-models.html">进入模型推导 <span aria-hidden="true">→</span></a></nav></div></section>`:''}
      ${subject==='english'?`<section class="knowledge-entry english-animation-entry" aria-label="英语动画记单词"><div><strong>看动作，记单词。</strong><p>17 个空间关系表达 · 16 种行走与奔跑表达</p></div><a class="english-animation-button" href="english-visual-lab.html?term=${term}">动画记单词 →</a></section>`:''}
      ${!book.verified?`<p class="verification-note"><span aria-hidden="true">ⓘ</span> ${subject==='physics'?'下册暂不开放，当前先学习上册。上册已按2025年第4版核对。':'下册教材目录待核对，目前预留 8 个单元位置，名称与数量以教材为准。'}</p>`:''}
      <section class="unit-section" aria-labelledby="unit-list-title">
        <div class="list-heading"><h2 id="unit-list-title">${book.name}<span> / ${course.label}目录</span></h2><p>${book.units.length?book.units.length+' '+(book.verified?(hasGraph?'章':'个单元'):'个预留单元'):'目录待补充'}${available?`<span class="available-count"> · ${available} ${hasGraph?'章':'个'}可学习</span>`:''}</p></div>
        <ol class="unit-list">${book.units.map(unit=>`<li><div class="unit-row ${unit.entry?'is-ready':''}" data-unit="${unit.id}">
          <span class="unit-number" aria-hidden="true">${String(unit.number).padStart(2,'0')}</span>
          <div class="unit-copy"><span class="unit-label">${label(unit)}</span><div class="unit-title"><h3><a class="unit-course-link" href="${studyLink(unit)}">${escape(unit.title)}</a></h3></div><p>${escape(unit.summary)}</p><div class="unit-actions">${book.verified&&unit.entry?`<a class="unit-reward-trigger" href="unit-summary.html?subject=${subject}&unit=${unit.id}">单元总结 →</a>`:''}${window.UnitRewards.placeholder(unit.id)}</div></div>
          <span class="unit-state">${state(unit)}</span><span class="unit-arrow" aria-hidden="true">↗</span>
        </div></li>`).join('')}</ol>
      </section>
      <p class="catalog-footnote">${hasGraph?(book.verified?'各章均可进入学习，并查看本章图谱与薄弱点诊断。':(subject==='physics'?'下册暂不开放，当前先学习上册。':'下册内容待提供教材核对后开放。')):book.verified?'上册8个单元均可学习：单词、闭卷默写、阅读与语法练习、独立奖励进度。':'下册内容待教材核对后开放。'}</p>`;
    for(const u of book.units){
      // Catalogs display the latest saved course counts; they do not infer mastery from browsing.
      window.UnitRewards.register(u.id,{title:u.title,readOnly:true,entry:studyLink(u),rule:u.entry?'此处展示最近保存的掌握记录；进入课堂学习后同步。':'课程内容筹备中，有正式达标记录后开始累计。'});
    }
    return;
  }
  const unit=book.units.find(item=>item.id===params.get('unit'));
  if(!unit){fail();return;}
  document.title=`${unit.title} · ${course.name} · 成长`;
  const knowledgeLink=graphFile+'?'+new URLSearchParams({chapter:unit.id});
  const toolbar=`<header class="study-toolbar"><a class="back-link" href="${catalogLink()}">← ${course.name}目录</a><div class="study-location"><span>${book.name} · ${label(unit)}</span><strong>${escape(unit.title)}</strong></div>${unit.entry?`<a class="knowledge-link" href="unit-summary.html?subject=${subject}&unit=${unit.id}">单元总结</a>`:''}${hasGraph?`<a class="knowledge-link" href="${knowledgeLink}">图谱 · 诊断</a>`:''}<a class="home-link" href="index.html?v=${viewVersion}">选择课程</a></header>`;
  if(unit.entry){
    document.body.classList.add('has-course');
    const tools=hasGraph?`<section class="study-tools" aria-label="${escape(unit.title)}知识图谱与诊断入口"><div><strong>${escape(unit.title)} · 知识图谱与诊断</strong><p>看知识关联，找出卡住的那一步</p></div><nav aria-label="选择${course.name}工具"><a href="${knowledgeLink}">知识图谱 →</a><a class="diagnosis-button" href="${knowledgeLink}&mode=diagnosis">薄弱点诊断 →</a></nav></section>`:'';
    const route=new URLSearchParams(unit.entry.split('?')[1]||'');
    if(params.get('node'))route.set('node',params.get('node'));
    route.set('v',viewVersion);
    const frameEntry=unit.entry.split('?')[0]+'?'+route;
    target.innerHTML=`${toolbar}${tools}<iframe class="course-frame" title="${escape(course.name+' · '+unit.title+'完整学习页')}" src="${escape(frameEntry)}" allow="autoplay"></iframe>`;
    return;
  }
  target.innerHTML=`${toolbar}<main class="pending-shell">
    <div class="pending-emblem" aria-hidden="true">${hasGraph?'∠':'Aa'}</div>
    <p class="eyebrow">${book.name} · ${label(unit)}</p><div class="unit-title"><h1>${escape(unit.title)}</h1>${window.UnitRewards.placeholder(unit.id)}</div>
    <p class="pending-state">${state(unit)}</p>
    <p class="pending-description">${book.verified?'这一课还在准备中，完整学习内容将陆续开放。':'本单元暂为目录占位，待核对下册教材后补充准确名称与内容。'}</p>
    ${unit.outline.length?`<section class="outline"><h2>本${course.label}内容</h2><ol>${unit.outline.map((topic,i)=>`<li><span>${hasGraph?unit.number+'.'+(i+1):String(i+1).padStart(2,'0')}</span>${escape(topic)}</li>`).join('')}</ol></section>`:''}
    <a class="primary-link" href="${catalogLink()}">返回${course.name}目录 <span aria-hidden="true">→</span></a>
  </main>`;
  window.UnitRewards.register(unit.id,{title:unit.title,rule:'当前仅可约定奖励总额，课程开放并有正式达标记录后开始累计。',progress:()=>({done:0,total:0})});
})();
