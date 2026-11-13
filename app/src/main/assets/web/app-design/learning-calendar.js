/* Home calendar reuses the per-unit history reader and the current account's storage. */
(()=>{
  'use strict';
  const resources=new URL('./',document.currentScript.src),loads=new Map();
  let dialog,returnFocus;
  function script(name){
    if(!loads.has(name))loads.set(name,new Promise((resolve,reject)=>{
      const el=document.createElement('script');el.src=new URL(name,resources);
      el.onload=resolve;el.onerror=()=>{el.remove();loads.delete(name);reject(Error('日历资料加载失败，请关闭后重试。'));};document.head.append(el);
    }));
    return loads.get(name);
  }
  function style(name){const el=document.createElement('link');el.rel='stylesheet';el.href=new URL(name,resources);document.head.append(el);}
  async function open(focus=document.activeElement){
    if(dialog?.open)return;
    returnFocus=focus?.closest('details')?.querySelector('summary')||focus;
    if(!dialog){
      style('unit-rewards.css');style('learning-calendar.css');
      dialog=document.createElement('dialog');dialog.id='learning-calendar-dialog';dialog.setAttribute('aria-labelledby','learning-calendar-title');
      dialog.innerHTML='<header><h2 id="learning-calendar-title">学习日历</h2><button type="button" aria-label="关闭" title="关闭" style="width:44px;height:44px;padding:0;font-size:28px;line-height:1;flex:0 0 44px" autofocus>×</button></header><div data-calendar-content></div>';
      dialog.querySelector('button').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('close',()=>{dialog.querySelector('[data-calendar-content]').replaceChildren();returnFocus?.focus();});document.body.append(dialog);
    }
    const content=document.createElement('div');dialog.querySelector('[data-calendar-content]').replaceChildren(content);
    content.textContent='正在读取学习日历…';dialog.showModal();
    try{
      await Promise.all([window.GrowingCurriculum||script('curriculum.js'),window.GrowingUnitCalendar||script('unit-calendar.js')]);
      if(!dialog.open||!content.isConnected)return;
      const label=document.createElement('label'),select=document.createElement('select'),body=document.createElement('section');
      label.textContent='选择课程单元';label.append(select);
      for(const subject of Object.values(window.GrowingCurriculum))for(const term of Object.values(subject.terms))if(term.verified)for(const unit of term.units){
        const option=document.createElement('option');option.value=unit.id;option.textContent=`${subject.name} · ${term.name} · ${unit.number} ${unit.title}`;select.append(option);
      }
      const query=new URLSearchParams(location.search),unit=query.get('unit')||query.get('chapter');
      if([...select.options].some(option=>option.value===unit))select.value=unit;
      let cloud;try{cloud=window.top.GrowingCloud;}catch{}
      const store=cloud?.storage?cloud.storage():localStorage;
      const render=()=>{const host=document.createElement('div');body.replaceChildren(host);window.GrowingUnitCalendar.mount(host,select.value,store);};
      content.replaceChildren(label,body);select.addEventListener('change',render);render();
    }catch(error){if(content.isConnected)content.textContent=error.message;}
  }
  window.GrowingLearningCalendar={open};
})();
