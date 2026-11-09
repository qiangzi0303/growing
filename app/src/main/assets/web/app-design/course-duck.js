/* Shared course companion. The parent sends teaching material, never scoring keys. */
(()=>{
  'use strict';
  // A portal owns one companion; its course documents only forward learning events.
  try{
    if(window!==window.top&&window.top.GrowingCloud){
      const owner=window.top,connect=()=>owner.GrowingDuckCourse?.attach(window);
      if(owner.GrowingDuckCourse)connect();
      else{
        let script=owner.document.getElementById('global-course-duck');
        if(!script){script=owner.document.createElement('script');script.id='global-course-duck';script.src=document.currentScript.src;owner.document.head.append(script);}
        script.addEventListener('load',connect,{once:true});
      }
      return;
    }
  }catch{}
  if(document.getElementById('course-duck-host'))return;
  const courseBase=new URL('.',document.currentScript.src),navigation=import(new URL('companion-duck/navigation.js',courseBase)),actions=import(new URL('companion-duck/companion-actions.js',courseBase));
  navigation.catch(()=>{});actions.catch(()=>{});
  let context=window.GrowingDuckContext||null,frame=null,open=false,ready=false,pendingTeach=false,invisible=false,pendingSummary=null,lastSummary=null,summarySequence=0;
  const seenAssessments=new Set();
  const endpoint=new URL('companion-duck/index.html?realtime=1&embed=1',new URL(document.currentScript.src));
  if(['localhost','127.0.0.1'].includes(location.hostname)){endpoint.port='8793';endpoint.pathname='/app-design/companion-duck/index.html';}
  const host=document.createElement('aside');host.id='course-duck-host';host.setAttribute('aria-label','小鸭互动课堂');
  const launch=document.createElement('button');launch.type='button';launch.className='course-duck-launch';launch.setAttribute('aria-label','小鸭，可拖动位置，双击打开语音面板');launch.title='拖动小鸭调整位置，双击和我说话；方向键也可移动';launch.setAttribute('aria-expanded','false');launch.setAttribute('aria-controls','course-duck-panel');
  const portrait=document.createElement('img');portrait.src=new URL('companion-duck/launcher.png',courseBase).href;portrait.alt='';portrait.width=104;portrait.height=120;portrait.draggable=false;launch.append(portrait);
  const panel=document.createElement('section');panel.id='course-duck-panel';panel.className='course-duck-panel';panel.hidden=true;
  const heading=document.createElement('header'),label=document.createElement('strong'),close=document.createElement('button');label.textContent='小鸭老师 · 可以随时提问';close.type='button';close.textContent='关闭';heading.append(label,close);panel.append(heading);host.append(launch,panel);document.body.append(host);
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('course-duck.css',courseBase).href;document.head.append(style);
  const announcement=document.createElement('span');announcement.className='duck-announcement';announcement.setAttribute('role','status');host.append(announcement);
  const summary=document.createElement('section');summary.className='course-duck-summary';summary.hidden=true;summary.setAttribute('aria-label','小鸭评分总结');
  summary.innerHTML='<strong>小鸭总结</strong><button type="button" data-summary-dismiss aria-label="收起小鸭总结">×</button><p data-summary-text></p><p data-summary-status role="status"></p><button type="button" data-summary-play>播放总结</button><button type="button" data-summary-stop>停止播报</button>';host.prepend(summary);
  let courseWindow=window,drag=null,suppressUntil=0,position=null;
  const attached=new WeakSet(),positionKey='growing-duck-position-v1';
  try{const saved=JSON.parse(localStorage.getItem(positionKey));if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))position={x:Math.max(0,Math.min(1,saved.x)),y:Math.max(0,Math.min(1,saved.y))};}catch{}
  function viewport(){return {width:document.documentElement.clientWidth,height:window.visualViewport?.height||window.innerHeight};}
  function place(x,y,save=false){
    const {width,height}=viewport(),rect=launch.getBoundingClientRect(),maxX=Math.max(0,width-rect.width),maxY=Math.max(0,height-rect.height);
    x=Math.max(0,Math.min(maxX,x));y=Math.max(0,Math.min(maxY,y));
    host.style.left=x+'px';host.style.top=y+'px';host.style.right='auto';host.style.bottom='auto';
    position={x:maxX?x/maxX:0,y:maxY?y/maxY:0};
    if(save)try{localStorage.setItem(positionKey,JSON.stringify(position));}catch{}
    layoutOverlays();
  }
  function layoutOverlays(){
    const {width,height}=viewport(),anchor=launch.getBoundingClientRect();
    for(const element of [panel,summary]){
      if(element.hidden)continue;
      const rect=element.getBoundingClientRect(),left=Math.max(12,Math.min(width-rect.width-12,anchor.right-rect.width));
      const above=anchor.top-rect.height-10,top=above>=12?above:Math.max(12,Math.min(height-rect.height-12,anchor.bottom+10));
      element.style.left=left+'px';element.style.top=top+'px';
    }
  }
  function fit(){if(position){const {width,height}=viewport(),rect=launch.getBoundingClientRect();place(position.x*Math.max(0,width-rect.width),position.y*Math.max(0,height-rect.height));}else layoutOverlays();}
  window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
  new ResizeObserver(layoutOverlays).observe(summary);
  style.addEventListener('load',fit);requestAnimationFrame(fit);
  function courseDocument(){try{return courseWindow.document;}catch{return document;}}
  function stopCourseAudio(){window.dispatchEvent(new Event('duck:stop-course-audio'));if(courseWindow!==window)courseWindow.dispatchEvent(new courseWindow.Event('duck:stop-course-audio'));}
  function attach(view){
    let doc;try{doc=view.document;}catch{return;}
    if(attached.has(doc)&&courseWindow===view)return;
    courseWindow=view;
    if(view!==window&&!attached.has(doc)){
      for(const name of ['duck:course-context','duck:assessment','duck:course-audio-start'])view.addEventListener(name,event=>{if(courseWindow===view&&courseDocument()===doc)window.dispatchEvent(new CustomEvent(name,{detail:event.detail}));});
      doc.addEventListener('click',event=>{if(event.target.closest('[data-duck-teach]'))show(true);});
    }
    attached.add(doc);
    context=view.GrowingDuckContext||null;
    window.dispatchEvent(new CustomEvent('duck:course-context',{detail:context}));
  }
  function activeCourse(){attach(document.getElementById('course')?.contentWindow||window);}
  document.addEventListener('load',event=>{if(event.target.id==='course')activeCourse();},true);
  const app=document.getElementById('app');if(app&&window.GrowingCloud)new MutationObserver(activeCourse).observe(app,{childList:true});
  function fallback(){
    const doc=courseDocument(),url=new URL(doc.URL);
    const title=doc.querySelector('#lesson-title,.word-name,h1')?.textContent||doc.title;
    const exam=!!doc.querySelector('#quiz-form,#practice-form,#recall-form,#word-mastery-host')||!!doc.querySelector('[data-tab="practice"][aria-current="page"],[data-tab="recall"][aria-current="page"]');
    const visible=doc.querySelector('.lesson-points,.lesson-content,.learn-content');
    return {id:url.pathname+url.search,title,subject:'',mode:exam?'exam':'learn',segments:exam?[]:[visible?.textContent?.trim()].filter(Boolean)};
  }
  function send(){if(frame&&open)frame.contentWindow?.postMessage({type:'duck:course-context',context:context||fallback()},endpoint.origin);}
  function startTeaching(){if(open&&ready&&pendingTeach){pendingTeach=false;send();frame.contentWindow?.postMessage({type:'duck:teach'},endpoint.origin);}}
  function visible(){invisible=false;host.classList.remove('duck-invisible');host.inert=false;host.removeAttribute('aria-hidden');}
  function hide(){visible();++summarySequence;pendingSummary=null;pendingTeach=false;if(frame)frame.contentWindow?.postMessage({type:'duck:close'},endpoint.origin);open=false;panel.hidden=true;launch.hidden=false;launch.setAttribute('aria-expanded','false');launch.focus();}
  function ensureFrame(){if(!frame){frame=document.createElement('iframe');frame.title='小鸭实时语音课堂';frame.src=endpoint.href;frame.allow='microphone; autoplay';frame.addEventListener('load',()=>{send();flushSummary();});panel.append(frame);}}
  function setVisibility(value){
    if(value==='hide'&&open){invisible=true;host.classList.add('duck-invisible');host.inert=true;host.setAttribute('aria-hidden','true');announcement.textContent='小鸭已隐身，语音仍在倾听。说“小鸭出来”可唤回。';}
    else if(value==='show'){visible();announcement.textContent='小鸭回来了。';if(open)close.focus();}
  }
  function show(teach=false){
    visible();
    pendingTeach=teach;
    stopCourseAudio();
    open=true;panel.hidden=false;launch.setAttribute('aria-expanded','true');layoutOverlays();
    ensureFrame();send();close.focus();
    if(ready&&!teach)refreshKnowledge();
    startTeaching();
  }
  launch.addEventListener('dblclick',()=>{if(performance.now()>=suppressUntil)show();});
  let lastTap=0,hintTimer;
  launch.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;const rect=launch.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false};launch.setPointerCapture(event.pointerId);});
  launch.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<5)return;
    drag.moved=true;host.classList.add('duck-dragging');launch.classList.remove('duck-hint');lastTap=0;
    place(drag.left+dx,drag.top+dy);
  });
  function finishDrag(event){
    if(!drag||drag.id!==event.pointerId)return;
    const moved=drag.moved;drag=null;host.classList.remove('duck-dragging');
    if(launch.hasPointerCapture(event.pointerId))launch.releasePointerCapture(event.pointerId);
    if(moved){suppressUntil=performance.now()+500;lastTap=0;try{localStorage.setItem(positionKey,JSON.stringify(position));}catch{}return;}
    if(event.type!=='pointerup'||event.pointerType==='mouse')return;
    const now=performance.now();if(lastTap&&now-lastTap<450){lastTap=0;show();}else lastTap=now;
  }
  launch.addEventListener('pointerup',finishDrag);launch.addEventListener('pointercancel',finishDrag);launch.addEventListener('lostpointercapture',finishDrag);
  launch.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();return;}if(event.detail===0){show();return;}launch.classList.add('duck-hint');clearTimeout(hintTimer);hintTimer=setTimeout(()=>launch.classList.remove('duck-hint'),2200);});
  launch.addEventListener('keydown',event=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!delta)return;event.preventDefault();const rect=launch.getBoundingClientRect(),step=event.shiftKey?24:8;place(rect.left+delta[0]*step,rect.top+delta[1]*step,true);});
  document.addEventListener('click',event=>{if(event.target.closest('[data-duck-teach]'))show(true);});
  close.addEventListener('click',hide);host.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  function restoreNavigation(){navigation.then(api=>{const pending=api.consumeNavigation((context||fallback()).id);if(pending)show(pending.teach);}).catch(()=>{});}
  restoreNavigation();
  window.addEventListener('duck:course-context',event=>{context=event.detail;send();drawArchive();reminder.hidden=true;if(open&&ready)refreshKnowledge();restoreNavigation();});
  window.addEventListener('duck:course-audio-start',()=>{if(frame)frame.contentWindow?.postMessage({type:'duck:close'},endpoint.origin);});
  window.addEventListener('message',event=>{if(event.origin!==endpoint.origin||event.source!==frame?.contentWindow)return;if(event.data?.type==='duck:ready'){ready=true;send();flushSummary();if(pendingTeach)startTeaching();else if(open)refreshKnowledge();}if(event.data?.type==='duck:knowledge-query'&&open)refreshKnowledge(String(event.data.query||'').slice(0,150),String(event.data.requestId||'').slice(0,80));if(event.data?.type==='duck:audio-start')stopCourseAudio();if(event.data?.type==='duck:visibility')setVisibility(event.data.value);if(event.data?.type==='duck:voice-stopped'&&invisible){visible();open=false;panel.hidden=true;launch.hidden=false;launch.setAttribute('aria-expanded','false');}if(event.data?.type==='duck:summary-status'&&event.data.id===lastSummary?.id)summary.querySelector('[data-summary-status]').textContent=String(event.data.message||'').slice(0,200);});
  function flushSummary(){if(pendingSummary&&ready&&frame){frame.contentWindow?.postMessage({type:'duck:assessment-summary',summary:pendingSummary,context:context||fallback()},endpoint.origin);pendingSummary=null;}}
  async function playSummary(){if(!lastSummary||lastSummary.courseId!==(context||fallback()).id)return;pendingSummary=lastSummary;summary.querySelector('[data-summary-status]').textContent='正在准备小鸭语音…';stopCourseAudio();ensureFrame();flushSummary();}
  window.addEventListener('duck:assessment',async event=>{
    const seq=++summarySequence;
    try{
      const item=(await actions).assessmentSummary(event.detail);
      if(seq!==summarySequence||!item||document.hidden||item.courseId!==(context||fallback()).id||seenAssessments.has(item.id))return;
      seenAssessments.add(item.id);if(seenAssessments.size>80)seenAssessments.delete(seenAssessments.values().next().value);
      lastSummary=item;summary.querySelector('[data-summary-text]').textContent=item.text;summary.hidden=false;layoutOverlays();await playSummary();
    }catch{summary.querySelector('[data-summary-status]').textContent='总结语音暂不可用，请查看老师的评分反馈。';}
  });
  summary.querySelector('[data-summary-play]').addEventListener('click',playSummary);
  function stopSummary(){++summarySequence;pendingSummary=null;frame?.contentWindow?.postMessage({type:'duck:summary-stop'},endpoint.origin);summary.querySelector('[data-summary-status]').textContent='播报已停止。';}
  summary.querySelector('[data-summary-stop]').addEventListener('click',stopSummary);
  summary.querySelector('[data-summary-dismiss]').addEventListener('click',()=>{stopSummary();summary.hidden=true;});
  window.addEventListener('duck:course-context',()=>{if(lastSummary&&lastSummary.courseId!==(context||fallback()).id){stopSummary();summary.hidden=true;lastSummary=null;}});
  window.addEventListener('message',async event=>{
    if(event.origin!==endpoint.origin||event.source!==frame?.contentWindow||event.data?.type!=='duck:navigate'||!open)return;
    const {requestId,courseId,destinationId,teach}=event.data;
    const reply=message=>frame?.contentWindow?.postMessage({type:'duck:navigation-error',requestId,message},endpoint.origin);
    if(courseId!==(context||fallback()).id||context?.mode==='exam'){reply('请先返回图文讲解，再切换学习知识点。');return;}
    try{
      const api=await navigation;
      if(!open||courseId!==(context||fallback()).id)return;
      const provider=cloud();
      api.openDestination(destinationId,{baseUrl:courseBase,teach:teach===true,navigate:href=>{frame?.contentWindow?.postMessage({type:'duck:close'},endpoint.origin);if(provider?.navigate)provider.navigate(href);else location.assign(href);}});
    }catch(error){reply(error.message||'页面暂时无法打开，请重试。');}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){++summarySequence;pendingSummary=null;pendingTeach=false;if(frame)frame.contentWindow?.postMessage({type:'duck:close'},endpoint.origin);}});
  window.GrowingDuckCourse={getContext:()=>context||fallback(),close:hide,attach,show,reset(){hide();++knowledgeSeq;frame?.remove();frame=null;ready=false;context=null;profile=null;profileIdentity='';noteDrafts.clear();summary.hidden=true;lastSummary=null;drawArchive();}};
  // The authenticated portal owns identity; standalone preview never guesses a student.
  const knowledgeButton=document.createElement('button');knowledgeButton.type='button';knowledgeButton.textContent='学习档案';heading.insertBefore(knowledgeButton,close);
  const archive=document.createElement('section');archive.className='duck-knowledge';archive.hidden=true;archive.setAttribute('aria-label','个人学习知识库');panel.append(archive);
  const reminder=document.createElement('p');reminder.className='duck-reminder';reminder.hidden=true;panel.insertBefore(reminder,archive);
  const archiveStyle=document.createElement('style');archiveStyle.textContent='.duck-knowledge{position:absolute;inset:42px 0 0;z-index:2;overflow:auto;padding:16px;background:#fffdf9;color:#2d4434}.duck-knowledge h2{font-size:18px}.duck-knowledge h3{font-size:15px}.duck-knowledge button,.duck-knowledge select,.duck-knowledge textarea{font:inherit;min-height:44px;max-width:100%;padding:8px;border:1px solid #b9c6a9;border-radius:8px;background:#fffdf9;color:#2d4434}.duck-knowledge textarea{width:100%;min-height:90px}.duck-knowledge article{padding:10px 0;border-bottom:1px solid #e1e4d7}.duck-knowledge p{overflow-wrap:anywhere;line-height:1.7}.duck-knowledge .filters{display:flex;gap:8px;flex-wrap:wrap}.duck-reminder{position:absolute;bottom:0;left:0;right:0;margin:0;padding:8px 12px;background:#edf2e4;color:#2d4434;font-size:11px;line-height:1.6;max-height:72px;overflow:auto}.duck-reminder:not([hidden])~.duck-knowledge{bottom:72px}.course-duck-panel:has(.duck-reminder:not([hidden])) iframe{height:calc(100% - 114px)}';document.head.append(archiveStyle);
  let profile=null,profileIdentity='',knowledgeError='',knowledgeSeq=0,shown=40,statusFilter='weak',subjectFilter='',noteDraft='',noteMessage='',savingNote=false,noteKey='';
  const noteDrafts=new Map();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={unknown:'未测',learning:'学习中',mastered:'课程已达标',weak:'待巩固',review:'达标后需复习'};
  function cloud(){try{return window.top.GrowingCloud||window.GrowingStudentKnowledge;}catch{return null;}}
  function unit(){return (context||fallback()).id?.match(/(?:math|physics|english)-8[ab]-\d{2}/)?.[0]||'';}
  function topic(){return String((context||fallback()).id||'').split(':').at(-1);}
  function sendKnowledge(requestId=''){
    const current=profile?.context?.unitId===unit()&&(!profile.context.topicId||profile.context.topicId===topic());
    if(frame&&open)frame.contentWindow?.postMessage({type:'duck:student-knowledge',requestId,courseId:(context||fallback()).id,student:profile?.student||null,context:current?profile.context:null,error:knowledgeError},endpoint.origin);
  }
  async function refreshKnowledge(query='',requestId=''){
    const seq=++knowledgeSeq;
    try{
      const provider=cloud();if(!provider?.studentKnowledge)throw Error('请从学生账号的学习中心进入，独立预览不读取任何学生档案。');
      const result=await provider.studentKnowledge(unit(),query,topic());
      if(seq!==knowledgeSeq){sendKnowledge(requestId);return;}
      if(profileIdentity!==result.student.id){noteDrafts.clear();noteKey='';noteDraft='';noteMessage='';}
      profileIdentity=result.student.id;
      profile=result;knowledgeError='';
    }catch(error){if(seq!==knowledgeSeq){sendKnowledge(requestId);return;}profile=null;knowledgeError=error.message;}
    sendKnowledge(requestId);drawArchive();
    const tip=(context?.mode!=='exam')&&profile?.context?.reminders?.[0];
    reminder.hidden=!tip;reminder.textContent=tip?'复习提醒：'+tip.title+'。'+tip.reason:'';
  }
  window.addEventListener('growing:knowledge-changed',event=>{
    if(profile&&event.detail?.studentId!==profile.student.id)return;
    ++knowledgeSeq;profile=null;knowledgeError='';drawArchive();
    if(open)refreshKnowledge();
  });
  function wrongEntry(q){
    const review=q.photoReview,error=review?.error;
    const status=review?.status||q.status||(q.lastCorrect===1?'latest-correct':'needs-review');
    const outcome=status==='historical'?'历史错误：题干已修改或最新批改需核对':status==='latest-correct'?
      (review?.latest.outcomeSource==='photo-grade'&&review.latest.kind==='correction'?'最近订正已通过，保留历史错误':'最近一次答对，历史错误保留'):'最近一次仍需订正';
    return '<article data-knowledge-wrong="'+esc(q.questionId)+'">'+(q.kind==='photo'?'<strong>拍照错题 · '+esc(q.paperTitle||'作业')+' 第'+esc(q.number||'?')+'题</strong>':'')+
      '<p>'+esc(q.title)+'</p><p>错 '+q.wrongCount+' / 作答 '+q.totalCount+' 次 · '+outcome+'</p>'+
      (error?'<details><summary>历史批改与错因 · '+error.score+'/100</summary><p>'+esc(error.feedback)+'</p>'+
        error.corrections.map(c=>'<p><strong>'+esc(c.location)+'</strong>：'+esc(c.issue)+'<br>订正建议：'+esc(c.correction)+'</p>').join('')+
        error.knowledge.filter(k=>k.role==='gap').map(k=>'<p>关联薄弱点：'+esc(k.title)+'；'+esc(k.reason)+'</p>').join('')+'</details>':q.kind==='photo'?'<p>尚无已保存的逐题错因，不能仅凭对错次数推断原因。</p>':'')+'</article>';
  }
  function drawArchive(){
    const nextKey=profile?profile.student.id+':'+unit():'';
    if(noteKey!==nextKey){if(noteKey)noteDrafts.set(noteKey,noteDraft);noteKey=nextKey;noteDraft=noteDrafts.get(noteKey)||'';noteMessage='';}
    if(context?.mode==='exam'){archive.innerHTML='<h2>独立测验中</h2><p>完成测验后可查看知识点、错题和总结。</p>';return;}
    if(!profile){archive.innerHTML='<h2>个人学习知识库</h2><p role="status">'+esc(knowledgeError||'正在读取学习记录…')+'</p><button data-knowledge-refresh>重新读取</button>';return;}
    const c=profile.counts,rows=profile.topics.filter(t=>(!subjectFilter||t.subject===subjectFilter)&&(!statusFilter||statusFilter==='weak'?(!statusFilter||['weak','review'].includes(t.status)):t.status===statusFilter));
    archive.innerHTML='<h2>'+esc(profile.student.displayName)+'的学习档案</h2><p>'+esc(profile.summary)+'</p><button data-knowledge-refresh>刷新档案</button><details><summary>证据范围</summary><p>'+esc(profile.coverage)+'</p>'+profile.warnings.map(w=>'<p>'+esc(w)+'</p>').join('')+'</details><h3>知识点 · '+c.total+' 项</h3><div class="filters"><label>学科 <select data-knowledge-subject><option value="">全部</option><option value="math">数学</option><option value="physics">物理</option><option value="english">英语</option></select></label><label>状态 <select data-knowledge-status><option value="weak">待巩固 / 需复习</option><option value="mastered">课程已达标</option><option value="learning">学习中</option><option value="unknown">未测</option><option value="">全部</option></select></label></div><p>符合筛选 '+rows.length+' 项</p>'+rows.slice(0,shown).map(t=>'<article><strong>'+esc(t.title)+'</strong> · '+esc(labels[t.status])+'<p>'+esc(t.unitTitle)+' · '+esc(t.evidence.join('；')||'暂无足够评测证据')+'</p></article>').join('')+(rows.length>shown?'<button data-knowledge-more>显示更多知识点</button>':'')+'<h3>错题记录 · '+profile.wrongQuestions.length+' 道</h3>'+profile.wrongQuestions.map(wrongEntry).join('')+'<h3>我的学习总结</h3><p>保存当前课程的理解、疑问或复盘；不直接计入掌握度。</p><form data-knowledge-note><label>本节总结<textarea name="note" maxlength="1200" required></textarea></label><button type="submit">保存总结</button><p data-note-status role="status"></p></form>'+profile.notes.slice().reverse().map(n=>'<article><p>'+esc(n.text)+'</p><small>'+esc(n.unitId)+' · '+esc(n.at||'暂无日期')+' · 学生记录</small></article>').join('');
    archive.querySelector('[data-knowledge-status]').value=statusFilter;archive.querySelector('[data-knowledge-subject]').value=subjectFilter;
    archive.querySelector('[data-knowledge-note] textarea').value=noteDraft;
    archive.querySelector('[data-knowledge-note] textarea').disabled=savingNote;
    archive.querySelector('[data-knowledge-note] button').disabled=savingNote;
    archive.querySelector('[data-note-status]').textContent=noteMessage;
  }
  knowledgeButton.addEventListener('click',()=>{archive.hidden=!archive.hidden;if(!archive.hidden){drawArchive();refreshKnowledge();}});
  archive.addEventListener('change',event=>{if(event.target.matches('[data-knowledge-status]'))statusFilter=event.target.value;else if(event.target.matches('[data-knowledge-subject]'))subjectFilter=event.target.value;else return;shown=40;drawArchive();});
  archive.addEventListener('click',event=>{if(event.target.closest('[data-knowledge-refresh]'))refreshKnowledge();if(event.target.closest('[data-knowledge-more]')){shown+=40;drawArchive();}});
  archive.addEventListener('input',event=>{if(event.target.matches('[data-knowledge-note] textarea'))noteDraft=event.target.value;});
  archive.addEventListener('submit',async event=>{
    if(!event.target.matches('[data-knowledge-note]'))return;event.preventDefault();if(savingNote)return;const draft=noteDraft,draftKey=noteKey,draftUnit=unit();savingNote=true;noteMessage='正在保存…';drawArchive();
    try{const provider=cloud();if(!provider?.saveKnowledgeNote)throw Error('请登录学生账号。');await provider.saveKnowledgeNote(draftUnit,draft);noteDrafts.delete(draftKey);if(noteKey===draftKey){noteDraft='';noteMessage='总结已保存。';}await refreshKnowledge();}
    catch(error){if(noteKey===draftKey)noteMessage=error.message;}finally{savingNote=false;drawArchive();}
  });
  activeCourse();
})();
