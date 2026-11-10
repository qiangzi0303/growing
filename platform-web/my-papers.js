/* Whole papers share the authenticated photo bank; original handwriting stays on the server. */
(()=>{
  'use strict';
  window.GrowingPapers={async mount(root,api,esc,alive,user,context={}){
    context={...context};
    if(context.subject!==undefined&&!['math','english','physics'].includes(context.subject))throw Error('学科参数无效。');
    let subject=context.subject||'';
    const subjectName=s=>({english:'英语',math:'数学',physics:'物理'}[s]||'全部学科');
    const examNames={midterm:'期中考试',final:'期末考试',unit:'单元测试',other:'其他',unknown:'类型待核对'};
    const classification=p=>({examType:'unknown',unitIds:[],termName:'',warnings:[],confirmed:false,...p.classification});
    function classificationSummary(p){const c=classification(p),catalog=p.units||[],names=c.unitIds.map(id=>catalog.find(u=>u.id===id)?.title||id);return [examNames[c.examType]||examNames.unknown,c.termName,...names,c.examType==='unit'&&!names.length?'单元待核对':'',c.confirmed?'已确认':'待核对'].filter(Boolean).join(' · ');}
    function classificationEditor(){
      const c=classification(paper),units=(paper.units||[]).filter(u=>u.subject===paper.subject),terms=[...new Set(units.map(u=>u.termName).filter(Boolean))];
      if(c.termName&&!terms.includes(c.termName))terms.unshift(c.termName);
      return `<div class="papers-classification"><p data-classification-summary>${esc(classificationSummary(paper))}</p><label>考试类型<select data-exam-type>${Object.entries(examNames).map(([value,label])=>`<option value="${value}" ${value===c.examType?'selected':''}>${label}</option>`).join('')}</select></label><label>册次<select data-paper-term><option value="">待核对</option>${terms.map(t=>`<option ${t===c.termName?'selected':''} value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label><fieldset data-paper-units ${c.examType==='unit'?'':'hidden'}><legend>对应单元（可多选，同一册次）</legend></fieldset>${c.evidence?`<details><summary>识别依据</summary><p>${esc(c.evidence)}</p></details>`:''}${c.warnings.length?`<p class="warning">${c.warnings.map(esc).join('；')}</p>`:''}</div>`;
    }
    function renderUnitChoices(selected=[]){const term=$('[data-paper-term]').value,unitTest=$('[data-exam-type]').value==='unit',host=$('[data-paper-units]');host.hidden=!unitTest;host.innerHTML='<legend>对应单元（可多选，同一册次）</legend>'+(unitTest&&term?(paper.units||[]).filter(u=>u.subject===paper.subject&&u.termName===term).map(u=>`<label><input type="checkbox" data-paper-unit="${esc(u.id)}" ${selected.includes(u.id)?'checked':''}> ${esc(u.title)}</label>`).join(''):'<p>请先核对册次。</p>');}
    let studentId='',paper=null,photos=[],requestId=crypto.randomUUID(),busy=false,sequence=0,disposed=false,studentPage=1,studentQuery='';
    let paperReview=null,paperFigures=null,jobGeneration=0,runningJob=false,onlyWrong=false;
    const closeReview=()=>{paperReview?.dispose();paperReview=null;paperFigures?.dispose();paperFigures=null;};
    const dialogs=new Set(),valid=()=>!disposed&&alive()&&root.isConnected;
    root.className='my-photo-papers';
    root.innerHTML=`<button id="question-bank-home">← 返回上一级</button><header class="papers-heading"><div><p class="muted">数学 · 我的试卷</p><h1>我的试卷</h1></div><button data-new>＋ 拍照试卷</button></header><div data-students></div><p data-status role="status" aria-live="polite"></p><div data-list></div><section data-upload hidden><h2>拍照试卷</h2><p>按顺序添加，最多 4 页。</p><div class="actions"><label class="bank-upload"><span>拍照</span><input data-camera type="file" accept="image/jpeg,image/png,image/webp" capture="environment"></label><label class="bank-upload"><span>相册 / 多页</span><input data-album type="file" accept="image/jpeg,image/png,image/webp" multiple></label></div><ol class="bank-photos" data-photos></ol><button data-import disabled>整理无答案试卷</button></section><section data-paper hidden></section>`;
    const $=s=>root.querySelector(s),message=s=>{$('[data-status]').textContent=s;};
    const jobsHost=document.createElement('section');jobsHost.className='papers-import-jobs';$('[data-list]').before(jobsHost);
    const pause=document.createElement('button');pause.dataset.pauseImport='';pause.textContent='暂存并退出整理';pause.hidden=true;$('[data-status]').after(pause);
    function stopImport(){jobGeneration++;runningJob=false;pause.hidden=true;jobsHost.hidden=false;lock(false);message('进度已保存，可继续整理。');}
    pause.onclick=stopImport;
    function jobCard(job){const action=job.mode==='grade'?'批改':'整理';return `<article class="papers-import-job"><strong>${esc(subjectName(job.subject))} · ${job.status==='failed'?action+'中断':'待继续'+action}</strong><p>已规划 ${job.plannedPages}/${job.pageCount} 页 · 已${action} ${job.recognizedQuestions}/${job.totalQuestions||'?'} 题</p>${job.error?`<details class="papers-import-error"><summary>查看原因</summary><p>${esc(job.error)}</p></details>`:''}<button data-resume="${esc(job.id)}">${job.status==='failed'?'重试'+action:'继续'+action}</button></article>`;}
    async function runJob(initial){
      const student=studentId,selectedSubject=subject,generation=++jobGeneration;
      const current=()=>valid()&&generation===jobGeneration&&student===studentId&&selectedSubject===subject;
      runningJob=true;lock(true);jobsHost.hidden=true;pause.hidden=false;pause.disabled=false;
      // A selection change cancels local progression; a server step already in flight may finish safely.
      root.querySelectorAll('[data-student],[data-subject]').forEach(e=>{e.disabled=false;});
      let job=initial;
      if(job.mode==='grade'){
        pause.hidden=true;
        try{const result=await GrowingGradingProgress.run({api,studentId:student,job,alive:current});if(!current())return;if(result)await open(result.paperId);else{message('批改进度已保存。');await list();}}
        finally{if(current()){runningJob=false;lock(false);jobsHost.hidden=!$('[data-paper]').hidden;}}
        return;
      }
      try{
        while(current()){
          if(job.status==='complete'){runningJob=false;pause.hidden=true;await open(job.paperId);return;}
          jobsHost.innerHTML=jobCard(job);
          message(`正在整理：已规划 ${job.plannedPages}/${job.pageCount} 页，已整理 ${job.recognizedQuestions}/${job.totalQuestions||'?'} 题。`);
          const detail=await api('/question-bank/import-jobs/'+job.id+'?'+new URLSearchParams({studentId:student}));if(!current())return;job=detail;
          if(job.status==='complete')continue;
          const fragments=job.next?.kind==='question'?await GrowingQuestionFigures.importFragments(job.next,detail.sourcePages):undefined;if(!current())return;
          try{job=await api('/question-bank/import-jobs/'+job.id+'/step',{method:'POST',body:JSON.stringify({studentId:student,revision:job.revision,...(fragments?{fragments}:{})})});}
          catch(error){
            if(!current())return;
            if(error.status===429||error.statusCode===429){message('识别服务繁忙，等待后自动继续；也可暂存退出。');await new Promise(resolve=>setTimeout(resolve,Math.min(60000,Math.max(1000,Number(error.retryAfter||5)*1000))));continue;}
            throw error;
          }
          if(current()&&job.status==='failed')throw Error(job.error||'整理失败，请重试。');
        }
      }catch(error){if(current()){jobsHost.innerHTML=jobCard({...job,error:error.message||job.error});message('');}}
      finally{if(current()){runningJob=false;pause.hidden=true;lock(false);if(job.status!=='complete')jobsHost.hidden=false;}}
    }
    const heading=root.querySelector('.papers-heading .muted');
    const updateSubject=()=>{heading.textContent=subjectName(subject)+' · 我的试卷';};
    updateSubject();
    if(!context.subject){const label=document.createElement('label');label.textContent='学科';const select=document.createElement('select');select.dataset.subject='';select.innerHTML='<option value="">全部学科</option><option value="math">数学</option><option value="english">英语</option><option value="physics">物理</option>';label.append(select);$('[data-students]').before(label);}
    const disabledState=new Map();
    function lock(value){busy=value;root.querySelectorAll('button,input,select,textarea').forEach(e=>{if(e.id==='question-bank-home')return;if(value){if(!disabledState.has(e))disabledState.set(e,e.disabled);e.disabled=true;}else if(disabledState.has(e))e.disabled=disabledState.get(e);});if(!value)disabledState.clear();$('[data-import]').disabled=value||!photos.length;}
    function modal(title,kind=''){
      const d=document.createElement('dialog');d.className='papers-modal '+kind;d.setAttribute('aria-label',title);
      d.innerHTML=`<header class="actions"><h2>${esc(title)}</h2><button data-close>关闭</button></header><div data-body></div>`;
      const close=()=>{d.close();d.remove();dialogs.delete(d);};d.querySelector('[data-close]').onclick=close;
      d.addEventListener('cancel',e=>{e.preventDefault();close();});dialogs.add(d);document.body.append(d);d.showModal();return d;
    }
    const observer=new MutationObserver(()=>{if(!root.isConnected||!alive()){closeReview();disposed=true;sequence++;dialogs.forEach(d=>{d.close();d.remove();});dialogs.clear();observer.disconnect();}});
    observer.observe(document.body,{childList:true,subtree:true});
    const sourceResult=q=>q.grades?.filter(g=>g.revision===q.revision).at(-1)?.result;
    const wrong=q=>{if(q.paperWrong!==null&&q.paperWrong!==undefined)return !!q.paperWrong;const r=sourceResult(q);return !!r&&(r.markedWrong||['incorrect','partial'].includes(r.verdict));};
    const filterWrong=q=>{const r=sourceResult(q);return r&&['correct','incorrect','partial'].includes(r.verdict)?['incorrect','partial'].includes(r.verdict):wrong(q);};
    function applyWrongFilter(){
      let count=0;
      for(const q of paper.questions){const card=$('[data-q="'+q.id+'"]');if(!card)continue;card.hidden=onlyWrong&&!filterWrong(q);if(!card.hidden)count++;}
      $('[data-wrong-empty]').hidden=!onlyWrong||count>0;
      const workbench=$('[data-workbench]'),anchor=workbench?.dataset.anchorQuestion;
      if(anchor&&$('[data-q="'+anchor+'"]')?.hidden)paperReview?.close();
    }
    const readable=r=>r&&['correct','incorrect','partial'].includes(r.verdict)&&r.studentAnswer?.trim();
    const prose=s=>GrowingMathFormat.html(s||'');
    function previews(){
      $('[data-photos]').innerHTML=photos.map((src,i)=>`<li><img src="${src}" alt="第 ${i+1} 页"><div class="actions"><button data-rotate="${i}">顺时针旋转第 ${i+1} 页</button><button data-remove="${i}">移除第 ${i+1} 页</button></div></li>`).join('');
      $('[data-import]').disabled=busy||!photos.length;
    }
    async function list(){
      const id=studentId,selectedSubject=subject,seq=++sequence;message('正在读取试卷…');
      const query=new URLSearchParams({studentId:id});if(selectedSubject)query.set('subject',selectedSubject);
      const [rows,jobs]=await Promise.all([api('/question-bank/papers?'+query),api('/question-bank/import-jobs?'+query)]);if(!valid()||id!==studentId||selectedSubject!==subject||seq!==sequence)return;
      jobsHost.innerHTML=jobs.filter(job=>job.status!=='complete').map(jobCard).join('');
      updateSubject();
      jobsHost.hidden=false;
      $('[data-list]').innerHTML=rows.length?`<div class="papers-list">${rows.map(p=>`<button class="papers-card" data-open="${esc(p.id)}"><strong>${esc(p.title)}</strong><span>${p.questionCount} 道题 · ${esc(p.createdAt.slice(0,10))}${p.mode==='paper-draft'?' · 待核对':''}</span><span>${esc(subjectName(p.subject||'math'))} · ${esc(classificationSummary(p))}</span><span>打开试卷 →</span></button>`).join('')}</div>`:'<p class="muted">拍下试卷，整理后保存在这里。</p>';message('');
    }
    async function students(){
      const admin=user.role==='Admin',data=await api(admin?'/admin/members?'+new URLSearchParams({role:'Student',q:studentQuery,page:studentPage}):'/parent/children');if(!valid())return;
      const children=admin?data.rows:data;
      const selected=await window.GrowingLegacy.target(children,user,api,context);if(!valid())return;
      delete context.studentId;
      $('[data-students]').innerHTML=`${admin?`<form class="actions" data-student-search><label>搜索学生<input name="q" maxlength="40" value="${esc(studentQuery)}"></label><button>查询</button></form>`:''}${children.length?`<label>学生<select data-student>${children.map(c=>`<option value="${esc(c.id)}">${esc(c.displayName)}${admin?'（'+esc(c.username)+'）':''}</option>`).join('')}</select></label>`:'<p>暂无学生。</p>'}${admin?`<div class="actions"><button data-student-prev ${studentPage<=1?'disabled':''}>上一页学生</button><span>第 ${studentPage} 页</span><button data-student-next ${studentPage*data.pageSize>=data.total?'disabled':''}>下一页学生</button></div>`:''}`;
      studentId=selected;const select=$('[data-student]');if(select)select.value=selected;paper=null;photos=[];previews();$('[data-paper]').hidden=true;$('[data-list]').hidden=false;
      $('[data-list]').replaceChildren();$('[data-new]').disabled=!studentId;
      if(studentId)await list();
    }
    async function diagram(q,loaded){
      if(loaded.subject==='english'||loaded.subject==='physics'){
        if(q.hasFigureImage){const data=await api('/question-bank/questions/'+q.id+'/figures?'+new URLSearchParams({studentId}));if(!data.image||!/^data:image\/(?:jpeg|png|webp);base64,/.test(data.image))throw Error('已保存的题图缺失，请重新补传。');const image=new Image();image.src=data.image;await image.decode();return `<figure><img style="max-width:100%;height:auto" src="${esc(data.image)}" alt="第 ${esc(q.number)} 题插图"></figure>`;}
        return (await Promise.all((q.figures||[]).map(async region=>{
          const page=loaded.pages.find(p=>p.page===region.page);if(!page)throw Error('题图原稿缺失，请补回后打印。');
          const image=new Image();image.src=page.image;await image.decode();const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(region.width*image.naturalWidth));canvas.height=Math.max(1,Math.round(region.height*image.naturalHeight));
          canvas.getContext('2d').drawImage(image,region.x*image.naturalWidth,region.y*image.naturalHeight,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
          return `<figure><img style="max-width:100%;height:auto" src="${canvas.toDataURL('image/png')}" alt="第 ${esc(q.number)} 题插图"></figure>`;
        }))).join('');
      }
      if(!q.hasDrawing||q.drawingRevision!==q.revision)return '';
      const data=await api('/question-bank/questions/'+q.id+'/figures?'+new URLSearchParams({studentId}));
      return data.drawingRevision===q.revision?GrowingQuestionDrawing.render(data.drawing).map(s=>`<figure>${s}</figure>`).join(''):'';
    }
    async function open(id){
      closeReview();
      const student=studentId,seq=++sequence;message('正在打开试卷…');
      const loaded=await api('/question-bank/papers/'+id+'?'+new URLSearchParams({studentId:student}));
      if(!valid()||student!==studentId||seq!==sequence)return;
      const actualSubject=loaded.subject||'math';
      if(!['math','english','physics'].includes(actualSubject))throw Error('试卷学科无效。');
      const diagrams=await Promise.all(loaded.questions.map(q=>diagram(q,loaded).catch(error=>{
        if(loaded.subject!=='english'&&loaded.subject!=='physics')throw error;
        return `<p class="warning" data-figure-missing>题图未完成：${esc(error.message)}，请核对并补回题图后打印。</p>`;
      })));
      if(!valid()||student!==studentId||seq!==sequence)return;
      paper=loaded;jobsHost.hidden=true;heading.textContent=subjectName(actualSubject)+' · 我的试卷';$('[data-list]').hidden=true;$('[data-upload]').hidden=true;$('[data-paper]').hidden=false;
      const draft=paper.mode==='paper-draft';
      $('[data-paper]').innerHTML=`<div class="papers-toolbar actions"><button data-library>← 试卷列表</button><button data-original>查看原卷</button><label><input type="checkbox" data-clean> 无答案净卷</label><button data-print>打印无答案试卷</button></div><div class="papers-confirm"><label>试卷标题<input data-title maxlength="160" value="${esc(paper.title)}"></label>${classificationEditor()}<p>对照原卷逐题核对题号、公式、选项、题图及单元；AI 转录可能误读，核对完成后再保存。</p><button data-confirm ${draft&&paper.questions.some(q=>!q.reviewed)?'disabled':''}>${draft?'核对完成，保存试卷':'保存分类修改'}</button></div><h2 data-paper-title>${esc(paper.title)}</h2>${paper.warnings.length?`<p class="warning">${paper.warnings.map(esc).join('；')}</p>`:''}<div data-sheet>${paper.questions.map((q,i)=>`<article class="paper-question ${wrong(q)?'paper-wrong':''}" data-q="${esc(q.id)}"><div class="paper-question-body"><div class="math-prose" ${paper.subject==="english"?"style=white-space:pre-wrap":""}><strong>${esc(q.number)}.</strong> ${paper.subject==='english'?esc(q.text).replace(/\n/g,'<br>'):GrowingMathFormat.questionHtml(q.text)}</div><div class="paper-diagrams">${diagrams[i]}</div></div><div class="paper-question-tools"><details><summary>核对 / 修改</summary>${draft?`<button data-review="${esc(q.id)}" ${q.reviewed?'disabled':''}>${q.reviewed?'本题已核对':'对照原卷，本题已核对'}</button>`:''}<button data-edit="${esc(q.id)}">修改题面</button><button data-mark="${esc(q.id)}">${wrong(q)?'取消错题标记':'标记为错题'}</button><button data-edit-figure="${esc(q.id)}">核对 / 补充题图</button>${paper.subject==='math'&&(q.figures?.length||q.hasDrawing)&&!diagrams[i]?`<button data-draw="${esc(q.id)}">补绘题图</button>`:''}</details></div>${q.uncertain?.length?`<p class="paper-uncertain">${q.uncertain.map(esc).join('；')}</p>`:''}</article>`).join('')}</div>`;
      const filter=document.createElement('label');filter.innerHTML='<input type="checkbox" data-only-wrong> 只显示错题（含部分正确）';filter.querySelector('input').checked=onlyWrong;$('[data-print]').before(filter);
      const empty=document.createElement('p');empty.dataset.wrongEmpty='';empty.className='muted';empty.setAttribute('role','status');empty.hidden=true;empty.textContent='暂无错题或部分正确的题目。';$('[data-sheet]').before(empty);
      renderUnitChoices(classification(paper).unitIds);
      paperReview=GrowingPaperAI.mount($('[data-sheet]'),api,esc,valid,studentId,paper,q=>$('[data-q="'+q.id+'"]'));
      applyWrongFilter();
      if(context.paperId===paper.id&&context.questionId){
        const target=[...root.querySelectorAll('[data-q]')].find(card=>card.dataset.q===context.questionId);
        if(target){onlyWrong=false;$('[data-only-wrong]').checked=false;applyWrongFilter();target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView?.({block:'start'});}
        delete context.questionId;
      }
      message('');
    }
    async function print(){
      if(['english','physics'].includes(paper.subject)&&paper.questions.some(q=>{
        const body=root.querySelector('[data-q="'+q.id+'"]');
        return body.querySelector('[data-figure-missing]')||((q.figures?.length||q.hasFigureImage||q.hasDrawing)&&!body.querySelector('.paper-diagrams img'));
      }))throw Error('部分题图缺失或未完成，请先核对并补回题图后再打印。');
      if(paper.subject==='math'&&paper.questions.some(q=>(q.figures?.length||q.hasDrawing)&&!root.querySelector('[data-q="'+q.id+'"] svg')))throw Error('部分题图尚未完成，请先核对并补绘题图后再打印。');
      const frame=document.createElement('iframe');frame.className='papers-print-frame';frame.title='无答案试卷打印';document.body.append(frame);
      const doc=frame.contentDocument;doc.open();doc.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(paper.title)}</title><link rel="stylesheet" href="${new URL('vendor/katex/katex.min.css',location.href).href}"><link rel="stylesheet" href="${new URL('math-format.css',location.href).href}"><style>body{font:16px/1.8 serif;color:#17212b;padding:16px}h1{text-align:center;font-size:24px}.paper-question-body{break-inside:avoid;margin:26px 0;min-height:130px}.paper-diagrams{display:flex;flex-wrap:wrap;gap:16px}.paper-diagrams figure{margin:12px 0;max-width:320px;width:100%}.paper-diagrams svg{width:100%;height:auto}@page{size:A4;margin:16mm}</style></head><body><h1>${esc(paper.title)}</h1>${[...root.querySelectorAll('.paper-question-body')].map(e=>e.outerHTML).join('')}</body></html>`);doc.close();
      try{await Promise.all([...doc.querySelectorAll('link')].map(l=>l.sheet?Promise.resolve():new Promise(resolve=>{l.onload=resolve;l.onerror=resolve;})));await doc.fonts.ready;await Promise.all([...doc.images].map(image=>image.decode()));if(!valid())return;frame.contentWindow.focus();frame.contentWindow.print();}
      finally{setTimeout(()=>frame.remove(),60000);}
    }
    async function edit(q){
      const d=modal('核对第 '+q.number+' 题'),body=d.querySelector('[data-body]');
      body.innerHTML=`<form><label>题号<input name="number" maxlength="40" value="${esc(q.number)}" required></label><label>题干与选项<textarea name="text" maxlength="6000" rows="10" required>${esc(q.text)}</textarea></label><label>对应单元<select name="unitId"><option value="">待核对</option>${(paper.units||[]).filter(u=>u.subject===paper.subject).map(u=>`<option value="${esc(u.id)}" ${u.id===q.unitId?'selected':''}>${esc(u.termName+' · '+u.title)}</option>`).join('')}</select></label><p class="muted">修改题面后旧批改失效，避免将旧错因用于新题。</p><button>保存题面</button><p role="status"></p></form>`;
      body.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=body.querySelector('button');b.disabled=true;try{
        const form=new FormData(e.target);await api('/question-bank/questions/'+q.id,{method:'PUT',body:JSON.stringify({studentId,number:form.get('number'),text:form.get('text'),answer:'',unitId:form.get('unitId'),revision:q.revision})});
        if(!valid())return;d.querySelector('[data-close]').click();await open(paper.id);
      }catch(error){body.querySelector('[role=status]').textContent=error.message;}finally{b.disabled=false;}};
    }
    root.addEventListener('change',async e=>{
      try{
        if(e.target.matches('[data-subject]')&&(!busy||runningJob)){stopImport();closeReview();lock(true);subject=e.target.value;paper=null;photos=[];requestId=crypto.randomUUID();previews();$('[data-paper]').hidden=true;$('[data-upload]').hidden=true;$('[data-list]').hidden=false;await list();return;}
        if(e.target.matches('[data-student]')&&(!busy||runningJob)){stopImport();closeReview();lock(true);studentId=e.target.value;paper=null;photos=[];requestId=crypto.randomUUID();previews();$('[data-paper]').hidden=true;$('[data-upload]').hidden=true;$('[data-list]').hidden=false;await list();return;}
        if(e.target.matches('[data-exam-type],[data-paper-term]')){renderUnitChoices();return;}
        if(e.target.matches('[data-clean]')){if(e.target.checked)paperReview?.close();$('[data-sheet]').classList.toggle('paper-clean',e.target.checked);return;}
        if(e.target.matches('[data-only-wrong]')){onlyWrong=e.target.checked;applyWrongFilter();return;}
        if(!e.target.matches('[data-camera],[data-album]')||busy)return;
        const files=[...e.target.files];e.target.value='';if(!files.length)return;
        if(files.length+photos.length>4)throw Error('最多添加 4 页，请移除多余页面。');
        lock(true);message('正在准备照片…');const added=[];for(const file of files)added.push(await GrowingQuestionFigures.photo(file));
        if(!valid())return;photos.push(...added);requestId=crypto.randomUUID();previews();message('');
      }catch(error){message(error.message);}finally{if(valid())lock(false);}
    });
    root.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b||busy||!valid()||b.id==='question-bank-home')return;
      const actionStudent=studentId;
      try{
        if(b.hasAttribute('data-student-prev')||b.hasAttribute('data-student-next')){lock(true);studentPage+=b.hasAttribute('data-student-prev')?-1:1;await students();return;}
        if(b.hasAttribute('data-new')){if(!subject)throw Error('请先选择学科，再拍照整理试卷。');closeReview();$('[data-upload]').hidden=false;$('[data-list]').hidden=false;$('[data-paper]').hidden=true;return;}
        if(b.hasAttribute('data-remove')){photos.splice(Number(b.dataset.remove),1);requestId=crypto.randomUUID();previews();return;}
        if(b.hasAttribute('data-rotate')){lock(true);const student=studentId,index=Number(b.dataset.rotate),src=photos[index],rotated=await GrowingQuestionFigures.rotatePhoto(src);if(!valid()||student!==studentId||photos[index]!==src)return;photos[index]=rotated;requestId=crypto.randomUUID();previews();return;}
        if(b.hasAttribute('data-library')){closeReview();$('[data-paper]').hidden=true;$('[data-list]').hidden=false;await list();return;}
        lock(true);
        if(b.dataset.resume){const student=studentId,generation=jobGeneration;const job=await api('/question-bank/import-jobs/'+b.dataset.resume+'?'+new URLSearchParams({studentId:student}));if(!valid()||student!==studentId||generation!==jobGeneration)return;await runJob(job);return;}
        if(b.dataset.open)await open(b.dataset.open);
        if(b.hasAttribute('data-import')&&photos.length){message('正在保存照片与整理进度…');const student=studentId,generation=jobGeneration;
          const data=await api('/question-bank/import-jobs',{method:'POST',body:JSON.stringify({studentId:student,requestId,pages:photos,subject:subject||'math'})});
          if(!valid()||student!==studentId||generation!==jobGeneration)return;photos=[];previews();requestId=crypto.randomUUID();jobsHost.innerHTML=jobCard(data);$('[data-upload]').hidden=true;await runJob(data);
        }
        if(b.hasAttribute('data-confirm')){await api('/question-bank/papers/'+paper.id+'/confirm',{method:'POST',body:JSON.stringify({studentId,title:$('[data-title]').value,classification:{examType:$('[data-exam-type]').value,termName:$('[data-paper-term]').value,unitIds:[...root.querySelectorAll('[data-paper-unit]:checked')].map(e=>e.dataset.paperUnit)}})});await open(paper.id);message('试卷已保存。');}
        if(b.hasAttribute('data-original')){const d=modal('原始试卷','papers-original');paper.pages.forEach(p=>{const img=new Image();img.src=p.image;img.alt='第 '+p.page+' 页原卷';d.querySelector('[data-body]').append(img);});}
        if(b.dataset.review){const q=paper.questions.find(q=>q.id===b.dataset.review);await api('/question-bank/questions/'+q.id,{method:'PUT',body:JSON.stringify({studentId,revision:q.revision,figureVersion:q.figureVersion,reviewed:true})});await open(paper.id);}
        if(b.dataset.edit)await edit(paper.questions.find(q=>q.id===b.dataset.edit));
        if(b.dataset.editFigure){const q=paper.questions.find(q=>q.id===b.dataset.editFigure);paperFigures?.dispose();paperFigures=GrowingQuestionFigures.create(api,esc,valid,studentId,()=>open(paper.id));await paperFigures.edit(q);}
        if(b.dataset.mark){const q=paper.questions.find(q=>q.id===b.dataset.mark);await api('/question-bank/questions/'+q.id+'/paper-mark',{method:'POST',body:JSON.stringify({studentId,revision:q.revision,markedWrong:!wrong(q)})});await open(paper.id);}
        if(b.dataset.draw){const q=paper.questions.find(q=>q.id===b.dataset.draw);message('正在补绘题图…');await api('/question-bank/questions/'+q.id+'/drawing',{method:'POST',body:JSON.stringify({studentId,revision:q.revision,figureVersion:q.figureVersion})});await open(paper.id);}
        if(b.hasAttribute('data-print'))await print();
      }catch(error){if(valid()&&actionStudent===studentId)message(error.message);}finally{if(valid()&&actionStudent===studentId&&!runningJob)lock(false);}
    });
    root.addEventListener('submit',async e=>{
      if(!e.target.matches('[data-student-search]'))return;e.preventDefault();if(busy)return;
      studentQuery=new FormData(e.target).get('q');studentPage=1;
      lock(true);try{await students();}catch(error){if(valid())message(error.message);}finally{if(valid())lock(false);}
    });
    if(user.role==='Student'){await window.GrowingLegacy.target([],user,api,context);studentId=user.id;}
    else{await students();if(context.paperId)await open(context.paperId);return;}
    if(context.paperId)await open(context.paperId);else await list();
  }};
})();
