/* Incremental page migration. Vue owns its root; original renderers are retained for explicit fallback. */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search),file=location.pathname.includes('/fraction-ops/')?'fraction-course.html':location.pathname.includes('/word-ops-unit3/')?'unit3-course.html':location.pathname.split('/').pop();
 const pages={'index.html':'home','units.html':'catalog','study.html':'study','unit-summary.html':'summary','math-resources.html':'resources','english-resources.html':'resources','physics-resources.html':'resources','math-course.html':'math-course','physics-course.html':'math-course','english-course.html':'english-course','knowledge.html':'knowledge','physics-knowledge.html':'knowledge','handwriting.html':'handwriting','english-visual-lab.html':'english-labs','english-visual-quiz.html':'english-labs','english-sentence-demo.html':'english-labs','math-exam-practice.html':'math-resources-workbench','math-wrong-questions.html':'math-resources-workbench','math-explore-lab.html':'math-labs','geometry-models.html':'math-labs','physics-explore-lab.html':'physics-labs','physics-sound-lab.html':'physics-labs','triangle-centers.html':'triangle-centers','fraction-course.html':'fraction-course','unit3-course.html':'unit3-course','math-exam-midterm.html':'midterm','math-exam-midterm-graph.html':'midterm'},page=pages[file];
 const controllers={'math-course':['student-math-course.js','GrowingStudentMathCourse'],'english-course':['student-english-course.js','GrowingStudentEnglishCourse'],knowledge:['student-knowledge.js','GrowingStudentKnowledge'],handwriting:['student-handwriting.js','GrowingStudentHandwriting'],'english-labs':['student-english-labs.js','GrowingStudentEnglishLabs'],'math-resources-workbench':['student-math-resources.js','GrowingStudentMathResources'],'math-labs':['student-math-labs.js','GrowingStudentMathLabs'],'physics-labs':['student-physics-labs.js','GrowingStudentPhysicsLabs'],'triangle-centers':['student-triangle-centers.js','GrowingStudentTriangleCenters'],'fraction-course':['student-fraction-course.js','GrowingStudentFractionCourse'],'unit3-course':['student-unit3-course.js','GrowingStudentUnit3Course'],midterm:['student-midterm.js','GrowingStudentMidterm']};
 const enabled=!!page&&file!=='english-sentence-demo.html'&&params.get('ui')!=='legacy';
 const legacyRenders=[];
 let failed=false,disposed=false,app,root,controller,calendarApp,calendarHost,actionError,routeSubscription,ownedAccount,version=0,startup=0;
 window.GrowingStudentPages={registerLegacy(render){if(!enabled)return false;legacyRenders.push(render);if(failed)render();return true;}};
 if(!enabled)return;
 const base=new URL('./',document.currentScript.src),loads=new Map(),hidden=[];
 const assetUrl=name=>{const url=new URL(name,base);url.searchParams.set('studentUi','20261114-photo-history-1');return url;};
 function load(name,css=false){
  if(loads.has(name))return loads.get(name);
  const promise=new Promise((resolve,reject)=>{const el=document.createElement(css?'link':'script');if(css){el.rel='stylesheet';el.href=assetUrl(name);}else el.src=assetUrl(name);el.onload=resolve;el.onerror=()=>{el.remove();loads.delete(name);reject(Error('新版学习页面资源暂不可用，已保留原页面。'));};document.head.append(el);});loads.set(name,promise);return promise;
 }
 const nativeId=window.GrowingNative?.identityAccount?.();
 const active=()=>{if(disposed||nativeId&&window.GrowingNative.identityAccount()!==nativeId)throw Error('学习会话已变更，请重新打开课程。');};
 function hide(el){if(!el||root?.contains(el))return;hidden.push([el,el.style.display]);el.style.display='none';}
 function cleanup(){document.documentElement.classList.remove('student-vue-active');version++;routeSubscription?.();routeSubscription=null;calendarApp?.destroy();calendarApp=null;calendarHost?.remove();calendarHost=null;actionError?.remove();actionError=null;app?.destroy();app=null;controller?.destroy();controller=null;if(ownedAccount&&window.GrowingCourseAccount===ownedAccount)delete window.GrowingCourseAccount;ownedAccount=null;root?.remove();root=null;for(const [el,display] of hidden.splice(0))el.style.display=display;}
 function fallback(error){if(disposed||failed)return;failed=true;cleanup();for(const render of legacyRenders)render();const note=document.createElement('p');note.dataset.studentFallback='';note.setAttribute('role','status');note.textContent=error.message||'新版学习页面暂不可用，已保留原页面。';document.body.append(note);}
 async function start(){
  const params=new URLSearchParams(location.search);
  if(page==='english-labs')params.set('kind',file==='english-sentence-demo.html'?'sentence':file==='english-visual-quiz.html'?'quiz':'visual');
  if(page==='math-labs')params.set('kind',file==='geometry-models.html'?'geometry':'experiment');
  if(page==='physics-labs')params.set('kind',file==='physics-sound-lab.html'?'sound':'explore');
  if(page==='midterm')params.set('kind',file==='math-exam-midterm-graph.html'?'graph':'original');
  const run=++startup;
  const sessionActive=()=>{active();if(run!==startup)throw Error('学习页面已重新打开。');};
  const fail=error=>{if(run===startup)fallback(error);};
  let storage,cloud;
  try{cloud=window.top.GrowingCloud;storage=cloud?.storage?cloud.storage(window):localStorage;}catch(error){if(error.name!=='SecurityError'){fail(error);return;}storage=localStorage;}
  const read=key=>{sessionActive();const raw=storage.getItem(key);return raw===null?null:JSON.parse(raw);};
  try{
   await Promise.all([window.GrowingVantHome||load('vendor/learning-ui/learning-ui.js'),load('vendor/learning-ui/learning-ui.css',true)]);sessionActive();
   if(!window.GrowingVantHome?.mountStudent)throw Error('新版学习页面版本不完整，已保留原页面。');
   if(page!=='home'){
    if(!window.GrowingCurriculum)await load('curriculum.js');
    if(controllers[page]){
     const [script,global]=controllers[page];
     if(page==='math-course'&&!window.GrowingPracticeFigures)await load('practice-figures.js');
     if(page==='unit3-course'){await load('course-ai.js');}
     if(page==='fraction-course'){
      await Promise.all(['handwriting-core.js','practice-progress.js','practice-math-upper.js','practice-math-lower.js','practice-physics.js'].map(name=>load(name)));
      await load('application-practice.js');await load('course-ai.js');await load('handwriting-ai.js');
     }
     if(page==='math-resources-workbench')await Promise.all(['handwriting-core.js','student-photo-review.js','paper-photo-uploads.js'].map(name=>load(name)));
     if(['handwriting','math-course','math-resources-workbench'].includes(page)&&!window.GrowingHandwritingAI)await load('handwriting-ai.js');
     if(!window[global])await load(script);
    }
    else if(page==='summary'){if(!window.GrowingStudentSummary)await load('student-summary-model.js');}
    else if(page==='resources'){if(!window.GrowingStudentResources)await load('student-resources-model.js');}
    else if(!window.GrowingStudentCatalog)await load('student-catalog-model.js');
   }
   async function openPapers(subject){
    sessionActive();
    if(cloud?.openPapers)await cloud.openPapers({subject});
    else location.href=window.GrowingNative?'../cloud/index.html?subject='+subject+'&return='+encodeURIComponent(location.href)+'#my-papers':'/?subject='+subject+'#my-papers';
    sessionActive();
   }
   function navigate(href,replace=false){sessionActive();const url=new URL(href,location.href);if(cloud?.navigate)cloud.navigate(url.href,replace);else if(replace)location.replace(url.href);else location.href=url.href;}
   function updateRoute(model){sessionActive();if(model.route&&new URL(model.route,location.href).href!==location.href)history.replaceState(null,'',model.route);if(model.title&&document.title!==model.title)document.title=model.title;}
   async function openCalendar(){
    try{
    actionError?.remove();actionError=null;
    await Promise.all([window.GrowingUnitCalendar||load('unit-calendar.js'),window.GrowingHandwriting||load('handwriting-core.js')]);sessionActive();
    if(!calendarApp){
     calendarHost=document.createElement('div');calendarHost.className='student-calendar-host';document.body.append(calendarHost);
     const calendar={units:async()=>{sessionActive();return Object.values(window.GrowingCurriculum).flatMap(subject=>Object.values(subject.terms).filter(term=>term.verified).flatMap(term=>term.units.map(unit=>({id:unit.id,label:`${subject.name} · ${term.name} · ${unit.number} ${unit.title}`}))));},read:async unit=>{sessionActive();const H=window.GrowingHandwriting,topics=Object.entries(H.knowledgeNodes).map(([id,title])=>({id,title,unitId:H.nodeUnit(id)}));return window.GrowingUnitCalendar.collect(unit,read,topics);}};
     calendarApp=window.GrowingVantHome.mount(calendarHost,{actions:{},calendar},{calendarOnly:true});
    }
    await calendarApp.openCalendar();
    }catch(error){
     if(disposed||run!==startup)return;
     actionError=document.createElement('p');actionError.dataset.studentActionError='';actionError.setAttribute('role','alert');actionError.textContent='学习日历打开失败，请重试。';actionError.style.cssText='margin:16px auto;max-width:960px;padding:16px;color:#9f3131';document.body.append(actionError);
    }
   }
   async function refresh(){
    const request=++version;sessionActive();
    if(controller){controller.actions.refresh?.();return;}
    let model;
    if(controllers[page]){
     controller=window[controllers[page][1]].create({subject:file.startsWith('physics')?'physics':file.startsWith('english')?'english':'math',params,storage,active:sessionActive,onNavigate:navigate});
     const state=controller.snapshot?controller.snapshot():controller.model;model={controller,title:state.title};
     if(['knowledge','english-labs','math-labs','physics-labs','midterm'].includes(page)){updateRoute(state);routeSubscription=controller.subscribe(updateRoute);}
     if(page.endsWith('-course')&&!window.GrowingCourseAccount){ownedAccount={open(view){sessionActive();if(view==='calendar')return openCalendar();if(controller.actions.open)controller.actions.open(view);else controller.actions.navigate?.(view);},back(){sessionActive();if(calendarApp?.isOpen()){calendarApp.close();return true;}const state=controller.snapshot?controller.snapshot():controller.model;const home=page==='unit3-course'?'library':page==='fraction-course'?'listen':'words';if(state?.view&&state.view!==home){if(controller.actions.open)controller.actions.open(home);else controller.actions.navigate(home);return true;}return false;}};window.GrowingCourseAccount=ownedAccount;}
    }
    else model=page==='home'?{kind:'home',title:'逆流 · 数学、英语与物理',subjects:[{id:'math',name:'数学',description:'苏科版 · 八年级上下册',icon:'notes-o'},{id:'english',name:'英语',description:'译林版 · 八年级上下册',icon:'description'},{id:'physics',name:'物理',description:'苏科版 · 八年级上册',icon:'bulb-o'}]}:page==='summary'?await window.GrowingStudentSummary.create({params,storage,load,active:sessionActive}):page==='resources'?window.GrowingStudentResources.create({subject:file.split('-')[0],params,openPapers}):await window.GrowingStudentCatalog.create({params:page==='catalog'?new URLSearchParams(location.search):params,page,read});
    sessionActive();if(request!==version)return;
    if(model.kind==='redirect'){
     const href=new URL(model.href,location.href).href;
     if(window.top.GrowingCloud?.navigate)window.top.GrowingCloud.navigate(href,true);else location.replace(href);
     return;
    }
    if(app){app.update(model);return;}
    root=document.createElement('div');root.dataset.studentVue=page;root.className='student-vue-root';
    if(page==='home')document.querySelector('.home').append(root);else document.body.append(root);
    app=window.GrowingVantHome.mountStudent(root,page,model);
    document.documentElement.classList.add('student-vue-active');
    root.addEventListener('click',event=>{
     const link=event.target.closest('a[href]');
     if(!link||link.hasAttribute('download')||link.target&&link.target!=='_self'||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
     const url=new URL(link.href,location.href);if(url.origin!==location.origin)return;
     if(page==='catalog'&&link.closest('.term-switch')&&url.pathname===location.pathname){
      event.preventDefault();
      if((url.searchParams.get('term')||'upper')===(new URLSearchParams(location.search).get('term')||'upper'))return;
      history.pushState(history.state,'',url.href);refresh().catch(fail);return;
     }
     if(cloud?.navigate){event.preventDefault();cloud.navigate(url.href);}
    });
    if(page==='home'){hide(document.querySelector('.home>.welcome'));hide(document.querySelector('.home>.subjects'));}
    else if(page==='summary')hide(document.querySelector('#summary'));
    else if(controllers[page]){
     const selectors=page==='physics-labs'?'.top,.layout,#quiz-launch,#toast,body>footer,#about-dialog':page==='triangle-centers'?'#app,#toast':page==='unit3-course'?'#english-course,.legacy-course-header,#storageNote':page==='fraction-course'?'.legacy-course-header,#main,#storageNote':page==='midterm'?'body>main':page==='english-labs'?(file==='english-sentence-demo.html'?'.app-header,#sentence-app,.skip-link':'.topbar,.shell,#status,#help'):page==='math-resources-workbench'?'body>main':page==='math-labs'?(file==='geometry-models.html'?'.shell':'.top,.layout,body>footer,#status,#about-dialog'):page==='english-course'?'#english-course':page==='math-course'?'#math-course':'.workspace';
     document.querySelectorAll(selectors).forEach(hide);hide(document.querySelector('.course-return-nav'));
    }
    else{hide(document.querySelector('.catalog-shell'));hide(document.querySelector('#study'));}
    if(model.title)document.title=model.title;window.dispatchEvent(new Event('growing:student-mounted'));
   }
   await refresh();
   sessionActive();
   const update=()=>{if(!disposed&&!failed&&run===startup)refresh().catch(fail);};
   window.addEventListener('storage',update);window.addEventListener('pageshow',update);
   if(page==='catalog')window.addEventListener('popstate',update);
   const visible=()=>{if(!document.hidden)update();};document.addEventListener('visibilitychange',visible);
   window.addEventListener('pagehide',()=>{window.removeEventListener('storage',update);window.removeEventListener('pageshow',update);window.removeEventListener('popstate',update);document.removeEventListener('visibilitychange',visible);},{once:true});
  }catch(error){fail(error);}
 }
 window.addEventListener('pagehide',()=>{try{controller?.beforeLeave?.();}finally{disposed=true;startup++;cleanup();document.documentElement.classList.remove('student-vue-active');}});
 window.addEventListener('pageshow',event=>{if(event.persisted&&disposed){disposed=false;failed=false;start();}});
 if(document.readyState==='loading'||document.readyState!=='complete'&&document.currentScript?.defer)document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
