/* Read existing per-unit study histories without changing progress or reward rules. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingUnitCalendar=factory();})(globalThis,()=>{
  'use strict';
  const scriptBase=typeof document==='object'?document.currentScript?.src:null;
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const entries=v=>Object.entries(object(v));
  const count=v=>Number.isFinite(v)&&v>=0?v:0;
  const day=(at=Date.now())=>{const d=new Date(at);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:null;};
  const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&day(new Date(s+'T12:00:00'))===s;
  const dated=at=>at!==null&&at!==undefined&&at!==''&&Number.isFinite(new Date(at).getTime())&&new Date(at).getTime()>0;
  const blank=()=>({ms:0,reads:0,grades:0,practice:0,special:0,words:0,lessons:0,newCount:0,items:[]});
  function collect(unitId,read,topics=[]){
    const result={days:{},baseline:0,datedMastery:false};
    const add=date=>validDate(date)?result.days[date]||(result.days[date]=blank()):null;
    const names=new Map(topics.map(t=>[t.id,t.title]));
    const mastery=(values,allowed=()=>true)=>{
      result.datedMastery=true;
      for(const [id,date] of entries(values))if(allowed(id)){if(date===null)result.baseline++;else{const row=add(date);if(row)row.newCount++;}}
    };
    const logs=(values,allowed,legacy=false)=>{
      for(const [date,rows] of entries(values)){
        for(const [id,r] of entries(rows))if(allowed(id)){
          const row=add(date);if(!row)continue;
          row.ms+=count(r.ms);row.reads+=count(r.reads);row.grades+=count(legacy?r.attempts:r.grades);
          row.practice+=count(legacy?r.exams:r.practice);row.special+=count(r.special);
          row.items.push({title:names.get(id)||'本单元学习项',grades:count(legacy?r.attempts:r.grades),practice:count(legacy?r.exams:r.practice),ms:count(r.ms)});
        }
      }
    };
    const times=values=>{for(const [date,ms] of entries(values)){const row=add(date);if(row)row.ms+=count(ms);}};
    if(unitId==='math-8b-10'){
      const raw=read('fraction-minute-v1');logs(raw?.learning?.days,()=>true,true);mastery(raw?.learning?.mastery);times(raw?.activity?.days);
    }else if(unitId.startsWith('math-')||unitId.startsWith('physics-')){
      const raw=read(unitId.startsWith('physics-')?'growing-physics-lessons-v1':'growing-math-lessons-v1');
      const ids=new Set(topics.filter(t=>t.unitId===unitId).map(t=>t.id)),allowed=id=>ids.has(id);
      logs(raw?.tools?.days,allowed);mastery(raw?.tools?.mastery,allowed);
      if(!raw?.tools)for(const [id,r] of entries(raw?.topics))if(allowed(id))for(const a of Array.isArray(r.attempts)?r.attempts:[]){if(dated(a.at)){const row=add(day(a.at));if(row)row.grades++;}}
    }else if(unitId==='english-8a-03'){
      const raw=read('wordops_8A_unit3');times(raw?.learningTime?.days);
      for(const [date,r] of entries(raw?.studyHistory?.days)){
        const row=add(date);if(!row)continue;
        row.words=entries(r.words).length;row.reads=Array.isArray(r.cards)?r.cards.length:0;
        row.practice=entries(r.quizzes).reduce((n,[,q])=>n+count(q?.attempts),0);
        row.grades=entries(r.feynman).reduce((n,[,q])=>n+count(q?.attempts),0);row.lessons=entries(r.points).length;
      }
    }else if(unitId.startsWith('english-')){
      const raw=read('growing-english-course-v1:'+unitId);times(raw?.learningTime?.days);
      for(const r of Object.values(object(raw?.words)))if(dated(r?.at)){const row=add(day(r.at));if(row)row.words++;}
      for(const r of Object.values(object(raw?.lessons)))if(dated(r?.at)){const row=add(day(r.at));if(row)row.lessons++;}
      for(const r of Object.values(object(raw?.feynman)))for(const a of Array.isArray(r.attempts)?r.attempts:[])if(dated(a?.at)){const row=add(day(a.at));if(row)row.grades++;}
    }
    return result;
  }
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format=ms=>ms<60000?Math.floor(ms/1000)+'秒':ms<3600000?Math.floor(ms/60000)+'分'+Math.floor(ms%60000/1000)+'秒':Math.floor(ms/3600000)+'小时'+Math.floor(ms%3600000/60000)+'分';
  let topicLoad;
  async function topics(){
    if(!globalThis.GrowingHandwriting){
      if(!topicLoad)topicLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('handwriting-core.js',scriptBase).href;s.onload=resolve;s.onerror=()=>{s.remove();topicLoad=null;reject(Error('日历资料加载失败，请重新打开。'));};document.head.append(s);});
      await topicLoad;
    }
    const h=globalThis.GrowingHandwriting;
    return entries(h.knowledgeNodes).map(([id,title])=>({id,title,unitId:h.nodeUnit(id)}));
  }
  async function mount(host,unitId,store=localStorage){
    host.innerHTML='<p role="status">正在读取本单元学习日历…</p>';
    let data;
    try{const map=await topics();if(!host.isConnected)return;data=collect(unitId,key=>{const raw=store.getItem(key);return raw===null?null:JSON.parse(raw);},map);}
    catch{if(host.isConnected)host.innerHTML='<p role="status">日历记录暂时无法读取，原记录未改动。请检查存储权限后重新打开。</p>';return;}
    let selected=day(),month=selected.slice(0,7);
    function render(focus){
      const first=new Date(month+'-01T12:00:00'),offset=(first.getDay()+6)%7,length=new Date(first.getFullYear(),first.getMonth()+1,0).getDate(),row=data.days[selected]||blank();
      const dates=Object.keys(data.days).filter(date=>data.days[date].newCount).sort();let total=data.baseline;
      const points=dates.map((date,i)=>{total+=data.days[date].newCount;return {date,total,x:35+(i+1)/(dates.length+1)*530};});
      const maximum=Math.max(1,total),y=n=>135-n/maximum*105;
      let path=`M35 ${y(data.baseline)}`;for(const p of points)path+=` H${p.x} V${y(p.total)}`;path+=' H565';
      host.innerHTML=`<h3>学习日历</h3><p class="unit-calendar-note">只展示本单元已保存的学习记录。浏览日历不增加掌握程度；旧记录没有日期或时长时不补算。</p>${data.datedMastery?`<section class="unit-calendar-growth"><h4>首次达标累计 · ${total} 项</h4><svg viewBox="0 0 600 165" role="img" aria-label="本单元首次达标成长曲线"><path d="${path}"/><text x="8" y="30">${total}</text><text x="12" y="139">0</text><text x="35" y="160">${dates[0]||'暂无带日期记录'}</text><text x="565" y="160" text-anchor="end">${dates.at(-1)||day()}</text></svg>${data.baseline?`<p>${data.baseline} 项历史达标记录日期未知，计入累计起点。</p>`:''}</section>`:''}<div class="unit-calendar-toolbar"><button type="button" data-unit-month="-1" aria-label="上个月">‹</button><h4>${first.getFullYear()}年${first.getMonth()+1}月</h4><button type="button" data-unit-month="1" aria-label="下个月">›</button></div><button type="button" data-unit-day="${day()}">回到今天</button><div class="unit-calendar-week" aria-hidden="true">${['一','二','三','四','五','六','日'].map(d=>`<span>${d}</span>`).join('')}</div><div class="unit-calendar-grid">${'<span></span>'.repeat(offset)}${Array.from({length},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0'),r=data.days[date],active=r&&Object.entries(r).some(([k,v])=>k==='items'?v.length:v>0);return `<button type="button" data-unit-day="${date}" class="${active?'studied':''}" aria-pressed="${date===selected}" aria-label="${date}${active?'，有学习记录':''}">${i+1}<small>${r?.newCount?'+'+r.newCount:active?'·':'&nbsp;'}</small></button>`;}).join('')}</div><section class="unit-calendar-summary" aria-live="polite"><h4>${selected} · 学习摘要</h4><p>有效学习 ${format(row.ms)}${data.datedMastery?' · 新增首次达标 '+row.newCount+' 项':''}</p><p>阅读 ${row.reads} 次 · AI 评分 ${row.grades} 次 · 练习 ${row.practice} 轮${row.special?' · 专项 '+row.special+' 题':''}${unitId.startsWith('english-')?' · 默写记录 '+row.words+' 项 · 检测记录 '+row.lessons+' 项':''}</p>${row.items.map(r=>`<p><strong>${esc(r.title)}</strong> · AI 评分 ${r.grades} 次 · 练习 ${r.practice} 轮 · ${format(r.ms)}</p>`).join('')}${!data.days[selected]?'<p>当天暂无本单元的带日期学习记录。</p>':''}</section>`;
      if(focus)host.querySelector(focus)?.focus();
    }
    host.onclick=event=>{
      const b=event.target.closest('button');if(!b)return;
      if(b.dataset.unitMonth){const d=new Date(month+'-01T12:00:00');d.setMonth(d.getMonth()+Number(b.dataset.unitMonth));month=day(d).slice(0,7);selected=month+'-01';render('[data-unit-month="'+b.dataset.unitMonth+'"]');}
      else if(b.dataset.unitDay){selected=b.dataset.unitDay;month=selected.slice(0,7);render('[data-unit-day="'+selected+'"]');}
    };
    render();
  }
  return {collect,day,validDate,mount};
});
