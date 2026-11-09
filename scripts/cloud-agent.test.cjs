const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const id='11111111-1111-4111-8111-111111111111',key='growing-diagnosis-year8-v1:math-8a-02',metaKey='growing-cloud-meta-v1:'+id;
async function setup(records={},server=[]){
 const data=new Map(Object.entries(records)),events=new Map(),timers=new Set(),calls=[],navigations=[];let reloads=0,fetcher=async()=>Response.json(server);
 data.set('growing-cloud-session-v1',JSON.stringify({token:'fixture',user:{id,role:'Student',roleSelectionRequired:false}}));data.set('growing-cloud-binding-v1',id);
 const ok=value=>JSON.stringify({ok:true,value}),context={URL,URLSearchParams,Request,Response,Headers,AbortController,TextEncoder,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},console,
  setTimeout(fn,ms){const timer=setTimeout(fn,ms);timers.add(timer);return timer;},clearTimeout:timer=>{timers.delete(timer);clearTimeout(timer);},setInterval(){},
  location:{pathname:'/assets/web/app-design/math-course.html',href:'https://appassets.androidplatform.net/assets/web/app-design/math-course.html',origin:'https://appassets.androidplatform.net',reload(){reloads++;},replace(url){navigations.push(url);}},
  document:{hidden:false,addEventListener(){}},addEventListener(type,fn){events.set(type,fn);},dispatchEvent(event){events.get(event.type)?.(event);},
  fetch:async(url,options)=>{calls.push({url,options});return fetcher(url,options);},
  GrowingNative:{cloudApiUrl:()=> 'https://learn.test',get:k=>ok(data.get(k)??null),put:(k,v)=>{data.set(k,v);return ok();},remove:k=>{data.delete(k);return ok();},keys:()=>ok([...data.keys()]),identityAccount:()=>id}};
 context.window=context;context.top=context;vm.createContext(context);
 for(const p of ['app/src/main/assets/bootstrap.js','platform-web/sync-core.js','platform-web/cloud-agent.js'])vm.runInContext(source(p),context);
 await new Promise(resolve=>setImmediate(resolve));
 return {context,data,calls,navigations,get reloads(){return reloads;},setServer(fn){fetcher=fn;},close(){for(const timer of timers)clearTimeout(timer);}};
}
test('native background pulls cloud records, invalidates stale page writes, and keeps device keys',async()=>{
 const local=JSON.stringify({draft:'local'}),cloud=JSON.stringify({draft:'cloud'});
 const s=await setup({[key]:local,'growing-course-ai-v1':'personal-only'},[{key,value:cloud,revision:2}]);
 try{assert.equal(s.data.get(key),cloud);assert.equal(s.data.get('growing-course-ai-v1'),'personal-only');
  s.context.localStorage.getItem(key);const newer=JSON.stringify({draft:'newer'});s.setServer(async()=>Response.json([{key,value:newer,revision:3}]));
  assert.equal(await s.context.GrowingCloudFlush(),true);assert.equal(s.reloads,1);
  s.context.localStorage.setItem(key,local);assert.equal(s.data.get(key),newer);
 }finally{s.close();}
});
test('native upload races use the cloud response, including a deletion',async()=>{
 const s=await setup();try{
  s.context.localStorage.setItem(key,JSON.stringify({draft:'new'}));let uploads=0;
  s.setServer(async(url,options)=>options.method==='PUT'?(uploads++,Response.json({error:'updated',current:{value:null,revision:2}},{status:409})):Response.json([]));
  assert.equal(await s.context.GrowingCloudFlush(),true);assert.equal(uploads,1);assert.equal(s.data.has(key),false);assert.equal(JSON.parse(s.data.get(metaKey))[key].revision,2);
 }finally{s.close();}
});
test('native background saves new work and preserves edits queued while uploading',async()=>{
 const s=await setup();try{
  s.context.localStorage.setItem(key,JSON.stringify({draft:'first'}));let value=null,revision=0;
  s.setServer(async(url,options)=>{if(options.method==='PUT'){value=JSON.parse(options.body).value;revision++;if(revision===1)s.context.localStorage.setItem(key,JSON.stringify({draft:'second'}));return Response.json({value,revision});}return Response.json(value?[{key,value,revision}]:[]);});
  await s.context.GrowingCloudFlush();await s.context.GrowingCloudFlush();assert.equal(JSON.parse(value).draft,'second');assert.equal(revision,2);
 }finally{s.close();}
});
test('native delayed responses cannot write after the account changes',async()=>{
 const s=await setup();try{let finish;s.setServer(()=>new Promise(resolve=>finish=resolve));const pending=s.context.GrowingCloudFlush();
  s.data.set('growing-cloud-session-v1',JSON.stringify({token:'changed',user:{id:'another',role:'Student'}}));finish(Response.json([{key,value:'{"draft":"wrong account"}',revision:9}]));
  assert.equal(await pending,false);assert.equal(s.data.has(key),false);
 }finally{s.close();}
});

test('an expired native session returns to login when the background server rejects it',async()=>{
 const s=await setup();try{s.setServer(async()=>Response.json({error:'Expired'},{status:401}));assert.equal(await s.context.GrowingCloudFlush(),false);assert.equal(s.data.has('growing-cloud-session-v1'),false);assert.deepEqual(s.navigations,['/assets/web/cloud/index.html']);}finally{s.close();}
});
