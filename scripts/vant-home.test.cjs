const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
async function until(check){for(let n=0;n<50;n++){if(check())return;await tick();}assert.ok(check(),'sample did not settle');}
async function setup({enabled=true,shell=false,native=false,fail=false,rankings=true}={}){
 const dom=new JSDOM('<body>'+(shell||native?'<header><details id="account-menu"><summary>设置</summary><p id="account-identity">学生</p><button id="my-rankings">我的排行榜</button><button id="open-device-settings">设备设置</button><button id="logout">退出云账号</button></details></header>':'')+(shell?'<main id="app"><iframe id="course"></iframe></main>':'<main class="home"><nav class="home-settings-entry"><button>设置</button></nav></main>')+'</body>',{url:'http://learn.test/'+(shell?'':'learn/app-design/index.html')+(enabled?'?ui=vant':'?ui=legacy'),runScripts:'outside-only'}),w=dom.window;
 const calls={mounted:0,destroyed:0,rankings:0,device:0,saved:0,reads:[]},store={getItem:key=>{calls.reads.push(key);return JSON.stringify({old:true});}};
 const ai={info:()=>({model:'deepseek-flash',configured:true}),save:values=>{assert.equal(w.GrowingCourseAIStorage(),store);calls.saved++;},clear:()=>{},request:async()=> 'secret response must not reach UI'};
 w.GrowingCourseAI=ai;w.GrowingRealtime={info:()=>({base:'https://dashscope.aliyuncs.com',voice:'Tina',configured:true}),save(){},clear(){},voices:['Tina'],connectionInfo:async()=>({configured:true})};
 w.GrowingCurriculum={english:{name:'英语',terms:{upper:{verified:true,name:'上册',units:[{id:'english-8a-03',number:3,title:'Unit 3'}]},lower:{verified:false,name:'下册',units:[{id:'unverified'}]}}}};
 w.GrowingHandwriting={knowledgeNodes:{test:'Topic'},nodeUnit:()=> 'english-8a-03'};
 w.GrowingUnitCalendar={collect:(id,read,topics)=>{assert.equal(id,'english-8a-03');read('wordops_8A_unit3');return {days:{},baseline:2,datedMastery:true};}};
 if(shell){w.GrowingCloud={storage:()=>store};const frame=w.document.querySelector('#course');Object.defineProperty(frame,'contentDocument',{value:{location:{href:'http://learn.test/learn/app-design/index.html',pathname:'/learn/app-design/index.html'}},configurable:true});}
 if(native){w.GrowingNative={identityAccount:()=> 'student',configureDevice(){}};w.localStorage.setItem('growing-cloud-session-v1',JSON.stringify({user:{id:'student'}}));}
 if(shell||native){w.document.querySelector('#my-rankings').hidden=!rankings;w.document.querySelector('#my-rankings').onclick=()=>calls.rankings++;w.document.querySelector('#open-device-settings').onclick=()=>calls.device++;}
 if(!fail)w.GrowingVantHome={mount:(target,adapter)=>{calls.mounted++;calls.adapter=adapter;target.innerHTML='<button id="vant-menu-trigger">设置</button>';return {destroy(){calls.destroyed++;target.replaceChildren();},close(){}};}};
 const append=w.document.head.append.bind(w.document.head);
 w.document.head.append=(...els)=>{append(...els);for(const el of els)queueMicrotask(()=>fail?el.onerror?.():el.onload?.());};
 const script=w.document.createElement('script');script.src='http://learn.test/learn/app-design/vant-home.js';
 Object.defineProperty(w.document,'currentScript',{value:script,configurable:true});
 w.eval(fs.readFileSync(path.join(__dirname,'../app/src/main/assets/web/app-design/vant-home.js'),'utf8'));
 await tick();return {dom,w,calls,store};
}
test('explicit legacy home never loads or mounts the Vant menu',async()=>{
 const s=await setup({enabled:false});try{assert.equal(s.calls.mounted,0);assert.equal(s.w.document.head.querySelectorAll('link').length,0);assert.notEqual(s.w.document.querySelector('.home-settings-entry').style.display,'none');}finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});
test('standalone sample hides only its old menu and exposes real account navigation',async()=>{
 const s=await setup();try{await until(()=>s.calls.mounted===1);assert.equal(s.w.document.querySelectorAll('#vant-menu-trigger').length,1);assert.ok(s.calls.adapter.actions.rankings);assert.ok(s.calls.adapter.actions.account);assert.equal(s.calls.adapter.actions.logout,undefined);}finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});
test('shell sample binds settings and calendar to its captured account store',async()=>{
 const s=await setup({shell:true});try{await until(()=>s.calls.mounted===1);const a=s.calls.adapter;
 a.deepseek.save({apiKey:'fixture-only'});assert.equal(s.calls.saved,1);assert.equal(s.w.GrowingCourseAIStorage,undefined);
 const units=await a.calendar.units();assert.equal(units.length,1);assert.equal(units[0].id,'english-8a-03');
 const data=await a.calendar.read('english-8a-03');assert.equal(data.baseline,2);assert.ok(s.calls.reads.includes('wordops_8A_unit3'));
 assert.equal(await a.deepseek.test(new AbortController().signal),undefined);
 a.actions.rankings();assert.equal(s.calls.rankings,1);
}finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});
test('logout closes the sample and invalidates old callbacks even with the same display name',async()=>{
 const s=await setup({shell:true});try{await until(()=>s.calls.mounted===1);const a=s.calls.adapter;s.w.document.querySelector('#account-menu').hidden=true;await until(()=>s.calls.destroyed===1);assert.throws(()=>a.deepseek.save({apiKey:'fixture-only'}),/退出|变更|失效/);assert.equal(s.calls.saved,0);assert.equal(s.w.document.querySelector('#account-menu').style.display,'');}finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});
test('leaving the course home restores the original account menu',async()=>{
 const s=await setup({shell:true});try{await until(()=>s.calls.mounted===1);s.w.document.querySelector('#course').remove();await until(()=>s.calls.destroyed===1);assert.equal(s.w.document.querySelector('#account-menu').style.display,'');}finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});
test('native sample reuses device and ranking actions without exposing a second menu',async()=>{
 const s=await setup({native:true});try{await until(()=>s.calls.mounted===1);s.calls.adapter.actions.device();assert.equal(s.calls.device,1);s.calls.adapter.actions.rankings();assert.equal(s.calls.rankings,1);assert.equal(s.w.document.querySelectorAll('#vant-menu-trigger').length,1);}finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});
test('a hidden ranking permission never becomes a visible sample action',async()=>{
 const s=await setup({shell:true,rankings:false});try{await until(()=>s.calls.mounted===1);assert.equal(s.calls.adapter.actions.rankings,undefined);}finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});

test('server voice defaults use the captured store and a delayed response cannot survive logout',async()=>{
 const s=await setup({shell:true});try{
  await until(()=>s.calls.mounted===1);let finish;const signal=new AbortController().signal;
  s.w.GrowingRealtime.settingsInfo=options=>{assert.equal(s.w.GrowingCourseAIStorage(),s.store);assert.equal(options.signal,signal);return new Promise(resolve=>finish=resolve);};
  const pending=s.calls.adapter.voice.info(signal);assert.equal(s.w.GrowingCourseAIStorage,undefined);
  s.w.document.querySelector('#account-menu').hidden=true;await until(()=>s.calls.destroyed===1);
  finish({voice:'ServerVoice'});await assert.rejects(pending,/退出|变更|失效/);
 }finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});
test('failed local component assets retain the original usable menu and show retry feedback',async()=>{
 const s=await setup({fail:true});try{await until(()=>s.w.document.querySelector('[data-vant-load-error]'));assert.equal(s.calls.mounted,0);assert.notEqual(s.w.document.querySelector('.home-settings-entry').style.display,'none');assert.match(s.w.document.querySelector('[data-vant-load-error]').textContent,/重试/);}finally{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();}
});
