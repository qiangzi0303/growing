const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const source=name=>fs.readFileSync(path.join(__dirname,'../platform-web',name),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,20));
async function until(check){for(let n=0;n<100;n++){if(check())return;await tick();}assert.ok(check(),'UI did not finish loading');}
async function mount({native=true,login=true,role='Student',confirmed=true,bound=true,records={},hash='',me=async profile=>Response.json(profile),state=async()=>Response.json([])}={}){
 const dom=new JSDOM(source('index.html'),{url:(native?'https://appassets.androidplatform.net/assets/web/cloud/index.html':'https://learn.test/')+hash,runScripts:'outside-only'}),w=dom.window,calls=[];
 const profile={id:'11111111-1111-4111-8111-111111111111',username:'test-login-account',displayName:'Test',role,roleSelectionRequired:!confirmed};
 let opened=0,rankingsOpened=0;
 for(const [key,value] of Object.entries(records))w.localStorage.setItem(key,JSON.stringify(value));
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.TextEncoder=TextEncoder;w.scrollTo=()=>{};
 w.GrowingRankings={mount:async()=>{rankingsOpened++;}};
 w.GrowingManagement={create:()=>({dispose(){},admin:async root=>{root.textContent='Management';}})};
 if(native){w.GrowingNative={cloudApiUrl:()=> 'https://learn.test',identityAccount:()=>profile.id,openLearning:()=>{opened++;return '{"ok":true}';}};if(login){w.localStorage.setItem('growing-cloud-session-v1',JSON.stringify({token:'test-only',user:profile}));if(bound)w.localStorage.setItem('growing-cloud-binding-v1',profile.id);}}
 w.fetch=async(url,options)=>{const p=new URL(url,w.location.href).pathname;calls.push(p);if(p==='/api/auth/me')return login?me(profile):Response.json({error:'Login required'},{status:401});if(p.startsWith('/api/student/state'))return state(options,p);if(p==='/api/parent/children')return Response.json([]);throw Error('Unexpected request: '+p);};
 for(const name of ['sync-core.js','legacy-navigation.js','app.js'])w.eval(source(name));await tick();
 return {dom,w,calls,profile,get opened(){return opened;},get rankingsOpened(){return rankingsOpened;},setState:fn=>{state=fn;}};
}
test('home rankings deep link opens only for an authenticated confirmed student',async()=>{
 for(const options of [{},{role:'Parent'},{confirmed:false},{login:false}]){
  const s=await mount({native:false,hash:'#my-rankings',...options});
  try{assert.equal(s.rankingsOpened,options.role||options.confirmed===false||options.login===false?0:1);}
  finally{s.dom.window.close();}
 }
});
test('shell calendar opens inside the current course and restores its menu trigger',async()=>{
 const s=await mount({native:false});
 try{
  const frame=s.w.document.querySelector('#course');let trigger;
  frame.contentWindow.GrowingLearningCalendar={open:focus=>{trigger=focus;}};
  const action=s.w.document.querySelector('[data-account-view=calendar]');
  assert.equal(action.hidden,false);action.click();
  assert.equal(trigger,s.w.document.querySelector('#account-menu>summary'));
 }finally{s.dom.window.close();}
});

test('account menu displays the login username rather than a display name',async()=>{
 const s=await mount({native:false});
 try{assert.equal(s.w.document.querySelector('#account-identity').textContent,s.profile.username);assert.notEqual(s.profile.username,s.profile.displayName);}
 finally{s.dom.window.close();}
});

test('legacy sessions without a username show a neutral account label',async()=>{
 const s=await mount({native:false,me:async profile=>{delete profile.username;return Response.json(profile);}});
 try{assert.equal(s.w.document.querySelector('#account-identity').textContent,'当前账号');}
 finally{s.dom.window.close();}
});
test('native student enters learning directly, leaving sync to the lesson background agent',async()=>{
 const s=await mount();assert.equal(s.opened,1);assert.equal(s.w.document.querySelector('#download-apk').hidden,true);assert.ok(!s.w.document.body.textContent.includes('今天，也向前一步'));s.w.GrowingCloud.pageReady('https://appassets.androidplatform.net/assets/web/app-design/index.html');assert.equal(s.w.document.querySelector('#download-apk').hidden,true);s.dom.window.close();
});

test('a confirmed bound native student enters a fresh course list without waiting for auth or cached progress',async()=>{
 const s=await mount({me:()=>new Promise(()=>{})});try{assert.equal(s.opened,1);assert.equal(s.calls.includes('/api/auth/me'),false);assert.equal(s.w.document.querySelector('#retry-startup'),null);}finally{s.dom.window.close();}
});

test('unconfirmed and unbound sessions fail to login rather than a reconnect page or classroom',async()=>{
 for(const options of [{confirmed:false},{bound:false}]){
  const s=await mount({...options,me:async()=>{throw new TypeError('Offline');}});
  try{await until(()=>s.w.document.querySelector('#auth'));assert.equal(s.opened,0);assert.equal(s.w.document.querySelector('#retry-startup'),null);}finally{s.dom.window.close();}
 }
});

test('administrator classroom navigation opens the course list without an entry button',async()=>{
 const s=await mount({native:false,role:'Admin'});try{s.w.document.querySelector('[data-admin-view=student]').click();await until(()=>s.w.document.querySelector('#course'));assert.equal(s.w.document.querySelector('#start-course'),null);assert.equal(s.w.document.querySelector('#course').getAttribute('src'),'/learn/app-design/index.html');}finally{s.dom.window.close();}
});
test('native login, parent and admin views all keep the APK download hidden, while web login retains it',async()=>{
 for(const options of [{login:false},{role:'Parent'},{role:'Admin'},{native:false,login:false}]){const s=await mount(options);try{if(!options.login&&options.role===undefined)await until(()=>s.w.document.querySelector('#auth'));assert.equal(s.w.document.querySelector('#download-apk').hidden,options.native!==false);}finally{s.dom.window.close();}}
});
test('web lessons open while cloud state is pending without an intermediate sync screen',async()=>{
 let done;const s=await mount({native:false,state:()=>new Promise(r=>done=r)});assert.ok(s.w.document.querySelector('#course'));assert.equal(s.w.document.querySelector('#course-recovery'),null);assert.doesNotMatch(s.w.document.body.textContent,/同步|版本不同|选择.*记录/);done(Response.json([]));await tick();assert.ok(s.w.document.querySelector('#course'));s.dom.window.close();
});
test('a failed background read keeps the lesson open and automatically resumes online',async()=>{
 const s=await mount({native:false,state:async()=>Response.json({error:'Offline'},{status:503})});assert.ok(s.w.document.querySelector('#course'));assert.equal(s.w.document.querySelector('#course-entry-status'),null);assert.equal(s.w.document.querySelector('#message').textContent,'');
 s.setState(async()=>Response.json([]));s.w.dispatchEvent(new s.w.Event('online'));await tick();assert.ok(s.w.document.querySelector('#course'));s.dom.window.close();
});
test('untracked local records automatically use cloud values without a version choice',async()=>{
 const key='growing-math-lessons-v1',id='11111111-1111-4111-8111-111111111111',localKey='growing-user:'+id+':'+key,cloud=JSON.stringify({topics:{cloud:{}}});
 const s=await mount({native:false,records:{[localKey]:{topics:{local:{}}}},state:async()=>Response.json([{key,value:cloud,revision:2}])});
 assert.equal(s.w.localStorage.getItem(localKey),cloud);assert.equal(s.w.document.querySelector('[data-resolve]'),null);assert.ok(s.w.document.querySelector('#course'));s.dom.window.close();
});

test('an upload race adopts the latest cloud record and never resends the losing local version',async()=>{
 const key='growing-diagnosis-year8-v1:math-8a-02',id='11111111-1111-4111-8111-111111111111',localKey='growing-user:'+id+':'+key,cloud=JSON.stringify({draft:'server'}),old=JSON.stringify({draft:'before'});let uploads=0;
 const s=await mount({native:false,records:{[localKey]:{draft:'local'},['growing-cloud-meta-v1:'+id]:{[key]:{value:old,revision:1}}},state:async options=>options.method==='PUT'?(uploads++,Response.json({error:'updated',current:{value:cloud,revision:2}},{status:409})):Response.json([{key,value:old,revision:1}])});
 await until(()=>s.w.localStorage.getItem(localKey)===cloud);assert.equal(uploads,1);assert.equal(s.w.document.querySelector('[data-resolve]'),null);s.dom.window.close();
});

test('new learning writes after hydration keep automatic background upload',async()=>{
 const key='growing-diagnosis-year8-v1:math-8a-02';let cloud=null,revision=0;
 const s=await mount({native:false,state:async options=>{if(options.method==='PUT'){cloud=JSON.parse(options.body).value;revision++;return Response.json({value:cloud,revision});}return Response.json(cloud?[{key,value:cloud,revision}]:[]);}});
 const store=s.w.GrowingCloud.storage();store.setItem(key,JSON.stringify({draft:'new work'}));s.w.dispatchEvent(new s.w.Event('online'));await until(()=>cloud!==null);assert.equal(JSON.parse(cloud).draft,'new work');s.dom.window.close();
});

test('a page that read an older cloud record cannot overwrite the refreshed cache',async()=>{
 const key='growing-diagnosis-year8-v1:math-8a-02',before=JSON.stringify({draft:'before'}),after=JSON.stringify({draft:'cloud update'});
 const s=await mount({native:false,state:async()=>Response.json([{key,value:before,revision:1}])});
 try{
  const view={document:{},frameElement:{isConnected:false}},store=s.w.GrowingCloud.storage(view);
  assert.equal(store.getItem(key),before);
  s.setState(async()=>Response.json([{key,value:after,revision:2}]));s.w.dispatchEvent(new s.w.Event('online'));
  await until(()=>s.w.GrowingCloud.storage().getItem(key)===after);
  store.setItem(key,before);assert.equal(s.w.GrowingCloud.storage().getItem(key),after);
 }finally{s.dom.window.close();}
});
