/* Student shell presentation. Business callbacks are invoked directly, never through legacy controls. */
(()=>{
 'use strict';
 if(new URLSearchParams(location.search).get('ui')==='legacy')return;
 const shellBase=new URL('./',document.currentScript.src),resources=window.GrowingNative?new URL('../app-design/',document.currentScript.src):new URL('/learn/app-design/',location.href),loads=new Map(),mounted=new Map();
 const assetUrl=name=>{const url=new URL(name,name.startsWith('vendor/learning-ui/')?shellBase:resources);url.searchParams.set('studentUi','20261112-vant-style-4');return url;};
 const load=(name,css=false)=>{if(loads.has(name))return loads.get(name);const promise=new Promise((resolve,reject)=>{const el=document.createElement(css?'link':'script');if(css){el.rel='stylesheet';el.href=assetUrl(name);}else el.src=assetUrl(name);el.onload=resolve;el.onerror=()=>{el.remove();loads.delete(name);reject(Error('新版界面资源未加载，可继续使用原界面。'));};document.head.append(el);});loads.set(name,promise);return promise;};
 function storeModel(initial,actions){let model=initial;const listeners=new Set();return {get model(){return model;},actions,update(patch){model={...model,...patch};for(const fn of listeners)fn(model);},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},destroy(){listeners.clear();}};}
 async function mount(root,kind,controller,active=()=>root.isConnected){
  dispose(root);const ticket={controller};mounted.set(root,ticket);
  try{await Promise.all([window.GrowingVantHome||load('vendor/learning-ui/learning-ui.js'),load('vendor/learning-ui/learning-ui.css',true)]);if(mounted.get(root)!==ticket||!active())return false;
   const host=document.createElement('div');ticket.app=window.GrowingVantHome.mountStudent(host,kind,{controller});root.replaceChildren(host);return true;
  }catch(error){if(mounted.get(root)===ticket&&active()){const note=document.createElement('p');note.setAttribute('role','status');note.textContent=error.message;root.append(note);}return false;}
 }
 function dispose(root){const current=mounted.get(root);if(!current)return;mounted.delete(root);current.app?.destroy();current.controller?.destroy();}
 function auth({mode='login',native=false,submit,switchMode}){
  const c=storeModel({kind:'auth',mode,native,busy:false,error:''},{});let alive=true,request=0;
  c.actions.submit=async values=>{if(!alive||c.model.busy)return;const run=++request;c.update({busy:true,error:''});try{await submit(values);}catch(error){if(alive&&run===request)c.update({error:error.message});}finally{if(alive&&run===request)c.update({busy:false});}};
  c.actions.switch=switchMode;const end=c.destroy;c.destroy=()=>{alive=false;request++;end();};return c;
 }
 function rankings({api,prefix='/student/rankings',beforeRefresh,active=()=>true,close}){
  const c=storeModel({kind:'rankings',boards:[],subject:'',term:'',boardKind:'unit',selected:'',choices:[],page:1,data:null,busy:false,error:''},{});let alive=true,request=0;
  const valid=()=>alive&&active();
  function choices(){const m=c.model,rows=m.boards.filter(b=>(!m.subject||b.subject===m.subject)&&(!m.term||b.term===m.term)&&b.kind===m.boardKind);c.update({choices:rows,selected:rows.some(b=>b.id===m.selected)?m.selected:rows[0]?.id||''});}
  async function read(){const seq=++request;if(!valid())return;if(!c.model.selected){c.update({data:null,busy:false});return;}c.update({busy:true,error:'',data:null});try{const data=await api(prefix+'?'+new URLSearchParams({board:c.model.selected,page:c.model.page}));if(valid()&&seq===request)c.update({data});}catch(e){if(valid()&&seq===request)c.update({error:e.message});}finally{if(valid()&&seq===request)c.update({busy:false});}}
  async function refresh(){const seq=++request;if(!valid())return;c.update({busy:true,error:'',data:null});try{await beforeRefresh?.();if(!valid()||seq!==request)return;const data=await api(prefix);if(!valid()||seq!==request)return;c.update({boards:data.boards,page:1});choices();await read();}catch(e){if(valid()&&seq===request)c.update({error:e.message,busy:false});}}
  c.actions.refresh=refresh;c.actions.close=close;c.actions.filter=(key,value)=>{if(!valid()||!['subject','term','boardKind','selected'].includes(key))return;c.update({[key]:value,page:1});choices();return read();};c.actions.page=value=>{if(!valid())return;c.update({page:Math.max(1,value)});return read();};const end=c.destroy;c.destroy=()=>{alive=false;request++;end();};return c;
 }
 function menu({identity,storage,active,actions}){
  const configured=fn=>(...args)=>{active();const previous=window.GrowingCourseAIStorage;window.GrowingCourseAIStorage=()=>storage;try{return fn(...args);}finally{if(previous===undefined)delete window.GrowingCourseAIStorage;else window.GrowingCourseAIStorage=previous;}};
  const ai=window.GrowingCourseAI,voice=window.GrowingRealtime;
  async function calendarAssets(){await Promise.all([window.GrowingCurriculum||load('curriculum.js'),window.GrowingUnitCalendar||load('unit-calendar.js'),window.GrowingHandwriting||load('handwriting-core.js')]);active();}
  return {identity,actions,deepseek:{info:configured(()=>ai.info()),save:configured(v=>ai.save(v)),clear:configured(()=>ai.clear()),test:configured(async signal=>{await ai.request({task:'只回复“连接成功”。',signal});active();})},voice:{info:configured(async signal=>{const value=await (voice.settingsInfo?voice.settingsInfo({signal}):voice.info());active();return value;}),save:configured(v=>voice.save(v)),clear:configured(()=>voice.clear()),voices:voice.voices,test:configured(async signal=>{await voice.connectionInfo({signal});active();})},calendar:{async units(){await calendarAssets();return Object.values(window.GrowingCurriculum).flatMap(s=>Object.values(s.terms).filter(t=>t.verified).flatMap(t=>t.units.map(u=>({id:u.id,label:`${s.name} · ${t.name} · ${u.number} ${u.title}`}))));},async read(unit){await calendarAssets();const H=window.GrowingHandwriting,topics=Object.entries(H.knowledgeNodes).map(([id,title])=>({id,title,unitId:H.nodeUnit(id)}));return window.GrowingUnitCalendar.collect(unit,key=>{active();const raw=storage.getItem(key);return raw===null?null:JSON.parse(raw);},topics);}}};
 }
 window.GrowingStudentPlatform={mount,dispose,auth,rankings,menu,storeModel};
 window.addEventListener('pagehide',()=>{for(const root of [...mounted.keys()])dispose(root);});
})();
