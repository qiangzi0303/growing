const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const web=path.join(__dirname,'../app/src/main/assets/web/app-design');
const key='growing-english-course-v1:english-8a-01';
function setup(t,initial){
  const records={[key]:initial??JSON.stringify({version:1,words:{old:{protocol:'seven-recalls',answers:Array(7).fill('old')}},lessons:{},feynman:{},wordCursor:'patient'})};
  const w={console,Date,Math};w.window=w;const context=vm.createContext(w);
  for(const name of ['english-engine','english-word-pilot-data','english-word-pilot-core','student-word-pilot'])vm.runInContext(fs.readFileSync(path.join(web,name+'.js'),'utf8'),context);
  let expired=false,failed=false,time=1800000000000,stops=0;
  const storage={getItem:k=>records[k]??null,setItem(k,v){if(failed)throw Error('disk full');records[k]=v;}};
  const options={storage,active(){if(expired)throw Error('account changed');},now:()=>time,speech:{stop(){stops++;},play(){}}};
  const c=w.GrowingStudentWordPilot.create(options);t.after(()=>c.destroy());
  return {w,c,records,options,fail(value=true){failed=value;},expire(){expired=true;},setTime(value){time=value;},get stops(){return stops;}};
}

test('pilot saves resume position separately and preserves formal course records',t=>{
  const h=setup(t),before=JSON.parse(h.records[key]);h.c.actions.start();h.c.actions.next();
  const saved=JSON.parse(h.records[key]);assert.deepEqual(saved.words,before.words);assert.equal(saved.wordCursor,'patient');
  assert.equal(saved.wordPilot.session.index,1);
  const restored=h.w.GrowingEnglishEngine.restore(saved);assert.deepEqual(JSON.parse(JSON.stringify(restored.wordPilot)),saved.wordPilot);
  const other=h.w.GrowingStudentWordPilot.create(h.options);t.after(()=>other.destroy());other.actions.start();
  assert.equal(other.model.state.session.index,1);
});

test('failed saves retain current answer and prevent continuing until retry succeeds',t=>{
  const h=setup(t);h.c.actions.start();while(h.c.model.step.kind==='intro')h.c.actions.next();
  const step=h.c.model.step;h.fail();h.c.actions.answer(step.wordId);
  assert.equal(h.c.model.unsaved,true);assert.ok(h.c.model.state.session.feedback);
  const index=h.c.model.state.session.index;h.c.actions.next();assert.equal(h.c.model.state.session.index,index);
  h.fail(false);h.c.actions.retrySave();assert.equal(h.c.model.unsaved,false);h.c.actions.next();assert.equal(h.c.model.state.session.index,index+1);
});

test('corrupt pilot record is preserved and reported without disabling the existing course',t=>{
  const raw=JSON.stringify({version:1,words:{},lessons:{},feynman:{},wordPilot:{version:999}}),h=setup(t,raw);
  assert.match(h.c.model.error,/记录|版本|格式/);h.c.actions.start();assert.equal(h.records[key],raw);
  assert.equal(h.w.GrowingEnglishEngine.restore(JSON.parse(raw)).wordPilot.version,999);
});

test('pilot detects conflicting records while allowing unrelated classroom updates',t=>{
  const h=setup(t);h.c.actions.start();const course=JSON.parse(h.records[key]);course.learningTime={version:1,days:{'2026-11-18':1000}};h.records[key]=JSON.stringify(course);
  h.c.actions.next();assert.equal(h.c.model.unsaved,false);assert.equal(JSON.parse(h.records[key]).learningTime.days['2026-11-18'],1000);
  const changed=JSON.parse(h.records[key]);changed.wordPilot=null;h.records[key]=JSON.stringify(changed);const before=h.records[key];
  h.c.actions.next();assert.equal(h.records[key],before);assert.equal(h.c.model.unsaved,true);assert.match(h.c.model.notice,/其他|另一|更新/);
});

test('expired or destroyed controller cannot write another account or resume audio',t=>{
  const h=setup(t);h.c.actions.start();const before=h.records[key];h.expire();assert.throws(()=>h.c.actions.next(),/account changed/);assert.equal(h.records[key],before);
  h.c.destroy();assert.throws(()=>h.c.actions.start(),/关闭/);assert.ok(h.stops>0);
});

test('full round records only first answers, keeps scores separate, and schedules later review',t=>{
  const h=setup(t),a=h.c.actions; a.start();let first=true;
  for(let limit=0;limit<60&&!h.c.model.state.session.finishedAt;limit++){
    const m=h.c.model;if(m.step.kind==='intro'){a.next();continue;}
    a.answer(first?'wrong':m.word.word);first=false;a.answer(m.word.word);a.next();
  }
  const m=h.c.model;assert.ok(m.state.session.finishedAt);assert.equal(m.summary.total,10);assert.equal(m.summary.correct,9);
  assert.equal(Object.keys(m.state.cards).length,10);assert.equal(m.plan.due.length,0);
  assert.equal(JSON.parse(h.records[key]).words.old.protocol,'seven-recalls');
  h.setTime(1800000000000+86400000);a.home();assert.equal(h.c.model.plan.due.length,10);
  a.card('patient');assert.equal(h.c.model.word.id,'patient');
});

test('opening a word card during a saved session uses the selected word and keeps the current question',t=>{
 const h=setup(t),a=h.c.actions;a.start();const id=h.c.model.step.wordId;
 a.home();a.card('unhappy');assert.equal(h.c.model.word.id,'unhappy');a.start();assert.equal(h.c.model.word.id,id);
});

test('looking up the current unanswered word counts as a hint after resuming',t=>{
 const h=setup(t),a=h.c.actions;a.start();while(h.c.model.step.kind==='intro')a.next();
 const id=h.c.model.word.id;a.home();a.card(id);a.home();a.start();a.answer(id);
 assert.equal(h.c.model.summary.correct,0);assert.equal(h.c.model.summary.hinted,1);
 assert.equal(h.c.model.state.cards[id].streak,0);
});
