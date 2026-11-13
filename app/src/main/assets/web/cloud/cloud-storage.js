/* Runs before the course scripts, only in the authenticated browser learning shell. */
(()=>{
  'use strict';
  if(window.GrowingNative)return;
  const cloud=window.top.GrowingCloud;
  if(!cloud){location.replace('/');throw Error('请从学习中心进入课程');}
  Object.defineProperty(window,'localStorage',{value:cloud.storage(window),configurable:false});
  document.addEventListener('DOMContentLoaded',()=>{
    let back=document.querySelector('.course-return-nav [data-growing-back],a#catalog-back,a#back,a#course-back,a.back-link');
    if(!back){const nav=document.createElement('nav');nav.className='course-return-nav';nav.setAttribute('aria-label','返回上一级');back=document.createElement('a');back.href='/learn/app-design/index.html';nav.append(back);document.body.prepend(nav);}
    back.dataset.growingBack='';back.dataset.backFallback=back.href||new URL('/learn/app-design/index.html',location.href).href;
    const label=()=>{if(back.textContent!=='← 返回上一级')back.textContent='← 返回上一级';};label();
    new MutationObserver(label).observe(back,{childList:true,subtree:true});
    const style=document.createElement('style');style.textContent='.course-return-nav{box-sizing:border-box;max-width:1200px;margin:auto;padding:8px 24px;display:flex;align-items:center;position:relative;z-index:4;width:100%;flex-shrink:0;font:13px/1.5 "Microsoft YaHei",sans-serif}.course-return-nav a{display:inline-flex;align-items:center;min-height:44px;color:inherit;text-decoration:none;border-bottom:1px solid #718c59}.course-quick-tools{display:flex;gap:8px;flex-wrap:wrap;padding:8px 24px}.course-quick-tools button,.course-quick-tools a{font:inherit;min-height:44px;padding:10px 14px;border:1px solid #b9c6a9;border-radius:10px;color:inherit;background:#fffdf9;text-decoration:none;box-sizing:border-box}@media(max-width:520px){.course-return-nav,.course-quick-tools{padding:8px 15px;font-size:12px}}';document.head.append(style);
    if(!window.frameElement?.hasAttribute('data-photo-study-frame'))cloud.pageReady?.(location.href);
  });
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.hasAttribute('download')||link.target==='_blank')return;
    if(window.frameElement?.hasAttribute('data-photo-study-frame')){if(link.hasAttribute('data-growing-back')){event.preventDefault();window.parent.postMessage({type:'photo-study:back'},location.origin);}else if(link.target==='_top')link.target='_self';return;}
    if(link.hasAttribute('data-growing-back')&&cloud.back){event.preventDefault();cloud.back();return;}
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||!url.pathname.startsWith('/learn/')||url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
    // The mounted catalog updates its term in place after this capture phase.
    if(url.pathname===location.pathname&&link.closest('[data-student-vue="catalog"] .term-switch'))return;
    if(cloud.navigate){event.preventDefault();cloud.navigate(url.href);}
    else if(link.target==='_top')link.target='_self';
  },true);
  for(const name of ['pointerdown','keydown','touchstart'])document.addEventListener(name,()=>cloud.activity(location.href),{passive:true});
  cloud.activity(location.href);
})();
