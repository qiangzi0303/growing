(()=>{
  'use strict';
  const M=window.GrowingEnglishVisual,$=id=>document.getElementById(id),params=new URLSearchParams(location.search),reduce=matchMedia('(prefers-reduced-motion:reduce)');
  const origin=M.words.find(w=>w.id===params.get('word')),term=params.get('term')==='lower'?'lower':'upper';
  let group=origin?.group||(params.get('group')==='motion'?'motion':'space'),word,options=[],answered=false,progress=0,frame=0,previous=0,away=false,queue=[];
  const shuffled=entries=>entries.map(value=>({value,sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(x=>x.value);
  const back='english-visual-lab.html?'+new URLSearchParams({group,word:origin?.id||M.words.find(w=>w.group===group).id,term});
  $('learn-back').href=back;$('review-link').href=back;
  function paint(){
    $('quiz-scene').innerHTML=M.svg(word,progress,'quiz');
    const svg=$('quiz-scene').firstElementChild;
    svg.querySelectorAll('text,title,desc').forEach(el=>el.remove());
    svg.setAttribute('aria-label','观察位置或动作，选择对应的英文表达');
    if(group==='motion')svg.setAttribute('viewBox','160 40 320 280');
  }
  function stop(){cancelAnimationFrame(frame);frame=0;previous=0;}
  function tick(now){const elapsed=previous?Math.min((now-previous)/1000,.1):0;previous=now;progress=(progress+elapsed*(reduce.matches?.5:1)/4)%1;paint();frame=requestAnimationFrame(tick);}
  function resume(){stop();$('quiz-status').textContent=reduce.matches?'自动慢速循环':'自动循环播放';if(!document.hidden&&!away)frame=requestAnimationFrame(tick);}
  function question(){
    const entries=M.words.filter(w=>w.group===group);
    if(!queue.length){queue=shuffled(entries);if(queue.at(-1)===word)queue.unshift(queue.pop());}
    word=queue.pop();options=shuffled([word,...shuffled(entries.filter(w=>w!==word)).slice(0,2)]);answered=false;progress=0;
    $('quiz-answers').innerHTML=options.map((w,i)=>`<button type="button" data-answer="${i}" lang="en">${M.esc(w.word)}</button>`).join('');
    $('quiz-feedback').textContent='请选择一个表达。';
    for(const b of document.querySelectorAll('[data-group]'))b.setAttribute('aria-pressed',String(b.dataset.group===group));
    paint();resume();
  }
  $('quiz-answers').addEventListener('click',event=>{
    const b=event.target.closest('[data-answer]');if(!b||answered)return;answered=true;
    const chosen=options[Number(b.dataset.answer)];
    for(const button of $('quiz-answers').children){button.className=options[Number(button.dataset.answer)]===word?'correct':button===b?'wrong':'';button.disabled=true;}
    $('quiz-feedback').textContent=(chosen===word?'答对了！':'再观察一下。正确表达是 ')+word.word+'：'+word.zh+'。'+word.hint;
  });
  $('quiz-next').addEventListener('click',question);
  for(const b of document.querySelectorAll('[data-group]'))b.addEventListener('click',()=>{group=b.dataset.group;queue=[];question();});
  document.addEventListener('visibilitychange',resume);window.addEventListener('pagehide',()=>{away=true;stop();});window.addEventListener('pageshow',()=>{away=false;resume();});reduce.addEventListener('change',resume);
  question();
})();
