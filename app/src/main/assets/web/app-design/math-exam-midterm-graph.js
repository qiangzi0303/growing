/* Explicit links use real, reviewed course node IDs. No attempt records are created. */
(()=>{
'use strict';
const base='';
const bank=base+'math-wrong-questions.html?source=midterm-20261029';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unit=id=>D.groups.find(g=>g[1]===id)?.[0]||id;
const targetUrl=t=>base+(t.chapter==='math-8b-10'?'knowledge.html':'math-course.html')+'?'+new URLSearchParams({chapter:t.chapter,node:t.node});
const unitUrl=id=>base+(id==='math-8b-10'?'knowledge.html':'math-course.html')+'?'+new URLSearchParams({chapter:id});
const lesson=(id)=>D.links[id].targets.map(t=>`<a class="lesson-link" href="${targetUrl(t)}" data-course-node="${esc(t.node)}">${esc(unit(t.chapter))} · ${esc(t.title)} ↗</a>`).join('');
const chips=(ids)=>ids.map(id=>`<span class="mapping-item"><button data-concept="${id}">${esc(D.names[id])}</button><span>${D.links[id].exact?'对应知识点':'关联基础'}：${lesson(id)}</span>${D.links[id].note?`<small>${esc(D.links[id].note)}</small>`:''}</span>`).join('');
document.getElementById('concepts').innerHTML='<button data-concept="all" aria-pressed="true">全部题目</button>'+D.groups.map(([name,id,items])=>`<h3><a class="unit-link" href="${unitUrl(id)}">${name} · 打开单元 ↗</a></h3><div class="concepts">${items.map(([id,label])=>`<button data-concept="${id}" aria-pressed="false">${label}</button>`).join('')}</div>`).join('');
function show(id,scroll=false){
 if(id!=='all'&&!D.links[id])return;
 document.querySelectorAll('[data-concept]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.concept===id));b.classList.toggle('selected-concept',b.dataset.concept===id);});
 const rows=D.questions.filter(q=>id==='all'||q.concepts.includes(id));
 document.getElementById('selection').textContent=(D.names[id]||'全部知识点')+' · '+rows.length+'道题';
 const paths=D.edges.filter(([a,b])=>a===id||b===id);
 document.getElementById('paths').innerHTML=(id==='all'?'':`<section class="selected-lesson"><b>当前考点的单元学习入口</b>${chips([id])}</section>`)+(paths.length?'<div class="path">复习依赖 / 迁移：'+paths.map(([a,b])=>`<button data-concept="${a}">${esc(D.names[a])}</button> → <button data-concept="${b}">${esc(D.names[b])}</button>`).join('；')+'</div>':'');
 document.getElementById('results').innerHTML=rows.map(q=>`<article id="map-${q.number}" data-question="${q.number}"><h3><a class="question-link" href="${bank}#${q.id}">第${q.number}题 · ${esc(q.title)} ↗</a></h3><p>归档单元：${(q.unitIds||[q.unitId]).map(u=>`<a href="${unitUrl(u)}">${esc(unit(u))} ↗</a>`).join(' / ')}</p><p class="${q.priority?'priority':'summary'}">${esc(q.review)}</p><div class="question-mapping">${chips(q.concepts)}</div><p><a href="${bank}#${q.id}">查看本题与题设图 →</a></p></article>`).join('');
 try{history.replaceState(null,'',location.pathname+location.search+(id==='all'?'':'#concept='+encodeURIComponent(id)));}catch{}
 if(scroll)document.getElementById('selection').scrollIntoView({block:'start',behavior:'smooth'});
}
document.querySelector('main').addEventListener('click',e=>{
 const b=e.target.closest('[data-concept]');if(!b)return;
 e.preventDefault();show(b.dataset.concept,b.closest('.overview')!==null);
});
window.addEventListener('hashchange',()=>{const id=location.hash.startsWith('#concept=')?decodeURIComponent(location.hash.slice(9)):'all';show(id);});
const initial=location.hash.startsWith('#concept=')?decodeURIComponent(location.hash.slice(9)):'all';show(initial);
})();
