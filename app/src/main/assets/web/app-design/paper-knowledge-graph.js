/* Personal papers supplement the fixed reference graph; no learning records are written. */
(()=>{
 const startLegacy=()=>{
  'use strict';
  const host=document.createElement('section');host.id='paper-graph';host.setAttribute('aria-labelledby','paper-graph-title');
  host.innerHTML='<h2 id="paper-graph-title">我的拍照试卷 · 知识图谱</h2><div data-students></div><p data-status role="status" aria-live="polite"></p><button data-refresh type="button">刷新试卷</button><div data-tree class="paper-graph-tree"></div><h3 data-selection></h3><div data-questions class="results"></div>';
  document.querySelector('main h1').after(host);
  const $=s=>host.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let bridge,studentId='',profile=null,selected='all',sequence=0,studentSequence=0,page=1,query='',disposed=false;
  const clear=()=>{profile=null;$('[data-tree]').replaceChildren();$('[data-questions]').replaceChildren();$('[data-selection]').textContent='';};
  const unitUrl=id=>(id==='math-8b-10'?'knowledge.html':'math-course.html')+'?'+new URLSearchParams({chapter:id});
  function show(key='all'){
    if(!profile)return;selected=key;
    const questions=profile.questions.filter(q=>key==='all'||key==='pending'&&(q.pending||!q.unitIds.length)||key.startsWith('u:')&&q.unitIds.includes(key.slice(2))||key.startsWith('n:')&&q.nodeIds.includes(key.slice(2)));
    host.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===key)));
    $('[data-selection]').textContent=(key==='all'?'全部拍照题目':key==='pending'?'待核对 / 待归类':key.startsWith('u:')?profile.units.find(u=>u.id===key.slice(2))?.title:profile.nodes.find(n=>n.id===key.slice(2))?.title)+' · '+questions.length+' 道题';
    const labels={correct:'正确',partial:'部分正确',incorrect:'错误',unanswered:'未作答',review:'批改待复核'};
    $('[data-questions]').innerHTML=questions.map(q=>`<article><h3><button type="button" data-paper="${esc(q.paperId)}" data-question="${esc(q.id)}">${esc(q.paperTitle)} · 第${esc(q.number)}题</button></h3><p>${esc(q.text)}</p><p class="${!q.pending&&['incorrect','partial'].includes(q.verdict)?'priority':'summary'}">${q.pending?'试卷 / 题目待核对':labels[q.verdict]||(q.markedWrong?'原卷标记错题':'尚无有效批改')}</p><div>${q.unitIds.map(id=>`<a class="lesson-link" href="${unitUrl(id)}">${esc(profile.units.find(u=>u.id===id)?.title)}</a>`).join(' ')} ${q.nodeIds.map(id=>{const n=profile.nodes.find(n=>n.id===id);return n?`<a class="lesson-link" href="${esc('../'+n.href)}">${esc(n.title)}</a>`:'';}).join(' ')}</div></article>`).join('')||'<p>暂无对应题目。</p>';
  }
  function render(){
    const rows=profile.questions,button=(key,title,count)=>`<button type="button" data-filter="${esc(key)}" aria-pressed="false">${esc(title)} · ${count}</button>`;
    $('[data-tree]').innerHTML=button('all','全部拍照题目',rows.length)+button('pending','待核对 / 待归类',rows.filter(q=>q.pending||!q.unitIds.length).length)+profile.units.filter(u=>rows.some(q=>q.unitIds.includes(u.id))).map(u=>`<details open><summary>${esc(u.title)}</summary><div class="paper-graph-branch">${button('u:'+u.id,'单元全部题目',rows.filter(q=>q.unitIds.includes(u.id)).length)}${profile.nodes.filter(n=>n.unitId===u.id&&rows.some(q=>q.nodeIds.includes(n.id))).map(n=>button('n:'+n.id,n.title,rows.filter(q=>q.nodeIds.includes(n.id)).length)).join('')}</div></details>`).join('');
    if(!host.querySelector('[data-filter="'+selected+'"]'))selected='all';show(selected);
  }
  async function load(){
    const id=studentId,seq=++sequence;clear();if(!id){$('[data-status]').textContent='请选择学生。';return;}
    $('[data-status]').textContent='正在读取拍照试卷…';
    try{
      const data=await bridge.api('/question-bank/paper-graph?'+new URLSearchParams({studentId:id}));
      if(disposed||seq!==sequence||id!==studentId)return;
      if(data.studentId!==id)throw Error('学生信息不一致，请重新打开图谱。');
      profile=data;render();$('[data-status]').textContent=data.questions.length?'已自动关联保存的单元与知识点；待核对题目不计入成绩。':'还没有拍照试卷。拍照整理后会自动显示在这里。';
    }catch(error){if(!disposed&&seq===sequence)$('[data-status]').textContent=error.message;}
  }
  async function students(){
    const seq=++studentSequence;sequence++;clear();studentId='';$('[data-status]').textContent='正在读取学生…';
    try{
      const admin=bridge.user.role==='Admin',data=await bridge.api(admin?'/admin/members?'+new URLSearchParams({role:'Student',q:query,page}):'/parent/children');
      if(disposed||seq!==studentSequence)return;
      const rows=admin?data.rows:data;
      $('[data-students]').innerHTML=(admin?'<form data-search><label>搜索学生 <input name="q" maxlength="40" value="'+esc(query)+'"></label> <button>查询</button></form>':'')+'<label>学生 <select data-student><option value="">请选择学生</option>'+rows.map(s=>`<option value="${esc(s.id)}">${esc(s.displayName)}</option>`).join('')+'</select>'+(admin?`<button data-prev ${page<=1?'disabled':''}>上一页</button> <button data-next ${page*data.pageSize>=data.total?'disabled':''}>下一页</button>`:'');
      $('[data-status]').textContent=rows.length?'请选择学生。':'暂无可访问的学生。';
    }catch(error){if(!disposed&&seq===studentSequence)$('[data-status]').textContent=error.message;}
  }
  host.addEventListener('change',e=>{if(e.target.matches('[data-student]')){studentId=e.target.value;selected='all';load();}});
  host.addEventListener('submit',e=>{if(e.target.matches('[data-search]')){e.preventDefault();query=new FormData(e.target).get('q');page=1;students();}});
  host.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-refresh')){if(bridge){if(studentId)load();else if(bridge.user.role!=='Student')students();}else init();}
    if(b.hasAttribute('data-prev')||b.hasAttribute('data-next')){page+=b.hasAttribute('data-prev')?-1:1;students();}
    if(b.dataset.filter)show(b.dataset.filter);
    if(b.dataset.paper)try{await window.top.GrowingCloud.openPapers({subject:'math',studentId,paperId:b.dataset.paper,questionId:b.dataset.question});}catch(error){$('[data-status]').textContent=error.message;}
  });
  function changed(e){if(e.detail?.studentId===studentId)load();}
  async function init(){
    try{
      bridge=window.top.GrowingCloud?.paperReviewContext();
      if(!bridge)throw Error('请在登录后的课堂中打开图谱，以读取拍照试卷。');
      if(bridge.user.role==='Student'){studentId=bridge.user.id;await load();}else await students();
    }catch(error){$('[data-status]').textContent=error.message;}
  }
  window.top.addEventListener('growing:knowledge-changed',changed);
  window.addEventListener('pagehide',()=>{disposed=true;sequence++;window.top.removeEventListener('growing:knowledge-changed',changed);});
  window.addEventListener('pageshow',e=>{if(e.persisted){disposed=false;window.top.addEventListener('growing:knowledge-changed',changed);init();}});
  init();
 };
 if(!window.GrowingStudentPages?.registerLegacy(startLegacy))startLegacy();
})();
