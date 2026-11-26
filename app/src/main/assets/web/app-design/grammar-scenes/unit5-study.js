(()=>{
 'use strict';
 const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),unit=params.get('unit')||'english-8a-05',course=window.GrowingEnglishPointCourses?.get(unit),P=course?.practice||(unit==='english-8a-05'?window.GrowingUnit5Practice:null),L=course?.lessons||window.GrowingGrammarSceneLessons,embedded=params.get('embed')==='1',reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!P||!L)throw Error('当前单元的要点课程未加载');
 let lesson=Object.hasOwn(P.groups,params.get('lesson'))?params.get('lesson'):Object.keys(P.groups)[0],pointIndex=0,bridge=null,ready=!embedded,pending=false,blocked=false,raf=0,elapsed=0,last=0,end=0;
 const cache={},bases={};
 const clone=x=>JSON.parse(JSON.stringify(x)),key=()=>lesson+':'+point().id,point=()=>P.groups[lesson][pointIndex],step=()=>L[lesson].steps[pointIndex],record=()=>cache[key()];
 if(embedded)document.body.classList.add('embedded');
 function stop(){cancelAnimationFrame(raf);raf=0;$('pause').disabled=true;}
 function seek(t){const el=$('stage').querySelector('stick-scene');if(el?.v)STICK.at(el,{u:t/8,t});}
 function status(text,bad=false){$('save-status').textContent=text;$('save-status').hidden=!text;$('save-status').className=bad?'bad':'';$('retry-save').hidden=!pending;}
 function load(){
  blocked=false;
  try{
   const saved=bridge?bridge.read(lesson,point().id):cache[key()]||null;
   if(saved)P.validate(point(),saved);
   bases[key()]=clone(saved);cache[key()]=clone(saved||P.empty());
   status(bridge?'':embedded?'正在连接练习记录…':'独立预览：作答仅在本次打开期间保留。');
  }catch(error){blocked=true;cache[key()]=P.empty();status(error.message+'。请修复记录后重新打开课程。',true);}
 }
 function save(){
  try{
   if(!ready||blocked)throw Error('练习记录尚未连接或无法读取');
   if(bridge){const saved=bridge.write(lesson,point().id,clone(record()),clone(bases[key()]));cache[key()]=saved;bases[key()]=clone(saved);}
   else record().best=Math.max(record().best,P.score(point(),record()));
   pending=false;status(bridge?'':'独立预览：作答仅在本次打开期间保留。');return true;
  }catch(error){pending=true;status('未保存：'+error.message+'。当前答案保留，请重试。',true);return false;}
 }
 function renderQuestion(){
  const p=point(),r=record(),q=p.questions[r.index],a=r.answers[q.id],locked=!ready||blocked||pending;
  $('question').textContent=q.prompt;
  $('question-position').textContent=(r.index+1)+' / '+p.questions.length;
  const correct=P.score(p,r),checked=p.questions.filter(q=>r.answers[q.id]?.checked).length;
  $('score').textContent=correct+'/'+p.questions.length+' 正确'+(pending?' · 未保存':correct===10&&ready&&!blocked?' · 本要点通过':'');
  $('practice-title').textContent='练一练 · '+p.title;
  $('options').replaceChildren();
  q.options.forEach((option,i)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='answer';input.value=String(i);input.checked=a?.choice===i;input.disabled=locked||!!a?.checked;label.append(input,document.createTextNode(String.fromCharCode(65+i)+'. '+option));if(a?.checked&&i===q.answer)label.className='correct';else if(a?.checked&&i===a.choice)label.className='wrong';$('options').append(label);});
  $('check').hidden=!!a?.checked;$('check').disabled=locked;
  $('retry-question').hidden=!a?.checked;$('retry-question').disabled=locked;
  $('previous').disabled=locked||r.index===0;$('next').disabled=locked||r.index===p.questions.length-1;
  $('feedback').textContent=a?.checked?(a.choice===q.answer?'✓ 答对了。':'✗ 易错点：正确答案是 '+q.options[q.answer]+'。')+'\n'+q.explanation+(checked===10?'\n本轮 '+correct+'/10；全部正确后本要点通过。':''):'';
  $('feedback').className=a?.checked?(a.choice===q.answer?'good':'bad'):'';
  $('point-tabs').querySelectorAll('button').forEach(b=>b.disabled=pending);
  document.querySelectorAll('[data-lesson]').forEach(b=>b.disabled=pending);
 }
 function showPoint(index,focus=false){
  if(pending)return;
  stop();pointIndex=index;const p=point(),s=step();
  $('point-tabs').querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});
  $('point-panel').setAttribute('aria-labelledby','point-tab-'+p.id);
  $('rule').textContent=p.rule;$('sentence')[s.plainText?'textContent':'innerHTML']=s.sentence;$('translation').textContent=s.translation;$('explain')[s.plainText?'textContent':'innerHTML']=s.explain;$('pitfall').textContent=p.pitfall;
  $('stage').replaceChildren();ensureScene();$('play-status').textContent='';
  load();renderQuestion();
  if(focus){const tab=$('point-tabs').querySelector('[aria-selected=true]');tab.focus({preventScroll:true});tab.scrollIntoView({block:'nearest',inline:'nearest'});}
 }
 function showLesson(id){
  if(pending)return;
  lesson=id;$('back').href='english-course.html?unit='+encodeURIComponent(unit)+'&node=lesson:'+encodeURIComponent(id);
  document.querySelectorAll('[data-lesson]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lesson===id)));
  $('point-tabs').innerHTML=P.groups[id].map((p,i)=>`<button id="point-tab-${p.id}" role="tab" type="button" data-point="${i}" aria-controls="point-panel" aria-selected="false" tabindex="-1">${p.title}</button>`).join('');
  showPoint(0);
 }
 function ensureScene(){
  if(!$('stage').firstChild){const el=document.createElement('stick-scene');el.setAttribute('scene',step().scene||L[lesson].scene);el.setAttribute('play','idle');el.setAttribute('no-font','');el.setAttribute('no-floor','');$('stage').append(el);}
  seek(step().at*8);
 }
 $('play').addEventListener('click',()=>{
  stop();ensureScene();const s=step(),cuts=L[lesson].cuts;
  if(reduced.matches){seek(s.at*8);$('play-status').textContent='静态模式 · 当前要点关键画面';return;}
  elapsed=s.playFrom??(cuts?(pointIndex===0?0:cuts[pointIndex-1]):0);end=s.playUntil??(cuts?(cuts[pointIndex]??6.1)-.02:6.1);
  seek(elapsed);last=performance.now();$('pause').disabled=false;$('play-status').textContent='正在演示本要点';
  const tick=time=>{elapsed+=Math.min((time-last)/1000,.08);last=time;seek(Math.min(end,elapsed));if(elapsed>=end){stop();$('play-status').textContent='本要点演示结束';}else raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
 });
 $('pause').addEventListener('click',()=>{stop();$('play-status').textContent='已暂停';});
 $('point-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-point]');if(b)showPoint(Number(b.dataset.point));});
 $('point-tabs').addEventListener('keydown',e=>{if(pending)return;const count=P.groups[lesson].length,target=e.key==='ArrowRight'?(pointIndex+1)%count:e.key==='ArrowLeft'?(pointIndex+count-1)%count:e.key==='Home'?0:e.key==='End'?count-1:null;if(target!==null){e.preventDefault();showPoint(target,true);}});
 document.querySelector('.lesson-tabs').innerHTML=Object.entries(L).map(([id,l])=>`<button type="button" data-lesson="${id}">${l.tab}</button>`).join('');
 document.querySelector('.lesson-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-lesson]');if(b)showLesson(b.dataset.lesson);});
 $('options').addEventListener('change',e=>{if(pending||blocked||!ready)return;const q=point().questions[record().index];if(record().answers[q.id]?.checked)return;record().answers[q.id]={choice:Number(e.target.value),checked:false};save();renderQuestion();});
 $('practice-form').addEventListener('submit',e=>{e.preventDefault();if(pending||blocked||!ready)return;const q=point().questions[record().index],a=record().answers[q.id];if(!a){$('feedback').textContent='请先选择答案。';return;}if(a.checked)return;a.checked=true;save();renderQuestion();});
 $('retry-question').addEventListener('click',()=>{if(pending||blocked||!ready)return;delete record().answers[point().questions[record().index].id];save();renderQuestion();});
 for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{if(pending||blocked||!ready)return;record().index+=delta;save();renderQuestion();});
 $('retry-save').addEventListener('click',()=>{save();renderQuestion();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.addEventListener('pagehide',stop);window.addEventListener('beforeunload',e=>{if(pending){e.preventDefault();e.returnValue='';}});reduced.addEventListener('change',()=>{stop();ensureScene();});
 window.GrowingEnglishPointStudy=window.GrowingUnit5Study={connect(value){bridge=value;ready=true;load();renderQuestion();}};
 document.querySelector('h1').textContent='Unit '+Number(unit.split('-').at(-1))+' · 要点讲练';document.title=document.querySelector('h1').textContent;
 showLesson(lesson);
})();
