import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const folder=new URL('../../app/src/main/assets/web/app-design/',import.meta.url);
async function fixture(){
 const context={URLSearchParams,window:null};context.window=context;vm.createContext(context);
 for(const name of ['curriculum.js','practice-progress.js','student-catalog-model.js'])vm.runInContext(await readFile(new URL(name,folder),'utf8'),context);
 context.GrowingHandwriting={knowledgeUnits:{'math-8a-01':{angles:'角'},'physics-8a-01':{sound:'声音'},'math-8b-10':{meaning:'分式'}}};
 return context;
}
test('catalog retains verified books, real links and saved mastery without writes',async()=>{
 const w=await fixture(),reads=[];const before={version:1,topics:{angles:{bestQuiz:3,attempts:[]}}};
 const model=w.GrowingStudentCatalog.create({page:'catalog',params:new URLSearchParams('subject=math&term=upper'),read:key=>{reads.push(key);return key==='growing-math-lessons-v1'?before:null;}});
 assert.equal(model.kind,'catalog');assert.equal(model.units[0].mastery,70);assert.equal(model.units[0].title,'三角形');assert.match(model.units[0].summaryHref,/unit-summary/);assert.equal(model.terms.length,2);assert.equal(model.subjects.length,3);assert.equal(model.resources.href,'math-resources.html?term=upper');assert.deepEqual(before,{version:1,topics:{angles:{bestQuiz:3,attempts:[]}}});assert.ok(reads.includes('growing-math-lessons-v1'));
});
test('unverified semester never opens entries or summaries and study stays pending',async()=>{
 const w=await fixture();w.GrowingCurriculum.english.terms.lower.units[0].entry='english-course.html';
 const create=(page,query)=>w.GrowingStudentCatalog.create({page,params:new URLSearchParams(query),read:()=>null});
 const catalog=create('catalog','subject=english&term=lower');assert.equal(catalog.verified,false);assert.equal(catalog.units[0].available,false);assert.equal(catalog.units[0].summaryHref,null);
 assert.equal(create('study','subject=english&term=lower&unit=english-8b-01').kind,'pending');assert.equal(create('catalog','subject=__proto__').kind,'error');assert.equal(create('study','subject=math&unit=missing').kind,'error');
});
test('study redirects to the real entry and preserves node; fraction evidence uses original keys',async()=>{
 const w=await fixture();let readKey;const result=w.GrowingStudentCatalog.create({page:'study',params:new URLSearchParams('subject=math&term=lower&unit=math-8b-10&node=meaning'),read:()=>null});assert.equal(result.kind,'redirect');assert.match(result.href,/分式作战_一分钟学习版.html/);assert.equal(new URLSearchParams(result.href.split('?')[1]).get('node'),'meaning');
 const model=w.GrowingStudentCatalog.create({page:'catalog',params:new URLSearchParams('subject=math&term=lower'),read:key=>{if(key==='fraction-minute-v1')readKey=key;return key==='fraction-minute-v1'?{topics:{domain:{bestQuiz:3}},learning:{mastery:{domain:'2026-01-01'}}}:null;}});assert.equal(model.units.find(u=>u.id==='math-8b-10').mastery,100);assert.equal(readKey,'fraction-minute-v1');
});
test('English delegates to original score algorithm and record failures stay visible',async()=>{
 const w=await fixture();let args;w.SentenceDemo={units:Object.fromEntries(w.GrowingCurriculum.english.terms.upper.units.map(u=>[u.id,{topics:[{sentences:['sentence']}]}]))};w.GrowingEnglishVocabulary={1:['word']};w.GrowingSummaryLegacy={words:['legacy']};w.GrowingEnglishScore={summary:(...values)=>{args=values;return {score:42};}};
 const model=w.GrowingStudentCatalog.create({page:'catalog',params:new URLSearchParams('subject=english'),read:key=>({key})});assert.equal(model.units[0].mastery,42);assert.ok(model.animationHref);assert.equal(args[4],false);
 const broken=w.GrowingStudentCatalog.create({page:'catalog',params:new URLSearchParams('subject=math'),read:()=>{throw Error('bad JSON');}});assert.match(broken.units[0].masteryError,/进度暂不可用/);
});
test('physics reads its separate account store and original English data uses real score engine',async()=>{
 const w=await fixture(),keys=[];
 const physics=w.GrowingStudentCatalog.create({params:new URLSearchParams('subject=physics'),read:key=>{keys.push(key);return key==='growing-physics-lessons-v1'?{version:1,topics:{sound:{bestQuiz:3}}}:null;}});assert.equal(physics.units[0].mastery,70);assert.equal(keys.includes('growing-math-lessons-v1'),false);assert.equal(physics.edition,'苏科版2025年第4版');
 for(const name of ['word-mastery-rules.js','english-sentence-progress.js','english-score.js','english-vocabulary.js','unit-summary-legacy.js','english-sentence-units-13.js','english-sentence-units-2.js','english-sentence-units-45.js','english-sentence-units-678.js','english-sentence-data.js'])vm.runInContext(await readFile(new URL(name,folder),'utf8'),w);
 const word=w.GrowingEnglishVocabulary[1].find(item=>!item.optional),saved={words:{[word.id]:{protocol:'seven-recalls',answers:Array(7).fill(word.word)}}};
 const model=w.GrowingStudentCatalog.create({params:new URLSearchParams('subject=english'),read:key=>key==='growing-english-course-v1:english-8a-01'?saved:null});
 const unit=w.SentenceDemo.units['english-8a-01'],score=w.GrowingEnglishScore.summary(w.GrowingEnglishVocabulary[1],saved.words,unit.topics.flatMap(topic=>topic.sentences),null,false).score;
 assert.equal(model.units[0].mastery,score);assert.ok(score>0);assert.equal(model.units[0].masteryError,null);
});
