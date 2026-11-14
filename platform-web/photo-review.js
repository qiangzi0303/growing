/* Per-question review keeps the source, immutable grades and follow-ups together. */
(()=>{
  'use strict';
  const verdicts={correct:'正确',partial:'部分正确',incorrect:'需要订正',unanswered:'未作答',review:'待人工核对'};
  function isWrong(question,grade=question.grades?.filter(g=>g.revision===question.revision).at(-1)){
    if(grade)return grade.revision===question.revision&&(grade.kind==='initial'&&question.paperWrong!=null?!!question.paperWrong:['incorrect','partial'].includes(grade.result?.verdict));
    return !question.grades?.length&&!!question.paperWrong;
  }
  function uuid(){if(crypto.randomUUID)return crypto.randomUUID();return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16));}
  window.GrowingPhotoReview={uuid,isWrong,create(root,api,esc,alive,studentId,onChange,figures){
    const host=root.querySelector('[data-workbench]'),math=window.GrowingMathFormat,papers=new Map();
    let disposed=false,sequence=0,current=null,paper=null,selectedGrade='',busy=false,pageNumber=1,sourceOpen=false,pad=null;
    const sourceId='photo-review-original-'+uuid(),knowledgeId='photo-review-knowledge-'+uuid();
    host.id||='photo-review-workbench-'+uuid();
    const draftKey='growing-photo-review-v1:'+studentId;
    let drafts={},storageBlocked=false,storageError='';try{const local=localStorage.getItem(draftKey),raw=local===null?sessionStorage.getItem(draftKey):local;const value=JSON.parse(raw||'{}');if(!value||typeof value!=='object'||Array.isArray(value)||!Object.values(value).every(d=>d&&typeof d==='object'&&!Array.isArray(d)))throw Error('草稿格式无效');drafts=value;if(local===null&&raw)localStorage.setItem(draftKey,raw);}catch(error){storageBlocked=true;storageError='订正草稿读取或迁移失败，已停止保存以保护原稿：'+error.message;}
    const valid=()=>!disposed&&alive()&&host.isConnected;
    const save=()=>{if(storageBlocked){status(storageError,true);return false;}try{localStorage.setItem(draftKey,JSON.stringify(drafts));return true;}catch{status('照片草稿暂时无法保存到设备，仍保留在当前页面，请勿刷新或关闭。',true);return false;}};
    const draft=()=>drafts[current.id]??=( {prompt:'',correction:'',requests:{}} );
    function request(kind,value){const d=draft();d.requests??={};const key=kind+':'+selectedGrade+':'+current.revision+':'+value;if(!d.requests[key])d.requests[key]=uuid();save();return d.requests[key];}
    const english=()=>(current?.subject||paper?.subject)==='english';
    const plain=s=>`<span style="white-space:pre-wrap">${esc(String(s||'')).replace(/\n/g,'<br>')}</span>`;
    const render=s=>english()?plain(s):math.html(String(s||''));
    const renderQuestion=s=>english()?plain(s):math.questionHtml(s);
    const status=(text,error=false)=>{const el=host.querySelector('[data-review-status]');if(el){el.textContent=text;el.classList.toggle('warning',error);}};
    const grade=()=>current?.grades?.find(g=>g.id===selectedGrade)||current?.grades?.at(-1);
    function revealGrade(message=''){
      const outcome=host.querySelector('.photo-verdict');if(!outcome)return;
      if(message){const saved=document.createElement('p');saved.className='photo-grade-saved';saved.setAttribute('role','status');saved.textContent=message;outcome.after(saved);}
      outcome.tabIndex=-1;outcome.focus({preventScroll:true});outcome.scrollIntoView({block:'start',behavior:'instant'});
    }
    function centerQuestionTab(){
      if(!valid()||host.hidden)return;
      const tabs=host.querySelector('.photo-question-tabs'),active=tabs?.querySelector('[aria-current=page]');
      if(!tabs?.clientWidth||!active)return;
      const rail=tabs.getBoundingClientRect(),button=active.getBoundingClientRect();
      tabs.scrollLeft+=button.left+button.width/2-rail.left-tabs.clientLeft-tabs.clientWidth/2;
    }
    function source(){
      const pages=paper?.pages||[],container=host.querySelector('[data-review-source]');if(!container||!sourceOpen)return;
      const source=pages.find(p=>p.page===pageNumber);
      if(!source){container.innerHTML='<p class="warning">该来源页没有保存原图。请在题目下方“核对 / 补充题图”中补回本页原稿或补传题图，已有题目和批改记录会保留。</p>';return;}
      const regions=(current.regions||[]).filter(r=>r.page===pageNumber);
      container.innerHTML=`<div class="actions">${pages.map(p=>`<button type="button" data-source-page="${p.page}" ${p.page===pageNumber?'aria-current="page"':''}>第 ${p.page} 页</button>`).join('')}</div><p class="muted">${regions.length?'虚线框标出本题与作答区域，请结合整页核对。':'本题没有可靠定位框，请结合来源页码核对。'}</p><div class="photo-paper"><img src="${esc(source.image)}" alt="第${pageNumber}页作业原图">${regions.map(r=>`<span class="photo-region" aria-hidden="true" style="left:${r.x*100}%;top:${r.y*100}%;width:${r.width*100}%;height:${r.height*100}%"></span>`).join('')}</div>`;
    }
    function knowledge(result){
      return `<div class="photo-knowledge"><button type="button" data-review-knowledge aria-expanded="false" aria-controls="${knowledgeId}">关联知识点</button><div id="${knowledgeId}" data-review-knowledge-content hidden><section aria-label="关联知识点">${result.knowledge.length?['gap','tested'].map(role=>{const links=result.knowledge.filter(k=>k.role===role);return links.length?`<h5>${role==='gap'?'错误反映的薄弱点':'本题考查的知识点'}</h5>${links.map(k=>`<p><a href="${esc(k.href)}" data-review-link>${esc(k.title)} →</a></p><div class="bank-text math-prose">${render(k.reason)}</div>`).join('')}`:'';}).join(''):'<p class="muted">尚未可靠关联，待核对题设与现有课程。</p>'}</section>${result.models.length?`<section aria-label="几何模型匹配"><h4>几何模型匹配</h4><p class="muted">先核对适用条件，再学习模型方法。</p>${result.models.map(m=>`<p><a href="${esc(m.href)}" data-review-link>${m.modelId}号 · ${esc(m.title)} →</a></p><div class="bank-text math-prose">${render(m.reason)}</div>`).join('')}</section>`:''}</div></div>`;
    }
    function paint(){
      pad?.dispose();pad=null;
      if(!valid()||!current)return;const g=grade(),result=g?.result,d=draft(),stale=g&&g.revision!==current.revision;
      const inline=[...root.querySelectorAll('[data-review-open]')].some(button=>button.dataset.reviewOpen===current.id);
      host.hidden=false;
      host.innerHTML=`<div class="actions"><h2>逐题批改工作台</h2><button type="button" data-review-close>收起工作台</button></div><p class="muted">${esc(paper.title)} · 首次批改与订正分别保留</p>${paper.warnings?.length?`<p class="warning">${esc(paper.warnings.join('；'))}</p>`:''}<nav class="photo-question-tabs" aria-label="切换题目">${paper.questions.map(q=>{const last=q.grades?.at(-1);return `<button type="button" data-review-question="${esc(q.id)}" ${q.id===current.id?'aria-current="page"':''}>第 ${esc(q.number||'?')} 题 · ${esc(verdicts[last?.result.verdict]||'未批改')}</button>`;}).join('')}</nav><div class="photo-review-grid${sourceOpen?' photo-source-open':''}"><section class="photo-source" id="${sourceId}" ${sourceOpen?'':'hidden'}><h3>原始作业</h3><div data-review-source></div></section><section class="photo-review-result"><div class="photo-question-heading"><h3>第 ${esc(current.number)} 题</h3><button type="button" data-review-original aria-expanded="${sourceOpen}" aria-controls="${sourceId}">${sourceOpen?'收起原题':'查看原题'}</button></div>${inline?'':`<div class="bank-text math-prose">${renderQuestion(current.text)}</div>`}${current.uncertain?.length?`<p class="warning">识别疑点：${esc(current.uncertain.join('；'))}</p>`:''}${g?`${stale?'<p class="warning">题干已修改。下方批改对应旧版本，请提交新作答后再追问。</p>':''}<p class="photo-verdict" data-verdict="${esc(result.verdict)}">${esc(verdicts[result.verdict])}</p>${knowledge(result)}${result.verdict==='correct'?'':`<section class="photo-followups"><h4>围绕这次批改追问</h4><div class="actions">${['这一步为什么错','只提示下一步','换一种讲法'].map(p=>`<button type="button" data-followup-preset="${p}" ${stale?'disabled':''}>${p}</button>`).join('')}</div><div data-followup-history>${(current.followups||[]).filter(f=>f.gradeId===g.id).slice(-1).map(f=>`<article><p><strong>我：</strong>${esc(f.prompt)}</p><div class="bank-text math-prose">${render(f.reply)}</div></article>`).join('')}</div><form data-followup><label>我的追问<textarea name="prompt" maxlength="1600" required ${stale?'disabled':''}>${esc(d.prompt)}</textarea></label><button class="primary" type="submit" ${stale?'disabled':''}>发送追问</button></form></section>`}`:'<p class="muted">该题尚无逐题批改。下方可以上传自己的完整作答照片；原题条件不全时请先核对题面。</p>'}${g?`<div class="photo-grade-history"><label>查看批改记录<select data-review-grade>${current.grades.map((item,i)=>`<option value="${esc(item.id)}" ${item.id===g.id?'selected':''}>${item.kind==='initial'?'首次原稿批改':'订正批改 '+i} · ${esc(verdicts[item.result.verdict])}</option>`).join('')}</select></label></div><div data-graded-answer></div>`:''}<details class="photo-correct-form" ${result?.verdict==='correct'&&!stale?'hidden':''} ${(d.correctionOpen??!g)?'open':''}><summary>订正后再练 · 保留首次批改</summary><form data-correction><div data-correction-pad></div><button type="submit" class="primary">提交本次作答批改</button></form></details><p data-review-status role="status" aria-live="polite"></p></section></div>`;
      if(g)window.GrowingGradedAnswer.mount(host.querySelector('[data-graded-answer]'),g,current,paper,esc,render);
      d.handwriting??={pages:[[]]};
      pad=window.GrowingCorrectionPad.mount(host.querySelector('[data-correction-pad]'),d.handwriting,()=>{d.answerRevision=(d.answerRevision||0)+1;save();},status);
      const wrong=isWrong(current,g);
      host.querySelector('.photo-review-result>.bank-text')?.classList.toggle('question-wrong',wrong);
      host.querySelector('.photo-question-heading>h3').classList.toggle('question-wrong',wrong);
      if(!inline){const images=document.createElement('div');host.querySelector('.photo-review-result>.bank-text').after(images);figures.mount(images,current,{originals:false,minimal:true});}
      source();lock();centerQuestionTab();if(storageError)status(storageError,true);
    }
    function sync(){
      root.querySelectorAll('[data-review-open]').forEach(button=>{
        const expanded=!host.hidden&&button.dataset.reviewOpen===host.dataset.anchorQuestion;
        button.textContent=expanded?'返回':button.dataset.reviewLabel||'此题批改';button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-controls',host.id);button.disabled=busy;
      });
      root.querySelectorAll('[data-review-camera]').forEach(input=>input.disabled=busy);
    }
    function close(){if(!valid()||busy)return;host.hidden=true;sync();}
    function lock(){if(!valid())return;host.querySelectorAll('button,select,textarea').forEach(el=>{el.disabled=storageBlocked||busy||!!(grade()&&grade().revision!==current?.revision&&(el.closest('[data-followup]')||el.hasAttribute('data-followup-preset')));});pad?.lock(storageBlocked||busy);sync();}
    async function loadQuestion(id){
      const n=++sequence;busy=true;lock();status('正在读取本题批改…');
      try{const data=await api('/question-bank/questions/'+id+'/review?'+new URLSearchParams({studentId}));if(!valid()||n!==sequence)return;
        const q=paper.questions.find(q=>q.id===id);Object.assign(q,data.question,{followups:data.followups});current=q;selectedGrade=q.grades.at(-1)?.id||'';pageNumber=q.pages[0]||1;sourceOpen=false;
        const trigger=[...root.querySelectorAll('[data-review-open]')].find(button=>button.dataset.reviewOpen===q.id);
        trigger?.closest('.bank-question,.question')?.after(host);host.dataset.anchorQuestion=q.id;paint();
      }catch(error){if(valid()&&n===sequence)status(error.message,true);}finally{if(valid()&&n===sequence){busy=false;lock();}}
    }
    async function open(q){
      if(busy)return;
      pad?.dispose();pad=null;current=null;
      const trigger=[...root.querySelectorAll('[data-review-open]')].find(button=>button.dataset.reviewOpen===q.id);
      trigger?.closest('.bank-question,.question')?.after(host);host.dataset.anchorQuestion=q.id;
      const n=++sequence;host.hidden=false;host.innerHTML='<p data-review-status role="status">正在打开逐题工作台…</p>';busy=true;sync();
      try{paper=papers.get(q.paperId);if(!paper){paper=await api('/question-bank/papers/'+q.paperId+'?'+new URLSearchParams({studentId}));if(!valid()||n!==sequence)return;papers.set(q.paperId,paper);}await loadQuestion(q.id);}
      catch(error){if(valid())host.innerHTML='<p class="warning" role="status">'+esc(error.message)+'</p>';}finally{if(valid()){busy=false;lock();}}
    }
    async function addPhotos(id,files){
      if(busy||!valid()||current?.id!==id||!pad)throw Error('题目尚未打开，请重新选择答案照片。');
      const form=host.querySelector('.photo-correct-form');form.hidden=false;form.open=true;draft().correctionOpen=true;
      // The pad locks itself while decoding; keep question navigation locked as well.
      busy=true;sync();host.querySelectorAll('button,select,textarea').forEach(el=>el.disabled=true);
      try{await pad.addPhotos(files);status('答案照片已准备，请核对后提交AI批改。');}
      finally{busy=false;lock();}
    }
    async function followup(prompt){
      if(busy||!grade())return;const q=current,g=grade(),n=sequence;draft().prompt=prompt;save();busy=true;lock();status('正在结合本题原稿解释…');
      try{const result=await api('/question-bank/questions/'+q.id+'/followup',{method:'POST',body:JSON.stringify({studentId,gradeId:g.id,requestId:request('followup',prompt),prompt})});if(!valid()||n!==sequence)return;
        q.followups=(q.followups||[]).filter(f=>!(f.gradeId===g.id&&f.prompt===prompt&&f.reply===result.reply));q.followups.push({gradeId:g.id,prompt,reply:result.reply});draft().prompt='';save();paint();status('追问已保存；原评分保持不变。');
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
    host.addEventListener('change',event=>{if(valid()&&event.target.matches('[data-review-grade]')&&!busy){selectedGrade=event.target.value;paint();host.querySelector('[data-review-grade]').focus({preventScroll:true});}});
    host.addEventListener('toggle',event=>{if(valid()&&current&&event.target.matches('.photo-correct-form')){draft().correctionOpen=event.target.open;save();}},true);
    host.addEventListener('click',async event=>{
      if(!valid())return;
      const link=event.target.closest('[data-review-link]');if(link){event.preventDefault();try{openStudy(link.getAttribute('href'));}catch(error){status(error.message,true);}return;}
      const b=event.target.closest('button');if(!b||busy)return;
      if(b.hasAttribute('data-review-close')){close();return;}
      if(b.hasAttribute('data-review-original')){
        sourceOpen=!sourceOpen;host.querySelector('.photo-source').hidden=!sourceOpen;
        host.querySelector('.photo-review-grid').classList.toggle('photo-source-open',sourceOpen);
        b.textContent=sourceOpen?'收起原题':'查看原题';b.setAttribute('aria-expanded',String(sourceOpen));
        if(sourceOpen)source();return;
      }
      if(b.hasAttribute('data-review-knowledge')){
        const content=host.querySelector('[data-review-knowledge-content]');content.hidden=!content.hidden;
        b.setAttribute('aria-expanded',String(!content.hidden));b.textContent=content.hidden?'关联知识点':'收起关联知识点';return;
      }
      if(b.dataset.reviewQuestion)await loadQuestion(b.dataset.reviewQuestion);
      if(b.dataset.sourcePage){pageNumber=Number(b.dataset.sourcePage);source();}
      if(b.dataset.followupPreset)await followup(b.dataset.followupPreset);
    });
    host.addEventListener('submit',async event=>{
      if(!valid())return;
      if(!event.target.matches('[data-followup],[data-correction]'))return;event.preventDefault();if(busy)return;
      if(event.target.matches('[data-followup]')){await followup(new FormData(event.target).get('prompt'));return;}
      let answerPages;try{answerPages=pad.images();if(!save())return;}catch(error){status(error.message,true);return;}
      const q=current,n=sequence;let savedMessage='';busy=true;lock();status('正在批改本次照片订正，首次批改会保留…');
      try{
        if(['english','physics'].includes(current?.subject||paper?.subject)&&q.figures?.length&&!q.hasFigureImage){
          const image=await window.GrowingQuestionFigures.englishFigureImage(q,paper);
          if(!valid()||n!==sequence)return;
          const saved=await api('/question-bank/questions/'+q.id+'/figures',{method:'PUT',body:JSON.stringify({studentId,figureVersion:q.figureVersion,image})});
          if(!valid()||n!==sequence)return;
          Object.assign(q,{hasFigureImage:true,figureVersion:saved.figureVersion,figures:saved.figures||[],hasDrawing:false});
        }
        const result=await api('/question-bank/questions/'+q.id+'/correct',{method:'POST',body:JSON.stringify({studentId,revision:q.revision,requestId:request('handwriting',String(draft().answerRevision||0)),answerPages})});if(!valid()||n!==sequence)return;
        const assessment=result.grade.result;
        savedMessage=`本次照片作答批改已保存：${verdicts[assessment.verdict]}。`;
        if(!q.grades.some(g=>g.id===result.grade.id))q.grades.push(result.grade);selectedGrade=result.grade.id;draft().correction='';draft().handwriting={...draft().handwriting,photos:[],answerMode:'photo'};draft().answerRevision=(draft().answerRevision||0)+1;save();paint();status(savedMessage);revealGrade(savedMessage);
        try{await onChange();}catch(error){if(valid()&&n===sequence)status(savedMessage+' 题库列表刷新失败，请稍后重新打开。',true);}
      }catch(error){if(valid()&&n===sequence)status(savedMessage?savedMessage+' 结果显示失败，请重新打开本题查看。':error.message+' 订正内容保留，可重试。',true);}finally{if(valid()&&n===sequence){busy=false;lock();}}
    });
    const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(centerQuestionTab):null;resizeObserver?.observe(host);
    const observer=new MutationObserver(()=>{if(!host.isConnected)dispose();});observer.observe(document.body,{childList:true,subtree:true});
    function dispose(){if(disposed)return;pad?.dispose();pad=null;disposed=true;sequence++;observer.disconnect();resizeObserver?.disconnect();closeStudy();window.removeEventListener('message',studyMessage);papers.clear();figures.dispose();host.replaceChildren();host.hidden=true;}
    return {open,close,sync,dispose,addPhotos,async refresh(){papers.clear();if(current&&!host.hidden)await open(current);}};
  }};
})();

/* Callers migrating to Vue opt into this adapter; the existing renderer remains an explicit fallback. */
(()=>{
 'use strict';
 const review=window.GrowingPhotoReview;
 review.createLegacy=review.create;
 review.createVue=function(root,api,esc,alive,studentId,onChange=async()=>{},figures={dispose(){}}){
  if(!window.GrowingStudentPhotoReview||!window.GrowingVantHome?.mountStudent)throw Error('新版逐题批改资源尚未加载，请重新打开页面');
  const host=root.querySelector('[data-workbench]')||root.appendChild(window.document.createElement('section'));
  host.dataset.workbench='';host.id||='photo-review-vue-'+review.uuid();let disposed=false;
  const active=()=>{if(disposed||!root.isConnected||!alive())throw Error('学习账号或页面已变更，请重新打开题目');};
  const trigger=q=>q&&[...root.querySelectorAll('[data-review-open]')].find(button=>button.dataset.reviewOpen===q.id);
  const controller=window.GrowingStudentPhotoReview.create({api,studentId,active,onChange,inline:q=>!!trigger(q)});
  const app=window.GrowingVantHome.mountStudent(host,'photo-review',{controller});
  function sync(){if(disposed)return;const m=controller.snapshot();host.hidden=!m.visible;host.dataset.anchorQuestion=m.question?.id||'';for(const button of root.querySelectorAll('[data-review-open]')){const expanded=m.visible&&button.dataset.reviewOpen===m.question?.id;button.textContent=expanded?'×':button.dataset.reviewLabel||'此题批改';button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-controls',host.id);button.setAttribute('aria-label',expanded?'关闭本题批改':button.dataset.reviewLabel||'此题批改');button.disabled=m.busy||m.importing;}for(const input of root.querySelectorAll('[data-review-camera]'))input.disabled=m.busy||m.importing;}
  const unsubscribe=controller.subscribe(sync);sync();
  return {controller,async open(q){active();const card=trigger(q)?.closest('.bank-question,.question');if(card)card.after(host);await controller.open(q);sync();},close(){controller.close();sync();},sync,addPhotos:(id,files)=>controller.addPhotos(id,files),refresh:()=>controller.refresh(),beforeLeave:()=>controller.beforeLeave(),dispose(){if(disposed)return;controller.beforeLeave();controller.dispose();unsubscribe();app.destroy();figures.dispose?.();host.replaceChildren();host.hidden=true;disposed=true;}};
 };
})();
