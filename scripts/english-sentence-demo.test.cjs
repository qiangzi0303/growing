const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../app/src/main/assets/web/app-design/english-sentence-data.js');

test('ten original sentences have the agreed difficulty distribution and word prompts',()=>{
  assert.equal(D.sentences.length,10);
  assert.deepEqual(D.sentences.map(s=>s.level),['基础','基础','基础','基础','基础','基础','提高','提高','难题','综合']);
  assert.equal(new Set(D.sentences.map(s=>s.id)).size,10);
  for(const s of D.sentences){
    const words=D.wordPrompts(s);
    assert.equal(D.normalize(words.map(w=>w.en).join(' ')),D.normalize(s.en));
    assert(words.every(w=>w.zh&&w.en&&!/[.!?,]/.test(w.en)));
    assert(words.every(w=>w.ipa&&w.pos&&w.gloss));
    const groups=D.grammarGroups(s);
    assert.deepEqual(groups.flatMap(g=>g.words).map(w=>w.en),words.map(w=>w.en));
    assert(groups.every(g=>g.words.length&&['主语','谓语','宾语','状语'].includes(g.role)));
    assert(s.zh&&s.explanation&&s.hint);
  }
});

test('word cues distinguish the preposition to from the infinitive of purpose',()=>{
  const words=D.wordPrompts(D.sentences[9]).filter(w=>w.en==='to');
  assert.equal(words.length,2);
  assert.match(words[0].zh,/介词/);
  assert.match(words[1].zh,/目的/);
});

test('live typing feedback distinguishes partial, correct and incorrect spellings',()=>{
  assert.equal(D.typingState('joining',''),'empty');
  assert.equal(D.typingState('joining','joi'),'prefix');
  assert.equal(D.typingState('joining','JOINING'),'correct');
  assert.equal(D.typingState('joining','jon'),'wrong');
  assert.equal(D.typingState('look','looks'),'wrong');
  assert.equal(D.typingState(D.sentences[0].en,'I look forward to joining the drama club'),'correct');
});
test('sentence typing ignores typography but does not forgive missing words or verb forms',()=>{
  const s=D.sentences[0];
  assert(D.matches(s,'  i LOOK forward to joining the drama club！ '));
  assert(!D.matches(s,'I look forward to join the drama club.'));
  assert(!D.matches(s,'I look forward joining the drama club.'));
  assert(!D.matches(s,''));
});
test('verb-form feedback identifies the grammar issue, without inventing past errors',()=>{
  assert.match(D.feedback(D.sentences[0],'I look forward to join the drama club.'),/介词/);
  assert.match(D.feedback(D.sentences[0],'I look forward joining the drama club.'),/to/);
  assert(!/上次|考试|以前/.test(D.feedback(D.sentences[0],'wrong')));
});
test('score distinguishes independent, corrected, hinted and revealed work',()=>{
  assert.equal(D.points({wrong:0,hints:0,revealed:false}),100);
  assert.equal(D.points({wrong:2,hints:0,revealed:false}),60);
  assert.equal(D.points({wrong:0,hints:1,revealed:false}),40);
  assert.equal(D.points({wrong:0,hints:0,revealed:true}),0);
});
test('a sentence counts once, and help breaks the combo without clearing prior points',()=>{
  const round=D.createRound(D.sentences.slice(0,3));
  assert.equal(D.complete(round,{wrong:0,hints:0,revealed:false}),true);
  assert.equal(D.complete(round,{wrong:0,hints:0,revealed:false}),false);
  assert.equal(round.results.length,1);
  assert.equal(D.summary(round).score,100);
  D.next(round); D.complete(round,{wrong:0,hints:0,revealed:false});
  D.next(round); D.complete(round,{wrong:1,hints:1,revealed:false});
  const result=D.summary(round);
  assert.equal(result.score,240); assert.equal(result.independent,2);
  assert.equal(result.bestCombo,2); assert.equal(result.combo,0);
  assert.equal(result.total,3); assert.equal(result.completed,3);
  assert.equal(D.next(round),false);
});
