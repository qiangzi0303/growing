/* One back link; course tools live beside the lesson navigation. */
(()=>{
  'use strict';
  const params=new URLSearchParams(location.search),path=decodeURIComponent(location.pathname),legacy=path.includes('/fraction-ops/')||path.includes('/word-ops-unit3/');
  let subject=document.body.dataset.subject==='physics'?'physics':'math',id=params.get('chapter')||params.get('unit')||'';
  if(path.includes('english-course')||path.includes('/word-ops-unit3/'))subject='english';
  if(path.includes('/fraction-ops/'))id='math-8b-10';
  if(path.includes('/word-ops-unit3/'))id='english-8a-03';
  const prefix=legacy?'../app-design/':'',term=id.includes('-8b-')?'lower':'upper';
  document.querySelectorAll('.course-return-nav').forEach(nav=>nav.remove());
  const nav=document.createElement('nav');nav.className='course-return-nav';nav.setAttribute('aria-label','返回上一级');
  const back=document.createElement('a');back.href=prefix+'units.html?'+new URLSearchParams({subject,term});back.dataset.growingBack='';back.textContent='← 返回上一级';nav.append(back);
  back.addEventListener('click',event=>{if(window.top.GrowingCloud?.back)return;if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1){event.preventDefault();history.back();}});
  const style=document.createElement('style');style.textContent='.course-return-nav{box-sizing:border-box;max-width:1200px;margin:auto;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px;font:13px/1.5 "Microsoft YaHei",sans-serif}.course-return-nav a{display:inline-flex;align-items:center;min-height:44px;color:inherit;text-decoration:none;border-bottom:1px solid #718c59}.course-return-nav a:focus-visible{outline:3px solid #e4b96a;outline-offset:3px}@media(max-width:520px){.course-return-nav{padding:8px 15px;font-size:12px}}';
  style.textContent+='.course-return-nav{position:relative;z-index:4;flex-shrink:0;width:100%}';
  style.textContent+='.course-return-nav{flex-wrap:wrap}';
  style.textContent+='.course-quick-tools{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.course-quick-tools a{padding:10px 14px;border:1px solid #b9c6a9;border-radius:10px;color:inherit;text-decoration:none}';
  window.GrowingCourseNavigation={subject,unit:id,writing:prefix+'handwriting.html?'+new URLSearchParams({subject,unit:id}),wrong:subject==='math'&&['math-8a-01','math-8a-02','math-8b-09','math-8b-10'].includes(id)?prefix+'math-wrong-questions.html?'+new URLSearchParams({unit:id}):''};
  document.head.append(style);(document.getElementById('app')||document.body).prepend(nav);
})();
