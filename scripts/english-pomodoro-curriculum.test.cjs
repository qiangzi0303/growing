const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'../app/src/main/assets/web/app-design'),w={};w.window=w;
const context=vm.createContext(w);
const files=['word-mastery-rules.js','english-engine.js','english-vocabulary.js','english-lessons.js','english-unit3-data.js','english-word-review.js','english-sentence-progress.js','english-sentence-units-13.js','english-sentence-units-2.js','english-sentence-units-45.js','english-sentence-units-678.js','english-sentence-data.js','grammar-scenes/course-registry.js',...[1,2,3,4,6,7,8].map(n=>'grammar-scenes/unit'+n+'-content.js'),'grammar-scenes/unit5-lessons.js','grammar-scenes/unit5-practice.js','english-pomodoro-catalog.js','english-pomodoro-plan.js'];
for(const file of files)vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),context,{filename:file});
const options=n=>({words:w.GrowingEnglishVocabulary[n],lessons:w.GrowingEnglishLessons[n],state:null,engine:w.GrowingEnglishEngine,practice:w.GrowingEnglishPointCourses.get('english-8a-0'+n).practice,sentenceUnit:w.SentenceDemo.units['english-8a-0'+n],sentenceProgress:w.EnglishSentenceProgress.restore(null)});
for(let n=1;n<=8;n++)test('Unit '+n+' requires every textbook word and covers the complete curriculum in fewer balanced rounds',()=>{
 const unitId='english-8a-0'+n,opts=options(n),catalog=w.GrowingEnglishPomodoroCatalog.build(unitId,opts),plan=w.GrowingEnglishPomodoroPlan.build(unitId,catalog);
 assert.ok(opts.words.every(word=>word.optional===false));
 assert.equal(catalog.words.length,opts.words.length);
 assert.equal(plan.rounds.length,[6,6,7,6,8,5,7,6][n-1]);
 const actual=Array.from(plan.rounds.flatMap(r=>r.targets.filter(t=>!t.review)),t=>t.eventId).sort();
 const expected=Array.from(['words','grammar','reading','sentences'].flatMap(k=>Array.from(catalog[k])),t=>t.eventId).sort();
 assert.deepEqual(actual,expected);assert.equal(new Set(actual).size,actual.length);
 for(const r of plan.rounds){
  for(const [category,limit] of [['words',10],['grammar',2],['sentences',8],['reading',1]])assert.ok(r.targets.filter(t=>!t.review&&t.category===category).length<=limit,category);
  assert.deepEqual(Array.from(new Set(r.targets.map(t=>t.category))).sort(),['grammar','reading','sentences','words']);
 }
});
test('formerly optional word mastery is preserved and participates in required review',()=>{
 const opts=options(1),word=opts.words.find(word=>word.textbookOptional);
 assert.ok(word);opts.state=w.GrowingEnglishEngine.restore(null);
 opts.state.words[word.id]={protocol:'seven-recalls',answers:Array(7).fill(word.word)};
 const before=JSON.stringify(opts.state),catalog=w.GrowingEnglishPomodoroCatalog.build('english-8a-01',opts);
 assert.ok(!catalog.words.some(t=>t.wordId===word.id));
 assert.ok(catalog.review.some(t=>t.wordId===word.id));
 const review=w.GrowingEnglishWordReview.plan(opts.words,{},id=>w.GrowingEnglishEngine.wordPassed(opts.words.find(x=>x.id===id),opts.state.words[id]),1800000000000);
 assert.ok(review.dueIds.includes(word.id));
 assert.equal(JSON.stringify(opts.state),before);
});
