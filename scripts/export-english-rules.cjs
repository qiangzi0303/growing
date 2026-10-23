const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),web=path.join(root,'app/src/main/assets/web/app-design'),context=vm.createContext({window:{}});
for(const file of ['english-vocabulary.js','english-lessons.js'])vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),context,{filename:file});
const rules=Object.fromEntries(Object.entries(context.window.GrowingEnglishVocabulary).map(([number,words])=>['english-8a-'+number.padStart(2,'0'),{
  words:words.filter(w=>!w.optional).map(w=>({id:w.id,word:w.word})),lessons:(context.window.GrowingEnglishLessons[number]||[]).map(l=>({id:l.id,answers:l.questions.map(q=>q.answer)}))
}]));
const legacy=vm.createContext({window:{}}),fraction=fs.readFileSync(path.join(root,'app/src/main/assets/web/fraction-ops/分式作战_一分钟学习版.html'),'utf8');
const fractionScript=[...fraction.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)][0][1];
vm.runInContext(fractionScript.slice(0,fractionScript.indexOf('window.MINUTE_LESSONS')),legacy);
const wordHtml=fs.readFileSync(path.join(root,'app/src/main/assets/web/word-ops-unit3/index.html'),'utf8');
vm.runInContext([...wordHtml.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)][0][1],legacy);
const unit=legacy.window.UNIT3;
rules.__legacy={fractionTopics:legacy.window.MINUTE_DATA.topics.map(t=>t.id),words:unit.words.map(w=>({id:w.id,word:w.en})),
  seenIds:[...unit.words.map(w=>w.id),...unit.lessons.flatMap(l=>l.cards.map(c=>c.id))],tests:[...unit.groups,...unit.lessons].map(l=>l.id)};
const math=require(path.join(web,'math-data.js')),physics=require(path.join(web,'physics-data.js'));
const diagnosis=Object.fromEntries(Object.entries({math,physics}).map(([name,data])=>[name,{
  version:data.version,nodes:data.nodes.map(({id,title,criterion})=>({id,title,criterion})),edges:data.edges,questions:data.questions
}]));
const diagnosisTarget=path.join(root,'cloudflare/src/diagnosis-rules.json'),diagnosisOutput=JSON.stringify(diagnosis,null,2)+'\n';
if(!fs.existsSync(diagnosisTarget)||fs.readFileSync(diagnosisTarget,'utf8')!==diagnosisOutput)fs.writeFileSync(diagnosisTarget,diagnosisOutput);
vm.runInContext(fs.readFileSync(path.join(web,'curriculum.js'),'utf8'),context);
const curriculum=context.window.GrowingCurriculum,ranking=[];
for(const [subject,course] of Object.entries(curriculum))for(const [term,book] of Object.entries(course.terms)){
  if(!book.verified)continue;
  for(const u of book.units){
    const row={id:u.id,title:u.title,subject,subjectName:course.name,term,termName:book.name};
    if(subject==='english')Object.assign(row,u.number===3?{kind:'legacy-english',topics:unit.topics.map(t=>t.id),tests:rules.__legacy.tests}:{kind:'english',rules:rules[u.id]});
    else if(u.id==='math-8b-10')Object.assign(row,{kind:'fraction',topics:rules.__legacy.fractionTopics});
    else Object.assign(row,{kind:subject,topics:(subject==='math'?math:physics).chapters.find(c=>c.id===u.id).nodes.map(n=>n.id)});
    ranking.push(row);
    if(subject!=='english')row.diagnosisTopics=(subject==='math'?math:physics).chapters.find(c=>c.id===u.id).nodes.map(n=>n.id);
  }
}
const rankingTarget=path.join(root,'cloudflare/src/ranking-rules.json'),rankingOutput=JSON.stringify(ranking,null,2)+'\n';
if(!fs.existsSync(rankingTarget)||fs.readFileSync(rankingTarget,'utf8')!==rankingOutput)fs.writeFileSync(rankingTarget,rankingOutput);
const target=path.join(root,'cloudflare/src/english-rules.json'),output=JSON.stringify(rules,null,2)+'\n';
if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)fs.writeFileSync(target,output);
console.log('English reporting rules exported from packaged lessons.');
