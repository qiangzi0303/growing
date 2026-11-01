/* Real source pixels remain separate from editable math text. No generated diagrams. */
(()=>{
  'use strict';
  async function photo(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('请选择 20 MB 以内的 JPG、PNG 或 WebP 照片。');
    const url=URL.createObjectURL(file),image=new Image();
    try{
      image.src=url;await image.decode();
      if(!image.naturalWidth||image.naturalWidth*image.naturalHeight>64000000)throw Error('照片尺寸过大，请裁剪后重试。');
      const canvas=document.createElement('canvas');let scale=Math.min(1,2000/Math.max(image.naturalWidth,image.naturalHeight));
      for(let attempt=0;attempt<5;attempt++){
        canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
        for(const quality of [.9,.8,.7,.6]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=500000)return data;}
        scale*=.8;
      }
      throw Error('照片无法压缩，请裁剪后重试。');
    }finally{URL.revokeObjectURL(url);}
  }
  async function crop(src,region){
    const image=new Image();image.src=src;await image.decode();
    if(!region)return src;
    const canvas=document.createElement('canvas'),w=image.naturalWidth,h=image.naturalHeight;
    const x=Math.floor(region.x*w),y=Math.floor(region.y*h);
    canvas.width=Math.max(1,Math.min(w-x,Math.ceil(region.width*w)));canvas.height=Math.max(1,Math.min(h-y,Math.ceil(region.height*h)));
    canvas.getContext('2d').drawImage(image,x,y,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',.94);
  }
  window.GrowingQuestionFigures={photo,create(api,esc,alive,studentId,onChange){
    const papers=new Map();let disposed=false,dialog=null;
    const valid=()=>!disposed&&alive();
    async function paper(id){
      if(!papers.has(id))papers.set(id,api('/question-bank/papers/'+id+'?'+new URLSearchParams({studentId})).catch(e=>{papers.delete(id);throw e;}));
      return papers.get(id);
    }
    function close(){if(dialog){dialog.close();dialog.remove();dialog=null;}}
    function modal(title){
      close();const d=document.createElement('dialog');dialog=d;d.className='question-figure-dialog';d.setAttribute('aria-label',title);
      d.innerHTML=`<div class="actions"><h2>${esc(title)}</h2><button type="button" data-figure-close>关闭</button></div><div data-figure-body></div>`;
      d.querySelector('[data-figure-close]').onclick=close;d.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.append(d);d.showModal();return d;
    }
    async function mount(host,q){
      host.className='question-figures';host.innerHTML='<p class="muted">正在读取题图与原稿…</p>';
      const usable=()=>valid()&&host.isConnected;
      try{
        const p=await paper(q.paperId);if(!usable())return;
        const attachment=q.hasFigureImage?await api('/question-bank/questions/'+q.id+'/figures?'+new URLSearchParams({studentId})):null;
        if(!usable())return;
        const regions=q.figures?.length?q.figures:q.regions||[];
        const pages=p.pages.filter(s=>q.pages.includes(s.page));
        const items=attachment?.image?[{src:attachment.image,label:'本题图形 · 补传原图'}]:regions.length?await Promise.all(regions.map(async r=>{
          const page=pages.find(p=>p.page===r.page);return page?{src:await crop(page.image,r),label:(q.figures?.length?(q.figureVersion>1?'题图':'AI 题图选区（待核对）'):'本题原稿选区（待核对）')+' · 第 '+r.page+' 页'}:null;
        })):pages.map(p=>({src:p.image,label:'来源页原稿 · 第 '+p.page+' 页（可框选本题图形）'}));
        // Model boxes are suggestions. Keep the actual page visible until a person confirms a crop.
        if(!attachment?.image&&!(q.figureVersion>1)&&regions.length)items.push(...pages.map(p=>({src:p.image,label:'含图原页 · 第 '+p.page+' 页（请核对题图完整性）'})));
        if(!usable())return;
        const available=items.filter(Boolean),missing=q.pages.filter(n=>!pages.some(p=>p.page===n));
        host.innerHTML=`${available.map((item,i)=>`<figure><button type="button" class="question-figure-zoom" data-figure-zoom="${i}" aria-label="放大${esc(item.label)}"><img src="${esc(item.src)}" alt="第 ${esc(q.number)} 题 · ${esc(item.label)}" loading="lazy"></button><figcaption>${esc(item.label)} · 点击放大</figcaption></figure>`).join('')}${missing.length&&!attachment?.image?`<p class="warning">第 ${missing.join('、')} 页原稿未保留。题图不能由文字代替，请补回原稿或补传本题图形。</p>`:''}<button type="button" data-figure-edit>核对 / 补充题图</button>`;
        host.querySelector('[data-figure-edit]').onclick=()=>edit(q).catch(e=>{if(usable()){const msg=document.createElement('p');msg.className='warning';msg.textContent=e.message;host.append(msg);}});
        host.querySelectorAll('[data-figure-zoom]').forEach(b=>{b.onclick=()=>{const item=available[Number(b.dataset.figureZoom)],d=modal('第 '+q.number+' 题 · '+item.label),img=document.createElement('img');img.src=item.src;img.alt=item.label;img.style.width='720px';d.querySelector('[data-figure-body]').append(img);};});
      }catch(e){if(usable()){host.textContent='题图读取失败：'+e.message;const retry=document.createElement('button');retry.textContent='重试读取题图';retry.onclick=()=>mount(host,q);host.append(retry);}}
    }
    async function edit(q){
      const [p,state]=await Promise.all([paper(q.paperId),api('/question-bank/questions/'+q.id+'/figures?'+new URLSearchParams({studentId}))]);if(!valid())return;
      const d=modal('第 '+q.number+' 题 · 核对题图'),body=d.querySelector('[data-figure-body]');
      body.innerHTML=`<p>在原稿上拖动框选图形，包含点名和全部标注。多图或跨页可多次添加；也可上传已裁好的真实题图。</p><label>来源页<select data-figure-page>${q.pages.map(n=>`<option value="${n}">第 ${n} 页</option>`).join('')}</select></label><div data-figure-source></div><div class="actions"><button type="button" data-figure-add>添加选框</button><button type="button" data-figure-reset>清空选框</button><button type="button" class="primary" data-figure-save>保存题图选框</button></div><ol data-figure-regions></ol><label class="button bank-upload">补传本题图形<input type="file" accept="image/jpeg,image/png,image/webp" data-figure-upload></label><p class="muted">只补充本题，题号、文字、首次批改及练习次数保留。</p><p role="status" data-figure-status></p>`;
      let selected=null,start=null,regions=[...(state.figures||[])],busy=false;
      const select=body.querySelector('[data-figure-page]'),status=body.querySelector('[data-figure-status]'),source=body.querySelector('[data-figure-source]');
      const active=()=>valid()&&d===dialog&&d.isConnected;
      function lock(value){busy=value;body.querySelectorAll('button,input,select').forEach(e=>{e.disabled=value;});d.querySelector('[data-figure-close]').disabled=value;}
      function list(){body.querySelector('[data-figure-regions]').textContent=regions.length?regions.map((r,i)=>`题图 ${i+1}：第 ${r.page} 页`).join('；'):'尚未添加题图选框';}
      function show(){
        selected=null;const n=Number(select.value),page=p.pages.find(p=>p.page===n);
        if(!page){source.innerHTML='<p class="warning">该页没有保存原图，请选取这一页的原照片补回。</p><label class="button bank-upload">补回本页原稿<input type="file" accept="image/jpeg,image/png,image/webp" data-page-upload></label>';return;}
        source.innerHTML=`<div class="figure-selector"><img src="${esc(page.image)}" alt="第 ${n} 页，拖动框选题图" draggable="false"><span hidden></span></div><p class="muted">可用鼠标或触摸拖动；也可在下方输入百分比坐标。</p><div class="figure-coordinates">${[['x','左边距'],['y','上边距'],['width','宽'],['height','高']].map(([key,label])=>`<label>${label} %<input data-coordinate="${key}" type="number" min="0" max="100" step="0.1" value="${key==='width'||key==='height'?100:0}"></label>`).join('')}</div>`;
        const frame=source.querySelector('.figure-selector'),box=frame.querySelector('span');
        function draw(){if(!selected)return;box.hidden=false;Object.assign(box.style,{left:selected.x*100+'%',top:selected.y*100+'%',width:selected.width*100+'%',height:selected.height*100+'%'});source.querySelectorAll('[data-coordinate]').forEach(e=>{e.value=(selected[e.dataset.coordinate]*100).toFixed(1);});}
        const point=e=>{const r=frame.getBoundingClientRect();return {x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))};};
        frame.onpointerdown=e=>{if(busy)return;e.preventDefault();start=point(e);frame.setPointerCapture(e.pointerId);};
        frame.onpointermove=e=>{if(!start)return;const end=point(e);selected={page:n,x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)};draw();};
        frame.onpointerup=frame.onpointercancel=()=>{start=null;};
        source.querySelectorAll('[data-coordinate]').forEach(e=>{e.oninput=()=>{selected={page:n,...Object.fromEntries([...source.querySelectorAll('[data-coordinate]')].map(e=>[e.dataset.coordinate,Number(e.value)/100]))};box.hidden=false;Object.assign(box.style,{left:selected.x*100+'%',top:selected.y*100+'%',width:selected.width*100+'%',height:selected.height*100+'%'});};});
      }
      async function persist(data){
        lock(true);status.textContent='正在保存题图…';
        try{await api('/question-bank/questions/'+q.id+'/figures',{method:'PUT',body:JSON.stringify({studentId,figureVersion:state.figureVersion,...data})});if(!active())return;papers.clear();close();await onChange();}
        catch(e){if(active())status.textContent=e.message;}
        finally{if(active())lock(false);}
      }
      body.querySelector('[data-figure-add]').onclick=()=>{
        if(!selected||selected.width<.003||selected.height<.003||selected.x+selected.width>1.000001||selected.y+selected.height>1.000001){status.textContent='请框选有效的图形区域，不能超出原稿。';return;}
        if(regions.length>=8){status.textContent='每题最多 8 幅题图。';return;}regions.push({...selected});selected=null;list();status.textContent='选框已添加，点击保存后生效。';
      };
      body.querySelector('[data-figure-reset]').onclick=()=>{regions=[];list();};
      body.querySelector('[data-figure-save]').onclick=()=>{if(!regions.length){status.textContent='请先添加题图选框。';return;}persist({figures:regions});};
      select.onchange=show;
      body.addEventListener('change',async e=>{
        if(!e.target.matches('[data-figure-upload],[data-page-upload]')||busy)return;const file=e.target.files[0];if(!file)return;lock(true);
        try{const image=await photo(file);if(!active())return;
          if(e.target.matches('[data-figure-upload]')){await persist({image});return;}
          status.textContent='正在补回来源页…';await api('/question-bank/papers/'+q.paperId+'/pages',{method:'POST',body:JSON.stringify({studentId,page:Number(select.value),image})});
          if(!active())return;papers.clear();close();await onChange();
        }catch(e){if(active())status.textContent=e.message;}finally{if(active())lock(false);}
      });
      show();list();
    }
    return {mount,clear:()=>papers.clear(),dispose(){disposed=true;papers.clear();close();}};
  }};
})();
