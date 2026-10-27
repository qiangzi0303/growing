(()=>{
  'use strict';
  const $=s=>document.querySelector(s),native=window.GrowingNative,raw=window.localStorage;
  const base=native?String(native.cloudApiUrl?.()||'').replace(/\/$/,''):'';
  const isNative=!!native,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let user=null,token='',authMode='login',generation=0,syncing=false,timer,conflicts=[],management,parentRequest=0;
  let saveTimer,saveAgain=false,cloudReady=false,restoring=false;
  function queueSave(){
    if(user?.role!=='Student')return;
    const label=$('#sync-status');if(label)label.textContent='正在保存到云端…';
    clearTimeout(saveTimer);saveTimer=setTimeout(sync,400);
    if(syncing)saveAgain=true;
  }
  const hint=text=>{$('#message').textContent=text;};
  async function downloadApk(button){
    button.disabled=true;button.textContent='正在准备下载…';hint('');
    try{
      const response=await fetch(base+'/downloads/update.json',{cache:'no-store',credentials:'omit'});
      if(!response.ok)throw Error(response.status===404?'安装包尚未发布，请稍后再来。':response.status===503?'新版正在分发，请稍后重试下载。':'暂时无法查询版本，请重试下载。');
      const release=await response.json(),filename='growing-'+release.versionName+'.apk';
      if(release.schemaVersion!==1||release.packageName!=='com.qiangzi0303.growing'||!Number.isSafeInteger(release.versionCode)||typeof release.versionName!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(release.versionName)||release.apkUrl!==filename||!Number.isSafeInteger(release.sizeBytes)||release.sizeBytes<=0)throw Error('安装包信息不完整，请稍后重试。');
      const link=document.createElement('a');link.href=base+'/downloads/'+filename;link.download=filename;link.hidden=true;
      document.body.appendChild(link);link.click();link.remove();
      hint('已请求下载，完成后打开 APK 安装。若未开始，请重试下载。');
    }catch(error){hint('下载未开始：'+error.message);}
    finally{button.disabled=false;button.textContent='下载 APK';}
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
    if(!needsRole(profile)){
      try{checkNativeBinding(profile);}catch(error){await api('/auth/logout',{method:'POST'});token='';raw.removeItem(sessionKey);throw error;}
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
    const deadline=new Promise((_,reject)=>{timeout=setTimeout(()=>{reject(Error('连接云服务超时，请检查网络后重试。'));controller.abort();},path==='/question-bank/import'||/^\/question-bank\/questions\/[^/]+\/format$/.test(path)?110000:12000);});
    try{return await Promise.race([deadline,(async()=>{
    const response=await fetch(base+'/api'+path,{...options,keepalive:!options.body||new TextEncoder().encode(options.body).length<60000,signal:controller.signal,credentials:isNative?'omit':'same-origin',headers:{'Content-Type':'application/json','X-Growing-Client':'1',...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});
    if(response.status===204)return null;
    const text=await response.text();let result;try{result=text?JSON.parse(text):null;}catch{throw Error('服务返回格式不正确，请检查站点地址。');}
    if(!response.ok){const error=Error(result?.error||(response.status===401?'云登录已失效，请重新登录。':response.status===403?'当前账号没有权限。':'请求未完成（'+response.status+'）'));error.status=response.status;throw error;}
    return result;
    })()]);}catch(error){if(error instanceof TypeError)throw Error('无法连接云服务，请检查网络后重试。');throw error;}
    finally{clearTimeout(timeout);}
  }
  const prefix=()=>user.role==='Admin'?'growing-admin-preview:'+user.id+':':isNative?'':'growing-user:'+user.id+':';
  const keys=()=>{const result=[];for(let i=0;i<raw.length;i++){const key=raw.key(i);if(key?.startsWith(prefix())){const name=key.slice(prefix().length);if(GrowingSync.allowed(name))result.push(name);}}return result;};
  const get=key=>raw.getItem(prefix()+key);
  function put(key,value){if(value===null)raw.removeItem(prefix()+key);else raw.setItem(prefix()+key,value);if(!restoring&&GrowingSync.allowed(key))queueSave();}
  function pull(key,value){restoring=true;try{put(key,GrowingSync.restore(key,value,get(key)));}finally{restoring=false;}}
  function storage(){const id=user?.id;if(!id)throw Error('请先登录学生账号');const requireSession=()=>{if(user?.id!==id)throw Error('学习会话已退出');};const methods={
    getItem:key=>{requireSession();return get(String(key));},setItem:(key,value)=>{requireSession();put(String(key),String(value));},
    removeItem:key=>{requireSession();put(String(key),null);},clear:()=>{requireSession();for(const key of keys())put(key,null);},
    key:index=>{requireSession();return keys()[index]??null;}
  };return new Proxy({}, {get:(_,key)=>key==='length'?keys().length:methods[key]||(typeof key==='string'?methods.getItem(key):undefined),set:(_,key,value)=>{methods.setItem(key,value);return true;},ownKeys:()=>keys(),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});}
  function currentMeta(){return read(metaKey(user.id),{});}
  function setMeta(meta){raw.setItem(metaKey(user.id),JSON.stringify(meta));}
  function legacyKeys(){
    if(isNative||user?.role!=='Student')return [];
    const owner=raw.getItem('growing-legacy-owner-v1');if(owner&&owner!==user.id)return [];
    const result=[];for(let i=0;i<raw.length;i++){const key=raw.key(i);if(GrowingSync.allowed(key||''))result.push(key);}
    return result;
  }
  async function migrateLegacy(){
    if(syncing)throw Error('正在核对云端记录，请稍后再迁移。');
    const names=legacyKeys();if(!names.length)return;
    const values=names.map(key=>({key,value:GrowingSync.clean(key,raw.getItem(key))}));
    const meta=currentMeta(),backup=Object.fromEntries(values.map(({key,value})=>[key,{legacy:value,previous:get(key)}]));
    raw.setItem('growing-cloud-backup:'+user.id+':legacy:'+Date.now(),JSON.stringify(backup));
    raw.setItem('growing-legacy-owner-v1',user.id);
    cloudReady=false;const entry=$('#start-course');if(entry)entry.disabled=true;
    for(const {key,value} of values){delete meta[key];put(key,GrowingSync.restore(key,value,raw.getItem(key)));}
    // An unknown baseline forces an explicit choice if this student already has cloud data.
    setMeta(meta);await sync();
    const panel=$('#legacy-migration');if(panel)panel.remove();
    hint('旧记录已载入。原记录和备份保留；如有版本差异，请选择后继续。');
  }
  async function sync(){
    if(!user||needsRole(user)||user.role!=='Student')return false;
    if(syncing){saveAgain=true;return false;}
    const version=generation,id=user.id;syncing=true;
    try{
      const rows=await api('/student/state');if(version!==generation)return;
      const remote=Object.fromEntries(rows.map(r=>[r.key,r])),local=Object.fromEntries(keys().map(k=>[k,GrowingSync.clean(k,get(k))])),meta=currentMeta();
      conflicts=[];
      for(const action of GrowingSync.plan(local,remote,meta)){
        if(version!==generation)return;
        const {key,server}=action;
        if(action.type==='conflict'){conflicts.push(action);continue;}
        if(action.type==='same'){meta[key]={value:server.value,revision:server.revision};continue;}
        if(action.type==='pull'){
          if($('#course')){conflicts.push({...action,type:'conflict',value:get(key)});continue;}
          // A network response must not replace an edit made while it was in flight.
          if(GrowingSync.clean(key,get(key))!==(local[key]??null)){saveAgain=true;continue;}
          pull(key,server.value);meta[key]={value:server.value,revision:server.revision};continue;
        }
        try{
          const saved=await api('/student/state/'+encodeURIComponent(key),{method:'PUT',body:JSON.stringify({value:action.value,revision:server.revision})});
          if(version!==generation)return;
          meta[key]={value:saved.value,revision:saved.revision};
        }catch(e){if(e.status===409)conflicts.push(action);else throw e;}
      }
      if(version!==generation||user.id!==id)return;setMeta(meta);
      cloudReady=!conflicts.length;
      const label=$('#sync-status');if(label)label.textContent=conflicts.length?'有 '+conflicts.length+' 份记录需选择版本，请先返回学习中心处理。':saveAgain?'正在保存新记录…':'已保存到云端 · '+new Date().toLocaleTimeString();
      const entry=$('#start-course');if(entry)entry.disabled=!cloudReady;
      showConflicts();
      return cloudReady;
    }catch(e){if(version===generation){const label=$('#sync-status');if(label)label.textContent='尚未保存到云端，缓存已保留：'+e.message;}return false;}
    finally{syncing=false;if(saveAgain&&version===generation){saveAgain=false;clearTimeout(saveTimer);saveTimer=setTimeout(sync,400);}}
  }
  function showConflicts(){const area=$('#conflicts');if(!area)return;area.innerHTML=conflicts.map((c,i)=>`<div class="conflict"><strong>记录版本不同</strong><p><code>${esc(c.key)}</code></p><p class="muted">将先在本机备份两个版本。选择后重新打开课程，避免已打开页面覆盖记录。</p><div class="actions"><button data-resolve="${i}" data-choice="local">保留本机版本</button><button data-resolve="${i}" data-choice="cloud">使用云端版本</button></div></div>`).join('');}
  async function resolve(index,choice){
    const c=conflicts[index];if(!c||$('#course'))throw Error('请先关闭课程再选择记录版本。');
    const id=user.id,version=generation;
    const fresh=(await api('/student/state')).find(r=>r.key===c.key)||{value:null,revision:0};
    if(version!==generation)return;
    raw.setItem('growing-cloud-backup:'+id+':'+Date.now()+':'+c.key,JSON.stringify({local:get(c.key),cloud:fresh}));
    let saved=fresh;
    if(choice==='local')saved=await api('/student/state/'+encodeURIComponent(c.key),{method:'PUT',body:JSON.stringify({value:GrowingSync.clean(c.key,get(c.key)),revision:fresh.revision})});
    if(version!==generation)return;
    pull(c.key,saved.value);const meta=currentMeta();meta[c.key]={value:GrowingSync.clean(c.key,saved.value),revision:saved.revision};setMeta(meta);await sync();
  }
  let lastAction=0,lastTick=Date.now(),currentSubject='';
  function activity(url){lastAction=Date.now();currentSubject=/english|word-ops/.test(url)?'英语':/physics/.test(url)?'物理':/math-course|fraction-ops/.test(url)?'数学':'';}
  function tick(){
    const now=Date.now(),seconds=Math.min(15,Math.max(0,(now-lastTick)/1000));lastTick=now;
    if(!user||user.role!=='Student'||!$('#course')||document.hidden||now-lastAction>60000||!currentSubject)return;
    let device=raw.getItem('growing-cloud-device:'+user.id);if(!device){device=crypto.randomUUID();raw.setItem('growing-cloud-device:'+user.id,device);}
    const key='growing-activity-v1:'+device,data=JSON.parse(get(key)||'{"days":{}}'),date=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
    data.days[date]??={};data.days[date][currentSubject]=(data.days[date][currentSubject]||0)+seconds;put(key,JSON.stringify(data));
  }
  window.GrowingCloud={storage,activity,questionAttempts(){
    if(!user||user.role!=='Student'||needsRole(user))return null;
    const id=user.id,version=generation;
    return {studentId:id,api:(path,options)=>{if(user?.id!==id||generation!==version)throw Error('学习会话已切换，请重新打开错题。');return api(path,options);}};
  }};
  function hideRankings(){$('#my-rankings').hidden=true;$('#rankings-dialog').close();$('#rankings-content').replaceChildren();}
  function auth(){document.body.classList.remove('admin-console');clearInterval(timer);hideRankings();$('#question-bank').hidden=true;$('#logout').hidden=true;$('#settings').hidden=true;$('#learning-reports').hidden=true;$('#admin-navigation').hidden=true;$('#identity').textContent='PC · 手机网页 · Android';
    if(isNative&&!base){$('#app').innerHTML='<section class="panel"><h1>云服务尚未配置</h1><p>此安装包需要先配置服务端 HTTPS 地址，再登录云账号同步学习记录。</p><a class="button" href="../app-design/index.html">返回离线学习</a></section>';return;}
    $('#app').innerHTML=`<section class="panel auth"><p class="muted">成长 · 学习与陪伴</p><h1>${authMode==='login'?'欢迎回来':'创建云账号'}</h1><p>${isNative&&!native.identityAccount?.()?'旧本机账号已登录，还需确认云账号身份。已有云账号请在下方登录，登录后选择学生或家长；没有云账号请点「注册」，注册时选择身份。后台保存成功后才能继续，原学习记录会保留。':'学生继续学习，家长看见进步。'}</p><form id="auth"><label>用户名<input name="username" autocomplete="username" minlength="2" maxlength="24" required></label><label>密码<input name="password" type="password" autocomplete="${authMode==='login'?'current-password':'new-password'}" minlength="8" maxlength="128" required></label>${authMode==='register'?'<label>称呼<input name="displayName" maxlength="40" required></label><label>身份<select name="role" required><option value="" selected disabled>请选择身份</option><option value="Student">我是学生</option><option value="Parent">我是家长</option></select></label>':''}${isNative?'<label><input name="consent" type="checkbox" style="display:inline;width:auto" required> 同意登录云账号；学生身份将关联本机学习记录（AI 密钥不上传）</label>':''}<button class="primary" type="submit">${authMode==='login'?'登录':'注册并登录'}</button></form><p><button id="switch-auth">${authMode==='login'?'还没有云账号？注册':'已有云账号？登录'}</button></p><p class="muted">旧版本机账号需关联云账号。本机记录和 AI 密钥保留；只有在此填写的云账号密码会发送到后台。</p></section>`;
  }
  async function enter(profile,view=location.hash==='#question-bank'?'question-bank':location.hash==='#learning-reports'?'reports':'management'){management?.dispose();clearInterval(timer);clearTimeout(saveTimer);cloudReady=false;hideRankings();user=null;generation++;const version=generation;await rememberNativeSession(profile);if(version!==generation)return;user=profile;$('#logout').hidden=false;$('#learning-reports').hidden=true;$('#question-bank').hidden=needsRole(user);hint('');
    document.body.classList.toggle('admin-console',user.role==='Admin'&&view==='management');
    if(needsRole(user)){
      $('#settings').hidden=true;$('#admin-navigation').hidden=true;$('#identity').textContent=user.displayName+' · 待确认身份';
      $('#app').innerHTML='<section class="panel auth"><h1>请选择你的身份</h1><p>继续使用前，请确认你是学生还是家长。保存到云端后，下次登录无需重复选择。</p><form id="choose-role"><label>身份<select name="role" required><option value="" selected disabled>请选择身份</option><option value="Student">我是学生</option><option value="Parent">我是家长</option></select></label><button type="submit" class="primary">保存身份并继续</button></form></section>';return;
    }
    management=GrowingManagement.create(api,esc,()=>generation===version,()=>{management?.dispose();generation++;clearInterval(timer);user=null;token='';raw.removeItem(sessionKey);auth();hint('密码已修改，请使用新密码重新登录。');});$('#settings').hidden=!['Parent','Admin'].includes(user.role);$('#admin-navigation').hidden=user.role!=='Admin';$('#identity').textContent=user.displayName+' · '+({Parent:'家长',Student:'学生',Admin:'管理员'}[user.role]);
    $('#my-rankings').hidden=user.role!=='Student';
    $('#learning-reports').hidden=!['Parent','Admin'].includes(user.role);
    $('#learning-reports').setAttribute('aria-pressed',String(view==='reports'));
    history.replaceState(null,'',location.pathname+location.search+(view==='question-bank'?'#question-bank':view==='reports'&&user.role!=='Student'?'#learning-reports':''));
    document.querySelectorAll('[data-admin-view]').forEach(button=>{const active=button.dataset.adminView===view;button.classList.toggle('primary',active);button.setAttribute('aria-pressed',String(active));});
    if(view==='question-bank'){
      $('#app').innerHTML='<div id="question-bank-page"></div>';
      await GrowingQuestionBank.mount($('#question-bank-page'),api,esc,()=>generation===version,user);
    }else if(view==='reports'&&['Admin','Parent'].includes(user.role)){
      $('#app').innerHTML='<div class="actions"><button id="parent-home">‹ 返回看板</button></div><div id="unit-reports-page"></div>';
      await GrowingUnitReports.mount($('#unit-reports-page'),api,esc,()=>generation===version,user.role==='Admin');
    }else if(user.role==='Student'){await student();}else if(user.role==='Admin'){
      if(view==='student')await student();else if(view==='parent')await parent();else if(view==='settings')parentSettings();else await management.admin($('#app'));
    }else if(view==='settings')parentSettings();else await parent();
    if(version===generation&&user?.role==='Student')timer=setInterval(sync,15000);
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
  async function student(showHome=true){
    if(user.role==='Admin'){
      conflicts=[];
      $('#app').innerHTML='<h1>学生课堂</h1><p class="muted">使用当前管理员账号查看数学、英语与物理课程。</p><section class="panel"><p>课堂试用记录保存在当前设备，不影响学生的学习记录。</p><button id="start-course" class="primary">进入数学、英语与物理课堂 →</button></section>';
      return;
    }
    $('#app').innerHTML=`<h1>今天，也向前一步</h1><p class="muted">学习记录自动保存到云端，更换设备后使用同一学生账号即可恢复。正在检查并上传此设备已有记录…</p><div class="sync" id="sync-status" role="status">正在恢复云端学习记录…</div><div id="conflicts"></div><section class="panel"><div class="actions"><button id="start-course" class="primary" disabled>进入数学、英语与物理课堂 →</button><button id="sync-now">重试保存与恢复</button></div></section>`;
    const legacy=legacyKeys();if(legacy.length&&!raw.getItem('growing-legacy-owner-v1'))$('#app').insertAdjacentHTML('beforeend',`<section id="legacy-migration" class="panel"><h2>发现旧版本机学习记录</h2><p>此浏览器有 ${legacy.length} 份尚未关联账号的记录。确认属于 ${esc(user.displayName)} 后，可迁入当前学生云账号；两边不同时需选择版本。</p><button id="migrate-legacy">把旧记录迁入此学生</button></section>`);
    const studentGeneration=generation,entry=$('#start-course');
    const ready=await sync();
    if(studentGeneration!==generation||!entry.isConnected)return;
    if(showHome&&ready&&!conflicts.length&&!syncing&&!$('#legacy-migration')){openCourse();return;}
  }
  function openCourse(){
    if(conflicts.length)throw Error('请先处理记录冲突。');if(syncing)throw Error('请等待本次同步完成。');
    if(user.role==='Student'&&!cloudReady)throw Error('请先连接云服务，恢复学习记录后再进入课堂。');
    if(isNative){if(native.openLearning){const result=JSON.parse(native.openLearning());if(!result.ok)throw Error(result.error);}else location.href='../app-design/index.html';return;}
    const status=$('#sync-status')?.textContent||'学习记录会自动保存在本机并同步';
    $('#app').innerHTML=`<div class="actions"><button id="close-course">${user.role==='Admin'?'‹ 返回学生课堂':'云同步'}</button><span id="sync-status">${esc(user.role==='Admin'?'课堂试用记录保存在当前设备':status)}</span></div><iframe id="course" title="学生课堂" src="/learn/app-design/index.html"></iframe>`;
  }
  async function showRankings(){
    if(user?.role!=='Student'||needsRole(user))return;
    const dialog=$('#rankings-dialog'),version=generation,rankingRoot=document.createElement('section');
    rankingRoot.id='student-rankings';$('#rankings-content').replaceChildren(rankingRoot);dialog.showModal();
    await GrowingRankings.mount(rankingRoot,api,esc,()=>version===generation&&dialog.open,'/student/rankings','我的排行榜',sync);
  }
  async function parent(query='',page=1){
    const version=generation,request=++parentRequest,isAdmin=user.role==='Admin';
    $('#app').innerHTML=`<h1>陪伴，从看见开始</h1><p class="muted">${isAdmin?'管理员可查看全站学生的家长看板，无需绑定或切换账号。':'查看孩子最近同步的学习记录，可添加多个孩子。'}</p><section class="panel"><h2>${isAdmin?'全站学生':'我的孩子'}</h2>${isAdmin?`<form id="student-search" class="actions filters"><label>用户名或称呼<input name="q" maxlength="40" value="${esc(query)}" placeholder="搜索学生"></label><button type="submit" class="primary">查询</button></form>`:'<button id="add-child">添加孩子</button>'}<div id="children" class="actions"></div><div id="child-pages" class="actions pagination"></div></section><section id="report"></section>`;
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
      const result=await api('/auth/'+authMode,{method:'POST',body:JSON.stringify(values)});
      if(isNative)token=result.token;
      await enter(result.user);
    }else if(event.target.id==='choose-role'){
      const version=generation;
      if(!['Student','Parent'].includes(values.role))throw Error('请选择学生或家长。');
      checkNativeBinding({...user,role:values.role});
      const profile=await api('/auth/role',{method:'POST',body:JSON.stringify({role:values.role})});
      if(version!==generation)return;
      await enter(profile);
    }else if(event.target.id==='student-search'){if(user?.role==='Admin')await parent(String(values.q).trim());}
    else{const version=generation;event.target.elements.studentPassword.value='';await api('/parent/children/account',{method:'POST',body:JSON.stringify(values)});if(version!==generation)return;await parent();if(version===generation)hint('孩子已添加，可以继续添加其他孩子。');}}catch(e){hint(e.message);}finally{button.disabled=false;}
  });
  document.addEventListener('click',async event=>{const b=event.target.closest('button');if(!b)return;try{
    if(b.id==='my-rankings')await showRankings();
    if(b.id==='close-rankings')$('#rankings-dialog').close();
    if(b.id==='retry-startup')await restoreSession();
    if(b.id==='startup-login'){startupAttempt++;token='';auth();hint('本机记录保留，请重新登录云账号。');}
    if(b.id==='offline-course'){
      const cached=read(sessionKey,null);
      if(!cached?.user||cached.user.role!=='Student'||needsRole(cached.user)||native?.identityAccount?.()!==cached.user.id)throw Error('请先联网登录学生账号。');
      user=cached.user;cloudReady=true;openCourse();
    }
    if(b.id==='download-apk')await downloadApk(b);
    if(b.id==='switch-auth'){authMode=authMode==='login'?'register':'login';auth();}
    if(b.dataset.adminView)await adminView(b.dataset.adminView);
    if(b.id==='learning-reports')await reportsView();
    if(b.id==='question-bank'&&user&&!needsRole(user))await enter(user,'question-bank');
    if(b.id==='question-bank-home'&&user)await enter(user,'management');
    if(b.id==='settings'){if(user?.role==='Admin')await adminView('settings');else if(user?.role==='Parent')await enter(user,'settings');}
    if(b.id==='add-child')parentSettings();
    if(b.id==='parent-home'){if(user?.role==='Admin')await adminView('parent');else if(user?.role==='Parent')await enter(user,'management');}
    if(b.dataset.childPage&&user?.role==='Admin')await parent($('#student-search [name=q]').value,Number(b.dataset.childPage));
    if(b.id==='logout'){if(user?.role==='Student'&&!await sync())throw Error('还有记录未保存到云端，请联网重试后退出。');await api('/auth/logout',{method:'POST'});generation++;clearInterval(timer);clearTimeout(saveTimer);user=null;token='';raw.removeItem(sessionKey);auth();hint('已退出云账号。');}
    if(b.id==='sync-now')await sync();
    if(b.id==='migrate-legacy'){b.disabled=true;try{await migrateLegacy();}finally{b.disabled=false;}}
    if(b.dataset.resolve!==undefined)await resolve(Number(b.dataset.resolve),b.dataset.choice);
    if(b.dataset.child)await report(b.dataset.child);
    if(b.id==='start-course')openCourse();
    if(b.id==='close-course'){tick();$('#course').remove();await student(false);}
  }catch(e){hint(e.message);}});
  setInterval(()=>{try{tick();}catch(e){hint('活跃时长未保存：'+e.message);}},10000);
  window.addEventListener('online',sync);
  window.addEventListener('growing-storage-change',event=>{if(!restoring&&(event.detail?.key===null||GrowingSync.allowed(event.detail?.key||'')))queueSave();});
  window.addEventListener('pagehide',()=>{tick();sync();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){tick();sync();}});
  let startupAttempt=0;
  async function restoreSession(){
    const attempt=++startupAttempt;
    $('#app').innerHTML='<section class="panel auth"><h1>正在确认云账号身份</h1><p role="status">正在连接云服务，最多等待 12 秒…</p><p>身份确认成功后，学生进入学习中心，家长进入家长看板。若网络不可用，可稍后重试。</p><button id="startup-login">改用云账号登录</button></section>';
    hint('');
    try{const profile=await api('/auth/me');if(attempt!==startupAttempt)return;await enter(profile);}
    catch(e){if(attempt!==startupAttempt)return;
      if(e.status===401){token='';raw.removeItem(sessionKey);auth();hint('请登录云账号并确认身份。');return;}
      const cached=isNative&&read(sessionKey,null),offline=cached?.user?.role==='Student'&&!needsRole(cached.user)&&native.identityAccount?.()===cached.user.id&&Array.from({length:raw.length},(_,i)=>raw.key(i)).some(key=>GrowingSync.allowed(key||'')&&!key.startsWith('growing-activity-'));
      $('#app').innerHTML='<section class="panel auth"><h1>暂时无法确认身份</h1><p>请检查网络后重试，或重新登录云账号。此设备的缓存仍保留；未保存到云端的记录需要联网后补传。</p><div class="actions"><button id="retry-startup" class="primary">重新连接</button><button id="startup-login">改用云账号登录</button>'+(offline?'<button id="offline-course">离线使用已有缓存（暂未与云端核对）</button>':'')+'</div></section>';hint(e.message);
    }
  }
  (async()=>{try{if(isNative){if(!base){auth();return;}
    // The native form already collected an explicit role and cloud-registration consent.
    // Transfer credentials once in memory; never persist the plaintext password.
    const pending=native.takeRegistration?.();
    if(pending){const values=JSON.parse(pending);authMode='register';auth();
      for(const name of ['username','password','displayName','role'])$('#auth').elements[name].value=values[name];
      $('#auth').elements.consent.checked=true;$('#auth').requestSubmit();return;}
    const session=read(sessionKey,null);token=session?.token||'';
    if(!token){auth();return;}
  }await restoreSession();}catch(e){auth();if(e.status!==401)hint(e.message);}})();
})();
