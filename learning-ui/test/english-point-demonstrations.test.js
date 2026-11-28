import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const base=new URL('../../app/src/main/assets/web/app-design/grammar-scenes/',import.meta.url);
function setup(unit,classroom=false){
 const html=classroom?readFileSync(new URL('../english-point-scenes.html',base),'utf8'):'<div id="stage"></div>';
 const dom=new JSDOM(html,{url:'https://test.invalid/english-point-scenes.html?unit='+unit+'&lesson=reading',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 const media=new w.EventTarget();media.matches=false;w.matchMedia=()=>media;
 const load=file=>w.eval(readFileSync(new URL(file,base),'utf8'));
 load('course-registry.js');for(const file of w.GrowingEnglishPointCourses.assets[unit])load(file);
 load('point-demo-data.js');load('point-demo-patient.js');load('point-demo.js');
 if(classroom)load('unit5-study.js');
 return {dom,w,media,course:w.GrowingEnglishPointCourses.get(unit),data:w.GrowingEnglishPointDemos,view:w.GrowingEnglishPointDemoView,stage:w.document.querySelector('#stage')};
}
test('all 86 points have specific demonstrations; the 860 mixed questions and IDs remain unchanged',()=>{
 const counts={sentence:0,evidence:0,motion:0};let questions=0;
 for(let n=1;n<=8;n++){
  const unit='english-8a-0'+n,s=setup(unit);try{
   const original=JSON.stringify(s.course.practice.groups);s.data.validate(unit,s.course);
   for(const [lesson,points] of Object.entries(s.course.practice.groups))for(const p of points){
    const d=s.data.get(unit,lesson,p.id);assert.ok(d,unit+':'+lesson+':'+p.id);counts[d.type]++;
    questions+=p.questions.length;assert.equal(p.questions.filter(q=>q.type==='fill').length,5);
    if(d.type==='motion'){assert.equal(unit,'english-8a-05');assert.match(p.id,/^see-do(ing)?$/);continue;}
    const mounted=s.view.mount(s.stage,d);
    assert.equal(s.stage.querySelector('stick-scene,canvas'),null);
    if(d.type==='sentence'){
     assert.equal(s.stage.querySelector('.pd-after').hidden,true);assert.equal(s.stage.querySelector('.pd-note').hidden,true);
     s.stage.querySelector('[data-demo-action=advance]').click();assert.equal(s.stage.querySelector('.pd-after').hidden,false);
     assert.equal(s.stage.querySelector('.pd-note').hidden,true);s.stage.querySelector('[data-demo-action=advance]').click();
     assert.equal(s.stage.querySelector('.pd-note').hidden,false);assert.ok(s.stage.querySelector('mark'));
    }else{
     assert.equal(s.stage.querySelector('.pd-conclusion').hidden,true);
     s.stage.querySelector('[data-demo-action=reveal]').click();assert.equal(s.stage.querySelector('.pd-conclusion').hidden,false);
     assert.equal(s.stage.querySelectorAll('.is-evidence').length,d.lines.filter(l=>l.relevant).length);
    }
    s.stage.querySelector('[data-demo-action=reset]').click();
    mounted.dispose();
   }
   assert.equal(JSON.stringify(s.course.practice.groups),original,'demonstrations cannot change questions, answers or score');
   assert.equal(s.data.get('english-8b-0'+n,'reading','evidence'),undefined);
  }finally{s.dom.window.close();}
 }
 assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),86);assert.equal(questions,860);console.log({demonstrations:counts,questions});
});

function fakeClock(w){
 let now=0,id=0;const pending=new Map();w.performance.now=()=>now;
 w.setTimeout=(callback,delay)=>{pending.set(++id,{callback,at:now+delay});return id;};w.clearTimeout=id=>pending.delete(id);
 return {get count(){return pending.size;},tick(ms){const until=now+ms;for(;;){const next=[...pending.entries()].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>until)break;now=next[1].at;pending.delete(next[0]);next[1].callback();}now=until;}};
}

test('illustrated conversation starts still, pauses and resumes, finishes and replays; evidence selects the corresponding scene',()=>{
 const s=setup('english-8a-01'),clock=fakeClock(s.w);
 try{
  const mounted=s.view.mount(s.stage,s.data.get('english-8a-01','reading','evidence'));
  const scene=s.stage.querySelector('.pd-listening'),play=scene.querySelector('.pd-scene-play');
  assert.ok(scene.querySelector('svg[role=img]'));assert.equal(scene.dataset.playing,'false');assert.equal(clock.count,0);
  play.click();clock.tick(1000);play.click();assert.equal(clock.count,0);assert.equal(play.textContent,'继续播放');
  clock.tick(10000);assert.equal(scene.dataset.frame,'0');play.click();clock.tick(2600);
  assert.equal(scene.dataset.frame,'1');assert.equal(scene.querySelector('.pd-speaker').textContent,'Tom');
  clock.tick(5600);assert.equal(scene.dataset.frame,'2');assert.equal(scene.querySelector('.pd-speaker').textContent,'Mia');
  clock.tick(3800);assert.equal(clock.count,0);assert.equal(play.textContent,'重播情境');
  play.click();assert.equal(scene.dataset.frame,'0');assert.equal(scene.dataset.playing,'true');
  s.stage.querySelector('[data-evidence="2"]').click();assert.equal(clock.count,0);assert.equal(scene.dataset.appearance,'true');assert.match(scene.querySelector('.pd-scene-caption').textContent,/外貌/);
  s.stage.querySelector('[data-evidence="1"]').click();assert.equal(scene.dataset.frame,'1');assert.equal(scene.dataset.appearance,'false');assert.equal(scene.dataset.motion,'false','manual viewing shows the complete sentence');
  s.stage.querySelector('[data-demo-action=reveal]').click();assert.equal(scene.dataset.frame,'2');
  s.stage.querySelector('[data-demo-action=reset]').click();assert.equal(scene.dataset.frame,'0');
  play.click();mounted.dispose();assert.equal(clock.count,0);clock.tick(20000);assert.equal(scene.dataset.frame,'0');
 }finally{s.w.close();}
});

test('reduced motion stops playback and allows all illustrated keyframes to be read',()=>{
 const s=setup('english-8a-01'),clock=fakeClock(s.w);
 try{
  const mounted=s.view.mount(s.stage,s.data.get('english-8a-01','reading','evidence'));
  const scene=s.stage.querySelector('.pd-listening'),play=scene.querySelector('.pd-scene-play');
  play.click();clock.tick(4000);s.media.matches=true;s.media.dispatchEvent(new s.w.Event('change'));
  assert.equal(clock.count,0);assert.equal(play.disabled,true);clock.tick(20000);assert.equal(scene.dataset.frame,'1');
  for(let i=0;i<3;i++){scene.querySelector('[data-scene-step="'+i+'"]').click();assert.equal(scene.dataset.frame,String(i));assert.equal(scene.dataset.playing,'false');}
  mounted.dispose();
 }finally{s.w.close();}
});

test('real classroom pauses on page hide and tab changes, removes old timers, and leaves practice records intact',()=>{
 const s=setup('english-8a-01',true),clock=fakeClock(s.w);let writes=0;
 try{
  s.w.GrowingEnglishPointStudy.connect({read:()=>null,write:(lesson,id,value)=>{writes++;return value;}});
  const oldScene=s.stage.querySelector('.pd-listening');oldScene.querySelector('.pd-scene-play').click();assert.equal(clock.count,1);
  s.w.dispatchEvent(new s.w.Event('pagehide'));assert.equal(clock.count,0);assert.equal(oldScene.dataset.playing,'false');
  oldScene.querySelector('.pd-scene-play').click();
  Object.defineProperty(s.w.document,'hidden',{value:true,configurable:true});s.w.document.dispatchEvent(new s.w.Event('visibilitychange'));assert.equal(clock.count,0);
  oldScene.querySelector('.pd-scene-play').click();s.w.GrowingEnglishPointStudy.selectPoint('portrait');assert.equal(clock.count,0);clock.tick(20000);
  assert.equal(s.stage.querySelector('.pd-listening'),null);assert.equal(oldScene.dataset.frame,'0');
  s.w.GrowingEnglishPointStudy.selectPoint('evidence');assert.equal(s.stage.querySelector('.pd-listening').dataset.playing,'false');
  assert.equal(writes,0,'illustration interactions never save a practice record');
 }finally{s.w.close();}
});
test('patient example distinguishes context, observable behaviour and appearance; reset clears observations',()=>{
 const s=setup('english-8a-01');try{
  s.view.mount(s.stage,s.data.get('english-8a-01','reading','evidence'));
  const lines=s.stage.querySelectorAll('[data-evidence]');lines[2].click();
  assert.equal(lines[2].getAttribute('aria-pressed'),'true');assert.ok(lines[2].classList.contains('is-context'));
  assert.match(s.stage.querySelector('.pd-note').textContent,/外貌/);assert.equal(s.stage.querySelector('.pd-conclusion').hidden,true);
  lines[1].click();assert.match(s.stage.querySelector('.pd-note').textContent,/等待、不打断/);assert.equal(lines[2].getAttribute('aria-pressed'),'false');
  s.stage.querySelector('[data-demo-action=reveal]').click();assert.match(s.stage.querySelector('.pd-conclusion').textContent,/patient/);
  assert.equal(s.stage.querySelectorAll('.is-context,[aria-pressed=true]').length,0,'the conclusion highlights only supporting evidence');
  s.stage.querySelector('[data-demo-action=reset]').click();assert.equal(s.stage.querySelectorAll('.is-evidence,.is-context').length,0);
  assert.equal(s.stage.querySelector('.pd-conclusion').hidden,true);
 }finally{s.dom.window.close();}
});
test('example text is not interpreted as HTML',()=>{
 const s=setup('english-8a-01');try{
  const d={...s.data.get('english-8a-01','forms','regular'),before:'[<img src=x onerror=alert(1)>]'};
  s.view.mount(s.stage,d);assert.equal(s.stage.querySelector('img'),null);assert.match(s.stage.textContent,/<img/);
 }finally{s.dom.window.close();}
});
