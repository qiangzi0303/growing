(() => {
  'use strict';
  const L=window.GrowingPanoramaLayout;
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={untested:'未测',pending:'待复测',screened:'初筛通过',shaky:'不稳',weak:'需补学'};
  function lines(title){
    const rows=[''];let used=0;
    for(const ch of title){const size=/[\x00-\x7f]/.test(ch)?7:13;if(used+size>154){rows.push('');used=0;}rows[rows.length-1]+=ch;used+=size;}
    return rows;
  }
  function create(g){
    let model=null,key='',view=null,stage=null,world=null,controller=null,observer=null,selected=null;
    function destroy(){controller?.abort();observer?.disconnect();controller=null;observer=null;stage=null;world=null;}
    function paint(){if(!world||!view)return;world.setAttribute('transform',`translate(${view.x} ${view.y}) scale(${view.s})`);stage.dataset.scale=view.s;const output=document.getElementById('pan-zoom-value');if(output)output.value=Math.round(view.s*100)+'%';}
    const bounds=()=>({w:stage.clientWidth,h:stage.clientHeight});
    function fit(){if(!stage)return;const {w,h}=bounds(),s=Math.max(.05,Math.min(1,(w-28)/model.width,(h-28)/model.height));view={s,x:(w-model.width*s)/2,y:(h-model.height*s)/2,key};paint();}
    function zoom(s,cx,cy){if(!stage)return;const {w,h}=bounds();cx??=w/2;cy??=h/2;s=Math.min(2.5,Math.max(.05,s));const x=(cx-view.x)/view.s,y=(cy-view.y)/view.s;view={s,x:cx-x*s,y:cy-y*s,key};paint();}
    function center(readable=true,id=selected){if(!stage)return;const n=model.nodes.find(n=>n.id===id);if(!n)return;const {w,h}=bounds(),s=readable?Math.max(.85,view.s):view.s;view={s,x:w/2-(n.x+n.width/2)*s,y:h/2-(n.y+n.height/2)*s,key};paint();}
    function markup({chapter,range,selected:id,states}){
      selected=id;
      const ids=L.visible(g,chapter,range,id),nextKey=range+':'+chapter.id+':'+g.order.filter(id=>ids.has(id)).join(',');
      if(nextKey!==key){key=nextKey;model=L.layout(g,ids);}
      const before=new Set(),after=new Set();
      function walk(id,set,edges,field){for(const e of edges.get(id)){const next=e[field];if(ids.has(next)&&!set.has(next)){set.add(next);walk(next,set,edges,field);}}}
      walk(id,before,g.pre,'from');walk(id,after,g.next,'to');
      const group=n=>{const c=g.data.chapters.find(c=>c.id===g.byId.get(n).chapter);return c?'第'+c.number+'章':'基础先修';};
      const related=n=>n===id||before.has(n)||after.has(n);
      const paths=model.edges.map(e=>{const active=(before.has(e.from)&&(before.has(e.to)||e.to===id))||((after.has(e.from)||e.from===id)&&after.has(e.to));return `<path class="pan-edge ${e.strength} ${active?'on-path':'off-path'}" data-from="${e.from}" data-to="${e.to}" d="${e.path}" marker-end="url(#pan-arrow${active?'-active':''})"><title>${esc(g.byId.get(e.from).title+' → '+g.byId.get(e.to).title+'：'+e.reason)}</title></path>`;}).join('');
      const nodes=model.nodes.map(n=>{const item=g.byId.get(n.id),rows=lines(item.title),state=states[n.id]||'untested',kind=n.id===id?'is-selected':before.has(n.id)?'is-before':after.has(n.id)?'is-after':'is-other';return `<g class="pan-node ${kind}" data-pan-node="${n.id}" data-related="${related(n.id)}" role="button" tabindex="0" aria-pressed="${n.id===id}" aria-label="${esc(item.title+'，'+group(n.id)+'，'+labels[state])}" transform="translate(${n.x} ${n.y})"><title>${esc(item.title+' · '+item.section)}</title><rect width="${n.width}" height="${n.height}" rx="9"/><text class="pan-node-title" text-anchor="middle" x="${n.width/2}">${rows.map((line,i)=>`<tspan x="${n.width/2}" y="${rows.length===1?29:23+i*17}">${esc(line)}</tspan>`).join('')}</text><text class="pan-node-meta" x="${n.width/2}" y="62" text-anchor="middle">${esc(group(n.id)+' · '+labels[state])}</text></g>`;}).join('');
      return `<section class="panel panorama-panel" aria-labelledby="pan-title"><div class="panel-top"><div><p class="eyebrow">从基础走向应用 · 箭头由上向下</p><h2 id="pan-title">${range==='year'?'初二数学 · 全年全景':esc(chapter.title)+' · 章节全景'}</h2></div><label class="small">查看范围 <select id="pan-range"><option value="chapter" ${range==='chapter'?'selected':''}>本章及先修</option><option value="year" ${range==='year'?'selected':''}>全年 11 章</option></select></label></div>
        <p class="pan-summary">${model.nodes.length} 个知识点 · ${model.edges.length} 条关系${range==='chapter'?' · 含跨章先修':''}。点击节点查看复习卡，橙框表示当前选中。</p>
        <div class="pan-controls"><div class="pan-zoom" aria-label="画布缩放"><button type="button" data-pan-action="out" aria-label="缩小">−</button><output id="pan-zoom-value" aria-label="当前缩放">100%</output><button type="button" data-pan-action="in" aria-label="放大">＋</button><button type="button" data-pan-action="fit">适合画布</button><button type="button" data-pan-action="center">定位当前</button></div><form id="pan-search-form" role="search"><label class="sr-only" for="pan-search">搜索知识点</label><input id="pan-search" type="search" placeholder="搜索知识点，如：约分" maxlength="60" list="pan-suggestions"><datalist id="pan-suggestions">${model.nodes.map(n=>`<option value="${esc(g.byId.get(n.id).title)}"></option>`).join('')}</datalist><button type="submit">查找</button></form></div>
        <div class="pan-legend"><span><i class="pan-key current"></i>当前知识点</span><span><i class="pan-key before"></i>先修路径</span><span><i class="pan-key after"></i>后续路径</span><span><i class="line-key"></i>必要先修</span><span><i class="line-key soft"></i>辅助关系</span></div>
        <p class="pan-help" id="pan-help">拖动画布移动；双指或按钮缩放。电脑可用 Ctrl＋滚轮；键盘方向键移动，＋/−缩放，Home看全图。</p>
        <div id="pan-stage" class="pan-stage" tabindex="0" role="region" aria-label="可拖动缩放的全景知识图谱" aria-describedby="pan-help"><svg id="pan-svg" width="100%" height="100%" role="group" aria-label="知识点及先修连线"><defs><pattern id="pan-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dce4ef"/></pattern><marker id="pan-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#9aa9b8"/></marker><marker id="pan-arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#5579a9"/></marker></defs><rect width="100%" height="100%" fill="url(#pan-dots)"/><g id="pan-world">${paths}${nodes}</g></svg></div>
        <div class="pan-selection" aria-live="polite"><span>当前：<strong>${esc(g.byId.get(id).title)}</strong></span><button type="button" data-pan-action="detail">查看复习卡 ↓</button></div><p id="pan-search-note" class="small" role="status"></p>
        <label class="pan-locate small" for="pan-node-select">快速定位<select id="pan-node-select">${model.nodes.map(n=>`<option value="${n.id}" ${n.id===id?'selected':''}>${esc(group(n.id)+' · '+g.byId.get(n.id).title)}</option>`).join('')}</select></label>
        <p class="small">路径颜色表示关联，不表示掌握；诊断标签沿用当前章节的本轮记录，不合并其他章节存档。</p></section>`;
    }
    function mount(onSelect){
      destroy();stage=document.getElementById('pan-stage');world=document.getElementById('pan-world');if(!stage)return;
      controller=new AbortController();const signal=controller.signal,panel=stage.closest('.panorama-panel');
      if(!view||view.key!==key)fit();else paint();
      let size=bounds();observer=new ResizeObserver(()=>{const next=bounds();if(next.w!==size.w||next.h!==size.h){size=next;fit();}});observer.observe(stage);
      const pointers=new Map();let start=null,pinch=null,dragged=false,keyboard=false,pressedNode=null;
      const point=e=>({x:e.clientX-stage.getBoundingClientRect().left,y:e.clientY-stage.getBoundingClientRect().top});
      const pinchData=()=>{const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};};
      stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;keyboard=false;const p=point(e);pointers.set(e.pointerId,p);stage.setPointerCapture(e.pointerId);if(pointers.size===1){start={...p,view:{...view}};dragged=false;pressedNode=e.target.closest('[data-pan-node]')?.dataset.panNode||null;}else if(pointers.size===2){pinch={...pinchData(),view:{...view}};dragged=true;pressedNode=null;}stage.classList.add('is-dragging');},{signal});
      stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=point(e);pointers.set(e.pointerId,p);if(pointers.size>=2&&pinch){const now=pinchData(),s=Math.max(.05,Math.min(2.5,pinch.view.s*now.d/pinch.d));view={s,x:now.x-(pinch.x-pinch.view.x)/pinch.view.s*s,y:now.y-(pinch.y-pinch.view.y)/pinch.view.s*s,key};paint();}else if(start){const dx=p.x-start.x,dy=p.y-start.y;if(Math.hypot(dx,dy)>5)dragged=true;if(dragged){view={...start.view,x:start.view.x+dx,y:start.view.y+dy};paint();}}},{signal});
      const release=e=>{const pick=e.type==='pointerup'&&!dragged&&pointers.size===1?pressedNode:null;pointers.delete(e.pointerId);pinch=null;if(pointers.size===1)start={...[...pointers.values()][0],view:{...view}};else start=null;if(!pointers.size)stage.classList.remove('is-dragging');pressedNode=null;if(pick)onSelect(pick,false,false);};
      stage.addEventListener('pointerup',release,{signal});stage.addEventListener('pointercancel',release,{signal});
      stage.addEventListener('click',e=>{const n=e.target.closest('[data-pan-node]');if(n&&e.detail===0)onSelect(n.dataset.panNode,false,false);},{signal});
      stage.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();const p=point(e);zoom(view.s*Math.exp(-e.deltaY*.008),p.x,p.y);},{signal,passive:false});
      document.addEventListener('keydown',e=>{if(e.key==='Tab')keyboard=true;},{signal});
      stage.addEventListener('focusin',e=>{const n=e.target.closest('[data-pan-node]');if(n&&keyboard)center(true,n.dataset.panNode);},{signal});
      stage.addEventListener('keydown',e=>{const n=e.target.closest('[data-pan-node]');if(n&&['Enter',' '].includes(e.key)){e.preventDefault();onSelect(n.dataset.panNode,false,true);return;}if(e.key==='Home'){e.preventDefault();fit();}else if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(view.s*(e.key==='-'?1/1.25:1.25));}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();view.x+=e.key==='ArrowLeft'?48:e.key==='ArrowRight'?-48:0;view.y+=e.key==='ArrowUp'?48:e.key==='ArrowDown'?-48:0;paint();}},{signal});
      panel.addEventListener('click',e=>{const b=e.target.closest('[data-pan-action]');if(!b)return;const action=b.dataset.panAction;if(action==='in'||action==='out')zoom(view.s*(action==='in'?1.25:1/1.25));else if(action==='fit')fit();else if(action==='center')center();else if(action==='detail')document.getElementById('node-detail').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},{signal});
      panel.querySelector('#pan-node-select').addEventListener('change',e=>onSelect(e.target.value,true,false),{signal});
      panel.querySelector('#pan-search-form').addEventListener('submit',e=>{e.preventDefault();const query=panel.querySelector('#pan-search').value.trim(),exact=model.nodes.filter(n=>g.byId.get(n.id).title===query),found=exact.length?exact:model.nodes.filter(n=>g.byId.get(n.id).title.includes(query));if(query&&found.length===1)onSelect(found[0].id,true,false);else panel.querySelector('#pan-search-note').textContent=!query?'请输入知识点名称。':found.length?'找到多个相关知识点，请在快速定位中选择。':'当前范围没有找到，请尝试切换到全年。';},{signal});
    }
    return {markup,mount,destroy,center,fit};
  }
  window.GrowingPanorama={create};
})();
