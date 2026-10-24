/* Independent management page; only summary fields leave the report API. */
window.GrowingUnitReports={async mount(root,api,esc,alive,isAdmin){
  let listRequest=0,reportRequest=0,selected='',studentName='',query='',page=1,report=null;
  const current=()=>alive()&&root.isConnected;
  const date=v=>v?esc(new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})):'尚未同步';
  const decimal=v=>Number(v).toFixed(1).replace(/\.0$/,'');
  const duration=v=>v===null?'暂无时间记录':v<1?Math.max(1,Math.round(v*60))+' 秒':decimal(v)+' 分钟';
  root.innerHTML=`<h1>学生学习报告</h1><p class="muted">按已学习单元查看学习时间、评测结果和掌握程度。</p><section class="panel"><h2>${isAdmin?'选择学生':'选择孩子'}</h2>${isAdmin?'<form data-report-search class="actions filters"><label>用户名或称呼<input name="q" maxlength="40" placeholder="搜索学生"></label><button class="primary" type="submit">查询</button></form>':''}<div data-report-students class="actions" role="group" aria-label="学生列表"></div><div data-report-pages class="actions pagination"></div></section><section data-unit-report aria-live="polite"></section>`;
  const area=root.querySelector('[data-unit-report]');
  function error(target,e){if(current())target.innerHTML=`<p class="warning" role="alert">${esc(e.message)}</p><button data-report-retry>重试读取报告</button>`;}
  function draw(){
    const subject=area.querySelector('[data-report-subject]')?.value||'',term=area.querySelector('[data-report-term]')?.value||'';
    const rows=report.units.filter(u=>(!subject||u.subject===subject)&&(!term||u.term===term));
    const all=report.units,minutes=all.reduce((sum,u)=>sum+(u.activeMinutes??0),0),missing=all.filter(u=>u.activeMinutes===null).length;
    if(!area.querySelector('[data-report-units]'))area.innerHTML=`<div class="actions report-heading"><h2>${esc(studentName)}的单元报告</h2><button data-refresh-units>刷新报告</button></div><p class="muted">最近云同步：${date(report.lastSyncedAt)}</p><div class="cards report-overview"><article class="panel stat"><p>已学习单元</p><strong class="metric">${all.length}</strong></article><article class="panel stat"><p>有记录的有效时长</p><strong class="metric">${duration(all.length&&!missing||minutes?minutes:null)}</strong><small>${missing?'另有 '+missing+' 个单元暂无时间记录':'按单元已有计时汇总'}</small></article><article class="panel stat"><p>已完成课程达标的单元</p><strong class="metric">${all.filter(u=>u.mastered===u.total).length} / ${all.length}</strong></article></div><div class="actions filters"><label>学科<select data-report-subject><option value="">全部学科</option><option value="math">数学</option><option value="english">英语</option><option value="physics">物理</option></select></label><label>册次<select data-report-term><option value="">全部册次</option><option value="upper">八年级上册</option><option value="lower">八年级下册</option></select></label></div><p class="muted" data-report-count></p><div data-report-units class="unit-report-grid"></div><p class="muted">${esc(report.note)}</p>${report.warnings.map(w=>`<p class="warning">${esc(w)}</p>`).join('')}`;
    area.querySelector('[data-report-count]').textContent=`显示 ${rows.length} 个已学习单元`;
    area.querySelector('[data-report-units]').innerHTML=rows.length?rows.map(u=>{
      const c=u.concept,d=u.diagnostic,h=u.handwriting;
      return `<article class="panel unit-report-card" data-report-unit="${esc(u.id)}"><div class="actions report-heading"><div><span class="badge">${esc(u.subjectName)} · ${esc(u.termName)}</span><h3>${esc(u.title)}</h3></div><strong class="report-percent">${u.masteryPercent}%<small>课程达标</small></strong></div><progress max="${u.total}" value="${u.mastered}" aria-label="${esc(u.title)}课程达标 ${u.mastered}/${u.total}"></progress><p class="muted">${u.mastered} / ${u.total} 项达标${u.mastered===u.total?' · 本单元已达标':''}</p><dl class="unit-report-facts"><div><dt>有效学习时长</dt><dd>${duration(u.activeMinutes)}</dd></div><div><dt>有记录的学习日期</dt><dd>${u.firstStudyDay?esc(u.firstStudyDay)+(u.lastStudyDay!==u.firstStudyDay?' 至 '+esc(u.lastStudyDay):'')+'<br><small>共 '+u.studyDays+' 天</small>':'暂无日期记录'}</dd></div><div><dt>概念复述</dt><dd>${c.passed} / ${c.total} 项通过${c.latest!==null?'<br><small>最近 '+decimal(c.latest)+'/10 · 最好 '+decimal(c.best)+'/10</small>':c.best!==null?'<br><small>留存最好 '+decimal(c.best)+'/10</small>':c.passed?'<br><small>按历史达标记录</small>':'<br><small>暂无有效评分</small>'}</dd></div><div><dt>题目评测</dt><dd>${decimal(u.practice.done)} / ${u.practice.total}<br><small>按各题项最好结果折合，非考试次数</small></dd></div></dl><div class="report-diagnosis"><strong>图谱诊断</strong><p>${!d.total?'该科目暂未开放':!d.tested?'未测（暂无完整评测记录）':`已测 ${d.tested}/${d.total} 项 · 初筛通过 ${d.passed} · 不稳 ${d.shaky} · 薄弱 ${d.weak} · 未测 ${d.total-d.tested}`}</p></div>${h.latest?`<p>手写评测：${h.latest.needsReview?'待核对原稿':h.latest.score+'/100'} <small class="muted">${date(h.latest.at)} · 不直接计入课程达标</small></p>`:''}</article>`;
    }).join(''):`<section class="panel"><h3>${all.length?'该筛选下暂无已学习单元':'尚无已同步的单元学习记录'}</h3><p class="muted">${all.length?'可切换学科或册次查看。':'请让学生进入课堂学习并完成云同步，然后刷新报告。'}</p></section>`;
  }
  async function load(id,name){
    selected=id;studentName=name;const seq=++reportRequest;report=null;
    root.querySelectorAll('[data-report-student]').forEach(b=>{const active=b.dataset.reportStudent===id;b.classList.toggle('primary',active);b.setAttribute('aria-pressed',String(active));});
    area.innerHTML='<p role="status">正在读取单元学习记录…</p>';
    try{const data=await api((isAdmin?'/admin/students/':'/parent/children/')+id+'/unit-report');if(!current()||seq!==reportRequest)return;report=data;area.replaceChildren();draw();}
    catch(e){if(current()&&seq===reportRequest)error(area,e);}
  }
  async function students(){
    const seq=++listRequest;++reportRequest;selected='';report=null;area.replaceChildren();
    const list=root.querySelector('[data-report-students]'),pages=root.querySelector('[data-report-pages]');list.innerHTML='<p role="status">正在读取学生列表…</p>';pages.replaceChildren();
    try{
      const data=await api(isAdmin?'/admin/members?'+new URLSearchParams({q:query,role:'Student',page}):'/parent/children');if(!current()||seq!==listRequest)return;
      const rows=isAdmin?data.rows:data;
      list.innerHTML=rows.length?rows.map(s=>`<button data-report-student="${esc(s.id)}" data-report-name="${esc(s.displayName)}">${esc(s.displayName)}${isAdmin?'（'+esc(s.username)+'）':''}</button>`).join(''):`<p>${isAdmin?'没有符合条件的学生。':'尚未关联孩子，请到设置中添加孩子。'}</p>`;
      if(isAdmin)pages.innerHTML=`<button data-report-page="${page-1}" ${page<=1?'disabled':''}>上一页</button><span>第 ${page} 页 · 共 ${data.total} 位学生</span><button data-report-page="${page+1}" ${page*data.pageSize>=data.total?'disabled':''}>下一页</button>`;
      if(rows.length)await load(rows[0].id,rows[0].displayName);
    }catch(e){if(current()&&seq===listRequest)error(list,e);}
  }
  root.addEventListener('submit',e=>{if(!e.target.matches('[data-report-search]'))return;e.preventDefault();query=String(new FormData(e.target).get('q')).trim();page=1;students();});
  root.addEventListener('change',e=>{if(report&&e.target.matches('[data-report-subject],[data-report-term]'))draw();});
  root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!current())return;
    if(b.dataset.reportStudent)load(b.dataset.reportStudent,b.dataset.reportName);
    if(b.dataset.reportPage){page=Number(b.dataset.reportPage);students();}
    if(b.hasAttribute('data-refresh-units')||b.hasAttribute('data-report-retry')){if(selected)load(selected,studentName);else students();}
  });
  await students();
}};
