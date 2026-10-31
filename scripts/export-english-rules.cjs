const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),web=path.join(root,'app/src/main/assets/web/app-design'),context=vm.createContext({window:{}});
const wordRules=require(path.join(web,'word-mastery-rules.js'));
for(const file of ['english-vocabulary.js','english-lessons.js'])vm.runInContext(fs.readFileSync(path.join(web,file),'utf8'),context,{filename:file});
const rules=Object.fromEntries(Object.entries(context.window.GrowingEnglishVocabulary).map(([number,words])=>['english-8a-'+number.padStart(2,'0'),{
  words:words.filter(w=>!w.optional).map(w=>wordRules.describe(w)),lessons:(context.window.GrowingEnglishLessons[number]||[]).map(l=>({id:l.id,answers:l.questions.map(q=>q.answer)}))
}]));
const legacy=vm.createContext({window:{}}),fraction=fs.readFileSync(path.join(root,'app/src/main/assets/web/fraction-ops/分式作战_一分钟学习版.html'),'utf8');
const fractionScript=[...fraction.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)][0][1];
vm.runInContext(fractionScript.slice(0,fractionScript.indexOf('window.MINUTE_LESSONS')),legacy);
const wordHtml=fs.readFileSync(path.join(root,'app/src/main/assets/web/word-ops-unit3/index.html'),'utf8');
vm.runInContext([...wordHtml.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)][0][1],legacy);
const unit=legacy.window.UNIT3;
const summaryLegacy={words:unit.words.map(({id,en,cn,pos})=>({id,en,cn,pos})),lessons:unit.lessons.map(({id,title})=>({id,title}))};
const summaryTarget=path.join(web,'unit-summary-legacy.js'),summaryOutput='/* Generated from the original Unit 3 classroom. */\nwindow.GrowingSummaryLegacy='+JSON.stringify(summaryLegacy)+';\n';
if(!fs.existsSync(summaryTarget)||fs.readFileSync(summaryTarget,'utf8')!==summaryOutput)fs.writeFileSync(summaryTarget,summaryOutput);
rules.__legacy={fractionTopics:legacy.window.MINUTE_DATA.topics.map(t=>t.id),words:unit.words.map(w=>wordRules.describe(w)),
  seenIds:[...unit.words.map(w=>w.id),...unit.lessons.flatMap(l=>l.cards.map(c=>c.id))],tests:[...unit.groups,...unit.lessons].map(l=>l.id)};
const math=require(path.join(web,'math-data.js')),physics=require(path.join(web,'physics-data.js'));
const diagnosis=Object.fromEntries(Object.entries({math,physics}).map(([name,data])=>[name,{
  version:data.version,nodes:data.nodes.map(({id,title,criterion})=>({id,title,criterion})),edges:data.edges,questions:data.questions
}]));
const diagnosisTarget=path.join(root,'cloudflare/src/diagnosis-rules.json'),diagnosisOutput=JSON.stringify(diagnosis,null,2)+'\n';
if(!fs.existsSync(diagnosisTarget)||fs.readFileSync(diagnosisTarget,'utf8')!==diagnosisOutput)fs.writeFileSync(diagnosisTarget,diagnosisOutput);
vm.runInContext(fs.readFileSync(path.join(web,'curriculum.js'),'utf8'),context);
const curriculum=context.window.GrowingCurriculum,ranking=[];
const questionUnits=[];
for(const [subject,course] of Object.entries(curriculum))for(const [term,book] of Object.entries(course.terms)){
  if(!book.verified)continue;
  for(const u of book.units){
    questionUnits.push({id:u.id,title:u.title,subject,subjectName:course.name,termName:book.name,summary:u.summary,outline:u.outline});
    const row={id:u.id,title:u.title,subject,subjectName:course.name,term,termName:book.name};
    if(subject==='english')Object.assign(row,u.number===3?{kind:'legacy-english',topics:unit.topics.map(t=>t.id),tests:rules.__legacy.tests}:{kind:'english',rules:rules[u.id]});
    else if(u.id==='math-8b-10')Object.assign(row,{kind:'fraction',topics:rules.__legacy.fractionTopics});
    else Object.assign(row,{kind:subject,topics:(subject==='math'?math:physics).chapters.find(c=>c.id===u.id).nodes.map(n=>n.id)});
    ranking.push(row);
    if(subject!=='english')row.diagnosisTopics=(subject==='math'?math:physics).chapters.find(c=>c.id===u.id).nodes.map(n=>n.id);
  }
}
const questionTarget=path.join(root,'cloudflare/src/question-unit-rules.json'),questionOutput=JSON.stringify(questionUnits,null,2)+'\n';
if(!fs.existsSync(questionTarget)||fs.readFileSync(questionTarget,'utf8')!==questionOutput)fs.writeFileSync(questionTarget,questionOutput);
const rankingTarget=path.join(root,'cloudflare/src/ranking-rules.json'),rankingOutput=JSON.stringify(ranking,null,2)+'\n';
if(!fs.existsSync(rankingTarget)||fs.readFileSync(rankingTarget,'utf8')!==rankingOutput)fs.writeFileSync(rankingTarget,rankingOutput);
const target=path.join(root,'cloudflare/src/english-rules.json'),output=JSON.stringify(rules,null,2)+'\n';
if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)fs.writeFileSync(target,output);
vm.runInContext(fs.readFileSync(path.join(web,'math-wrong-questions-transcribed.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(web,'math-wrong-questions-data.js'),'utf8'),context);
const wrongTarget=path.join(root,'cloudflare/src/math-wrong-question-rules.json');
const wrongOutput=JSON.stringify(context.window.GrowingMathWrongQuestions.questions.map(({id,unitId,title,number})=>({id,unitId,title,number})),null,2)+'\n';
if(!fs.existsSync(wrongTarget)||fs.readFileSync(wrongTarget,'utf8')!==wrongOutput)fs.writeFileSync(wrongTarget,wrongOutput);
const titles={};
for(const data of [math,physics])for(const n of data.nodes)titles[n.id]=n.title;
for(const [number,lessons] of Object.entries(context.window.GrowingEnglishLessons))for(const l of lessons)titles['english-8a-'+number.padStart(2,'0')+':'+l.id]=l.title;
for(const t of legacy.window.MINUTE_DATA.topics)titles['fraction:'+t.id]=t.title;
const titleTarget=path.join(root,'cloudflare/src/knowledge-titles.json'),titleOutput=JSON.stringify(titles,null,2)+'\n';
if(!fs.existsSync(titleTarget)||fs.readFileSync(titleTarget,'utf8')!==titleOutput)fs.writeFileSync(titleTarget,titleOutput);
console.log('English reporting rules and knowledge topic titles exported from packaged lessons.');
