const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'../app/src/main/assets/web/app-design');
function setup(records={},unit='english-8a-05'){
 const w={URLSearchParams,Date,Math,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,document:{hidden:false,hasFocus:()=>true,querySelector:()=>null,addEventListener(){},removeEventListener(){}},addEventListener(){},removeEventListener(){},dispatchEvent(){},CustomEvent:class{},GrowingCourseSpeech:{create:()=>({stop(){},play(){}})}};w.window=w;
 const ctx=vm.createContext(w);for(const file of ['curriculum.js','word-mastery-rules.js','english-unit-score.js','english-score.js','english-engine.js','english-vocabulary.js','english-lessons.js','grammar-scenes/unit5-lessons.js','grammar-scenes/unit5-practice.js','student-english-course.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx);
 let alive=true;const storage={getItem:k=>records[k]??null,setItem:(k,v)=>{records[k]=v;}};
 const c=w.GrowingStudentEnglishCourse.create({params:new URLSearchParams({unit,node:'lesson:reading'}),storage,active(){if(!alive)throw Error('expired');}});
 return {w,c,records,storage,close:()=>c.destroy(),expire:()=>alive=false};
}
test('18 aligned points each have 10 stable, distinct, graded and sourced questions',()=>{
 const s=setup();try{const P=s.w.GrowingUnit5Practice,ids=new Set();let count=0;
 for(const [lesson,points] of Object.entries(P.groups)){
  assert.equal(points.length,s.w.GrowingGrammarSceneLessons[lesson].steps.length);
  for(const p of points){assert.equal(p.questions.length,10);assert.equal(new Set(p.questions.map(q=>q.prompt)).size,10);
   assert.deepEqual(Array.from(p.questions,q=>q.level),[...Array(6).fill('基础'),'提高','提高','难题','综合应用']);
   for(const q of p.questions){assert.ok(!ids.has(q.id));ids.add(q.id);count++;assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options[q.answer]);assert.ok(q.explanation.trim());assert.equal(q.source,'原创易错题');}
   const r=P.empty();r.best=10;assert.equal(P.score(p,r),0,'unanswered is not correct');for(const q of p.questions)r.answers[q.id]={choice:q.answer,checked:false};assert.equal(P.score(p,r),0,'unsubmitted is not correct');for(const a of Object.values(r.answers))a.checked=true;assert.equal(P.score(p,r),10);r.answers[p.questions[0].id].choice=(p.questions[0].answer+1)%p.questions[0].options.length;assert.equal(P.score(p,r),9);
  }
 }assert.equal(count,180);
 }finally{s.close();}
});
test('point saves preserve legacy records, question identity, other points and reload drafts',()=>{
 const key='growing-english-course-v1:english-8a-05',legacy={version:1,words:{old:{protocol:'seven-recalls',answers:['x']}},lessons:{reading:{protocol:'three-correct',answers:['Bamboo.','Setting up nature reserves.','to']}},feynman:{},extra:{keep:true}};
 const records={[key]:JSON.stringify(legacy)},s=setup(records);
 try{const P=s.w.GrowingUnit5Practice,p=P.point('reading','growth'),r=P.empty();r.answers[p.questions[0].id]={choice:p.questions[0].answer,checked:true};r.best=10;
  const saved=s.c.actions.pointSave('reading','growth',r,null);assert.equal(saved.best,1,'caller cannot invent perfect score');assert.equal(saved.total,10);
  const raw=JSON.parse(records[key]);assert.deepEqual(raw.words,legacy.words);assert.deepEqual(raw.lessons,legacy.lessons);assert.deepEqual(raw.extra,legacy.extra);
  const other=P.empty();s.c.actions.pointSave('reading','habitat',other,null);assert.equal(s.c.actions.pointRead('reading','growth').best,1);
  const again=setup(records);try{assert.equal(again.c.actions.pointRead('reading','growth').answers[p.questions[0].id].checked,true);}finally{again.close();}
  const changed=JSON.parse(records[key]);changed.extra.concurrent=true;records[key]=JSON.stringify(changed);saved.index=1;s.c.actions.pointSave('reading','growth',saved,s.c.actions.pointRead('reading','growth'));assert.equal(JSON.parse(records[key]).extra.concurrent,true);
 }finally{s.close();}
});
test('failed save blocks leaving, retry is idempotent, conflicts and expired accounts cannot overwrite',()=>{
 const s=setup();try{const P=s.w.GrowingUnit5Practice,p=P.point('reading','growth'),r=P.empty();r.answers[p.questions[0].id]={choice:p.questions[0].answer,checked:true};const set=s.storage.setItem;s.storage.setItem=()=>{throw Error('quota');};
 assert.throws(()=>s.c.actions.pointSave('reading','growth',r,null),/quota/);assert.equal(s.c.model.pointUnsaved,true);s.c.actions.lesson('purpose');assert.equal(s.c.model.lesson.id,'reading');s.c.actions.quiz();assert.equal(s.c.model.view,'lesson');
 s.storage.setItem=set;const saved=s.c.actions.pointSave('reading','growth',r,null);assert.equal(saved.best,1);assert.equal(s.c.model.pointUnsaved,false);const once=JSON.parse(s.records[s.c.model.storageKey]);s.c.actions.pointSave('reading','growth',saved,saved);assert.deepEqual(JSON.parse(s.records[s.c.model.storageKey]),once);
 assert.throws(()=>s.c.actions.pointSave('reading','growth',r,null),/另一页面/);assert.deepEqual(JSON.parse(s.records[s.c.model.storageKey]),once);s.expire();assert.throws(()=>s.c.actions.pointSave('reading','growth',saved,saved),/expired/);assert.deepEqual(JSON.parse(s.records[s.c.model.storageKey]),once);
 }finally{s.close();}
});
test('wrong unit, corrupt records and foreign question IDs are rejected without overwriting',()=>{
 const s=setup();try{const r=s.w.GrowingUnit5Practice.empty();r.answers.foreign={choice:0,checked:true};assert.throws(()=>s.c.actions.pointSave('reading','growth',r,null),/不匹配/);assert.equal(s.records[s.c.model.storageKey],undefined);
 for(const corrupt of [false,[],{version:9}]){s.records[s.c.model.storageKey]=JSON.stringify({version:1,words:{},lessons:{},feynman:{},pointPractice:{reading:{growth:corrupt}}});const before=s.records[s.c.model.storageKey];assert.throws(()=>s.c.actions.pointRead('reading','growth'),/无法识别/);assert.equal(s.records[s.c.model.storageKey],before);}
 }finally{s.close();}
 const other=setup({},'english-8a-04');try{assert.throws(()=>other.c.actions.pointRead('reading','growth'),/不属于/);}finally{other.close();}
});
