const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const web=path.join(__dirname,'../app/src/main/assets/web/app-design');
function submit(c,value){if(c.model.studyEnabled){c.actions.recallInput(value);c.actions.submitRecall();}else c.actions.submitRecall(value);}
test('formal recall immediately advances seven times, wrong spelling resets and empty repeated submit does nothing',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;c.actions.recall();submit(c,w.word);submit(c,w.word);submit(c,'wrong');assert.equal(c.model.run.answers.length,0);assert.equal(c.model.recallDraft,'');assert.equal(c.model.recallFeedback,null);for(let i=1;i<=7;i++){submit(c,w.word);assert.equal(c.model.run.answers.length,i);assert.equal(c.model.recallDraft,'');assert.equal(c.model.recallFeedback,null);c.actions.submitRecall();assert.equal(c.model.run.answers.length,i);}assert.equal(c.model.stage,'plural');}finally{s.close();}
});
test('formal failed save preserves processed answer, retry never doubles count and old feedback resumes next attempt',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;c.actions.recall();c.actions.recallInput(w.word);const write=s.storage.setItem;s.storage.setItem=()=>{throw Error('quota');};c.actions.submitRecall();assert.equal(c.model.run.answers.length,1);assert.equal(c.model.reviewUnsaved,true);assert.equal(c.model.recallDraft,'');c.actions.submitRecall();assert.equal(c.model.run.answers.length,1);s.storage.setItem=write;c.actions.retryReviewSave();assert.equal(c.model.reviewUnsaved,false);c.actions.submitRecall();assert.equal(c.model.run.answers.length,1);const raw=JSON.parse(s.records[c.model.storageKey]);raw.words[w.id].practice.recallFeedback={correct:true,answer:w.word,hinted:true};raw.words[w.id].practice.recallDraft=w.word;raw.words[w.id].practice.hinted=true;s.records[c.model.storageKey]=JSON.stringify(raw);const r=setup(s.records,async()=>'', 'unit=english-8a-01',true);try{assert.equal(r.controller.model.view,'recall');assert.equal(r.controller.model.run.answers.length,1);assert.equal(r.controller.model.recallDraft,'');assert.equal(r.controller.model.recallFeedback,null);assert.equal(r.controller.model.recallHinted,false);r.controller.actions.submitRecall();assert.equal(r.controller.model.run.answers.length,1);submit(r.controller,w.word);assert.equal(r.controller.model.run.answers.length,2);}finally{r.close();}}finally{s.close();}
});
test('direct word and node links expose pending daily or formal answers, unrelated links do not hint daily',()=>{
 for(const formal of [false,true])for(const parameter of ['word','node']){const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;if(formal){c.actions.recall();c.actions.recallInput('f');}else c.actions.startWordReview();const restored=setup(s.records,async()=>'',`unit=english-8a-01&${parameter}=${parameter==='node'?'word:':''}${w.id}`,true);try{const r=restored.controller;assert.equal(r.model.view,'word');if(formal){r.actions.recall();assert.equal(r.model.recallHinted,true);submit(r,w.word);assert.equal(r.model.run.answers.length,1);}else {r.actions.startWordReview();r.actions.reviewInput(w.word);r.actions.submitReview();assert.equal(r.model.reviewSession.feedback.hinted,true);assert.equal(r.model.reviewSession.correct,0);}}finally{restored.close();}}finally{s.close();}}
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{s.controller.actions.startWordReview();const other=s.controller.model.words[1],r=setup(s.records,async()=>'',`unit=english-8a-01&word=${other.id}`,true);try{assert.equal(r.controller.model.view,'word');assert.equal(r.controller.model.word.id,other.id);assert.equal(r.controller.model.reviewSession.hinted,false);}finally{r.close();}}finally{s.close();}
});
test('completed daily review returns to list without resetting its interval',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;s.records[c.model.storageKey]=JSON.stringify({version:1,words:{},lessons:{},wordReview:{[w.id]:{level:1,due:'2020-01-01',lastDay:'2020-01-01'}}});c.actions.reloadReview();c.actions.startWordReview();c.actions.reviewInput(w.word);c.actions.submitReview();c.actions.reviewNext();const before=JSON.stringify(JSON.parse(s.records[c.model.storageKey]).wordReview);c.actions.navigate('words');assert.equal(JSON.stringify(JSON.parse(s.records[c.model.storageKey]).wordReview),before);assert.equal(JSON.parse(s.records[c.model.storageKey]).wordReview[w.id].level,2);}finally{s.close();}
});
test('old pilot URL directly restores daily draft without showing answers or marking hint; formal draft also resumes',()=>{
 for(const formal of [false,true]){const s=setup({},async()=>'', 'unit=english-8a-01&practice=word-pilot',true);try{const c=s.controller;if(formal){c.actions.recall();c.actions.recallInput('fri');}else {c.actions.startWordReview();c.actions.reviewInput('fri');}const restored=setup(s.records,async()=>'', 'unit=english-8a-01&practice=word-pilot',true);try{const m=restored.controller.model;assert.equal(m.view,formal?'recall':'review');assert.equal(formal?m.recallDraft:m.reviewSession.draft,'fri');assert.equal(formal?m.recallHinted:m.reviewSession.hinted,false);}finally{restored.close();}}finally{s.close();}}
});
test('invalid review dates, counters, feedback and unfinished end cursor are rejected without overwriting',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);s.controller.actions.startWordReview();const key=s.controller.model.storageKey,base=JSON.parse(s.records[key]);s.close();
 for(const mutate of [r=>{r.wordReviewSession.index=r.wordReviewSession.ids.length;},r=>{r.wordReviewSession.correct=-1;},r=>{r.wordReviewSession.hintCount='1';},r=>{r.wordReviewSession.feedback={correct:true};},r=>{r.wordReview={u1w1:{level:0,due:'2026-02-30',lastDay:'2026-02-20'}};}]){const raw=JSON.parse(JSON.stringify(base));mutate(raw);const records={[key]:JSON.stringify(raw)},before=records[key],restored=setup(records,async()=>'', 'unit=english-8a-01',true);try{assert.equal(restored.controller.model.kind,'error');assert.equal(records[key],before);}finally{restored.close();}}
});
test('leaving an unanswered daily review exposes answers, schedules tomorrow and cannot earn independent credit',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;c.actions.startWordReview();c.actions.navigate('words');let saved=JSON.parse(s.records[c.model.storageKey]);assert.equal(saved.wordReviewSession.hinted,true);assert.equal(saved.wordReview[w.id].level,0);assert.ok(saved.wordReview[w.id].due);c.actions.word(w.id);c.actions.startWordReview();c.actions.reviewInput(w.word);c.actions.submitReview();assert.equal(c.model.reviewSession.feedback.hinted,true);assert.equal(c.model.reviewSession.correct,0);saved=JSON.parse(s.records[c.model.storageKey]);assert.equal(saved.words[w.id].practice.answers.length,0);}finally{s.close();}
});
test('formal and daily hints schedule tomorrow immediately without submission',()=>{
 for(const formal of [true,false]){const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;if(formal)c.actions.recall();else c.actions.startWordReview();c.actions.reviewHint();const saved=JSON.parse(s.records[c.model.storageKey]);assert.equal(saved.wordReview[w.id].level,0);assert.ok(saved.wordReview[w.id].due);assert.equal(formal?saved.words[w.id].practice.hinted:saved.wordReviewSession.hinted,true);}finally{s.close();}}
});
test('formal recall persists drafts and feedback, blocks duplicate submissions and keeps plural gate',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;c.actions.recall();c.actions.recallInput('fri');let restored=setup(s.records,async()=>'', 'unit=english-8a-01',true);try{restored.controller.actions.recall();assert.equal(restored.controller.model.recallDraft,'fri');}finally{restored.close();}submit(c,w.word);c.actions.submitRecall();assert.equal(c.model.run.answers.length,1);restored=setup(s.records,async()=>'', 'unit=english-8a-01',true);try{restored.controller.actions.recall();assert.equal(restored.controller.model.recallFeedback,null);}finally{restored.close();}for(let i=1;i<7;i++){c.actions.continueRecall();submit(c,w.word);}assert.equal(c.model.stage,'plural');assert.equal(c.model.recallFeedback,null);c.actions.recallInput('friendships');submit(c,'friendships');assert.equal(c.model.stage,'oral');assert.equal(c.model.wordFullyPassed,false);}finally{s.close();}
});
test('returning through word list to a pending word card marks answer exposed and hint survives refresh',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;c.actions.recall();c.actions.recallInput('f');c.actions.navigate('words');c.actions.word(w.id);c.actions.recall();assert.equal(c.model.recallHinted,true);submit(c,w.word);assert.equal(c.model.run.answers.length,1);assert.equal(c.model.recallFeedback,null);c.actions.continueRecall();assert.equal(c.model.recallHinted,false);submit(c,w.word);assert.equal(c.model.run.answers.length,2);}finally{s.close();}
});
test('daily spelling contributes only one actual recall per day and never replaces formal mastery',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller,w=c.model.word;for(let i=0;i<2;i++){c.actions.startWordReview();c.actions.reviewInput(w.word);c.actions.submitReview();c.actions.reviewNext();}assert.equal(JSON.parse(s.records[c.model.storageKey]).words[w.id].practice.answers.length,1);assert.equal(c.model.wordPassed[w.id],false);c.actions.navigate('words');c.actions.recall();c.actions.reviewHint();submit(c,w.word);assert.equal(c.model.run.answers.length,2);submit(c,w.word);assert.equal(c.model.run.answers.length,3);const next=JSON.parse(s.records[c.model.storageKey]);next.words[w.id]={protocol:'seven-recalls',answers:Array(7).fill(w.word)};next.wordPilot={keep:true};s.records[c.model.storageKey]=JSON.stringify(next);c.actions.reloadReview();c.actions.navigate('words');c.actions.startWordReview();c.actions.reviewInput('wrong');c.actions.submitReview();const saved=JSON.parse(s.records[c.model.storageKey]);assert.equal(saved.words[w.id].protocol,'seven-recalls');assert.equal(saved.words[w.id].answers.length,7);assert.equal(saved.wordPilot.keep,true);}finally{s.close();}
});
test('merged review saves draft feedback and plan while preserving historical mastery',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01&practice=word-pilot',true);try{const c=s.controller;assert.equal(c.model.view,'words');c.actions.startWordReview();c.actions.reviewInput('wrong');c.actions.submitReview();assert.equal(c.model.reviewSession.feedback.correct,false);assert.equal(c.model.reviewSession.ids.length,2);const raw=JSON.parse(s.records[c.model.storageKey]);assert.equal(raw.words[c.model.word.id].practice.answers.length,0);assert.ok(raw.wordReview[c.model.word.id].due);const restored=setup(s.records,async()=>'', 'unit=english-8a-01',true);try{restored.controller.actions.startReview();assert.equal(restored.controller.model.reviewSession.feedback.answer,'wrong');restored.controller.actions.reviewNext();assert.equal(restored.controller.model.reviewSession.index,1);}finally{restored.close();}}finally{s.close();}
});
test('failed review save retains feedback and retry writes once; conflicts and account expiry protect storage',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01',true);try{const c=s.controller;c.actions.startWordReview();c.actions.reviewInput(c.model.word.word);const set=s.storage.setItem;s.storage.setItem=()=>{throw Error('quota');};c.actions.submitReview();assert.equal(c.model.reviewUnsaved,true);assert.equal(c.model.reviewSession.feedback.correct,true);c.actions.navigate('words');assert.equal(c.model.view,'review');s.storage.setItem=set;c.actions.retryReviewSave();assert.equal(c.model.reviewUnsaved,false);const before=s.records[c.model.storageKey];c.actions.retryReviewSave();assert.equal(s.records[c.model.storageKey],before);c.actions.reviewNext();c.actions.startWordReview();const external=JSON.parse(s.records[c.model.storageKey]);external.words.other={practice:{answers:[]}};s.records[c.model.storageKey]=JSON.stringify(external);c.actions.reviewInput('x');assert.equal(c.model.reviewUnsaved,true);assert.ok(JSON.parse(s.records[c.model.storageKey]).words.other);s.expire();assert.throws(()=>c.actions.retryReviewSave(),/expired/);}finally{s.close();}
});
function setup(records={},request=async()=>'',query='unit=english-8a-01',review=false,cards=null){
 const w={URLSearchParams,AbortController,Date,Math,setTimeout,clearTimeout,setInterval,clearInterval,document:{hidden:false,hasFocus:()=>true,querySelector:()=>null,addEventListener(){},removeEventListener(){}},addEventListener(){},removeEventListener(){},dispatchEvent(){},CustomEvent:class{constructor(type,value){this.type=type;this.detail=value?.detail;}},UnitRewards:{register(){},update(){}},GrowingCourseSpeech:{create:()=>({stop(){},play(){}})}};w.window=w;
 const context=vm.createContext(w);for(const file of ['curriculum.js','word-mastery-rules.js','english-sentence-progress.js','english-unit-score.js','english-score.js','english-engine.js','english-vocabulary.js','english-lessons.js','english-word-pilot-data.js','english-word-pilot-core.js','student-word-pilot.js','student-english-course.js'])vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),context);
 if(review)vm.runInContext(fs.readFileSync(path.join(web,'english-word-review.js'),'utf8'),context);
 if(cards)w.GrowingEnglishWordStudyData=cards;
 const storage={getItem:key=>records[key]??null,setItem:(key,value)=>records[key]=value,removeItem:key=>delete records[key]};let alive=true;
 const controller=w.GrowingStudentEnglishCourse.create({params:new URLSearchParams(query),storage,active(){if(!alive)throw Error('session expired');},request});
 return {w,records,storage,controller,expire(){alive=false;},close(){controller.destroy();}};
}
test('Feynman clears only scores below seven, persists the reset and keeps feedback',async()=>{
 for(const score of [0,6,7,10]){
  const answer='解释定义、使用条件和自己的例子',s=setup({},async()=>JSON.stringify({score,feedback:'复述反馈',criticalErrors:[]}));
  try{const c=s.controller;c.actions.navigate('feynman');c.actions.feynmanDraft(answer);await c.actions.gradeFeynman();const record=c.model.state.feynman[c.model.lesson.id];assert.equal(record.draft,score<7?'':answer);assert.equal(record.attempts.at(-1).score,score);assert.equal(record.attempts.at(-1).feedback,'复述反馈');const restored=setup(s.records);try{assert.equal(restored.controller.model.state.feynman[c.model.lesson.id].draft,record.draft);}finally{restored.close();}c.actions.feynmanDraft('重新输入的解释和例子');assert.equal(c.model.state.feynman[c.model.lesson.id].draft,'重新输入的解释和例子');}finally{s.close();}
 }
});

test('Feynman preserves the draft when grading or saving fails',async()=>{
 for(const failure of ['invalid','network','storage']){
  const s=setup({},async()=>{if(failure==='network')throw Error('offline');return JSON.stringify(failure==='invalid'?{score:1}:{score:1,feedback:'重写',criticalErrors:[]});});
  try{const c=s.controller,answer='解释定义、使用条件和自己的例子';c.actions.navigate('feynman');c.actions.feynmanDraft(answer);if(failure==='storage')s.storage.setItem=()=>{throw Error('quota');};await c.actions.gradeFeynman();assert.equal(c.model.state.feynman[c.model.lesson.id].draft,answer);assert.equal((c.model.state.feynman[c.model.lesson.id].attempts||[]).length,0);}finally{s.close();}
 }
});

test('partial quiz credit and best Feynman survive later failures and reload',async()=>{
 let mark=9;const s=setup({},async()=>JSON.stringify({score:mark,feedback:'valid',criticalErrors:[]}));
 try{const c=s.controller,l=c.model.lesson,answers=l.questions.map(q=>q.answer);
  c.actions.quiz();c.actions.submitQuiz([answers[0],answers[1],'wrong']);
  c.actions.quiz();c.actions.submitQuiz(['wrong','wrong','wrong']);
  c.actions.navigate('feynman');c.actions.feynmanDraft('解释定义、使用条件和例子');await c.actions.gradeFeynman();mark=1;
  for(let i=0;i<21;i++){c.actions.feynmanDraft('解释定义、使用条件和例子');await c.actions.gradeFeynman();}
  const raw=JSON.parse(s.records[c.model.storageKey]);assert.equal(raw.feynman[l.id].attempts.length,20);assert.equal(raw.feynman[l.id].bestFeynman.score,9);
  const r=setup(s.records);try{const result=r.w.GrowingEnglishUnitScore.lessonResult(l,raw,false);assert.equal(result.quiz,2/3);assert.equal(result.feynman,9);assert.equal(result.mastered,false);}finally{r.close();}
 }finally{s.close();}
});
test('real words, linked lessons and historical cursor restore without rewriting records',()=>{const records={'growing-english-course-v1:english-8a-01':'{"version":1,"words":{},"lessons":{},"feynman":{},"wordCursor":"u1w2"}'},before=JSON.stringify(records),s=setup(records);try{assert.equal(s.controller.model.kind,'english');assert.ok(s.controller.model.words.length>20);assert.equal(JSON.stringify(records),before);}finally{s.close();}});

for(const number of [1,2,4,5,6,7,8])test('Unit '+number+' shares continuous dictation, review and isolated illustrated cards',()=>{
 const id='english-8a-'+String(number).padStart(2,'0'),other='growing-english-course-v1:other',records={[other]:'untouched',['growing-english-course-v1:'+id]:JSON.stringify({version:1,words:{},lessons:{},extension:{keep:true}})};
 const cards={unitId:'english-8a-01',words:[{id:'unit1-only',word:'friendship'}],units:{[id]:{words:[{id:'unit-card',word:'example',example:'This card belongs to '+id}]}}};
 const s=setup(records,async()=>'', 'unit='+id,true,cards);
 try{
  const c=s.controller,w=c.model.word;
  assert.equal(c.model.studyEnabled,true);
  assert.equal(c.model.studyCards['unit-card'].example,'This card belongs to '+id);
  assert.equal(c.model.studyCards['unit1-only'],undefined);
  c.actions.recall();submit(c,w.word);submit(c,w.word);submit(c,'wrong');
  assert.equal(c.model.run.answers.length,0);
  assert.equal(c.model.recallDraft,'');
  for(let i=0;i<7;i++)submit(c,w.word);
  assert.notEqual(c.model.stage,'recall');
  assert.equal(c.model.wordPassed[w.id],false);
  const saved=JSON.parse(records[c.model.storageKey]);assert.ok(saved.wordReview[w.id].due);assert.deepEqual(saved.extension,{keep:true});
  assert.equal(records[other],'untouched');
  const restored=setup(records,async()=>'', 'unit='+id,true,cards);
  try{assert.equal(restored.controller.model.view,'recall');assert.equal(restored.controller.model.run.answers.length,7);assert.equal(restored.controller.model.recallDraft,'');}finally{restored.close();}
 }finally{s.close();}
});

test('Unit 1 pilot entry resumes and classroom saves preserve its progress',()=>{
 const s=setup({},async()=>'', 'unit=english-8a-01&practice=word-pilot');
 try{const c=s.controller;assert.equal(c.model.view,'pilot');const child=c.model.pilot;
 child.actions.start();child.actions.next();c.actions.navigate('words');assert.throws(()=>child.actions.next(),/关闭/);
 c.actions.recall();c.actions.submitRecall(c.model.word.word);c.actions.navigate('pilot');c.model.pilot.actions.start();assert.equal(c.model.pilot.model.state.session.index,1);
 assert.equal(s.w.GrowingDuckContext.mode,'exam');
 const saved=JSON.parse(s.records[c.model.storageKey]);assert.equal(saved.wordPilot.session.index,1);assert.equal(saved.words[c.model.word.id].practice.answers.length,1);
 }finally{s.close();}
 const other=setup({},async()=>'', 'unit=english-8a-02&practice=word-pilot');try{other.controller.actions.navigate('pilot');assert.equal(other.controller.model.view,'words');assert.equal(other.controller.model.pilot,undefined);}finally{other.close();}
});

test('unsaved pilot blocks internal navigation until its answer is saved',()=>{
 const s=setup();try{const c=s.controller;c.actions.navigate('pilot');const p=c.model.pilot;p.actions.start();const raw=JSON.parse(s.records[c.model.storageKey]);raw.wordPilot=null;s.records[c.model.storageKey]=JSON.stringify(raw);p.actions.next();assert.equal(p.model.unsaved,true);c.actions.navigate('words');assert.equal(c.model.view,'pilot');assert.equal(c.model.pilot,p);assert.match(c.model.notice,/保存/);}finally{s.close();}
});
test('seven recalls reset on errors, persist exact protocol and validate oral before mastery',async()=>{let result={meaningPassed:true,posPassed:true,feedback:'正确',errors:[]};const s=setup({},async()=>JSON.stringify(result));try{const c=s.controller,w=c.model.words.find(w=>!s.w.WordMasteryRules.describe(w).plurals.length);c.actions.word(w.id);c.actions.recall();c.actions.submitRecall('wrong');assert.equal(c.model.run.answers.length,0);for(let i=0;i<7;i++)submit(c,w.word);assert.equal(c.model.stage,'oral');c.actions.oralDraft('词类和词义');await c.actions.gradeOral();const stored=JSON.parse(s.records[c.model.storageKey]);assert.equal(stored.words[w.id].protocol,'word-mastery-v2');assert.equal(stored.wordCursor,w.id);assert.ok(s.w.WordMasteryRules.passed(w,stored.words[w.id]));}finally{s.close();}});
test('quiz persists only three correct answers through original engine',()=>{const s=setup();try{const c=s.controller,l=c.model.lessons[0];c.actions.lesson(l.id);c.actions.quiz();c.actions.submitQuiz(l.questions.map(q=>q.answer));const raw=JSON.parse(s.records[c.model.storageKey]);assert.equal(raw.lessons[l.id].protocol,'three-correct');assert.ok(s.w.GrowingEnglishEngine.lessonPassed(l,raw.lessons[l.id]));}finally{s.close();}});
test('invalid AI result never counts and destroyed requests cannot save late grades',async()=>{let finish,signal;const s=setup({},({signal:s})=>{signal=s;return new Promise(r=>finish=r);});const c=s.controller;c.actions.navigate('feynman');c.actions.feynmanDraft('自己的解释和例子');const promise=c.actions.gradeFeynman();s.close();assert.equal(signal.aborted,true);finish(JSON.stringify({score:10,feedback:'fine',criticalErrors:[]}));await promise;const raw=JSON.parse(s.records[c.model.storageKey]);assert.equal(raw.feynman[c.model.lesson.id].attempts,undefined);});
test('corrupt learning and doubt records are never overwritten',async()=>{const records={'growing-english-course-v1:english-8a-01':'{broken'},s=setup(records);try{assert.equal(s.controller.model.kind,'error');assert.equal(records['growing-english-course-v1:english-8a-01'],'{broken');}finally{s.close();}const d=setup({'growing-english-doubts-v1:english-8a-01':'{broken'});try{d.controller.actions.doubtDraft('question');await d.controller.actions.askDoubt();assert.equal(d.records['growing-english-doubts-v1:english-8a-01'],'{broken');assert.match(d.controller.model.doubtNotice,/无法读取/);}finally{d.close();}});
test('expired account prevents writes',()=>{const s=setup();try{s.expire();assert.throws(()=>s.controller.actions.feynmanDraft('text'),/session expired/);assert.equal(Object.keys(s.records).length,0);}finally{s.close();}});
test('noun plural and oral JSON validation cannot be bypassed; historical seven-recalls survive',async()=>{
 let response='{"score":10}';const s=setup({},async()=>response);try{const c=s.controller,w=c.model.words.find(w=>s.w.WordMasteryRules.describe(w).plurals.length),key=c.model.storageKey;
 s.records[key]=JSON.stringify({version:1,words:{[w.id]:{protocol:'seven-recalls',answers:Array(7).fill(w.word)}},lessons:{},feynman:{}});c.actions.refresh();c.actions.word(w.id);c.actions.recall();for(let i=0;i<7;i++)submit(c,w.word);assert.equal(c.model.stage,'plural');c.actions.submitRecall('incorrect');assert.equal(c.model.stage,'plural');c.actions.submitRecall(s.w.WordMasteryRules.describe(w).plurals[0]);assert.equal(c.model.stage,'oral');c.actions.oralDraft('词义及所有词类');await c.actions.gradeOral();assert.match(c.model.notice,/格式不完整/);assert.equal(JSON.parse(s.records[key]).words[w.id].protocol,'seven-recalls');response=JSON.stringify({meaningPassed:true,posPassed:true,feedback:'通过',errors:[]});await c.actions.gradeOral();const stored=JSON.parse(s.records[key]).words[w.id];assert.equal(stored.history.protocol,'seven-recalls');assert.ok(s.w.WordMasteryRules.passed(w,stored));
 }finally{s.close();}
});
test('cancelling a doubt request preserves draft and ignores late response',async()=>{
 let finish,signal;const s=setup({},({signal:value})=>{signal=value;return new Promise(r=>finish=r);});try{const c=s.controller;c.actions.navigate('doubts');c.actions.doubtDraft('这个词如何使用？');const pending=c.actions.askDoubt();c.actions.cancel();assert.equal(signal.aborted,true);finish('迟到解答');await pending;assert.equal(c.model.doubt.messages.length,0);assert.equal(c.model.doubt.draft,'这个词如何使用？');}finally{s.close();}
});
test('all seven current classroom units and direct node links retain actual content',()=>{
 for(const number of [1,2,4,5,6,7,8]){const s=setup({},async()=>'',`unit=english-8a-0${number}`);try{assert.equal(s.controller.model.kind,'english');assert.ok(s.controller.model.lessons.length);const target=s.controller.model.lessons[0],linked=setup({},async()=>'',`unit=english-8a-0${number}&node=lesson:${target.id}`);try{assert.equal(linked.controller.model.view,'lesson');assert.equal(linked.controller.model.lesson.id,target.id);}finally{linked.close();}}finally{s.close();}}
});
test('failed quiz does not create mastery and feynman validation rejects malformed result',async()=>{const s=setup({},async()=>'{"score":10,"feedback":"missing critical errors"}');try{const c=s.controller;c.actions.quiz();c.actions.submitQuiz(c.model.lesson.questions.map(()=> 'wrong'));assert.equal(c.model.attempt.result.saved,false);assert.equal(JSON.parse(s.records[c.model.storageKey]).lessons[c.model.lesson.id].protocol,"three-question-attempt");c.actions.navigate('feynman');c.actions.feynmanDraft('解释定义使用条件并举例');await c.actions.gradeFeynman();assert.match(c.model.notice,/格式不完整/);assert.equal(JSON.parse(s.records[c.model.storageKey]).feynman[c.model.lesson.id].attempts,undefined);}finally{s.close();}});
test('beforeLeave flushes foreground study time while destroy after session invalidation only cleans up',()=>{const s=setup(),now=Date.now();s.w.Date=class extends Date{static now(){return now+5000;}};s.controller.beforeLeave();const saved=s.records[s.controller.model.storageKey];assert.ok(Object.values(JSON.parse(saved).learningTime.days)[0]>=4900);s.expire();s.close();assert.equal(s.records[s.controller.model.storageKey],saved);});
test('actual 90-second timeout rejects late resolved grades while preserving the draft',async()=>{
 let finish,signal,timeout;const s=setup({},({signal:value})=>{signal=value;return new Promise(resolve=>finish=resolve);});
 s.w.setTimeout=(fn,ms)=>{assert.equal(ms,90000);timeout=fn;return 99;};s.w.clearTimeout=()=>{};
 try{const c=s.controller;c.actions.navigate('feynman');c.actions.feynmanDraft('自己的解释和例子');const pending=c.actions.gradeFeynman();timeout();assert.equal(signal.aborted,true);finish(JSON.stringify({score:10,feedback:'迟到评分',criticalErrors:[]}));await pending;const saved=JSON.parse(s.records[c.model.storageKey]).feynman[c.model.lesson.id];assert.equal(saved.attempts,undefined);assert.equal(saved.draft,'自己的解释和例子');assert.match(c.model.notice,/取消|超时/);assert.equal(c.model.busy,false);}finally{s.close();}
});
