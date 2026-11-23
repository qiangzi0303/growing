/* Loaded before every course script. Native storage isolates accounts and survives APK updates. */
(() => {
  'use strict';
  if (!window.GrowingNative) throw new Error('Android learning bridge unavailable');
  const native=window.GrowingNative;
  // Standalone Android lessons use the same account menu as the cloud shell.
  if(window===window.top&&!location.pathname.includes('/companion-duck/')&&!location.pathname.includes('/web/cloud/')){
    document.addEventListener('DOMContentLoaded',()=>{
      const script=document.createElement('script');script.src='/assets/web/cloud/native-menu.js?v=unified-account-1';document.head.append(script);
    },{once:true});
  }
  // Every native learning page gets the companion, including home and catalogs.
  if(window===window.top&&!location.pathname.includes('/companion-duck/')&&!location.pathname.includes('/web/cloud/')){
    document.addEventListener('DOMContentLoaded',()=>{
      if(document.getElementById('course-duck-host')||document.getElementById('global-course-duck'))return;
      const script=document.createElement('script');script.id='global-course-duck';script.src='/assets/web/app-design/course-duck.js';document.head.append(script);
    },{once:true});
  }
  window.GrowingPhotoBank={open(){
    const url=new URL('/assets/web/cloud/index.html',location.origin);url.searchParams.set('return',location.href);url.hash='question-bank';location.href=url.href;
  }};
  const call=(method,...args)=>{const result=JSON.parse(native[method](...args));if(!result.ok)throw new Error(result.error||'存储未完成');return result.value;};
  const changed=key=>{if(typeof window.dispatchEvent==='function')window.dispatchEvent(new CustomEvent('growing-storage-change',{detail:{key}}));};
  const owner=window.top||window,cache=owner.GrowingCloudStorageState||(owner.GrowingCloudStorageState={views:new Set(),ready:false});
  const view={window,document:window.document,keys:new Set(),stale:false};cache.views.add(view);
  function write(key,value){
    if(window.GrowingSync?.allowed(key)){
      if(view.stale)return;
      const session=JSON.parse(call('get','growing-cloud-session-v1')||'null');
      if(session?.user?.role==='Student'&&call('get','growing-cloud-binding-v1')===session.user.id&&(cache.ready||call('get',key)===null)){
        const metaKey='growing-cloud-meta-v1:'+session.user.id,meta=JSON.parse(call('get',metaKey)||'{}');
        if(!meta[key]){meta[key]={value:null,revision:0};call('put',metaKey,JSON.stringify(meta));}
      }
    }
    if(value===null)call('remove',key);else call('put',key,value);changed(key);
  }
  const methods={
    getItem:key=>{key=String(key);view.keys.add(key);return call('get',key);},
    setItem:(key,value)=>write(String(key),String(value)),
    removeItem:key=>write(String(key),null),
    clear:()=>{if(view.stale)return;call('clear');changed(null);},
    key:index=>call('keys')[Number(index)]??null,
  };
  const storage=new Proxy({}, {
    get:(_,key)=>key==='length'?call('keys').length:methods[key]||(typeof key==='string'?methods.getItem(key):undefined),
    set:(_,key,value)=>{methods.setItem(key,value);return true;},
    deleteProperty:(_,key)=>{methods.removeItem(key);return true;},
    ownKeys:()=>call('keys'),
    getOwnPropertyDescriptor:(_,key)=>methods.getItem(key)===null?undefined:{enumerable:true,configurable:true},
  });
  Object.defineProperty(window,'localStorage',{value:storage,configurable:false});
  const originalFetch=window.fetch.bind(window);
  function knowledgeIdentity(){
    const session=JSON.parse(storage.getItem('growing-cloud-session-v1')||'null');
    if(!session?.token||session.user?.role!=='Student'||session.user.roleSelectionRequired!==false||
      storage.getItem('growing-cloud-binding-v1')!==session.user.id||native.identityAccount?.()!==session.user.id)
      throw Error('请先在学习中心登录并确认当前学生云账号。');
    const base=String(native.cloudApiUrl?.()||'').replace(/\/$/,'');
    const url=new URL(base);
    if(url.protocol!=='https:'&&!(['localhost','127.0.0.1'].includes(url.hostname)&&url.protocol==='http:'))throw Error('学习档案云服务地址无效。');
    return {session,base};
  }
  async function knowledgeApi(path,options={}){
    const {session,base}=knowledgeIdentity(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await originalFetch(base+'/api'+path,{...options,credentials:'omit',signal:controller.signal,
        headers:{'Content-Type':'application/json','X-Growing-Client':'1',Authorization:'Bearer '+session.token}});
      const result=await response.json(),current=knowledgeIdentity();
      if(current.session.token!==session.token||current.session.user.id!==session.user.id||current.base!==base)throw Error('学生账号已切换，请重新打开学习档案。');
      if(!response.ok)throw Error(result.error||'学习档案暂时无法读取，请联网重试。');
      if(path.startsWith('/student/knowledge?')&&result.student?.id!==session.user.id)throw Error('学习档案身份不匹配。');
      return result;
    }finally{clearTimeout(timer);}
  }
  window.GrowingStudentKnowledge={
    async studentKnowledge(unit='',query='',topic=''){
      const result=await knowledgeApi('/student/knowledge?'+new URLSearchParams({unit,q:query.slice(0,150),topic:topic.slice(0,150)}));
      return result;
    },
    saveKnowledgeNote:(unitId,text)=>knowledgeApi('/student/knowledge/notes',{method:'POST',body:JSON.stringify({unitId,text})}),
  };
})();
