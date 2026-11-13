(()=>{
  'use strict';
  const $=s=>document.querySelector(s),native=window.GrowingNative,raw=window.localStorage;
  const base=native?String(native.cloudApiUrl?.()||'').replace(/\/$/,''):'';
  const isNative=!!native,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let user=null,token='',authMode=!isNative&&location.hash==='#register'?'register':'login',generation=0,syncing=false,timer,management,parentRequest=0;
  let requestedRankings=location.hash==='#my-rankings';
  const legacyContext=()=>{const query=new URLSearchParams(location.search);if(isNative)query.delete('return');return window.GrowingLegacy.parse(query.toString(),location.hash);};
  function consoleBack(){const context=legacyContext();if(!isNative&&context.legacy&&!context.error){location.assign(context.returnTo);return true;}return false;}
  window.addEventListener('growing:settings-closed',()=>{if(user)consoleBack();});
  let saveTimer,saveAgain=false,cloudReady=false,restoring=false;
  const courseStores=new Map();
  function queueSave(){
    if(user?.role!=='Student')return;
    clearTimeout(saveTimer);saveTimer=setTimeout(sync,400);
    if(syncing)saveAgain=true;
  }
  const hint=text=>{$('#message').textContent=text;};
  let studentNav,studentNavModel,authAttempt=0,authPending=Promise.resolve();
  const ui=()=>window.GrowingStudentPlatform;
  function paperCanLeave(root){const handle=root?.__studentPapers;if(!handle?.canLeave||handle.canLeave())return true;hint('本次原稿尚未保存，请先在工作台保存后再返回。');return false;}
  function papersCanLeave(){return ['#photo-content','#photo-bank-page','#question-bank-page'].every(selector=>paperCanLeave($(selector)));}
  function disposeMain(){ui()?.dispose($('#app'));}
  async function authenticate(values){
    const attempt=++authAttempt,mode=authMode;
    const operation=authPending.catch(()=>{}).then(async()=>{if(attempt!==authAttempt)return;const result=await api('/auth/'+mode,{method:'POST',body:JSON.stringify(values)});if(attempt!==authAttempt){await api('/auth/logout',{method:'POST'});return;}if(isNative)token=result.token;await enter(result.user);});authPending=operation;return operation;
  }
  async function confirmRole(values){const version=generation;if(!['Student','Parent'].includes(values.role))throw Error('请选择学生或家长。');if(!native?.confirmCloudSession)checkNativeBinding({...user,role:values.role});const profile=await api('/auth/role',{method:'POST',body:JSON.stringify({role:values.role})});if(version===generation)await enter(profile);}
  async function logout(){if(!papersCanLeave())return;authAttempt++;if(user?.role==='Student'&&!await sync())throw Error('暂时无法退出，请检查网络后重试。');await api('/auth/logout',{method:'POST'});generation++;clearInterval(timer);clearTimeout(saveTimer);user=null;token='';raw.removeItem(sessionKey);if(native?.logout){native.logout();return;}auth();hint('已退出云账号。');}
  function removeStudentNav(){if(studentNav){ui()?.dispose(studentNav);studentNav.remove();studentNav=null;studentNavModel=null;}if(ui())ui().navigationActive=false;const bar=$('.bar');if(bar)bar.style.display='';}
  async function showStudentNav(){
    if(user?.role!=='Student'||needsRole(user)||!ui())return;const version=generation,id=user.id;removeStudentNav();const active=()=>{if(user?.id!==id||generation!==version)throw Error('账号已切换，请重新打开菜单。');};
    const actions={rankings:showRankings,logout:async()=>{try{active();await logout();}catch(e){hint(e.message);}},learningSettings:()=>accountView('settings')};
    const adapter=ui().menu({identity:user.username||'当前账号',storage:storage(),active,actions});
    studentNav=document.createElement('div');studentNav.dataset.studentShell='';$('.bar').after(studentNav);const host=studentNav;studentNavModel=ui().storeModel({kind:'navigation',identity:user.username||'当前账号',adapter,canDownload:!isNative,returnTo:legacyContext().legacy?legacyContext().returnTo:'',downloading:false},{download:()=>downloadApk()});
    if(await ui().mount(host,'platform-navigation',studentNavModel,()=>version===generation&&host.isConnected)){if(version===generation){ui().navigationActive=true;$('.bar').style.display='none';updateShellNavigation();}}
  }
  async function downloadApk(button){
    if(button){button.disabled=true;button.textContent='正在准备下载…';}studentNavModel?.update({downloading:true});hint('');
    try{
      const response=await fetch(base+'/downloads/update.json',{cache:'no-store',credentials:'omit'});
      if(!response.ok)throw Error(response.status===404?'安装包尚未发布，请稍后再来。':response.status===503?'新版正在分发，请稍后重试下载。':'暂时无法查询版本，请重试下载。');
      const release=await response.json(),filename='growing-'+release.versionName+'.apk';
      if(release.schemaVersion!==1||release.packageName!=='com.qiangzi0303.growing'||!Number.isSafeInteger(release.versionCode)||typeof release.versionName!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(release.versionName)||release.apkUrl!==filename||!Number.isSafeInteger(release.sizeBytes)||release.sizeBytes<=0)throw Error('安装包信息不完整，请稍后重试。');
      const link=document.createElement('a');link.href=base+'/downloads/'+filename;link.download=filename;link.hidden=true;
      document.body.appendChild(link);link.click();link.remove();
      hint('已请求下载，完成后打开 APK 安装。若未开始，请重试下载。');
    }catch(error){hint('下载未开始：'+error.message);}
    finally{if(button){button.disabled=false;button.textContent='下载 APK';}studentNavModel?.update({downloading:false});}
  }
  const metaKey=id=>'growing-cloud-meta-v1:'+id;
  const sessionKey='growing-cloud-session-v1',bindingKey='growing-cloud-binding-v1';
  const needsRole=profile=>profile.role!=='Admin'&&(profile.roleSelectionRequired!==false||!['Student','Parent'].includes(profile.role));
  function checkNativeBinding(profile){
    const identity=isNative&&native.identityAccount?.();
    if(identity&&identity!==profile.id)throw Error('此本机账号已关联另一个云账号，请使用原云账号，或退出本机账号后切换。');
    const binding=isNative&&raw.getItem(bindingKey);
    if(binding&&binding!==profile.id&&profile.role==='Student')throw Error('此本机账号已关联另一个学生云账号，请使用对应账号。');
  }
  async function rememberNativeSession(profile){
    if(!isNative)return;
    if(native.confirmCloudSession){
      const saved=JSON.parse(native.confirmCloudSession(JSON.stringify({token,user:profile})));
      if(!saved.ok)throw Error(saved.error||'登录状态未保存，请重试。');
      return !saved.reload;
    }
    if(!needsRole(profile)){
      checkNativeBinding(profile);
      if(profile.role==='Student')raw.setItem(bindingKey,profile.id);
    }
    raw.setItem(sessionKey,JSON.stringify({token,user:profile}));
    if(!needsRole(profile)&&native.confirmIdentity){
      const saved=JSON.parse(native.confirmIdentity(JSON.stringify(profile)));
      if(!saved.ok)throw Error(saved.error||'身份未保存在本机，请重试。');
    }
  }
  function read(key,fallback){try{return JSON.parse(raw.getItem(key)||'null')??fallback;}catch{throw Error('本机同步配置无法读取，请先备份原记录。');}}
  async function api(path,options={}){
    const controller=new AbortController();let timeout;
    const abort=()=>controller.abort();if(options.signal?.aborted)abort();else options.signal?.addEventListener('abort',abort,{once:true});
    const deadline=new Promise((_,reject)=>{timeout=setTimeout(()=>{reject(Error('连接云服务超时，请检查网络后重试。'));controller.abort();},path==='/question-bank/import'||/^\/question-bank\/import-jobs\/[^/?]+\/step$/.test(path)||/^\/question-bank\/questions\/[^/]+\/(format|followup|correct|drawing|paper-ai)$/.test(path)?110000:12000);});
    try{return await Promise.race([deadline,(async()=>{
    const response=await fetch(base+'/api'+path,{...options,keepalive:!options.body||new TextEncoder().encode(options.body).length<60000,signal:controller.signal,credentials:isNative?'omit':'same-origin',headers:{'Content-Type':'application/json','X-Growing-Client':'1',...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});
    if(response.status===204)return null;
    const text=await response.text();let result;try{result=text?JSON.parse(text):null;}catch{throw Error('服务返回格式不正确，请检查站点地址。');}
    if(!response.ok){const error=Error(result?.error||(response.status===401?'云登录已失效，请重新登录。':response.status===403?'当前账号没有权限。':'请求未完成（'+response.status+'）'));error.status=response.status;error.current=result?.current;if(response.status===401&&user){generation++;clearInterval(timer);clearTimeout(saveTimer);user=null;token='';raw.removeItem(sessionKey);auth();hint(error.message);}throw error;}
    if(['POST','PUT'].includes(options.method)&&/^\/question-bank\/(import|attempts|import-jobs\/[a-f0-9-]{36}\/step|papers\/[a-f0-9-]{36}\/confirm|questions\/[a-f0-9-]{36}(?:\/(correct|format|paper-mark))?)$/.test(path)){
      const studentId=JSON.parse(options.body||'{}').studentId;
      window.dispatchEvent(new CustomEvent('growing:knowledge-changed',{detail:{studentId}}));
    }
    return result;
    })()]);}catch(error){if(error instanceof TypeError)throw Error('无法连接云服务，请检查网络后重试。');throw error;}
    finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',abort);}
  }
  const prefix=()=>user.role==='Admin'?'growing-admin-preview:'+user.id+':':isNative?'':'growing-user:'+user.id+':';
  const keys=()=>{const result=[];for(let i=0;i<raw.length;i++){const key=raw.key(i);if(key?.startsWith(prefix())){const name=key.slice(prefix().length);if(GrowingSync.allowed(name))result.push(name);}}return result;};
  const get=key=>raw.getItem(prefix()+key);
  function put(key,value){
    if(!restoring&&(cloudReady||get(key)===null)&&GrowingSync.allowed(key)){const meta=currentMeta();if(!meta[key]){meta[key]={value:null,revision:0};setMeta(meta);}}
    if(value===null)raw.removeItem(prefix()+key);else raw.setItem(prefix()+key,value);if(!restoring&&GrowingSync.allowed(key))queueSave();
  }
  function pull(key,value){
    const previous=get(key);
    if(GrowingSync.clean(key,previous)!==value)for(const record of courseStores.values())if(record.keys.has(key))record.stale=true;
    restoring=true;try{put(key,GrowingSync.restore(key,value,previous));}finally{restoring=false;}
  }
  function refreshCourses(){
    let changed=false;
    for(const [view,record] of courseStores){if(view.document!==record.document||!view.frameElement?.isConnected)courseStores.delete(view);else if(record.stale)changed=true;}
    const frame=$('#course');if(changed&&frame){const top=frame.contentWindow,y=top.scrollY;frame.addEventListener('load',()=>top.scrollTo(0,y),{once:true});top.location.reload();}
  }
  function storage(view){const id=user?.id,version=generation;if(!id)throw Error('请先登录学生账号');const record={document:view?.document,keys:new Set(),stale:false};if(view)courseStores.set(view,record);const requireSession=()=>{if(user?.id!==id||generation!==version)throw Error('学习会话已退出');};const write=(key,value)=>{requireSession();if(!record.stale||!GrowingSync.allowed(key))put(key,value);};const methods={
    getItem:key=>{requireSession();key=String(key);record.keys.add(key);return get(key);},setItem:(key,value)=>write(String(key),String(value)),
    removeItem:key=>write(String(key),null),clear:()=>{requireSession();for(const key of keys())write(key,null);},
    key:index=>{requireSession();return keys()[index]??null;}
  };return new Proxy({}, {get:(_,key)=>key==='length'?keys().length:methods[key]||(typeof key==='string'?methods.getItem(key):undefined),set:(_,key,value)=>{methods.setItem(key,value);return true;},ownKeys:()=>keys(),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});}
  function currentMeta(){return read(metaKey(user.id),{});}
  function setMeta(meta){raw.setItem(metaKey(user.id),JSON.stringify(meta));}
  async function sync(){
    if(!user||needsRole(user)||user.role!=='Student')return false;
    if(syncing){saveAgain=true;return false;}
    const version=generation,id=user.id;syncing=true;
    try{
      const rows=await api('/student/state');if(version!==generation)return;
      const remote=Object.fromEntries(rows.map(r=>[r.key,r])),local=Object.fromEntries(keys().map(k=>[k,GrowingSync.clean(k,get(k))])),meta=currentMeta();
      for(const action of GrowingSync.plan(local,remote,meta)){
        if(version!==generation)return;
        const {key,server}=action;
        if(action.type==='same'){meta[key]={value:server.value,revision:server.revision};continue;}
        if(action.type==='pull'){
          pull(key,server.value);meta[key]={value:server.value,revision:server.revision};continue;
        }
        try{
          const saved=await api('/student/state/'+encodeURIComponent(key),{method:'PUT',body:JSON.stringify({value:action.value,revision:server.revision})});
          if(version!==generation)return;
          meta[key]={value:saved.value,revision:saved.revision};
        }catch(e){
          if(e.status!==409)throw e;
          if(version!==generation)return;
          const current=e.current||{value:null,revision:0};
          pull(key,current.value);meta[key]={value:current.value,revision:current.revision};
        }
      }
      if(version!==generation||user.id!==id)return;setMeta({...currentMeta(),...meta});
      cloudReady=true;
      return cloudReady;
    }catch(e){if(version===generation)console.warn('Background save incomplete:',e.name);return false;}
    finally{syncing=false;if(version===generation){refreshCourses();if(saveAgain){saveAgain=false;clearTimeout(saveTimer);saveTimer=setTimeout(sync,400);}}}
  }
  let lastAction=0,lastTick=Date.now(),currentSubject='';
  function activity(url){lastAction=Date.now();currentSubject=/english|word-ops/.test(url)?'英语':/physics/.test(url)?'物理':/math-course|fraction-ops/.test(url)?'数学':'';}
  function tick(){
    const now=Date.now(),seconds=Math.min(15,Math.max(0,(now-lastTick)/1000));lastTick=now;
    if(!user||user.role!=='Student'||!$('#course')||questionBankPage||document.hidden||now-lastAction>60000||!currentSubject)return;
    let device=raw.getItem('growing-cloud-device:'+user.id);if(!device){device=crypto.randomUUID();raw.setItem('growing-cloud-device:'+user.id,device);}
    const key='growing-activity-v1:'+device,data=JSON.parse(get(key)||'{"days":{}}'),date=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
    data.days[date]??={};data.days[date][currentSubject]=(data.days[date][currentSubject]||0)+seconds;put(key,JSON.stringify(data));
  }
  const courseTrail=[];
  let photoVersion=0,questionBankPage=null;
  // Focused examples, experiment controls and draft ids update in place; they are not new pages.
  const routeKey=href=>{const url=new URL(href,location.href),identity=['subject','term','unit','chapter'];if(url.pathname.endsWith('knowledge.html'))identity.push('mode');for(const key of [...url.searchParams.keys()])if(!identity.includes(key))url.searchParams.delete(key);url.searchParams.sort();return url.pathname+url.search;};
  function rememberCourse(href,replace=false){
    const last=courseTrail.at(-1);
    if(last&&routeKey(last)===routeKey(href))courseTrail[courseTrail.length-1]=href;
    else if(replace&&last)courseTrail[courseTrail.length-1]=href;
    else courseTrail.push(href);
  }
  function courseDocument(){try{return $('#course')?.contentDocument;}catch{return null;}}
  function updateShellNavigation(){
    const doc=courseDocument(),href=doc?.location.href||'',home=!$('#course')||new URL(href||location.href).pathname==='/learn/app-design/index.html';
    $('#download-apk').hidden=isNative||!home||!!$('#question-bank-page')||!!$('#photo-bank-page')||!!$('#unit-reports-page')||$('#photo-dialog').open;studentNavModel?.update({canDownload:!$('#download-apk').hidden});
    $('#question-bank').hidden=!user||needsRole(user)||user.role==='Student'||!!$('#course');
    const own=doc?.defaultView.GrowingCourseAccount;
    const legacy=href.includes('/fraction-ops/')||href.includes('/word-ops-unit3/');
    document.querySelector('[data-account-view=settings]').hidden=!own&&!legacy&&!doc?.querySelector('[data-view=settings]');
    document.querySelector('[data-account-view=calendar]').hidden=!doc||!user||needsRole(user);
  }
  function photoUnit(href){
    const url=new URL(href||location.href,location.href);
    if(url.pathname.includes('/fraction-ops/'))return 'math-8b-10';
    if(url.pathname.includes('/word-ops-unit3/'))return 'english-8a-03';
    return url.searchParams.get('chapter')||url.searchParams.get('unit')||'';
  }
  function courseReady(href){
    rememberCourse(href);updateShellNavigation();
    window.dispatchEvent(new CustomEvent('growing:course-ready',{detail:{href}}));
    const unit=photoUnit(href);
    if(unit&&user?.role==='Student')try{raw.setItem('growing-photo-unit-v1:'+user.id,unit);}catch{}
  }
  function mountDuck(){
    if(document.getElementById('global-course-duck'))return;
    const script=document.createElement('script');script.id='global-course-duck';
    script.src=isNative?'../app-design/course-duck.js':'/learn/app-design/course-duck.js';
    script.addEventListener('error',()=>script.remove(),{once:true});document.head.append(script);
  }
  function courseBack(){
    if($('#photo-dialog').open){if(paperCanLeave($('#photo-content')))$('#photo-dialog').close();return;}
    if(backFromQuestionBank())return;
    const frame=$('#course'),doc=courseDocument();if(!frame)return;
    if(doc?.defaultView.GrowingCourseAccount?.back())return;
    if(courseTrail.length>1){courseTrail.pop();frame.contentWindow.location.replace(courseTrail.at(-1));return;}
    const url=new URL(doc?.location.href||frame.src);
    if(url.pathname!=='/learn/app-design/index.html'){
      const link=doc?.querySelector('[data-growing-back]'),fallback=link?.dataset.backFallback||link?.href;
      window.GrowingCloud.navigate(fallback&&new URL(fallback).pathname!==url.pathname?fallback:'/learn/app-design/index.html',true);return;
    }
    // The subject chooser is the learning home; backing out must not recreate a welcome page.
    return;
  }
  function restoreQuestionBankPage(){
    const page=questionBankPage;if(!page)return;
    if(!paperCanLeave(page.root)){const url=new URL(page.from);url.hash='question-bank';history.pushState({questionBankFrom:page.from},'',url);return;}
    tick();questionBankPage=null;page.root.remove();
    if(page.version!==generation)return;
    page.previous.forEach(([node,hidden])=>{if(node.isConnected)node.hidden=hidden;});
    updateShellNavigation();window.scrollTo(0,page.scrollY);page.focus?.focus({preventScroll:true});
  }
  function backFromQuestionBank(){
    if(!questionBankPage)return false;
    if(!paperCanLeave(questionBankPage.root))return true;
    if(history.state?.questionBankFrom)history.back();
    else{history.replaceState(null,'',questionBankPage.from);restoreQuestionBankPage();}
    return true;
  }
  async function openQuestionBank(push=true){
    if(!user||needsRole(user))return;
    if(questionBankPage||$('#question-bank-page.question-bank-minimal'))return;
    if(!papersCanLeave())return;tick();$('#account-menu').open=false;if($('#photo-dialog').open)$('#photo-dialog').close();
    const unitId=(!push&&new URLSearchParams(location.search).get('unit'))||courseDocument()?.defaultView.GrowingCourseNavigation?.unit||photoUnit(courseDocument()?.location.href);
    const app=$('#app'),root=document.createElement('div'),version=generation;
    root.id='photo-bank-page';
    const page={root,version,previous:[...app.children].map(node=>[node,node.hidden]),scrollY:window.scrollY,focus:document.activeElement,
      from:push?location.href:history.state?.questionBankFrom||location.pathname+location.search};
    questionBankPage=page;page.previous.forEach(([node])=>{node.hidden=true;});app.append(root);
    if(push){const url=new URL(location.href);url.hash='question-bank';if(unitId)url.searchParams.set('unit',unitId);history.pushState({questionBankFrom:page.from},'',url);}
    updateShellNavigation();window.scrollTo(0,0);
    const alive=()=>questionBankPage===page&&generation===version&&root.isConnected;
    try{await GrowingQuestionBank.mount(root,api,esc,alive,user,{unitId});
      if(alive()){const back=root.querySelector('#question-bank-home');if(back)back.textContent='← 返回上一级';const title=root.querySelector('h1');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}}
    }catch(error){if(alive())root.innerHTML='<button id="question-bank-home">← 返回上一级</button><p role="status">'+esc(error.message)+'</p>';}
  }
  async function openPapers(context={}){
    if(!user||needsRole(user))throw Error('请先登录云账号并确认身份，再打开我的试卷。');
    const dialog=$('#photo-dialog');if(dialog.open)return;
    if(!papersCanLeave())return;
    $('#account-menu').open=false;const current=++photoVersion,version=generation;
    dialog.showModal();dialog.setAttribute('aria-label','我的试卷');updateShellNavigation();
    try{await GrowingPapers.mount($('#photo-content'),api,esc,()=>dialog.open&&current===photoVersion&&generation===version,user,context);}
    catch(error){if(dialog.open&&current===photoVersion)$('#photo-content').innerHTML='<button id="question-bank-home">← 返回上一级</button><p role="status">'+esc(error.message)+'</p>';}
  }
  function accountView(view){
    const doc=courseDocument();$('#account-menu').open=false;if(!doc)return;
    if(doc.defaultView.GrowingCourseAccount)doc.defaultView.GrowingCourseAccount.open(view);
    else if(view==='calendar'){
      const open=()=>doc.defaultView.GrowingLearningCalendar.open($('#account-menu>summary'));
      if(doc.defaultView.GrowingLearningCalendar)open();
      else if(!doc.querySelector('script[data-learning-calendar]')){
        const script=doc.createElement('script');script.dataset.learningCalendar='';script.src='/learn/app-design/learning-calendar.js';script.onload=open;script.onerror=()=>{script.remove();hint('日历加载失败，请重试。');};doc.head.append(script);
      }
    }
    else{const legacy=doc.location.pathname.includes('/fraction-ops/'),action=view==='settings'?'settings':legacy?'progress':'study';const target=doc.querySelector('[data-action="'+action+'"]')||doc.querySelector('[data-view="'+view+'"]');target?.click();}
  }
  $('#photo-dialog').addEventListener('close',()=>{photoVersion++;$('#photo-content').replaceChildren();updateShellNavigation();});
  $('#photo-dialog').addEventListener('cancel',event=>{if(!paperCanLeave($('#photo-content')))event.preventDefault();});
  document.addEventListener('click',event=>{if(!event.target.closest('#account-menu'))$('#account-menu').open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#account-menu').open){$('#account-menu').open=false;$('#account-menu>summary').focus();}});
  window.GrowingCloud={storage,activity,back:courseBack,pageReady:courseReady,openQuestionBank,openPapers,
  paperReviewContext(){
    if(!user||needsRole(user))throw Error('请先登录并选择身份。');
    const id=user.id,version=generation;
    return {user:{id,role:user.role},api:async(path,options)=>{
      if(user?.id!==id||generation!==version)throw Error('账号已切换，请重新打开试卷。');
      if(!path.startsWith('/question-bank/')&&path!=='/parent/children'&&!path.startsWith('/admin/members?'))throw Error('试卷接口无效。');
      const result=await api(path,options);
      if(user?.id!==id||generation!==version)throw Error('账号已切换，请重新打开试卷。');
      return result;
    }};
  },
  async studentKnowledge(unit='',query='',topic=''){
    if(!user||user.role!=='Student'||needsRole(user))throw Error('请使用学生账号进入学习中心。');
    const id=user.id,version=generation;
    sync();
    const result=await api('/student/knowledge?'+new URLSearchParams({unit,q:query.slice(0,150),topic:topic.slice(0,150)}));
    if(user?.id!==id||generation!==version||result.student.id!==id)throw Error('学生账号已切换，请重新进入课堂。');
    return result;
  },
  async saveKnowledgeNote(unitId,text){
    if(!user||user.role!=='Student'||needsRole(user))throw Error('请使用学生账号保存学习总结。');
    const id=user.id,version=generation;
    const result=await api('/student/knowledge/notes',{method:'POST',body:JSON.stringify({unitId,text})});
    if(user?.id!==id||generation!==version)throw Error('学生账号已切换，请重新打开档案。');
    return result;
  },navigate(href,replace=false){
    const frame=$('#course'),url=new URL(href,location.href);
    if(!frame||url.origin!==location.origin||!url.pathname.startsWith('/learn/'))throw Error('课堂跳转地址无效。');
    if(!replace&&courseDocument()?.location.href)rememberCourse(courseDocument().location.href);
    rememberCourse(url.href,replace);
    frame.contentWindow.location[replace?'replace':'assign'](url.href);
  },questionAttempts(){
    if(!user||user.role!=='Student'||needsRole(user))return null;
    const id=user.id,version=generation;
    return {studentId:id,api:(path,options)=>{if(user?.id!==id||generation!==version)throw Error('学习会话已切换，请重新打开错题。');return api(path,options);}};
  }};
  function questionBankRoute(){
    if(!user||needsRole(user))return;
    if(location.hash==='#question-bank'){if(!questionBankPage&&!$('#question-bank-page.question-bank-minimal'))openQuestionBank(false).catch(error=>hint(error.message));}
    else if(questionBankPage)restoreQuestionBankPage();
    else if($('#question-bank-page.question-bank-minimal'))enter(user).catch(error=>hint(error.message));
  }
  window.addEventListener('popstate',questionBankRoute);
  window.addEventListener('hashchange',()=>{if(!isNative&&!user){authMode=location.hash==='#register'?'register':'login';auth();return;}questionBankRoute();if(location.hash==='#my-papers'&&user&&!needsRole(user))enter(user,'my-papers').catch(error=>hint(error.message));});
  function hideRankings(){const root=$('#student-rankings');if(root)ui()?.dispose(root);const heading=$('.ranking-dialog-heading');if(heading)heading.style.display='';$('#my-rankings').hidden=true;$('#rankings-dialog').close();$('#rankings-content').replaceChildren();}
  function auth(){authAttempt++;disposeMain();removeStudentNav();document.body.classList.remove('admin-console');clearInterval(timer);hideRankings();courseTrail.length=0;$('#console-return').hidden=true;$('#account-menu').hidden=true;$('#account-menu').open=false;$('#photo-dialog').close();$('#download-apk').hidden=isNative;$('#question-bank').hidden=true;$('#logout').hidden=true;$('#settings').hidden=true;$('#learning-reports').hidden=true;$('#admin-navigation').hidden=true;$('#identity').textContent='PC · 手机网页 · Android';
    questionBankPage=null;window.GrowingDuckCourse?.reset();
    if(isNative&&!base){$('#app').innerHTML='<section class="panel"><h1>服务尚未配置</h1><p>请配置服务端 HTTPS 地址后登录账号。</p></section>';return;}
    $('#app').innerHTML=`<section class="panel auth"><p class="muted">逆流 · 学习与陪伴</p><h1>${authMode==='login'?'欢迎回来':'创建云账号'}</h1><p>学生继续学习，家长看见进步。</p><form id="auth"><label>用户名<input name="username" autocomplete="username" minlength="2" maxlength="24" required></label><label>密码<input name="password" type="password" autocomplete="${authMode==='login'?'current-password':'new-password'}" minlength="8" maxlength="128" required></label>${authMode==='register'?'<label>称呼<input name="displayName" maxlength="40" required></label><label>身份<select name="role" required><option value="" selected disabled>请选择身份</option><option value="Student">我是学生</option><option value="Parent">我是家长</option></select></label>':''}${isNative&&authMode==='register'?'<label><input name="consent" type="checkbox" style="display:inline;width:auto" required> 同意登录云账号；学生身份将关联本机学习记录（AI 密钥不上传）</label>':''}<button class="primary" type="submit">${authMode==='login'?'登录':'注册并登录'}</button></form><p><button id="switch-auth">${authMode==='login'?'还没有云账号？注册':'已有云账号？登录'}</button></p><p class="muted">使用云账号和密码登录。本机记录和 AI 密钥保留，切换账号后学习记录分别保存。</p></section>`;
    if(ui()){const controller=ui().auth({mode:authMode,native:isNative,submit:authenticate,switchMode:()=>{authMode=authMode==='login'?'register':'login';auth();}});ui().mount($('#app'),'platform-auth',controller,()=>!user);}
  }
  async function enter(profile,view){
    if(user?.id===profile.id&&!papersCanLeave())return;
    authAttempt++;disposeMain();removeStudentNav();
    if(user?.id!==profile.id){cloudReady=false;courseStores.clear();}
    const context=legacyContext(),destination=window.GrowingLegacy.destination(profile,isNative,context);
    if(destination){location.replace(destination);return;}
    view=view||(context.action==='classroom'?'student':context.action==='settings'||context.action==='voice-settings'?'settings':context.action||'management');
    management?.dispose();clearInterval(timer);clearTimeout(saveTimer);cloudReady=false;hideRankings();courseTrail.length=0;$('#photo-dialog').close();user=null;generation++;const version=generation;if(await rememberNativeSession(profile)===false||version!==generation)return;user=profile;$('#account-menu').hidden=false;$('#account-menu').open=false;$('#account-identity').textContent=user.username||'当前账号';$('#logout').hidden=false;$('#learning-reports').hidden=true;$('#question-bank').hidden=needsRole(user)||user.role==='Student';hint('');
    const back=$('#console-return');back.hidden=isNative||!context.legacy||!!context.error;back.href=context.returnTo||'/console/home';
    questionBankPage=null;document.body.classList.toggle('admin-console',user.role==='Admin'&&view==='management');
    window.GrowingDuckCourse?.reset();
    if(['Student','Admin'].includes(user.role)&&!needsRole(user))mountDuck();
    if(needsRole(user)){
      $('#settings').hidden=true;$('#admin-navigation').hidden=true;$('#identity').textContent=user.displayName+' · 待确认身份';
      $('#app').innerHTML='<section class="panel auth"><h1>请选择你的身份</h1><p>继续使用前，请确认你是学生还是家长。确认后，下次登录无需重复选择。</p><form id="choose-role"><label>身份<select name="role" required><option value="" selected disabled>请选择身份</option><option value="Student">我是学生</option><option value="Parent">我是家长</option></select></label><button type="submit" class="primary">保存身份并继续</button></form></section>';if(ui()){const c=ui().auth({submit:confirmRole});c.update({kind:'role'});ui().mount($('#app'),'platform-auth',c,()=>user===profile&&needsRole(user));}return;
    }
    if(context.error){$('#app').innerHTML='<section class="panel"><h1>无法打开兼容入口</h1><p>'+esc(context.error)+'</p><a href="/console/home">返回后台</a></section>';return;}
    if(context.action==='classroom'&&user.role==='Parent'){hint('当前账号没有课堂试用权限。');$('#app').textContent='家长请从后台查看孩子概况。';return;}
    management=GrowingManagement.create(api,esc,()=>generation===version,()=>{management?.dispose();generation++;clearInterval(timer);user=null;token='';raw.removeItem(sessionKey);auth();hint('密码已修改，请使用新密码重新登录。');});$('#settings').hidden=!['Parent','Admin'].includes(user.role);$('#admin-navigation').hidden=user.role!=='Admin';$('#identity').textContent=user.displayName+' · '+({Parent:'家长',Student:'学生',Admin:'管理员'}[user.role]);
    $('#my-rankings').hidden=user.role!=='Student';
    $('#learning-reports').hidden=!['Parent','Admin'].includes(user.role);
    $('#learning-reports').setAttribute('aria-pressed',String(view==='reports'));
    history.replaceState(null,'',location.pathname+location.search+(view==='my-papers'?'#my-papers':view==='question-bank'?'#question-bank':view==='reports'&&user.role!=='Student'?'#learning-reports':''));
    document.querySelectorAll('[data-admin-view]').forEach(button=>{const active=button.dataset.adminView===view;button.classList.toggle('primary',active);button.setAttribute('aria-pressed',String(active));});
    if(view==='my-papers'){
      $('#app').innerHTML='<div id="question-bank-page"></div>';
      await GrowingPapers.mount($('#question-bank-page'),api,esc,()=>generation===version,user,context);
    }else if(view==='question-bank'){
      $('#app').innerHTML='<div id="question-bank-page"></div>';
      await GrowingQuestionBank.mount($('#question-bank-page'),api,esc,()=>generation===version,user,context);
    }else if(view==='reports'&&['Admin','Parent'].includes(user.role)){
      $('#app').innerHTML='<div class="actions"><button id="parent-home">‹ 返回看板</button></div><div id="unit-reports-page"></div>';
      await GrowingUnitReports.mount($('#unit-reports-page'),api,esc,()=>generation===version,user.role==='Admin');
    }else if(context.legacy&&['settings','voice-settings'].includes(context.action)){
      $('#app').innerHTML='<section class="panel"><h1>本机连接设置</h1><p>设置只保存在当前账号的本机空间，密钥不上传。</p><button id="legacy-open-settings">重新打开连接设置</button></section>';
      await Promise.resolve();if(version===generation)window.GrowingApiSettings.open(context.action==='voice-settings'?'voice':'deepseek');
    }else if(user.role==='Student'){await student();}else if(user.role==='Admin'){
      if(view==='student')await student();else if(view==='parent')await parent();else if(view==='settings')parentSettings();else await management.admin($('#app'));
    }else if(view==='settings')parentSettings();else await parent();
    if(version===generation){await showStudentNav();updateShellNavigation();if(user?.role==='Student'){timer=setInterval(sync,15000);if(requestedRankings){requestedRankings=false;showRankings();}}}
  }
  async function adminView(view){
    if(user?.role!=='Admin')return;
    const version=generation,profile=await api('/auth/me');if(version!==generation)return;
    await enter(profile,profile.role==='Admin'?view:'management');
  }
  async function reportsView(){
    if(!['Admin','Parent'].includes(user?.role))return;
    const version=generation,profile=await api('/auth/me');if(version!==generation)return;
    await enter(profile,'reports');
  }
  async function student(){
    openCourse();
    if(!isNative&&user.role==='Student')sync(); // Native lessons keep their own background agent alive across navigation.
  }
  function openCourse(){
    if(isNative){if(native.openLearning){const result=JSON.parse(native.openLearning());if(!result.ok)throw Error(result.error);}else location.href='../app-design/index.html';return;}
    courseTrail.length=0;
    $('#app').innerHTML='<iframe id="course" title="学生课堂" src="/learn/app-design/index.html"></iframe>';
    $('#course').addEventListener('load',()=>{const href=courseDocument()?.location.href;if(href)courseReady(href);});
  }
  async function showRankings(){
    if(user?.role!=='Student'||needsRole(user))return;
    $('#account-menu').open=false;
    const dialog=$('#rankings-dialog'),version=generation,rankingRoot=document.createElement('section');
    rankingRoot.id='student-rankings';$('#rankings-content').replaceChildren(rankingRoot);dialog.showModal();
    const active=()=>version===generation&&dialog.open;
    if(ui()){const c=ui().rankings({api,active,beforeRefresh:sync,close:()=>dialog.close()});if(await ui().mount(rankingRoot,'platform-rankings',c,active)){if(active()){$('.ranking-dialog-heading').style.display='none';await c.actions.refresh();}return;}}
    await GrowingRankings.mount(rankingRoot,api,esc,active,'/student/rankings','我的排行榜',sync);
  }
  $('#rankings-dialog').addEventListener('close',()=>{const root=$('#student-rankings');if(root)ui()?.dispose(root);});
  async function parent(query='',page=1){
    const version=generation,request=++parentRequest,isAdmin=user.role==='Admin';
    $('#app').innerHTML=`<h1>陪伴，从看见开始</h1><p class="muted">${isAdmin?'管理员可查看全站学生的家长看板，无需绑定或切换账号。':'查看孩子的学习记录，可添加多个孩子。'}</p><section class="panel"><h2>${isAdmin?'全站学生':'我的孩子'}</h2>${isAdmin?`<form id="student-search" class="actions filters"><label>用户名或称呼<input name="q" maxlength="40" value="${esc(query)}" placeholder="搜索学生"></label><button type="submit" class="primary">查询</button></form>`:'<button id="add-child">添加孩子</button>'}<div id="children" class="actions"></div><div id="child-pages" class="actions pagination"></div></section><section id="report"></section>`;
    const data=await api(isAdmin?'/admin/members?'+new URLSearchParams({q:query,role:'Student',page}):'/parent/children');
    if(version!==generation||request!==parentRequest||!$('#children'))return;
    const rows=isAdmin?data.rows:data;
    $('#children').innerHTML=rows.length?rows.map(c=>`<button data-child="${esc(c.id)}">${esc(c.displayName)}${isAdmin?'（'+esc(c.username)+'）':''} · 查看学习情况</button>`).join(''):isAdmin?'<p>暂无符合条件的学生。</p>':'<p>暂未添加孩子，点击「添加孩子」即可开始。</p>';
    if(isAdmin)$('#child-pages').innerHTML=`<button data-child-page="${page-1}" ${page<=1?'disabled':''}>上一页</button><span>第 ${page} 页 · 共 ${data.total} 位学生</span><button data-child-page="${page+1}" ${page*data.pageSize>=data.total?'disabled':''}>下一页</button>`;
    if(rows.length)await report(rows[0].id);
  }
  function parentSettings(){
    if(!['Parent','Admin'].includes(user?.role))return;
    hint('');$('#app').innerHTML='<div class="actions"><button id="parent-home">‹ 返回我的孩子</button></div><h1>设置</h1><section class="panel"><h2>添加孩子</h2><p class="muted">填写孩子的学生账号和密码完成验证，可以依次添加多个孩子。密码仅用于本次验证，不会保存。</p><form id="bind"><label>孩子的学生账号<input name="studentUsername" minlength="2" maxlength="24" autocomplete="off" required></label><label>孩子的账号密码<input name="studentPassword" type="password" minlength="8" maxlength="128" autocomplete="off" required></label><button type="submit" class="primary">验证并添加孩子</button></form></section>';
  }
  async function report(id){const area=$('#report');if(area)await management.student(area,id,user.role==='Admin');}
  document.addEventListener('submit',async event=>{if(!['auth','choose-role','bind','student-search'].includes(event.target.id))return;event.preventDefault();const button=event.target.querySelector('button[type=submit]');button.disabled=true;
    try{const values=Object.fromEntries(new FormData(event.target));if(event.target.id==='auth'){
      await authenticate(values);
    }else if(event.target.id==='choose-role'){
      await confirmRole(values);
    }else if(event.target.id==='student-search'){if(user?.role==='Admin')await parent(String(values.q).trim());}
    else{const version=generation;event.target.elements.studentPassword.value='';await api('/parent/children/account',{method:'POST',body:JSON.stringify(values)});if(version!==generation)return;await parent();if(version===generation)hint('孩子已添加，可以继续添加其他孩子。');}}catch(e){hint(e.message);}finally{button.disabled=false;}
  });
  document.addEventListener('click',async event=>{const b=event.target.closest('button');if(!b)return;try{
    if(b.id==='my-rankings')await showRankings();
    if(b.id==='legacy-open-settings')window.GrowingApiSettings.open(legacyContext().action==='voice-settings'?'voice':'deepseek');
    if(b.id==='close-rankings')$('#rankings-dialog').close();
    if(b.id==='startup-login'){startupAttempt++;token='';auth();hint('本机记录保留，请重新登录云账号。');}
    if(b.id==='download-apk'&&!isNative)await downloadApk(b);
    if(b.dataset.accountView)accountView(b.dataset.accountView);
    if(b.id==='switch-auth'){authMode=authMode==='login'?'register':'login';auth();}
    if(b.dataset.adminView)await adminView(b.dataset.adminView);
    if(b.id==='learning-reports')await reportsView();
    if(b.id==='question-bank'&&user&&!needsRole(user))await openQuestionBank();
    if(b.id==='question-bank-home'&&user){if(!papersCanLeave())return;if(consoleBack())return;const back=new URLSearchParams(location.search).get('return');if(isNative&&back){const url=new URL(back,location.href);if(url.origin===location.origin&&url.pathname.startsWith('/assets/web/')&&!url.pathname.includes('/cloud/')){location.href=url.href;return;}}if($('#photo-dialog').open)$('#photo-dialog').close();else if(!backFromQuestionBank()){if(location.hash==='#question-bank'&&history.state?.questionBankFrom)history.back();else await enter(user,'management');}}
    if(b.id==='settings'){if(user?.role==='Admin')await adminView('settings');else if(user?.role==='Parent')await enter(user,'settings');}
    if(b.id==='add-child')parentSettings();
    if(b.id==='parent-home'){if(user?.role==='Admin')await adminView('parent');else if(user?.role==='Parent')await enter(user,'management');}
    if(b.dataset.childPage&&user?.role==='Admin')await parent($('#student-search [name=q]').value,Number(b.dataset.childPage));
    if(b.id==='logout')await logout();
    if(b.dataset.child)await report(b.dataset.child);
    if(b.id==='close-course')courseBack();
  }catch(e){hint(e.message);}});
  setInterval(()=>{try{tick();}catch(e){console.warn('Activity save incomplete:',e.name);}},10000);
  window.addEventListener('online',sync);
  window.addEventListener('beforeunload',event=>{if(!papersCanLeave()){event.preventDefault();event.returnValue='';}});
  window.addEventListener('growing-storage-change',event=>{if(!restoring&&(event.detail?.key===null||GrowingSync.allowed(event.detail?.key||'')))queueSave();});
  window.addEventListener('pagehide',()=>{tick();sync();$('#photo-dialog').close();$('#rankings-dialog').close();});
  window.addEventListener('pageshow',event=>{if(!event.persisted)return;const restore=async()=>{if(!user){await restoreSession();return;}const previous=user,profile=await api('/auth/me');if(user?.id!==previous.id)return;if(profile.id!==previous.id||profile.role!==previous.role||needsRole(profile)){await enter(profile);return;}user=profile;if($('#course')){await showStudentNav();updateShellNavigation();}else await enter(profile);};restore().catch(error=>{hint(error.message);if(user?.role==='Student')showStudentNav().catch(e=>hint(e.message));});});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){tick();sync();}});
  let startupAttempt=0;
  async function restoreSession(){
    const attempt=++startupAttempt;
    $('#app').innerHTML='<section class="panel auth"><p role="status">正在打开…</p><button id="startup-login">账号登录</button></section>';
    hint('');
    try{const profile=await api('/auth/me');if(attempt!==startupAttempt)return;await enter(profile);}
    catch(e){if(attempt!==startupAttempt)return;
      if(e.status===401){token='';raw.removeItem(sessionKey);auth();hint('请登录云账号并确认身份。');return;}
      auth();hint(e.message);
    }
  }
  (async()=>{try{if(isNative){if(!base){auth();return;}
    // The native form already collected an explicit role and cloud-registration consent.
    // Transfer credentials once in memory; never persist the plaintext password.
    const pending=native.takeRegistration?.();
    if(pending){const values=JSON.parse(pending);authMode='register';await authenticate({...values,consent:true});return;}
    const session=read(sessionKey,null);token=session?.token||'';
    if(!token){auth();return;}
    if(session.user?.role==='Student'&&!needsRole(session.user)&&native.identityAccount?.()===session.user.id&&raw.getItem(bindingKey)===session.user.id){await enter(session.user);return;}
  }await restoreSession();}catch(e){auth();if(e.status!==401)hint(e.message);}})();
})();
