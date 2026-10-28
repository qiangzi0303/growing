(()=>{
  'use strict';
  const C=window.GrowingAssessment,app=document.querySelector('#assessment-app'),status=document.querySelector('#storage-status');
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ageLabel=id=>C.ages.find(a=>a.id===id)?.label||'',draftKey=(kind,age)=>kind+'@'+age;
  let blocked=false,state={version:C.VERSION,age:'12-14',drafts:{},history:[]},current=null;
  try{const raw=localStorage.getItem(C.KEY);if(raw){const saved=JSON.parse(raw);if(!C.validateStore(saved))throw Error();state=saved;}}
  catch{blocked=true;status.textContent='已有评测记录无法读取，原记录已保留。本次可继续作答，但暂不能保存；请勿关闭页面。';}
  function save(){
    if(blocked)return false;
    try{if(!C.validateStore(state))throw Error();localStorage.setItem(C.KEY,JSON.stringify(state));status.textContent='';return true;}
    catch{status.textContent='当前进度尚未保存，作答仍在本页中。请勿关闭页面；恢复设备存储后可点击“重试保存”。';return false;}
  }
  function time(value){return new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}
  function moveFocus(){app.querySelector('h1,legend')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  const art='<div class="hero-art" aria-hidden="true"><svg viewBox="0 0 180 180" fill="none"><path d="M90 142V73M90 106C51 109 38 81 45 49c33 0 54 18 45 57Z" stroke="#779668" stroke-width="1.5" fill="#e0ead7"/><path d="M90 86c-8-36 14-59 49-60 5 34-16 62-49 60Z" stroke="#867099" stroke-width="1.5" fill="#e8e0ef"/><path d="M65 147h50M90 106 59 67M91 85l32-42" stroke="#657a5a" stroke-width="1.5" stroke-linecap="round"/><circle cx="144" cy="115" r="5" fill="#c4b5d1"/><circle cx="38" cy="119" r="3" fill="#a9be98"/></svg></div>';
  function home(){
    current=null;document.title='成长评测 · 逆流';
    app.innerHTML=`<header class="hero"><div class="hero-copy"><p class="eyebrow">A LITTLE MORE ABOUT YOU</p><h1 tabindex="-1">成长评测<br><span>认识自己，</span><wbr><span>每次多一点。</span></h1><p>从思维方式，到情绪、关系与日常习惯。用一次安静的作答，找到下一步可以尝试的小改变。</p></div>${art}</header>
      <section class="age-panel"><fieldset><legend>先选择你的年龄段</legend><div class="age-options">${C.ages.map(a=>`<label class="age-option"><input type="radio" name="age" value="${a.id}" ${state.age===a.id?'checked':''}><span>${a.label}</span></label>`).join('')}</div></fieldset><p>从 12 岁开始 · 题目与提示适配所选年龄段 · 不限时，按自己的节奏作答</p></section>
      <section class="assessment-cards" aria-label="选择成长评测">${Object.entries(C.kinds).map(([id,k],i)=>{
        const draft=state.drafts[draftKey(id,state.age)],count=draft?.answers.filter(a=>a!==null).length;
        return `<article class="assessment-card ${id}"><span class="card-number">0${i+1} / EXPLORE</span><span class="card-symbol" aria-hidden="true">${['△ ○ □','◡ ◠','⊞'][i]}</span><h2>${k.title}</h2><p>${k.subtitle}</p><p class="card-meta">${C.questions(id,state.age).length} 道${id==='thinking'?'原创练习':'自评题'} · ${k.minutes}</p><button class="primary" data-start="${id}" data-age="${state.age}">${draft?'继续上次评测':'开始'+k.title} <span aria-hidden="true">→</span></button>${draft?`<span class="card-resume">${ageLabel(draft.age)} · 已答 ${count} / ${draft.answers.length} 题</span>`:''}</article>`;
      }).join('')}</section>
      <p class="local-note">用于自我观察和练习，不换算智商，也不作心理诊断。题目独立编写，思维题提供解析；自评题按最近两周的实际情况填写。</p>
      <section aria-labelledby="history-title"><div class="section-heading"><h2 id="history-title">我的成长记录</h2><span class="muted">最近 12 次</span></div>${state.history.length?`<div class="history-list">${state.history.map(r=>`<article class="history-item"><div><strong>${C.kinds[r.kind].title}</strong><p>${ageLabel(r.age)} · ${time(r.at)}</p></div><button class="secondary" data-result="${esc(r.id)}">查看结果 →</button></article>`).join('')}</div>`:'<p class="empty-history">完成一次评测后，你的维度画像和练习建议会保存在这里。</p>'}</section>
      <p class="local-note">作答进度与结果仅保存在当前设备的当前账号中。中途可以返回，之后继续；更换设备时不会自动带入。</p><button class="quiet" data-save>重试保存</button>`;
  }
  function start(kind,age){
    if(!Object.hasOwn(C.kinds,kind)||!C.ages.some(a=>a.id===age))return;
    state.age=age;const key=draftKey(kind,age);
    current=state.drafts[key]||{kind,age,index:0,answers:C.questions(kind,age).map(()=>null),startedAt:new Date().toISOString()};
    state.drafts[key]=current;save();question();moveFocus();
  }
  function question(){
    const {kind,age,index,answers}=current,k=C.kinds[kind],qs=C.questions(kind,age),q=qs[index],count=answers.filter(a=>a!==null).length;
    let visual='';if(q.visual?.startsWith('grid')){const size=Number(q.visual.slice(4));visual=`<div class="visual-grid" style="--size:${size}" aria-hidden="true">${'<i></i>'.repeat(size*size)}</div>`;}
    else if(q.visual==='sequence')visual='<div class="visual-sequence" aria-hidden="true">△ ○ ○ △ ○ ○ △ ?</div>';
    document.title=`${k.title} · 第${index+1}题 · 成长评测`;
    app.innerHTML=`<header class="quiz-header"><p class="eyebrow">${ageLabel(age)} · ${C.ages.find(a=>a.id===age).context}</p><h1 tabindex="-1">${k.title}</h1><div class="quiz-meta"><span>第 ${index+1} / ${qs.length} 题</span><span id="answered-count">已答 ${count} 题</span></div><progress class="quiz-progress" value="${count}" max="${qs.length}" aria-label="作答进度"></progress></header>
      <section class="question-panel"><p class="question-context">${kind==='thinking'?'选出最符合题意的一项，可以使用草稿纸，按自己的节奏思考。':'回想最近两周，按真实情况选择。这些描述没有标准答案。'}</p><fieldset><legend tabindex="-1">${esc(q.prompt)}</legend>${visual}<div class="answer-options">${q.options.map((o,i)=>`<label class="answer-option"><input type="radio" name="answer" value="${i}" ${answers[index]===i?'checked':''}><span>${kind==='thinking'?`<span class="answer-letter">${'ABCD'[i]}</span>`:''}${esc(o)}</span></label>`).join('')}</div></fieldset><div class="question-actions"><button class="secondary" data-prev ${index===0?'disabled':''}>← 上一题</button><button class="primary" id="next-answer" data-next ${answers[index]===null?'disabled':''}>${index===qs.length-1?'完成，查看结果':'下一题 →'}</button></div></section>
      <div class="quiz-footer"><span>选择后可修改，点击下一题继续。</span><div><button class="quiet" data-save>重试保存</button><button class="quiet" data-home>稍后继续</button></div></div>`;
  }
  function finish(){
    if(!C.validAnswers(current.kind,current.age,current.answers,true))return;
    const record={id:crypto.randomUUID(),kind:current.kind,age:current.age,answers:[...current.answers],at:new Date().toISOString()};
    state.history=[record,...state.history].slice(0,12);delete state.drafts[draftKey(current.kind,current.age)];current=null;save();result(record);moveFocus();
  }
  function result(record){
    current=null;const {kind,age,answers}=record,k=C.kinds[kind],r=C.evaluate(kind,age,answers),thinking=kind==='thinking',qs=C.questions(kind,age);
    const lowest=r.dimensions.reduce((a,b)=>a.ratio<=b.ratio?a:b);
    document.title=k.title+'结果 · 成长评测';
    app.innerHTML=`<header class="result-header"><p class="eyebrow">你的本次成长记录 · ${ageLabel(age)} · ${time(record.at)}</p><h1 tabindex="-1">${thinking?'每一次思考，都有迹可循。':'看见现在，留一点空间给成长。'}</h1><p class="muted">${k.title}已完成。${thinking?'先回顾方法，再选择一个方向继续练习。':'这些回答是你最近两周的自我观察，会随经历和状态变化。'}</p></header>
      <section class="result-intro"><div class="score-orbit"><strong>${thinking?r.correct:'已完成'}</strong><span>${thinking?'答对 / '+r.total+' 题':r.total+' 道自评题'}</span></div><div><h2>${thinking?'本次练习表现':'这一次，先照顾一个小方向'}</h2><p>${thinking?'答对题数仅代表这组练习的表现，不换算智商或同龄排名。每道题的答案与理由都在下方。':`可以从“${lowest.label}”开始，尝试一个不费力的小行动。维度结果是作答换算后的均值，不是能力定论。`}</p><p><strong>本周可以试试：</strong>${esc(lowest.advice)}</p></div></section>
      <section class="dimension-grid" aria-label="分维度结果">${r.dimensions.map(d=>`<article class="dimension-card" data-dimension="${d.id}"><div class="dimension-top"><h3>${d.label}</h3><span>${thinking?d.value+' / '+d.max+' 题':d.average.toFixed(1)+' / 5'}</span></div><div class="dimension-meter" aria-hidden="true"><span style="width:${Math.round(d.ratio*100)}%"></span></div><span class="dimension-tag">${d.labelText}</span><p>${esc(d.advice)}</p></article>`).join('')}</section>
      <div class="result-actions"><button class="primary" data-home>返回成长评测</button><button class="secondary" data-start="${kind}" data-age="${age}">${thinking?'再练一次':'再做一次'}</button><button class="secondary" data-print>打印结果</button><button class="quiet" data-save>重试保存</button></div>
      ${thinking?`<section class="answer-review"><h2>答案与思路回顾</h2><p class="muted">同一组题目重复练习会受记忆影响，适合回顾方法。</p>${qs.map((q,i)=>`<details ${answers[i]!==q.answer?'open':''}><summary><span class="${answers[i]===q.answer?'correct-mark':'practice-mark'}">${answers[i]===q.answer?'✓ 答对':'○ 再想一想'}</span> · ${i+1}. ${esc(q.prompt)}</summary><p>你的选择：${esc(q.options[answers[i]])}<br>参考答案：${esc(q.options[q.answer])}</p><p>${esc(q.explanation)}</p></details>`).join('')}</section>`:`<section class="answer-review"><h2>回看自己的回答</h2><details><summary>展开本次的 ${qs.length} 道作答</summary>${qs.map((q,i)=>`<p>${i+1}. ${esc(q.prompt)}<br><strong>${esc(q.options[answers[i]])}</strong></p>`).join('')}</details></section>`}
      <p class="result-note">${thinking?'各维度展示本次答对题数。':'自评选项从“几乎没有”到“几乎总是”记为1–5，反向描述按相反方向换算后取各维度平均值。较高表示相关习惯在本次自评中出现得更稳定。'} 本页为独立编写的成长练习与自我观察工具。</p>`;
  }
  app.addEventListener('change',e=>{
    if(e.target.name==='age'){state.age=e.target.value;save();home();app.querySelector(`input[name="age"][value="${state.age}"]`)?.focus();}
    if(e.target.name==='answer'&&current){current.answers[current.index]=Number(e.target.value);save();app.querySelector('#next-answer').disabled=false;const count=current.answers.filter(a=>a!==null).length;app.querySelector('#answered-count').textContent='已答 '+count+' 题';app.querySelector('progress').value=count;}
  });
  app.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button||button.disabled)return;
    if(button.hasAttribute('data-start'))start(button.dataset.start,button.dataset.age);
    else if(button.hasAttribute('data-next')&&current){if(current.answers[current.index]===null)return;if(current.index===current.answers.length-1)finish();else{current.index++;save();question();moveFocus();}}
    else if(button.hasAttribute('data-prev')&&current&&current.index>0){current.index--;save();question();moveFocus();}
    else if(button.hasAttribute('data-home')){save();home();moveFocus();}
    else if(button.hasAttribute('data-result')){const record=state.history.find(r=>r.id===button.dataset.result);if(record){result(record);moveFocus();}}
    else if(button.hasAttribute('data-print'))window.print();
    else if(button.hasAttribute('data-save')){if(save())status.textContent='评测记录已保存在当前设备。';}
  });
  home();
})();
