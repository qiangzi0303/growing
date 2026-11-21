const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'../app/src/main/assets/web/app-design');
const data=require(path.join(base,'english-word-pilot-data.js'));
const vocabulary={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(base,'english-vocabulary.js'),'utf8'),vocabulary);
test('pilot uses exactly ten required Unit 1 textbook words',()=>{
  assert.equal(data.version,1);assert.equal(data.unitId,'english-8a-01');
  assert.deepEqual(data.words.map(w=>w.word).sort(),['friendship','honest','cheerful','truth','joke','humorous','caring','patient','laugh','unhappy'].sort());
  for(const w of data.words){
    assert.equal(w.id,w.word);
    const entry=vocabulary.window.GrowingEnglishVocabulary[1].find(v=>v.word===w.word);
    assert(entry&&!entry.optional,w.word+' must be required');
    for(const field of ['pos','meaning','ipa','scene','example','translation','collocation','tip','cloze','reviewCloze','art'])assert.equal(typeof w[field],'string',w.word+': '+field);
    assert(w.example.includes(w.word));
    for(const field of ['cloze','reviewCloze']){
      assert.equal((w[field].match(/___/g)||[]).length,1,w.word+': '+field);
      assert(!new RegExp('\\b'+w.word+'\\b','i').test(w[field]),'cue must hide answer');
    }
    assert.notEqual(w.cloze,w.reviewCloze,'review needs another context');
  }
  assert.equal(data.words.find(w=>w.word==='patient').pos,'adj.');
  assert.match(data.words.find(w=>w.word==='patient').meaning,/耐心/);
});
test('every word has a distinct local scene and Word Atlas artwork keeps its source',()=>{
  const scenes=new Set();
  for(const w of data.words){
    const ext=w.artSource?'.webp':'.svg';
    assert.equal(w.art,'word-pilot-scenes/'+w.id+ext);
    const content=fs.readFileSync(path.join(base,w.art));
    if(w.artSource){
      assert.equal(w.artSource,'https://github.com/designfuchen/word-atlas/blob/main/public/atlas/img/'+w.id+'.webp');
      assert.equal(content.toString('ascii',0,4),'RIFF');
      assert.equal(content.toString('ascii',8,12),'WEBP');
    }else{
      const svg=content.toString('utf8');
      assert.match(svg,/<svg\b/);assert.match(svg,/viewBox="0 0 480 320"/);
      assert(!/href=|<script\b|<foreignObject\b/i.test(svg));
      assert(!new RegExp('\\b'+w.word+'\\b','i').test(svg));
    }
    const hash=require('node:crypto').createHash('sha256').update(content).digest('hex');
    assert(!scenes.has(hash));scenes.add(hash);
  }
});
test('data works as a standalone browser script',()=>{
  const browser={};vm.runInNewContext(fs.readFileSync(path.join(base,'english-word-pilot-data.js'),'utf8'),browser);
  assert.equal(browser.GrowingWordPilotData.words.length,10);
});
