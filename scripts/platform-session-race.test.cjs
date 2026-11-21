const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../platform-web/app.js'),'utf8');
const implementation=source.slice(source.indexOf('  async function networkApi('),source.indexOf('  const prefix='));
function fixture(){
 let resolve;
 const ctx=vm.createContext({AbortController,TextEncoder,Error,TypeError,Promise,setTimeout,clearTimeout,clearInterval,
  base:'https://test.invalid',isNative:false,user:{id:'a'},token:'token-a',generation:1,timer:null,saveTimer:null,
  raw:{removeItem(){}},sessionKey:'session',auth(){},hint(){},fetch:()=>new Promise(r=>resolve=r)});
 vm.runInContext(implementation+';this.request=networkApi;',ctx);
 return {ctx,respond(){resolve({ok:false,status:401,text:async()=>'{"error":"expired"}'});}};
}
test('late unauthorized response for A does not sign out newly logged in B',async()=>{
 const f=fixture(),pending=f.ctx.request('/question-bank/papers?studentId=a');
 f.ctx.user={id:'b'};f.ctx.token='token-b';f.ctx.generation=2;
 f.respond();await assert.rejects(pending,/expired/);
 assert.equal(f.ctx.user?.id,'b');assert.equal(f.ctx.token,'token-b');assert.equal(f.ctx.generation,2);
});
test('unauthorized response for the current session still signs out',async()=>{
 const f=fixture(),pending=f.ctx.request('/question-bank/papers?studentId=a');
 f.respond();await assert.rejects(pending,/expired/);
 assert.equal(f.ctx.user,null);assert.equal(f.ctx.token,'');assert.equal(f.ctx.generation,2);
});
