const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const web=path.join(__dirname,'../app/src/main/assets/web/app-design'),H=require(path.join(web,'handwriting-core.js')),P=require(path.join(web,'fraction-paper-tasks.js'));
test('all supported handwriting units use real course knowledge IDs, titles and destinations',()=>{
  for(const file of ['math-data.js','physics-data.js'])for(const c of require(path.join(web,file)).chapters){
    assert.deepEqual(H.knowledgeUnits[c.id],Object.fromEntries(c.nodes.map(n=>[n.id,n.title])));
    for(const n of c.nodes){const url=new URL(H.knowledgeLink(n.id),'https://learn.test/learn/app-design/');assert.equal(url.searchParams.get('node'),n.id);assert.equal(url.searchParams.get('chapter'),c.id);assert.ok(fs.existsSync(path.join(web,url.pathname.split('/').at(-1))));}
  }
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(web,'english-lessons.js'),'utf8'),context);
  for(const [number,lessons]of Object.entries(context.window.GrowingEnglishLessons))for(const l of lessons){
    const id='eng'+number+'-'+l.id,url=new URL(H.knowledgeLink(id),'https://learn.test/learn/app-design/');assert.equal(H.knowledgeNodes[id],l.title);assert.equal(url.searchParams.get('node'),'lesson:'+l.id);assert.equal(url.searchParams.get('unit'),'english-8a-0'+number);
  }
  for(const subject of ['math','physics','english'])for(const unit of H.units(subject))assert.ok(Object.keys(H.knowledgeUnits[unit]).length,unit);
  assert.equal(H.knowledgeLink('invented'),null);
});
test('direct-image results preserve originals without transcription; revisions invalidate evidence and legacy confirmation remains required',()=>{
  const task=P.tasks.find(t=>t.nodes.includes('add'));
  const d=H.create('math','math-8b-10',task.prompt);d.pages=[[{tool:'pen',width:4,points:[[20,40,.5],[80,50,.7]]}]];
  const g={source:'handwriting',corrections:[{location:'第1页第2步',issue:'漏减号',correction:'括号内每项变号'}],revision:0,at:d.updatedAt,score:65,parts:[15,20,20,10],feedback:'注意符号',needsReview:false,knowledge:task.nodes.map(nodeId=>({nodeId,score:45,feedback:'第2步符号错误'}))};
  d.grades=[g];assert.ok(H.validate(d));assert.equal(d.recognition,null);assert.equal(H.evidence([d],P.tasks).length,task.nodes.length);
  const legacy=structuredClone(d);delete legacy.grades[0].source;delete legacy.grades[0].corrections;assert.ok(H.validate(legacy));assert.deepEqual(H.evidence([legacy],P.tasks),[]);
  H.change(d);assert.ok(H.validate(d));assert.deepEqual(H.evidence([d],P.tasks),[]);assert.equal(d.grades[0].revision,0);
  for(const patch of [{source:'text'},{corrections:undefined},{knowledge:[]},{knowledge:[{nodeId:'phy-speed',score:30,feedback:'错误课程'}]},{corrections:[{location:'',issue:'错',correction:'改'}]}]){const bad=structuredClone(d);bad.grades[0]={...g,...patch};assert.equal(H.validate(bad),false);}
});
test('math, physics and English direct grades persist the matching knowledge while uncertain originals never earn a score',()=>{
  for(const [subject,unit,nodeId]of [['math','math-8a-03','pythagoras'],['physics','physics-8a-05','phy-speed'],['english','english-8a-01','eng1-forms']]){
    const d=H.create(subject,unit,'完整题目');const g={revision:0,at:d.updatedAt,source:'handwriting',score:100,parts:subject==='english'?[25,20,35,20]:[20,30,30,20],needsReview:false,feedback:'原稿作答正确',corrections:[],knowledge:[{nodeId,score:100,feedback:'本题正确使用此知识点'}]};
    d.grades=[g];assert.ok(H.validate(d));
    d.grades=[{...g,needsReview:true,score:null,parts:null}];assert.equal(H.validate(d),false);
    delete d.grades[0].knowledge;assert.ok(H.validate(d));
    d.grades[0].score=0;assert.equal(H.validate(d),false);
  }
});
