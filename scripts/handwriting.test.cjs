const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../app/src/main/assets/web/app-design/handwriting-core.js'),S=require('../platform-web/sync-core.js');
const T=require('../app/src/main/assets/web/app-design/handwriting-tasks.js');
test('every verified curriculum unit has distinct subject-specific handwritten tasks',()=>{
  const vm=require('node:vm'),fs=require('node:fs'),context={window:{}};
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app/src/main/assets/web/app-design/curriculum.js'),'utf8'),context);
  const all=new Set(),ids=new Set();let count=0;
  for(const subject of ['math','physics','english']){
    const supported=Object.values(context.window.GrowingCurriculum[subject].terms).filter(t=>t.verified).flatMap(t=>t.units.map(u=>u.id));
    assert.deepEqual([...supported].sort(),C.units(subject).sort());
    for(const unit of supported){
      const tasks=T.forUnit(subject,unit).filter(t=>!t.source);assert.ok(tasks.length>=2,unit);
      for(const task of tasks){
        assert.ok(task.title.length>3&&task.prompt.length>70&&task.prompt.length<=6000,task.id);
        assert.ok(!ids.has(task.id)&&!all.has(task.prompt),'tasks must not repeat across units');ids.add(task.id);all.add(task.prompt);
        assert.ok(!/待补充|待核对|TODO/.test(task.prompt));
        if(subject==='english')assert.match(task.prompt,/80—100词/);else assert.match(task.prompt,/（1）/);
        const d=C.create(subject,unit,task.prompt);assert.ok(C.validate(d));
        assert.equal(d.mode,subject==='english'?'essay':'solution');
        assert.equal(JSON.parse(JSON.stringify(d)).prompt,task.prompt);count++;
      }
    }
  }
  assert.equal(count,48);
});
test('unverified or mismatched units never borrow questions from another subject or book',()=>{
  for(const [subject,unit] of [['english','english-8b-01'],['physics','physics-8b-01'],['math','english-8a-01'],['other','math-8a-01']])assert.deepEqual(T.forUnit(subject,unit),[]);
});
const make=()=>{const d=C.create('math','math-8a-01','求解并说明理由');d.pages[0].push({tool:'pen',width:4,points:[[10,20,.2],[30,50,.9]]});return d;};
test('original round-trips pressures, symbols and multiple pages without embedding credentials',()=>{
  const d=make();d.prompt='x² / √2 ≤ 3';d.pages.push([{tool:'eraser',width:28,points:[[10,30,1]]}]);
  assert.ok(C.validate(JSON.parse(JSON.stringify(d))));assert.equal(C.count(d),3);
  for(const mutate of [d=>d.apiKey='secret',d=>d.pages[0][0].url='https://bad.test',d=>d.pages[0][0].points[0][0]=-1,d=>d.pages[0][0].points[0][2]=NaN,d=>d.pages[0][0].width=400,d=>d.unitId='physics-8a-01',d=>d.mode='essay']){const d=make();mutate(d);assert.equal(C.validate(d),false);}
});
test('unbounded pages, point arrays and forged timestamps are rejected',()=>{
  const d=make();d.pages=Array.from({length:9},()=>[]);assert.equal(C.validate(d),false);
  d.pages=[[{tool:'pen',width:4,points:Array.from({length:C.MAX_POINTS+1},()=>[1,1,.5])}]];assert.equal(C.validate(d),false);
  d.pages=[[]];d.updatedAt='yesterday';assert.equal(C.validate(d),false);
});
test('editing invalidates recognition confirmation and leaves grades explicitly tied to an older revision',()=>{
  const d=make();d.recognition={revision:0,text:'x=2',uncertain:[],confirmed:true};d.grades=[{revision:0,at:d.updatedAt,score:100,parts:[20,30,30,20],feedback:'正确',needsReview:false}];
  assert.ok(C.validate(d));C.change(d);assert.equal(d.recognition,null);assert.equal(d.grades[0].revision,0);assert.ok(C.validate(d));
  d.recognition={revision:0,text:'x=2',uncertain:[],confirmed:true};assert.equal(C.validate(d),false);
});
test('grades require actual numeric rubric parts, correct sum and review cases earn no score',()=>{
  const d=make(),g={revision:0,at:d.updatedAt,score:100,parts:[20,30,30,20],feedback:'点评',needsReview:false};
  d.grades=[g];assert.ok(C.validate(d));g.parts=[100,0,0,0];assert.equal(C.validate(d),false);
  g.parts=[20,30,30,19];assert.equal(C.validate(d),false);g.needsReview=true;assert.equal(C.validate(d),false);
  g.score=null;g.parts=null;assert.ok(C.validate(d));
  const essay=C.create('english','english-8a-01');essay.grades=[{...g,needsReview:false,score:100,parts:[25,20,35,20]}];assert.ok(C.validate(essay));
});
test('cloud sync accepts only precise original keys and never the vision configuration',()=>{
  const key=C.PREFIX+'12345678-1234-1234-1234-123456789abc';assert.ok(S.allowed(key));assert.equal(S.allowed('growing-vision-ai-v1'),false);
  assert.equal(S.allowed(C.PREFIX+'bad'),false);const v=JSON.stringify(make());assert.deepEqual(S.plan({[key]:v,'growing-vision-ai-v1':'secret'},{},{}).map(x=>x.key),[key]);
  assert.equal(S.plan({[key]:v},{[key]:{value:'other',revision:2}},{[key]:{value:'old',revision:1}})[0].type,'conflict');
});
