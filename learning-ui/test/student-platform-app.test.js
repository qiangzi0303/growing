import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const base=new URL('../../platform-web/',import.meta.url);
const [html,platform,app]=await Promise.all(['index.html','student-platform.js','app.js'].map(name=>readFile(new URL(name,base),'utf8')));
const student=(id='student-one')=>({id,username:id,displayName:'Student display name',role:'Student',roleSelectionRequired:false});
const response=(value,status=200)=>({ok:status>=200&&status<300,status,text:async()=>value===null?'':JSON.stringify(value)});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
async function until(check){for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,5));}assert.fail('Expected app state did not arrive');}

// Run the production shell and its presentation controller, replacing only network,
// external services and the Vue renderer. Actions still call app.js business callbacks.
async function harness({profile=null,request}={}){
 const dom=new JSDOM(html,{url:'https://learn.test/?legacy=1',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,mounts=[],calls=[];
 let currentProfile=profile;
 w.TextEncoder=TextEncoder;w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){const wasOpen=this.open;this.open=false;if(wasOpen)this.dispatchEvent(new w.Event('close'));};
 w.GrowingLegacy={parse:()=>({}),destination:()=>null};w.GrowingManagement={create:()=>({dispose(){}})};
 w.GrowingSync={allowed:()=>false,clean:(_key,value)=>value,plan:()=>[]};
 w.GrowingCourseAI={info:()=>({configured:false}),save(){},clear(){}};w.GrowingRealtime={voices:[],info:()=>({configured:false}),save(){},clear(){}};
 const append=w.document.head.append.bind(w.document.head);w.document.head.append=(...nodes)=>{append(...nodes);for(const node of nodes)queueMicrotask(()=>node.onload?.());};
 w.GrowingVantHome={mountStudent(host,kind,{controller}){const record={host,kind,controller,destroyed:false};mounts.push(record);host.dataset.testKind=controller.model.kind;const button=w.document.createElement('button');button.textContent=controller.model.kind==='navigation'?controller.model.identity:'Current '+controller.model.kind;host.append(button);return{destroy(){record.destroyed=true;host.replaceChildren();}};}};
 w.fetch=async(url,options={})=>{const path=new URL(url,w.location.href).pathname.replace(/^\/api/,''),call={path,options};calls.push(call);const custom=await request?.(call);if(custom!==undefined)return custom;if(path==='/auth/me')return currentProfile?response(currentProfile):response({error:'Not signed in'},401);if(path==='/auth/logout'){currentProfile=null;return response(null,204);}if(path==='/student/state'||path==='/parent/children')return response([]);throw Error('Unexpected request: '+path);};
 Object.defineProperty(w.document,'currentScript',{configurable:true,value:{src:'https://learn.test/student-platform.js'}});w.eval(platform);w.eval(app);
 const current=kind=>mounts.findLast(m=>m.controller.model.kind===kind&&!m.destroyed&&m.host.isConnected);
 await until(()=>profile?current('navigation'):current('auth'));
 return{w,mounts,calls,current,setProfile(value){currentProfile=value;},async restore(){w.dispatchEvent(new w.PageTransitionEvent('pagehide',{persisted:true}));w.dispatchEvent(new w.PageTransitionEvent('pageshow',{persisted:true}));await until(()=>profile?current('navigation'):current('auth'));},close(){dom.window.close();}};
}

test('replaced authentication cannot publish old success and cookie cleanup precedes the next login',async()=>{
 const old=deferred(),next=deferred();let logins=0;
 const f=await harness({request:({path})=>path==='/auth/login'?(++logins===1?old.promise:next.promise):undefined});
 try{const first=f.current('auth').controller.actions.submit({username:'older',password:'example-pass'});await until(()=>logins===1);f.current('auth').controller.actions.switch();await until(()=>f.current('auth')?.controller.model.mode==='register');f.current('auth').controller.actions.switch();await until(()=>f.current('auth')?.controller.model.mode==='login');const second=f.current('auth').controller.actions.submit({username:'newer',password:'example-pass'});await new Promise(r=>setTimeout(r,10));assert.equal(logins,1,'next auth must wait for stale-cookie cleanup');old.resolve(response({user:student('older')}));await until(()=>logins===2);assert.equal(f.current('navigation'),undefined,'old success must not enter its account');const paths=f.calls.map(c=>c.path),firstLogin=paths.indexOf('/auth/login'),secondLogin=paths.lastIndexOf('/auth/login');assert.ok(paths.slice(firstLogin+1,secondLogin).includes('/auth/logout'));next.resolve(response({user:student('newer')}));await Promise.all([first,second]);await until(()=>f.current('navigation'));assert.equal(f.current('navigation').controller.model.identity,'newer');assert.equal(f.w.document.querySelectorAll('[data-student-shell]').length,1);}finally{f.close();}
});

test('bfcache anonymous restoration revalidates and rebuilds an operable authentication form',async()=>{
 const f=await harness();try{const original=f.current('auth'),before=f.calls.filter(c=>c.path==='/auth/me').length;await f.restore();assert.equal(original.destroyed,true);assert.notEqual(f.current('auth'),original);assert.equal(f.calls.filter(c=>c.path==='/auth/me').length,before+1);f.current('auth').controller.actions.switch();await until(()=>f.current('auth')?.controller.model.mode==='register');assert.equal(f.current('auth').controller.model.mode,'register');}finally{f.close();}
});

test('bfcache same-student restoration preserves the live classroom and rebuilds its username menu',async()=>{
 const f=await harness({profile:student()});try{const course=f.w.document.querySelector('#course'),nav=f.current('navigation'),before=f.calls.filter(c=>c.path==='/auth/me').length;course.dataset.unsavedDraft='retained';f.w.document.querySelector('#rankings-dialog').showModal();await f.restore();assert.equal(nav.destroyed,true);assert.equal(f.w.document.querySelector('#course'),course);assert.equal(course.dataset.unsavedDraft,'retained');assert.equal(f.calls.filter(c=>c.path==='/auth/me').length,before+1);assert.equal(f.current('navigation').controller.model.identity,'student-one');assert.equal(f.w.document.querySelectorAll('[data-student-shell]').length,1);assert.equal(f.w.document.querySelector('.bar').style.display,'none');assert.equal(f.w.document.querySelector('#rankings-dialog').open,false);}finally{f.close();}
});

test('bfcache expired session removes the previous classroom and restores login controls',async()=>{
 const f=await harness({profile:student()});try{f.setProfile(null);f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide',{persisted:true}));f.w.dispatchEvent(new f.w.PageTransitionEvent('pageshow',{persisted:true}));await until(()=>f.current('auth'));assert.equal(f.w.document.querySelector('#course'),null);assert.equal(f.w.document.querySelector('[data-student-shell]'),null);assert.equal(f.w.document.querySelector('.bar').style.display,'');}finally{f.close();}
});
