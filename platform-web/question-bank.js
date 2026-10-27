(()=>{
  'use strict';
  async function photo(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('请选择 20 MB 以内的 JPG、PNG 或 WebP 照片。');
    const url=URL.createObjectURL(file),image=new Image();
    try{
      image.src=url;await image.decode();
      if(!image.naturalWidth||image.naturalWidth*image.naturalHeight>64000000)throw Error('照片尺寸过大，请裁剪试卷后再选择。');
      const canvas=document.createElement('canvas');let scale=Math.min(1,2000/Math.max(image.naturalWidth,image.naturalHeight));
      for(let attempt=0;attempt<5;attempt++){
        canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
        const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
        for(const quality of [.9,.8,.7,.6]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=500000)return data;}
        scale*=.8;
      }
      throw Error('照片无法压缩，请裁剪后重试。');
    }finally{URL.revokeObjectURL(url);}
  }
  window.GrowingQuestionBank={async mount(root,api,esc,alive,user){
    const math=window.GrowingMathFormat,formatTried=new Set(),formatErrors=new Map();
    const valid=()=>root.isConnected&&alive();let units=[],studentId='',photos=[],requestId=crypto.randomUUID(),busy=false,rows=[],page=1,unit='all',serial=0,studentPage=1,studentQuery='',attempts=null,repeated=false;
    const label=id=>{const u=units.find(u=>u.id===id);return u?`${u.subjectName} · ${u.termName} · ${u.title}`:'待归类';};
    const options=(selected,all=false)=>`${all?'<option value="all">全部单元</option>':''}<option value="" ${selected===''?'selected':''}>待归类</option>${units.map(u=>`<option value="${esc(u.id)}" ${u.id===selected?'selected':''}>${esc(label(u.id))}</option>`).join('')}`;
    const message=(text,error=false)=>{if(valid()){const el=root.querySelector('[data-bank-status]');el.textContent=text;el.classList.toggle('warning',error);}};
    root.innerHTML=`<div class="actions"><button id="question-bank-home">‹ 返回${user.role==='Student'?'学习中心':'看板'}</button></div><h1>拍照题库</h1><p class="muted">拍下试卷，自动提取题目并归入对应单元。照片仅用于识别，题目会转成可编辑文字和标准数学公式。请拍清题干、选项和图形，入库后核对识别疑点。</p><section class="panel" data-students></section><div data-bank-work hidden><section class="panel"><h2>拍照录题</h2><p>最多 4 页，按页码顺序添加；长试卷请分批录入，每批最多 40 题。</p><div class="actions"><label class="button bank-upload">拍一页<input type="file" accept="image/jpeg" capture="environment" data-camera></label><label class="button bank-upload">从相册选择<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-album></label></div><ol class="bank-photos" data-photos></ol><button class="primary" data-import disabled>识别并自动入库</button><p class="muted">照片会发送至视觉识别服务，成功后只保存文字题干和数学公式，不保存照片。AI 无法确定的单元放入“待归类”，模糊内容会标记，参考答案为空时可自行补充。</p></section><p data-bank-status role="status" aria-live="polite"></p><section class="panel"><div class="actions"><h2>单元题库</h2><label>按单元查看<select data-filter></select></label><button data-refresh>刷新题库</button><label><input type="checkbox" data-repeat> 只看做错 2 次及以上</label></div><p data-count></p><p class="muted">较长公式可左右滑动查看。</p><div data-questions></div><div class="actions"><button data-prev>上一页</button><span data-page></span><button data-next>下一页</button></div></section></div>`;
    const work=root.querySelector('[data-bank-work]');
    function setBusy(value){busy=value;root.querySelectorAll('[data-import],[data-camera],[data-album],[data-student],[data-student-search] input,[data-student-search] button,[data-student-prev],[data-student-next],[data-remove]').forEach(e=>{e.disabled=value;});root.querySelector('[data-import]').disabled=value||!photos.length;root.querySelector('[data-import]').textContent=value?'正在识别并录入…':'识别并自动入库';}
    function previews(){root.querySelector('[data-photos]').innerHTML=photos.map((p,i)=>`<li><img src="${esc(p)}" alt="第 ${i+1} 页试卷预览"><span>第 ${i+1} 页</span><button data-remove="${i}" aria-label="移除第 ${i+1} 页">移除</button></li>`).join('');setBusy(false);}
    async function load(){
      if(!studentId)return;const n=++serial,id=studentId;root.querySelector('[data-questions]').textContent='正在读取题库…';
      try{await attempts.load('photo');if(!valid()||n!==serial||id!==studentId)return;let data=await api('/question-bank/questions?'+new URLSearchParams({studentId:id,unitId:unit,page,repeated:repeated?'1':'0'}));if(!valid()||n!==serial||id!==studentId)return;
        let converted=false;
        for(const q of data.rows.filter(q=>q.format==='legacy')){
          const key=id+':'+q.id+':'+q.revision;if(formatTried.has(key))continue;formatTried.add(key);
          root.querySelector('[data-questions]').textContent='正在将旧记录转换为标准数学题面…';
          try{await api('/question-bank/questions/'+q.id+'/format',{method:'POST',body:JSON.stringify({studentId:id,revision:q.revision})});converted=true;formatErrors.delete(q.id);}
          catch(e){formatErrors.set(q.id,e.message);if(!e.status||[401,403,429].includes(e.status)||e.status>=500)break;}
          if(!valid()||n!==serial||id!==studentId)return;
        }
        if(converted){data=await api('/question-bank/questions?'+new URLSearchParams({studentId:id,unitId:unit,page,repeated:repeated?'1':'0'}));if(!valid()||n!==serial||id!==studentId)return;}
        rows=data.rows;root.querySelector('[data-count]').textContent=`共 ${data.total} 题 · ${rows.filter(q=>!q.reviewed).length} 题在本页待核对`;
        root.querySelector('[data-page]').textContent=`第 ${page} / ${Math.max(1,Math.ceil(data.total/20))} 页`;
        root.querySelector('[data-prev]').disabled=page<=1;root.querySelector('[data-next]').disabled=page*20>=data.total;
        root.querySelector('[data-questions]').innerHTML=rows.length?rows.map(q=>`<article class="bank-question"><div class="actions"><strong>${esc(q.number||'未标题号')} · ${esc(label(q.unitId))}</strong><span class="badge">${q.reviewed?'已核对':'待核对'}</span></div><p class="muted">${esc(q.paperTitle)} · ${esc(new Date(q.createdAt).toLocaleDateString('zh-CN'))}</p><div class="bank-text math-prose">${math.html(q.text)}</div>${q.format==='legacy'?`<p class="warning">旧记录尚未转成标准题面：${esc(formatErrors.get(q.id)||'转换待完成')}</p><button data-format="${esc(q.id)}">重试转换标准题面</button>`:''}${q.uncertain.length?(q.reviewed?`<details><summary>AI 原始识别提示（核对前）</summary><p class="bank-text">${esc(q.uncertain.join('\n'))}</p></details>`:`<p class="warning bank-text">${esc(q.uncertain.join('\n'))}</p>`):''}<p class="muted">AI 初次归类依据：${esc(q.reason||'待核对')}</p><p class="muted">来源页码：${q.pages.join('、')} · 文字与公式记录</p><details><summary>核对 / 修改题目与单元</summary><form data-edit="${esc(q.id)}"><label>题号<input name="number" maxlength="40" value="${esc(q.number)}"></label><label>题目（含选项与小问）<textarea name="text" maxlength="6000" required rows="6">${esc(q.text)}</textarea></label><p class="math-input-help">公式用 \\(…\\) 包围，例如 \\(x^{2}\\)；分式用 \\(\\frac{a}{b}\\)。下方实时预览题目和答案。</p><div class="actions"><button type="button" data-math-template="fraction">插入分式</button><button type="button" data-math-template="root">插入根式</button><button type="button" data-math-template="power">插入乘方</button></div><label>对应单元<select name="unitId">${options(q.unitId)}</select></label><label>参考答案（没有可留空）<textarea name="answer" maxlength="2000" rows="3">${esc(q.answer)}</textarea></label><div class="math-preview math-prose" data-edit-preview>${math.html(q.text)}${q.answer?'<hr>'+math.html(q.answer):''}</div><button type="submit" class="primary">保存并标记已核对</button><p role="status" data-save-status></p></form></details>${q.answer?`<details><summary>查看参考答案</summary><div class="bank-text math-prose">${math.html(q.answer)}</div></details>`:''}${attempts.markup('photo',q.id)}</article>`).join(''):'<p class="muted">该单元还没有录入题目。拍一张试卷开始吧。</p>';
      }catch(e){if(valid()&&n===serial){root.querySelector('[data-questions]').textContent='读取失败：'+e.message;root.querySelector('[data-prev]').disabled=true;root.querySelector('[data-next]').disabled=true;}}
    }
    async function selectStudent(id){attempts?.dispose();studentId=id;serial++;if(id)attempts=GrowingQuestionAttempts.create(root,api,id,()=>valid()&&studentId===id,()=>load());else attempts=null;page=1;photos=[];requestId=crypto.randomUUID();previews();message('');work.hidden=!id;if(id)await load();}
    async function students(){
      const host=root.querySelector('[data-students]');
      if(user.role==='Student'){host.innerHTML=`<h2>${esc(user.displayName)}的题库</h2>`;await selectStudent(user.id);return;}
      const admin=user.role==='Admin',data=await api(admin?'/admin/members?'+new URLSearchParams({role:'Student',q:studentQuery,page:studentPage}):'/parent/children');if(!valid())return;
      const children=admin?data.rows:data;
      host.innerHTML=`<h2>选择学生</h2>${admin?`<form class="actions" data-student-search><label>搜索学生<input name="q" maxlength="40" value="${esc(studentQuery)}"></label><button type="submit">查询</button></form>`:''}${children.length?`<label>题库所属学生<select data-student>${children.map(c=>`<option value="${esc(c.id)}">${esc(c.displayName)}${admin?'（'+esc(c.username)+'）':''}</option>`).join('')}</select></label>`:'<p>暂无学生，请先在设置中添加孩子。</p>'}${admin?`<div class="actions"><button data-student-prev ${studentPage<=1?'disabled':''}>上一页学生</button><span>第 ${studentPage} 页</span><button data-student-next ${studentPage*data.pageSize>=data.total?'disabled':''}>下一页学生</button></div>`:''}`;
      await selectStudent(children[0]?.id||'');
    }
    root.addEventListener('change',async e=>{
      if(!valid())return;
      if(e.target.matches('[data-student]')){if(!busy)await selectStudent(e.target.value);return;}
      if(e.target.matches('[data-repeat]')){repeated=e.target.checked;page=1;await load();return;}
      if(e.target.matches('[data-filter]')){unit=e.target.value;page=1;await load();return;}
      if(!e.target.matches('[data-camera],[data-album]')||busy)return;
      const files=[...e.target.files];e.target.value='';if(!files.length)return;
      if(files.length+photos.length>4){message('每批最多 4 页，请先录入当前照片或移除多余页面。',true);return;}
      setBusy(true);message('正在准备照片…');const id=studentId;
      try{const added=[];for(const file of files)added.push(await photo(file));if(!valid()||id!==studentId)return;photos.push(...added);requestId=crypto.randomUUID();previews();message('照片已准备好，请确认页序后点击“识别并自动入库”。');}
      catch(error){message(error.message,true);}finally{if(valid())setBusy(false);}
    });
    root.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b||!valid())return;
      try{
        if(b.hasAttribute('data-remove')&&!busy){photos.splice(Number(b.dataset.remove),1);requestId=crypto.randomUUID();previews();}
        if(b.hasAttribute('data-refresh'))await load();
        if(b.hasAttribute('data-prev')||b.hasAttribute('data-next')){page+=b.hasAttribute('data-prev')?-1:1;await load();}
        if(b.hasAttribute('data-student-prev')||b.hasAttribute('data-student-next')){studentPage+=b.hasAttribute('data-student-prev')?-1:1;await students();}
        if(b.dataset.format){const q=rows.find(q=>q.id===b.dataset.format);if(q){formatTried.delete(studentId+':'+q.id+':'+q.revision);await load();}}
        if(b.dataset.mathTemplate){
          const form=b.closest('form'),field=form.elements.namedItem(form.dataset.mathField||'text');
          const templates={fraction:'\\(\\frac{a}{b}\\)',root:'\\(\\sqrt{x}\\)',power:'\\(x^{2}\\)'};
          field.setRangeText(templates[b.dataset.mathTemplate],field.selectionStart,field.selectionEnd,'end');field.focus();field.dispatchEvent(new Event('input',{bubbles:true}));
        }
        if(b.hasAttribute('data-import')&&!busy&&photos.length){setBusy(true);message('正在识别题目并匹配单元，请保持页面打开…');
          try{const result=await api('/question-bank/import',{method:'POST',body:JSON.stringify({studentId,requestId,pages:photos})});if(!valid())return;
            photos=[];requestId=crypto.randomUUID();previews();unit='all';root.querySelector('[data-filter]').value='all';page=1;await load();
            const pending=result.questions.filter(q=>!q.unitId).length;message(`${result.duplicate?'这组照片已录入，未重复添加':'已自动录入 '+result.questions.length+' 题'}${pending?'，其中 '+pending+' 题待归类':''}。请核对标准题面和识别疑点。`);
          }catch(error){message(error.message+' 照片仍保留，可重试。',true);}finally{if(valid())setBusy(false);}
        }
      }catch(error){message(error.message,true);}
    });
    root.addEventListener('focusin',e=>{if(e.target.matches('textarea[name="text"],textarea[name="answer"]'))e.target.form.dataset.mathField=e.target.name;});
    root.addEventListener('input',e=>{if(!e.target.matches('textarea[name="text"],textarea[name="answer"]'))return;const form=e.target.form;form.querySelector('[data-edit-preview]').innerHTML=math.html(form.elements.text.value)+'<hr>'+math.html(form.elements.answer.value);});
    root.addEventListener('submit',async e=>{
      if(!valid())return;
      if(e.target.matches('[data-student-search]')){e.preventDefault();if(busy)return;studentQuery=new FormData(e.target).get('q');studentPage=1;try{await students();}catch(error){message(error.message,true);}return;}
      const form=e.target;if(!form.matches('[data-edit]'))return;e.preventDefault();const q=rows.find(q=>q.id===form.dataset.edit);if(!q)return;const button=form.querySelector('button[type=submit]');button.disabled=true;
      try{const fields=Object.fromEntries(new FormData(form));fields.text=math.normalize(fields.text);fields.answer=math.normalize(fields.answer);await api('/question-bank/questions/'+q.id,{method:'PUT',body:JSON.stringify({...fields,studentId,revision:q.revision})});if(valid()){q.revision++;form.querySelector('[data-save-status]').textContent='已保存';await load();}}
      catch(error){if(valid())form.querySelector('[data-save-status]').textContent=error.message;}finally{button.disabled=false;}
    });
    try{units=await api('/question-bank/catalog');if(!valid())return;root.querySelector('[data-filter]').innerHTML=options('all',true);await students();}catch(error){if(valid())root.querySelector('[data-students]').textContent='题库暂时无法打开：'+error.message;}
  }};
})();
