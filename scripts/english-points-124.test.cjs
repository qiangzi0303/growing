const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'../app/src/main/assets/web/app-design');
for(const unit of [1,2,4])test(`Unit ${unit}: every existing lesson has focused storyboards and ten unique questions per point`,()=>{
 const courses={};const w={GrowingEnglishPointCourses:{define:(id,c)=>{assert.equal(id,`english-8a-0${unit}`);courses[id]=c;}}};w.window=w;
 const context=vm.createContext(w);
 vm.runInContext(fs.readFileSync(path.join(base,'english-lessons.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(base,`grammar-scenes/unit${unit}-content.js`),'utf8'),context);
 const lessons=courses[`english-8a-0${unit}`].lessons;
 assert.deepEqual(Object.keys(lessons).sort(),Array.from(w.GrowingEnglishLessons[unit],l=>l.id).sort());
 const allPrompts=new Set();
 for(const lesson of Object.values(lessons)){
  assert.ok(lesson.tab);assert.ok(lesson.points.length>=2);
  assert.equal(new Set(lesson.points.map(p=>p.id)).size,lesson.points.length);
  for(const p of lesson.points){
   for(const field of ['id','title','rule','pitfall','sentence','translation','explain'])assert.equal(typeof p[field],'string',field);
   assert.ok(['compare','quantity','sequence','action','choice','transform','weather','reflexive'].includes(p.animation.kind));
   assert.equal(p.animation.labels.length,3);assert.ok(p.animation.actors.length<=2);assert.equal(p.rows.length,10);
   for(const [prompt,choices,explanation] of p.rows){
    assert.ok(!allPrompts.has(prompt),prompt);allPrompts.add(prompt);assert.ok(explanation.trim());
    const options=choices.split('|');assert.ok(options.length>=3);assert.equal(new Set(options).size,options.length);assert.ok(options.every(s=>s.trim()));
   }
  }
 }
});
