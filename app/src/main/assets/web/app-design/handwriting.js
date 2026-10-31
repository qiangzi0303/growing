(()=>{
  'use strict';
  const C=window.GrowingHandwriting,$=s=>document.querySelector(s),params=new URLSearchParams(location.search);
  const subject=['math','physics','english'].includes(params.get('subject'))?params.get('subject'):'math';
  const unitId=C.units(subject).includes(params.get('unit'))?params.get('unit'):C.units(subject)[0];
  const course=Object.values(GrowingCurriculum[subject].terms).flatMap(t=>t.units).find(u=>u.id===unitId);
  const tasks=GrowingHandwritingTasks.forUnit(subject,unitId),essay=subject==='english';
  const currentTask=()=>tasks.find(t=>t.prompt===doc.prompt&&t.nodes?.length);
  const canvas=$('#paper');
  let doc,key,page=0,tool='pen',redo=[],active=null,job=null,blocked=false,dirty=false,saveTimer;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  $('#course-label').textContent=GrowingCurriculum[subject].name+' · '+course.title+' · '+(subject==='english'?'作文 / 书面表达':'解答题 / 推导过程');
  document.title=GrowingCurriculum[subject].name+'手写'+(essay?'作文':'解答题')+' · '+course.title;
  $('#page-title').textContent=GrowingCurriculum[subject].name+'手写'+(essay?'作文':'解答题');
  $('#writing-guide').textContent=essay?'根据本单元主题和写作要求，在下方书写完整作文，保留你的原始字迹与段落。':'根据本章题目，在下方画图、列式并写出推导或证明过程，保留你的原始笔迹。';
  $('#task-heading').textContent='本'+(essay?'单元作文题目':'章解答题');
  $('#prompt-label').textContent=essay?'作文题目与写作要求':'解答题题目与作答要求';
  $('#prompt').placeholder=essay?'填写主题、写作情境、要点与词数要求。':'填写完整题目、已知条件和需要求解或证明的问题。';
  $('#review-guide').textContent='写完后直接提交全部原稿，AI 逐页查看手写答案，给出评分、具体错误订正与关联知识点。无需转换或核对文字。看不清的内容会标为待复核。';
  $('#task-choice').innerHTML=tasks.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('')+'<option value="custom">自拟题目 / 老师布置的作业</option>';
  $('#unit-summary').href='unit-summary.html?'+new URLSearchParams({subject,unit:unitId});
  if(tasks.some(t=>t.source))$('#bank-description').textContent='用户提供实卷：'+tasks.filter(t=>t.source).length+'组清晰原题，仅保留题目；选择后手写解答，由 AI 看过程评分。原照片中的答案、批改及不清楚部分未录入。';
  function previewTask(){const task=tasks.find(t=>t.id===$('#task-choice').value);$('#task-preview').textContent=task?.prompt||(essay?'新建空白作文作业后，填写主题和写作要求。':'新建空白解答作业后，填写题目与已知条件。');$('#task-knowledge').textContent=task?.nodes?'考核知识点：'+task.nodes.map(id=>C.knowledgeNodes[id]).join('、')+'。知识点评分：低于60为薄弱，60–79为不稳，80及以上为本题通过。':'';}
  function matchTask(){const task=tasks.find(t=>t.prompt===doc.prompt);$('#task-choice').value=task?.id||'custom';previewTask();}
  function selectedPrompt(){return tasks.find(t=>t.id===$('#task-choice').value)?.prompt||'';}
  $('#task-choice').onchange=previewTask;
  $('#back').href=course.entry||(subject==='english'?'english-course.html?unit=':subject==='physics'?'physics-course.html?chapter=':'math-course.html?chapter=')+unitId;
  $('#back').target='_top';
  function say(id,text,error=false){$(id).textContent=text;$(id).classList.toggle('error',error);}
  function archiveList(){
    const rows=[];
    try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!C.KEY.test(k))continue;try{const d=JSON.parse(localStorage.getItem(k));if(!C.validate(d))throw Error();if(d.unitId===unitId)rows.push({key:k,title:d.prompt.slice(0,35)||'未命名作业',at:d.updatedAt});}catch{rows.push({key:k,title:'无法读取的原稿（保留）',at:''});}}}
    catch{say('#save-status','无法列出本机作业。请恢复存储后重试。',true);}
    rows.sort((a,b)=>b.at.localeCompare(a.at));
    $('#archives').innerHTML=rows.map(r=>`<button data-archive="${r.key}" ${key===r.key?'aria-current="page"':''}>${esc(r.title)}<br><small>${esc(r.at.slice(0,10))}</small></button>`).join('');
  }
  function save(){
    clearTimeout(saveTimer);if(blocked||!doc)return false;
    try{if(!C.validate(doc))throw Error('原稿超出保存限制');const value=JSON.stringify(doc);if(value.length>900000)throw Error('原稿过大，请新建下一份作业');localStorage.setItem(key,value);dirty=false;say('#save-status','原稿已保存到当前设备 · '+new Date().toLocaleTimeString());archiveList();return true;}
    catch{dirty=true;say('#save-status','原稿尚未保存，当前笔迹仍在页面中。请勿关闭或切换作业，恢复设备存储后点击“立即保存原稿”。',true);return false;}
  }
  function changed(){C.change(doc);dirty=true;redo=[];review();save();}
  function render(){
    C.draw(canvas,doc.pages[page]);$('#prompt').value=doc.prompt;
    $('#page-label').textContent=`第 ${page+1} / ${doc.pages.length} 页`;
    $('#prev').disabled=blocked||!!job||page===0;$('#next').disabled=blocked||!!job||page===doc.pages.length-1;
    $('#add-page').disabled=blocked||!!job||doc.pages.length>=C.MAX_PAGES;
    $('#undo').disabled=blocked||!!job||!doc.pages[page].length;$('#redo').disabled=blocked||!!job||!redo.length;
    $('#prompt').disabled=blocked||!!job;review();
    $('#task-choice').disabled=!!job;$('#use-task').disabled=!!job;
  }
  function review(){
    $('#grade').disabled=blocked||!!job;
    $('#grades').innerHTML=doc.grades.slice().reverse().map(g=>`<article><strong>${g.revision===doc.revision?'本份原稿':'历史点评 · 原稿已修改'}</strong><p class="score">${g.needsReview?'需要复核 · 不计分':g.score+' / 100'}</p>${g.parts?`<p>${(doc.mode==='essay'?['内容','结构','语言','标点与格式']:['审题','思路','推导','表达']).map((n,i)=>`<span class="${g.parts[i]<(doc.mode==='essay'?[25,20,35,20]:[20,30,30,20])[i]?'assessment-gap':''}">${n} ${g.parts[i]}/${(doc.mode==='essay'?[25,20,35,20]:[20,30,30,20])[i]}</span>`).join(' · ')}</p>`:''}<p class="${g.needsReview||g.score<80?'assessment-gap':''}">${esc(g.feedback)}</p>${GrowingHandwritingAI.details(g)}<small>${esc(g.at.slice(0,19).replace('T',' '))} · ${g.source==='handwriting'?'直接查看手写原稿':'历史文字点评'}</small></article>`).join('');
  }
  function open(k){
    if(job||active||dirty&&!save())return;
    try{const d=JSON.parse(localStorage.getItem(k));if(!C.validate(d)||d.unitId!==unitId)throw Error();doc=d;key=k;blocked=false;dirty=false;page=0;redo=[];say('#ai-status','');matchTask();render();archiveList();history.replaceState(null,'','?'+new URLSearchParams({subject,unit:unitId,id:key.slice(C.PREFIX.length)}));}
    catch{say('#ai-status','该原稿无法读取，原记录已保留，未覆盖。请选择其他作业或新建。',true);}
  }
  function newDoc(){if(job||active||dirty&&!save())return;doc=C.create(subject,unitId,selectedPrompt());key=C.PREFIX+crypto.randomUUID();page=0;redo=[];blocked=false;dirty=true;matchTask();render();save();say('#ai-status',doc.prompt?'已按所选题目新建，请在下方书写'+(essay?'作文。':'解答过程。'):'已新建自拟作业，请先填写'+(essay?'作文要求。':'题目与条件。'));history.replaceState(null,'','?'+new URLSearchParams({subject,unit:unitId,id:key.slice(C.PREFIX.length)}));}
  $('#new').onclick=newDoc;$('#archives').onclick=e=>{const b=e.target.closest('[data-archive]');if(b)open(b.dataset.archive);};
  $('#use-task').onclick=newDoc;
  $('#save').onclick=()=>{if(!active)save();};
  $('#prompt').oninput=()=>{C.change(doc);doc.prompt=$('#prompt').value;dirty=true;matchTask();review();say('#save-status','正在保存…');clearTimeout(saveTimer);saveTimer=setTimeout(save,400);};
  $('#pen').onclick=()=>selectTool('pen');$('#eraser').onclick=()=>selectTool('eraser');
  function selectTool(t){tool=t;$('#pen').setAttribute('aria-pressed',t==='pen');$('#eraser').setAttribute('aria-pressed',t==='eraser');}
  $('#undo').onclick=()=>{if(active||job||blocked||!doc.pages[page].length)return;const history=redo;history.push(doc.pages[page].pop());C.change(doc);dirty=true;review();save();redo=history;render();};
  $('#redo').onclick=()=>{if(active||job||blocked||!redo.length)return;const s=redo.pop();if(C.count(doc)+s.points.length>C.MAX_POINTS){say('#save-status','当前原稿笔迹已达上限。请新建下一份作业。',true);return;}doc.pages[page].push(s);C.change(doc);dirty=true;review();save();render();};
  function turn(n){if(active||job||blocked)return;page=Math.max(0,Math.min(doc.pages.length-1,n));redo=[];render();}
  $('#prev').onclick=()=>turn(page-1);$('#next').onclick=()=>turn(page+1);
  $('#add-page').onclick=()=>{if(active||job||blocked||doc.pages.length>=C.MAX_PAGES)return;doc.pages.push([]);page=doc.pages.length-1;changed();render();};
  function point(e){const box=canvas.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(C.WIDTH,(e.clientX-box.left)*C.WIDTH/box.width))),Math.round(Math.max(0,Math.min(C.HEIGHT,(e.clientY-box.top)*C.HEIGHT/box.height))),Math.round((e.pointerType==='pen'?Math.max(.05,Math.min(1,e.pressure||.5)):.5)*100)/100];}
  canvas.addEventListener('pointerdown',e=>{
    if(blocked||job||active||e.pointerType==='touch'&&!$('#finger').checked||e.button!==0&&!(e.pointerType==='pen'&&e.button===5))return;
    if(C.count(doc)>=C.MAX_POINTS||doc.pages[page].length>=3000){say('#save-status','当前原稿笔迹已达上限，请新建下一份作业。',true);return;}
    e.preventDefault();canvas.setPointerCapture(e.pointerId);
    const selectedTool=e.button===5?'eraser':tool;
    active={id:e.pointerId,stroke:{tool:selectedTool,width:selectedTool==='eraser'?28:Number($('#width').value),points:[point(e)]},remaining:C.MAX_POINTS-C.count(doc)-1};
    C.change(doc);dirty=true;redo=[];review();C.draw(canvas,[...doc.pages[page],active.stroke]);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!active||active.id!==e.pointerId)return;e.preventDefault();
    for(const p of e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e]){if(active.remaining<=0)break;active.stroke.points.push(point(p));active.remaining--;}
    C.draw(canvas,[...doc.pages[page],active.stroke]);
  });
  function end(e){if(!active||active.id!==e.pointerId)return;doc.pages[page].push(active.stroke);active=null;save();render();}
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(active)end({pointerId:active.id});else if(dirty)save();}});
  window.addEventListener('pagehide',()=>{job?.abort();if(active)end({pointerId:active.id});else if(dirty)save();});
  window.addEventListener('beforeunload',e=>{if(dirty||active){e.preventDefault();e.returnValue='';}});
  async function request(){
    if(job||active||blocked)return;
    if(!doc.prompt.trim()||!doc.pages.some(p=>p.some(s=>s.tool==='pen'))){say('#ai-status',essay?'请填写作文要求，并先写下作文。':'请填写完整题目，并先写下解答过程。',true);return;}
    if(!save()){say('#ai-status','请先成功保存原稿，再发送批改。',true);return;}
    const controller=new AbortController();job=controller;const revision=doc.revision,documentKey=key;
    const timer=setTimeout(()=>controller.abort(),115000);$('#cancel').hidden=false;$('#new').disabled=true;render();
    say('#ai-status','AI 正在逐页查看手写原稿并批改，请稍候…');
    try{
      const task=currentTask();
      const pages=doc.pages.map(strokes=>GrowingHandwritingAI.pageImage(strokes,C.draw));
      const result=await GrowingHandwritingAI.request({subject,unitId,prompt:doc.prompt,pages,...(task?{nodeIds:task.nodes}:{})},controller.signal);
      if(controller.signal.aborted||key!==documentKey||doc.revision!==revision)return;
      const g={...result,revision,at:new Date().toISOString()};
      if(task&&!g.needsReview&&!C.matchesKnowledge(g,task))throw Error('知识点评估不完整，本次不计分，请重新批改。');
      doc.grades=[...doc.grades,g].slice(-10);doc.updatedAt=new Date().toISOString();dirty=true;save();
      say('#ai-status',g.needsReview?'原稿部分内容需要复核，未生成分数。请按提示补充清晰内容后重新批改。':'手写原稿批改完成，可查看错误订正与关联知识点。');
    }catch(err){say('#ai-status',err.name==='AbortError'?'批改已取消或超时，原稿已保留，本次不计分。':err instanceof TypeError?'手写批改连接失败，请检查网络后重试；原稿已保留。':err.message,true);}
    finally{clearTimeout(timer);if(job===controller){job=null;$('#cancel').hidden=true;$('#new').disabled=false;render();}}
  }
  $('#grade').onclick=request;$('#cancel').onclick=()=>job?.abort();
  doc=C.create(subject,unitId,(params.get('prompt')||(tasks.find(t=>t.id===params.get('task'))||tasks[0])?.prompt||'').slice(0,6000));key=C.PREFIX+crypto.randomUUID();
  const requested=C.PREFIX+params.get('id');if(C.KEY.test(requested)){try{const d=JSON.parse(localStorage.getItem(requested));if(!C.validate(d)||d.unitId!==unitId)throw Error();doc=d;key=requested;}catch{blocked=true;say('#ai-status','该原稿无法读取，已停止覆盖。原记录保留，可从左侧新建另一份作业。',true);}}
  if(!C.KEY.test(requested))history.replaceState(null,'','?'+new URLSearchParams({subject,unit:unitId,id:key.slice(C.PREFIX.length)}));
  matchTask();render();archiveList();if(!C.KEY.test(requested)){dirty=true;save();}
})();
