const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'../app/src/main/assets/web/app-design');
test('all Unit 1 textbook entries have an illustrated study card',()=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(base,'english-vocabulary.js'),'utf8'),context);
  const data=require(path.join(base,'english-word-study-data.js'));
  assert.equal(data.unitId,'english-8a-01');
  const words=context.window.GrowingEnglishVocabulary[1];
  assert.equal(data.words.length,words.length);
  assert.equal(new Set(data.words.map(w=>w.id)).size,words.length);
  const browser={};
  vm.runInNewContext(fs.readFileSync(path.join(base,'english-word-study-data.js'),'utf8'),browser);
  assert.equal(browser.GrowingEnglishWordStudyData.words.length,words.length);
  assert.equal(data.words.filter(w=>w.generated).length,14);
  for(const word of ['lie','patient','once','sense'])assert(data.words.find(w=>w.id===word).generated,'wrong-sense atlas art must not be reused: '+word);
  for(const original of words){
    const card=data.words.find(w=>w.id===original.id);
    assert(card,original.id);
    assert.equal(card.word,original.word);
    for(const key of ['art','scene','example','translation','collocation']) assert(card[key]?.trim(),`${original.id}: ${key}`);
    assert.match(card.art,/^word-study-scenes\/[a-z0-9-]+\.webp$/);
    const bytes=fs.readFileSync(path.join(base,card.art));
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert(Boolean(card.generated)!==Boolean(card.artSource),original.id+' has exactly one provenance');
    if(card.artSource)assert.match(card.artSource,/^https:\/\/github.com\/designfuchen\/word-atlas\/blob\/main\/public\/atlas\/img\/.+\.webp$/);
  }
});

test('all eight units register complete isolated illustrated cards without replacing Unit 1',()=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(base,'english-vocabulary.js'),'utf8'),context);
  const html=fs.readFileSync(path.join(base,'../word-ops-unit3/index.html'),'utf8');
  const unit3=html.match(/<script data-source="data\.js">([\s\S]*?)<\/script>/);
  assert.ok(unit3,'original Unit 3 data script');
  vm.runInNewContext(unit3[1],context);
  const originals={...context.window.GrowingEnglishVocabulary,3:context.window.UNIT3.words.map(w=>({id:w.id,word:w.en}))};
  const browser={};
  vm.runInNewContext(fs.readFileSync(path.join(base,'english-word-study-data.js'),'utf8'),browser);
  const unit1=browser.GrowingEnglishWordStudyData;
  for(const file of ['english-word-study-units-245.js','english-word-study-units-3678.js']){
    vm.runInNewContext(fs.readFileSync(path.join(base,file),'utf8'),browser);
  }
  assert.equal(browser.GrowingEnglishWordStudyData,unit1);
  assert.equal(unit1.words.length,52);
  const sets={...unit1.units,[unit1.unitId]:unit1};
  for(const [number,words] of Object.entries(originals)){
    const id='english-8a-'+String(number).padStart(2,'0'),data=sets[id];
    assert.ok(data,id);assert.equal(data.words.length,words.length,id);
    assert.equal(new Set(data.words.map(w=>w.id)).size,words.length,id);
    for(const word of words){
      const card=data.words.find(c=>c.id===word.id);assert.ok(card,id+'/'+word.id);
      assert.equal(card.word,word.word);
      for(const field of ['art','scene','example','translation','collocation'])assert.ok(card[field]?.trim(),id+'/'+word.id+': '+field);
      assert.match(card.art,/^word-study-scenes\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.webp$/);
      const bytes=fs.readFileSync(path.join(base,card.art));
      assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
      assert.ok(Boolean(card.generated)!==Boolean(card.artSource),id+'/'+word.id+' provenance');
    }
  }
});
