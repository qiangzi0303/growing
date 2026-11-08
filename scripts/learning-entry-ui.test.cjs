const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const source=name=>fs.readFileSync(path.join(__dirname,'../platform-web',name),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,20));
async function until(check){for(let n=0;n<100;n++){if(check())return;await tick();}assert.ok(check(),'UI did not finish loading');}
async function mount({native=true,login=true,role='Student',records={},state=async()=>Response.json([])}={}){
 const dom=new JSDOM(source('index.html'),{url:native?'https://appassets.androidplatform.net/assets/web/cloud/index.html':'https://learn.test/',runScripts:'outside-only'}),w=dom.window,calls=[];
 const profile={id:'11111111-1111-4111-8111-111111111111',displayName:'Test',role,roleSelectionRequired:false};
 let opened=0;
 for(const [key,value] of Object.entries(records))w.localStorage.setItem(key,JSON.stringify(value));
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.TextEncoder=TextEncoder;w.scrollTo=()=>{};
 w.GrowingManagement={create:()=>({dispose(){},admin:async root=>{root.textContent='Management';}})};
 if(native){w.GrowingNative={cloudApiUrl:()=> 'https://learn.test',identityAccount:()=>profile.id,openLearning:()=>{opened++;return '{"ok":true}';}};if(login)w.localStorage.setItem('growing-cloud-session-v1',JSON.stringify({token:'test-only',user:profile}));}
 w.fetch=async(url,options)=>{const p=new URL(url,w.location.href).pathname;calls.push(p);if(p==='/api/auth/me')return login?Response.json(profile):Response.json({error:'Login required'},{status:401});if(p==='/api/student/state')return state();if(p==='/api/parent/children')return Response.json([]);throw Error('Unexpected request: '+p);};
 for(const name of ['sync-core.js','legacy-navigation.js','app.js'])w.eval(source(name));await tick();
 return {dom,w,calls,profile,get opened(){return opened;},setState:fn=>{state=fn;}};
}
test('native student enters learning directly after sync, with no welcome screen or APK download',async()=>{
 const s=await mount();assert.equal(s.opened,1);assert.equal(s.w.document.querySelector('#download-apk').hidden,true);assert.ok(!s.w.document.body.textContent.includes('今天，也向前一步'));s.w.GrowingCloud.pageReady('https://appassets.androidplatform.net/assets/web/app-design/index.html');assert.equal(s.w.document.querySelector('#download-apk').hidden,true);s.dom.window.close();
});
test('native login, parent and admin views all keep the APK download hidden, while web login retains it',async()=>{
 for(const options of [{login:false},{role:'Parent'},{role:'Admin'},{native:false,login:false}]){const s=await mount(options);try{if(!options.login&&options.role===undefined)await until(()=>s.w.document.querySelector('#auth'));assert.equal(s.w.document.querySelector('#download-apk').hidden,options.native!==false);}finally{s.dom.window.close();}}
});
test('sync preparation hides intermediate entry controls and cannot open before records arrive',async()=>{
 let done;const s=await mount({state:()=>new Promise(r=>done=r)});assert.equal(s.opened,0);assert.equal(s.w.document.querySelector('#course-recovery').hidden,true);assert.ok(!s.w.document.body.textContent.includes('今天，也向前一步'));done(Response.json([]));await tick();assert.equal(s.opened,1);s.dom.window.close();
});
test('sync failure preserves records and offers a retry that proceeds directly into learning',async()=>{
 const s=await mount({state:async()=>Response.json({error:'Offline'},{status:503})});assert.equal(s.opened,0);assert.equal(s.w.document.querySelector('#course-recovery').hidden,false);assert.equal(s.w.document.querySelector('#start-course').disabled,true);assert.match(s.w.document.querySelector('#course-entry-status').textContent,/无法同步/);
 s.setState(async()=>Response.json([]));s.w.document.querySelector('#sync-now').click();await tick();assert.equal(s.opened,1);s.dom.window.close();
});
test('record conflicts still require a choice and never enter learning automatically',async()=>{
 const s=await mount({records:{'growing-math-lessons-v1':{topics:{local:{}}}},state:async()=>Response.json([{key:'growing-math-lessons-v1',value:JSON.stringify({topics:{cloud:{}}}),revision:2}])});
 assert.equal(s.opened,0);assert.ok(s.w.document.querySelector('[data-resolve]'));assert.equal(s.w.document.querySelector('#start-course').disabled,true);assert.equal(s.w.document.querySelector('#course-recovery').hidden,false);s.dom.window.close();
});
