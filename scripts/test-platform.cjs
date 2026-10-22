const {test}=require('node:test'),assert=require('node:assert/strict'),S=require('../platform-web/sync-core.js');
test('Initial local state is uploaded and an empty new device pulls cloud state',()=>{
  assert.equal(S.plan({a:'ignored','fraction-minute-v1':'{}'},{},{})[0].type,'push');
  assert.equal(S.plan({}, {'fraction-minute-v1':{value:'{}',revision:1}}, {})[0].type,'pull');
});
test('Both devices changed a record: explicit conflict, never overwrite',()=>{
  const k='fraction-minute-v1';assert.equal(S.plan({[k]:'local'},{[k]:{value:'remote',revision:2}},{[k]:{value:'old',revision:1}})[0].type,'conflict');
  assert.equal(S.plan({[k]:'local'},{[k]:{value:null,revision:2}}, {})[0].type,'conflict');
});
test('Cloud-only changes pull; local-only changes push; deletions retain revisions',()=>{
  const k='wordops_8A_unit3',base={[k]:{value:'old',revision:1}};
  assert.equal(S.plan({[k]:'old'},{[k]:{value:'new',revision:2}},base)[0].type,'pull');
  assert.equal(S.plan({[k]:'new'},{[k]:{value:'old',revision:1}},base)[0].type,'push');
  assert.equal(S.plan({},{[k]:{value:'old',revision:1}},base)[0].type,'push');
  assert.equal(S.plan({[k]:'old'},{[k]:{value:null,revision:2}},base)[0].type,'pull');
});
test('API keys, cloud credentials and arbitrary storage never enter sync',()=>{
  for(const key of ['growing-course-ai-v1','growing-cloud-session-v1','growing-cloud-binding-v1','settings-v1-key'])assert.equal(S.allowed(key),false);
  const source=JSON.stringify({topics:{a:{}},connection:{apiKey:'fake-test-only'}}),clean=S.clean('fraction-minute-v1',source);
  assert.equal(JSON.parse(clean).connection,undefined);
  assert.equal(JSON.parse(S.restore('fraction-minute-v1',clean,source)).connection.apiKey,'fake-test-only');
});
