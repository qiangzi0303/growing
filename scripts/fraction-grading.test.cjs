const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../app/src/main/assets/web/fraction-ops/分式作战_一分钟学习版.html'),'utf8');
const answer='我认为通分是将异分母分式转化为同分母分式，将分式的分子和分母同乘一个不为零的整式。新的两个分式共同的分母叫做公分母。原分母不为零分母乘什么分子也得乘什么如二X分之一与X方分之二。通分后变成二X方分之X与二X方分之四X.共同的分母叫做公分母2';
const topics=vm.runInNewContext(source.slice(source.indexOf('const t=(id,title'),source.indexOf('\n];',source.indexOf('const topics=['))+4)+';topics');
const topic=topics.find(t=>t.id==='common');
const sample=()=>({criteria:[
 {id:'core',score:3,evidence:'通分是将异分母分式转化为同分母分式',feedback:'说明了统一分母。'},
 {id:'condition',score:2,evidence:'原分母不为零分母乘什么分子也得乘什么',feedback:'使用条件清楚。'},
 {id:'example',score:0,evidence:'二X分之一与X方分之二',feedback:'第二个结果的分子应为4，不能再乘一个x。'},
 {id:'boundary',score:0,evidence:'',feedback:'还可说明最简公分母的选法。'}
],good:['理解异分母转同分母'],gaps:['第二个结果的分子应为4'],criticalErrors:[],followup:'第二个分母到底乘了几？',comment:'请检查例子的第二个分子。'});
function setup(replies){
 const calls=[],context={window:{MINUTE_TEXTBOOK:{common:{definition:'异分母变同分母，各分式值不变。'}}},callModel:async(task,signal)=>{calls.push({task,signal});const result=replies.shift();if(result instanceof Error)throw result;return typeof result==='string'?result:JSON.stringify(result);}};
 const prompt=source.slice(source.indexOf('function promptFor('),source.indexOf('\nasync function callModel('));
 const parse=source.slice(source.indexOf('function parseGrade('),source.indexOf('\nasync function requestGrade('));
 const request=source.slice(source.indexOf('async function requestGrade('),source.indexOf('\nasync function grade()'));
 vm.runInNewContext(prompt+'\n'+parse+'\n'+request,context);
 return {calls,request:context.requestGrade,parse:context.parseGrade};
}
test('the original spoken answer is gradeable, including its trailing transcription character',async()=>{
 const t=setup([sample()]);let repairs=0;
 const d=await t.request(topic,answer,new AbortController().signal,()=>repairs++);
 assert.equal(t.calls.length,1);assert.equal(repairs,0);assert.equal(d.valid,true);assert.equal(d.score,5);
 assert.match(d.gaps[0],/分子应为4/);
 assert.match(t.calls[0].task,/自举例子不必与量表相同/);
});
test('a model that rewrites a spoken quote gets one retry, preserving the original answer and deductions',async()=>{
 const bad=sample();bad.criteria[0].evidence='异分母转化为同分母';
 const t=setup([bad,sample()]);let repairs=0;const signal=new AbortController().signal;
 assert.throws(()=>t.parse(JSON.stringify(bad),topic,answer),/学生原话证据/);
 const d=await t.request(topic,answer,signal,()=>repairs++);
 assert.equal(t.calls.length,2);assert.equal(repairs,1);assert(t.calls.every(c=>c.signal===signal));
 assert(t.calls[1].task.includes(answer));assert.match(t.calls[1].task,/rejectedAIResponse/);
 assert.equal(d.score,5);assert.equal(d.criteria[2].score,0);assert.equal(d.criteria[2].evidence,'二X分之一与X方分之二');
});
test('fabricated evidence after both responses still yields no grade',async()=>{
 const bad=sample();bad.criteria[0].evidence='这是学生没有说过的正确结论';
 const t=setup([bad,bad]);await assert.rejects(t.request(topic,answer,new AbortController().signal),/两次|自动核对后仍.*不记录分数/);
 assert.equal(t.calls.length,2);
});
test('malformed JSON can be repaired but out-of-range scores remain invalid',async()=>{
 const t=setup(['not json',sample()]);assert.equal((await t.request(topic,answer,new AbortController().signal)).valid,true);
 const bad=sample();bad.criteria[1].score=3;
 const invalid=setup([bad,bad]);await assert.rejects(invalid.request(topic,answer,new AbortController().signal),/量表分数无效/);
});
test('transport failures never trigger grading retries',async()=>{
 const t=setup([Error('DeepSeek返回HTTP 402：账户余额不足')]);let repairs=0;
 await assert.rejects(t.request(topic,answer,new AbortController().signal,()=>repairs++),/HTTP 402/);
 assert.equal(t.calls.length,1);assert.equal(repairs,0);
});
test('cancellation prevents retry and never accepts a late grade',async()=>{
 const bad=sample();bad.criteria[0].evidence='不在原文中';
 const t=setup([bad,sample()]),controller=new AbortController();
 await assert.rejects(t.request(topic,answer,controller.signal,()=>controller.abort()),{name:'AbortError'});
 assert.equal(t.calls.length,1);
 const alreadyCancelled=setup([sample()]);await assert.rejects(alreadyCancelled.request(topic,answer,controller.signal),{name:'AbortError'});
 assert.equal(alreadyCancelled.calls.length,0);
});
test('critical-error grading retains the existing passing-score cap',async()=>{
 const d=sample();for(const c of d.criteria){c.score=topic.criteria.find(x=>x.id===c.id).max;c.evidence='分母';}
 d.criticalErrors=['例子有核心错误'];const t=setup([d]);
 assert.equal((await t.request(topic,answer,new AbortController().signal)).score,7.5);
});
