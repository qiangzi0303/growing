/* Shared course companion. The parent sends teaching material, never scoring keys. */
(()=>{
  'use strict';
  if(document.getElementById('course-duck-host'))return;
  const courseBase=new URL('.',document.currentScript.src),navigation=import(new URL('companion-duck/navigation.js',courseBase));
  navigation.catch(()=>{});
  let context=window.GrowingDuckContext||null,frame=null,open=false,ready=false,pendingTeach=false;
  const endpoint=new URL('companion-duck/index.html?realtime=1&embed=1',new URL(document.currentScript.src));
  if(['localhost','127.0.0.1'].includes(location.hostname)){endpoint.port='8793';endpoint.pathname='/app-design/companion-duck/index.html';}
  const host=document.createElement('aside');host.id='course-duck-host';host.setAttribute('aria-label','小鸭互动课堂');
  const launch=document.createElement('button');launch.type='button';launch.className='course-duck-launch';launch.textContent='小鸭讲这节课';launch.setAttribute('aria-expanded','false');
  const panel=document.createElement('section');panel.className='course-duck-panel';panel.hidden=true;
  const heading=document.createElement('header'),label=document.createElement('strong'),close=document.createElement('button');label.textContent='小鸭老师 · 可以随时提问';close.type='button';close.textContent='关闭';heading.append(label,close);panel.append(heading);host.append(launch,panel);document.body.append(host);
  const style=document.createElement('style');style.textContent='#course-duck-host{position:fixed;right:18px;bottom:18px;z-index:1000;font:13px/1.5 "Microsoft YaHei",sans-serif}#course-duck-host [hidden]{display:none!important}.course-duck-launch{border:1px solid #c4d7c6;border-radius:24px;padding:12px 18px;background:#355a44;color:#fff;box-shadow:0 6px 22px #19392925;cursor:pointer}.course-duck-panel{width:min(420px,calc(100vw - 24px));height:min(780px,calc(100svh - 32px));background:#f7faf4;border:1px solid #c4d7c6;border-radius:18px;box-shadow:0 12px 60px #203b3a33;overflow:hidden}.course-duck-panel>header{height:42px;display:flex;justify-content:space-between;align-items:center;padding:0 14px;color:#355a44}.course-duck-panel>header button{border:0;background:transparent;color:inherit;padding:10px;cursor:pointer}.course-duck-panel iframe{display:block;width:100%;height:calc(100% - 42px);border:0}@media(max-width:520px){#course-duck-host{right:12px;bottom:12px}.course-duck-launch{padding:10px 14px}.course-duck-panel{height:calc(100svh - 24px)}}';document.head.append(style);
  function fallback(){
    const title=document.querySelector('#lesson-title,.word-name,h1')?.textContent||document.title;
    const exam=!!document.querySelector('#quiz-form,#practice-form,#recall-form,#word-mastery-host')||!!document.querySelector('[data-tab="practice"][aria-current="page"],[data-tab="recall"][aria-current="page"]');
    const visible=document.querySelector('.lesson-points,.lesson-content,.learn-content');
    return {id:location.pathname+location.search,title,subject:'',mode:exam?'exam':'learn',segments:exam?[]:[visible?.textContent?.trim()].filter(Boolean)};
  }
  function send(){if(frame&&open)frame.contentWindow?.postMessage({type:'duck:course-context',context:context||fallback()},endpoint.origin);}
  function startTeaching(){if(open&&ready&&pendingTeach){pendingTeach=false;send();frame.contentWindow?.postMessage({type:'duck:teach'},endpoint.origin);}}
  function hide(){pendingTeach=false;if(frame)frame.contentWindow?.postMessage({type:'duck:close'},endpoint.origin);open=false;panel.hidden=true;launch.hidden=false;launch.setAttribute('aria-expanded','false');launch.focus();}
  function show(teach=false){
    pendingTeach=teach;
    window.dispatchEvent(new Event('duck:stop-course-audio'));
    open=true;panel.hidden=false;launch.hidden=true;launch.setAttribute('aria-expanded','true');
    if(!frame){frame=document.createElement('iframe');frame.title='小鸭实时语音课堂';frame.src=endpoint.href;frame.allow='microphone; autoplay';frame.addEventListener('load',send);panel.append(frame);}else send();close.focus();
    startTeaching();
  }
  launch.addEventListener('click',()=>show());
  document.addEventListener('click',event=>{if(event.target.closest('[data-duck-teach]'))show(true);});
  close.addEventListener('click',hide);host.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  function restoreNavigation(){navigation.then(api=>{const pending=api.consumeNavigation((context||fallback()).id);if(pending)show(pending.teach);}).catch(()=>{});}
  restoreNavigation();
  window.addEventListener('duck:course-context',event=>{context=event.detail;send();drawArchive();reminder.hidden=true;if(open&&ready)refreshKnowledge();restoreNavigation();});
  window.addEventListener('duck:course-audio-start',()=>{if(frame)frame.contentWindow?.postMessage({type:'duck:close'},endpoint.origin);});
  window.addEventListener('message',event=>{if(event.origin!==endpoint.origin||event.source!==frame?.contentWindow)return;if(event.data?.type==='duck:ready'){ready=true;send();if(pendingTeach)startTeaching();else refreshKnowledge();}if(event.data?.type==='duck:knowledge-query'&&open)refreshKnowledge(String(event.data.query||'').slice(0,150),String(event.data.requestId||'').slice(0,80));if(event.data?.type==='duck:audio-start')window.dispatchEvent(new Event('duck:stop-course-audio'));});
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
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pendingTeach=false;if(frame)frame.contentWindow?.postMessage({type:'duck:close'},endpoint.origin);}});
  window.GrowingDuckCourse={getContext:()=>context||fallback(),close:hide};
  // The authenticated portal owns identity; standalone preview never guesses a student.
  const knowledgeButton=document.createElement('button');knowledgeButton.type='button';knowledgeButton.textContent='学习档案';heading.insertBefore(knowledgeButton,close);
  const archive=document.createElement('section');archive.className='duck-knowledge';archive.hidden=true;archive.setAttribute('aria-label','个人学习知识库');panel.append(archive);
  const reminder=document.createElement('p');reminder.className='duck-reminder';reminder.hidden=true;panel.insertBefore(reminder,archive);
  const archiveStyle=document.createElement('style');archiveStyle.textContent='.course-duck-panel{position:relative}.duck-knowledge{position:absolute;inset:42px 0 0;z-index:2;overflow:auto;padding:16px;background:#fffdf9;color:#2d4434}.duck-knowledge h2{font-size:18px}.duck-knowledge h3{font-size:15px}.duck-knowledge button,.duck-knowledge select,.duck-knowledge textarea{font:inherit;min-height:44px;max-width:100%;padding:8px;border:1px solid #b9c6a9;border-radius:8px;background:#fffdf9;color:#2d4434}.duck-knowledge textarea{width:100%;min-height:90px}.duck-knowledge article{padding:10px 0;border-bottom:1px solid #e1e4d7}.duck-knowledge p{overflow-wrap:anywhere;line-height:1.7}.duck-knowledge .filters{display:flex;gap:8px;flex-wrap:wrap}.duck-reminder{position:absolute;bottom:0;left:0;right:0;margin:0;padding:8px 12px;background:#edf2e4;color:#2d4434;font-size:11px;line-height:1.6;max-height:72px;overflow:auto}.duck-reminder:not([hidden])~.duck-knowledge{bottom:72px}.course-duck-panel:has(.duck-reminder:not([hidden])) iframe{height:calc(100% - 114px)}';document.head.append(archiveStyle);
  let profile=null,profileIdentity='',knowledgeError='',knowledgeSeq=0,shown=40,statusFilter='weak',subjectFilter='',noteDraft='',noteMessage='',savingNote=false,noteKey='';
  const noteDrafts=new Map();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={unknown:'未测',learning:'学习中',mastered:'课程已达标',weak:'待巩固',review:'达标后需复习'};
  function cloud(){try{return window.top.GrowingCloud;}catch{return null;}}
  function unit(){return (context||fallback()).id?.match(/(?:math|physics|english)-8[ab]-\d{2}/)?.[0]||'';}
  function topic(){return String((context||fallback()).id||'').split(':').at(-1);}
  function sendKnowledge(requestId=''){
    const current=profile?.context?.unitId===unit()&&profile?.context?.topicId===topic();
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
  function drawArchive(){
    const nextKey=profile?profile.student.id+':'+unit():'';
    if(noteKey!==nextKey){if(noteKey)noteDrafts.set(noteKey,noteDraft);noteKey=nextKey;noteDraft=noteDrafts.get(noteKey)||'';noteMessage='';}
    if(context?.mode==='exam'){archive.innerHTML='<h2>独立测验中</h2><p>完成测验后可查看知识点、错题和总结。</p>';return;}
    if(!profile){archive.innerHTML='<h2>个人学习知识库</h2><p role="status">'+esc(knowledgeError||'正在读取学习记录…')+'</p><button data-knowledge-refresh>重新读取</button>';return;}
    const c=profile.counts,rows=profile.topics.filter(t=>(!subjectFilter||t.subject===subjectFilter)&&(!statusFilter||statusFilter==='weak'?(!statusFilter||['weak','review'].includes(t.status)):t.status===statusFilter));
    archive.innerHTML='<h2>'+esc(profile.student.displayName)+'的学习档案</h2><p>'+esc(profile.summary)+'</p><p>'+esc(profile.syncPending?'部分记录尚未同步，下列结论依据云端留存记录。':('最近同步：'+(profile.lastSyncedAt||'暂无记录')))+'</p><button data-knowledge-refresh>刷新档案</button><details><summary>证据范围</summary><p>'+esc(profile.coverage)+'</p>'+profile.warnings.map(w=>'<p>'+esc(w)+'</p>').join('')+'</details><h3>知识点 · '+c.total+' 项</h3><div class="filters"><label>学科 <select data-knowledge-subject><option value="">全部</option><option value="math">数学</option><option value="physics">物理</option><option value="english">英语</option></select></label><label>状态 <select data-knowledge-status><option value="weak">待巩固 / 需复习</option><option value="mastered">课程已达标</option><option value="learning">学习中</option><option value="unknown">未测</option><option value="">全部</option></select></label></div><p>符合筛选 '+rows.length+' 项</p>'+rows.slice(0,shown).map(t=>'<article><strong>'+esc(t.title)+'</strong> · '+esc(labels[t.status])+'<p>'+esc(t.unitTitle)+' · '+esc(t.evidence.join('；')||'暂无足够评测证据')+'</p></article>').join('')+(rows.length>shown?'<button data-knowledge-more>显示更多知识点</button>':'')+'<h3>错题记录 · '+profile.wrongQuestions.length+' 道</h3>'+profile.wrongQuestions.map(q=>'<article>'+esc(q.title)+'<p>错 '+q.wrongCount+' / 作答 '+q.totalCount+' 次 · '+(q.lastCorrect===1?'最近一次答对，历史错误保留':'最近一次仍需巩固')+'</p></article>').join('')+'<h3>我的学习总结</h3><p>保存当前课程的理解、疑问或复盘；不直接计入掌握度。</p><form data-knowledge-note><label>本节总结<textarea name="note" maxlength="1200" required></textarea></label><button type="submit">保存总结</button><p data-note-status role="status"></p></form>'+profile.notes.slice().reverse().map(n=>'<article><p>'+esc(n.text)+'</p><small>'+esc(n.unitId)+' · '+esc(n.at||'暂无日期')+' · 学生记录</small></article>').join('');
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
})();
