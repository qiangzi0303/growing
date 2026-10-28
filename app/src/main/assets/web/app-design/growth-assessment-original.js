/* Integration UI; Pansgo / xiaoyang111222 original content & scoring: CC BY-NC 4.0. */
(()=>{
 'use strict';
 const C=window.GrowingAssessment,Q=window.GrowingQuadrantContent,app=document.querySelector('#assessment-app'),status=document.querySelector('#storage-status');
 const KEY='growing-original-quadrant-v1',AGE='growing-assessment-original-age';
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ages=[['12','12 岁'],['13-17','13–17 岁'],['18+','18 岁及以上']];
 const sources=[['儿童智商测试','找规律 · 找不同 · 补图案 · 数字推理','12 岁使用 9–12 岁档 · 20 题 · 15 分钟','iq','12'],['儿童情商测试','家长观察问卷，可选孩子的小故事题','12 岁适用 · 家长问卷 24 题','eq','12'],['成人情商测试','自我觉察 · 自我调节 · 内在动机 · 同理心 · 社交技能','成人／家长自评 · 37 题','adult-eq','18+']];
 let age='12',legacy=null,blocked=false,state={version:1,draft:null,history:[]};
 const validAnswers=(a,full=false)=>Array.isArray(a)&&a.length===Q.questions.length&&a.every((n,i)=>n===null?!full:Number.isInteger(n)&&n>=0&&n<Q.questions[i].options.length);
 const validTime=t=>typeof t==='string'&&Number.isFinite(Date.parse(t));
 const validStore=s=>s&&s.version===1&&(s.draft===null||s.draft&&validAnswers(s.draft.answers)&&Number.isInteger(s.draft.index)&&s.draft.index>=0&&s.draft.index<Q.questions.length&&validTime(s.draft.startedAt))&&Array.isArray(s.history)&&s.history.length<=12&&s.history.every(r=>r&&typeof r.id==='string'&&r.id.length<=60&&validTime(r.at)&&validAnswers(r.answers,true));
 try{const a=localStorage.getItem(AGE);if(ages.some(x=>x[0]===a))age=a;}catch{}
 try{const s=localStorage.getItem(C.KEY);if(s){legacy=JSON.parse(s);if(!C.validateStore(legacy))throw Error();}}catch{legacy=null;status.textContent='旧版记录无法读取，原记录已保留。';}
 try{const s=localStorage.getItem(KEY);if(s){const v=JSON.parse(s);if(!validStore(v))throw Error();state=v;}}catch{blocked=true;status.textContent='已有原版记录无法读取，原记录已保留。本次可作答但暂不能保存，请勿关闭页面。';}
 function save(){if(blocked)return false;try{if(!validStore(state))throw Error();localStorage.setItem(KEY,JSON.stringify(state));status.textContent='';return true;}catch{status.textContent='当前进度尚未保存，请勿关闭页面。恢复设备存储后可点击“重试保存”。';return false;}}
 const time=t=>new Date(t).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
 const credit=`<p class="source-credit">原题来源：<a href="https://test.pansgo.com/life-quadrant/" target="_blank" rel="noopener noreferrer">Pansgo 人生四象限</a> · 作者 <a href="https://github.com/xiaoyang111222/life-quadrant" target="_blank" rel="noopener noreferrer">xiaoyang111222</a> · <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC 4.0</a> · <a href="growth-quadrant-LICENSE.txt" target="_blank" rel="noopener">完整许可</a>。题目、选项、分值与建议未改动，调整了界面和本机存储。仅供非商业使用。灵感来自 Dan Koe 的 Human 3.0 框架，中文测评与原作者无隶属关系。</p>`;
 function focus(){app.querySelector('h1,legend')?.focus({preventScroll:true});window.scrollTo(0,0);}
 function home(){
  document.title='成长评测 · 逆流';
  app.innerHTML=`<header class="hero original-hero"><div class="hero-copy"><p class="eyebrow">EXPLORE YOUR GROWTH</p><h1 tabindex="-1">成长评测<br>用原版题目，认识自己。</h1><p>人生四象限可在这里完成；智商和情商测评打开参考站点，直接使用原题。</p></div></header>
  <section class="age-panel"><fieldset><legend>选择你的年龄</legend><div class="age-options">${ages.map(([a,l])=>`<label class="age-option"><input type="radio" name="age" value="${a}" ${a===age?'checked':''}><span>${l}</span></label>`).join('')}</div></fieldset><p>从 12 岁开始。成人情商入口始终保留，供成年人或家长作答。原站儿童版适用年龄止于 12 岁，没有 13–17 岁专属题库。人生四象限含事业等成人场景，未按青少年年龄改题或设置常模。</p></section>
  <section class="assessment-cards original-cards" aria-label="选择原版成长评测">${sources.map(([title,desc,meta,id,a],i)=>`<article class="assessment-card ${i%2?'balance':'emotion'}" data-assessment="${id}"><span class="card-number">0${i+1} / ORIGINAL</span><h2>${title}</h2><p>${desc}</p><p class="card-meta">${meta}</p>${a===age||id==='adult-eq'?`<a class="primary original-link" href="https://test.pansgo.com/?test=${id}" target="_blank" rel="noopener noreferrer">${id==='adult-eq'?'开始成人情商测试':'在原站作答'} ↗</a>`:`<p class="age-unavailable">${a==='12'?'儿童版仅适用于 12 岁':'成人版适用于 18 岁及以上'}</p>`}</article>`).join('')}
  <article class="assessment-card balance"><span class="card-number">04 / ORIGINAL</span><h2>人生四象限测评</h2><p>心智 · 身体 · 精神 · 事业</p><p class="card-meta">原版 20 题 · 4 个象限 × 3 个等级</p><button class="primary" data-start>${state.draft?'继续原版测评':'开始原版测评'} →</button>${state.draft?`<span class="card-resume">已答 ${state.draft.answers.filter(x=>x!==null).length} / 20 题</span>`:''}</article></section>
  <p class="local-note">原站禁止内嵌，智商和情商测评将在新页面打开，需要联网；作答与隐私处理遵循原站说明，结果不会同步到本课程。人生四象限的作答仅保存在当前设备的当前账号中。趣味测评不能替代专业评估。</p>${credit}
  <section><div class="section-heading"><h2>原版测评记录</h2><span class="muted">最近 12 次</span></div>${state.history.length?`<div class="history-list">${state.history.map(r=>`<article class="history-item"><div><strong>人生四象限测评</strong><p>${time(r.at)}</p></div><button class="secondary" data-result="${esc(r.id)}">查看结果 →</button></article>`).join('')}</div>`:'<p class="empty-history">完成原版人生四象限后，结果会保存在这里。</p>'}</section>
  ${legacy&&(legacy.history.length||Object.keys(legacy.drafts).length)?`<section><div class="section-heading"><h2>旧版练习记录</h2></div><p class="local-note">独立编题版本的记录与未完成进度仍保留，不按原站题目重新计分。</p><div class="history-list">${legacy.history.map(r=>`<article class="history-item"><div><strong>${C.kinds[r.kind].title}</strong><p>${time(r.at)}</p></div><button class="secondary" data-legacy="${esc(r.id)}">查看旧版结果 →</button></article>`).join('')}</div></section>`:''}`;
 }
 function start(fresh=false){if(fresh||!state.draft)state.draft={index:0,answers:Q.questions.map(()=>null),startedAt:new Date().toISOString()};save();question();focus();}
 function question(){
  const d=state.draft,q=Q.questions[d.index],n=d.answers.filter(a=>a!==null).length;
  document.title=`人生四象限 · 第${d.index+1}题 · 成长评测`;
  app.innerHTML=`<header class="quiz-header"><p class="eyebrow">PANSGo · 原版 20 题</p><h1 tabindex="-1">人生四象限测评</h1><div class="quiz-meta"><span>第 ${d.index+1} / 20 题 · ${Q.quadrants.find(x=>x.id===q.quadrant).name}</span><span id="answered-count">已答 ${n} 题</span></div><progress class="quiz-progress" value="${n}" max="20" aria-label="作答进度"></progress></header><section class="question-panel"><p class="question-context">没有对错，选最像你的，不选最想成为的。</p><fieldset><legend tabindex="-1">${esc(q.q)}</legend><div class="answer-options">${q.options.map((o,i)=>`<label class="answer-option"><input type="radio" name="answer" value="${i}" ${d.answers[d.index]===i?'checked':''}><span>${esc(o.t)}</span></label>`).join('')}</div></fieldset><div class="question-actions"><button class="secondary" data-prev ${d.index===0?'disabled':''}>← 上一题</button><button class="primary" data-next ${d.answers[d.index]===null?'disabled':''}>${d.index===19?'完成，查看结果':'下一题 →'}</button></div></section><div class="quiz-footer"><span>原版题目与选项 · 本机自动保存</span><div><button class="quiet" data-save>重试保存</button><button class="quiet" data-home>稍后继续</button></div></div>${credit}`;
 }
 function finish(){if(!state.draft||!validAnswers(state.draft.answers,true))return;const r={id:crypto.randomUUID(),answers:[...state.draft.answers],at:new Date().toISOString()};state.history=[r,...state.history].slice(0,12);state.draft=null;save();result(r);focus();}
 function result(r){
  const score=window.Quad.evaluate(Q,r.answers),lowest=score.quadrants.find(q=>q.id===score.focusId);
  document.title='人生四象限结果 · 成长评测';
  app.innerHTML=`<header class="result-header"><p class="eyebrow">人生四象限 · ${time(r.at)}</p><h1 tabindex="-1">${esc(score.type.name)}</h1><p class="muted">${esc(score.type.desc)}</p></header><section class="dimension-grid" aria-label="四象限结果">${score.quadrants.map(d=>{const l=Q.levels.find(l=>l.id===d.level);return `<article class="dimension-card" data-dimension="${d.id}"><div class="dimension-top"><h2>${d.name}</h2><span>${l.tag} · ${l.name}</span></div><p>${esc(d.result.text)}</p><h3>下一步</h3><ul>${d.result.next.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="muted">${d.sum} / 15 分 · 均分 ${d.avg.toFixed(1)}</p></article>`;}).join('')}</section><section class="result-intro quadrant-focus"><div><h2>${Q.focus.title}：${lowest.name}</h2><p>${esc(lowest.result.next[0])}</p>${score.tied.length>1?`<p>${esc(Q.focus.tieNote)}</p>`:''}</div></section><p class="result-note">每象限 5 题，按原版选项分值 1–3 分计分。5–8 分为 1.0，9–11 分为 2.0，12–15 分为 3.0。类型与下一步重点沿用原站规则。这是自我观察工具，不是心理诊断或年龄常模。</p><div class="result-actions"><button class="primary" data-home>返回成长评测</button><button class="secondary" data-restart>再做一次</button><button class="secondary" data-print>打印结果</button><button class="quiet" data-save>重试保存</button></div><section class="answer-review"><h2>回看本次原题与作答</h2><details><summary>展开 20 道回答</summary>${Q.questions.map((q,i)=>`<p>${i+1}. ${esc(q.q)}<br><strong>${esc(q.options[r.answers[i]].t)}</strong></p>`).join('')}</details></section>${credit}`;
 }
 function oldResult(id){
  const r=legacy?.history.find(r=>r.id===id);if(!r)return;const score=C.evaluate(r.kind,r.age,r.answers),thinking=r.kind==='thinking';
  app.innerHTML=`<header class="result-header"><p class="eyebrow">旧版练习记录 · ${time(r.at)}</p><h1 tabindex="-1">${C.kinds[r.kind].title}</h1><p class="muted">按旧版原题与评分规则展示，与参考站点题库无关。</p></header>${thinking?`<p>答对 ${score.correct} / ${score.total} 题</p>`:''}<section class="dimension-grid">${score.dimensions.map(d=>`<article class="dimension-card"><h2>${d.label}</h2><p>${thinking?d.value+' / '+d.max+' 题':d.average.toFixed(1)+' / 5'}</p><p>${esc(d.advice)}</p></article>`).join('')}</section><section class="answer-review"><h2>旧版回答</h2>${C.questions(r.kind,r.age).map((q,i)=>`<details><summary>${i+1}. ${esc(q.prompt)}</summary><p>你的选择：${esc(q.options[r.answers[i]])}</p>${thinking?`<p>参考答案：${esc(q.options[q.answer])}</p><p>${esc(q.explanation)}</p>`:''}</details>`).join('')}</section><button class="primary" data-home>返回成长评测</button>`;focus();
 }
 app.addEventListener('change',e=>{
  if(e.target.name==='age'&&ages.some(a=>a[0]===e.target.value)){age=e.target.value;try{localStorage.setItem(AGE,age);}catch{status.textContent='年龄选择未保存，本次选择仍有效。';}home();app.querySelector(`input[value="${age}"]`)?.focus();}
  if(e.target.name==='answer'&&state.draft){state.draft.answers[state.draft.index]=Number(e.target.value);save();app.querySelector('[data-next]').disabled=false;const n=state.draft.answers.filter(a=>a!==null).length;app.querySelector('#answered-count').textContent='已答 '+n+' 题';app.querySelector('progress').value=n;}
 });
 app.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-start'))start();else if(b.hasAttribute('data-restart'))start(true);
  else if(b.hasAttribute('data-next')&&state.draft){if(state.draft.answers[state.draft.index]===null)return;if(state.draft.index===19)finish();else{state.draft.index++;save();question();focus();}}
  else if(b.hasAttribute('data-prev')&&state.draft&&state.draft.index>0){state.draft.index--;save();question();focus();}
  else if(b.hasAttribute('data-home')){home();focus();}
  else if(b.hasAttribute('data-result')){const r=state.history.find(r=>r.id===b.dataset.result);if(r){result(r);focus();}}
  else if(b.hasAttribute('data-legacy'))oldResult(b.dataset.legacy);
  else if(b.hasAttribute('data-print'))window.print();else if(b.hasAttribute('data-save')){if(save())status.textContent='评测记录已保存在当前设备。';}
 });
 home();
})();
