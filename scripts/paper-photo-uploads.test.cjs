const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{randomUUID}=require('node:crypto');
const C=require('../app/src/main/assets/web/app-design/handwriting-core.js');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/web/app-design/paper-photo-uploads.js'),'utf8');
const photo='data:image/jpeg;base64,/9j/dGVzdA==',file={type:'image/jpeg',size:100};
function setup({decode=async()=>{},active=()=>true}={}){
 const data=new Map();let fail=false,revoked=0;
 const storage={get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem(k,v){if(fail)throw Error('quota exceeded');data.set(k,v);}};
 const ctx={GrowingHandwriting:C,crypto:{randomUUID},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++},Image:class {naturalWidth=800;naturalHeight=1000;decode=decode;},document:{createElement:()=>({getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=>photo})}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const paper={id:'paper-a',questions:[{n:16,type:'solution',prompt:'Prove AB=AC'},{n:17,type:'solution',prompt:'Prove AB=AC'},{n:1,type:'choice',prompt:'Choose'}]};
 const create=(p=paper)=>ctx.GrowingPaperPhotoUploads.create({storage,paper:p,unitFor:()=> 'math-8a-01',active});
 return {data,storage,paper,create,api:create(),fail:()=>fail=true,revoked:()=>revoked};
}
test('each upload is a real schema-valid independent original; old bytes never change',async()=>{
 const s=setup(),a=await s.api.upload(16,file),before=s.data.get(a.key),b=await s.api.upload(16,file);
 assert.notEqual(a.key,b.key);assert(C.KEY.test(a.key));assert(C.validate(JSON.parse(before)));assert.equal(JSON.parse(before).revision,1);assert.equal(s.data.get(a.key),before);
 assert.equal(s.api.list(16).length,2);assert.deepEqual(Array.from(s.api.get(16,a.key).photos),[photo]);assert.equal(s.revoked(),2);
});
test('history is isolated by question, paper, unit and exact prompt',async()=>{
 const s=setup(),a=await s.api.upload(16,file);assert.equal(s.api.get(17,a.key),null);assert.equal(s.api.list(17).length,0);
 const other=s.create({...s.paper,id:'paper-b'});assert.equal(other.get(16,a.key),null);assert.equal(other.list(16).length,0);
 const changed=s.create({...s.paper,questions:[{n:16,type:'solution',prompt:'Changed'}]});assert.equal(changed.get(16,a.key),null);
 const doc=JSON.parse(s.data.get(a.key));doc.unitId='math-8a-02';s.data.set(a.key,JSON.stringify(doc));assert.equal(s.api.get(16,a.key),null);
});
test('quota failure leaves every existing upload intact',async()=>{
 const s=setup(),a=await s.api.upload(16,file),before=s.data.get(a.key);s.fail();await assert.rejects(s.api.upload(16,file),/quota/);assert.equal(s.data.size,1);assert.equal(s.data.get(a.key),before);assert.equal(s.api.list(16).length,1);
});
test('account change while decoding aborts persistence and releases image URL',async()=>{
 let finish,active=true;const s=setup({active:()=>active,decode:()=>new Promise(r=>finish=r)}),pending=s.api.upload(16,file);active=false;finish();await assert.rejects(pending,/账号已切换/);assert.equal(s.data.size,0);assert.equal(s.revoked(),1);assert.throws(()=>s.api.list(16),/账号已切换/);
});
test('invalid images and non-solution questions create no records',async()=>{
 const s=setup();await assert.rejects(s.api.upload(1,file),/题目不存在/);await assert.rejects(s.api.upload(16,{type:'text/plain',size:10}),/照片/);await assert.rejects(s.api.upload(16,{type:'image/png',size:21*1024*1024}),/照片/);assert.equal(s.data.size,0);
});
test('corrupt unrelated storage cannot masquerade as an upload record',async()=>{
 const s=setup();s.data.set('unrelated','{broken');s.data.set(C.PREFIX+randomUUID(),'{broken');assert.equal(s.api.list(16).length,0);assert.equal(s.data.size,2);
});
