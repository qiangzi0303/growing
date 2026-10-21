const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/course-ai.js'),'utf8');
function setup(native){
  const data=new Map(),calls=[];let mode='ok',blocked=false;
  const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(blocked)throw Error('storage blocked');data.set(k,v);},removeItem:k=>data.delete(k)};
  const window={GrowingNative:native};
  const context={window,localStorage,document:{addEventListener(){}},setTimeout,clearTimeout,AbortController,fetch:async(url,options)=>{
    calls.push({url,options});if(mode==='network')throw new TypeError('network error');
    return {ok:!Number.isInteger(mode),status:mode,json:async()=>{if(mode==='bad-json')throw SyntaxError();return mode==='empty'?{}:{choices:[{finish_reason:mode==='length'?'length':'stop',message:{content:'解释内容'}}]};}};
  }};
  vm.runInNewContext(source,context);
  return {api:window.GrowingCourseAI,data,calls,setMode:m=>{mode=m;},blockSave:()=>{blocked=true;}};
}
test('no credentials means no network request; saved config supplies direct auth and format',async()=>{
  const t=setup();await assert.rejects(t.api.request({task:'问题'}),/设置.*API Key/);assert.equal(t.calls.length,0);
  t.api.save({apiKey:'fake-test-key',model:'deepseek-flash'});const signal=new AbortController().signal;
  assert.equal(await t.api.request({task:'问题',signal}),'解释内容');
  const call=t.calls[0],body=JSON.parse(call.options.body);assert.equal(call.url,'https://api.deepseek.com/chat/completions');assert.equal(call.options.headers.Authorization,'Bearer fake-test-key');assert.equal(call.options.signal,signal);assert.equal(body.response_format.type,'text');
  await t.api.request({task:'评分',format:'json_object'});assert.equal(JSON.parse(t.calls[1].options.body).response_format.type,'json_object');
  assert(!JSON.stringify(t.api.info()).includes('fake-test-key'));assert(!t.api.settingsMarkup().includes('fake-test-key'));
});
test('connection updates are atomic and clear affects only shared key',()=>{
  const t=setup();t.api.save({apiKey:'fake-test-key'});t.api.save({model:'another-model',apiKey:''});assert.equal(t.api.info().model,'another-model');
  const before=t.data.get('growing-course-ai-v1');t.blockSave();assert.throws(()=>t.api.save({apiKey:'fake-replacement'}),/保存失败/);assert.equal(t.data.get('growing-course-ai-v1'),before);
  t.data.set('growing-physics-lessons-v1','learning');t.api.clear();assert.equal(t.data.get('growing-physics-lessons-v1'),'learning');assert.equal(t.api.info().configured,false);
});
test('HTTP, invalid JSON, empty, truncated and network replies cannot count as answers',async()=>{
  const t=setup();t.api.save({apiKey:'fake-test-key'});
  for(const [mode,error] of [[401,/密钥无效/],[402,/余额不足/],[429,/频繁/],['bad-json',/无法读取/],['empty',/空内容/],['length',/未完整/],['network',/检查网络/]]){t.setMode(mode);await assert.rejects(t.api.request({task:'问题'}),error);}
});
test('Android uses its current account key without storing a browser key',async()=>{
  const t=setup({aiKey:()=> 'fake-native-key',configureAi(){}});assert.equal(t.api.info().native,true);await t.api.request({task:'问题'});assert.equal(t.calls[0].options.headers.Authorization,'Bearer fake-native-key');assert.equal(t.data.size,0);assert(t.api.settingsMarkup().includes('打开账号AI设置'));
});
