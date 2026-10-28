(()=>{
  'use strict';
  const subjects={math:'数学',english:'英语',physics:'物理'},terms={upper:'上学期 · 八年级上册',lower:'下学期 · 八年级下册'};
  const percent=n=>Number(n).toFixed(1)+'%',points=n=>Number(n).toFixed(2);
  window.GrowingRankings={async mount(root,api,esc,alive,prefix,title='我的排行榜',beforeRefresh){
    let boards=[],subject='',term='',kind='unit',selected='',page=1,request=0;
    const valid=()=>alive()&&root.isConnected;
    root.classList.add('panel','rankings');
    root.innerHTML=`<div class="actions ranking-heading"><h2>${esc(title)}</h2><button data-rank-refresh>刷新排行榜</button></div><p class="ranking-formula"><strong>费曼评测 × 30% + 题目评测 × 40% + 图谱诊断评测 × 30%</strong></p><p class="muted">按全站学习同一课程的学生比较，仅展示当前学生已开始的单元与科目。其他同学使用匿名榜名。</p><div data-rank-filters></div><div data-rank-content role="status" aria-live="polite">正在读取排行榜…</div>`;
    const content=root.querySelector('[data-rank-content]'),filters=root.querySelector('[data-rank-filters]');
    const options=(values,current)=>Object.entries(values).map(([v,t])=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(t)}</option>`).join('');
    function drawFilters(){
      const choices=boards.filter(b=>(!subject||b.subject===subject)&&(!term||b.term===term)&&b.kind===kind);
      if(!choices.some(b=>b.id===selected))selected=choices[0]?.id||'';
      filters.innerHTML=`<div class="actions filters"><label>科目<select data-rank-subject>${options({'':'全部科目',...subjects},subject)}</select></label><label>学期<select data-rank-term>${options({'':'全部学期',...terms},term)}</select></label><label>榜单类型<select data-rank-kind>${options({unit:'单元排行榜',course:'学期科目排行榜'},kind)}</select></label><label class="ranking-course">已开始的课程<select data-rank-board ${choices.length?'':'disabled'}>${choices.length?choices.map(b=>`<option value="${esc(b.id)}" ${b.id===selected?'selected':''}>${esc(subjects[b.subject]+' · '+b.title)}</option>`).join(''):'<option>暂无符合条件的课程</option>'}</select></label></div>`;
    }
    function showError(e){content.innerHTML=`<p class="warning" role="alert">${esc(e.message)} <button data-rank-retry>重试</button></p>`;}
    async function load(){
      const seq=++request;
      if(!selected){content.innerHTML='<p class="muted">暂无对应的已学习课程。开始学习后，自动显示单元榜和学期科目榜。</p>';return;}
      content.innerHTML='<p role="status">正在读取名次…</p>';
      try{
        const data=await api(prefix+'?'+new URLSearchParams({board:selected,page}));if(!valid()||seq!==request)return;
        const mine=data.self;
        content.innerHTML=`<h3>${esc(data.board.title)} · ${esc(terms[data.board.term])}</h3><div class="ranking-self"><div><span class="muted">${esc(mine.label)} · 当前名次</span><strong class="metric">第 ${mine.rank} 名 <small>/ ${data.total} 人</small></strong></div><div><span class="muted">加权总分 / 100</span><strong class="metric">${points(mine.score)}</strong></div><div><p>费曼 ${percent(mine.conceptPercent)} → ${(mine.conceptPercent*.3).toFixed(2)} 分<br>题目 ${percent(mine.testPercent)} → ${(mine.testPercent*.4).toFixed(2)} 分<br>图谱诊断 ${percent(mine.diagnosisPercent)} → ${(mine.diagnosisPercent*.3).toFixed(2)} 分</p></div></div><p class="muted">${data.board.kind==='course'?'按本学期全部已开放单元的概念项、检测项、诊断项汇总，未学习部分记0。':'按本单元全部概念项、检测项、诊断项计算；未掌握部分记0。'} 同分并列，显示两位小数。最近计分：${esc(new Date(mine.updatedAt).toLocaleString('zh-CN'))}</p><div class="table-scroll" tabindex="0"><table><caption class="muted">${esc(data.board.title)}排行榜 · 共 ${data.total} 人</caption><thead><tr><th scope="col">名次</th><th scope="col">同学</th><th scope="col">费曼评测<br><small>占30%</small></th><th scope="col">题目评测<br><small>占40%</small></th><th scope="col">图谱诊断<br><small>占30%</small></th><th scope="col">总分</th></tr></thead><tbody>${data.rows.map(r=>`<tr ${r.isSelf?'class="ranking-current" aria-current="true"':''}><td>${r.rank}</td><td>${esc(r.label)}${r.isSelf?' <span class="badge">当前学生</span>':''}</td><td>${percent(r.conceptPercent)}</td><td>${percent(r.testPercent)}</td><td>${percent(r.diagnosisPercent)}</td><td><strong>${points(r.score)}</strong></td></tr>`).join('')||'<tr><td colspan="6">本页暂无记录，请返回上一页。</td></tr>'}</tbody></table></div><div class="actions pagination"><button data-rank-page="${page-1}" ${page<=1?'disabled':''}>上一页</button><span>第 ${page} 页 · 共 ${Math.ceil(data.total/data.pageSize)} 页</span><button data-rank-page="${page+1}" ${page*data.pageSize>=data.total?'disabled':''}>下一页</button></div><details><summary>计分口径</summary><p>费曼项需有效费曼解释达到8/10（旧英语课堂为80/100）。测试按每项检测的最好正确比例累计：数学、物理按知识点应用练习；英语按必会词条七次默写与微课检测，旧Unit 3按已有分组检测。图谱诊断只计全部完成的固定题序评测，按每个本章知识点两题的最好正确比例累计；未完成不计分，未评测部分记0，先修点不跨章重复加分。英语图谱诊断尚未开放，该项暂记0分。阅读、奖励金额和学习时长不计分。榜单依据学习记录，不作为监考考试成绩。</p></details>`;
      }catch(e){if(valid()&&seq===request)showError(e);}
    }
    async function refresh(){
      const seq=++request;
      content.innerHTML='<p role="status">正在更新排行榜…</p>';
      try{
        if(beforeRefresh)await beforeRefresh();
        if(!valid()||seq!==request)return;
        const data=await api(prefix);if(!valid()||seq!==request)return;
        boards=data.boards;page=1;drawFilters();await load();
      }catch(e){if(valid()&&seq===request)showError(e);}
    }
    root.addEventListener('change',e=>{
      if(!valid())return;
      if(e.target.matches('[data-rank-subject]'))subject=e.target.value;
      else if(e.target.matches('[data-rank-term]'))term=e.target.value;
      else if(e.target.matches('[data-rank-kind]'))kind=e.target.value;
      else if(e.target.matches('[data-rank-board]'))selected=e.target.value;
      else return;
      page=1;drawFilters();load();
    });
    root.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b||!valid())return;
      if(b.hasAttribute('data-rank-refresh')||b.hasAttribute('data-rank-retry'))refresh();
      if(b.dataset.rankPage){page=Number(b.dataset.rankPage);load();}
    });
    await refresh();
  }};
})();
