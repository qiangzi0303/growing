(()=>{
  'use strict';
  const M=window.GrowingMathLab,D=window.GrowingMath,$=id=>document.getElementById(id),esc=M.esc;
  const params=new URLSearchParams(location.search);
  let chapter=D.chapters.find(c=>c.id===params.get('chapter'))||D.chapters[0];
  let experiment=M.experiments.find(e=>e.chapter===chapter.number&&(e.id===params.get('experiment')||e.nodes.includes(params.get('node'))))||M.experiments.find(e=>e.chapter===chapter.number);
  let state=M.defaults(experiment),running=false,frame=0,previous=0,progress=0,quizHidden=false,toastTimer;
  const reduce=window.matchMedia('(prefers-reduced-motion:reduce)');
  function stop(){running=false;cancelAnimationFrame(frame);previous=0;$('play').textContent='▶ 播放变化';$('play').setAttribute('aria-pressed','false');$('animation-status').textContent='手动探索';$('conclusion').setAttribute('aria-live','polite');}
  function announce(message){$('status').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('status').textContent='';},3500);}
  function update(fromAnimation=false){
    const model=M.evaluate(experiment,state);
    $('diagram').innerHTML=model.svg;$('scene-title').textContent=experiment.name;$('scene-description').textContent=experiment.goal+' '+model.stats.map(p=>p.join('：')).join('；');
    $('stats').innerHTML=model.stats.map(([label,value])=>`<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
    // Keep the visible explanation current, without announcing every animation frame.
    if(fromAnimation)$('conclusion').setAttribute('aria-live','off');
    $('conclusion').textContent=model.conclusion;
    for(const c of experiment.controls){$('input-'+c.key).value=state[c.key];$('value-'+c.key).textContent=state[c.key];}
  }
  function render(){
    stop();state=M.defaults(experiment);
    document.title=experiment.name+' · 数学交互实验室';
    $('chapter').innerHTML=D.chapters.map(c=>`<option value="${c.id}" ${c.id===chapter.id?'selected':''}>${c.term==='upper'?'上册':'下册'} · 第${c.number}章 ${esc(c.title)}</option>`).join('');
    $('experiments').innerHTML=M.experiments.filter(e=>e.chapter===chapter.number).map(e=>`<button type="button" data-experiment="${e.id}" ${e.id===experiment.id?'aria-current="page"':''}>${esc(e.name)}<small>调参 · 动画 · 预测小测</small></button>`).join('');
    if(chapter.number===1)$('experiments').insertAdjacentHTML('beforeend','<a class="center-lab-link" href="triangle-centers.html">三角形的四心<small>内心 · 外心 · 重心 · 垂心 / 拖拽与动画</small></a>');
    $('chapter-label').textContent=`苏科版 · 八年级${chapter.term==='upper'?'上':'下'}册 / 第${chapter.number}章 ${chapter.title}`;
    $('lab-title').textContent=experiment.name;$('goal').textContent=experiment.goal;
    $('course-back').href=chapter.number===10?'../fraction-ops/分式作战_一分钟学习版.html':'math-course.html?'+new URLSearchParams({chapter:chapter.id,node:experiment.nodes[0]});
    $('controls').innerHTML=experiment.controls.map(c=>`<div class="control"><label for="input-${c.key}"><span>${esc(c.label)}</span><output id="value-${c.key}" for="input-${c.key}">${c.value}</output></label><input id="input-${c.key}" data-key="${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"></div>`).join('');
    $('animate-key').innerHTML=experiment.controls.map(c=>`<option value="${c.key}">${esc(c.label)}</option>`).join('');
    $('question').textContent=experiment.question;
    $('choices').innerHTML=experiment.choices.map((c,i)=>`<button type="button" data-answer="${i}">${'ABC'[i]} · ${esc(c)}</button>`).join('');
    $('feedback').textContent='先猜一猜，再用参数验证。';
    $('quiz').hidden=quizHidden;$('quiz-open').hidden=!quizHidden;
    try{history.replaceState(null,'','math-explore-lab.html?'+new URLSearchParams({chapter:chapter.id,experiment:experiment.id}));}catch(error){}
    update();
    $('experiments').querySelector('[aria-current]')?.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  function adjust(key,value){const c=experiment.controls.find(c=>c.key===key);state[key]=Number(Math.max(c.min,Math.min(c.max,c.min+Math.round((value-c.min)/c.step)*c.step)).toFixed(6));}
  function tick(now){
    if(!running)return;
    const c=experiment.controls.find(c=>c.key===$('animate-key').value),elapsed=previous?Math.min((now-previous)/1000,.1):0;previous=now;
    progress=(progress+elapsed*Number($('speed').value)/8)%2;
    adjust(c.key,c.min+(c.max-c.min)*(progress<=1?progress:2-progress));update(true);frame=requestAnimationFrame(tick);
  }
  $('chapter').addEventListener('change',()=>{chapter=D.chapters.find(c=>c.id===$('chapter').value);experiment=M.experiments.find(e=>e.chapter===chapter.number);render();});
  $('experiments').addEventListener('click',event=>{const button=event.target.closest('[data-experiment]');if(!button)return;experiment=M.experiments.find(e=>e.id===button.dataset.experiment);render();});
  $('controls').addEventListener('input',event=>{const key=event.target.dataset.key;if(!key)return;stop();adjust(key,Number(event.target.value));update();});
  $('animate-key').addEventListener('change',stop);
  $('play').addEventListener('click',()=>{if(running){stop();update();return;}const c=experiment.controls.find(c=>c.key===$('animate-key').value);progress=(state[c.key]-c.min)/(c.max-c.min);running=true;previous=0;$('play').textContent='Ⅱ 暂停';$('play').setAttribute('aria-pressed','true');$('animation-status').textContent='循环改变：'+c.label;frame=requestAnimationFrame(tick);});
  $('step').addEventListener('click',()=>{stop();const c=experiment.controls.find(c=>c.key===$('animate-key').value);adjust(c.key,state[c.key]>=c.max?c.min:state[c.key]+c.step);update();});
  $('reset').addEventListener('click',()=>{stop();state=M.defaults(experiment);update();announce('已恢复本实验的初始条件。');});
  $('random').addEventListener('click',()=>{stop();for(const c of experiment.controls)adjust(c.key,c.min+Math.random()*(c.max-c.min));update();announce('换一组条件，先预测结果再观察。');});
  $('choices').addEventListener('click',event=>{const button=event.target.closest('[data-answer]');if(!button)return;const correct=Number(button.dataset.answer)===experiment.answer;for(const b of $('choices').children)b.className=Number(b.dataset.answer)===experiment.answer?'correct':b===button?'wrong':'';$('feedback').textContent=(correct?'预测正确。':'再观察一下。')+experiment.explain;});
  $('quiz-hide').addEventListener('click',()=>{quizHidden=true;$('quiz').hidden=true;$('quiz-open').hidden=false;$('quiz-open').focus();});
  $('quiz-open').addEventListener('click',()=>{quizHidden=false;$('quiz').hidden=false;$('quiz-open').hidden=true;$('quiz-hide').focus();});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(error){announce('当前环境不支持全屏，可使用浏览器全屏功能。');}});
  $('about').addEventListener('click',()=>{$('about-dialog').showModal();});$('about-close').addEventListener('click',()=>{$('about-dialog').close();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();update();}});window.addEventListener('pagehide',stop);
  reduce.addEventListener('change',()=>{stop();update();});
  render();
})();
