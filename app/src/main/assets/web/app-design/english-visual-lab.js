(()=>{
  'use strict';
  const M=window.GrowingEnglishVisual,$=id=>document.getElementById(id),params=new URLSearchParams(location.search),reduce=matchMedia('(prefers-reduced-motion:reduce)');
  const initial=M.words.find(w=>w.id===params.get('word'));
  let group=initial?.group||(params.get('group')==='motion'?'motion':'space'),word=initial||M.words.find(w=>w.group===group),progress=0,frame=0,previous=0,away=false,toast;
  const list=()=>M.words.filter(w=>w.group===group);
  const narrow=matchMedia('(max-width:520px)');
  const term=params.get('term')==='lower'?'lower':'upper';
  $('catalog-back').href='units.html?subject=english&term='+term;
  function announce(s){$('status').textContent=s;clearTimeout(toast);toast=setTimeout(()=>{$('status').textContent='';},4000);}
  function stopAll(){cancelAnimationFrame(frame);frame=0;previous=0;}
  function paint(){
    const comparing=group==='motion'&&$('compare').checked;
    $('scene').classList.toggle('comparing',comparing);
    $('scene').innerHTML=comparing?M.compareSvg(word,$('reference').value,progress,narrow.matches):M.svg(word,progress,'main');
  }
  function render(){
    stopAll();progress=0;
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
    $('quiz-link').href='english-visual-quiz.html?'+new URLSearchParams({group,word:word.id,term});
    document.title=word.word+' · 英语动画记单词';
    try{history.replaceState(null,'','english-visual-lab.html?'+new URLSearchParams({group,word:word.id,term}));}catch(e){}
    paint();startLoop();$('word-list').querySelector('[aria-current]').scrollIntoView({block:'nearest',inline:'nearest'});
  }
  function tick(now){
    const elapsed=previous?Math.min((now-previous)/1000,.1):0;previous=now;
    progress=(progress+elapsed*(reduce.matches?.5:1)/4)%1;paint();
    frame=requestAnimationFrame(tick);
  }
  function startLoop(){stopAll();$('play-status').textContent=reduce.matches?'自动慢速循环':'自动循环播放';if(!document.hidden&&!away&&!$('help').open)frame=requestAnimationFrame(tick);}
  for(const b of document.querySelectorAll('[data-group]'))b.addEventListener('click',()=>{group=b.dataset.group;word=list()[0];render();});
  $('word-list').addEventListener('click',event=>{const b=event.target.closest('[data-word]');if(!b)return;word=M.words.find(w=>w.id===b.dataset.word);render();});
  $('compare').addEventListener('change',paint);$('reference').addEventListener('change',paint);narrow.addEventListener('change',paint);
  for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{const entries=list();word=entries[(entries.indexOf(word)+delta+entries.length)%entries.length];render();});
  $('pronounce').addEventListener('click',()=>{
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){announce('当前设备不支持发音，可以先看动画、读例句。');return;}
    const voice=speechSynthesis.getVoices().find(v=>/^en[-_]/i.test(v.lang));
    if(!voice){announce('设备暂未提供英语语音，可以先看动画、读例句。');return;}
    speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(word.word);utterance.lang=voice.lang;utterance.voice=voice;utterance.rate=.85;utterance.onerror=()=>announce('发音暂不可用，请检查设备英语语音。');speechSynthesis.speak(utterance);
  });
  if('speechSynthesis' in window)speechSynthesis.getVoices();
  $('help-open').addEventListener('click',()=>{stopAll();$('help').showModal();});$('help-close').addEventListener('click',()=>$('help').close());
  $('help').addEventListener('close',startLoop);
  document.addEventListener('visibilitychange',startLoop);window.addEventListener('pagehide',()=>{away=true;stopAll();if('speechSynthesis' in window)speechSynthesis.cancel();});window.addEventListener('pageshow',()=>{away=false;startLoop();});reduce.addEventListener('change',startLoop);
  render();
})();
