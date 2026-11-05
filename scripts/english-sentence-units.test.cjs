const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../app/src/main/assets/web/app-design/english-sentence-data.js');
global.window={};
require('../app/src/main/assets/web/app-design/curriculum.js');
require('../app/src/main/assets/web/app-design/english-lessons.js');

test('each verified unit has ten graded sentences for every existing lesson',()=>{
  const ids=new Set(),texts=new Set();
  assert.equal(Object.keys(D.units).length,8);
  for(const u of window.GrowingCurriculum.english.terms.upper.units){
    const unit=D.units[u.id];assert(unit,u.id);assert.equal(unit.title,u.title);
    const lessons=u.number===3?['patterns','adverbs','reflexives','formation','reading']:window.GrowingEnglishLessons[u.number].map(l=>l.id);
    assert.deepEqual(unit.topics.map(t=>t.id),lessons);
    for(const topic of unit.topics){
      assert.equal(topic.sentences.length,10,`${u.id}/${topic.id}`);
      assert.deepEqual(topic.sentences.map(s=>s.level),['基础','基础','基础','基础','基础','基础','提高','提高','难题','综合']);
      for(const s of topic.sentences){
        assert(!ids.has(s.id),s.id);ids.add(s.id);
        // Reusing a phrase across lessons is fine; a complete sentence must be original in its unit.
        const text=u.id+':'+D.normalize(s.en);assert(!texts.has(text),text);texts.add(text);
        assert(s.zh&&s.explanation&&s.title&&s.hint,s.id);
        const words=D.wordPrompts(s),groups=D.grammarGroups(s);
        assert.equal(D.normalize(s.groups.map(g=>g[1]).join(' ')),D.normalize(s.en),s.id+' explicit groups');
        assert(words.length>1,s.id);
        for(const w of words){
          assert(w.en&&w.ipa&&w.pos&&w.zh&&w.gloss,`${s.id}: ${w.en}`);
          assert(!new RegExp('\\b'+w.en+'\\b','i').test(w.gloss),`${s.id}: cue reveals ${w.en}`);
        }
        assert.deepEqual(groups.flatMap(g=>g.words).map(w=>w.en),words.map(w=>w.en),s.id);
        assert(groups.every(g=>g.words.length&&g.role),s.id);
        assert(D.matches(s,s.en),s.id);
      }
    }
  }
});

test('routing refuses unknown units and topics and keeps all selected rounds isolated',()=>{
  assert(D.getPractice('english-8b-01','reading').error);
  assert(D.getPractice('english-8a-09','reading').error);
  assert(D.getPractice('english-8a-01','bad').error);
  for(const id of ['__proto__','constructor','toString',''])assert(D.getPractice(id,'reading').error);
  for(const unit of Object.values(D.units)){
    const choice=D.getPractice(unit.id,null);assert.equal(choice.topic,null);assert.equal(choice.unit,unit);
    for(const topic of unit.topics){
      const p=D.getPractice(unit.id,topic.id);assert.equal(p.error,undefined);
      assert.equal(p.topic,topic);assert.equal(p.sentences,topic.sentences);
      const round=D.createRound(p.sentences);
      for(let i=0;i<10;i++){assert(D.complete(round,{wrong:0,hints:0,revealed:false}));if(i<9)assert(D.next(round));}
      assert.equal(D.summary(round).independent,10);
      assert(round.results.every(r=>r.id.startsWith(unit.id+'-'+topic.id+'-')));
    }
  }
  assert.match(D.getPractice('english-8a-03','reading').backHref,/word-ops-unit3/);
  assert.match(D.getPractice('english-8a-08','reading').backHref,/unit=english-8a-08/);
  assert.equal(D.getPractice().topic.id,'reading');
});

test('context distinguishes infinitive to, preposition to and two uses of do',()=>{
  const writing=D.getPractice('english-8a-02','writing').sentences;
  const to=D.wordPrompts(writing[1]).find(w=>w.en==='to');
  assert.equal(to.pos,'介词');assert.equal(to.gloss,'向');
  for(const s of D.getPractice('english-8a-02','equality').sentences.slice(6,8)){
    const words=D.wordPrompts(s);assert.match(words[1].zh,/否定/);
    assert.match(words.at(-1).zh,/代替/);
  }
});

test('feedback follows the actual sentence and does not apply Unit2 grammar to other units',()=>{
  for(const unit of Object.values(D.units))for(const topic of unit.topics)for(const s of topic.sentences){
    assert(D.feedback(s,'wrong').includes(s.explanation),s.id);
    if(!/look(?:s)? forward to/i.test(s.en))assert(!D.feedback(s,'wrong').includes('look forward to'),s.id);
  }
});
