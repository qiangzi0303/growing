const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'../app/src/main/assets/web/app-design/grammar-scenes');
function registry(){const w={};w.window=w;vm.runInNewContext(fs.readFileSync(path.join(root,'course-registry.js'),'utf8'),w);return w.GrowingEnglishPointCourses;}
const data=()=>({lessons:{reading:{tab:'阅读',points:[{id:'evidence',title:'证据',rule:'看事实',pitfall:'不猜测',sentence:'She helps.',translation:'她帮助别人。',explain:'用行为说明品质。',animation:{kind:'sequence',actors:['她'],labels:['观察','证据','结论']},rows:Array.from({length:10},(_,i)=>['题'+i,'正确|错误|无关','根据证据判断。'])}]}}});
test('registry keeps complete unit IDs, stable question IDs, rotated choices and separate point records',()=>{
 const r=registry();for(const id of ['english-8a-01','english-8b-01'])r.define(id,data());
 const a=r.get('english-8a-01'),b=r.get('english-8b-01'),p=a.practice.point('reading','evidence');
 assert.notEqual(p.questions[0].id,b.practice.point('reading','evidence').questions[0].id);
 assert.equal(a.lessons.reading.steps[0].scene,'english-8a-01-reading-evidence');
 assert.deepEqual(Array.from(p.questions,q=>q.level),[...Array(6).fill('基础'),'提高','提高','难题','综合应用']);
 const rec=a.practice.empty();assert.equal(a.practice.score(p,rec),0);
 for(const q of p.questions){assert.equal(q.options[q.answer],'正确');rec.answers[q.id]={choice:q.answer,checked:true};}
 assert.equal(a.practice.score(p,rec),10);a.practice.validate(p,rec);
 assert.throws(()=>b.practice.validate(b.practice.point('reading','evidence'),rec),/不匹配/);
 assert.equal(r.get('english-8b-02'),undefined);
});
test('invalid definitions and records fail without replacing valid content',()=>{
 const r=registry();r.define('english-8a-01',data());assert.throws(()=>r.define('english-8a-01',data()),/重复/);
 const bad=data();bad.lessons.reading.points[0].rows.pop();assert.throws(()=>r.define('english-8a-02',bad),/10/);assert.equal(r.get('english-8a-02'),undefined);
 const p=r.get('english-8a-01').practice;for(const value of [false,[],{version:9}, {...p.empty(),index:10}])assert.throws(()=>p.validate(p.point('reading','evidence'),value),/无法识别/);
});
