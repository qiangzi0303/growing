const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../app/src/main/assets/web/app-design/english-score.js');
const words=[{id:'one',word:'one'},{id:'two',word:'two'},{id:'extra',word:'extra',optional:true}],sentences=[{id:'a',en:'Hello.'},{id:'b',en:'Goodbye.'}];
const recall=word=>({protocol:'seven-recalls',answers:Array(7).fill(word)});
const complete=answer=>({protocol:'sentence-typing-v1',answer,wrong:0,hints:0,revealed:false,at:1});
test('English has two fixed halves; incomplete and empty categories never redistribute weight',()=>{
 const records={one:recall('one'),two:recall('two')},saved={version:1,sentences:{a:complete('Hello.'),b:complete('Goodbye.')}};
 assert.equal(S.summary(words,{},sentences,null).score,0);
 assert.equal(S.summary(words,records,sentences,null).score,50);
 assert.equal(S.summary(words,{},sentences,saved).score,50);
 assert.equal(S.summary(words,records,sentences,saved).score,100);
 assert.equal(S.summary(words,{one:records.one},sentences,saved).score,75);
 assert.equal(S.summary([],{},sentences,saved).score,50);
 assert.equal(S.summary(words,records,[],null).score,50);
});
test('unknown, optional, malformed and incomplete records do not earn points',()=>{
 const records={one:true,two:{...recall('two'),answers:['two']},extra:recall('extra'),unknown:recall('unknown')};
 const saved={version:1,sentences:{unknown:complete('Hello.'),a:complete('wrong'),b:{...complete('Goodbye.'),at:0}}};
 assert.equal(S.summary(words,records,sentences,saved).score,0);
 assert.equal(S.summary(words,{},sentences,{...saved,version:2}).score,0);
 assert.equal(S.summary(words,{one:{...recall('one'),answers:Array(7).fill(1)}},[],null).score,0);
});
test('historical Unit 3 case and punctuation rules remain compatible',()=>{
 assert.equal(S.wordPassed({id:'w34',en:'Italian'},recall('Italian'),true),true);
 assert.equal(S.wordPassed({id:'w34',en:'Italian'},recall('italian'),true),false);
 assert.equal(S.wordPassed({id:'w1',en:'learner'},recall(' LEARNER '),true),true);
});
test('current word mastery still requires plural and oral validation',()=>{
 const word={id:'friendship',word:'friendship',meaning:'n. 友谊'},r={...recall('friendship'),protocol:'word-mastery-v2',pluralAnswer:'friendships',oral:{meaningPassed:true,posPassed:true,feedback:'正确',errors:[],answer:'友谊，名词'}};
 assert.equal(S.wordPassed(word,r),true);
 assert.equal(S.wordPassed(word,{...r,pluralAnswer:''}),false);
 assert.equal(S.wordPassed(word,{...r,oral:{...r.oral,posPassed:false}}),false);
});
