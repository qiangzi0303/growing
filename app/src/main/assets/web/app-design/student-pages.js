/* Incremental page migration. Vue owns its root; original renderers are retained for explicit fallback. */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search),file=location.pathname.includes('/word-ops-unit3/')?'unit3-course.html':location.pathname.split('/').pop();
 const pages={'index.html':'home','units.html':'catalog','study.html':'study','unit-summary.html':'summary','math-resources.html':'resources','english-resources.html':'resources','physics-resources.html':'resources','math-course.html':'math-course','physics-course.html':'math-course','english-course.html':'english-course','knowledge.html':'knowledge','physics-knowledge.html':'knowledge','handwriting.html':'handwriting','english-visual-lab.html':'english-labs','english-visual-quiz.html':'english-labs','english-sentence-demo.html':'english-labs','math-exam-practice.html':'math-resources-workbench','math-wrong-questions.html':'math-resources-workbench','math-explore-lab.html':'math-labs','geometry-models.html':'math-labs','physics-explore-lab.html':'physics-labs','physics-sound-lab.html':'physics-labs','triangle-centers.html':'triangle-centers','unit3-course.html':'unit3-course','math-exam-midterm.html':'midterm','math-exam-midterm-graph.html':'midterm'},page=pages[file];
 const controllers={'math-course':['student-math-course.js','GrowingStudentMathCourse'],'english-course':['student-english-course.js','GrowingStudentEnglishCourse'],knowledge:['student-knowledge.js','GrowingStudentKnowledge'],handwriting:['student-handwriting.js','GrowingStudentHandwriting'],'english-labs':['student-english-labs.js','GrowingStudentEnglishLabs'],'math-resources-workbench':['student-math-resources.js','GrowingStudentMathResources'],'math-labs':['student-math-labs.js','GrowingStudentMathLabs'],'physics-labs':['student-physics-labs.js','GrowingStudentPhysicsLabs'],'triangle-centers':['student-triangle-centers.js','GrowingStudentTriangleCenters'],'unit3-course':['student-unit3-course.js','GrowingStudentUnit3Course'],midterm:['student-midterm.js','GrowingStudentMidterm']};
 const enabled=!!page&&file!=='english-sentence-demo.html'&&params.get('ui')!=='legacy';
 const legacyRenders=[];
 let failed=false,disposed=false,app,root,controller,calendarApp,calendarHost,actionError,routeSubscription,ownedAccount,version=0,startup=0;
 window.GrowingStudentPages={registerLegacy(render){if(!enabled)return false;legacyRenders.push(render);if(failed)render();return true;}};
 if(!enabled)return;
 const base=new URL('./',document.currentScript.src),loads=new Map(),hidden=[];
const assetUrl=name=>{const url=new URL(name,base);url.searchParams.set('studentUi',page==='math-wrong-questions'?'20261121-archive-clean-1':page==='catalog'?'20261121-catalog-clean-1':['english-course','unit3-course'].includes(page)?'20261121-no-paper-tab-1':'20261121-no-paper-tab-1');if(['student-math-course.js','student-math-resources.js','student-catalog-model.js','math-chapter-score.js','math-wrong-index.js'].includes(name))url.searchParams.set('studentUi','20261125-chapter-rewards-1');if(['student-math-course.js','question-attempts.js'].includes(name)||name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261125-reward-entry-2');if(['student-unit3-course.js','student-english-course.js','student-catalog-model.js','student-summary-model.js','english-word-review.js','english-unit-score.js','english-score.js','english-engine.js','unit-summary-core.js'].includes(name.split('?')[0])||name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261125-english-reward-sheet-3');if(name==='student-catalog-model.js'||name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261125-english-reward-sheet-3');if(['student-catalog-model.js','student-resources-model.js','student-math-labs.js'].includes(name)||name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261125-catalog-labels-1');if(['english-course','unit3-course'].includes(page)&&name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261125-mobile-enter-1');if(page==='english-course'&&name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261126-sentence-local-1');if(['student-english-course.js','english-engine.js','english-unit-score.js'].includes(name))url.searchParams.set('studentUi','20261126-sentence-local-1');if(['english-course','unit3-course'].includes(page)&&name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261126-sentence-local-1');if(page==='english-course'&&name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261126-unit5-scenes-1');if(page==='english-course'&&(name==='student-english-course.js'||name.startsWith('vendor/learning-ui/')))url.searchParams.set('studentUi','20261126-unit5-tabs-2');if(page==='english-course'&&(name==='student-english-course.js'||name.startsWith('vendor/learning-ui/')))url.searchParams.set('studentUi','20261126-points-1');if(['student-catalog-model.js','student-summary-model.js','curriculum.js','english-unit3-data.js','english-sentence-data.js'].includes(name.split('?')[0]))url.searchParams.set('studentUi','20261126-points-1');if(name.split('?')[0]==='english-unit-score.js')url.searchParams.set('studentUi','20261126-english-zero-1');if(name==='student-catalog-model.js'||(['catalog','english-course'].includes(page)&&name.startsWith('vendor/learning-ui/')))url.searchParams.set('studentUi','20261126-review-dot-1');if(page==='english-course'&&(['english-pomodoro.js','student-english-course.js'].includes(name)||name.startsWith('vendor/learning-ui/')))url.searchParams.set('studentUi','20261126-pomodoro-1');return url;};
 function load(name,css=false){
  if(loads.has(name))return loads.get(name);
  const promise=new Promise((resolve,reject)=>{const el=document.createElement(css?'link':'script'),url=assetUrl(name);if(name==='student-catalog-model.js'||(['catalog','english-course'].includes(page)&&name.startsWith('vendor/learning-ui/')))url.searchParams.set('studentUi','20261126-review-dot-1');if(page==='math-course'&&(['math-pomodoro.js','math-pomodoro-session.js','student-math-course.js'].includes(name)||name.startsWith('vendor/learning-ui/')))url.searchParams.set('studentUi','20261126-math-pomodoro-1');if(page==='english-course'&&name.startsWith('vendor/learning-ui/'))url.searchParams.set('studentUi','20261126-pomodoro-1');if(css){el.rel='stylesheet';el.href=url;}else el.src=url;el.onload=resolve;el.onerror=()=>{el.remove();loads.delete(name);reject(Error('新版学习页面资源暂不可用，已保留原页面。'));};document.head.append(el);});loads.set(name,promise);return promise;
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
  let storage,cloud,eventHost=window;
  try{const host=window.GrowingCloudHost;cloud=host?.cloud||window.GrowingCloud||window.top.GrowingCloud;storage=cloud?.storage?cloud.storage(window):localStorage;eventHost=host?.window||(window.GrowingCloud?window:window.top);}catch(error){if(error.name!=='SecurityError'){fail(error);return;}storage=localStorage;}
  const read=key=>{sessionActive();const raw=storage.getItem(key);return raw===null?null:JSON.parse(raw);};
  try{
   await Promise.all([window.GrowingVantHome||load('vendor/learning-ui/learning-ui.js'),load('vendor/learning-ui/learning-ui.css',true)]);sessionActive();
   if(!window.GrowingVantHome?.mountStudent)throw Error('新版学习页面版本不完整，已保留原页面。');
   if(page!=='home'){
    if(!window.GrowingCurriculum)await load('curriculum.js');
    if(controllers[page]){
     const [script,global]=controllers[page];
     if(['english-course','unit3-course'].includes(page)){
      await Promise.all([window.GrowingEnglishWordReview||load('english-word-review.js'),window.GrowingEnglishWordStudyData||load('english-word-study-data.js')]);
      await Promise.all(['english-word-study-units-245.js','english-word-study-units-3678.js'].map(name=>load(name)));
      if(page==='english-course'){
       await load('english-pomodoro.js');
       await load('grammar-scenes/course-registry.js?v=20261126-points-1');
       const unitId=params.get('unit')||'english-8a-01',files=window.GrowingEnglishPointCourses.assets[unitId]||[];
       await Promise.all(files.map(file=>load('grammar-scenes/'+file+'?v=20261126-points-1')));
      }
     }
     if(['math-course','math-resources-workbench'].includes(page))await Promise.all([load('math-chapter-score.js'),load('math-wrong-index.js')]);
     if(page==='math-course'&&!window.GrowingPracticeFigures)await load('practice-figures.js');
     if(page==='math-course'){
      if(file==='math-course.html'){await load('math-pomodoro.js');await load('math-pomodoro-session.js');}
      await Promise.all([load('question-attempts.js'),load('../cloud/question-drawing.js'),window.katex||load('../cloud/vendor/katex/katex.min.js'),load('../cloud/vendor/katex/katex.min.css',true)]);
      await load('../cloud/math-format.js');
     }
     if(page==='unit3-course'){await load('course-ai.js');}
     if(page==='math-resources-workbench')await Promise.all(['handwriting-core.js','student-photo-review.js','paper-photo-uploads.js'].map(name=>load(name)));
     if(['handwriting','math-course','math-resources-workbench'].includes(page)&&!window.GrowingHandwritingAI)await load('handwriting-ai.js');
     if(!window[global])await load(script);
    }
    else if(page==='summary'){if(!window.GrowingStudentSummary)await load('student-summary-model.js');}
    else if(page==='resources'){if(!window.GrowingStudentResources)await load('student-resources-model.js');}
    else {if(page==='catalog')await Promise.all([window.GrowingEnglishEngine||load('english-engine.js'),window.GrowingEnglishWordReview||load('english-word-review.js')]);if(!window.GrowingStudentCatalog)await load('student-catalog-model.js');}
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
   async function refresh(reload=false){
    const request=++version;sessionActive();
    if(controller){controller.actions.refresh?.();return;}
    let model,wrongSummary=null,wrongError='';
    if(page==='catalog'&&(new URLSearchParams(location.search).get('subject')||'math')!=='english')try{
     if(!window.GrowingQuestionAttempts)await load('question-attempts.js');
     const target=await window.GrowingQuestionAttempts.context();sessionActive();
     if(target){wrongSummary=await target.api('/question-bank/unit-summary?'+new URLSearchParams({studentId:target.studentId,subject:new URLSearchParams(location.search).get('subject')||'math'}),reload?{cache:'reload'}:undefined);if(wrongSummary.studentId!==target.studentId)throw Error('学生信息已变更');}
     else wrongError='登录学生账号后显示个人错题提醒。';
    }catch(error){wrongError='错题提醒暂不可用：'+error.message;}
    if(controllers[page]){
     controller=window[controllers[page][1]].create({subject:file.startsWith('physics')?'physics':file.startsWith('english')?'english':'math',params,storage,active:sessionActive,onNavigate:navigate});
     const state=controller.snapshot?controller.snapshot():controller.model;model={controller,title:state.title};
     if(['knowledge','english-labs','math-labs','physics-labs','midterm'].includes(page)){updateRoute(state);routeSubscription=controller.subscribe(updateRoute);}
     if(page.endsWith('-course')&&!window.GrowingCourseAccount){ownedAccount={open(view){sessionActive();if(view==='calendar')return openCalendar();if(controller.actions.open)controller.actions.open(view);else controller.actions.navigate?.(view);},back(){sessionActive();if(calendarApp?.isOpen()){calendarApp.close();return true;}const state=controller.snapshot?controller.snapshot():controller.model;const home=page==='unit3-course'?'library':'words';if(state?.view&&state.view!==home){if(controller.actions.open)controller.actions.open(home);else controller.actions.navigate(home);return true;}return false;}};window.GrowingCourseAccount=ownedAccount;}
    }
    else model=page==='home'?{kind:'home',title:'逆流 · 数学、英语与物理',subjects:[{id:'math',name:'数学',description:'苏科版 · 八年级上下册',icon:'notes-o'},{id:'english',name:'英语',description:'译林版 · 八年级上下册',icon:'description'},{id:'physics',name:'物理',description:'苏科版 · 八年级上册',icon:'bulb-o'}]}:page==='summary'?await window.GrowingStudentSummary.create({params,storage,load,active:sessionActive}):page==='resources'?window.GrowingStudentResources.create({subject:file.split('-')[0],params,openPapers}):await window.GrowingStudentCatalog.create({params:page==='catalog'?new URLSearchParams(location.search):params,page,read,storage,load,active:sessionActive,wrongSummary,wrongError});
    sessionActive();if(request!==version)return;
    if(model.kind==='redirect'){
     const href=new URL(model.href,location.href).href;
     if(cloud?.navigate)cloud.navigate(href,true);else location.replace(href);
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
     const selectors=page==='physics-labs'?'.top,.layout,#quiz-launch,#toast,body>footer,#about-dialog':page==='triangle-centers'?'#app,#toast':page==='unit3-course'?'#english-course,.legacy-course-header,#storageNote':page==='midterm'?'body>main':page==='english-labs'?(file==='english-sentence-demo.html'?'.app-header,#sentence-app,.skip-link':'.topbar,.shell,#status,#help'):page==='math-resources-workbench'?'body>main':page==='math-labs'?(file==='geometry-models.html'?'.shell':'.top,.layout,body>footer,#status,#about-dialog'):page==='english-course'?'#english-course':page==='math-course'?'#math-course':'.workspace';
     document.querySelectorAll(selectors).forEach(hide);hide(document.querySelector('.course-return-nav'));
    }
    else{hide(document.querySelector('.catalog-shell'));hide(document.querySelector('#study'));}
    if(model.title)document.title=model.title;window.dispatchEvent(new Event('growing:student-mounted'));
   }
   await refresh();
   sessionActive();
   const update=()=>{if(!disposed&&!failed&&run===startup)refresh(true).catch(fail);};
   eventHost.addEventListener('growing:knowledge-changed',update);window.addEventListener('storage',update);window.addEventListener('pageshow',update);
   if(page==='catalog')window.addEventListener('popstate',update);
   const visible=()=>{if(!document.hidden)update();};document.addEventListener('visibilitychange',visible);
   window.addEventListener('pagehide',()=>{eventHost.removeEventListener('growing:knowledge-changed',update);window.removeEventListener('storage',update);window.removeEventListener('pageshow',update);window.removeEventListener('popstate',update);document.removeEventListener('visibilitychange',visible);},{once:true});
  }catch(error){fail(error);}
 }
 window.addEventListener('pagehide',()=>{try{controller?.beforeLeave?.();}finally{disposed=true;startup++;cleanup();document.documentElement.classList.remove('student-vue-active');}});
 window.addEventListener('pageshow',event=>{if(event.persisted&&disposed){disposed=false;failed=false;start();}});
 if(document.readyState==='loading'||document.readyState!=='complete'&&document.currentScript?.defer)document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
