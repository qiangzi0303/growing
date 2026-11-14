import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
test('legacy review copies session originals into persistent per-student storage and prefers existing local',async t=>{
 const dom=new JSDOM('<main><section data-workbench></section></main>',{url:'https://test.invalid',runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window,key='growing-photo-review-v1:student-a',old=JSON.stringify({q:{handwriting:{pages:[[]],photos:['data:image/png;base64,b2xk']}}});
 w.sessionStorage.setItem(key,old);w.GrowingMathFormat={};w.eval(await readFile(new URL('../../platform-web/photo-review.js',import.meta.url),'utf8'));
 const create=id=>w.GrowingPhotoReview.createLegacy(w.document.querySelector('main'),async()=>{},s=>s,()=>true,id,async()=>{},{dispose(){}});
 let c=create('student-a');assert.equal(w.localStorage.getItem(key),old);assert.equal(w.sessionStorage.getItem(key),old);c.dispose();
 w.localStorage.setItem(key,'{}');c=create('student-a');assert.equal(w.localStorage.getItem(key),'{}');assert.equal(w.sessionStorage.getItem(key),old);c.dispose();
 c=create('student-b');assert.equal(w.localStorage.getItem('growing-photo-review-v1:student-b'),null);c.dispose();
});
