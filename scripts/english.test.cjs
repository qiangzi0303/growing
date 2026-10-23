const assert=require('node:assert/strict');
global.window={};
require('../app/src/main/assets/web/app-design/curriculum.js');require('../app/src/main/assets/web/app-design/english-vocabulary.js');require('../app/src/main/assets/web/app-design/english-lessons.js');
const E=require('../app/src/main/assets/web/app-design/english-engine.js'),R=require('../app/src/main/assets/web/app-design/reward-engine.js');
let checks=0;
const check=(name,fn)=>{fn();checks++;};
const vocab=window.GrowingEnglishVocabulary,lessons=window.GrowingEnglishLessons;
for(const [number,words] of Object.entries(vocab)){
  const ls=lessons[number],unit=window.GrowingCurriculum.english.terms.upper.units.find(u=>u.number===Number(number));
  check('verified entry '+number,()=>assert.equal(unit.entry,'english-course.html?unit='+unit.id));
  check('unique words and lessons '+number,()=>{assert.equal(new Set(words.map(w=>w.id)).size,words.length);assert.equal(new Set(ls.map(l=>l.id)).size,ls.length);});
  const state=E.restore(null);
  for(const w of words){
    check('six recalls never pass '+number+'/'+w.id,()=>assert.equal(E.wordPassed(w,{protocol:'seven-recalls',answers:Array(6).fill(w.word)}),false));
    state.words[w.id]={protocol:'seven-recalls',answers:Array(7).fill(w.word.toUpperCase())};
    check('mastery respects textbook star '+number+'/'+w.id,()=>assert.equal(E.wordPassed(w,state.words[w.id]),!w.optional));
    check('one wrong answer invalidates proof '+number+'/'+w.id,()=>assert.equal(E.wordPassed(w,{protocol:'seven-recalls',answers:[...Array(6).fill(w.word),'incorrect answer']}),false));
  }
  for(const l of ls){
    check('three unambiguous questions '+number+'/'+l.id,()=>{assert.equal(l.questions.length,3);for(const q of l.questions){assert(q.explain);assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert(q.options.includes(q.answer));}});
    const answers=l.questions.map(q=>q.answer);state.lessons[l.id]={protocol:'three-correct',answers};
    check('correct answers pass '+number+'/'+l.id,()=>assert(E.lessonPassed(l,state.lessons[l.id])));
    check('incorrect answer does not pass '+number+'/'+l.id,()=>assert.equal(E.lessonPassed(l,{protocol:'three-correct',answers:[l.questions[0].options[1],...answers.slice(1)]}),false));
  }
  check('complete unit capped at full budget '+number,()=>{const p=E.progress(words,ls,E.restore(JSON.parse(JSON.stringify(state))));assert.equal(p.done,p.total);const a=R.amounts(R.accrue(R.restore(null),p.done,p.total));assert.equal(a.game,120);assert.equal(a.cash,20000);});
  check('truthy flags cannot create mastery '+number,()=>{const fake=E.restore(null);for(const w of words)fake.words[w.id]=true;for(const l of ls)fake.lessons[l.id]={score:100};assert.equal(E.progress(words,ls,fake).done,0);});
}
check('original unit 3 route is preserved',()=>assert.equal(window.GrowingCurriculum.english.terms.upper.units[2].entry,'../word-ops-unit3/index.html'));
check('unverified lower book has no fabricated entry',()=>assert(window.GrowingCurriculum.english.terms.lower.units.every(u=>!u.entry)));
check('phrase punctuation and dialect variants',()=>{assert(E.matches('fill ... with','fill…with'));assert(E.matches("catch one's eye","catch one’s eye"));assert(E.matches('programme','program'));assert(E.matches('humour','humor'));assert(!E.matches('French','France'));});
check('invalid archive is not silently replaced',()=>{for(const s of [{},{version:9,words:{},lessons:{}},{version:1,words:[],lessons:{}}])assert.throws(()=>E.restore(s));});
check('old English archives gain an empty Feynman section without losing words',()=>{const old={version:1,words:{one:{protocol:'seven-recalls'}},lessons:{}};const restored=E.restore(old);assert.deepEqual(restored.words,old.words);assert.deepEqual(restored.feynman,{});});
check('Feynman draft and grades survive restore and unrelated lesson saves',()=>{const feynman={reading:{draft:'自己的解释',attempts:[{score:8,feedback:'准确',criticalErrors:[]}]}};const restored=E.restore({version:1,words:{},lessons:{},feynman});restored.lessons.reading={protocol:'three-correct'};assert.deepEqual(E.restore(restored).feynman,feynman);assert.equal(E.progress(vocab[1],lessons[1],restored).done,0);});
check('damaged Feynman records are rejected without replacing original archives',()=>{for(const feynman of [true,[],{reading:true},{reading:{draft:9}},{reading:{attempts:true}}])assert.throws(()=>E.restore({version:1,words:{},lessons:{},feynman}));});
console.log('PASS '+checks+' English data and mastery checks');
