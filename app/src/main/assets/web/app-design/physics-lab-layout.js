(()=>{
  'use strict';
  const workspace=document.querySelector('.lab-workspace');
  if(!workspace)return;
  const parameters=workspace.querySelector('.lab-parameters');
  const split=window.matchMedia('(min-width:740px) and (min-height:520px)');
  let frame=0;
  function fit(){
    frame=0;
    if(!split.matches){workspace.style.removeProperty('--workspace-height');return;}
    // Use document position so scrolling a panel never resizes the experiment.
    const top=workspace.getBoundingClientRect().top+window.scrollY;
    const available=(window.visualViewport?.height||window.innerHeight)-top-16;
    workspace.style.setProperty('--workspace-height',Math.round(Math.max(340,Math.min(760,available)))+'px');
    const nav=document.querySelector('.topics,.chapter-nav');
    const current=nav?.querySelector('[aria-current]');
    if(current&&nav.scrollWidth>nav.clientWidth){
      const item=current.getBoundingClientRect(),box=nav.getBoundingClientRect();
      if(item.left<box.left||item.right>box.right)
        nav.scrollLeft+=item.left-box.left-Math.max(0,(box.width-item.width)/2);
    }
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(fit);}
  const resize=new ResizeObserver(schedule);
  for(const element of document.querySelectorAll('.top,.sidebar,.lab>.heading,.lab>.lab-heading'))resize.observe(element);
  const title=document.getElementById('lab-title');
  if(title)new MutationObserver(()=>{parameters.scrollTop=0;schedule();}).observe(title,{childList:true,characterData:true,subtree:true});
  window.addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule);
  split.addEventListener('change',schedule);
  document.fonts?.ready.then(schedule);
  schedule();
})();
