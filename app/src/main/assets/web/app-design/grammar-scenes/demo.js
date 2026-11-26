(()=>{
 'use strict';
 const lessons=window.GrowingGrammarSceneLessons||{
  make:{title:'make：变成被动，to 要回来',intro:'同一件事：老板要求员工加班。变化的是句子的叙述重点。',scene:'grammar-make',
   steps:[
    {label:'1. 主动',title:'先说“谁让别人做”',at:.23,sentence:'<span class="focus">The boss</span> made me <mark>work</mark> overtime.',translation:'老板让我加班。',explain:'主动结构：<strong>make sb do sth</strong>。make 后的宾语是 me，后面的 work 用原形，不带 to。'},
    {label:'2. 被动',title:'换成“谁被要求做”',at:.57,sentence:'<span class="focus">I</span> <mark>was made to work</mark> overtime.',translation:'我被要求加班。',explain:'me 变为主语 I；made 前加 was；work 前补回 <strong class="good">to</strong>。事情没变，表达重点从老板转向了我。'},
    {label:'3. 易错对比',title:'被动句里的 to，不能漏',at:.73,sentence:'I was made <mark>to work</mark> overtime.',translation:'✓ be made to do：这里必须有 to。',explain:'<span class="bad">✗ I was made work overtime.</span><br>主动 make sb do 不带 to；被动 be made <strong class="good">to do</strong> 要还原 to。'}
   ],pitfall:'<strong class="bad">不要把主动句“不带 to”的规则直接搬到被动句。</strong><br>这个例子说明 make 的结构变化，不能机械套用到所有动词。',
   question:'The children were made ___ the room.',options:['clean','to clean','cleaning'],answer:'to clean',explanation:'were made 是被动语态，要用 to clean。主动句才是 made the children clean。'},
  see:{title:'see：看见全过程，还是正在发生？',intro:'蓝色线段表示“我看见的范围”；浅色人物表示没有看见的部分。',scene:'grammar-see-whole',
   steps:[
    {label:'1. 全过程',title:'从走上桥到走下桥，都看见了',at:.7,scene:'grammar-see-whole',sentence:'I saw him <mark>cross</mark> the bridge.',translation:'我看见他过了桥。（这里强调看到了完整过程。）',explain:'<strong>see sb do sth</strong>：强调动作的完整过程；在合适语境中，也可表示看见经常发生的动作。'},
    {label:'2. 进行中',title:'只看见他正在过桥的一段',at:.39,scene:'grammar-see-part',sentence:'I saw him <mark>crossing</mark> the bridge.',translation:'我看见他正在过桥。',explain:'<strong>see sb doing sth</strong>：强调看见时动作正在进行。句子本身不说明你有没有看见开始和结束。'},
    {label:'3. 区分含义',title:'两个句子都可以对，表达重点不同',at:.39,scene:'grammar-see-part',sentence:'see sb <mark>do</mark> / see sb <mark>doing</mark>',translation:'全过程或经常发生 / 看见时正在进行',explain:'<span class="bad">✗ I saw him to cross the bridge.</span><br>主动结构中不能加 to。选择 cross 还是 crossing，要看想强调的意思。'}
   ],pitfall:'<strong class="bad">doing 不等于“这件事最终没做完”。</strong><br>它只强调观察时正在进行；hear sb do / doing 也有相似区别。',
   question:'当时我只看见他正在过桥，想突出“正在进行”：I saw him ___ the bridge.',options:['cross','crossing','to cross'],answer:'crossing',explanation:'此处强调看见时正在进行，用 crossing。cross 可用于强调全过程的另一种语境；to cross 不符合这里的主动结构。'}
 };
 const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const params=new URLSearchParams(location.search);
 const initial=Object.hasOwn(lessons,params.get('lesson'))?params.get('lesson'):Object.keys(lessons)[0];
 if(params.get('embed')==='1')document.body.classList.add('embedded');
 if(window.GrowingGrammarSceneLessons)document.querySelector('.lesson-tabs').innerHTML=Object.entries(lessons).map(([id,l])=>`<button type="button" data-lesson="${id}" aria-pressed="false">${l.tab}</button>`).join('');
 let lessonId=initial,step=0,raf=0,elapsed=0,lastTime=0,endTime=6.1,playing=false,sceneId='';
 const answers={},results={};
 function freeze(seconds){const el=$('stage').querySelector('stick-scene');if(el?.v)STICK.at(el,{u:seconds/8,t:seconds});}
 function stop(){cancelAnimationFrame(raf);playing=false;$('pause').disabled=true;$('play').textContent='重播演示';}
 function showScene(id){
  if(sceneId===id)return;
  sceneId=id;$('stage').innerHTML=`<stick-scene scene="${id}" play="idle" no-font no-floor></stick-scene>`;
 }
 function showStep(index,seek=true){
  const l=lessons[lessonId],s=l.steps[index];step=index;
  showScene(s.scene||l.scene);
  $('steps').querySelectorAll('button').forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('step-title').textContent=s.title;$('sentence').innerHTML=s.sentence;$('translation').textContent=s.translation;$('explain').innerHTML=s.explain;
  if(seek){stop();elapsed=s.at*8;freeze(elapsed);$('play-status').textContent='点击步骤可停在关键画面';}
 }
 function showLesson(id){
  stop();lessonId=id;const l=lessons[id];
  document.querySelectorAll('[data-lesson]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lesson===id)));
  $('lesson-title').textContent=l.title;$('lesson-intro').textContent=l.intro;
  const back=document.querySelector('.page-heading>a');
  if(window.GrowingGrammarSceneLessons)back.href='english-course.html?unit=english-8a-05&node=lesson:'+id;
  $('steps').innerHTML=l.steps.map((s,i)=>`<button type="button" data-step="${i}">${s.label}</button>`).join('');
  $('pitfall').innerHTML=l.pitfall;$('question').textContent=l.question||'';
  document.querySelector('.quiz').hidden=!l.question;
  $('options').innerHTML=(l.options||[]).map((option,i)=>`<label><input type="radio" name="answer" value="${option}" ${answers[id]===option?'checked':''}>${String.fromCharCode(65+i)}. ${option}</label>`).join('');
  showResult();showStep(0);$('play').textContent='播放演示';
  if(reduced.matches)$('play-status').textContent='已开启减少动态效果，可点击步骤查看静态画面';
 }
 function showResult(){const r=results[lessonId];$('quiz-result').textContent=r?.text||'';$('quiz-result').className=r?(r.correct?'good':'bad'):'';}
 function tick(time){
  if(!playing)return;
  elapsed+=Math.min((time-lastTime)/1000,.08);lastTime=time;
  const cuts=lessons[lessonId].cuts||(lessonId==='make'?[2.8,5.4]:null);
  if(cuts){const next=cuts.filter(t=>elapsed>=t).length;if(next!==step)showStep(next,false);}
  freeze(Math.min(elapsed,endTime));
  if(elapsed>=endTime){stop();$('play-status').textContent='演示结束 · 可重播或逐步查看';return;}
  raf=requestAnimationFrame(tick);
 }
 $('play').addEventListener('click',()=>{
  stop();if(reduced.matches){showStep((step+1)%lessons[lessonId].steps.length);$('play-status').textContent='静态模式 · 已切换到下一步';return;}
  if(lessonId==='make'||lessons[lessonId].cuts)showStep(0,false);
  const current=lessons[lessonId].steps[step];
  elapsed=current.playFrom||0;endTime=current.playUntil||6.1;
  freeze(elapsed);playing=true;lastTime=performance.now();$('pause').disabled=false;$('play-status').textContent='正在演示';raf=requestAnimationFrame(tick);
 });
 $('pause').addEventListener('click',()=>{stop();$('play-status').textContent='已暂停 · 可选择步骤或重播';});
 $('steps').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(b)showStep(Number(b.dataset.step));});
 document.querySelector('.lesson-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-lesson]');if(b)showLesson(b.dataset.lesson);});
 $('options').addEventListener('change',e=>{answers[lessonId]=e.target.value;results[lessonId]=null;showResult();});
 $('quiz-form').addEventListener('submit',e=>{
  e.preventDefault();const l=lessons[lessonId],answer=answers[lessonId];
  if(!answer){results[lessonId]={correct:false,text:'请先选择一个答案。'};showResult();return;}
  const correct=answer===l.answer;results[lessonId]={correct,text:(correct?'✓ 答对了。':'✗ 再看一下规则。正确答案：'+l.answer+'。')+l.explanation};showResult();
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 reduced.addEventListener('change',()=>{stop();showStep(step);});
 window.addEventListener('pagehide',stop);
 showLesson(initial);
})();
