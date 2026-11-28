/* Derive the graph from the reviewed paper; no separate question map or personal grades. */
(()=>{
 'use strict';
 const W=window.GrowingWeek13,rows=W.questions(),F=window.GrowingMathFormat;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={correct:'现存作答正确',incorrect:'原卷错题',partial:'部分完成',review:'待核对',unanswered:'未作答'};
 const state=q=>q.originalReview.wrong?'wrong':q.originalReview.verdict;
 const nodeKey=q=>'n:'+q.practice.unitId+':'+q.practice.nodeId;
 const course=q=>'math-course.html?'+new URLSearchParams({chapter:q.practice.unitId,node:q.practice.nodeId,practice:'1'});
 const units=new Map(),nodes=new Map();
 for(const q of rows){
  const p=q.practice;
  if(!units.has(p.unitId))units.set(p.unitId,{title:p.unitTitle,rows:[],nodes:new Map()});
  const u=units.get(p.unitId),key=nodeKey(q);u.rows.push(q);
  if(!nodes.has(key)){const node={title:p.nodeTitle,rows:[]};nodes.set(key,node);u.nodes.set(key,node);}
  nodes.get(key).rows.push(q);
 }
 const counts=list=>`${list.length} 题${list.some(q=>q.originalReview.wrong)?' · '+list.filter(q=>q.originalReview.wrong).length+' 道错题':''}`;
 document.getElementById('overview').textContent=`${rows.length} 道题 · ${units.size} 个单元 · ${nodes.size} 个知识点 · ${rows.filter(q=>q.originalReview.wrong).length} 道错题 / 部分完成 · ${rows.filter(q=>state(q)==='review').length} 道待核对`;
 document.getElementById('branches').innerHTML=[...units].map(([id,u])=>`<details class="branch" ${matchMedia('(min-width:601px)').matches?'open':''}><summary>${esc(u.title)}<span class="unit-count">${counts(u.rows)}</span></summary><div class="concepts"><div class="unit-actions"><button data-select="u:${esc(id)}" aria-pressed="false">单元题目</button><a href="math-course.html?chapter=${encodeURIComponent(id)}">进入课堂</a></div>${[...u.nodes].map(([key,n])=>`<div class="concept"><button data-select="${esc(key)}" aria-pressed="false">${esc(n.title)} · ${n.rows.length}题</button><div class="question-links">${n.rows.map(q=>`<a class="${state(q)}" href="${W.paperHref(q)}" aria-label="第${q.number}题，${labels[q.originalReview.verdict]}" title="${labels[q.originalReview.verdict]}">${q.number}${state(q)==='review'?'?':state(q)==='unanswered'?'—':q.originalReview.wrong?'*':''}</a>`).join('')}</div></div>`).join('')}</div></details>`).join('');
 const status=document.getElementById('status'),title=document.getElementById('selection');
 let selected='all';
 const valid=key=>key==='all'||key.startsWith('u:')&&units.has(key.slice(2))||nodes.has(key);
 function render(){
  document.querySelectorAll('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.select===selected)));
  const group=selected==='all'?rows:selected.startsWith('u:')?units.get(selected.slice(2)).rows:nodes.get(selected).rows;
  const visible=group.filter(q=>status.value==='all'||state(q)===status.value);
  title.textContent=selected==='all'?'全部知识点':selected.startsWith('u:')?units.get(selected.slice(2)).title:nodes.get(selected).title;
  document.getElementById('count').textContent=`${visible.length} / ${group.length} 道关联题目 · ${status.selectedOptions[0].textContent}`;
  document.getElementById('results').innerHTML=visible.map(q=>`<details class="result" data-question="${q.number}"><summary><span class="${q.originalReview.wrong?'wrong':''}">第 ${q.number} 题 · ${esc(q.practice.nodeTitle)}</span><span class="verdict ${state(q)}">${labels[q.originalReview.verdict]}</span></summary><div class="statement ${q.originalReview.wrong?'wrong':''}"><p>${F.html(q.body)}</p>${q.options.map((s,i)=>`<p>${'ABCD'[i]}. ${F.html(s)}</p>`).join('')}${q.parts.map((s,i)=>`<p>（${i+1}）${F.html(s)}</p>`).join('')}</div><div class="figures">${q.figures.map(src=>`<img src="${esc(src)}" alt="第${q.number}题题设图" loading="lazy">`).join('')}</div><p>${esc(q.originalReview.feedback)}</p>${q.review?`<p class="review">${esc(q.review)}</p>`:''}<footer><a href="${W.paperHref(q)}">查看原卷与解答</a><a href="${course(q)}">${esc(q.practice.unitTitle)} · 应用练习</a></footer></details>`).join('')||'<p class="empty">当前知识点没有符合此状态的题目，可切换状态或显示全部。</p>';
 }
 function restore(){
  const params=new URLSearchParams(location.hash.slice(1)),key=params.get('focus')||'all';selected=valid(key)?key:'all';
  const value=params.get('status')||'all';status.value=[...status.options].some(o=>o.value===value)?value:'all';render();
 }
 function save(){const params=new URLSearchParams();if(selected!=='all')params.set('focus',selected);if(status.value!=='all')params.set('status',status.value);history.pushState(null,'',location.pathname+location.search+(params.size?'#'+params:''));render();}
 document.querySelector('main').addEventListener('click',e=>{const button=e.target.closest('[data-select]');if(!button)return;selected=button.dataset.select;save();if(innerWidth<=600){title.focus({preventScroll:true});title.scrollIntoView({block:'start'});}});
 status.addEventListener('change',save);
 document.getElementById('reset').addEventListener('click',()=>{selected='all';status.value='all';save();});
 window.addEventListener('popstate',restore);window.addEventListener('hashchange',restore);restore();
})();
