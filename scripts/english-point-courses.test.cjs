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
    for(const q of p.questions){questions++;assert.ok(!ids.has(q.id));ids.add(q.id);assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options[q.answer]);assert.ok(q.explanation);assert.equal(q.source,'原创易错题');}
   }
  }
 }finally{s.c.destroy();}}
 console.log({units:8,points,questions});
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
