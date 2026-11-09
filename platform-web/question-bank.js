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
  window.GrowingQuestionBank={async mount(root,api,esc,alive,user,context={}){
    context={...context};
    const math=window.GrowingMathFormat,formatTried=new Set(),formatErrors=new Map();
    const newId=()=>GrowingPhotoReview.uuid();
    const valid=()=>root.isConnected&&alive();let units=[],studentId='',photos=[],requestId=newId(),busy=false,rows=[],page=1,unit='',serial=0,studentPage=1,studentQuery='',review=null,figures=null,gradingJob=null;
    const message=(text,error=false)=>{if(valid()){const el=root.querySelector('[data-bank-status]');el.textContent=text;el.classList.toggle('warning',error);}};
    root.classList.add('question-bank-minimal');
    root.innerHTML=`<div class="actions"><button id="question-bank-home">‹ 返回${user.role==='Student'?'学习中心':'看板'}</button></div><h1>拍照题库</h1><section class="panel" data-students></section><div data-bank-work hidden><section class="panel bank-upload-panel" aria-label="拍照批改"><div class="actions"><label class="button bank-upload">拍照<input type="file" accept="image/jpeg" capture="environment" data-camera></label><label class="button bank-upload">从相册选择<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-album></label><button class="primary" data-import disabled>整页逐题批改</button></div><ol class="bank-photos" data-photos></ol></section><p data-bank-status role="status" aria-live="polite"></p><section class="bank-unit-questions" aria-label="本单元题目"><div data-questions></div><div class="actions bank-pagination" data-pagination hidden><button data-prev>上一页</button><span data-page></span><button data-next>下一页</button></div></section></div>`;
    const work=root.querySelector('[data-bank-work]');
    if(context.wrongOnly){
      root.querySelector('#question-bank-home').parentElement.hidden=true;
      root.querySelector('h1').remove();
      root.querySelector('.bank-upload-panel').hidden=true;
    }
    root.querySelector('[data-bank-status]').insertAdjacentHTML('afterend','<section class="panel photo-workbench" data-workbench hidden></section>');
    function setBusy(value){busy=value;root.querySelectorAll('[data-import],[data-camera],[data-album],[data-student],[data-student-search] input,[data-student-search] button,[data-student-prev],[data-student-next],[data-remove]').forEach(e=>{e.disabled=value;});root.querySelector('[data-import]').disabled=value||!photos.length;root.querySelector('[data-import]').textContent=value?'正在批改…':gradingJob?'继续批改':'整页逐题批改';}
    function previews(){root.querySelector('[data-photos]').innerHTML=photos.map((p,i)=>`<li><img src="${esc(p)}" alt="第 ${i+1} 页试卷预览"><span>第 ${i+1} 页</span><button data-remove="${i}" aria-label="移除第 ${i+1} 页">移除</button></li>`).join('');setBusy(false);}
    async function load(){
      if(!studentId)return;const n=++serial,id=studentId;
      const questions=root.querySelector('[data-questions]'),workbench=root.querySelector('[data-workbench]'),reviewOpen=!workbench.hidden;
      // Keep the shared workbench connected when the question list is replaced.
      if(questions.contains(workbench))questions.before(workbench);
      workbench.hidden=true;questions.textContent='正在读取题库…';
      if(!unit){root.querySelector('[data-questions]').textContent='请从单元课堂打开题库。';root.querySelector('[data-pagination]').hidden=true;return;}
      const query=()=>new URLSearchParams({studentId:id,unitId:unit,page,...(context.wrongOnly?{wrong:'1'}:{}),...(context.repeated?{repeated:'1'}:{})});
      try{let data=await api('/question-bank/questions?'+query());if(!valid()||n!==serial||id!==studentId)return;
        let converted=false;
        for(const q of data.rows.filter(q=>q.format==='legacy')){
          const key=id+':'+q.id+':'+q.revision;if(formatTried.has(key))continue;formatTried.add(key);
          root.querySelector('[data-questions]').textContent='正在将旧记录转换为标准数学题面…';
          try{await api('/question-bank/questions/'+q.id+'/format',{method:'POST',body:JSON.stringify({studentId:id,revision:q.revision})});converted=true;formatErrors.delete(q.id);}
          catch(e){formatErrors.set(q.id,e.message);if(!e.status||[401,403,429].includes(e.status)||e.status>=500)break;}
          if(!valid()||n!==serial||id!==studentId)return;
        }
        if(converted){data=await api('/question-bank/questions?'+query());if(!valid()||n!==serial||id!==studentId)return;}
        rows=data.rows;root.querySelector('[data-pagination]').hidden=data.total<=20;
        root.querySelector('[data-page]').textContent=`第 ${page} / ${Math.max(1,Math.ceil(data.total/20))} 页`;
        root.querySelector('[data-prev]').disabled=page<=1;root.querySelector('[data-next]').disabled=page*20>=data.total;
        root.querySelector('[data-questions]').innerHTML=rows.length?rows.map(q=>`<article class="bank-question" aria-label="第 ${esc(q.number||'?')} 题"><div class="bank-question-statement"><div class="bank-text math-prose"><span class="bank-question-number">${esc(q.number||'?')}. </span>${math.questionHtml(q.text)}</div><button type="button" data-review-open="${esc(q.id)}" aria-expanded="false">此题批改</button></div>${q.format==='legacy'?`<p class="warning" role="status">题面转换失败。</p><button data-format="${esc(q.id)}">重试</button>`:''}</article>`).join(''):'<p class="muted">本单元暂无题目。</p>';
        root.querySelectorAll('.bank-question').forEach((card,i)=>{
          const q=rows[i],images=document.createElement('div');
          card.querySelector('.bank-text').classList.toggle('question-wrong',GrowingPhotoReview.isWrong(q));
          card.querySelector('.bank-question-statement').after(images);figures.mount(images,q,{originals:false,minimal:true});
          card.querySelector('[data-review-open]').insertAdjacentHTML('beforebegin',`<label class="button bank-upload">拍照答案<input type="file" accept="image/*" capture="environment" data-review-camera="${esc(q.id)}" aria-label="第${esc(q.number)}题拍照答案"></label>`);
        });
        const anchor=[...questions.querySelectorAll('[data-review-open]')].find(button=>button.dataset.reviewOpen===workbench.dataset.anchorQuestion);
        if(anchor){anchor.closest('.bank-question').after(workbench);workbench.hidden=!reviewOpen;}
        review?.sync();
      }catch(e){if(valid()&&n===serial){root.querySelector('[data-questions]').textContent='读取失败：'+e.message;root.querySelector('[data-prev]').disabled=true;root.querySelector('[data-next]').disabled=true;}}
    }
    async function selectStudent(id){
      review?.dispose();figures?.dispose();studentId=id;serial++;rows=[];unit='';
      let recent='';try{recent=localStorage.getItem('growing-photo-unit-v1:'+id)||'';}catch{}
      const requested=context.unitId||new URLSearchParams(location.search).get('unit')||recent;
      if(units.some(u=>u.id===requested)||context.wrongOnly&&requested==='all')unit=requested;
      if(unit&&id)try{localStorage.setItem('growing-photo-unit-v1:'+id,unit);}catch{}
      if(id){const active=()=>valid()&&studentId===id;figures=GrowingQuestionFigures.create(api,esc,active,id,async()=>{await load();await review.refresh();});review=GrowingPhotoReview.create(root,api,esc,active,id,()=>load(),figures);}
      page=1;photos=[];gradingJob=null;requestId=newId();previews();message('');work.hidden=!id;if(id)await load();
    }
    async function students(){
      const host=root.querySelector('[data-students]');
      if(user.role==='Student'){host.hidden=true;await window.GrowingLegacy.target([],user,api,context);await selectStudent(user.id);return;}
      const admin=user.role==='Admin',data=await api(admin?'/admin/members?'+new URLSearchParams({role:'Student',q:studentQuery,page:studentPage}):'/parent/children');if(!valid())return;
      const children=admin?data.rows:data;
      const selected=await window.GrowingLegacy.target(children,user,api,context);if(!valid())return;
      delete context.studentId;
      host.innerHTML=`<h2>选择学生</h2>${admin?`<form class="actions" data-student-search><label>搜索学生<input name="q" maxlength="40" value="${esc(studentQuery)}"></label><button type="submit">查询</button></form>`:''}${children.length?`<label>题库所属学生<select data-student>${children.map(c=>`<option value="${esc(c.id)}">${esc(c.displayName)}${admin?'（'+esc(c.username)+'）':''}</option>`).join('')}</select></label>`:'<p>暂无学生，请先在设置中添加孩子。</p>'}${admin?`<div class="actions"><button data-student-prev ${studentPage<=1?'disabled':''}>上一页学生</button><span>第 ${studentPage} 页</span><button data-student-next ${studentPage*data.pageSize>=data.total?'disabled':''}>下一页学生</button></div>`:''}`;
      const select=root.querySelector('[data-student]');if(select)select.value=selected;
      await selectStudent(selected);
    }
    root.addEventListener('change',async e=>{
      if(!valid())return;
      if(e.target.matches('[data-review-camera]')){
        const id=e.target.dataset.reviewCamera,files=[...e.target.files],q=rows.find(q=>q.id===id);e.target.value='';
        if(!q||!files.length||busy)return;
        try{await review.open(q);await review.addPhotos(id,files);}catch(error){message(error.message,true);}return;
      }
      if(e.target.matches('[data-student]')){if(!busy)await selectStudent(e.target.value);return;}
      if(!e.target.matches('[data-camera],[data-album]')||busy)return;
      const files=[...e.target.files];e.target.value='';if(!files.length)return;
      if(files.length+photos.length>4){message('每批最多 4 页，请先录入当前照片或移除多余页面。',true);return;}
      setBusy(true);message('正在准备照片…');const id=studentId;
      try{const added=[];for(const file of files)added.push(await photo(file));if(!valid()||id!==studentId)return;photos.push(...added);gradingJob=null;requestId=newId();previews();message('');}
      catch(error){message(error.message,true);}finally{if(valid())setBusy(false);}
    });
    root.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b||!valid())return;
      try{
        if(b.hasAttribute('data-remove')&&!busy){photos.splice(Number(b.dataset.remove),1);gradingJob=null;requestId=newId();previews();}
        if(b.dataset.paperOpen){const q=rows.find(q=>q.id===b.dataset.paperOpen);if(q)await window.GrowingCloud.openPapers({studentId,paperId:q.paperId});return;}
        if(b.dataset.reviewOpen){const host=root.querySelector('[data-workbench]');if(!host.hidden&&host.dataset.anchorQuestion===b.dataset.reviewOpen){review.close();return;}const q=rows.find(q=>q.id===b.dataset.reviewOpen);if(q)await review.open(q);return;}
        if(b.hasAttribute('data-prev')||b.hasAttribute('data-next')){page+=b.hasAttribute('data-prev')?-1:1;await load();}
        if(b.hasAttribute('data-student-prev')||b.hasAttribute('data-student-next')){studentPage+=b.hasAttribute('data-student-prev')?-1:1;await students();}
        if(b.dataset.format){const q=rows.find(q=>q.id===b.dataset.format);if(q){formatTried.delete(studentId+':'+q.id+':'+q.revision);await load();}}
        if(b.hasAttribute('data-import')&&!busy&&photos.length){setBusy(true);message('正在批改…');
          try{const result=await GrowingGradingProgress.run({api,studentId,job:gradingJob,alive:valid,onJob:job=>{gradingJob=job;},create:()=>api('/question-bank/import-jobs',{method:'POST',body:JSON.stringify({studentId,requestId,pages:photos,subject:context.subject||unit.split('-')[0]||'math',mode:'grade'})})});if(!valid())return;
            if(!result){message('进度已保存，可继续批改，也可在“我的试卷”中恢复。');return;}
            photos=[];gradingJob=null;requestId=newId();previews();page=1;await load();
            message('批改完成。');
            await window.GrowingCloud.openPapers({studentId,paperId:result.paperId});
          }catch(error){message(error.message+' 照片仍保留，可重试。',true);}finally{if(valid())setBusy(false);}
        }
      }catch(error){message(error.message,true);}
    });
    root.addEventListener('submit',async e=>{
      if(!valid())return;
      if(e.target.matches('[data-student-search]')){e.preventDefault();if(busy)return;studentQuery=new FormData(e.target).get('q');studentPage=1;try{await students();}catch(error){message(error.message,true);}return;}
    });
    try{units=await api('/question-bank/catalog');if(!valid())return;await students();}catch(error){if(valid())root.querySelector('[data-students]').textContent='题库暂时无法打开：'+error.message;}
  }};
})();
