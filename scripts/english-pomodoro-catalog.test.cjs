const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/web/app-design/english-pomodoro-catalog.js');
const E=require('../app/src/main/assets/web/app-design/english-engine.js');
const WR=require('../app/src/main/assets/web/app-design/english-word-review.js');
const SP=require('../app/src/main/assets/web/app-design/english-sentence-progress.js');
const U='english-8a-01';
function input(){return {
 words:[{id:'a',word:'a'},{id:'b',word:'b'},{id:'optional',word:'optional',optional:true}],
 lessons:[{id:'grammar',title:'语法',questions:[{answer:0}]},{id:'reading',title:'阅读',questions:[{answer:0}]}],
 state:E.restore(null),engine:E,wordReview:WR,now:100000,
 practice:{groups:{grammar:[{id:'g',title:'语法点',questions:[{},{}]}],reading:[{id:'r',title:'阅读点',questions:[{},{}]}]},validate(p,r){if(!r||!Array.isArray(r.answers))throw Error('bad record');},score(p,r){return r.answers.filter(Boolean).length;}},
 sentenceUnit:{id:U,topics:[{id:'topic',sentences:[{id:'s',en:'A sentence.'}]}]},sentenceProgress:SP.restore(null)
};}
test('catalog includes all point groups, reading quiz and sentence tasks without optional words',()=>{
 const x=input(), before=JSON.stringify(x),c=C.build(U,x);
 assert.equal(c.words.length,2);assert.equal(c.grammar.length,1);assert.deepEqual(c.reading.map(t=>t.kind),['point','lesson']);assert.equal(c.sentences.length,1);assert.equal(c.review.length,0);
 assert.equal(JSON.stringify(x),before);assert.equal(c.reading[0].eventId,'point:reading:r');
});
test('verified mastery moves targets to review, retains historical best and prioritizes due words',()=>{
 const x=input();x.state.words.a={protocol:'seven-recalls',answers:Array(7).fill('a')};x.state.words.b={protocol:'seven-recalls',answers:Array(7).fill('b')};
 x.state.wordReview={a:{level:1,due:'2099-01-01',lastDay:'1970-01-01'}};
 x.state.pointPractice={grammar:{g:{answers:[false,false],best:2}},reading:{r:{answers:[true,true]}}};
 x.state.lessons.reading={protocol:'three-correct',answers:[0]};
 x.sentenceProgress=SP.complete(null,x.sentenceUnit.topics[0].sentences[0],{wrong:0,hints:0,revealed:false},10);
 const c=C.build(U,x);for(const k of ['words','grammar','reading','sentences'])assert.equal(c[k].length,0);
 assert.equal(c.review.length,6);assert.equal(c.review[0].wordId,'b');assert.ok(c.review.every(t=>t.review&&!t.newWord));assert.equal(c.review[0].eventId,'review:b');
});
test('invalid point data throws before returning a replacement catalog',()=>{
 for(const change of [x=>x.state.words.a=5,x=>x.state.lessons.reading=[],x=>x.state.pointPractice=[],x=>x.state.pointPractice={unknown:{}},x=>x.state.pointPractice={grammar:{unknown:{}}},x=>x.state.pointPractice={grammar:{g:{answers:'bad'}}},x=>x.sentenceUnit.id='english-8a-02',x=>x.practice.groups.reading=null]){
  const x=input();change(x);assert.throws(()=>C.build(U,x));
 }
});
