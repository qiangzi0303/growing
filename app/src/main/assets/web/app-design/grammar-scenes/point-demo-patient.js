/* Original SVG artwork: a conversation about patience, not a score or practice activity. */
(()=>{
 'use strict';
 const scenes=[
  {title:'慢慢开口',speaker:'Tom',speech:"I'm… worried.",translation:'我……有点担心。',caption:'Tom 有些担心，慢慢说出自己的想法。',duration:3600},
  {title:'安静倾听',speaker:'Tom',speech:"I… don't know… what to do.",translation:'我……不知道……该怎么办。',caption:'Tom 还在说。Mia 看着他，安静等待，没有插话。',duration:5600},
  {title:'说完再回应',speaker:'Mia',speech:'Thanks for telling me.',translation:'谢谢你告诉我。',caption:'Tom 说完了，Mia 才开口回应。',duration:3800}
 ];
 function el(tag,cls,text){const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 function mount(host){
  const root=el('section','pd-listening');root.setAttribute('aria-label','耐心倾听情境');
  // This is fixed, locally authored artwork; lesson text is inserted with textContent below.
  const art=el('div','pd-listening-art');
  art.innerHTML=`<svg viewBox="0 0 720 340" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Tom 和 Mia 坐在校园长椅上交谈。Tom 神情担忧，Mia 面向他安静倾听。">
   <rect width="720" height="340" fill="#eef2e9"/>
   <path d="M0 274Q175 239 362 264T720 259V340H0Z" fill="#e0e8db"/>
   <rect x="48" y="22" width="126" height="174" rx="54" fill="#dce7dc"/>
   <path d="M59 177V84a52 52 0 0 1 104 0v93Z" fill="#f8faf2"/>
   <path d="M61 145Q95 110 125 144T163 130V177H61Z" fill="#c0d4bd"/>
   <path d="M111 33V177M58 105H163" stroke="#dce7dc" stroke-width="7"/>
   <g stroke="#b5c5ab" stroke-width="4" fill="none"><path d="M629 260V155M629 219l-25-27M629 201l22-25"/></g>
   <g fill="#a6bda1"><ellipse cx="613" cy="187" rx="10" ry="22" transform="rotate(-40 613 187)"/><ellipse cx="643" cy="169" rx="10" ry="22" transform="rotate(35 643 169)"/><ellipse cx="629" cy="149" rx="10" ry="19"/></g>
   <path d="M607 237H650L643 277H614Z" fill="#ccac8a"/>
   <ellipse cx="360" cy="321" rx="231" ry="13" fill="#c9d3c1" opacity=".6"/>
   <path d="M153 305v25M567 305v25" stroke="#7e8e79" stroke-width="12" stroke-linecap="round"/>
   <rect x="132" y="243" width="456" height="44" rx="9" fill="#b8c8ad"/>
   <rect x="124" y="281" width="472" height="24" rx="9" fill="#8da58a"/>
   <path d="M175 298l-5 36h58l13-36M257 298l8 36h56l-19-36" fill="#3d5363"/>
   <path d="M423 299l-11 35h57l12-35M495 299l10 35h56l-20-35" fill="#55716a"/>
   <!-- Tom: a coral sweatshirt, rounded features, clasped hands. -->
   <path d="M204 204Q176 208 161 239l-12 48q-2 15 14 15h147q17 0 13-18l-15-45q-10-28-45-35Z" fill="#ce8069"/>
   <path d="M206 211q31 16 60-1" fill="none" stroke="#b96756" stroke-width="5"/>
   <path d="M216 181v27q17 19 34 0v-29" fill="#e1a17e"/>
   <g class="pd-tom-head">
    <ellipse cx="187" cy="159" rx="10" ry="15" fill="#edb58e"/><ellipse cx="272" cy="159" rx="10" ry="15" fill="#edb58e"/>
    <path d="M189 137q1-44 42-44t41 46v26q-3 39-41 40-39-2-42-42Z" fill="#f1bd98"/>
    <path d="M184 151q-8-50 21-60 14-19 40-8 34 0 34 34l-7 35-10-26q-30 9-47-10-4 22-22 24v14Z" fill="#3e4942"/>
    <path class="pd-worried-brows" d="M206 143l12-4M245 139l12 4" stroke="#62604d" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path class="pd-relaxed-brows" d="M207 140h11M246 140h11" stroke="#62604d" stroke-width="3" stroke-linecap="round"/>
    <g fill="#38483f"><ellipse cx="216" cy="153" rx="3" ry="4"/><ellipse cx="252" cy="153" rx="3" ry="4"/></g>
    <path d="M234 153l-2 12h5" fill="none" stroke="#d19473" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="205" cy="167" rx="9" ry="4" fill="#e8a18a" opacity=".6"/>
    <path class="pd-tom-quiet" d="M226 181q8-6 16-1" fill="none" stroke="#9c6157" stroke-width="3" stroke-linecap="round"/>
    <ellipse class="pd-tom-speaking" cx="234" cy="180" rx="6" ry="4" fill="#925d53"/>
    <path class="pd-tom-smile" d="M224 177q10 10 20 0" fill="none" stroke="#9c6157" stroke-width="3" stroke-linecap="round"/>
   </g>
   <path d="M180 236l14 30 36 7M289 239l-13 27-35 9" fill="none" stroke="#e29b7d" stroke-width="20" stroke-linecap="round"/>
   <path d="M174 229l10 24M296 232l-9 23" stroke="#ce8069" stroke-width="25" stroke-linecap="round"/>
   <ellipse cx="236" cy="275" rx="21" ry="10" fill="#efb895"/><path d="M229 270l14 5M228 276l12 4" stroke="#d99b7d" stroke-width="2" stroke-linecap="round"/>
   <!-- Mia: long brown hair, a green cardigan and an attentive, still posture. -->
   <path class="pd-mia-hair" d="M445 124q0-40 43-40 46 0 51 43l6 111q-13 21-38 16l-65-5q-22-21-7-50Z" fill="#73503d"/>
   <path d="M459 209q-34 3-46 34l-17 44q-5 16 14 16h143q17 0 11-17l-19-46q-12-28-42-31Z" fill="#6e9380"/>
   <path d="M472 193v20l15 14 15-15v-21" fill="#dfac83"/>
   <path d="M472 212l15 15 15-15 12 90h-54Z" fill="#f5eddb"/>
   <path d="M462 212l-12 25 17 4-11 13M511 212l13 25-17 4 11 13" fill="none" stroke="#567b6b" stroke-width="3"/>
   <g class="pd-mia-head">
    <ellipse cx="447" cy="159" rx="9" ry="14" fill="#edba91"/>
    <path d="M447 133q1-30 39-30 33 1 38 31v30q-3 35-36 38-37-2-41-38Z" fill="#f2c49e"/>
    <path d="M441 145q-7-49 34-55 44-8 55 35l-3 46-9-29q-31-5-43-26-7 20-28 25Z" fill="#73503d"/>
    <path d="M460 141l10-2M493 138l10 2" stroke="#82604a" stroke-width="3" stroke-linecap="round"/>
    <g fill="#38483f"><ellipse cx="463" cy="152" rx="3" ry="4"/><ellipse cx="495" cy="152" rx="3" ry="4"/></g>
    <path d="M478 153l-3 11h5" fill="none" stroke="#d49d79" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="454" cy="166" rx="8" ry="4" fill="#e6a08b" opacity=".5"/>
    <path class="pd-mia-quiet" d="M469 178q10 7 19-1" fill="none" stroke="#a66d5a" stroke-width="2.5" stroke-linecap="round"/>
    <path class="pd-mia-speaking" d="M467 175q12 17 24-1Z" fill="#9a5e50"/>
   </g>
   <path d="M427 241l-7 28 47 11M538 243l7 27-44 10" fill="none" stroke="#edba91" stroke-width="18" stroke-linecap="round"/>
   <path d="M428 234l-6 21M533 235l8 21" stroke="#6e9380" stroke-width="24" stroke-linecap="round"/>
   <path d="M451 270h66l-6 20h-60Z" fill="#f7f2e2" stroke="#d3c9af" stroke-width="2"/>
   <path d="M484 272v17" stroke="#d3c9af" stroke-width="2"/>
   <ellipse cx="465" cy="280" rx="14" ry="7" fill="#f2c49e"/><ellipse cx="502" cy="281" rx="14" ry="7" fill="#f2c49e"/>
   <path class="pd-hair-focus" d="M441 113q9-38 45-35 47-1 57 44l7 114" fill="none" stroke="#aa753a" stroke-width="4" stroke-dasharray="6 6" stroke-linecap="round"/>
  </svg>`;
  const bubble=el('div','pd-dialogue'),speaker=el('span','pd-speaker'),speech=el('p','pd-speech'),translation=el('p','pd-dialogue-translation');
  speech.lang='en';bubble.append(speaker,speech,translation);art.prepend(bubble);
  const names=el('div','pd-character-names');names.append(el('span','','Tom'),el('span','','Mia'));art.append(names);
  const controls=el('div','pd-scene-controls'),play=el('button','pd-scene-play','播放情境'),steps=el('div','pd-scene-steps'),caption=el('p','pd-scene-caption');
  caption.setAttribute('role','status');steps.setAttribute('role','group');steps.setAttribute('aria-label','选择情境画面');play.type='button';
  const stepButtons=scenes.map((s,i)=>{const b=el('button','',String(i+1)+' '+s.title);b.type='button';b.dataset.sceneStep=String(i);b.addEventListener('click',()=>show(i));steps.append(b);return b;});
  controls.append(play,steps);root.append(art,controls,caption);host.append(root);
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let index=0,timer=0,started=0,remaining=scenes[0].duration,playing=false,finished=false,disposed=false,appearance=false,motion=false;
  function render(){
   const scene=scenes[index];root.dataset.frame=String(index);root.dataset.playing=String(playing);root.dataset.appearance=String(appearance);root.dataset.motion=String(motion);
   bubble.dataset.speaker=scene.speaker;speaker.textContent=scene.speaker;speech.textContent=scene.speech;translation.textContent=scene.translation;
   play.disabled=!!reduced?.matches;play.textContent=reduced?.matches?'静态模式':playing?'暂停':finished?'重播情境':remaining<scenes[index].duration?'继续播放':'播放情境';
   play.setAttribute('aria-label',reduced?.matches?'减少动态效果已开启，请逐幕查看':play.textContent);
   stepButtons.forEach((b,i)=>b.setAttribute('aria-current',i===index?'step':'false'));
   caption.textContent=appearance?'棕色长发是外貌；判断耐心，要看她怎样倾听。':scene.caption;
   art.querySelector('svg').setAttribute('aria-label',appearance?'Mia 的棕色长发被标出。外貌不能证明她有耐心。':scene.caption);
  }
  function pause(){
   if(playing)remaining=Math.max(0,remaining-(performance.now()-started));
   clearTimeout(timer);timer=0;playing=false;if(!disposed)render();
  }
  function schedule(){started=performance.now();timer=setTimeout(()=>{
   if(disposed||!playing)return;
   if(index===scenes.length-1){finished=true;playing=false;motion=false;timer=0;remaining=scenes[index].duration;render();return;}
   index++;remaining=scenes[index].duration;render();schedule();
  },remaining);}
  function show(frame,focusAppearance=false){if(disposed)return;pause();index=frame;appearance=focusAppearance;remaining=scenes[index].duration;finished=false;motion=false;render();}
  play.addEventListener('click',()=>{
   if(disposed||reduced?.matches)return;if(playing){pause();return;}
   if(finished)show(0);appearance=false;playing=true;motion=true;render();schedule();
  });
  const motionChange=()=>pause();reduced?.addEventListener('change',motionChange);
  render();
  return {pause,show,observe(line){show(line===0?0:1,line===2);},dispose(){pause();disposed=true;reduced?.removeEventListener('change',motionChange);}};
 }
 window.GrowingPatientScene={mount};
})();
