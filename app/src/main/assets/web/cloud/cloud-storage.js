/* Runs before the course scripts, only in the authenticated browser learning shell. */
(()=>{
  'use strict';
  if(window.GrowingNative)return;
  const cloud=window.top.GrowingCloud;
  if(!cloud){location.replace('/');throw Error('请从学习中心进入课程');}
  Object.defineProperty(window,'localStorage',{value:cloud.storage(),configurable:false});
  document.addEventListener('click',event=>{const link=event.target.closest('a[target="_top"]');if(link)link.target='_self';},true);
  for(const name of ['pointerdown','keydown','touchstart'])document.addEventListener(name,()=>cloud.activity(location.href),{passive:true});
  cloud.activity(location.href);
})();
