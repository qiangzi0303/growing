/* Read-only catalogue adapter. Existing course engines own all score rules. */
(()=>{
 'use strict';
 const root=window,version='flat-classroom-2';
 const has=(object,key)=>object&&Object.hasOwn(object,key);
 const catalogHref=(subject,term)=>'units.html?'+new URLSearchParams({subject,term,v:version});
 function create({page='catalog',params=new URLSearchParams(),read=()=>null}={}){
  const subject=params.get('subject')||'math',term=params.get('term')||'upper';
  const course=has(root.GrowingCurriculum,subject)?root.GrowingCurriculum[subject]:null;
  const book=has(course?.terms,term)?course.terms[term]:null;
  const error=()=>({kind:'error',title:'没有找到这个学习目录',description:'请从学科入口重新选择。',backHref:'index.html'});
  if(!book)return error();
  const graph=subject==='math'||subject==='physics';
  const label=unit=>graph?`第 ${unit.number} 章`:`Unit ${unit.number}`;
  const state=unit=>!book.verified?'目录待核对':unit.entry?'可学习':'内容筹备中';
  const studyHref=unit=>'study.html?'+new URLSearchParams({subject,term,unit:unit.id,v:version});
  const common={subject,subjectName:course.name,term,termName:book.name,edition:book.edition||course.edition,verified:!!book.verified,backHref:catalogHref(subject,term)};
  function mastery(unit){
   if(subject==='english'){
    const legacy=unit.number===3,raw=read(legacy?'wordops_8A_unit3':'growing-english-course-v1:'+unit.id);
    const sentences=root.SentenceDemo.units[unit.id].topics.flatMap(topic=>topic.sentences);
    return root.GrowingEnglishScore.summary(legacy?root.GrowingSummaryLegacy.words:root.GrowingEnglishVocabulary[unit.number],legacy?raw?.mastered:raw?.words,sentences,read('growing-english-sentences-v1:'+unit.id),legacy).score;
   }
   const ids=Object.keys(root.GrowingHandwriting.knowledgeUnits[unit.id]||{});
   if(!graph||!ids.length){
    const raw=read('growing-unit-rewards-v1:'+unit.id),saved=root.GrowingRewards?.restore?root.GrowingRewards.restore(raw):raw;
    if(!saved)return 0;
    if(!Number.isInteger(saved.done)||!Number.isInteger(saved.total)||saved.done<0||saved.total<0||saved.done>saved.total)throw Error('课程记录不可用');
    return saved.total?Math.floor(saved.done/saved.total*1000+1e-8)/10:0;
   }
   const fraction=unit.id==='math-8b-10',saved=read(fraction?'fraction-minute-v1':'growing-'+subject+'-lessons-v1');
   if(saved&&(!fraction&&saved.version!==1||!saved.topics||typeof saved.topics!=='object'))throw Error('课程记录不可用');
   return Math.round(ids.reduce((sum,id)=>{
    const legacyId=fraction?({meaning:'domain',extraneous:'extra'})[id]||id:id;
    return sum+(fraction?root.GrowingPracticeProgress.fraction(saved?.topics[legacyId],Object.hasOwn(saved?.learning?.mastery||{},legacyId)):root.GrowingPracticeProgress.mastery(saved?.topics[id])).score;
   },0)/ids.length*10)/10;
  }
  if(page==='study'){
   const unit=book.units.find(item=>item.id===params.get('unit'));
   if(!unit)return error();
   if(book.verified&&unit.entry){
    const [file,query='']=unit.entry.split('?'),route=new URLSearchParams(query);
    if(params.get('node'))route.set('node',params.get('node'));
    route.set('v',version);
    return {...common,kind:'redirect',title:unit.title,href:file+'?'+route};
   }
   return {...common,kind:'pending',title:unit.title,label:label(unit),state:state(unit),description:book.verified?'这一课还在准备中，完整学习内容将陆续开放。':'本单元暂为目录占位，待核对下册教材后补充准确名称与内容。',outline:unit.outline||[],graphHref:graph&&book.verified?(subject==='physics'?'physics-knowledge.html':'knowledge.html')+'?'+new URLSearchParams({chapter:unit.id}):null};
  }
  const units=book.units.map(unit=>{
   const available=!!book.verified&&!!unit.entry;
   const result={id:unit.id,number:unit.number,label:label(unit),title:unit.title,summary:unit.summary,state:state(unit),available,href:studyHref(unit),summaryHref:available?'unit-summary.html?'+new URLSearchParams({subject,unit:unit.id}):null,mastery:null,masteryError:null};
   if(available)try{const score=mastery(unit);if(!Number.isFinite(score)||score<0||score>100)throw Error('掌握度记录无效');result.mastery=score;}catch{result.masteryError='进度暂不可用，原记录未改动。';}
   return result;
  });
  return {...common,kind:'catalog',title:course.name+'单元目录',tagline:{math:'宇宙的语言。',english:'通往世界的钥匙。',physics:'现象是观察，发现规律才是智慧。'}[subject],subjects:Object.entries(root.GrowingCurriculum).map(([id,value])=>({id,name:value.name,href:catalogHref(id,'upper')})),terms:Object.entries(course.terms).map(([key,value])=>({key,name:value.name,href:catalogHref(subject,key)})),units,resources:{label:subject==='math'?'试卷和推导':'试卷',href:subject+'-resources.html?'+new URLSearchParams({term})},animationHref:subject==='english'?'english-visual-lab.html?'+new URLSearchParams({term}):null,notice:book.verified?'':subject==='physics'?'下册暂不开放，当前先学习上册。上册已按2025年第4版核对。':'下册教材目录待核对，目前预留 8 个单元位置，名称与数量以教材为准。',footnote:graph?(book.verified?'各章均可进入学习，并查看本章图谱与薄弱点诊断。':subject==='physics'?'下册暂不开放，当前先学习上册。':'下册内容待提供教材核对后开放。'):book.verified?'上册8个单元均可学习：单词、闭卷默写、阅读与语法练习、独立奖励进度。':'下册内容待教材核对后开放。'};
 }
 root.GrowingStudentCatalog={create};
})();
