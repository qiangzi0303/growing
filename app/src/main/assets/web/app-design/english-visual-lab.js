(()=>{
  'use strict';
  const M=window.GrowingEnglishVisual,$=id=>document.getElementById(id),params=new URLSearchParams(location.search),reduce=matchMedia('(prefers-reduced-motion:reduce)');
  const initial=M.words.find(w=>w.id===params.get('word'));
  let group=initial?.group||(params.get('group')==='motion'?'motion':'space'),word=initial||M.words.find(w=>w.group===group),progress=.35,running=false,quizRunning=false,quizTime=.35,frame=0,previous=0,quizIndex=0,quizWord,quizOptions=[],quizAnswered=false,toast;
  const list=()=>M.words.filter(w=>w.group===group);
  const narrow=matchMedia('(max-width:520px)');
  const term=params.get('term')==='lower'?'lower':'upper';
  $('catalog-back').href='units.html?subject=english&term='+term;
  function announce(s){$('status').textContent=s;clearTimeout(toast);toast=setTimeout(()=>{$('status').textContent='';},4000);}
  function stop(){running=false;$('play').textContent='▶ 播放';$('play').setAttribute('aria-pressed','false');$('play-status').textContent='已暂停 · 可拖动进度';}
  function stopAll(){stop();quizRunning=false;$('quiz-play').textContent='▶ 播放题目动作';cancelAnimationFrame(frame);previous=0;}
  function paint(){
    const comparing=group==='motion'&&$('compare').checked;
    $('scene').classList.toggle('comparing',comparing);
    $('scene').innerHTML=comparing?M.compareSvg(word,$('reference').value,progress,narrow.matches):M.svg(word,progress,'main');$('progress').value=Math.round(progress*1000);$('progress-value').value=Math.round(progress*100)+'%';
  }
  function paintQuiz(){
    $('quiz-scene').innerHTML=M.svg(quizWord,quizTime,'quiz').replace(/aria-label="[^"]*"/,'aria-label="观察题目中的位置或动作，再选择英文表达"');
  }
  function quiz(){
    quizRunning=false;quizAnswered=false;quizTime=.35;$('quiz-play').textContent='▶ 播放题目动作';
    const entries=list(),index=(quizIndex*7+3)%entries.length;quizWord=entries[index];
    quizOptions=[entries[index],entries[(index+1)%entries.length],entries[(index+7)%entries.length]];
    const rotate=quizIndex%3;quizOptions=quizOptions.slice(rotate).concat(quizOptions.slice(0,rotate));
    $('quiz-answers').innerHTML=quizOptions.map((w,i)=>`<button type="button" data-answer="${i}" lang="en">${M.esc(w.word)}</button>`).join('');
    $('quiz-feedback').textContent='先播放，观察动作，再选择。';paintQuiz();
  }
  function render(){
    stopAll();progress=.35;
    for(const b of document.querySelectorAll('[data-group]'))b.setAttribute('aria-pressed',String(b.dataset.group===group));
    $('list-title').textContent=group==='space'?'空间关系':'行走与奔跑';
    $('word-list').innerHTML=list().map(w=>`<button type="button" data-word="${w.id}" ${w.id===word.id?'aria-current="true"':''}><strong lang="en">${M.esc(w.word)}</strong><span>${M.esc(w.zh)}</span></button>`).join('');
    $('word').textContent=word.word;$('word').lang='en';$('meaning').textContent=word.zh;
    $('word-index').textContent=group==='space'?'01 / SPATIAL RELATIONSHIPS':'02 / WAYS OF MOVING';
    $('scene-label').textContent=(group==='space'?'空间关系':'行走与奔跑')+' · 动态观察';
    $('motion-tools').hidden=group!=='motion';
    if(group==='motion'){
      $('reference').innerHTML=list().filter(w=>w!==word).map(w=>`<option value="${w.id}">${M.esc(w.word)} · ${M.esc(w.zh)}</option>`).join('');
      $('reference').value=M.motionProfiles[word.id].pair;
      $('motion-cue').textContent='看这里：'+M.motionProfiles[word.id].cue+'。地面标线显示前进速度。';
    }
    $('sentence').textContent=word.sentence;$('translation').textContent=word.translation;$('hint').textContent=word.hint;
    $('position').textContent=(list().indexOf(word)+1)+' / '+list().length;
    $('play-status').textContent='先观察，再播放';document.title=word.word+' · 英语动画记单词';
    try{history.replaceState(null,'','english-visual-lab.html?'+new URLSearchParams({group,word:word.id,term}));}catch(e){}
    paint();quiz();$('word-list').querySelector('[aria-current]').scrollIntoView({block:'nearest',inline:'nearest'});
  }
  function tick(now){
    const elapsed=previous?Math.min((now-previous)/1000,.1):0;previous=now;
    if(running){progress=(progress+elapsed*Number($('speed').value)/4)%1;paint();}
    if(quizRunning){quizTime=(quizTime+elapsed/4)%1;paintQuiz();}
    if(running||quizRunning)frame=requestAnimationFrame(tick);else previous=0;
  }
  function startLoop(){cancelAnimationFrame(frame);previous=0;frame=requestAnimationFrame(tick);}
  for(const b of document.querySelectorAll('[data-group]'))b.addEventListener('click',()=>{group=b.dataset.group;word=list()[0];quizIndex=0;render();});
  $('word-list').addEventListener('click',event=>{const b=event.target.closest('[data-word]');if(!b)return;word=M.words.find(w=>w.id===b.dataset.word);render();});
  $('play').addEventListener('click',()=>{if(running){stop();return;}running=true;$('play').textContent='Ⅱ 暂停';$('play').setAttribute('aria-pressed','true');$('play-status').textContent='循环演示中';startLoop();});
  $('step').addEventListener('click',()=>{stop();progress=(progress+.05)%1;paint();});
  $('reset').addEventListener('click',()=>{stop();progress=0;paint();});
  $('progress').addEventListener('input',()=>{stop();progress=Number($('progress').value)/1000;paint();});
  $('compare').addEventListener('change',paint);$('reference').addEventListener('change',paint);narrow.addEventListener('change',paint);
  for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{const entries=list();word=entries[(entries.indexOf(word)+delta+entries.length)%entries.length];render();});
  $('quiz-play').addEventListener('click',()=>{quizRunning=!quizRunning;$('quiz-play').textContent=quizRunning?'Ⅱ 暂停题目':'▶ 播放题目动作';if(quizRunning)startLoop();});
  $('quiz-answers').addEventListener('click',event=>{const b=event.target.closest('[data-answer]');if(!b||quizAnswered)return;quizAnswered=true;
    const chosen=quizOptions[Number(b.dataset.answer)];for(const button of $('quiz-answers').children){button.className=quizOptions[Number(button.dataset.answer)]===quizWord?'correct':button===b?'wrong':'';button.setAttribute('aria-disabled','true');}
    $('quiz-feedback').textContent=(chosen===quizWord?'答对了。':'再对照观察。')+quizWord.word+'：'+quizWord.zh+'。'+quizWord.translation;
  });
  $('quiz-next').addEventListener('click',()=>{quizIndex++;quiz();});
  $('quiz-toggle').addEventListener('click',()=>{const hidden=!$('quiz-content').hidden;$('quiz-content').hidden=hidden;$('quiz-toggle').textContent=hidden?'展开':'收起';$('quiz-toggle').setAttribute('aria-expanded',String(!hidden));if(hidden){quizRunning=false;$('quiz-play').textContent='▶ 播放题目动作';}});
  $('pronounce').addEventListener('click',()=>{
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){announce('当前设备不支持发音，可以先看动画、读例句。');return;}
    const voice=speechSynthesis.getVoices().find(v=>/^en[-_]/i.test(v.lang));
    if(!voice){announce('设备暂未提供英语语音，可以先看动画、读例句。');return;}
    speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(word.word);utterance.lang=voice.lang;utterance.voice=voice;utterance.rate=.85;utterance.onerror=()=>announce('发音暂不可用，请检查设备英语语音。');speechSynthesis.speak(utterance);
  });
  if('speechSynthesis' in window)speechSynthesis.getVoices();
  $('help-open').addEventListener('click',()=>{stopAll();$('help').showModal();});$('help-close').addEventListener('click',()=>$('help').close());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});window.addEventListener('pagehide',()=>{stopAll();if('speechSynthesis' in window)speechSynthesis.cancel();});reduce.addEventListener('change',stopAll);
  render();
})();
