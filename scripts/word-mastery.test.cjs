const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../app/src/main/assets/web/app-design/word-mastery-rules.js');
const E=require('../app/src/main/assets/web/app-design/english-engine.js');
const S=require('../app/src/main/assets/web/app-design/unit-summary-core.js');
const word={id:'shelf',word:'shelf',meaning:'n. 架子（复数 shelves）',optional:false};
const oral={meaningPassed:true,posPassed:true,feedback:'词义与词类正确',errors:[],answer:'架子，是名词'};
const good={protocol:'word-mastery-v2',answers:Array(7).fill('shelf'),pluralAnswer:'shelves',oral};
test('regular, irregular, phrase, mass and already plural senses have explicit plural requirements',()=>{
  for(const [word,pos,forms] of [['person','n.',['people','persons']],['wolf','n.',['wolves']],['journey','n.',['journeys']],['snowman','n.',['snowmen']],['power cut','n.',['power cuts']],['record','v. / n.',['records']],['schoolwork','n.',[]],['fish','v.',[]],['instructions','n.',[]],['Japanese','adj.',[]]])assert.deepEqual(R.describe({word,pos,meaning:'测试'}).plurals,forms);
});
test('seven recalls lead to plural first, then hidden meaning/POS assessment',()=>{
  assert.equal(R.stage(word,{answers:Array(6).fill('shelf')}),'recall');
  assert.equal(R.stage(word,{answers:Array(7).fill('shelf')}),'plural');
  assert.equal(R.stage(word,good),'oral');
  assert.equal(R.stage({word:'honest',meaning:'adj. 诚实的'},{answers:Array(7).fill('honest')}),'oral');
});
test('all textbook parts of speech are collected even when Chinese meanings separate them',()=>{
  const american=R.describe({word:'American',meaning:'adj. 美国（人）的；n. 美国人'});
  assert.equal(american.pos,'adj. / n.');assert.deepEqual(american.plurals,['Americans']);
  const order=R.describe({word:'order',meaning:'v. 订购；n. 点单；所订的货物'});assert.equal(order.pos,'v. / n.');assert.deepEqual(order.plurals,['orders']);
  assert.equal(R.describe({word:'tape',meaning:'n. 胶带；vt. 用胶带粘贴'}).pos,'n. / vt.');
});
test('new mastery needs seven real correct answers, correct plural and both AI checks',()=>{
  assert(R.passed(word,good));assert(E.wordPassed(word,good));
  for(const invalid of [{...good,answers:Array(6).fill('shelf')},{...good,answers:[...Array(6).fill('shelf'),'shelve']},{...good,pluralAnswer:'shelfs'},{...good,oral:null},{...good,oral:{...oral,meaningPassed:false}},{...good,oral:{...oral,posPassed:false}},{...good,oral:{...oral,errors:['词类有误']}},{...good,oral:{...oral,answer:''}},{...good,oral:{...oral,meaningPassed:'true'}}]){assert(!R.passed(word,invalid));assert(!E.wordPassed(word,invalid));}
});
test('optional practice earns no reward; historical mastery is retained without fabricating oral proof',()=>{
  assert(!E.wordPassed({...word,optional:true},good));
  const historical={protocol:'seven-recalls',answers:Array(7).fill('shelf')};assert(E.wordPassed(word,historical));assert(!R.passed(word,historical));
  const raw={version:1,words:{shelf:{...historical,practice:R.restore(word,{answers:Array(7).fill('shelf'),pluralAnswer:'shelves',draft:'架子，名词'})}},lessons:{}};
  const restored=E.restore(JSON.parse(JSON.stringify(raw)));assert.deepEqual(restored.words,raw.words);assert(!restored.words.shelf.oral);assert.equal(R.stage(word,restored.words.shelf.practice),'oral');
});
test('pending practice is not passed in ordinary or legacy summaries',()=>{
  const raw={version:1,words:{shelf:{practice:{answers:good.answers}}},lessons:{}};
  assert.equal(S.english({words:[word],lessons:[],raw,engine:E}).rows[0].status,'pending');
  raw.words.shelf=good;assert.equal(S.english({words:[word],lessons:[],raw,engine:E}).rows[0].status,'passed');
  const w={id:'w1',en:'shelf',cn:'架子',pos:'n.'},data={words:[w],lessons:[]};
  assert.equal(S.legacyEnglish({data,raw:{wordRuns:{w1:{phase:'verify',answers:good.answers}}}}).rows[0].status,'pending');
  assert.equal(S.legacyEnglish({data,raw:{mastered:{w1:good}}}).rows[0].status,'passed');
});
test('corrupt partial attempts reset safely while preserving valid drafts and accepted spelling variants',()=>{
  assert.deepEqual(R.restore(word,{answers:['wrong'],draft:'架子'}).answers,[]);
  assert.equal(R.restore(word,{answers:good.answers,pluralAnswer:'shelves',draft:'架子'}).draft,'架子');
  assert(R.matches('programme','program'));assert(R.matches('fill ... with','fill…with'));
});
