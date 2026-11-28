const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const web=path.join(__dirname,'../app/src/main/assets/web/app-design');
function setup(records={},unit=1,extra='',request=async()=>JSON.stringify({meaningPassed:true,posPassed:true,feedback:'正确',errors:[]})){
 let at=1800000000000,alive=true,fail=false;const intervals=new Map(),events=new Map();let seq=0,writes=0;
 class Clock extends Date {static now(){return at;}}
 const w={Date:Clock,Math,URLSearchParams,AbortController,setTimeout,clearTimeout,setInterval(fn){intervals.set(++seq,fn);return seq;},clearInterval(id){intervals.delete(id);},document:{hidden:false,hasFocus:()=>true,querySelector:()=>null,addEventListener(){},removeEventListener(){}},addEventListener(n,fn){events.set(n,fn);},removeEventListener(n){events.delete(n);},dispatchEvent(e){events.get(e.type)?.(e);},CustomEvent:class {constructor(type){this.type=type;}},GrowingCourseSpeech:{create:()=>({stop(){},play(){}})}};w.window=w;
 const context=vm.createContext(w);
 for(const file of ['curriculum.js','word-mastery-rules.js','english-sentence-progress.js','english-unit-score.js','english-score.js','english-engine.js','english-vocabulary.js','english-lessons.js','english-unit3-data.js','english-word-review.js','english-pomodoro.js','english-pomodoro-plan.js','english-pomodoro-catalog.js','student-english-course.js'])if(fs.existsSync(path.join(web,file)))vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),context,{filename:file});
 for(const file of ['grammar-scenes/course-registry.js','grammar-scenes/unit1-content.js','english-sentence-units-13.js','english-sentence-units-2.js','english-sentence-units-45.js','english-sentence-units-678.js','english-sentence-data.js'])vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),context,{filename:file});
 for(const file of w.GrowingEnglishPointCourses.assets['english-8a-'+String(unit).padStart(2,'0')]||[]){
  if(file==='unit1-content.js')continue;
  vm.runInContext(fs.readFileSync(path.join(web,'grammar-scenes',file),'utf8'),context,{filename:file});
 }
 const storage={getItem:k=>records[k]??null,setItem(k,v){if(fail)throw Error('quota');writes++;records[k]=v;}};
 const controller=w.GrowingStudentEnglishCourse.create({params:new URLSearchParams('unit=english-8a-'+String(unit).padStart(2,'0')+extra),storage,now:()=>at,active(){if(!alive)throw Error('expired');},request});
 return {w,controller,records,storage,get writes(){return writes;},get at(){return at;},fail(v){fail=v;},elapse(ms){at+=ms;for(const fn of intervals.values())fn();},expire(){alive=false;},close(){controller.destroy();},saved(){return JSON.parse(records[controller.model.storageKey]);}};
}
async function master(s,w=s.controller.model.word){const c=s.controller;c.actions.word(w.id);c.actions.recall();for(let i=0;i<7;i++){c.actions.recallInput(w.word);c.actions.submitRecall();}if(c.model.stage==='plural'){c.actions.recallInput(c.model.description.plurals[0]);c.actions.submitRecall();}c.actions.oralDraft('词义和全部词类');await c.actions.gradeOral();}

const clone=value=>JSON.parse(JSON.stringify(value));
const courseKey='growing-english-course-v1:english-8a-01';
function targetFixture(t,kind,review=false){
 const seed=setup();t.after(()=>seed.close());
 const plan=clone(seed.controller.model.pomodoro.plan);
 const target=clone(plan.rounds.flatMap(r=>r.targets).find(x=>x.kind===kind&&!x.review));
 assert(target,'catalog contains '+kind);
 target.review=review;target.newWord=kind==='word'&&!review;
 if(review){target.id='review:'+target.id;if(kind==='word')target.eventId='review:'+target.wordId;}
 plan.rounds=[{id:'target-test',title:'Target test',kind:review?'review':{word:'words',point:'grammar',lesson:'reading',sentence:'sentences'}[kind],targets:[target]}];
 const state=clone(seed.controller.model.state);
 state.pomodoro={version:1,unitId:'english-8a-01',rounds:[],plan};
 const records={[courseKey]:JSON.stringify(state)};
 return {seed,plan,target,records,state};
}

test('new plan persists once, freezes on reload and schedules ten fresh words',t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller,plan=clone(c.model.pomodoro.plan);
 assert(plan.rounds.length>0);
 assert.equal(plan.rounds[0].targets.filter(x=>x.newWord).length,10);
 for(const r of plan.rounds)assert.deepEqual([...new Set(r.targets.map(t=>t.category))].sort(),['grammar','reading','sentences','words']);
 assert.equal(c.model.pomodoro.nextPlanId,plan.rounds[0].id);
 assert.deepEqual(s.saved().pomodoro.plan,plan);
 const again=setup(s.records);t.after(()=>again.close());
 assert.deepEqual(clone(again.controller.model.pomodoro.plan),plan);
 c.actions.pomodoroStart();
 assert.equal(c.model.pomodoro.rounds[0].goal,10);
 assert.equal(c.model.pomodoro.rounds[0].planId,plan.rounds[0].id);
 s.elapse(25*60000);
 assert.equal(c.model.pomodoro.rounds[0].phase,'learning','time alone cannot finish incomplete targets');
 assert.equal(c.model.pomodoro.rounds.length,1);
});

test('any waiting round can start independently; manual end preserves it and permits an earlier round',t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller,plan=c.model.pomodoro.plan;
 assert.equal(c.actions.pomodoroStart(plan.rounds[2].id),true);
 const third=c.model.pomodoro.rounds[0];assert.equal(third.planId,plan.rounds[2].id);assert.deepEqual(clone(third.targets),clone(plan.rounds[2].targets));
 assert.equal(c.actions.pomodoroStart(plan.rounds[0].id),false);assert.equal(c.model.pomodoro.rounds.length,1);
 s.elapse(60000);assert.equal(c.actions.pomodoroEnd(third.id),true);assert.equal(s.saved().pomodoro.rounds[0].endReason,'manual');
 const stopped=clone(s.saved().pomodoro.rounds[0]);c.actions.recall();c.actions.recallInput('draft');s.elapse(5000);
 assert.equal(c.model.pomodoro.rounds.length,1);assert.deepEqual(s.saved().pomodoro.rounds[0],stopped);assert.equal(c.model.recallDraft,'draft');
 assert.equal(c.actions.pomodoroStart(plan.rounds[0].id),true);assert.equal(c.model.pomodoro.rounds[1].planId,plan.rounds[0].id);
 const original=s.records[courseKey];assert.equal(c.actions.pomodoroEnd(third.id),false);assert.equal(s.records[courseKey],original);
});

test('a future round target starts its selected round, including after save retry',t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller,planned=c.model.pomodoro.plan.rounds[3],target=planned.targets.find(t=>t.kind==='word');
 s.fail(true);assert.equal(c.actions.pomodoroStart(planned.id),false);assert.equal(s.saved().pomodoro.rounds.length,0);
 s.fail(false);c.actions.pomodoroRetry();assert.equal(c.model.pomodoro.rounds[0].planId,planned.id);
 c.actions.pomodoroEnd(c.model.pomodoro.rounds[0].id);
 const next=c.model.pomodoro.plan.rounds[1],word=next.targets.find(t=>t.kind==='word');
 assert.equal(c.actions.pomodoroOpenTarget(word.id,next.id),true);assert.equal(c.model.pomodoro.rounds[1].planId,next.id);assert.equal(c.model.word.id,word.wordId);
 c.actions.pomodoroEnd(c.model.pomodoro.rounds[1].id);
 assert.equal(c.actions.pomodoroStart(planned.id),false);assert.equal(c.actions.pomodoroStart('unknown'),false);assert.equal(c.model.pomodoro.rounds.length,2);
});

test('all units can relearn the same tomato without replacing its history or drafts',t=>{
 for(let unit=1;unit<=8;unit++){
  const s=setup({},unit);t.after(()=>s.close());const c=s.controller;
  const planned=c.model.pomodoro.plan.rounds[0];c.actions.pomodoroStart(planned.id);c.actions.recall();c.actions.recallInput('saved draft');s.elapse(50*60000);
  const before=s.saved(),first=before.pomodoro.rounds[0];assert.equal(first.endReason,'timeout');
  assert.equal(c.actions.pomodoroRestart(first.id),true);
  const after=s.saved();assert.deepEqual(after.pomodoro.rounds[0],first);assert.equal(after.pomodoro.rounds[1].retryOf,first.id);
  assert.equal(after.pomodoro.rounds[1].planId,planned.id);assert.deepEqual(after.pomodoro.rounds[1].items,[]);assert.equal(after.pomodoro.rounds[1].elapsedMs,0);
  assert.deepEqual(after.words,before.words);assert.equal(c.model.recallDraft,'saved draft');assert.equal(after.pomodoro.plan.rounds.length,before.pomodoro.plan.rounds.length);
  const restored=setup(s.records,unit);t.after(()=>restored.close());assert.equal(restored.controller.model.pomodoro.rounds.length,2);assert.equal(restored.controller.model.pomodoro.error,'');
 }
});

test('relearn failure retries once, preserves other fields, and guards stale or concurrent requests',t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller;c.actions.pomodoroStart();s.elapse(50*60000);
 const first=c.model.pomodoro.rounds[0],before=s.records[courseKey];s.fail(true);
 assert.equal(c.actions.pomodoroRestart(first.id),false);assert.equal(s.records[courseKey],before);assert.equal(c.model.pomodoro.rounds.length,1);
 s.fail(false);c.actions.pomodoroRetry();assert.equal(c.model.pomodoro.rounds.length,2);
 assert.equal(c.actions.pomodoroRestart(first.id),true);assert.equal(c.model.pomodoro.rounds.length,2);
 const second=c.model.pomodoro.rounds[1];c.actions.pomodoroEnd(second.id);
 assert.equal(c.actions.pomodoroRestart(first.id),false);
 c.actions.pomodoroStart(c.model.pomodoro.plan.rounds[1].id);const running=s.records[courseKey];
 assert.equal(c.actions.pomodoroRestart(second.id),false);assert.equal(s.records[courseKey],running);
});

test('relearn keeps mastery and makes learned words fresh review goals',async t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller;c.actions.pomodoroStart();await master(s);
 const word=c.model.word.id;s.elapse(50*60000);const before=s.saved(),first=before.pomodoro.rounds[0];
 assert(first.items.some(i=>i.id==='word:'+word));assert.equal(c.actions.pomodoroRestart(first.id),true);
 const saved=s.saved(),next=saved.pomodoro.rounds.at(-1),target=next.targets.find(t=>t.wordId===word);
 assert.equal(target.review,true);assert.equal(target.newWord,false);assert.equal(target.eventId,'review:'+word);
 assert.deepEqual(saved.words,before.words);assert.deepEqual(saved.pomodoro.rounds[0],first);assert.deepEqual(next.items,[]);
 assert.equal(c.actions.pomodoroOpenTarget(target.id,next.planId),true);c.actions.reviewInput(c.model.word.word);c.actions.submitReview();
 assert(s.saved().pomodoro.rounds.at(-1).items.some(i=>i.id===target.eventId));assert.deepEqual(s.saved().pomodoro.rounds[0],first);
});

test('automatic timeout persists once, survives reload, and further typing does not restart a timer',t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller;c.actions.recall();c.actions.recallInput('fri');
 s.elapse(50*60000);assert.equal(c.model.pomodoro.rounds[0].endReason,'timeout');assert.equal(s.saved().pomodoro.rounds[0].elapsedMs,50*60000);assert.equal(c.model.recallDraft,'fri');
 c.actions.recallInput('friend');assert.equal(c.model.pomodoro.rounds.length,1);assert.equal(c.model.recallDraft,'friend');
 const again=setup(s.records);t.after(()=>again.close());assert.equal(again.controller.model.pomodoro.rounds[0].endReason,'timeout');
 const original=clone(s.saved().pomodoro);s.elapse(600000);assert.deepEqual(s.saved().pomodoro,original);
});

test('failed manual end retains the active timer and saved draft until retry succeeds',t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller;c.actions.recall();c.actions.recallInput('fri');s.elapse(10000);
 const id=c.model.pomodoro.rounds[0].id,original=s.records[courseKey];s.fail(true);assert.equal(c.actions.pomodoroEnd(id),false);assert.equal(s.records[courseKey],original);assert.equal(c.model.pomodoro.rounds[0].phase,'learning');assert.equal(c.model.recallDraft,'fri');
 s.fail(false);c.actions.pomodoroRetry();assert.equal(s.saved().pomodoro.rounds[0].endReason,'manual');assert.equal(c.model.recallDraft,'fri');
});

test('plan optimization rebalances active targets while preserving timer, pause and saved completions',t=>{
 const seed=setup();t.after(()=>seed.close());const P=seed.w.GrowingEnglishPomodoro,state=clone(seed.controller.model.state),unitId='english-8a-01';
 const batch=state.pomodoro.plan.rounds.flatMap(r=>r.targets).filter(t=>t.newWord&&!seed.controller.model.words.find(w=>w.id===t.wordId).textbookOptional).slice(0,10),oldRound={id:'plan-1',title:'新词学习',kind:'words',targets:batch};
 const oldPlan={version:1,unitId,customPlan:'keep',rounds:[oldRound]};
 state.pomodoro=P.start({version:1,unitId,plan:oldPlan,rounds:[]},unitId,seed.at-600000,{planRound:oldRound});
 const word=seed.controller.model.words.find(w=>w.id===batch[0].wordId);
 state.words[word.id]={protocol:'seven-recalls',answers:Array(7).fill(word.word)};
 state.pomodoro=P.complete(state.pomodoro,unitId,seed.at-500000,{id:batch[0].eventId,kind:'word',title:word.word,detail:'已保存',newWord:true});
 state.pomodoro=P.pause(state.pomodoro,unitId,seed.at-180000);state.extra={keep:true};
 const before=clone(state.pomodoro.rounds[0]),s=setup({[courseKey]:JSON.stringify(state)});t.after(()=>s.close());
 const after=s.saved().pomodoro.rounds[0];
 for(const key of ['id','createdAt','elapsedMs','pauseUntil','items','goal'])assert.deepEqual(after[key],before[key],key);
 assert.equal(after.kind,'mixed');assert.deepEqual(after.previousTargets,before.targets);
 assert.ok(after.targets.some(t=>t.eventId===batch[0].eventId&&t.newWord),'saved completed target remains credited in the active batch');
 assert.equal(s.saved().pomodoro.plan.layout,'mixed-v2');
 const allTargets=s.saved().pomodoro.plan.rounds.flatMap(r=>r.targets.filter(t=>!t.review));
 assert.ok(allTargets.some(t=>t.wordId==='teenager'),'formerly optional words enter the new required plan');
 assert.equal(new Set(allTargets.map(t=>t.eventId)).size,allTargets.length,'each new task is scheduled only once');
 assert.deepEqual(s.saved().words,state.words);assert.deepEqual(s.saved().extra,{keep:true});assert.equal(s.saved().pomodoro.plan.customPlan,'keep');
 assert.deepEqual(s.saved().pomodoro.plan.previousPlan,oldPlan);
 const again=setup(s.records);t.after(()=>again.close());assert.deepEqual(again.saved().pomodoro,s.saved().pomodoro);
});

test('finished old rounds stay unchanged while waiting goals are recombined',t=>{
 const seed=setup();t.after(()=>seed.close());const P=seed.w.GrowingEnglishPomodoro,state=clone(seed.controller.model.state),unitId='english-8a-01',target=state.pomodoro.plan.rounds[0].targets.find(t=>t.newWord);
 const oldRound={id:'plan-1',title:'新词学习',kind:'words',targets:[target]},plan={version:1,unitId,rounds:[oldRound]};
 state.pomodoro=P.start({version:1,unitId,plan,rounds:[]},unitId,seed.at-1800000,{planRound:oldRound});
 state.pomodoro=P.complete(state.pomodoro,unitId,seed.at-1799000,{id:target.eventId,kind:'word',title:target.title,detail:'已保存',newWord:true});
 state.pomodoro=P.advance(state.pomodoro,unitId,seed.at);
 const word=seed.controller.model.words.find(w=>w.id===target.wordId);state.words[word.id]={protocol:'seven-recalls',answers:Array(7).fill(word.word)};
 const before=clone(state.pomodoro.rounds[0]),s=setup({[courseKey]:JSON.stringify(state)});t.after(()=>s.close());
 assert.deepEqual(s.saved().pomodoro.rounds[0],before);assert.equal(s.controller.model.pomodoro.plan.rounds[1].kind,'mixed');
 s.controller.actions.pomodoroStart();assert.equal(s.saved().pomodoro.rounds[1].kind,'mixed');
});

test('mixed-v1 reorders active work after out-of-order ended rounds without losing history or drafts',t=>{
 const seed=setup();t.after(()=>seed.close());const P=seed.w.GrowingEnglishPomodoro,state=clone(seed.controller.model.state),unitId='english-8a-01';
 const targets=state.pomodoro.plan.rounds.flatMap(r=>r.targets.filter(t=>!t.review)),words=targets.filter(t=>t.newWord),sentences=targets.filter(t=>t.kind==='sentence').slice(-5);
 const plan={version:1,layout:'mixed-v1',unitId,rounds:[
  {id:'old-1',kind:'mixed',title:'Old 1',targets:[words[0]]},
  {id:'old-2',kind:'mixed',title:'Old 2',targets:[words[1],...sentences]},
  {id:'old-3',kind:'mixed',title:'Old 3',targets:[words[2]]}
 ]};
 let p=P.start({version:1,unitId,plan,rounds:[]},unitId,seed.at-4000000,{planRound:plan.rounds[2]});
 p=P.finish(p,unitId,seed.at-3900000);
 p=P.start(p,unitId,seed.at-3800000,{planRound:plan.rounds[0]});p=P.advance(p,unitId,seed.at-800000);
 p=P.start(p,unitId,seed.at-700000,{planRound:plan.rounds[1]});
 const word=seed.controller.model.words.find(w=>w.id===words[1].wordId);
 state.words[word.id]={protocol:'seven-recalls',answers:Array(7).fill(word.word)};
 for(const target of plan.rounds[1].targets)p=P.complete(p,unitId,seed.at-600000,{id:target.eventId,kind:target.kind,title:target.title,detail:'已保存',newWord:target.newWord});
 state.pomodoro=P.pause(p,unitId,seed.at-180000);state.unknown={draft:'keep'};
 const before=clone(state.pomodoro),s=setup({[courseKey]:JSON.stringify(state)});t.after(()=>s.close());const actual=s.saved().pomodoro;
 assert.deepEqual(actual.rounds.slice(0,2),before.rounds.slice(0,2));
 const current=actual.rounds[2],old=before.rounds[2];
 for(const key of ['id','planId','elapsedMs','pauseUntil','items','createdAt'])assert.deepEqual(current[key],old[key],key);
 for(const target of old.targets)assert.ok(current.targets.some(t=>t.eventId===target.eventId&&!t.review));
 assert.ok(current.targets.length>old.targets.length);assert.equal(current.goal,10);assert.deepEqual(current.previousTargets,old.targets);
 const activeAndFuture=actual.plan.rounds.filter(r=>![plan.rounds[0].id,plan.rounds[2].id].includes(r.id));
 const wordIds=activeAndFuture.flatMap(r=>r.targets.filter(t=>t.newWord).map(t=>t.wordId));
 assert.equal(wordIds.length,52);assert.equal(new Set(wordIds).size,52,'unfinished historical work is rescheduled, saved active work is credited');
 assert.deepEqual(s.saved().words,state.words);assert.deepEqual(s.saved().unknown,state.unknown);
 const again=setup(s.records);t.after(()=>again.close());assert.deepEqual(again.saved().pomodoro,actual);
});

test('failed old-plan upgrade leaves the original stored record intact and can retry',t=>{
 const seed=setup();t.after(()=>seed.close());const state=clone(seed.controller.model.state);delete state.pomodoro.plan.layout;
 const raw=JSON.stringify(state),saved={[courseKey]:raw};let blocked=true;
 const records=new Proxy(saved,{set(target,key,value){if(blocked)throw Error('quota');target[key]=value;return true;}});
 const s=setup(records);t.after(()=>s.close());assert.equal(saved[courseKey],raw);assert.match(s.controller.model.pomodoro.error,/quota/);
 blocked=false;s.controller.actions.pomodoroRetry();assert.equal(s.saved().pomodoro.plan.layout,'mixed-v2');
});

test('a legacy eight-word round retains its goal and receives no retroactive targets',t=>{
 const s=setup();t.after(()=>s.close());
 const state=clone(s.controller.model.state),P=s.w.GrowingEnglishPomodoro;
 state.pomodoro=P.start(null,'english-8a-01',s.at,{newWords:true});
 state.pomodoro.rounds[0].goal=8;
 const raw=clone(state.pomodoro.rounds[0]);
 const restored=setup({[courseKey]:JSON.stringify(state)});t.after(()=>restored.close());
 restored.controller.actions.pomodoroStart();
 assert.equal(restored.controller.model.pomodoro.rounds.length,1);
 assert.deepEqual(clone(restored.controller.model.pomodoro.rounds[0]),raw);
});

test('point target opens the exact original lesson and review preparation is idempotent',t=>{
 const f=targetFixture(t,'point',true),{target}=f;
 const P=f.seed.w.GrowingEnglishPointCourses.get('english-8a-01').practice,p=P.point(target.lessonId,target.pointId);
 const previous=P.empty();for(const q of p.questions)previous.answers[q.id]=q.type==='fill'?{texts:q.answers.map(forms=>forms[0]),checked:true}:{choice:q.answer,checked:true};
 previous.best=p.questions.length;previous.total=p.questions.length;previous.custom='keep';
 f.state.pointPractice={[target.lessonId]:{[target.pointId]:previous}};
 f.records[courseKey]=JSON.stringify(f.state);
 const s=setup(f.records);t.after(()=>s.close());const c=s.controller;
 c.actions.pomodoroStart();c.actions.pomodoroOpenTarget(target.id);
 assert.equal(c.model.view,'lesson');assert.equal(c.model.pointTarget.lessonId,target.lessonId);assert.equal(c.model.pointTarget.pointId,target.pointId);
 const clean=c.actions.pointRead(target.lessonId,target.pointId);
 assert.deepEqual(clone(clean.answers),{});assert.equal(clean.best,p.questions.length);assert.equal(clean.custom,'keep');
 assert.equal(clean.reviewRoundId,c.model.pomodoro.rounds[0].id);assert.equal(clean.reviewHistory.length,1);
 assert.deepEqual(clone(clean.reviewHistory[0].answers),clone(previous.answers));
 const draft=clone(clean),q=p.questions[0];draft.answers[q.id]={choice:q.answer,checked:true};
 const saved=c.actions.pointSave(target.lessonId,target.pointId,draft,clean);
 c.actions.pomodoroOpenTarget(target.id);
 assert.deepEqual(clone(c.actions.pointRead(target.lessonId,target.pointId)),clone(saved));
 assert.equal(c.model.pomodoro.rounds[0].items.length,0);
 const finished=clone(saved);for(const item of p.questions)finished.answers[item.id]=item.type==='fill'?{texts:item.answers.map(forms=>forms[0]),checked:true}:{choice:item.answer,checked:true};
 c.actions.pointSave(target.lessonId,target.pointId,finished,saved);
 assert.equal(c.model.pomodoro.rounds[0].items.length,1);
});

test('sentence review ignores old completion and accepts a newly saved lastAttempt',t=>{
 const f=targetFixture(t,'sentence',true),{target}=f,SP=f.seed.w.EnglishSentenceProgress;
 const sentence=f.seed.w.SentenceDemo.getPractice('english-8a-01',target.topicId).sentences.find(x=>x.id===target.sentenceId);
 const key=SP.key('english-8a-01'),result={wrong:0,hints:0,revealed:false};
 let archive=SP.complete(null,sentence,result,f.seed.at-1000);f.records[key]=JSON.stringify(archive);
 const s=setup(f.records);t.after(()=>s.close());const c=s.controller;
 c.actions.pomodoroStart();c.actions.pomodoroOpenTarget(target.id);
 assert.equal(c.model.sentenceTarget.topicId,target.topicId);assert.equal(c.model.sentenceTarget.sentenceId,target.sentenceId);
 s.w.dispatchEvent(new s.w.CustomEvent('english:sentence-saved'));
 assert.equal(c.model.pomodoro.rounds[0].items.length,0);
 s.elapse(1000);archive=SP.complete(archive,sentence,result,s.at);f.records[key]=JSON.stringify(archive);
 s.w.dispatchEvent(new s.w.CustomEvent('english:sentence-saved'));
 assert.equal(c.model.pomodoro.rounds[0].items.length,1);
 s.w.dispatchEvent(new s.w.CustomEvent('english:sentence-saved'));
 assert.equal(c.model.pomodoro.rounds[0].items.length,1);
});

test('unknown target cannot navigate or start a round',t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller,before=JSON.stringify(s.records),view=c.model.view;
 c.actions.pomodoroOpenTarget('unknown:english-8a-02');
 assert.equal(c.model.view,view);assert.equal(c.model.pomodoro.rounds.length,0);
 assert.equal(JSON.stringify(s.records),before);
});

test('a word mastered ahead of its frozen target becomes review when the round starts',async t=>{
 const f=targetFixture(t,'word'),word=f.seed.controller.model.words.find(x=>x.id===f.target.wordId);
 await master(f.seed,word);
 assert.equal(f.seed.controller.model.wordPassed[word.id],true);
 f.state.words[word.id]=clone(f.seed.controller.model.state.words[word.id]);
 f.records[courseKey]=JSON.stringify(f.state);
 const s=setup(f.records);t.after(()=>s.close());const c=s.controller;
 c.actions.pomodoroStart();
 const round=c.model.pomodoro.rounds[0],target=round.targets[0];
 assert.equal(round.goal,0);assert.equal(target.review,true);assert.equal(target.newWord,false);
 assert.equal(target.eventId,'review:'+word.id);
 assert.equal(c.model.pomodoro.plan.rounds[0].targets[0].newWord,true,'the original frozen plan is not rewritten');
 c.actions.pomodoroOpenTarget(target.id);
 c.actions.reviewInput(word.word);c.actions.submitReview();
 assert.equal(c.model.pomodoro.rounds[0].items.length,1);
 assert.equal(c.model.pomodoro.rounds[0].items[0].newWord,false);
});

test('a distant future target cannot bypass the current or next planned round',t=>{
 const s=setup();t.after(()=>s.close());const c=s.controller,rounds=c.model.pomodoro.plan.rounds;
 const available=new Set(rounds.slice(0,2).flatMap(r=>r.targets.map(x=>x.id)));
 const target=rounds.slice(2).flatMap(r=>r.targets).find(x=>!available.has(x.id));assert(target);
 const before=JSON.stringify(s.records),view=c.model.view;
 c.actions.pomodoroOpenTarget(target.id);
 assert.equal(c.model.view,view);assert.equal(JSON.stringify(s.records),before);
});

test('corrupt or cross-unit frozen plans remain untouched',t=>{
 for(const plan of [{version:2,unitId:'english-8a-01',rounds:[]},{version:1,unitId:'english-8a-02',rounds:[]}]){
  const raw=JSON.stringify({version:1,words:{},lessons:{},pomodoro:{version:1,unitId:'english-8a-01',rounds:[],plan}});
  const s=setup({[courseKey]:raw});t.after(()=>s.close());
  assert(s.controller.model.pomodoro.error);
  s.controller.actions.pomodoroStart();
  assert.equal(s.records[courseKey],raw);
 }
});

test('targeted word review parks daily progress and restoring old feedback earns no new completion',t=>{
 const f=targetFixture(t,'word',true),other=f.seed.controller.model.words.filter(w=>w.id!==f.target.wordId).slice(0,2);
 const daily={ids:other.map(w=>w.id),index:0,draft:other[0].word,hinted:false,feedback:{correct:true,answer:other[0].word,hinted:false,retry:false,wordId:other[0].id},finished:false,firstCount:2,correct:1};
 f.state.wordReviewSession=clone(daily);f.records[courseKey]=JSON.stringify(f.state);
 const s=setup(f.records);t.after(()=>s.close());const c=s.controller;
 c.actions.pomodoroStart();c.actions.pomodoroOpenTarget(f.target.id);
 assert.deepEqual(s.saved().parkedWordReviews,clone([daily]));
 assert.deepEqual(Array.from(c.model.reviewSession.ids),[f.target.wordId]);
 c.actions.reviewInput(c.model.word.word);c.actions.submitReview();c.actions.reviewNext();
 assert.equal(c.model.reviewSession.finished,true);assert.equal(c.model.pomodoro.rounds[0].items.length,1);
 c.actions.startReview();
 assert.deepEqual(clone(c.model.reviewSession),clone(daily));
 assert.deepEqual(s.saved().parkedWordReviews,[]);
 assert.equal(c.model.pomodoro.rounds[0].items.length,1,'restoring saved feedback is not a new answer');
});

test('failed point review preparation preserves answers and the current view',t=>{
 const f=targetFixture(t,'point',true),target=f.target,P=f.seed.w.GrowingEnglishPointCourses.get('english-8a-01').practice,p=P.point(target.lessonId,target.pointId);
 const previous=P.empty();for(const q of p.questions)previous.answers[q.id]=q.type==='fill'?{texts:q.answers.map(forms=>forms[0]),checked:true}:{choice:q.answer,checked:true};previous.best=p.questions.length;
 f.state.pointPractice={[target.lessonId]:{[target.pointId]:previous}};f.records[courseKey]=JSON.stringify(f.state);
 const s=setup(f.records);t.after(()=>s.close());const c=s.controller;c.actions.pomodoroStart();
 const before=s.records[courseKey],view=c.model.view;s.fail(true);
 assert.equal(c.actions.pomodoroOpenTarget(target.id),false);
 assert.equal(c.model.view,view);assert.equal(s.records[courseKey],before);assert.equal(c.model.pointTarget,undefined);
 s.fail(false);assert.equal(c.actions.pomodoroOpenTarget(target.id),true);
 assert.equal(c.actions.pointRead(target.lessonId,target.pointId).reviewHistory.length,1);
});

test('failed targeted word session save keeps the previous view and daily answers',t=>{
 const f=targetFixture(t,'word',true),other=f.seed.controller.model.words.find(w=>w.id!==f.target.wordId);
 f.state.wordReviewSession={ids:[other.id],index:0,draft:'draft',hinted:false,feedback:null,finished:false,firstCount:1,correct:0};f.records[courseKey]=JSON.stringify(f.state);
 const s=setup(f.records);t.after(()=>s.close());const c=s.controller;c.actions.pomodoroStart();
 const before=s.records[courseKey],view=c.model.view;s.fail(true);
 assert.equal(c.actions.pomodoroOpenTarget(f.target.id),false);
 assert.equal(c.model.view,view);assert.equal(s.records[courseKey],before);
});

test('planned real completion and twenty-five minutes gate rest, then the next round waits for start',async t=>{
 const f=targetFixture(t,'word'),second=clone(f.plan.rounds[0]);second.id='second-test';f.plan.rounds.push(second);f.state.pomodoro.plan=f.plan;f.records[courseKey]=JSON.stringify(f.state);
 const s=setup(f.records);t.after(()=>s.close());const c=s.controller;c.actions.pomodoroStart();
 await master(s,c.model.words.find(w=>w.id===f.target.wordId));
 assert.equal(c.model.pomodoro.rounds[0].items.length,1);assert.equal(c.model.pomodoro.rounds[0].phase,'learning');
 s.elapse(20*60000);assert.equal(c.model.pomodoro.rounds[0].phase,'learning');
 s.elapse(5*60000-1);assert.equal(c.model.pomodoro.rounds[0].phase,'learning');
 s.elapse(1);assert.equal(c.model.pomodoro.rounds[0].phase,'break');
 s.elapse(5*60000-1);assert.equal(c.model.pomodoro.rounds[0].phase,'break');
 s.elapse(1);assert.equal(c.model.pomodoro.rounds[0].phase,'finished');
 assert.equal(c.model.pomodoro.rounds.length,1);assert.equal(c.model.pomodoro.nextPlanId,'second-test');
 s.elapse(60000);assert.equal(c.model.pomodoro.rounds.length,1);
 c.actions.pomodoroStart();assert.equal(c.model.pomodoro.rounds.length,2);assert.equal(c.model.pomodoro.rounds[1].items.length,0);
});

test('completing only part of a planned round never starts rest after twenty-five minutes',async t=>{
 const f=targetFixture(t,'word'),other=f.seed.controller.model.pomodoro.plan.rounds.flatMap(r=>r.targets).find(x=>x.kind==='word'&&!x.review&&x.wordId!==f.target.wordId);
 f.plan.rounds[0].targets.push(clone(other));f.state.pomodoro.plan=f.plan;f.records[courseKey]=JSON.stringify(f.state);
 const s=setup(f.records);t.after(()=>s.close());const c=s.controller;c.actions.pomodoroStart();
 await master(s,c.model.words.find(w=>w.id===f.target.wordId));s.elapse(25*60000);
 assert.equal(c.model.pomodoro.rounds[0].phase,'learning');assert.equal(c.model.pomodoro.rounds[0].items.length,1);
 await master(s,c.model.words.find(w=>w.id===other.wordId));
 assert.equal(c.model.pomodoro.rounds[0].phase,'break');assert.equal(c.model.pomodoro.rounds[0].items.length,2);
});
