const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/bootstrap.js'),'utf8');
function setup(){
  const user={id:'11111111-1111-4111-8111-111111111111',role:'Student',roleSelectionRequired:false},data=new Map(),calls=[];
  let identity=user.id,fetcher=async()=>Response.json({student:{id:user.id},context:{wrongQuestions:[{title:'我的拍照错题'}]}});
  const ok=value=>JSON.stringify({ok:true,value});
  const window={GrowingNative:{get:k=>ok(data.get(k)??null),put:(k,v)=>{data.set(k,v);return ok();},keys:()=>ok([...data.keys()]),
    identityAccount:()=>identity,cloudApiUrl:()=> 'https://learn.test'},fetch:async(...args)=>{calls.push(args);return fetcher(...args);}};
  vm.runInNewContext(source,{window,URL,URLSearchParams,Request,Response,Headers,AbortController,setTimeout,clearTimeout,
    location:{href:'https://appassets.androidplatform.net/assets/web/app-design/math-course.html',origin:'https://appassets.androidplatform.net'}});
  function login(){data.set('growing-cloud-session-v1',JSON.stringify({token:'test-device-session',user}));data.set('growing-cloud-binding-v1',user.id);}
  return {window,data,calls,user,login,setIdentity:v=>identity=v,setFetch:v=>fetcher=v};
}
test('native archive reads the confirmed student through authenticated cloud API, with no client-selected student id',async()=>{
  const s=setup();s.login();const p=await s.window.GrowingStudentKnowledge.studentKnowledge('math-8b-10','减号','add');
  assert.equal(p.student.id,s.user.id);assert.equal(p.syncPending,undefined);
  const [url,options]=s.calls[0];assert.equal(new URL(url).pathname,'/api/student/knowledge');assert.equal(new URL(url).searchParams.get('topic'),'add');
  assert.equal(new URL(url).searchParams.has('studentId'),false);assert.equal(options.credentials,'omit');assert.equal(options.headers.Authorization,'Bearer test-device-session');
  s.setFetch(async()=>Response.json({saved:true}));
  await s.window.GrowingStudentKnowledge.saveKnowledgeNote('math-8b-10','保留负号');assert.deepEqual(JSON.parse(s.calls.at(-1)[1].body),{unitId:'math-8b-10',text:'保留负号'});
});
test('unconfirmed, parent, unbound and switched native identities cannot read another archive',async()=>{
  const s=setup();await assert.rejects(()=>s.window.GrowingStudentKnowledge.studentKnowledge(),/学生云账号/);assert.equal(s.calls.length,0);
  s.login();s.user.role='Parent';s.login();await assert.rejects(()=>s.window.GrowingStudentKnowledge.studentKnowledge(),/学生云账号/);
  s.user.role='Student';s.login();s.data.delete('growing-cloud-binding-v1');await assert.rejects(()=>s.window.GrowingStudentKnowledge.studentKnowledge(),/学生云账号/);
  s.login();s.setIdentity('another-student');await assert.rejects(()=>s.window.GrowingStudentKnowledge.studentKnowledge(),/学生云账号/);assert.equal(s.calls.length,0);
});
test('identity changes during a native fetch and mismatched response identities are rejected',async()=>{
  const s=setup();s.login();s.setFetch(async()=>{s.setIdentity('another-student');return Response.json({student:{id:s.user.id}});});
  await assert.rejects(()=>s.window.GrowingStudentKnowledge.studentKnowledge(),/学生云账号/);
  s.setIdentity(s.user.id);s.setFetch(async()=>Response.json({student:{id:'another-student'}}));
  await assert.rejects(()=>s.window.GrowingStudentKnowledge.studentKnowledge(),/身份不匹配/);
});
