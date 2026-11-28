const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'../app/src/main/assets/web/app-design');
function setup(unit,records={}){
 const w={URLSearchParams,Date,Math,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,document:{hidden:false,hasFocus:()=>true,querySelector:()=>null,addEventListener(){},removeEventListener(){}},addEventListener(){},removeEventListener(){},dispatchEvent(){},CustomEvent:class{},GrowingCourseSpeech:{create:()=>({stop(){},play(){}})}};w.window=w;
 const ctx=vm.createContext(w);for(const file of ['curriculum.js','word-mastery-rules.js','english-unit-score.js','english-score.js','english-engine.js','english-vocabulary.js','english-lessons.js','english-unit3-data.js','grammar-scenes/course-registry.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),ctx);
 for(const file of w.GrowingEnglishPointCourses.assets[unit])vm.runInContext(fs.readFileSync(path.join(base,'grammar-scenes',file),'utf8'),ctx);
 vm.runInContext(fs.readFileSync(path.join(base,'student-english-course.js'),'utf8'),ctx);
 let alive=true;const storage={getItem:k=>records[k]??null,setItem:(k,v)=>records[k]=v},first=Object.keys(w.GrowingEnglishPointCourses.get(unit).practice.groups)[0];
 const c=w.GrowingStudentEnglishCourse.create({params:new URLSearchParams({unit,node:'lesson:'+first}),storage,active(){if(!alive)throw Error('expired');}});
 return {w,c,storage,records,expire:()=>alive=false};
}
test('all eight units map every lesson to graded points and retain original course assessments',()=>{
 let points=0,questions=0;const ids=new Set();
 for(let n=1;n<=8;n++){const id='english-8a-0'+n,s=setup(id);try{
  const course=s.w.GrowingEnglishPointCourses.get(id),lessons=s.w.GrowingEnglishLessons[n];assert.equal(s.c.model.kind,'english');
  assert.deepEqual(Object.keys(course.practice.groups).sort(),Array.from(lessons,l=>l.id).sort());
  for(const [lesson,group] of Object.entries(course.practice.groups)){
   assert.equal(group.length,course.lessons[lesson].steps.length);assert.ok(lessons.find(l=>l.id===lesson).questions.length>=3);
   for(const p of group){points++;assert.equal(p.questions.length,10);const rec=course.practice.empty();rec.best=10;assert.equal(course.practice.score(p,rec),0);
    assert.equal(p.questions.filter(q=>q.type==='fill').length,5);assert.equal(p.questions.filter(q=>q.type!=='fill').length,5);
    for(const q of p.questions){questions++;assert.ok(!ids.has(q.id));ids.add(q.id);if(q.type==='fill'){assert.equal(q.answers.length,(q.prompt.match(/___/g)||[]).length);assert.ok(q.answers.every(forms=>forms.length&&forms.every(a=>a.trim())));}else{assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options[q.answer]);}assert.ok(q.explanation);assert.equal(q.source,'原创易错题');}
   }
  }
 }finally{s.c.destroy();}}
 console.log({units:8,points,questions});
});

test('mixed questions require written answers and preserve old ten-choice achievements without passing new questions',()=>{
 for(let n=1;n<=8;n++){
  const s=setup('english-8a-0'+n);try{
   const P=s.w.GrowingEnglishPointCourses.get(s.c.model.unit.id).practice;
   for(const [lesson,points] of Object.entries(P.groups))for(const p of points){
    const old=P.empty();old.best=10;old.custom='keep';
    for(const q of [...p.questions.slice(0,5),...p.legacyQuestions])old.answers[q.id]={choice:q.answer,checked:true};
    P.validate(p,old);assert.equal(P.score(p,old),5);assert.equal(P.best(p,old),5);
    const r=JSON.parse(JSON.stringify(old));
    for(const q of p.questions.slice(5))r.answers[q.id]={texts:q.answers.map(forms=>'  '+forms[0].toUpperCase()+'  '),checked:false};
    assert.equal(P.score(p,r),5,'typing without checking gives no credit');
    for(const q of p.questions.slice(5))r.answers[q.id].checked=true;
    P.validate(p,r);assert.equal(P.score(p,r),10);
    const last=p.questions.at(-1);r.answers[last.id].texts[last.answers.length-1]='wrong';assert.equal(P.score(p,r),9,'all blanks in a question must pass');
    r.answers[last.id].texts[last.answers.length-1]='';assert.throws(()=>P.validate(p,r),/不匹配/);
    r.answers[last.id].texts[last.answers.length-1]=last.answers.at(-1)[0];
    const saved=P.savedRecord(p,r,old);assert.equal(saved.best,10);assert.equal(saved.legacyBest,10);assert.equal(saved.custom,'keep');
    for(const q of p.legacyQuestions)assert.deepEqual(saved.answers[q.id],old.answers[q.id]);
    const forged=P.empty();forged.best=10;assert.equal(P.savedRecord(p,forged,null).best,0,'incoming score cannot forge mastery');
   }
  }finally{s.c.destroy();}
 }
});

test('controller saves fill drafts, preserves old answers, retries failure and rejects stale or foreign records',()=>{
 const unit='english-8a-03',s=setup(unit);try{
  const P=s.w.GrowingEnglishPointCourses.get(unit).practice,lesson='patterns',p=P.groups[lesson][0],q=p.questions[5],old=P.empty();
  old.best=10;old.extra='preserve';for(const item of [...p.questions.slice(0,5),...p.legacyQuestions])old.answers[item.id]={choice:item.answer,checked:true};
  const raw=JSON.parse(s.records[s.c.model.storageKey]||'{"version":1,"words":{},"lessons":{},"feynman":{}}');raw.pointPractice={[lesson]:{[p.id]:old}};raw.extra={keep:true};s.records[s.c.model.storageKey]=JSON.stringify(raw);
  const current=s.c.actions.pointRead(lesson,p.id),draft=JSON.parse(JSON.stringify(current));draft.index=5;draft.answers[q.id]={texts:['unfinished'],checked:false};
  const save=s.storage.setItem;s.storage.setItem=()=>{throw Error('quota');};assert.throws(()=>s.c.actions.pointSave(lesson,p.id,draft,current),/quota/);assert.equal(s.c.model.pointUnsaved,true);
  assert.deepEqual(s.c.actions.pointRead(lesson,p.id),current);s.storage.setItem=save;
  const saved=s.c.actions.pointSave(lesson,p.id,draft,current);assert.equal(saved.best,5);assert.equal(saved.legacyBest,10);assert.equal(saved.extra,'preserve');assert.equal(saved.answers[q.id].texts[0],'unfinished');
  assert.equal(JSON.parse(s.records[s.c.model.storageKey]).extra.keep,true);assert.equal(s.c.model.pointUnsaved,false);
  assert.throws(()=>s.c.actions.pointSave(lesson,p.id,draft,current),/另一页面/);
  const again=setup(unit,s.records);try{assert.equal(again.c.actions.pointRead(lesson,p.id).answers[q.id].texts[0],'unfinished');}finally{again.c.destroy();}
  const foreign=JSON.parse(JSON.stringify(saved));foreign.answers['english-8a-02-foreign']={texts:['x'],checked:true};assert.throws(()=>s.c.actions.pointSave(lesson,p.id,foreign,saved),/不匹配/);
  s.expire();assert.throws(()=>s.c.actions.pointRead(lesson,p.id),/expired/);
 }finally{s.c.destroy();}
});
test('shared controller isolates units and preserves records through failure, retry, conflict and reload',()=>{
 const records={};for(let n=1;n<=8;n++){
  const id='english-8a-0'+n,s=setup(id,records),P=s.w.GrowingEnglishPointCourses.get(id).practice,lesson=Object.keys(P.groups)[0],p=P.groups[lesson][0],q=p.questions[0],r=P.empty();
  try{r.answers[q.id]={choice:q.answer,checked:true};r.best=10;
   const original=s.storage.setItem;s.storage.setItem=()=>{throw Error('quota');};assert.throws(()=>s.c.actions.pointSave(lesson,p.id,r,null),/quota/);s.c.actions.navigate('words');assert.equal(s.c.model.view,'lesson');
   s.storage.setItem=original;const saved=s.c.actions.pointSave(lesson,p.id,r,null);assert.equal(saved.best,1);assert.equal(s.c.model.pointUnsaved,false);
   const key=s.c.model.storageKey,raw=JSON.parse(records[key]);raw.extra={keep:true};records[key]=JSON.stringify(raw);saved.index=1;s.c.actions.pointSave(lesson,p.id,saved,s.c.actions.pointRead(lesson,p.id));assert.equal(JSON.parse(records[key]).extra.keep,true);
   assert.throws(()=>s.c.actions.pointSave(lesson,p.id,r,null),/另一页面/);s.expire();assert.throws(()=>s.c.actions.pointRead(lesson,p.id),/expired/);
   const again=setup(id,records);try{assert.equal(again.c.actions.pointRead(lesson,p.id).index,1);}finally{again.c.destroy();}
  }finally{s.c.destroy();}
 }
 assert.equal(Object.keys(records).length,8);assert.equal(records.wordops_8A_unit3,undefined);
});
