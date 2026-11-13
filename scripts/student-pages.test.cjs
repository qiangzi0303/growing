const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const tick=()=>new Promise(r=>setTimeout(r,20));
async function setup({page='index.html',legacy=false,fail=false,delay=false,second=false,restoredClasses=false,deferScript=false,hosted=false}={}){
 const dom=new JSDOM('<body><main class="home"><nav class="home-settings-entry"></nav><header class="welcome">legacy home</header><section class="subjects">legacy subjects</section></main><main class="catalog-shell"><div id="catalog"></div></main><main id="summary"></main><main id="english-course"></main></body>',{url:'https://learn.test/'+(hosted?'learn/':'')+'app-design/'+page+(legacy?'?ui=legacy':''),runScripts:'outside-only'}),w=dom.window,calls={mount:0,destroy:0,legacy:0};
 const storage={getItem:key=>key==='record'?'{"saved":true}':null,key:()=>null,length:0};
 w.GrowingCloud={storage:()=>storage,activity(){}};w.GrowingCurriculum={};
 if(hosted)w.GrowingCloud.navigate=href=>{calls.navigations=(calls.navigations||0)+1;calls.href=href;};
 if(hosted)w.eval(fs.readFileSync(path.join(__dirname,'../platform-web/cloud-storage.js'),'utf8'));
 w.GrowingVantHome={mountStudent:(target,name,model)=>{calls.mount++;calls.name=name;calls.model=model;target.innerHTML=name==='catalog'?'<nav class="term-switch"><a href="units.html?subject=math&term=upper"><span>upper</span></a><a href="units.html?subject=math&term=lower"><span>lower</span></a></nav><a class="chapter" href="study.html?subject=math&unit=math-1">chapter</a>':restoredClasses?'<main id="english-course" class="workspace"><a href="units.html?subject=math">math</a></main>':'<a href="units.html?subject=math">math</a>';return {update(model){calls.updates=(calls.updates||0)+1;calls.model=model;},destroy(){calls.destroy++;}};}};
 let finish;
 w.GrowingStudentCatalog={create:options=>{calls.creates=(calls.creates||0)+1;calls.read=options.read('record');return delay&&calls.creates===1?new Promise(r=>finish=r):{kind:'catalog',title:'Math',term:options.params.get('term')||'upper'};}};
 w.GrowingStudentSummary={create:options=>{assert.equal(options.storage,storage);return {kind:'summary',title:'Summary'};}};
 w.GrowingStudentEnglishCourse={create:options=>{calls.controllers=(calls.controllers||0)+1;calls.node=options.params.get('node');assert.equal(options.storage,storage);return {model:{title:'English'},actions:{navigate(view){calls.view=view;}},beforeLeave(){options.active();calls.flushed=true;},destroy(){calls.controllerDestroyed=true;}};}};
 const append=w.document.head.append.bind(w.document.head);w.document.head.append=(...nodes)=>{append(...nodes);for(const el of nodes)queueMicrotask(()=>fail?el.onerror?.():el.onload?.());};
 Object.defineProperty(w.document,'currentScript',{value:{src:'https://learn.test/app-design/student-pages.js',defer:deferScript},configurable:true});
 if(deferScript){Object.defineProperty(w.document,'readyState',{value:'interactive',configurable:true});const add=w.document.addEventListener.bind(w.document);w.document.addEventListener=(name,fn,...args)=>{if(name==='DOMContentLoaded')calls.domReady=fn;else add(name,fn,...args);};}
 w.eval(fs.readFileSync(path.join(__dirname,'../app/src/main/assets/web/app-design/student-pages.js'),'utf8'));
 const deferred=w.GrowingStudentPages?.registerLegacy(()=>calls.legacy++);if(second)w.GrowingStudentPages?.registerLegacy(()=>calls.optional=(calls.optional||0)+1);await tick();
 return {dom,w,calls,deferred,finish:()=>finish?.({kind:'catalog',title:'late'})};
}
const end=s=>{s.w.dispatchEvent(new s.w.Event('pagehide'));s.dom.window.close();};
test('a deferred loader waits for the remaining course data scripts before mounting',async()=>{
 const s=await setup({page:'english-course.html',deferScript:true});try{
  assert.equal(s.calls.mount,0);assert.equal(typeof s.calls.domReady,'function');
  s.calls.domReady();await tick();assert.equal(s.calls.mount,1);
 }finally{end(s);}
});
test('restored legacy class names inside the Vue root remain visible',async()=>{
 const s=await setup({page:'english-course.html',restoredClasses:true});try{
  assert.equal(s.calls.mount,1);
  assert.equal(s.w.document.querySelector('body>#english-course').style.display,'none');
  assert.notEqual(s.w.document.querySelector('[data-student-vue] #english-course').style.display,'none');
 }finally{end(s);}
});
test('migrated home mounts by default and preserves the existing menu host',async()=>{
 const s=await setup();try{assert.equal(s.calls.mount,1);assert.equal(s.calls.name,'home');assert.notEqual(s.w.document.querySelector('.home-settings-entry').style.display,'none');assert.equal(s.w.document.querySelector('.subjects').style.display,'none');}finally{end(s);}
});
test('explicit legacy route does not load Vue resources or defer legacy rendering',async()=>{
 const s=await setup({legacy:true});try{assert.equal(s.calls.mount,0);assert.equal(s.w.document.querySelectorAll('script[src],link').length,0);assert.equal(s.deferred,false);}finally{end(s);}
});
test('catalog model reads the captured account store and suppresses the old renderer',async()=>{
 const s=await setup({page:'units.html'});try{assert.equal(s.deferred,true);assert.equal(s.calls.legacy,0);assert.equal(s.calls.mount,1);assert.equal(s.calls.read.saved,true);assert.equal(s.w.document.querySelector('.catalog-shell').style.display,'none');}finally{end(s);}
});
function click(s,selector,options={}){
 let intercepted;
 s.w.document.addEventListener('click',event=>{intercepted=event.defaultPrevented;event.preventDefault();},{once:true});
 s.w.document.querySelector(selector).dispatchEvent(new s.w.MouseEvent('click',{bubbles:true,cancelable:true,button:0,...options}));
 return intercepted;
}
const termLink=term=>'.term-switch a[href*="term='+term+'"]';
async function travel(s,direction){
 const changed=new Promise(resolve=>s.w.addEventListener('popstate',resolve,{once:true}));
 s.w.history[direction]();await changed;await tick();
}

for(const hosted of [false,true])test('term switching updates the existing catalog without document navigation '+(hosted?'in the platform':'standalone'),async()=>{
 const s=await setup({page:'units.html',hosted});try{
  const root=s.w.document.querySelector('[data-student-vue]'),history=s.w.history.length;
  assert.equal(click(s,termLink('lower')+' span'),true);await tick();
  assert.equal(s.calls.model.term,'lower');assert.equal(new URL(s.w.location.href).searchParams.get('term'),'lower');
  assert.equal(s.w.history.length,history+1);assert.equal(s.calls.mount,1);assert.equal(s.calls.destroy,0);
  assert.equal(s.calls.navigations||0,0);assert.equal(s.calls.read.saved,true);assert.equal(s.w.document.querySelector('[data-student-vue]'),root);
  if(hosted){assert.equal(click(s,'.chapter'),true);assert.equal(s.calls.navigations,1);assert.match(s.calls.href,/study.html/);}
 }finally{end(s);}
});

test('selecting the current term does not add history or refresh the catalog',async()=>{
 const s=await setup({page:'units.html',hosted:true});try{
  const history=s.w.history.length,creates=s.calls.creates;
  assert.equal(click(s,termLink('upper')),true);await tick();
  assert.equal(s.w.history.length,history);assert.equal(s.calls.creates,creates);assert.equal(s.calls.navigations||0,0);
  click(s,termLink('lower'));await tick();const lowerHistory=s.w.history.length,lowerCreates=s.calls.creates;
  click(s,termLink('lower'));await tick();assert.equal(s.w.history.length,lowerHistory);assert.equal(s.calls.creates,lowerCreates);
 }finally{end(s);}
});

test('back and forward restore the term inside the same catalog',async()=>{
 const s=await setup({page:'units.html',hosted:true});try{
  click(s,termLink('lower'));await tick();
  await travel(s,'back');assert.equal(s.calls.model.term,'upper');
  await travel(s,'forward');assert.equal(s.calls.model.term,'lower');assert.equal(s.calls.mount,1);assert.equal(s.calls.navigations||0,0);
 }finally{end(s);}
});

test('modified, download and new-tab term clicks keep native link behavior',async()=>{
 const s=await setup({page:'units.html',hosted:true});try{
  const link=s.w.document.querySelector(termLink('lower')),history=s.w.history.length,creates=s.calls.creates;
  for(const modifier of ['ctrlKey','metaKey','shiftKey','altKey'])assert.equal(click(s,termLink('lower'),{[modifier]:true}),false);
  assert.equal(click(s,termLink('lower'),{button:1}),false);
  link.target='_blank';assert.equal(click(s,termLink('lower')),false);link.removeAttribute('target');
  link.setAttribute('download','');assert.equal(click(s,termLink('lower')),false);link.removeAttribute('download');
  link.addEventListener('click',event=>event.preventDefault(),{once:true});click(s,termLink('lower'));await tick();
  assert.equal(s.w.history.length,history);assert.equal(s.calls.creates,creates);assert.equal(s.calls.navigations||0,0);
 }finally{end(s);}
});

test('a slower previous term cannot replace the most recently selected term',async()=>{
 const s=await setup({page:'units.html'});try{
  const pending={};s.w.GrowingStudentCatalog.create=({params})=>new Promise(resolve=>pending[params.get('term')]=()=>resolve({kind:'catalog',term:params.get('term')}));
  click(s,termLink('lower'));click(s,termLink('upper'));
  pending.upper();await tick();pending.lower();await tick();
  assert.equal(s.calls.model.term,'upper');assert.equal(s.calls.mount,1);assert.equal(s.calls.updates,1);
 }finally{end(s);}
});

test('restoring from bfcache installs only one term history listener',async()=>{
 const s=await setup({page:'units.html'});try{
  click(s,termLink('lower'));await tick();
  s.w.dispatchEvent(new s.w.PageTransitionEvent('pagehide',{persisted:true}));
  s.w.dispatchEvent(new s.w.PageTransitionEvent('pageshow',{persisted:true}));await tick();
  assert.equal(s.calls.model.term,'lower');const creates=s.calls.creates;
  await travel(s,'back');assert.equal(s.calls.model.term,'upper');assert.equal(s.calls.creates-creates,1);
 }finally{end(s);}
});

test('failed local resources render the real legacy page with a visible fallback status',async()=>{
 const s=await setup({page:'units.html',fail:true});try{assert.equal(s.calls.mount,0);assert.equal(s.calls.legacy,1);assert.ok(s.w.document.querySelector('[data-student-fallback]'));assert.notEqual(s.w.document.querySelector('.catalog-shell').style.display,'none');}finally{end(s);}
});
test('a model resolving after leaving the page cannot mount or hide the original page',async()=>{
 const s=await setup({page:'units.html',delay:true});try{s.w.dispatchEvent(new s.w.Event('pagehide'));s.finish();await tick();assert.equal(s.calls.mount,0);}finally{end(s);}
});
test('summary receives the account-bound store and destroys its app on pagehide',async()=>{
 const s=await setup({page:'unit-summary.html'});try{assert.equal(s.calls.name,'summary');s.w.dispatchEvent(new s.w.Event('pagehide'));assert.equal(s.calls.destroy,1);}finally{end(s);}
});

test('bfcache restoration ignores the old pending start and installs one refresh listener',async()=>{
 const s=await setup({page:'units.html',delay:true});try{
  s.w.dispatchEvent(new s.w.PageTransitionEvent('pagehide',{persisted:true}));
  s.w.dispatchEvent(new s.w.PageTransitionEvent('pageshow',{persisted:true}));await tick();
  s.finish();await tick();assert.equal(s.calls.mount,1);
  const before=s.calls.creates;s.w.dispatchEvent(new s.w.StorageEvent('storage'));await tick();
  assert.equal(s.calls.creates-before,1);
 }finally{end(s);}
});

test('course uses one account-bound controller, exposes real menu actions and flushes before disposal',async()=>{
 const s=await setup({page:'english-course.html'});try{
  assert.equal(s.calls.name,'english-course');assert.equal(s.calls.controllers,1);
  assert.equal(s.w.document.querySelector('#english-course').style.display,'none');
  s.w.GrowingCourseAccount.open('settings');assert.equal(s.calls.view,'settings');
  assert.equal(s.w.GrowingCourseAccount.back(),false);
  s.w.dispatchEvent(new s.w.StorageEvent('storage'));await tick();assert.equal(s.calls.controllers,1);
  s.w.dispatchEvent(new s.w.Event('pagehide'));assert.equal(s.calls.flushed,true);assert.equal(s.calls.controllerDestroyed,true);
 }finally{end(s);}
});

test('restored course reads the latest URL rather than the first captured route',async()=>{
 const s=await setup({page:'english-course.html'});try{
  s.w.history.replaceState(null,'','?node=latest-saved-word');
  s.w.dispatchEvent(new s.w.PageTransitionEvent('pagehide',{persisted:true}));
  s.w.dispatchEvent(new s.w.PageTransitionEvent('pageshow',{persisted:true}));await tick();
  assert.equal(s.calls.node,'latest-saved-word');
 }finally{end(s);}
});

test('calendar dependency failure is reported locally without rejecting or replacing the course',async()=>{
 const s=await setup({page:'english-course.html'});try{
  const append=s.w.document.head.append.bind(s.w.document.head);
  s.w.document.head.append=(...nodes)=>{for(const node of nodes)if(node.src?.includes('unit-calendar.js')){queueMicrotask(()=>node.onerror?.());}else append(node);};
  await s.w.GrowingCourseAccount.open('calendar');
  assert.match(s.w.document.querySelector('[data-student-action-error]')?.textContent||'',/日历.*(加载|打开).*失败/);
  assert.equal(s.w.document.querySelectorAll('[data-student-vue=english-course]').length,1);
  assert.equal(s.calls.legacy,0);
 }finally{end(s);}
});

test('fallback runs every registered renderer, including an optional renderer registered after failure',async()=>{
 const s=await setup({page:'units.html',fail:true});try{
  let optional=0;s.w.GrowingStudentPages.registerLegacy(()=>optional++);
  assert.equal(s.calls.legacy,1);assert.equal(optional,1);
 }finally{end(s);}
});

test('fallback runs two renderers queued before the same resource failure',async()=>{
 const s=await setup({page:'units.html',fail:true,second:true});try{assert.equal(s.calls.legacy,1);assert.equal(s.calls.optional,1);}finally{end(s);}
});
