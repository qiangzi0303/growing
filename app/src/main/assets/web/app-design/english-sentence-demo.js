(()=>{
 const startLegacy=()=>{
  'use strict';
  const D=window.SentenceDemo,P=window.EnglishSentenceProgress,root=document.getElementById('sentence-app');
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(text,action,extra='')=>`<button type="button" data-action="${action}" ${extra}>${text}</button>`;
  const params=new URLSearchParams(location.search),practice=D.getPractice(params.get('unit'),params.get('topic'));
  const unitHref=unit=>'english-sentence-demo.html?unit='+encodeURIComponent(unit.id);
  if(practice.unit){
    document.title=`Unit ${practice.unit.number} · ${practice.topic?.title||'句子闯关'} · 逆流英语`;
    document.querySelector('.brand span').textContent=`Unit ${practice.unit.number} · ${practice.topic?.title||practice.unit.title}`;
    const back=document.querySelector('.back-link');back.href=practice.backHref;back.textContent='返回 Unit '+practice.unit.number;
  }
  if(practice.error){
    root.innerHTML=`<main class="sheet" id="workspace"><section class="results"><h1>暂时无法开始练习</h1><p>${esc(practice.error)}</p><div class="result-actions">${practice.unit?`<a href="${esc(unitHref(practice.unit))}">重新选择知识点</a>`:''}<a href="units.html?subject=english&amp;term=upper">返回英语目录</a></div></section></main>`;
    return;
  }
  const progressKey=P.key(practice.unit.id),readProgress=()=>P.restore(JSON.parse(localStorage.getItem(progressKey)||'null'));
  let progressMessage='',pending=[];
  const progressNotice=()=>progressMessage?`<p role="status">${esc(progressMessage)} ${button('重试保存','save-progress')}</p>`:'';
  function saveProgress(){
    try{
      let saved=readProgress();for(const item of pending)saved=P.complete(saved,item.sentence,item.result,item.at);
      localStorage.setItem(progressKey,JSON.stringify(saved));pending=[];progressMessage='';
    }catch(error){progressMessage='句子完成记录暂未保存：'+error.message+'。请保持页面打开，恢复存储后重试。';}
  }
  const backNavigation=`<nav class="practice-nav" aria-label="返回导航">${practice.topic?`<a href="${esc(unitHref(practice.unit))}"><span aria-hidden="true">←</span> 返回知识点</a>`:''}<a href="${esc(practice.backHref)}"><span aria-hidden="true">←</span> 返回课堂</a></nav>`;
  if(!practice.topic){
    let saved;try{saved=readProgress();}catch(error){progressMessage=error.message;}
    const progress=P.summary(practice.unit.topics.flatMap(t=>t.sentences),saved);
    root.innerHTML=`<main class="sheet" id="workspace">${backNavigation}<section class="results topic-picker"><p class="topic-eyebrow">八年级上册 · 句子闯关</p><h1>Unit ${practice.unit.number} · ${esc(practice.unit.title)}</h1><p>句子互动已完成 <strong class="topic-completed-count">${progress.completed}</strong>/${progress.total} 项</p>${progressMessage?`<p role="status">${esc(progressMessage)}</p>`:''}<ul class="topic-list">${practice.unit.topics.map(t=>{
      const status=P.summary(t.sentences,saved),complete=status.total>0&&status.completed===status.total;
      return `<li><a${complete?' class="is-complete"':''} href="${esc(unitHref(practice.unit))}&amp;topic=${encodeURIComponent(t.id)}" aria-label="${esc(t.title)}，已完成 ${status.completed}/${status.total}句"><strong>${esc(t.title)}</strong>${complete?'<span class="topic-check" aria-hidden="true">✓</span>':''}</a></li>`;
    }).join('')}</ul></section></main>`;
    return;
  }
  const selectedSentences=practice.sentences;
  const emptyRecord=()=>({wrong:0,hints:0,revealed:false});
  const touchTyping=window.matchMedia('(pointer: coarse)').matches;
  let round=D.createRound(selectedSentences),phase='preview',words=[],wordIndex=0,draft='',record,task;
  let phaseDone=false,showResults=false,answerOpen=false,composing=false,credited=false;
  let message='',audioStatus='',speechToken=0,combo=0,bestCombo=0,score=0,rating='';
  const current=()=>round.sentences[round.index];
  const expected=()=>phase==='word'?words[wordIndex].en:current().en;
  const focusAction=action=>root.querySelector(`[data-action="${action}"]`)?.focus({preventScroll:true});
  function stopSpeech(){speechToken++;if('speechSynthesis' in window)speechSynthesis.cancel();}
  function resetTask(){
    stopSpeech();draft='';task=emptyRecord();phaseDone=false;answerOpen=false;composing=false;credited=false;message='';audioStatus='';rating='';
  }
  function resetSentence(){record=emptyRecord();words=D.wordPrompts(current());wordIndex=0;phase='preview';resetTask();}
  function header(){
    const total=words.length+1,index=phase==='sentence'?words.length:wordIndex,done=showResults?total:index;
    return `${backNavigation}${progressNotice()}<div class="progress-line"><span>${showResults?'本轮练习完成':`用键盘输入英文，按空格确认（${index+1}/${total}）`}</span><strong id="points" aria-label="本轮练习积分">${score}</strong><span id="combo" class="sr-only">${combo}</span></div><div class="progress-inset"><div class="progress-track" role="progressbar" aria-label="当前句子练习进度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><div class="progress-fill" style="width:${done/total*100}%"></div></div></div>`;
  }
  function wordMarkup(word){
    const posClass=/动词|动名词|系动词/.test(word.pos)?'verb':word.pos==='代词'?'pronoun':word.pos==='形容词'?'adjective':word.pos==='名词'?'noun':word.pos==='副词'?'adverb':'other';
    return `<span class="word-detail ${posClass}"><span class="phonetic">/${esc(word.ipa)}/</span><span class="word-english" lang="en">${esc(word.en)}</span><span class="word-meaning">${esc(word.gloss)}</span><span class="word-pos">${esc(word.pos)}</span></span>`;
  }
  function grammarMarkup(single=false){
    let groups=D.grammarGroups(current());
    if(single){let offset=0;groups=groups.flatMap(group=>{const selected=wordIndex>=offset&&wordIndex<offset+group.words.length;offset+=group.words.length;return selected?[{role:group.role,words:[words[wordIndex]]}]:[];});}
    return `<div class="sentence-analysis" lang="en">${groups.map(group=>`<div class="grammar-group" data-role="${group.role}"><span class="role-label" lang="zh">${group.role}</span>${group.words.map(wordMarkup).join('')}</div>`).join('')}</div>`;
  }
  function mirrorMarkup(){
    const targets=phase==='word'?[expected()]:words.map(word=>word.en),typed=phase==='word'?[draft.trim()]:draft.trimStart().split(/\s+/);
    return targets.map((target,index)=>{
      const value=typed[index]||'',state=D.typingState(target,value);
      return `<span class="word-input ${state}"><span class="word-width">${esc(target)}</span><span class="typed-word">${esc(value)}</span></span>`;
    }).join('')+(typed.length>targets.length?`<span class="word-input wrong"><span class="typed-word">${esc(typed.slice(targets.length).join(' '))}</span></span>`:'');
  }
  function skeleton(){
    return `<main class="sheet" id="workspace"><header id="practice-header"></header><section class="exercise" aria-labelledby="exercise-title"><div class="exercise-center"><div class="exercise-body"><p class="stage-label sr-only"></p><div id="preview-prompt"></div><div id="answer-view"></div><h1 class="prompt" id="exercise-title" tabindex="-1"></h1><div class="guide-hint"></div><form id="answer-form"><label class="sr-only" for="typing-answer">输入对应的英文</label><div class="typing-surface"><div class="typing-mirror" aria-hidden="true"></div><textarea id="typing-answer" name="answer" lang="en" inputmode="text" rows="1" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="300"></textarea></div></form><div class="revealed-answer" lang="en"></div><p class="feedback sr-only" role="status"></p><p class="rating" aria-hidden="true"></p></div></div><div class="support-actions"></div><p class="audio-status" role="status"></p></section></main>`;
  }
  function results(){
    const r=D.summary(round),needs=round.results.filter(x=>x.points<100);
    return `<section class="results" aria-labelledby="result-title"><h1 id="result-title" tabindex="-1">本轮练习完成</h1><p>Unit ${practice.unit.number} · ${esc(practice.topic.title)}</p><div class="result-metrics"><p>独立完成<strong>${r.independent} / ${r.total}</strong></p><p>最高连击<strong>${bestCombo}</strong></p><p>练习积分<strong>${score}</strong></p></div><div class="result-actions">${needs.length?button('重练需巩固的 '+needs.length+' 句','retry','class="primary"'):button('再来一轮','restart','class="primary"')}${needs.length?button('全部重练','restart'):''}<a href="${esc(unitHref(practice.unit))}">切换知识点</a><a href="${esc(practice.backHref)}">返回 Unit ${practice.unit.number}</a></div><ul class="result-list">${round.results.map((result,i)=>{const s=round.sentences[i];return `<li><div><strong>${esc(s.title)}</strong><p class="en" lang="en">${esc(s.en)}</p><p>${esc(s.zh)}</p></div><span class="result-status">${result.revealed?'看过答案':result.wrong?'订正后完成':'独立完成'}</span><details><summary>句型解析</summary><p>${esc(s.explanation)}</p></details></li>`;}).join('')}</ul><details class="rules"><summary>关于本次练习</summary><p>每个单词及整句各算一题。首答正确得1000分，错误后订正得300分，看过答案的题不计分；重答不重复加分。首答正确增加连击，错误或看答案中断连击。每句开始时重置句内进度，积分累计到本轮结束。</p><p>本题组为 Unit ${practice.unit.number}「${esc(practice.topic.title)}」的原创练习；刷新重开，积分不写入课程成绩或奖励。</p></details></section>`;
  }
  function render(focus){
    if(showResults){root.innerHTML=`<main class="sheet" id="workspace"><header id="practice-header">${header()}</header>${results()}</main>`;}
    else{
      // Keep the editor attached through submit, answer toggle, redo and the next task.
      if(!document.getElementById('typing-answer'))root.innerHTML=skeleton();
      document.getElementById('practice-header').innerHTML=header();
      const preview=phase==='preview',solved=phaseDone,section=root.querySelector('.exercise');
      section.className='exercise '+(preview?'is-preview':solved?'is-solved':'is-typing');section.dataset.phase=phase;
      root.querySelector('.stage-label').textContent=phase==='sentence'?'整句挑战':'逐词打字';
      document.getElementById('preview-prompt').innerHTML=preview?button('按任意键，开始造这个句子','start'):'';
      document.getElementById('answer-view').innerHTML=preview||solved?grammarMarkup(!preview&&phase==='word'):'';
      document.getElementById('exercise-title').textContent=phase==='word'?words[wordIndex].gloss:current().zh;
      root.querySelector('.guide-hint').innerHTML=!preview&&!solved&&round.index===0&&wordIndex===0&&phase==='word'?`在键盘上输入 <strong lang="en">${esc(expected())}</strong>`:'';
      const input=document.getElementById('typing-answer');
      input.value=draft;input.readOnly=solved&&!touchTyping;input.className='typing-input '+(preview?'empty':D.typingState(expected(),draft));
      input.setAttribute('aria-label',phase==='sentence'?'输入完整的英文句子':'输入对应的英文单词');
      if(message&&!solved)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');
      root.querySelector('.typing-mirror').innerHTML=preview?'':mirrorMarkup();
      root.querySelector('.revealed-answer').textContent=answerOpen&&!solved?expected():'';
      root.querySelector('.feedback').textContent=message;
      root.querySelector('.rating').textContent=solved?rating:'';
      root.querySelector('.support-actions').innerHTML=preview?'':button('播放发音','speak')+(solved?button('下一题','next')+button('重答','redo'):button('提交','submit')+button(answerOpen?'隐藏答案':'显示答案','reveal',`aria-expanded="${answerOpen}"`));
      root.querySelector('.audio-status').textContent=audioStatus;
    }
    if(focus){const target=document.getElementById(focus);target?.focus({preventScroll:true});if(focus==='typing-answer')target?.setSelectionRange(draft.length,draft.length);}
  }
  function start(){phase='word';resetTask();render('typing-answer');}
  function advance(){
    if(!phaseDone)return;
    if(phase==='word'){
      if(wordIndex+1<words.length)wordIndex++;else phase='sentence';
      resetTask();render('typing-answer');return;
    }
    if(D.next(round)){resetSentence();render();}else{stopSpeech();showResults=true;render('result-title');}
  }
  function submit(){
    if(phaseDone||showResults||phase==='preview'||composing)return;
    if(!draft.trim()){message='先输入英文';render('typing-answer');return;}
    if(D.typingState(expected(),draft)!=='correct'){
      if(!credited){record.wrong++;task.wrong++;combo=0;}
      message=phase==='sentence'?D.feedback(current(),draft):'拼写还不正确，请修改后再次提交。';render('typing-answer');return;
    }
    phaseDone=true;const independent=!task.wrong&&!task.revealed;
    if(!credited){score+=task.revealed?0:task.wrong?300:1000;combo=independent?combo+1:0;bestCombo=Math.max(bestCombo,combo);credited=true;}
    rating=task.revealed?'':independent?'Perfect':'Good';message=rating||'已完成';
    if(phase==='sentence'&&D.complete(round,record)){pending.push({sentence:current(),result:{...record},at:Date.now()});saveProgress();}
    render(touchTyping?'typing-answer':undefined);if(!touchTyping)focusAction('next');
  }
  function reveal(){
    if(phaseDone)return;answerOpen=!answerOpen;
    if(answerOpen&&!credited){record.revealed=true;task.revealed=true;combo=0;}
    render('typing-answer');
  }
  function redo(){
    if(!phaseDone)return;stopSpeech();phaseDone=false;draft='';answerOpen=false;message='';rating='';audioStatus='';render('typing-answer');
  }
  function speak(){
    const voice=window.speechSynthesis?.getVoices().find(v=>/^en[-_]/i.test(v.lang));
    if(!voice||!('SpeechSynthesisUtterance' in window)){audioStatus='当前设备没有可用的英语朗读声音。';render();return;}
    stopSpeech();const token=speechToken,utterance=new SpeechSynthesisUtterance(expected());
    utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.9;
    utterance.onend=()=>{if(token===speechToken){audioStatus='';root.querySelector('.audio-status')?.replaceChildren();}};
    utterance.onerror=()=>{if(token===speechToken){audioStatus='本次朗读未能完成，请重试。';root.querySelector('.audio-status')?.replaceChildren(document.createTextNode(audioStatus));}};
    try{speechSynthesis.speak(utterance);}catch{audioStatus='本次朗读未能开始，请重试。';render();}
  }
  root.addEventListener('pointerdown',event=>{if(touchTyping&&event.target.closest('.support-actions button'))event.preventDefault();});
  root.addEventListener('click',event=>{
    const el=event.target.closest('button[data-action]');if(!el)return;const action=el.dataset.action;
    if(action==='save-progress'){saveProgress();render();return;}
    if(action==='restart'||action==='retry'){
      const list=action==='retry'?round.sentences.filter((s,i)=>round.results[i]?.points<100):selectedSentences;
      round=D.createRound(list);showResults=false;combo=0;bestCombo=0;score=0;resetSentence();render();window.scrollTo({top:0,behavior:'instant'});return;
    }
    if(showResults)return;
    if(action==='start')start();if(action==='next')advance();if(action==='submit')submit();
    if(action==='reveal')reveal();if(action==='redo')redo();if(action==='speak')speak();
  });
  root.addEventListener('compositionstart',event=>{if(event.target.id==='typing-answer')composing=true;});
  root.addEventListener('compositionend',event=>{if(event.target.id==='typing-answer'){composing=false;if(phaseDone){event.target.value=draft;return;}draft=event.target.value;updateTyping();}});
  function updateTyping(){
    const input=document.getElementById('typing-answer');if(!input)return;
    input.className='typing-input '+D.typingState(expected(),draft);input.removeAttribute('aria-invalid');
    root.querySelector('.typing-mirror').innerHTML=mirrorMarkup();root.querySelector('.feedback').textContent='';message='';
  }
  function confirmsNext(event){
    const inserted=event.data??(event.target.value.startsWith(draft)?event.target.value.slice(draft.length):'');
    return event.inputType==='insertLineBreak'||event.inputType==='insertParagraph'||/^[ \r\n]+$/.test(inserted);
  }
  // Soft keyboards may send input events without a usable keydown.
  root.addEventListener('beforeinput',event=>{
    if(event.target.id!=='typing-answer'||!phaseDone||composing||event.isComposing||!event.cancelable)return;
    if(confirmsNext(event)){event.preventDefault();advance();}
  });
  root.addEventListener('input',event=>{
    if(event.target.id!=='typing-answer')return;
    if(phaseDone){
      const next=!composing&&!event.isComposing&&confirmsNext(event);
      event.target.value=draft;if(next)advance();return;
    }
    draft=event.target.value;
    if(composing||event.isComposing)return;updateTyping();
    // Some mobile keyboards insert a space without sending keydown.
    if(/\s$/.test(draft)&&(phase==='word'||D.typingState(expected(),draft)==='correct'))submit();
  });
  root.addEventListener('keydown',event=>{
    if(event.repeat&&(event.key==='Enter'||event.key===' ')){event.preventDefault();return;}
    if(event.target.id!=='typing-answer'||event.isComposing||composing||event.keyCode===229)return;
    if(phaseDone&&(event.key==='Enter'||event.key===' ')){event.preventDefault();advance();return;}
    if(event.key==='Enter'||event.key===' '&&(phase==='word'||D.typingState(expected(),draft)==='correct')){event.preventDefault();submit();}
  });
  root.addEventListener('submit',event=>{if(event.target.id==='answer-form'){event.preventDefault();submit();}});
  document.addEventListener('keydown',event=>{
    if(showResults||phase!=='preview'||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.repeat||event.key.length!==1&&event.key!=='Enter'||event.target.closest('a,input,textarea,summary'))return;
    event.preventDefault();start();
  });
  window.addEventListener('pagehide',stopSpeech);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});
  if('speechSynthesis' in window)speechSynthesis.getVoices();
  resetSentence();render();
 };
 if(!window.GrowingStudentPages?.registerLegacy(startLegacy))startLegacy();
})();
