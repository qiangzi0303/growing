/* Whole papers share the authenticated photo bank; original handwriting stays on the server. */
(()=>{
  'use strict';
  window.GrowingPapers={async mount(root,api,esc,alive,user,context={}){
    context={...context};
    let studentId='',paper=null,photos=[],requestId=crypto.randomUUID(),busy=false,sequence=0,disposed=false,studentPage=1,studentQuery='';
    let paperReview=null;
    const closeReview=()=>{paperReview?.dispose();paperReview=null;};
    const dialogs=new Set(),valid=()=>!disposed&&alive()&&root.isConnected;
    root.className='my-photo-papers';
    root.innerHTML=`<button id="question-bank-home">← 返回上一级</button><header class="papers-heading"><div><p class="muted">数学 · 我的试卷</p><h1>我的试卷</h1></div><button data-new>＋ 拍照试卷</button></header><div data-students></div><p data-status role="status" aria-live="polite"></p><div data-list></div><section data-upload hidden><h2>拍照试卷</h2><p>按顺序添加，最多 4 页。</p><div class="actions"><label class="bank-upload"><span>拍照</span><input data-camera type="file" accept="image/jpeg,image/png,image/webp" capture="environment"></label><label class="bank-upload"><span>相册 / 多页</span><input data-album type="file" accept="image/jpeg,image/png,image/webp" multiple></label></div><ol class="bank-photos" data-photos></ol><button data-import disabled>整理无答案试卷</button></section><section data-paper hidden></section>`;
    const $=s=>root.querySelector(s),message=s=>{$('[data-status]').textContent=s;};
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
    const readable=r=>r&&['correct','incorrect','partial'].includes(r.verdict)&&r.studentAnswer?.trim();
    const prose=s=>GrowingMathFormat.html(s||'');
    function previews(){
      $('[data-photos]').innerHTML=photos.map((src,i)=>`<li><img src="${src}" alt="第 ${i+1} 页"><button data-remove="${i}">移除第 ${i+1} 页</button></li>`).join('');
      $('[data-import]').disabled=busy||!photos.length;
    }
    async function list(){
      const id=studentId,seq=++sequence;message('正在读取试卷…');
      const rows=await api('/question-bank/papers?'+new URLSearchParams({studentId:id}));if(!valid()||id!==studentId||seq!==sequence)return;
      $('[data-list]').innerHTML=rows.length?`<div class="papers-list">${rows.map(p=>`<button class="papers-card" data-open="${esc(p.id)}"><strong>${esc(p.title)}</strong><span>${p.questionCount} 道题 · ${esc(p.createdAt.slice(0,10))}${p.mode==='paper-draft'?' · 待核对':''}</span><span>打开试卷 →</span></button>`).join('')}</div>`:'<p class="muted">拍下试卷，整理后保存在这里。</p>';message('');
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
    async function diagram(q){
      if(!q.hasDrawing||q.drawingRevision!==q.revision)return '';
      const data=await api('/question-bank/questions/'+q.id+'/figures?'+new URLSearchParams({studentId}));
      return data.drawingRevision===q.revision?GrowingQuestionDrawing.render(data.drawing).map(s=>`<figure>${s}</figure>`).join(''):'';
    }
    async function open(id){
      closeReview();
      const student=studentId,seq=++sequence;message('正在打开试卷…');
      const loaded=await api('/question-bank/papers/'+id+'?'+new URLSearchParams({studentId:student}));
      const diagrams=await Promise.all(loaded.questions.map(diagram));
      if(!valid()||student!==studentId||seq!==sequence)return;
      paper=loaded;$('[data-list]').hidden=true;$('[data-upload]').hidden=true;$('[data-paper]').hidden=false;
      const draft=paper.mode==='paper-draft';
      $('[data-paper]').innerHTML=`<div class="papers-toolbar actions"><button data-library>← 试卷列表</button><button data-original>查看原卷</button><label><input type="checkbox" data-clean> 无答案净卷</label><button data-print>打印无答案试卷</button></div>${draft?`<div class="papers-confirm"><label>试卷标题<input data-title maxlength="160" value="${esc(paper.title)}"></label><p>对照原卷核对题干、图形及错题标记；有误可逐题修改。</p><button data-confirm>核对完成，保存试卷</button></div>`:''}<h2 data-paper-title>${esc(paper.title)}</h2>${paper.warnings.length?`<p class="warning">${paper.warnings.map(esc).join('；')}</p>`:''}<div data-sheet>${paper.questions.map((q,i)=>`<article class="paper-question ${wrong(q)?'paper-wrong':''}" data-q="${esc(q.id)}"><div class="paper-question-body"><div class="math-prose"><strong>${esc(q.number)}.</strong> ${GrowingMathFormat.questionHtml(q.text)}</div><div class="paper-diagrams">${diagrams[i]}</div></div><div class="paper-question-tools"><details><summary>核对 / 修改</summary><button data-edit="${esc(q.id)}">修改题面</button><button data-mark="${esc(q.id)}">${wrong(q)?'取消错题标记':'标记为错题'}</button>${(q.figures?.length||q.hasDrawing)&&!diagrams[i]?`<button data-draw="${esc(q.id)}">补绘题图</button>`:''}</details></div>${q.uncertain?.length?`<p class="paper-uncertain">${q.uncertain.map(esc).join('；')}</p>`:''}</article>`).join('')}</div>`;
      paperReview=GrowingPaperReview.mount($('[data-sheet]'),api,esc,valid,studentId,paper,q=>$('[data-q="'+q.id+'"]'),saved=>{paper=saved;for(const q of saved.questions){const button=$('[data-mark="'+q.id+'"]');if(button)button.textContent=wrong(q)?'取消错题标记':'标记为错题';}});
      message('');
    }
    async function print(){
      if(paper.questions.some(q=>(q.figures?.length||q.hasDrawing)&&!root.querySelector('[data-q="'+q.id+'"] svg')))throw Error('部分题图尚未完成，请先核对并补绘题图后再打印。');
      const frame=document.createElement('iframe');frame.className='papers-print-frame';frame.title='无答案试卷打印';document.body.append(frame);
      const doc=frame.contentDocument;doc.open();doc.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(paper.title)}</title><link rel="stylesheet" href="${new URL('vendor/katex/katex.min.css',location.href).href}"><link rel="stylesheet" href="${new URL('math-format.css',location.href).href}"><style>body{font:16px/1.8 serif;color:#17212b;padding:16px}h1{text-align:center;font-size:24px}.paper-question-body{break-inside:avoid;margin:26px 0;min-height:130px}.paper-diagrams{display:flex;flex-wrap:wrap;gap:16px}.paper-diagrams figure{margin:12px 0;max-width:320px;width:100%}.paper-diagrams svg{width:100%;height:auto}@page{size:A4;margin:16mm}</style></head><body><h1>${esc(paper.title)}</h1>${[...root.querySelectorAll('.paper-question-body')].map(e=>e.outerHTML).join('')}</body></html>`);doc.close();
      try{await Promise.all([...doc.querySelectorAll('link')].map(l=>l.sheet?Promise.resolve():new Promise(resolve=>{l.onload=resolve;l.onerror=resolve;})));await doc.fonts.ready;if(!valid())return;frame.contentWindow.focus();frame.contentWindow.print();}
      finally{setTimeout(()=>frame.remove(),60000);}
    }
    async function edit(q){
      const d=modal('核对第 '+q.number+' 题'),body=d.querySelector('[data-body]');
      body.innerHTML=`<form><label>题号<input name="number" maxlength="40" value="${esc(q.number)}" required></label><label>题干与选项<textarea name="text" maxlength="6000" rows="10" required>${esc(q.text)}</textarea></label><p class="muted">修改题面后旧批改失效，避免将旧错因用于新题。</p><button>保存题面</button><p role="status"></p></form>`;
      body.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=body.querySelector('button');b.disabled=true;try{
        const form=new FormData(e.target);await api('/question-bank/questions/'+q.id,{method:'PUT',body:JSON.stringify({studentId,number:form.get('number'),text:form.get('text'),answer:'',unitId:q.unitId,revision:q.revision})});
        if(!valid())return;d.querySelector('[data-close]').click();await open(paper.id);
      }catch(error){body.querySelector('[role=status]').textContent=error.message;}finally{b.disabled=false;}};
    }
    root.addEventListener('change',async e=>{
      try{
        if(e.target.matches('[data-student]')&&!busy){closeReview();lock(true);studentId=e.target.value;paper=null;photos=[];previews();$('[data-paper]').hidden=true;$('[data-list]').hidden=false;await list();return;}
        if(e.target.matches('[data-clean]')){if(e.target.checked)paperReview?.close();$('[data-sheet]').classList.toggle('paper-clean',e.target.checked);return;}
        if(!e.target.matches('[data-camera],[data-album]')||busy)return;
        const files=[...e.target.files];e.target.value='';if(!files.length)return;
        if(files.length+photos.length>4)throw Error('最多添加 4 页，请移除多余页面。');
        lock(true);message('正在准备照片…');const added=[];for(const file of files)added.push(await GrowingQuestionFigures.photo(file));
        if(!valid())return;photos.push(...added);requestId=crypto.randomUUID();previews();message('');
      }catch(error){message(error.message);}finally{if(valid())lock(false);}
    });
    root.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b||busy||!valid()||b.id==='question-bank-home')return;
      try{
        if(b.hasAttribute('data-student-prev')||b.hasAttribute('data-student-next')){lock(true);studentPage+=b.hasAttribute('data-student-prev')?-1:1;await students();return;}
        if(b.hasAttribute('data-new')){closeReview();$('[data-upload]').hidden=false;$('[data-list]').hidden=false;$('[data-paper]').hidden=true;return;}
        if(b.hasAttribute('data-remove')){photos.splice(Number(b.dataset.remove),1);requestId=crypto.randomUUID();previews();return;}
        if(b.hasAttribute('data-library')){closeReview();$('[data-paper]').hidden=true;$('[data-list]').hidden=false;await list();return;}
        lock(true);
        if(b.dataset.open)await open(b.dataset.open);
        if(b.hasAttribute('data-import')&&photos.length){message('正在识别题目、整理净卷与手写原稿…');
          const data=await api('/question-bank/import',{method:'POST',body:JSON.stringify({studentId,requestId,pages:photos,mode:'paper'})});
          if(!valid())return;photos=[];previews();requestId=crypto.randomUUID();await open(data.paperId);
        }
        if(b.hasAttribute('data-confirm')){await api('/question-bank/papers/'+paper.id+'/confirm',{method:'POST',body:JSON.stringify({studentId,title:$('[data-title]').value})});await open(paper.id);message('试卷已保存。');}
        if(b.hasAttribute('data-original')){const d=modal('原始试卷','papers-original');paper.pages.forEach(p=>{const img=new Image();img.src=p.image;img.alt='第 '+p.page+' 页原卷';d.querySelector('[data-body]').append(img);});}
        if(b.dataset.edit)await edit(paper.questions.find(q=>q.id===b.dataset.edit));
        if(b.dataset.mark){const q=paper.questions.find(q=>q.id===b.dataset.mark);await api('/question-bank/questions/'+q.id+'/paper-mark',{method:'POST',body:JSON.stringify({studentId,revision:q.revision,markedWrong:!wrong(q)})});await open(paper.id);}
        if(b.dataset.draw){const q=paper.questions.find(q=>q.id===b.dataset.draw);message('正在补绘题图…');await api('/question-bank/questions/'+q.id+'/drawing',{method:'POST',body:JSON.stringify({studentId,revision:q.revision,figureVersion:q.figureVersion})});await open(paper.id);}
        if(b.hasAttribute('data-print'))await print();
      }catch(error){if(valid())message(error.message);}finally{if(valid())lock(false);}
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
