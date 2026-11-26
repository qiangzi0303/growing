const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../app/src/main/assets/web/app-design');
for(const unit of [6,7,8])test(`Unit ${unit} covers existing lessons with distinct ten-question points`,()=>{
 const packs={};const w={};w.window=w;
 vm.runInNewContext(fs.readFileSync(path.join(root,'grammar-scenes/course-registry.js'),'utf8'),w);
 const define=w.GrowingEnglishPointCourses.define;
 w.GrowingEnglishPointCourses.define=(id,pack)=>{assert.equal(id,`english-8a-0${unit}`);packs[id]=pack;define(id,pack);};
 vm.runInNewContext(fs.readFileSync(path.join(root,'english-lessons.js'),'utf8'),w);
 vm.runInNewContext(fs.readFileSync(path.join(root,`grammar-scenes/unit${unit}-content.js`),'utf8'),w);
 const lessons=packs[`english-8a-0${unit}`].lessons;
 assert.deepEqual(Object.keys(lessons).sort(),Array.from(w.GrowingEnglishLessons[unit],l=>l.id).sort());
 const prompts=new Set(),ids=new Set(),registered=w.GrowingEnglishPointCourses.get(`english-8a-0${unit}`);
 for(const [id,l] of Object.entries(lessons)){
  assert.ok(l.tab);assert.ok(l.points.length>=2&&l.points.length<=3);assert.equal(new Set(l.points.map(p=>p.id)).size,l.points.length);
  for(const p of l.points){
   for(const key of ['id','title','rule','pitfall','sentence','translation','explain'])assert.ok(typeof p[key]==='string'&&p[key].trim(),`${id}/${p.id}/${key}`);
   assert.ok(['compare','quantity','sequence','action','choice','transform','weather','reflexive'].includes(p.animation.kind));
   assert.equal(p.animation.labels.length,3);assert.ok(p.animation.actors.length<=2);
   assert.equal(p.rows.length,10,`${id}/${p.id}`);
   for(const [prompt,choices,why] of p.rows){assert.ok(prompt&&why);assert.ok(!prompts.has(prompt),`duplicate: ${prompt}`);prompts.add(prompt);const options=choices.split('|');assert.ok(options.length>=3);assert.equal(new Set(options).size,options.length);}
   const P=registered.practice,point=P.point(id,p.id),record=P.empty();assert.equal(P.score(point,record),0);
   assert.deepEqual(Array.from(point.questions,q=>q.level),[...Array(6).fill('基础'),'提高','提高','难题','综合应用']);
   for(const q of point.questions){assert.ok(!ids.has(q.id));ids.add(q.id);assert.ok(q.id.startsWith(`english-8a-0${unit}-`));assert.equal(q.source,'原创易错题');record.answers[q.id]={choice:q.answer,checked:false};}
   assert.equal(P.score(point,record),0,'chosen but unsubmitted answers do not count');
   for(const q of point.questions)record.answers[q.id].checked=true;
   P.validate(point,record);assert.equal(P.score(point,record),10);
  }
 }
});
