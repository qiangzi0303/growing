const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const web=path.join(__dirname,'../app/src/main/assets/web/app-design');
const S=require(path.join(web,'unit-summary-core.js')),D=require(path.join(web,'diagnosis-engine.js')),M=require(path.join(web,'math-data.js')),P=require(path.join(web,'physics-data.js')),E=require(path.join(web,'english-engine.js'));
const context=vm.createContext({window:{}});for(const file of ['english-vocabulary.js','english-lessons.js','unit-summary-legacy.js','curriculum.js'])vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),context);
const C=context.window;
function summarize(chapter=M.chapters[0],data=M,documents={}){const before=JSON.stringify(documents),read=key=>Object.hasOwn(documents,key)?documents[key]:null,out=S.math({subject:data===M?'math':'physics',chapter,data,read,diagnosis:D});assert.equal(JSON.stringify(documents),before);return out;}
function session(data,chapter,choices){const g=D.graph(data);let s=D.createAssessment(g,chapter.nodes.map(n=>n.id));while(D.inspect(g,s).next){const {question,attempt}=D.inspect(g,s).next;s=D.answer(g,s,question.id,choices(question,attempt));}return s;}
test('all 24 verified units enumerate unique real nodes without counting reading or rewards',()=>{
  let count=0;
  for(const [subject,course] of Object.entries(C.GrowingCurriculum))for(const book of Object.values(course.terms))if(book.verified)for(const u of book.units){count++;let out;if(subject==='english')out=u.number===3?S.legacyEnglish({data:C.GrowingSummaryLegacy,raw:null,engine:E}):S.english({words:C.GrowingEnglishVocabulary[u.number],lessons:C.GrowingEnglishLessons[u.number],raw:null,engine:E});else{const data=subject==='math'?M:P;out=summarize(data.chapters.find(c=>c.id===u.id),data,{['growing-unit-rewards-v1:'+u.id]:{done:100,total:100}});}assert.ok(out.rows.length);assert.equal(new Set(out.rows.map(n=>n.id)).size,out.rows.length);assert.ok(out.rows.every(n=>n.status==='untested'));}
  assert.equal(count,24);
});
test('diagnosis outcomes distinguish weak, shaky, untested and partial evidence',()=>{
  const chapter=M.chapters[0],g=D.graph(M),ids=chapter.nodes.slice(0,3).map(n=>n.id);let s=D.createAssessment(g,ids);
  while(D.inspect(g,s).next){const {question,attempt}=D.inspect(g,s).next;const i=ids.indexOf(question.topic),correct=i===2||i===1&&attempt===2;s=D.answer(g,s,question.id,correct?question.answer:(question.answer+1)%4);}
  const key='growing-diagnosis-year8-v1:'+chapter.id,rows=summarize(chapter,M,{[key]:s}).rows;
  assert.equal(rows.find(n=>n.id===ids[0]).status,'weak');assert.equal(rows.find(n=>n.id===ids[1]).status,'shaky');assert.equal(rows.find(n=>n.id===ids[2]).status,'passed');assert.equal(rows.at(-1).status,'untested');
  let partial=D.createAssessment(g,[ids[0]]);partial=D.answer(g,partial,D.inspect(g,partial).next.question.id,0);assert.equal(summarize(chapter,M,{[key]:partial}).rows[0].status,'pending');
});
test('latest failed diagnosis overrides historical best and past course mastery',()=>{
  const c=M.chapters[0],good=session(M,c,q=>q.answer),bad=session(M,c,q=>(q.answer+1)%4),records=Object.fromEntries(c.nodes.map(n=>[n.id,good]));
  const out=summarize(c,M,{['growing-diagnosis-v1:'+c.id]:{version:1,records},['growing-diagnosis-year8-v1:'+c.id]:bad});assert.ok(out.rows.every(n=>n.status==='weak'));
});
test('real course evidence requires both concept and practice; reading is untested',()=>{
  const c=P.chapters[0],a={score:8,criticalErrors:[],feedback:'valid'},topics=Object.fromEntries(c.nodes.map((n,i)=>[n.id,{seen:true,draft:'read',self:[],attempts:i<2?[a]:[],bestQuiz:i===0?3:i===2?2:0}]));
  const out=summarize(c,P,{'growing-physics-lessons-v1':{version:1,topics}});assert.equal(out.rows[0].status,'passed');assert.equal(out.rows[1].status,'shaky');assert.equal(out.rows[2].status,'shaky');assert.equal(out.rows[3].status,'untested');
});
test('unreadable course data is not silently marked untested and no writes occur',()=>{
  const c=M.chapters[0],out=summarize(c,M,{'growing-math-lessons-v1':{version:99}});assert.ok(out.rows.every(n=>n.status==='unknown'));assert.ok(out.warnings.length);
});
test('fraction graph aliases read the existing domain and extra classroom records',()=>{
  const c=M.chapters.find(c=>c.id==='math-8b-10'),r={attempts:[{valid:true,score:9,criticalErrors:[]}],exams:[{real:false,correct:3,total:3}]};
  const rows=summarize(c,M,{'fraction-minute-v1':{topics:{domain:r,extra:r}}}).rows;
  assert.equal(rows.find(n=>n.id==='meaning').status,'passed');assert.equal(rows.find(n=>n.id==='extraneous').status,'passed');
});
test('English validates answers and excludes optional words',()=>{
  const words=C.GrowingEnglishVocabulary[1],lessons=C.GrowingEnglishLessons[1],w=words.find(w=>!w.optional),l=lessons[0];
  const raw={version:1,words:{[w.id]:{protocol:'seven-recalls',answers:Array(7).fill(w.word)}},lessons:{[l.id]:{protocol:'three-correct',answers:l.questions.map(q=>q.answer)}}};
  let out=S.english({words,lessons,raw,engine:E});assert.equal(out.rows.filter(n=>n.status==='passed').length,2);assert.equal(out.rows.length,words.filter(w=>!w.optional).length+lessons.length);
  raw.words[w.id].answers[0]='incorrect';out=S.english({words,lessons,raw,engine:E});assert.equal(out.rows.find(n=>n.id==='word:'+w.id).status,'untested');
});
test('legacy Unit 3 reports failed and unfinished recalls and preserves old criteria',()=>{
  const data=C.GrowingSummaryLegacy,w=data.words[0],w2=data.words[1],l=data.lessons[0],raw={wordRuns:{[w.id]:{phase:'result',answers:['wrong',...Array(6).fill(w.en)]},[w2.id]:{phase:'recall',answers:[w2.en]}},records:[{mode:'lesson',id:l.id,score:0,total:10}],best:{[l.id]:90}};
  const rows=S.legacyEnglish({data,raw,engine:E}).rows;assert.equal(rows.find(n=>n.id==='word:'+w.id).status,'shaky');assert.equal(rows.find(n=>n.id==='word:'+w2.id).status,'pending');assert.equal(rows.find(n=>n.id==='lesson:'+l.id).status,'weak');
});
