/* Per-question review keeps the source, immutable grades and follow-ups together. */
(()=>{
  'use strict';
  const verdicts={correct:'正确',partial:'部分正确',incorrect:'需要订正',unanswered:'未作答',review:'待人工核对'};
  function uuid(){if(crypto.randomUUID)return crypto.randomUUID();return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16));}
  window.GrowingPhotoReview={uuid,create(root,api,esc,alive,studentId,onChange,figures){
    const host=root.querySelector('[data-workbench]'),math=window.GrowingMathFormat,papers=new Map();
    let disposed=false,sequence=0,current=null,paper=null,selectedGrade='',busy=false,pageNumber=1;
    const draftKey='growing-photo-review-v1:'+studentId;
    let drafts={};try{drafts=JSON.parse(sessionStorage.getItem(draftKey)||'{}');}catch{}
    const valid=()=>!disposed&&alive()&&host.isConnected;
    const save=()=>{try{sessionStorage.setItem(draftKey,JSON.stringify(drafts));}catch{}};
    const draft=()=>drafts[current.id]??=( {prompt:'',correction:'',requests:{}} );
    function request(kind,value){const d=draft();d.requests??={};const key=kind+':'+selectedGrade+':'+current.revision+':'+value;if(!d.requests[key])d.requests[key]=uuid();save();return d.requests[key];}
    const render=s=>math.html(String(s||''));
    const status=(text,error=false)=>{const el=host.querySelector('[data-review-status]');if(el){el.textContent=text;el.classList.toggle('warning',error);}};
    const grade=()=>current?.grades?.find(g=>g.id===selectedGrade)||current?.grades?.at(-1);
    function source(){
      const pages=paper?.pages||[],container=host.querySelector('[data-review-source]');if(!container)return;
      const source=pages.find(p=>p.page===pageNumber);
      if(!source){container.innerHTML='<p class="warning">该来源页没有保存原图。请在题目下方“核对 / 补充题图”中补回本页原稿或补传题图，已有题目和批改记录会保留。</p>';return;}
      const regions=(current.regions||[]).filter(r=>r.page===pageNumber);
      container.innerHTML=`<div class="actions">${pages.map(p=>`<button type="button" data-source-page="${p.page}" ${p.page===pageNumber?'aria-current="page"':''}>第 ${p.page} 页</button>`).join('')}</div><p class="muted">${regions.length?'虚线框标出本题与作答区域，请结合整页核对。':'本题没有可靠定位框，请结合来源页码核对。'}</p><div class="photo-paper"><img src="${esc(source.image)}" alt="第${pageNumber}页作业原图">${regions.map(r=>`<span class="photo-region" aria-hidden="true" style="left:${r.x*100}%;top:${r.y*100}%;width:${r.width*100}%;height:${r.height*100}%"></span>`).join('')}</div>`;
    }
    function paint(){
      if(!valid()||!current)return;const g=grade(),result=g?.result,d=draft(),stale=g&&g.revision!==current.revision;
      host.hidden=false;
      host.innerHTML=`<div class="actions"><h2>逐题批改工作台</h2><button type="button" data-review-close>收起工作台</button></div><p class="muted">${esc(paper.title)} · 单题100分制 · 首次批改与订正分别保留</p>${paper.warnings?.length?`<p class="warning">${esc(paper.warnings.join('；'))}</p>`:''}<nav class="photo-question-tabs" aria-label="切换题目">${paper.questions.map(q=>{const last=q.grades?.at(-1);return `<button type="button" data-review-question="${esc(q.id)}" ${q.id===current.id?'aria-current="page"':''}>第 ${esc(q.number||'?')} 题 · ${esc(verdicts[last?.result.verdict]||'未批改')}</button>`;}).join('')}</nav><div class="photo-review-grid"><section class="photo-source"><h3>原始作业</h3><div data-review-source></div></section><section class="photo-review-result"><h3>第 ${esc(current.number)} 题</h3><div class="bank-text math-prose">${render(current.text)}</div>${current.uncertain?.length?`<p class="warning">识别疑点：${esc(current.uncertain.join('；'))}</p>`:''}${g?`<label>查看批改记录<select data-review-grade>${current.grades.map((item,i)=>`<option value="${esc(item.id)}" ${item.id===g.id?'selected':''}>${item.kind==='initial'?'首次原稿批改':'订正批改 '+i} · ${esc(verdicts[item.result.verdict])}${item.result.score===null?'':' · '+item.result.score+'/100'}</option>`).join('')}</select></label>${stale?'<p class="warning">题干已修改。下方批改对应旧版本，请提交新作答后再追问。</p>':''}<p class="photo-verdict" data-verdict="${esc(result.verdict)}">${esc(verdicts[result.verdict])}${result.score===null?'':' · '+result.score+' / 100'}</p><h4>${g.kind==='initial'?'原图学生作答':'本次订正作答'}</h4><div class="bank-text math-prose">${render(result.studentAnswer||'未识别到作答')}</div><div class="bank-text math-prose">${render(result.feedback)}</div>${result.corrections.map(c=>`<article class="photo-correction"><strong>${esc(c.location)}</strong><div class="bank-text math-prose">${render(c.issue)}</div><p><strong>怎样改</strong></p><div class="bank-text math-prose">${render(c.correction)}</div></article>`).join('')}<section aria-label="关联知识点"><h4>关联知识点</h4>${result.knowledge.length?['gap','tested'].map(role=>{const links=result.knowledge.filter(k=>k.role===role);return links.length?`<h5>${role==='gap'?'错误反映的薄弱点':'本题考查的知识点'}</h5>${links.map(k=>`<p><a href="${esc(k.href)}" data-review-link>${esc(k.title)} →</a></p><div class="bank-text math-prose">${render(k.reason)}</div>`).join('')}`:'';}).join(''):'<p class="muted">尚未可靠关联，待核对题设与现有课程。</p>'}</section>${result.models.length?`<section aria-label="几何模型匹配"><h4>几何模型匹配</h4><p class="muted">先核对适用条件，再学习模型方法。</p>${result.models.map(m=>`<p><a href="${esc(m.href)}" data-review-link>${m.modelId}号 · ${esc(m.title)} →</a></p><div class="bank-text math-prose">${render(m.reason)}</div>`).join('')}</section>`:''}<section class="photo-followups"><h4>围绕这次批改追问</h4><div class="actions">${['这一步为什么错','只提示下一步','换一种讲法'].map(p=>`<button type="button" data-followup-preset="${p}" ${stale?'disabled':''}>${p}</button>`).join('')}</div><div data-followup-history>${(current.followups||[]).filter(f=>f.gradeId===g.id).map(f=>`<article><p><strong>我：</strong>${esc(f.prompt)}</p><div class="bank-text math-prose">${render(f.reply)}</div></article>`).join('')}</div><form data-followup><label>我的追问<textarea name="prompt" maxlength="1600" required ${stale?'disabled':''}>${esc(d.prompt)}</textarea></label><button class="primary" type="submit" ${stale?'disabled':''}>发送追问</button></form></section>`:'<p class="muted">该题尚无逐题批改。下方可以填写自己的完整作答；原题条件不全时请先核对题面。</p>'}<details class="photo-correct-form" ${!g?'open':''}><summary>订正后再练 · 保留首次批改</summary><form data-correction><label>写出新的完整解题过程<textarea name="studentAnswer" maxlength="6000" required rows="5">${esc(d.correction)}</textarea></label><button type="submit" class="primary">提交本次作答批改</button></form></details><p data-review-status role="status" aria-live="polite"></p></section></div>`;
      const images=document.createElement('div');host.querySelector('.photo-review-result>.bank-text').after(images);figures.mount(images,current);source();lock();
    }
    function lock(){if(!valid())return;host.querySelectorAll('button,select,textarea').forEach(el=>{el.disabled=busy||!!(grade()&&grade().revision!==current?.revision&&(el.closest('[data-followup]')||el.hasAttribute('data-followup-preset')));});}
    async function loadQuestion(id){
      const n=++sequence;busy=true;lock();status('正在读取本题批改…');
      try{const data=await api('/question-bank/questions/'+id+'/review?'+new URLSearchParams({studentId}));if(!valid()||n!==sequence)return;
        const q=paper.questions.find(q=>q.id===id);Object.assign(q,data.question,{followups:data.followups});current=q;selectedGrade=q.grades.at(-1)?.id||'';pageNumber=q.pages[0]||1;paint();
      }catch(error){if(valid()&&n===sequence)status(error.message,true);}finally{if(valid()&&n===sequence){busy=false;lock();}}
    }
    async function open(q){
      const n=++sequence;host.hidden=false;host.innerHTML='<p data-review-status role="status">正在打开逐题工作台…</p>';busy=true;
      try{paper=papers.get(q.paperId);if(!paper){paper=await api('/question-bank/papers/'+q.paperId+'?'+new URLSearchParams({studentId}));if(!valid()||n!==sequence)return;papers.set(q.paperId,paper);}await loadQuestion(q.id);if(valid())host.scrollIntoView({block:'start',behavior:'smooth'});}
      catch(error){if(valid())host.innerHTML='<p class="warning" role="status">'+esc(error.message)+'</p>';}finally{if(valid()){busy=false;lock();}}
    }
    async function followup(prompt){
      if(busy||!grade())return;const q=current,g=grade(),n=sequence;draft().prompt=prompt;save();busy=true;lock();status('正在结合本题原稿解释…');
      try{const result=await api('/question-bank/questions/'+q.id+'/followup',{method:'POST',body:JSON.stringify({studentId,gradeId:g.id,requestId:request('followup',prompt),prompt})});if(!valid()||n!==sequence)return;
        q.followups??=[];if(!q.followups.some(f=>f.gradeId===g.id&&f.prompt===prompt&&f.reply===result.reply))q.followups.push({gradeId:g.id,prompt,reply:result.reply});draft().prompt='';save();paint();status('追问已保存；原评分保持不变。');
      }catch(error){if(valid()&&n===sequence)status(error.message+' 追问内容保留，可重试。',true);}finally{if(valid()&&n===sequence){busy=false;lock();}}
    }
    let study=null;
    function closeStudy(){if(study){study.close();study.remove();study=null;}}
    function studyMessage(event){if(event.origin===location.origin&&event.source===study?.querySelector('iframe')?.contentWindow&&event.data?.type==='photo-study:back')closeStudy();}
    window.addEventListener('message',studyMessage);
    function openStudy(href){
      if(!/^(app-design|word-ops-unit3)\/[a-zA-Z0-9_.-]+\.html(?:[?#].*)?$/.test(href))throw Error('复习链接无效，请刷新本题。');
      const url=new URL(window.GrowingNative?'../'+href:'/learn/'+href,location.href);if(url.origin!==location.origin)throw Error('复习链接无效。');
      closeStudy();study=document.createElement('dialog');study.className='photo-study';study.setAttribute('aria-label','知识点与模型复习');
      const close=document.createElement('button');close.type='button';close.textContent='← 返回当前题目';close.addEventListener('click',closeStudy);
      const frame=document.createElement('iframe');frame.title='关联课程复习';frame.setAttribute('data-photo-study-frame','');frame.src=url.href;study.append(close,frame);root.append(study);study.showModal();
      study.addEventListener('cancel',event=>{event.preventDefault();closeStudy();});
    }
    host.addEventListener('input',event=>{if(!valid()||!current)return;if(event.target.name==='prompt')draft().prompt=event.target.value;if(event.target.name==='studentAnswer')draft().correction=event.target.value;save();});
    host.addEventListener('change',event=>{if(valid()&&event.target.matches('[data-review-grade]')&&!busy){selectedGrade=event.target.value;paint();}});
    host.addEventListener('click',async event=>{
      if(!valid())return;
      const link=event.target.closest('[data-review-link]');if(link){event.preventDefault();try{openStudy(link.getAttribute('href'));}catch(error){status(error.message,true);}return;}
      const b=event.target.closest('button');if(!b||busy)return;
      if(b.hasAttribute('data-review-close')){host.hidden=true;return;}
      if(b.dataset.reviewQuestion)await loadQuestion(b.dataset.reviewQuestion);
      if(b.dataset.sourcePage){pageNumber=Number(b.dataset.sourcePage);source();}
      if(b.dataset.followupPreset)await followup(b.dataset.followupPreset);
    });
    host.addEventListener('submit',async event=>{
      if(!valid())return;
      if(!event.target.matches('[data-followup],[data-correction]'))return;event.preventDefault();if(busy)return;
      if(event.target.matches('[data-followup]')){await followup(new FormData(event.target).get('prompt'));return;}
      const studentAnswer=new FormData(event.target).get('studentAnswer'),q=current,n=sequence;busy=true;lock();status('正在批改本次订正，首次批改会保留…');
      try{const result=await api('/question-bank/questions/'+q.id+'/correct',{method:'POST',body:JSON.stringify({studentId,revision:q.revision,requestId:request('correction',studentAnswer),studentAnswer})});if(!valid()||n!==sequence)return;
        if(!q.grades.some(g=>g.id===result.grade.id))q.grades.push(result.grade);selectedGrade=result.grade.id;draft().correction='';save();paint();status('本次作答批改已保存；首次评分仍可查看。');await onChange();
      }catch(error){if(valid()&&n===sequence)status(error.message+' 订正内容保留，可重试。',true);}finally{if(valid()&&n===sequence){busy=false;lock();}}
    });
    const observer=new MutationObserver(()=>{if(!host.isConnected)dispose();});observer.observe(document.body,{childList:true,subtree:true});
    function dispose(){if(disposed)return;disposed=true;sequence++;observer.disconnect();closeStudy();window.removeEventListener('message',studyMessage);papers.clear();figures.dispose();host.replaceChildren();host.hidden=true;}
    return {open,dispose,async refresh(){papers.clear();if(current&&!host.hidden)await open(current);}};
  }};
})();
