const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const F=require('../app/src/main/assets/web/app-design/math-feedback.js');
const answer='三角形的内角和是180度。在平面内成立。例如50度、60度，第三个角70度。外角不能一起相加。';
const sample=()=>({criteria:[
 {id:'core',score:3.5,evidence:'三角形的内角和是180度',feedback:'概念正确'},
 {id:'condition',score:2,evidence:'在平面内成立',feedback:'条件清楚'},
 {id:'example',score:2,evidence:'例如50度、60度，第三个角70度',feedback:'计算正确'},
 {id:'boundary',score:1,evidence:'外角不能一起相加',feedback:'再解释内外角区别'}
],good:['概念正确'],gaps:['再说明内外角关系'],criticalErrors:[],followup:'一个外角等于什么？',comment:'条件与例子完整'});
test('four-part scores are summed independently of a model total and survive storage',()=>{
 const raw={...sample(),score:100};const d=F.parse(JSON.stringify(raw),answer);
 assert.equal(d.score,8.5);assert(F.validGrade({...d,answer}));
 assert(!F.validGrade({...d,answer,score:10}));
 assert.equal((F.render(d).match(/data-feedback-part=/g)||[]).length,4);
 assert(!F.render(F.parse({...sample(),comment:'<img src=x onerror=alert(1)>'},answer)).includes('<img'));
});
test('missing criteria, fabricated quotes and unsupported fractional scores earn no record',()=>{
 for(const mutate of [d=>d.criteria.pop(),d=>d.criteria[1].id='core',d=>d.criteria[0].evidence='不在学生原文中',d=>d.criteria[0].evidence='',d=>d.criteria[0].score=3.2,d=>d.criteria[2].score=3]){
  const d=sample();mutate(d);assert.throws(()=>F.parse(d,answer));
 }
 assert(!F.validGrade({score:8.5,feedback:'旧版不能凭半分直接通过',criticalErrors:[]}));
 assert(F.validGrade({score:8,feedback:'旧记录保留',criticalErrors:[]}));
});
test('critical concept errors cap a seemingly high rubric score below passing',()=>{
 const d=F.parse({...sample(),criticalErrors:['概念中仍有核心错误']},answer);
 assert.equal(d.score,7.5);assert(F.validGrade({...d,answer}));
});
test('teacher answers use the same concept, steps, example and check fields as the lower classroom',()=>{
 const a=F.parseAnswer({answer:'内角和是180度。',steps:['用平行线说明角的关系。'],example:'50度加60度加70度等于180度。',checkQuestion:'一个外角等于哪两个内角之和？'});
 const html=F.renderAnswer(JSON.stringify(a));
 assert.equal((html.match(/data-answer-part=/g)||[]).length,4);
 assert(html.includes('基础概念'));assert(html.includes('看一个例子'));
 assert.equal(F.renderAnswer('历史纯文本答疑'),'历史纯文本答疑');
 assert.throws(()=>F.parseAnswer({answer:'缺少其余模块'}));
 assert.throws(()=>F.parseAnswer({...a,answer:'x'.repeat(6000),steps:['x'.repeat(6000)]}));
 assert(!F.renderAnswer(JSON.stringify({...a,example:'<script>bad()</script>'})).includes('<script>'));
});
test('every upper-term lesson has a packaged MP3 with nonzero duration',()=>{
 const D=require('../app/src/main/assets/web/app-design/math-data.js');
 const dir=path.resolve(__dirname,'../app/src/main/assets/web/app-design'),sandbox={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'math-audio.js'),'utf8'),sandbox);
 const upper=D.chapters.filter(c=>c.term==='upper').flatMap(c=>c.nodes);
 assert.equal(upper.length,32);
 for(const n of upper){const a=sandbox.window.GrowingMathAudio[n.id];assert(a,n.id);assert(a.duration>10);assert(fs.statSync(path.join(dir,a.file)).size>4000);}
});
