const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../app/src/main/assets/web/app-design/english-sentence-progress.js');
const D=require('../app/src/main/assets/web/app-design/english-sentence-data.js');
const sync=require('../platform-web/sync-core.js');
const unit=D.units['english-8a-01'],sentences=unit.topics.flatMap(t=>t.sentences);
const result={wrong:0,hints:0,revealed:false};

test('review evidence advances monotonically while preserving the first score and unknown fields',()=>{
  const first=P.complete(null,sentences[0],result,1000);
  first.extra='keep';first.sentences[sentences[0].id].custom='keep';
  const reviewed=P.complete(first,sentences[0],{...result,wrong:2},2000);
  const record=reviewed.sentences[sentences[0].id];
  assert.equal(record.at,1000);assert.equal(record.wrong,0);
  assert.equal(record.custom,'keep');assert.equal(reviewed.extra,'keep');
  assert.equal(record.lastAttempt.at,2000);assert.equal(record.lastAttempt.wrong,2);
  assert.equal(P.valid(sentences[0],record.lastAttempt),true);
  assert.deepEqual(P.complete(reviewed,sentences[0],result,2000),reviewed);
  assert.deepEqual(P.complete(reviewed,sentences[0],result,1500),reviewed);
  assert.throws(()=>P.complete(reviewed,sentences[0],{...result,wrong:-1},3000));
  assert.equal(first.sentences[sentences[0].id].lastAttempt,undefined);
});

test('sentence completion persists once, retains earlier items and uses the existing sync protocol',()=>{
  const first=P.complete(null,sentences[0],result,1000);
  const second=P.complete(first,sentences[1],{...result,wrong:2,revealed:true},2000);
  const repeated=P.complete(second,sentences[0],result,3000);
  assert.deepEqual(P.summary(sentences,repeated),{completed:2,total:sentences.length});
  assert.equal(repeated.sentences[sentences[0].id].at,1000);
  assert.equal(repeated.sentences[sentences[1].id].revealed,true);
  assert.equal(P.summary(D.units['english-8a-02'].topics[0].sentences,repeated).completed,0);
  const key=P.key(unit.id),value=JSON.stringify(repeated);
  assert.equal(sync.allowed(key),true);
  assert.equal(sync.plan({[key]:value},{},{[key]:{value:null,revision:0}}).find(a=>a.key===key).type,'push');
  assert.equal(sync.allowed('growing-english-sentences-v1:english-8b-01'),false);
});

test('unknown, partial and invalid evidence never increases the completion count; malformed archives are retained',()=>{
  const state=P.complete(null,sentences[0],result,1000),record=state.sentences[sentences[0].id];
  for(const bad of [{...record,answer:'wrong'},{...record,protocol:'preview'},{...record,wrong:-1},{...record,at:'today'},{...record,revealed:'false'}]){
    assert.equal(P.summary(sentences,{version:1,sentences:{[sentences[0].id]:bad}}).completed,0);
  }
  assert.equal(P.summary(sentences,{version:1,sentences:{unknown:record}}).completed,0);
  assert.equal(P.summary(sentences,{version:2,sentences:state.sentences}).completed,0);
  for(const raw of [[],{version:1,sentences:[]},{version:2,sentences:{}}])assert.throws(()=>P.complete(raw,sentences[0],result));
  assert.throws(()=>P.key('constructor'));
});
