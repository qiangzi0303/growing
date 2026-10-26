const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../app/src/main/assets/web/app-design/english-visual-data.js');
test('both reference topics have complete unique vocabulary and examples',()=>{
  assert.equal(M.words.filter(w=>w.group==='space').length,17);
  assert.equal(M.words.filter(w=>w.group==='motion').length,16);
  assert.equal(new Set(M.words.map(w=>w.id)).size,33);
  for(const w of M.words){assert(w.zh&&w.sentence&&w.translation&&w.hint);assert.match(M.svg(w),/^<svg /);}
});
test('spatial motion distinguishes static location, surfaces, entry and exit',()=>{
  const p=M.spatialPosition;
  assert.equal(p('on',.5).y+24,192);
  assert(p('above',.5).y+24<175);
  assert(p('under',.5).y-24>206);
  assert(p('below',.5).y-24>190);
  assert(p('into',0).x<288&&p('into',1).x>288&&p('into',1).x<412);
  assert(p('out-of',0).x>288&&p('out-of',1).x<288);
  assert(p('over',.5).y+24<225);
  assert(p('across',0).x<260&&p('across',1).x>380);
  assert(p('through',0).x<260&&p('through',1).x>380);
  assert(Math.abs(350-p('towards',0).x)>Math.abs(350-p('towards',1).x));
  assert(Math.abs(350-p('away-from',0).x)<Math.abs(350-p('away-from',1).x));
  for(const id of ['in','on','under','above','below','beside','between','among'])assert.deepEqual(p(id,0),p(id,1));
  assert.deepEqual(p('around',0),p('around',1));
});
test('gaits encode distinct stride, clearance, symmetry and direction',()=>{
  const word=id=>M.words.find(w=>w.id===id),g=(id,t)=>M.gait(word(id),t);
  assert(word('stride').profile.stride>word('walk').profile.stride);
  assert(word('shuffle').profile.lift<word('walk').profile.lift);
  assert(word('march').profile.lift>word('walk').profile.lift);
  assert(word('sprint').profile.cycles>word('jog').profile.cycles);
  assert(g('skip',.0625).hop>30);
  assert(Math.abs(g('limp',.18).left.x)!==Math.abs(g('limp',.18).right.x));
  assert(g('wander',.25).x>g('wander',.75).x);
  assert.equal(new Set(M.words.filter(w=>w.profile).map(w=>JSON.stringify(w.profile))).size,16);
});
test('all SVG scenes and poses remain finite across boundaries and animation phases',()=>{
  for(const w of M.words)for(const t of [0,.1,.25,.5,.75,.9,1,NaN]){
    const svg=M.svg(w,t,'test-'+w.id);
    assert(!/NaN|Infinity|undefined/.test(svg),w.id);
    for(const n of Object.values(M.spatialPosition(w.id,t)))assert(Number.isFinite(n));
  }
  assert.throws(()=>M.svg('unknown'));
});
