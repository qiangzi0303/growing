const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base=__dirname+'/../app/src/main/assets/web/app-design/';
const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(base+'english-lessons.js','utf8'),context);
const E=require(base+'english-engine.js'),S=require(base+'english-unit-score.js');
test('every shared grammar lesson has a matching pitfall and extra quiz; old mastery survives',()=>{
 const lessons=Object.values(context.window.GrowingEnglishLessons).flat().filter(l=>l.title.startsWith('语法：'));
 assert.equal(lessons.length,16);
 for(const l of lessons){
  assert.ok(l.pitfall.rule&&l.pitfall.correct&&l.pitfall.wrong);
  assert.equal(l.questions.length,4);assert.equal(l.legacyQuestionCount,3);
  assert.ok(l.questions[3].prompt.startsWith('【必考坑】'));
  const answers=Array.from(l.questions,q=>q.answer);
  const old={protocol:'three-correct',answers:answers.slice(0,3)};
  assert.equal(E.lessonPassed(l,old),true);assert.equal(S.quizCorrect(l,old),3);
  const full={protocol:'three-correct',answers};
  assert.equal(E.lessonPassed(l,full),true);assert.equal(S.quizCorrect(l,full),3);
  const wrong={protocol:'three-question-attempt',answers:[...answers.slice(0,3),'wrong']};
  assert.equal(E.lessonPassed(l,wrong),false);assert.equal(S.quizCorrect(l,wrong),2.25);
  assert.equal(S.quizCorrect(l,{protocol:'three-correct',answers:answers.slice(0,2)}),0);
 }
 assert.equal(context.window.GrowingEnglishLessons[5].find(l=>l.id==='object-to').questions[3].answer,'to work');
});
