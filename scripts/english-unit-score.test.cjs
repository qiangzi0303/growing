const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../app/src/main/assets/web/app-design/english-score.js'),U=require('../app/src/main/assets/web/app-design/english-unit-score.js'),R=require('../app/src/main/assets/web/app-design/english-word-review.js'),E=require('../app/src/main/assets/web/app-design/reward-engine.js');
const words=[{id:'one',word:'one'},{id:'two',word:'two'},{id:'optional',word:'extra',optional:true}],items=[{id:'s1',en:'Hello.'},{id:'s2',en:'Goodbye.'}],lessons=[{id:'l1',title:'阅读',answers:['a','b','c']},{id:'l2',title:'语法',answers:['a','b','c']}];
const recall=w=>({protocol:'seven-recalls',answers:Array(7).fill(w)}),grade=(score,criticalErrors=[])=>({score,feedback:'点评',criticalErrors}),quiz=answers=>({protocol:'three-question-attempt',answers,at:1});
const sentence=en=>({protocol:'sentence-typing-v1',answer:en,wrong:0,hints:0,revealed:false,at:1});
const saved={version:1,sentences:{s1:sentence('Hello.'),s2:sentence('Goodbye.')}};
const full=()=>({words:{one:recall('one'),two:recall('two')},feynman:{l1:{attempts:[grade(10)]},l2:{attempts:[grade(10)]}},lessons:{l1:quiz(['a','b','c']),l2:quiz(['a','b','c'])},learningTime:{version:1,days:{'2026-11-25':40*60000}}});
const marks=(state={},sent=saved)=>S.summary(words,state.words,items,sent,false,{state,lessons});
test('four fixed weights and no redistribution',()=>{
 assert.equal(marks({},null).score,10);
 assert.equal(marks({words:full().words},null).score,45);
 assert.equal(marks({}).score,35);
 const s=marks(full());assert.deepEqual(s.parts,{words:35,sentences:25,lessons:30,wrong:10});assert.equal(s.points,10000);assert.equal(s.cleared,true);assert.deepEqual(s.progress,{done:1000,total:1000});
});
test('each lesson splits Feynman40 quiz50 time10, with unit time shared',()=>{
 const s=marks({feynman:{l1:{attempts:[grade(9)]}},lessons:{l1:quiz(['a','b','wrong'])},learningTime:{days:{'2026-11-25':20*60000}}},null);
 assert.ok(Math.abs(s.lessons.items[0].score-15*(.4*.9+.5*2/3+.1*.5))<1e-9);assert.equal(s.lessons.timeRatio,.5);
});
test('time caps per unit target, rejects invalid dates and non-numeric evidence',()=>{
 const s=marks({learningTime:{days:{'2026-11-25':999999999,'2026-02-30':999999999,'2026-11-24':'999999'}}},null);assert.equal(s.parts.lessons,3);assert.equal(s.lessons.timeRatio,1);
 assert.equal(marks({learningTime:{days:{'2026-02-30':999999}}},null).parts.lessons,0);
});
test('critical error caps score at7.5; better historical valid answer survives',()=>{
 const state=full();state.feynman.l1={attempts:[grade(10,['核心错误'])]};let s=marks(state);assert.equal(s.lessons.items[0].feynman,7.5);assert.equal(s.cleared,false);assert.equal(s.progress.done,788);
 state.feynman.l1.bestFeynman=grade(8);s=marks(state);assert.equal(s.lessons.items[0].feynman,8);assert.equal(s.cleared,true);
});
test('best assessment and best quiz retained beyond history window, malformed evidence ignored',()=>{
 const record={attempts:[grade(9)]},best=U.keepBest(record,grade(2));assert.equal(best.score,9);
 const r={bestFeynman:best,attempts:Array(20).fill(grade(1))};assert.equal(U.keepBest(r,grade(0)).score,9);
 assert.equal(U.quizCorrect(lessons[0],quiz(['a','bad','c'])),2);assert.equal(U.quizCorrect(lessons[0],{protocol:'three-correct',answers:[{},'b','c']}),0);
 assert.equal(U.quizCorrect(lessons[0],U.bestQuiz(lessons[0],quiz(['a','b','c']),quiz(['x','y','z']))),3);
});
test('clear bonus requires every word, sentence and lesson, not time or wrong-word perfection',()=>{
 for(const mutate of [s=>delete s.words.two,s=>s.feynman.l2={attempts:[grade(7)]},s=>s.lessons.l2=quiz(['a','b','bad'])]){const s=full();mutate(s);assert.equal(marks(s).cleared,false);}
 assert.equal(marks(full(),null).cleared,false);
 const s=full();delete s.learningTime;s.wordReview={one:{failedDay:'2026-11-25'}};const m=marks(s);assert.equal(m.cleared,true);assert.equal(m.score,87);assert.equal(m.progress.done,896);
});
test('wrong-word conquest needs independent success on a later day, survives reload and later successes',()=>{
 const at=d=>Date.parse(d+'T12:00:00');let r=R.answer({extension:'keep'},false,false,at('2026-11-24'));
 assert.equal(r.extension,'keep');assert.equal(U.conquered(r),false);
 r=R.answer(r,true,false,at('2026-11-24'));assert.equal(U.conquered(r),false);
 r=R.answer(r,true,true,at('2026-11-25'));assert.equal(U.conquered(r),false);
 r=R.answer(r,true,false,at('2026-11-26'));assert.equal(U.conquered(r),true);assert.equal(r.failedDay,'2026-11-25');
 r=R.answer(JSON.parse(JSON.stringify(r)),true,false,at('2026-11-27'));assert.equal(U.conquered(r),true);
 r=R.answer(r,false,false,at('2026-11-28'));assert.equal(U.conquered(r),false);
});
test('wrong words count only actual vocabulary; optional review failures still count',()=>{
 const m=marks({wordReview:{one:{failedDay:'2026-11-24',conqueredDay:'2026-11-25'},optional:{failedDay:'2026-11-25'},alien:{failedDay:'2026-11-25'}}});assert.deepEqual(m.wrong,{total:2,conquered:1});assert.equal(m.parts.wrong,5);
});
test('Unit3 converts historical0-100 grades, best/100 quiz,80% threshold and LearningTime',()=>{
 const state={mastered:full().words,best:{l1:80,l2:100},studyHistory:{version:1,days:{'2026-11-24':{feynman:{l1:{attempts:1,best:85},l2:{attempts:2,best:100}}}}},learningTime:{days:{'2026-11-25':40*60000}}};
 const m=S.summary(words,state.mastered,items,saved,true,{state,lessons});assert.equal(m.lessons.items[0].feynman,8.5);assert.equal(m.lessons.items[0].quiz,.8);assert.equal(m.cleared,true);assert.equal(m.score,97.6);
 state.best.l1=79;assert.equal(S.summary(words,state.mastered,items,saved,true,{state,lessons}).cleared,false);
});
test('70 points grants56minutes and112yuan; decreasing progress never retracts rewards',()=>{
 let d=E.accrue(E.restore(null,null,U.defaults),560,1000);assert.deepEqual(E.amounts(d),{game:56,cash:11200,availableGame:56,availableCash:11200});
 d=E.accrue(d,80,1000);assert.equal(E.amounts(d).game,56);
});
test('default budget migrates once; custom and redeemed ledgers stay intact',()=>{
 const old=E.restore(null),migrated=E.restore(old,null,U.defaults);assert.equal(migrated.config.gameMinutes,100);assert.equal(migrated.defaultsKey,'english-unit-score-v1');
 assert.equal(E.restore(E.configure(migrated,120,200),null,U.defaults).config.gameMinutes,120);
 assert.equal(E.restore(E.configure(old,120,200),null,U.defaults).config.gameMinutes,120);
 const paid=E.redeem(E.accrue(old,1,2),'cash','家长');assert.equal(E.restore(paid,null,U.defaults).config.gameMinutes,120);
 assert.equal(E.restore(null,{config:{hours:2,yuan:200},award:null},U.defaults).config.gameMinutes,100);
 const previous=E.accrue(old,8,10),next=E.restore(previous,null,U.defaults);assert.equal(E.amounts(next).game,96);assert.equal(E.amounts(E.restore(next,null,U.defaults)).game,96);
});
