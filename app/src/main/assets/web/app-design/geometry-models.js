(() => {
  'use strict';
  const data=window.GrowingGeometryModels.models,graph=window.GrowingMath;
  const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups=['平行','中点','角平分线','全等','平行与相似','最值','其他'];
  const titles=['识别条件','构造与转化','推理依据','结论与边界'];
  let filtered=data,current=null,progress=0,playing=false,raf=0,lastTime=0;
  const paths=s=>s?s.split(';').map(v=>v.trim().split(/\s+/)):[];
  const course=id=>graph.nodes.find(n=>n.id===id);
  $('group').insertAdjacentHTML('beforeend',groups.map(g=>`<option>${g}</option>`).join(''));
  function stop(){playing=false;cancelAnimationFrame(raf);const p=$('play');if(p){p.textContent='播放推演';p.setAttribute('aria-pressed','false');}}
  function filter(){
    const term=$('search').value.trim().toLowerCase(),group=$('group').value,level=$('level').value;
    filtered=data.filter(m=>(!group||m.group===group)&&(!level||(level==='advanced')===m.advanced)&&(!term||[m.id,m.title,m.given,m.result,...m.nodes.map(id=>course(id)?.title||id)].join(' ').toLowerCase().includes(term)));
    $('count').textContent=`显示 ${filtered.length} / ${data.length} 个模型。点击目录选择，推演进度可拖动。`;
    renderList();
    if(!filtered.length){stop();current=null;$('model').innerHTML='<p class="empty">没有匹配的模型，请调整搜索或筛选条件。</p>';return;}
    if(!current||!filtered.some(m=>m.id===current.id))select(filtered[0].id,false);
  }
  function renderList(){
    $('model-list').innerHTML=groups.map(g=>{const items=filtered.filter(m=>m.group===g);return items.length?`<p class="list-group">${g}</p>${items.map(m=>`<a class="model-link" href="#model-${m.id}" data-model="${m.id}" ${current?.id===m.id?'aria-current="true"':''}><span>${String(m.id).padStart(2,'0')}</span>${esc(m.title)}</a>`).join('')}`:'';}).join('');
  }
  function select(id,updateHash=true){
    const m=data.find(x=>x.id===id);if(!m)return;stop();current=m;progress=0;
    if(updateHash)history.replaceState(null,'','#model-'+id);
    document.title=m.title+' · 模型推导';renderList();
    const index=data.indexOf(m),pages=m.pages.map(p=>`第 ${p} 页`).join('、');
    $('model').innerHTML=`<div class="badges"><span class="badge">模型 ${String(m.id).padStart(2,'0')} / ${esc(m.group)}</span><span class="badge ${m.advanced?'ext':''}">${m.advanced?'拓展 · 含后续课程知识':'八年级基础与综合'}</span><span class="badge">原资料 ${pages}</span></div><h2>${esc(m.title)}</h2><div class="given"><strong>模型条件</strong>${esc(m.given)}</div><div class="conclusion"><strong>要证明的结论</strong>${esc(m.result)}</div>
      <section class="stage" aria-label="SVG分步推演"><div class="stage-head"><b>主图推演</b><span id="stage-label">1 / 4 · 识别条件</span></div><svg id="diagram" viewBox="0 0 620 350" role="img" aria-label="${esc(m.title)}的几何推演示意图"><title>${esc(m.title)}</title></svg><div class="controls"><button id="play" class="primary" aria-pressed="false">播放推演</button><button id="prev-step" aria-label="上一步推演">上一步</button><button id="next-step" aria-label="下一步推演">下一步</button><button id="reset">重置</button><label>进度<input id="timeline" type="range" min="0" max="3" step="0.01" value="0" aria-label="推演进度"></label></div><div class="legend"><span>实线：已知图形</span><span>青色：辅助构造</span><span>金色：推理重点 / 变换</span></div></section>
      <h3 class="proof-title">推导过程 <small>· 点击步骤同步看图</small></h3><ol class="proof">${m.steps.map((s,i)=>`<li><button data-step="${i}" ${i===0?'aria-current="step"':''}><span class="num">${i+1}</span><span class="step-copy"><span class="step-label">${titles[i]}</span>${esc(s)}</span></button></li>`).join('')}</ol>
      ${m.variants.length?`<section class="variants"><h3 class="proof-title">变式与条件辨析</h3>${m.variants.map(([name,text])=>`<div class="variant"><h4>${esc(name)}</h4><p>${esc(text)}</p></div>`).join('')}<p class="status-note">上方动画演示主图；变式图形可展开下方原资料页对照。</p></section>`:''}
      <section class="lessons"><h3>八年级单元知识关联</h3><p>${m.advanced?'以下是八年级关联基础。相似、圆、锐角三角函数等内容属于后续课程或综合拓展，不能视为当前单元已教结论。':'从下面的实际课程知识点复习，再回到模型完成推导。'}</p><div class="lesson-links">${m.nodes.map(id=>{const n=course(id);if(!n)throw Error('Missing lesson '+id);const c=graph.chapters.find(c=>c.id===n.chapter);return `<a data-course-node="${esc(id)}" href="math-course.html?chapter=${esc(n.chapter)}&node=${esc(id)}">${esc(c.title)} · ${esc(n.title)} →</a>`;}).join('')}</div></section>
      <section class="exercise"><h3>应用题 · 自主练习</h3><p>${esc(m.question)}</p><label for="working">先写出你的思路</label><textarea id="working" placeholder="先找条件，再写辅助线和推理依据……"></textarea><p class="status-note">此处为临时演算区，切换模型后不保留；请自行保存重要作答。</p><details id="solution"><summary>展开参考解答</summary><div class="answer">${esc(m.answer)}</div></details></section>
      <details class="original"><summary>核对原资料 · ${pages}</summary><p>扫描页仅作来源核对。原表条件省略或符号有歧义处，以上方补全后的条件与证明为准。</p><div class="source-images">${m.pages.map(p=>`<a href="geometry-source-${p}.webp" target="_blank" rel="noopener"><img loading="lazy" src="geometry-source-${p}.webp" alt="初中几何模型汇总第${p}页，点击放大"></a>`).join('')}</div></details>
      <nav class="pager" aria-label="切换模型"><button id="previous" ${index===0?'disabled':''}>← 上一个模型</button><button id="following" ${index===data.length-1?'disabled':''}>下一个模型 →</button></nav>`;
    $('play').onclick=()=>{if(playing){stop();return;}if(progress>=3)progress=0;playing=true;lastTime=0;$('play').textContent='暂停推演';$('play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);};
    $('reset').onclick=()=>setProgress(0);$('prev-step').onclick=()=>setProgress(Math.max(0,Math.ceil(progress)-1));$('next-step').onclick=()=>setProgress(Math.min(3,Math.floor(progress)+1));
    $('timeline').oninput=e=>setProgress(Number(e.target.value));
    $('model').querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>setProgress(Number(b.dataset.step)));
    $('previous').onclick=()=>navigate(index-1);$('following').onclick=()=>navigate(index+1);
    draw();
  }
  function navigate(index){$('search').value='';$('group').value='';$('level').value='';filtered=data;select(data[index].id);$('count').textContent=`显示 ${data.length} / ${data.length} 个模型。`;$('model').scrollIntoView({block:'start'});}
  function setProgress(v){stop();progress=v;draw();}
  function tick(time){if(!playing)return;if(lastTime)progress=Math.min(3,progress+(time-lastTime)/2600);lastTime=time;draw();if(progress>=3)stop();else raf=requestAnimationFrame(tick);}
  function draw(){
    const d=current.diagram,points=d.points,all=Object.values(points).map(p=>p.slice());
    for(const c of d.circles||[]){const o=points[c.center];all.push([o[0]-c.radius,o[1]-c.radius],[o[0]+c.radius,o[1]+c.radius]);}
    const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),scale=Math.min(520/Math.max(x1-x0,1),260/Math.max(y1-y0,1));
    const xy=p=>[310+(p[0]-(x0+x1)/2)*scale,175-(p[1]-(y0+y1)/2)*scale];
    const path=names=>names.map((n,i)=>(i?'L':'M')+xy(points[n]).join(',')).join(' ');
    const clamp=v=>Math.max(0,Math.min(1,v)),a=clamp(progress),f=clamp(progress-1),h=clamp(progress-2);
    let out=`<title>${esc(current.title)}：${esc(titles[Math.round(progress)])}</title>`;
    for(const names of paths(d.faces)){out+=`<path d="${path(names)} Z" fill="${out.length%2?'#1d92911c':'#e5b23a22'}" opacity="${f}"/>`;}
    for(const c of d.circles||[]){const o=xy(points[c.center]);out+=`<circle cx="${o[0]}" cy="${o[1]}" r="${c.radius*scale}" fill="none" stroke="#7ba791" stroke-width="1.5" stroke-dasharray="5 5" opacity="${a}"/>`;}
    for(const names of paths(d.base))out+=`<path class="edge" d="${path(names)}"/>`;
    const auxiliaries=paths(d.aux);auxiliaries.forEach((names,i)=>{const v=clamp(a*auxiliaries.length-i);out+=`<path class="aux" d="${path(names)}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:${1-v}" opacity="${v?1:0}"/>`;});
    // A rigid rotation follows an exact circle; reflection is shown as folding about its axis.
    if(d.motion&&progress>=1){const mo=d.motion,t=clamp(progress-1);let pp=mo.from.map(n=>points[n]);if(mo.center){const c=points[mo.center];pp=pp.map(p=>window.GrowingGeometryModels.rot(p,c,mo.angle*t));}else{const u=points[mo.axis[0]],v=points[mo.axis[1]];pp=pp.map(p=>{const q=window.GrowingGeometryModels.foot(p,u,v),factor=Math.cos(Math.PI*t);return[q[0]+(p[0]-q[0])*factor,q[1]+(p[1]-q[1])*factor];});}const coords=pp.map(xy);out+=coords.length===1?`<circle class="motion" cx="${coords[0][0]}" cy="${coords[0][1]}" r="6"/>`:`<polygon class="motion" points="${coords.map(p=>p.join(',')).join(' ')}"/>`;}
    for(const names of paths(d.aux||d.base))out+=`<path class="trace" d="${path(names)}" opacity="${h*.85}"/>`;
    const baseNames=new Set([...paths(d.base).flat(),...(d.visible||[])]);
    const labelBoxes=[];
    for(const [name,p] of Object.entries(points)){
      const [x,y]=xy(p),opacity=baseNames.has(name)?1:a;
      const candidates=[[8,-9],[8,20],[-20,-10],[-20,20],[12,-24],[-30,-24]];
      const offset=candidates.find(([dx,dy])=>labelBoxes.every(b=>x+dx+18<b.x||x+dx>b.x+b.w||y+dy<b.y-18||y+dy-18>b.y))||candidates[0];
      const tx=x+offset[0],ty=y+offset[1];if(opacity>0)labelBoxes.push({x:tx,y:ty,w:Math.max(18,name.length*11)});
      out+=`<g opacity="${opacity}"><circle class="point" cx="${x}" cy="${y}" r="3"/><text x="${tx}" y="${ty}">${esc(name)}</text></g>`;
    }
    $('diagram').innerHTML=out;$('timeline').value=progress;$('stage-label').textContent=`${Math.round(progress)+1} / 4 · ${titles[Math.round(progress)]}`;
    $('model').querySelectorAll('[data-step]').forEach(b=>{if(Number(b.dataset.step)===Math.round(progress))b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    $('prev-step').disabled=progress<=0;$('next-step').disabled=progress>=3;
  }
  $('model-list').onclick=e=>{const a=e.target.closest('[data-model]');if(!a)return;e.preventDefault();select(Number(a.dataset.model));if(innerWidth<850)$('model').scrollIntoView({block:'start'});};
  $('search').oninput=filter;$('group').onchange=filter;$('level').onchange=filter;
  $('random').onclick=()=>{if(filtered.length)select(filtered[Math.floor(Math.random()*filtered.length)].id);};
  window.addEventListener('hashchange',()=>{const id=Number(location.hash.replace('#model-',''));if(data.some(m=>m.id===id)){ $('search').value='';$('group').value='';$('level').value='';filtered=data;select(id,false);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('beforeprint',()=>{stop();progress=3;draw();});
  if(!graph)throw Error('数学课程数据加载失败');
  const initial=Number(location.hash.replace('#model-',''));filter();if(data.some(m=>m.id===initial))select(initial,false);
})();
