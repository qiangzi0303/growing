(() => {
  'use strict';
  const D=window.GrowingKnowledge,E=window.GrowingDiagnosis,g=E.graph(D);
  const physics=document.body.dataset.subject==='physics',subject=physics?'physics':'math',subjectName=physics?'物理':'数学',graphFile=physics?'physics-knowledge.html':'knowledge.html';
  const screen=document.getElementById('screen'),note=document.getElementById('storage-note');
  const params=new URLSearchParams(location.search);
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chapter=D.chapters.find(c=>c.id===(params.get('chapter')||(physics?D.chapters[0].id:'math-8b-10')));
  if(!chapter){screen.innerHTML=`<section class="panel"><h2>没有找到这个${subjectName}章节</h2><a href="units.html?subject=${subject}">返回${subjectName}目录 →</a></section>`;return;}
  const KEY=(physics?'growing-diagnosis-physics-v1:':'growing-diagnosis-year8-v1:')+chapter.id;
  const RESULT_KEY='growing-diagnosis-v1:'+chapter.id;
  const studyLink=(c=chapter,id='')=>'study.html?'+new URLSearchParams({subject,term:c.term,unit:c.id,v:'shared-ai-1',...(id?{node:id}:{})});
  const courseLink=n=>{const c=D.chapters.find(c=>c.id===n.chapter);return c?`<a class="link-button" href="${studyLink(c,n.id)}">打开${esc(c.title)}课程</a>`:'';};
  const availableIds=new Set(chapter.nodes.map(n=>n.id));
  function includePre(id){for(const e of g.pre.get(id)){if(!availableIds.has(e.from)){availableIds.add(e.from);includePre(e.from);}}}
  chapter.nodes.forEach(n=>includePre(n.id));
  const availableNodes=D.nodes.filter(n=>availableIds.has(n.id));
  document.title=chapter.title+'知识图谱与诊断 · 成长';
  document.getElementById('knowledge-meta').textContent=`${physics?(chapter.term==='upper'?'苏科版2025年第4版':'苏科版2012年第3版（2015年印刷）'):'苏科版'} · 八年级${chapter.term==='upper'?'上':'下'}册 · 第${chapter.number}章 · ${chapter.title}`;
  document.getElementById('chapter-number').textContent=chapter.number;
  document.getElementById('scope-note').textContent=`本章 ${chapter.nodes.length} 个知识点；${D.scopeLabel||'全年11章'}可切换，必要时跨章回查先修。题目与关系待教师审核，初筛用于安排复习。`;
  document.getElementById('chapter-select').innerHTML=D.chapters.map(c=>`<option value="${c.id}" ${c.id===chapter.id?'selected':''}>${c.term==='upper'?'上册':'下册'} · 第${c.number}章 ${esc(c.title)}</option>`).join('');
  document.getElementById('catalog-back').href='units.html?subject='+subject+'&term='+chapter.term;
  document.getElementById('catalog-back').textContent='← '+subjectName+'目录';
  document.getElementById('chapter-study').href=studyLink();
  const labels={untested:'未测',pending:'待复测',screened:'初筛通过',shaky:'不稳',weak:'需补学'};
  const title=id=>g.byId.get(id).title;
  const chip=(id,status)=>`<span class="chip ${status}">${esc(labels[status])}</span>`;
  let selected=g.byId.has(params.get('node'))?params.get('node'):!physics&&chapter.number===10?'add':chapter.nodes[0].id;
  let mode=['diagnosis','panorama'].includes(params.get('mode'))?params.get('mode'):'graph';
  let panoramaRange=params.get('range')==='year'?'year':'chapter';
  const panorama=window.GrowingPanorama.create(g);
  let scope='1',target=params.has('chapter')&&!params.has('node')?'chapter':selected,session=null,active=false,feedback='',observer=null;
  try{const saved=localStorage.getItem(KEY);if(saved){session=E.restore(g,saved);if(!session.protocol&&E.inspect(g,session).canContinue){session=null;note.hidden=false;note.textContent='旧版未完成记录仍保留在本机。请新开一次固定题序评测，全部完成后查看报告。';}else{if(E.inspect(g,session).canContinue)session={...session,closed:false};active=E.inspect(g,session).canContinue;}}}
  catch(error){note.hidden=false;note.textContent='未能恢复本机诊断记录（记录版本、格式或浏览器存储不可用）。可以重新诊断；原课程记录未改动。';}
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(session));}
    catch(error){note.hidden=false;note.textContent='浏览器暂时无法保存诊断。仍可完成本轮，关闭页面后可能无法恢复；原课程记录未改动。';}
    const credit=E.assessmentCredit(g,session);
    if(!credit)return;
    try{
      const saved=JSON.parse(localStorage.getItem(RESULT_KEY)||'{"version":1,"records":{}}');
      const records=saved.version===1&&saved.records&&typeof saved.records==='object'?saved.records:{};
      for(const [id,value] of Object.entries(credit)){
        if(!chapter.nodes.some(n=>n.id===id))continue;
        let previous=null;try{previous=E.assessmentCredit(g,records[id]);}catch(error){/* Replace invalid evidence. */}
        if(!previous||value>(previous[id]??-1))records[id]=session;
      }
      localStorage.setItem(RESULT_KEY,JSON.stringify({version:1,records}));
    }catch(error){note.hidden=false;note.textContent='本轮已完成，但排行榜评测记录未能保存，请检查浏览器存储后重试。';}
  }
  const state=()=>session?E.inspect(g,session):null;
  const visibleState=()=>{const s=state();return s&&!s.canContinue?s:null;};
  const status=id=>visibleState()?.states[id]||'untested';
  function switchMode(value){mode=value;feedback='';render();}
  function locate(id){selected=id;target=id;if(mode!=='panorama')mode='graph';render();if(mode==='panorama')panorama.center();else document.getElementById('node-detail').scrollIntoView({block:'nearest'});}
  function render(){
    observer?.disconnect();
    panorama.destroy();
    document.body.classList.toggle('is-panorama',mode==='panorama');
    document.querySelectorAll('[data-mode]').forEach(b=>{
      if(b.dataset.mode===mode)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    try{history.replaceState(null,'',graphFile+'?'+new URLSearchParams({chapter:chapter.id,node:selected,mode,...(mode==='panorama'?{range:panoramaRange}:{})}));}catch(error){/* file browsing can restrict history */}
    screen.innerHTML=mode==='graph'?graphMarkup():mode==='panorama'?panorama.markup({chapter,range:panoramaRange,selected,states:visibleState()?.states||{}})+detailMarkup():diagnosisMarkup();
    if(mode==='graph'){
      observer=new ResizeObserver(drawLines);observer.observe(document.querySelector('.graph-board'));
      requestAnimationFrame(drawLines);
    }else if(mode==='panorama'){
      panorama.mount((id,center,keyboard)=>{selected=id;target=id;render();if(center)panorama.center();if(keyboard)document.getElementById('pan-stage').focus({preventScroll:true});});
    }
  }
  function graphMarkup(){
    const ancestors=new Set(),depthSeen=new Map();
    function walk(id,depth){if(depth<=0||(depthSeen.get(id)||0)>=depth)return;depthSeen.set(id,depth);for(const e of g.pre.get(id)){ancestors.add(e.from);walk(e.from,depth-1);}}
    walk(selected,scope==='all'?g.byId.size:Number(scope));
    const pre=g.order.filter(id=>ancestors.has(id));
    const after=g.next.get(selected).map(e=>e.to);
    const n=g.byId.get(selected),s=visibleState();
    const node=id=>`<button type="button" class="graph-node ${id===selected?'selected':''}" data-node="${id}" data-status="${s?.states[id]||'untested'}" aria-pressed="${id===selected}"><strong>${esc(title(id))}</strong><small>${labels[s?.states[id]||'untested']}</small></button>`;
    const relations=g.pre.get(selected);
    return `<div class="graph-layout">
      <section class="panel" aria-labelledby="map-title">
        <div class="panel-top"><h2 id="map-title">知识怎样相连</h2><label class="small">先修范围 <select id="graph-depth"><option value="1" ${scope==='1'?'selected':''}>1 层</option><option value="2" ${scope==='2'?'selected':''}>2 层</option><option value="all" ${scope==='all'?'selected':''}>全部先修</option></select></label></div>
        <p class="graph-caption">点击知识点看详情。箭头从先修点指向后续知识点。</p>
        <div class="legend"><span><i class="line-key"></i>必要先修</span><span><i class="line-key soft"></i>辅助关系</span></div>
        <div class="graph-board"><svg class="graph-lines" aria-hidden="true"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" style="fill:#98aa87;stroke:none"/></marker></defs><g id="edges"></g></svg>
          <div class="graph-columns"><div class="graph-column"><p class="column-label">先修知识</p>${pre.map(node).join('')||'<p class="graph-empty">本图谱未继续拆分先修</p>'}</div><div class="graph-column"><p class="column-label">当前知识点</p>${node(selected)}</div><div class="graph-column"><p class="column-label">直接后续</p>${after.map(node).join('')||'<p class="graph-empty">本图谱的终点</p>'}</div></div>
        </div>
        <label class="small">快速定位 <select id="node-select" aria-label="选择知识点">${[...new Set([...availableNodes, g.byId.get(selected)])].map(item=>`<option value="${item.id}" ${item.id===selected?'selected':''}>${esc(item.title)}${item.chapter===chapter.id?'':'（先修/跨章）'}</option>`).join('')}</select></label>
        <p class="small">颜色与标签仅表示本轮直接答题证据；未作答的先修不会自动算通过。</p>
      </section>
      ${detailMarkup()}
    </div>`;
  }
  function detailMarkup(){
    const n=g.byId.get(selected),s=visibleState(),relations=g.pre.get(selected);
    return `<aside class="panel detail" id="node-detail" aria-labelledby="detail-title"><p class="eyebrow">${esc(n.section)}</p><h2 class="detail-heading" id="detail-title">${esc(n.title)}</h2>${chip(n.id,s?.states[n.id]||'untested')}
        <h3>学会后应能做到</h3><p>${esc(n.criterion)}</p>
        <h3>为什么需要这些先修</h3>${relations.length?`<ul class="relation-list">${relations.map(e=>`<li><button class="text-button" data-locate="${e.from}">${esc(title(e.from))}</button> · ${e.strength==='hard'?'必要':'辅助'}<br>${esc(e.reason)}</li>`).join('')}</ul>`:'<p class="small">这是本图谱的基础点，尚未向前细分。</p>'}
        <h3>复习卡</h3><div class="review-box">${esc(n.review)}<p>${esc(n.example)}</p></div>
        <p class="small">${esc(n.source)}。关系强弱为教学设计，尚未用学生数据校准。</p>
        <div class="actions"><button class="primary" data-prepare="${n.id}">诊断这个知识点 →</button>${courseLink(n)}${session?'<button data-mode="diagnosis">回到本轮诊断</button>':''}</div>
      </aside>`;
  }
  function drawLines(){
    const board=document.querySelector('.graph-board');if(!board)return;
    const rect=board.getBoundingClientRect(),points=new Map();
    board.querySelectorAll('[data-node]').forEach(el=>{const r=el.getBoundingClientRect();points.set(el.dataset.node,{left:r.left-rect.left,right:r.right-rect.left,y:r.top+r.height/2-rect.top});});
    document.getElementById('edges').innerHTML=D.edges.filter(e=>points.has(e.from)&&points.has(e.to)).map(e=>{
      const a=points.get(e.from),b=points.get(e.to),forward=a.right<b.left;
      if(forward){const mid=(a.right+b.left)/2;return `<path class="${e.strength}" d="M${a.right},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.left-2},${b.y}" marker-end="url(#arrow)"/>`;}
      // Ancestors in the same column: route through the gutter, outside node labels.
      const x=Math.max(a.right,b.right)+9;
      return `<path class="${e.strength}" d="M${a.right},${a.y} C${x},${a.y} ${x},${b.y} ${b.right+2},${b.y}" marker-end="url(#arrow)"/>`;
    }).join('');
  }
  function diagnosisMarkup(){
    const s=state();
    return `<div class="diagnosis-shell">${s&&active&&s.next?questionMarkup(s):s&&!s.canContinue?reportMarkup(s):setupMarkup(s)}</div>`;
  }
  function setupMarkup(s){
    if(target!=='chapter'&&!chapter.nodes.some(n=>n.id===target))target='chapter';
    return `<section class="panel setup"><p class="eyebrow">定位薄弱环节 · 每点固定两题</p><h2>从哪里开始检查？</h2>
      <ol class="step-list"><li>选择整章或一个知识点，每个目标固定两题。</li><li>所有人按相同顺序作答，答题中不提示对错或诊断标签。</li><li>全部提交后统一查看诊断报告与逐题解析。</li></ol>
      <div class="field-row"><label>选择目标<select id="target-select"><option value="chapter" ${target==='chapter'?'selected':''}>${esc(chapter.title)}整章评测（${chapter.nodes.length*2}题）</option>${chapter.nodes.map(n=>`<option value="${n.id}" ${target===n.id?'selected':''}>${esc(n.title)}（2题）</option>`).join('')}</select></label></div>
      <p class="small">遇到不熟悉的题，可以选择“暂时不会”。本轮必须完成全部题目后才显示报告；可以关闭页面后续答。诊断结果按各知识点已完成评测的最好正确比例计入排行榜，占总分30%。</p>
      ${s?`<div class="empty-state">已有本轮记录：作答 ${s.asked.length} 题。${s.canContinue&&!session.closed?'可以继续上次诊断。':'可查看本轮结果。'}新开诊断会替换这份诊断记录。</div>`:''}
      <div class="actions"><button class="primary" id="start">${s?'新开一次诊断':'开始诊断 →'}</button>${s?`<button id="resume">${s.canContinue&&!session.closed?'继续上次诊断':'查看本轮结果'}</button>`:''}</div>
      <p class="save-hint">完成后请返回学习中心同步，学生和已绑定家长即可查看更新后的排行榜。复测使用同一小题库，熟悉题目可能影响结果。</p></section>`;
  }
  function questionMarkup(s){
    const item=s.next,q=item.question;
    return `<section class="panel" aria-labelledby="question-title"><div class="progress-top"><p>已完成 ${s.asked.length} 题 / 共 ${session.limit} 题</p><span class="chip">第 ${s.asked.length+1} 题</span></div><progress value="${s.asked.length}" max="${session.limit}" aria-label="本轮作答进度"></progress>
      <h2 class="question-title" id="question-title" tabindex="-1">${esc(q.prompt)}</h2>
      <form id="answer-form"><fieldset class="options"><legend>选择一个答案</legend>${q.options.map((x,i)=>`<label class="option"><input type="radio" name="choice" value="${i}" required><span class="letter">${'ABCD'[i]}</span><span>${esc(x)}</span></label>`).join('')}<label class="option unsure"><input type="radio" name="choice" value="unsure" required><span>暂时不会 / 不确定</span></label></fieldset>
      <p class="feedback" aria-live="polite">${esc(feedback)}</p><div class="actions"><button class="primary" type="submit">${s.asked.length+1===session.limit?'完成评测，查看诊断报告':'提交，继续作答 →'}</button><button type="button" id="undo" ${!s.asked.length?'disabled':''}>撤销上一题</button></div></form>
      <p class="save-hint">每题提交后保存，可刷新续答。为避免提示影响复测，解析会在本轮结果中展示。</p></section>`;
  }
  function reportMarkup(s){
    const groups=name=>s.order.filter(id=>(s.states[id]||'untested')===name);
    const pending=groups('pending'),untested=groups('untested');
    const credit=E.assessmentCredit(g,session);
    return `<section class="panel report"><p class="eyebrow">本轮学习线索 · 不是掌握认证</p><h2 tabindex="-1" id="report-title">知道下一步该练什么。</h2><p class="summary-intro">已作答 ${s.asked.length} / 最多 ${session.limit} 题。${s.limitReached?'已到题量上限，尚有内容未确认。':session.closed?'本轮提前结束，结论只基于已作答部分。':'本轮目标的检查路径已结束；未测先修仍保留未测。'}</p>
      <div class="summary-stats">${[['weak','需补学'],['shaky','不稳'],['screened','初筛通过'],['untested','未测']].map(([key,label])=>`<div class="stat"><strong>${groups(key).length}</strong><span>${label}</span></div>`).join('')}</div>
      ${credit?`<p class="notice">本轮图谱诊断正确率 ${(Object.values(credit).reduce((a,b)=>a+b,0)/session.targets.length*100).toFixed(1)}%。排行榜按本章全部知识点的已完成评测最好正确比例计分，诊断占总分30%，未测知识点记0。请返回学习中心同步后查看名次。</p>`:'<p class="small">这是旧版初筛记录；新开一次评测并全部完成后，才能计入图谱诊断排行榜分项。</p>'}
      ${pending.length?`<p class="notice">待复测 ${pending.length} 个：${pending.map(title).map(esc).join('、')}。每点只有一题未通过，证据不足，不能判为薄弱。</p>`:''}
      <section class="result-section"><h3>可能卡住的基础环节</h3>${s.roots.length?s.roots.map(r=>`<div class="root-card"><h3>${esc(title(r.id))}</h3><p>两题未通过（包含“暂时不会”）。${r.uncertain.length?`它的必要先修“${r.uncertain.map(title).map(esc).join('、')}”尚未全部初筛通过，原因可能还在更前面。`:'本试点中没有更前的已确认薄弱先修；仍只是候选线索。'}</p><button class="text-button" data-locate="${r.id}">看关系与复习卡 →</button></div>`).join(''):'<p class="empty-state">本轮没有确认的薄弱基础点。初筛通过不等于掌握；待复测和未测部分仍需保留。</p>'}</section>
      <section class="result-section"><h3>建议复习顺序</h3>${s.path.length?`<ol class="learning-path">${s.path.map(id=>`<li><strong>${esc(title(id))}</strong>${chip(id,s.states[id])}<button class="text-button" data-locate="${id}">复习 →</button></li>`).join('')}</ol><p class="small">按先修顺序排列已发现的薄弱与不稳点；复习卡只是提醒，建议结合原课程练习。</p>`:'<p class="small">暂未形成补学路径。可继续原课程；若仍有疑问，单独诊断相关先修点。</p>'}
      ${s.soft.length?`<p class="small">另可检查辅助点：${s.soft.map(id=>`<button class="text-button" data-locate="${id}">${esc(title(id))}</button>`).join('、')}。辅助关系不自动触发回溯，也不推断为薄弱。</p>`:''}
      <p class="small">复习后回测原目标：${session.targets.map(title).map(esc).join('、')}。新一轮仍只作初筛。</p></section>
      <section class="result-section"><h3>逐点证据与解析</h3><p class="small">只根据直接作答给标签。未作答的先修点不会由后续题的结果代推。</p>${s.order.map(id=>`<details class="evidence"><summary>${esc(title(id))} · ${labels[s.states[id]||'untested']} · ${(s.attempts[id]||[]).length} 题</summary>${(s.attempts[id]||[]).map(a=>{
        const q=g.bank.get(id).find(x=>x.id===a.qid);
        return `<div class="answer-record"><strong>${esc(q.prompt)}</strong><p>你的选择：${a.choice===null?'暂时不会 / 不确定':esc(q.options[a.choice])} · ${a.correct?'通过':'未通过'}</p><p>参考答案：${esc(q.options[q.answer])}<br>${esc(q.explanation)}</p></div>`;
      }).join('')||'<p>本轮没有直接作答证据。未测不表示会，也不表示不会。</p>'}<button class="text-button" data-locate="${id}">查看知识点 →</button></details>`).join('')}</section>
      <div class="actions"><button class="primary" id="retry">复习后，回测原目标</button><button id="new">换个目标</button><button id="undo" ${!s.asked.length?'disabled':''}>撤销最后一题</button>${s.canContinue?'<button id="continue">继续尚未做完的题</button>':''}<a class="link-button" href="${studyLink()}">回${esc(chapter.title)}课程</a></div>
      <p class="save-hint">本轮涉及 ${s.order.length} 个目标及先修点，未测 ${untested.length} 个；未作整章或全年掌握判断。</p></section>`;
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.mode){switchMode(b.dataset.mode);return;}
    if(b.dataset.node){selected=b.dataset.node;target=selected;render();return;}
    if(b.dataset.locate){locate(b.dataset.locate);return;}
    if(b.dataset.prepare){target=b.dataset.prepare;mode='diagnosis';active=false;render();
      // Explicit preparation never discards a saved run; show setup alongside the saved-run controls.
      screen.innerHTML=`<div class="diagnosis-shell">${setupMarkup(state())}</div>`;return;}
    if(b.id==='start'){
      const targets=target==='chapter'?chapter.nodes.map(n=>n.id):[target];
      session=E.createAssessment(g,targets);active=true;feedback='';save();render();
    }else if(b.id==='resume'){active=!session.closed&&!!state().next;render();}
    else if(b.id==='undo'){session=E.undo(g,session);active=true;feedback='已撤销上一题，请重新选择。';save();render();}
    else if(b.id==='continue'){session={...session,closed:false};active=true;save();render();}
    else if(b.id==='retry'){session=E.createAssessment(g,session.targets);active=true;feedback='';save();render();}
    else if(b.id==='new'){active=false;screen.innerHTML=`<div class="diagnosis-shell">${setupMarkup(state())}</div>`;}
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.id==='chapter-select'){location.href=graphFile+'?'+new URLSearchParams({chapter:el.value,mode,...(mode==='panorama'?{range:panoramaRange}:{})});}
    else if(el.id==='pan-range'){panoramaRange=el.value==='year'?'year':'chapter';if(panoramaRange==='chapter'&&!availableIds.has(selected)){selected=chapter.nodes[0].id;target=selected;}render();}
    else if(el.id==='graph-depth'){scope=el.value;render();}
    else if(el.id==='node-select'){selected=el.value;target=selected;render();}
    else if(el.id==='target-select')target=el.value;
  });
  document.addEventListener('submit',event=>{
    if(event.target.id!=='answer-form')return;event.preventDefault();
    const field=new FormData(event.target).get('choice');if(field===null)return;
    const item=state().next,choice=field==='unsure'?null:Number(field);
    session=E.answer(g,session,item.question.id,choice);save();
    active=!!state().next;
    feedback='';
    render();document.getElementById(active?'question-title':'report-title')?.focus();
  });
  addEventListener('pagehide',()=>panorama.destroy());
  render();
})();
