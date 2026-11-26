/* Only load the explicitly registered course requested by the URL. */
(()=>{
 const base=new URL('./',document.currentScript.src),unit=new URLSearchParams(location.search).get('unit'),files=window.GrowingEnglishPointCourses.assets[unit];
 const load=name=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=new URL(name+'?v=20261126-points-1',base);el.onload=resolve;el.onerror=()=>reject(Error('课程资源暂时无法加载，请刷新重试'));document.head.append(el);});
 (async()=>{
  if(!files)throw Error('这个单元尚未录入要点课程，请返回英语目录。');
  for(const file of files)await load(file);
  if(unit==='english-8a-05'){await load('scenes.js');await load('unit5-scenes.js');}
  else await load('course-scenes.js');
  await load('unit5-study.js');
  window.dispatchEvent(new Event('english-points-ready'));
 })().catch(error=>{const status=document.getElementById('save-status');status.textContent=error.message;status.hidden=false;status.className='bad';document.getElementById('point-panel').prepend(status);});
})();
