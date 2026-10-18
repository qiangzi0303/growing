/* Loaded before every course script. Native storage isolates accounts and survives APK updates. */
(() => {
  'use strict';
  if (!window.GrowingNative) throw new Error('Android learning bridge unavailable');
  const native=window.GrowingNative;
  const call=(method,...args)=>{const result=JSON.parse(native[method](...args));if(!result.ok)throw new Error(result.error||'存储未完成');return result.value;};
  const methods={
    getItem:key=>call('get',String(key)),
    setItem:(key,value)=>{call('put',String(key),String(value));},
    removeItem:key=>{call('remove',String(key));},
    clear:()=>{call('clear');},
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
  window.fetch=async(input,init={})=>{
    const url=new URL(input instanceof Request?input.url:String(input),location.href);
    if(url.origin==='https://api.deepseek.com' && url.pathname==='/chat/completions'){
      const key=native.aiKey();
      if(!key){native.configureAi();throw new Error('请在账号设置中填写你自己的 AI API Key，再重新评分。');}
      const headers=new Headers(input instanceof Request?input.headers:undefined);
      new Headers(init.headers||{}).forEach((v,k)=>headers.set(k,v));
      headers.set('Authorization','Bearer '+key);
      return originalFetch(input,{...init,headers});
    }
    return originalFetch(input,init);
  };
})();
