const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
const course='../app/src/main/assets/web/app-design/';
function fixture(markup='<main></main>'){
 const dom=new JSDOM(markup,{url:'https://learn.test/',runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 const execute=name=>{Object.defineProperty(w.document,'currentScript',{configurable:true,value:{src:'https://learn.test/'+name}});w.eval(fs.readFileSync(path.join(__dirname,name),'utf8'));};
 return {dom,w,execute};
}
function icon(button,label){assert.equal(button.textContent,'×');assert.equal(button.getAttribute('aria-label'),label);assert.equal(button.style.width,'44px');assert.equal(button.style.height,'44px');}
test('home settings X preserves accessible close, draft cleanup and focus return',()=>{
 const {dom,w,execute}=fixture('<main class="home"><nav class="home-settings-entry"><button id="open-home-settings">设置</button></nav></main>');
 w.GrowingCourseAI={settingsMarkup:()=>'<input value="draft">'};execute(course+'home-settings.js');
 w.document.querySelector('[data-home-settings]').click();const dialog=w.document.querySelector('dialog');assert.ok(dialog.open);const close=dialog.querySelector('[data-home-close]');icon(close,'关闭');close.click();assert.equal(dialog.open,false);assert.equal(dialog.querySelector('input'),null);assert.equal(w.document.activeElement.id,'open-home-settings');dom.window.close();
});
test('calendar X closes the real calendar dialog',async()=>{
 const {dom,w,execute}=fixture();w.GrowingCurriculum={math:{name:'数学',terms:{upper:{verified:true,name:'上册',units:[{id:'m1',number:'一',title:'测试'}]}}}};w.GrowingUnitCalendar={mount:host=>{host.textContent='已有记录';}};
 execute(course+'learning-calendar.js');await w.GrowingLearningCalendar.open();const dialog=w.document.querySelector('dialog');const close=dialog.querySelector('button');icon(close,'关闭');close.click();assert.equal(dialog.open,false);dom.window.close();
});
test('API settings X keeps close hook and clears mounted form',async()=>{
 const {dom,w,execute}=fixture('<details id="account-menu"><p id="account-identity">student</p></details>');w.GrowingCloud={storage:()=>w.localStorage};w.GrowingCourseAI={settingsMarkup:()=>'<input value="draft">'};
 execute('api-settings.js');await w.GrowingApiSettings.open();const dialog=w.document.querySelector('dialog'),close=dialog.querySelector('#close-api-settings');icon(close,'关闭');close.click();assert.equal(dialog.open,false);assert.equal(dialog.querySelector('input'),null);dom.window.close();
});
test('native menu shows username and keeps the original ranking X close listener',async()=>{
 const {dom,w,execute}=fixture();const user={id:'s1',username:'login-name',displayName:'different-display',role:'Student',roleSelectionRequired:false};w.GrowingNative={identityAccount:()=>user.id,cloudApiUrl:()=> 'https://learn.test'};w.GrowingInteractionSounds={};w.GrowingRankings={mount:async()=>{}};w.localStorage.setItem('growing-cloud-session-v1',JSON.stringify({token:'test-only',user}));
 execute('native-menu.js');assert.equal(w.document.querySelector('#account-identity').textContent,'login-name');w.document.querySelector('#my-rankings').click();await tick();const dialog=w.document.querySelector('#native-rankings-dialog'),close=dialog.querySelector('button');icon(close,'关闭排行榜');close.click();assert.equal(dialog.open,false);dom.window.close();
});
test('grading progress X preserves resumable close result and the completed view action',async()=>{
 const {dom,w,execute}=fixture();execute('grading-progress.js');const result=w.GrowingGradingProgress.run({studentId:'s1',job:{id:'j1'},alive:()=>true,api:()=>new Promise(()=>{})});const dialog=w.document.querySelector('dialog'),close=dialog.querySelector('[data-close]');icon(close,'暂存并关闭');close.click();assert.equal(await result,null);assert.equal(dialog.isConnected,false);
 const done=w.GrowingGradingProgress.run({studentId:'s1',job:{id:'j2',revision:0},alive:()=>true,api:async()=>({id:'j2',revision:1,status:'complete',paperId:'p1',progressPercent:100})});await tick();const completed=w.document.querySelector('dialog [data-close]');icon(completed,'查看批改');completed.click();assert.equal((await done).paperId,'p1');dom.window.close();
});
