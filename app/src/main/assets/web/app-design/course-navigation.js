/* Explicit parent links also work when a classroom is opened outside its iframe. */
(()=>{
  'use strict';
  const params=new URLSearchParams(location.search),path=decodeURIComponent(location.pathname),legacy=path.includes('/fraction-ops/')||path.includes('/word-ops-unit3/');
  let subject=document.body.dataset.subject==='physics'?'physics':'math',id=params.get('chapter')||params.get('unit')||'';
  if(path.includes('english-course')||path.includes('/word-ops-unit3/'))subject='english';
  if(path.includes('/fraction-ops/'))id='math-8b-10';
  if(path.includes('/word-ops-unit3/'))id='english-8a-03';
  const prefix=legacy?'../app-design/':'',term=id.includes('-8b-')?'lower':'upper';
  const nav=document.createElement('nav');nav.className='course-return-nav';nav.setAttribute('aria-label','返回上级目录');
  nav.innerHTML=`<a target="_top" href="${prefix}units.html?subject=${subject}&term=${term}&v=shared-ai-1">← 返回${{math:'数学',physics:'物理',english:'英语'}[subject]}目录</a><a target="_top" href="${prefix}index.html?v=shared-ai-1">选择课程 →</a>`;
  const style=document.createElement('style');style.textContent='.course-return-nav{box-sizing:border-box;max-width:1200px;margin:auto;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px;font:13px/1.5 "Microsoft YaHei",sans-serif}.course-return-nav a{display:inline-flex;align-items:center;min-height:44px;color:inherit;text-decoration:none;border-bottom:1px solid #718c59}.course-return-nav a:focus-visible{outline:3px solid #e4b96a;outline-offset:3px}@media(max-width:520px){.course-return-nav{padding:8px 15px;font-size:12px}}';
  style.textContent+='.course-return-nav{position:relative;z-index:4;flex-shrink:0;width:100%}';
  document.head.append(style);(document.getElementById('app')||document.body).prepend(nav);
})();
