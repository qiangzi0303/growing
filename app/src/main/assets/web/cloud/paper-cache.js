/* Disposable account-scoped paper data. Never an authority for grades. */
(()=>{'use strict';
function persistent(){let opening;return async function operation(action,key,value){
 if(!window.indexedDB)return null;
 try{const db=await (opening||(opening=new Promise((resolve,reject)=>{const r=window.indexedDB.open('growing-paper-cache-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('entries',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('blocked'));})));
 return await new Promise((resolve,reject)=>{const tx=db.transaction('entries',action==='get'?'readonly':'readwrite'),s=tx.objectStore('entries');let result;
 if(action==='get'){const r=s.get(key);r.onsuccess=()=>result=r.result;}
 else if(action==='put'){s.put(value);const r=s.getAll();r.onsuccess=()=>{const rows=r.result.sort((a,b)=>b.saved-a.saved);let bytes=0;rows.forEach((row,i)=>{bytes+=row.size;if(i>=80||bytes>24000000||row.expires<Date.now())s.delete(row.key);});};}
 else {const r=s.openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.key.startsWith(key))c.delete();c.continue();}};}
 tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });}catch{return null;}
};}
window.GrowingPaperCache={create({identity,request,store=persistent(),now=()=>Date.now(),ttl=300000}){
 const backing=store;store=async(...args)=>{try{return await backing(...args);}catch{return null;}};
 const memory=new Map(),epochs=new Map(),pending=new Map();const clone=x=>JSON.parse(JSON.stringify(x));
 const owner=i=>JSON.stringify([i.base||'',String(i.id),i.role])+':';
 const scope=(i,student)=>owner(i)+String(student)+':';
 const epoch=s=>epochs.get(s)||0;
 function check(i,signal){const current=identity();if(!current||owner(current)!==owner(i)||current.generation!==i.generation)throw Error('账号已切换，请重新打开试卷。');if(signal?.aborted)throw Object.assign(Error('已取消'),{name:'AbortError'});}
 async function clear(prefix){for(const key of memory.keys())if(key.startsWith(prefix))memory.delete(key);await store('clear',prefix);}
 async function invalidate(student,preserveAI=false,captured=identity()){const i=captured;if(!i)return;const s=scope(i,student??i.id);epochs.set(s,epoch(s)+1);if(!preserveAI)epochs.set(s+'AI',epoch(s+'AI')+1);await clear(s+(preserveAI?'GET:':''));}
 async function denied(i){if(!i)return;epochs.set(owner(i),epoch(owner(i))+1);await clear(owner(i));}
 async function load(key){const row=memory.get(key)||await store('get',key);return row&&row.expires>now()?row:null;}
 async function save(key,value,life){const text=JSON.stringify(value);if(text===undefined||text.length>8000000)return;const row={key,value:JSON.parse(text),saved:now(),expires:now()+life,size:text.length*2};memory.delete(key);memory.set(key,row);let bytes=0,count=0;for(const [k,r] of [...memory].reverse()){bytes+=r.size;count++;if(bytes>24000000||count>80)memory.delete(k);}await store('put',key,row);return row;}
 async function authorized(i,student,signal){if(i.role!=='Student')await request('/question-bank/cache-access?'+new URLSearchParams({studentId:student}),{signal,cache:'no-store'});check(i,signal);}
 async function cached(student,key,producer,{signal,force=false,life=ttl}={}){const i=identity();if(!i)return producer();const s=scope(i,student),version=epoch(s+(key.startsWith('AI:')?'AI':'')),accessVersion=epoch(owner(i)),k=s+key,versionScope=s+(key.startsWith('AI:')?'AI':'');check(i,signal);const requestScope='request:'+k;if(force)epochs.set(requestScope,epoch(requestScope)+1);const requestVersion=epoch(requestScope);let saved;const current=()=>version===epoch(versionScope)&&accessVersion===epoch(owner(i))&&requestVersion===epoch(requestScope);
 try{if(!force){const row=await load(k);check(i,signal);if(row){await authorized(i,student,signal);if(current())return clone(row.value);}}
 if(key.startsWith('AI:'))await authorized(i,student,signal);
 const value=await producer();check(i,signal);if(!current())throw Error('记录已更新，请重新加载。');saved=await save(k,value,life);check(i,signal);if(!current()){if(saved&&memory.get(k)===saved)await clear(k);throw Error('记录已更新，请重新加载。');}return value;
 }catch(e){if([401,403,404].includes(e.status))await denied(i);if(signal?.aborted&&saved&&memory.get(k)===saved)await clear(k);throw e;}}
 async function api(path,options={}){const i=identity(),method=(options.method||'GET').toUpperCase(),url=new URL(path,'https://cache.invalid');let body={};try{body=JSON.parse(options.body||'{}');}catch{}
 const student=body.studentId??url.searchParams.get('studentId')??(i?.role==='Student'?i.id:null);
 const eligible=/^\/question-bank\/(papers(?:\/[^/]+)?|questions(?:\/[^/]+(?:\/(?:review|figures))?)?|paper-graph|unit-summary|attempt-stats)$/.test(url.pathname);
 if(method==='GET'&&eligible&&student!==null){const key=i?scope(i,student)+':'+i.generation+':'+epoch(scope(i,student))+':'+epoch('request:'+scope(i,student)+'GET:'+path)+':'+path:'';const run=()=>cached(student,'GET:'+path,()=>request(path,options),{signal:options.signal,force:options.cache==='reload'||options.cache==='no-store'});if(options.signal||options.cache||!i)return run();if(!pending.has(key)){const task=run().finally(()=>pending.delete(key));pending.set(key,task);}return clone(await pending.get(key));}
 const mutation=method!=='GET'&&path.startsWith('/question-bank/');if(mutation)await invalidate(student,url.pathname.endsWith('/paper-ai'),i);
 try{const result=await request(path,options);if(i)check(i,options.signal);return result;}catch(e){if([401,403,404].includes(e.status))await denied(i);throw e;}finally{if(mutation)await invalidate(student,url.pathname.endsWith('/paper-ai'),i);}
 }
 return {api,invalidate,ai(student,q,kind,producer,options={}){const fingerprint=JSON.stringify([q.id,q.revision,q.questionType,q.text,q.figureVersion,q.drawingRevision,q.figures,q.hasDrawing,q.hasFigureImage]);return cached(student,'AI:'+fingerprint+':'+kind,producer,{...options,life:86400000});}};
}};
})();
