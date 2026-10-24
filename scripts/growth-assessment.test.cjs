const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/web/app-design/growth-assessment-core.js');

test('only the three age bands starting at 12 are accepted',()=>{
  assert.deepEqual(C.ages.map(a=>a.id),['12-14','15-17','18+']);
  for(const age of ['6-8','9-11','11','unknown'])assert.throws(()=>C.questions('thinking',age));
  assert.throws(()=>C.questions('constructor','12-14'));
  assert.notEqual(C.questions('thinking','12-14')[0].prompt,C.questions('thinking','15-17')[0].prompt);
  assert.notEqual(C.questions('thinking','15-17')[0].prompt,C.questions('thinking','18+')[0].prompt);
});
test('original reasoning answers yield exact per-dimension counts at every age',()=>{
  for(const {id:age}of C.ages){
    const qs=C.questions('thinking',age),answers=qs.map(q=>q.answer);
    assert.equal(qs.length,12);assert.equal(new Set(qs.map(q=>q.id)).size,12);
    const r=C.evaluate('thinking',age,answers);
    assert.equal(r.correct,12);assert.deepEqual(r.dimensions.map(d=>[d.value,d.max]),[[4,4],[4,4],[4,4]]);
    answers[0]=(answers[0]+1)%qs[0].options.length;
    const wrong=C.evaluate('thinking',age,answers);
    assert.equal(wrong.correct,11);assert.equal(wrong.dimensions[0].value,3);assert.equal(wrong.dimensions[1].value,4);
    assert.ok(qs.every(q=>q.explanation&&q.options[q.answer]));
  }
});
test('self-observation reverses negatively worded items without producing a total score',()=>{
  for(const kind of ['emotion','balance']){
    const qs=C.questions(kind,'12-14');
    const high=C.evaluate(kind,'12-14',qs.map(q=>q.reverse?0:4));
    const low=C.evaluate(kind,'12-14',qs.map(q=>q.reverse?4:0));
    assert.equal(high.correct,null);assert.ok(high.dimensions.every(d=>d.average===5&&d.ratio===1));
    assert.ok(low.dimensions.every(d=>d.average===1&&d.ratio===0));
    const middle=C.evaluate(kind,'12-14',qs.map(()=>2));
    assert.ok(middle.dimensions.every(d=>d.average===3&&d.ratio===.5));
  }
});
test('unfinished, oversized and invalid answers cannot produce a result',()=>{
  const answers=C.questions('emotion','12-14').map(()=>null);
  assert.equal(C.validAnswers('emotion','12-14',answers),true);
  assert.throws(()=>C.evaluate('emotion','12-14',answers));
  assert.throws(()=>C.evaluate('emotion','12-14',answers.map(()=>5)));
  assert.throws(()=>C.evaluate('emotion','12-14',answers.map(()=>-1)));
  assert.throws(()=>C.evaluate('emotion','12-14',[...answers,0]));
});
test('drafts preserve independent age bands and completed history validates before restoration',()=>{
  const make=(age)=>({kind:'thinking',age,index:3,answers:C.questions('thinking',age).map((q,i)=>i<3?q.answer:null),startedAt:new Date().toISOString()});
  const a=make('12-14'),b=make('15-17');
  const store={version:1,age:'12-14',drafts:{'thinking@12-14':a,'thinking@15-17':b},history:[]};
  assert.equal(C.validateStore(JSON.parse(JSON.stringify(store))),true);
  const result={id:'test-result',kind:'thinking',age:'12-14',at:new Date().toISOString(),answers:C.questions('thinking','12-14').map(q=>q.answer)};
  store.history.push(result);assert.equal(C.validateStore(store),true);
  assert.equal(C.validateStore({...store,history:Array(13).fill(result)}),false);
  assert.equal(C.validateStore({...store,drafts:{'thinking@12-14':b}}),false);
  assert.equal(C.validateStore({...store,history:[{...result,answers:[null]}]}),false);
  assert.equal(C.validateStore({...store,version:2}),false);
});
