(()=>{
  'use strict';
  const data=window.GrowingMathWrongQuestions,params=new URLSearchParams(location.search);
  const select=document.getElementById('unit'),search=document.getElementById('search'),host=document.getElementById('questions');
  const repeat=document.getElementById('repeat');let attempts=null;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const unitName=id=>{const u=data.units.find(u=>u.id===id);return `${u.term} · ${u.title}`;};
  const inUnit=(q,id)=>id==='all'||(q.unitIds||[q.unitId]).includes(id);
  const source=document.getElementById('source');
  if(source)source.value=params.get('source')==='midterm-20261029'?'midterm-20261029':'all';
  select.innerHTML=`<option value="all">全部单元 · ${data.questions.length} 题</option>`+data.units.map(u=>`<option value="${u.id}">${esc(unitName(u.id))} · ${data.questions.filter(q=>inUnit(q,u.id)).length} 题</option>`).join('');
  select.value=data.units.some(u=>u.id===params.get('unit'))?params.get('unit'):'all';
  function render(){
    const id=select.value,key=search.value.trim().toLowerCase();
    const unitRows=data.questions.filter(q=>inUnit(q,id)&&(!source||source.value==='all'||(q.sourceId||'1025141010')===source.value));
    const rows=unitRows.filter(q=>(!repeat.checked||attempts?.get('math',q.id).wrongCount>=2)&&(!key||`第${q.number}题 ${q.number} ${q.title} ${q.text} ${q.note} ${q.review||''} ${(q.concepts||[]).join(' ')}`.toLowerCase().includes(key)));
    if(attempts){
      const ready=attempts.ready('math');repeat.disabled=!ready;
      document.getElementById('attempt-summary').textContent=ready?`本单元累计错误 ${unitRows.reduce((sum,q)=>sum+attempts.get('math',q.id).wrongCount,0)} 次 · 反复错题 ${unitRows.filter(q=>attempts.get('math',q.id).wrongCount>=2).length} 题。做对后仍保留历史错误次数。`:'统计暂未读取成功，请检查网络后刷新；未把历史次数显示为零。';
    }
    document.getElementById('count').textContent=`${id==='all'?'全部单元':unitName(id)} · 共 ${rows.length} 题`;
    const back=document.getElementById('back');
    back.href=id==='all'?'units.html?subject=math':id==='math-8b-10'?'../fraction-ops/分式作战_一分钟学习版.html':'math-course.html?'+new URLSearchParams({chapter:id});
    back.textContent=id==='all'?'← 数学目录':'← 返回本单元';
    host.innerHTML=rows.map(q=>`<article class="question" id="${q.sourceId?q.id:'q'+q.number}"><p class="meta">${esc(unitName(q.unitId))} · ${esc(q.sourceLabel||'1025141010.pdf')} · 第 ${q.page} 页 · 第 ${q.number} 题</p><h2>${esc(q.title)}</h2>${q.note?`<p class="note">${esc(q.note)}</p>`:''}${q.review?`<p class="${q.priority?'note':'notice'}">${esc(q.review)}</p>`:''}<div class="question-text math-prose">${GrowingMathFormat.html(q.text)}</div>${q.figure?`<img class="midterm-figure" src="${esc(q.figure)}" alt="第${q.number}题题设示意图，按原卷重绘" loading="lazy">`:''}${attempts?attempts.markup('math',q.id):''}</article>`).join('')||'<p>没有符合条件的题目。</p>';
    for(const q of rows){const card=document.getElementById(q.sourceId?q.id:'q'+q.number);card.insertAdjacentHTML('beforeend',GrowingWrongReview.markup(q));}GrowingWrongReview.hydrate();
    try{history.replaceState(null,'','?'+new URLSearchParams({unit:id,...(source&&source.value!=='all'?{source:source.value}:{})})+location.hash);}catch(_){}
  }
  select.addEventListener('change',render);if(source)source.addEventListener('change',render);search.addEventListener('input',render);repeat.addEventListener('change',render);render();
  (async()=>{try{const context=await GrowingQuestionAttempts.context();if(!context)return;attempts=GrowingQuestionAttempts.create(document.body,context.api,context.studentId,()=>true,render);await attempts.load('math');render();}catch(e){document.getElementById('attempt-summary').textContent='作答统计连接失败：'+e.message;}})();
})();
