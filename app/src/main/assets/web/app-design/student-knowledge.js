/* Vue controller: the original diagnosis engine remains the only scoring authority. */
(()=>{
 'use strict';
 const labels={untested:'未测',pending:'待复测',screened:'初筛通过',shaky:'不稳',weak:'薄弱'};
 window.GrowingStudentKnowledge={create({subject='math',params=new URLSearchParams(),storage,active=()=>{},onNavigate}={}){
  active();const physics=subject==='physics',D=window.GrowingKnowledge,E=window.GrowingDiagnosis,g=E.graph(D),L=window.GrowingPanoramaLayout;
  const graphFile=physics?'physics-knowledge.html':'knowledge.html',subjectName=physics?'物理':'数学';
  const chapter=D.chapters.find(c=>c.id===(params.get('chapter')||(physics?D.chapters[0].id:'math-8b-10')));
  if(!chapter)return {model:{kind:'error',title:'没有找到这个'+subjectName+'章节',backHref:'units.html?subject='+subject},subscribe(){return ()=>{};},actions:{},destroy(){}};
  const KEY=(physics?'growing-diagnosis-physics-v1:':'growing-diagnosis-year8-v1:')+chapter.id,RESULT_KEY='growing-diagnosis-v1:'+chapter.id;
  const available=new Set(chapter.nodes.map(n=>n.id));function pre(id){for(const e of g.pre.get(id))if(!available.has(e.from)){available.add(e.from);pre(e.from);}}chapter.nodes.forEach(n=>pre(n.id));
  let selected=g.byId.has(params.get('node'))?params.get('node'):!physics&&chapter.number===10?'add':chapter.nodes[0].id;
  let mode=['diagnosis','panorama'].includes(params.get('mode'))?params.get('mode'):'graph',range=params.get('range')==='year'?'year':'chapter',scope='1',target=params.has('chapter')&&!params.has('node')?'chapter':selected;
  let session=null,running=false,setup=false,notice='',feedback='',searchNote='',dead=false,model,handwriting=new Map();const listeners=new Set();
  const guard=()=>{if(dead)throw Error('学习页面已销毁');active();};
  try{const raw=storage.getItem(KEY);if(raw){session=E.restore(g,raw);if(!session.protocol&&E.inspect(g,session).canContinue){session=null;notice='旧版未完成记录仍保留在本机。请新开一次固定题序评测，全部完成后查看报告。';}else{if(E.inspect(g,session).canContinue)session={...session,closed:false};running=E.inspect(g,session).canContinue;}}}catch{notice='未能恢复本机诊断记录（记录版本、格式或浏览器存储不可用）。可以重新诊断；原课程记录未改动。';}
  const studyLink=(c=chapter,id='')=>'study.html?'+new URLSearchParams({subject,term:c.term,unit:c.id,v:'shared-ai-1',...(id?{node:id}:{})});
  const state=()=>session?E.inspect(g,session):null;
  function save(){
   guard();try{storage.setItem(KEY,JSON.stringify(session));}catch{notice='浏览器暂时无法保存诊断。仍可完成本轮，关闭页面后可能无法恢复；原课程记录未改动。';}
   const credit=E.assessmentCredit(g,session);if(!credit)return;
   guard();try{const saved=JSON.parse(storage.getItem(RESULT_KEY)||'{"version":1,"records":{}}');if(saved.version!==1||!saved.records||typeof saved.records!=='object'||Array.isArray(saved.records))throw Error('invalid evidence');const records=saved.records;
    for(const [id,value] of Object.entries(credit)){if(!chapter.nodes.some(n=>n.id===id))continue;let previous=null;try{previous=E.assessmentCredit(g,records[id]);}catch{}if(!previous||value>(previous[id]??-1))records[id]=session;}
    guard();storage.setItem(RESULT_KEY,JSON.stringify({version:1,records}));
   }catch{notice='本轮已完成，但排行榜评测记录未能保存，请检查浏览器存储后重试；原记录未改动。';}
  }
  function readHandwriting(){
   handwriting=new Map();const H=window.GrowingHandwriting;if(!H||chapter.id!=='math-8b-10')return;const docs=[];let corrupt=false;
   try{for(let i=0;i<storage.length;i++){guard();const key=storage.key(i);if(key&&H.KEY.test(key))try{docs.push(JSON.parse(storage.getItem(key)));}catch{corrupt=true;}}handwriting=new Map(H.evidence(docs,window.GrowingFractionPaperTasks.tasks).map(k=>[k.nodeId,k]));}catch{corrupt=true;}
   if(corrupt)notice='部分手写原稿无法读取，原记录未改动；仍可继续图谱诊断。';
  }
  const title=id=>g.byId.get(id).title;
  function refresh(){
   guard();readHandwriting();const s=state(),visible=s&&!s.canContinue?s:null;
   const status=id=>{const k=handwriting.get(id);return k?.score!==null&&k?.score<80?k.score<60?'weak':'shaky':visible?.states[id]||'untested';};
   const node=id=>({...g.byId.get(id),status:status(id),statusLabel:labels[status(id)],handwriting:handwriting.get(id)});
   const ancestors=new Set(),depthSeen=new Map();function walk(id,depth){if(depth<=0||(depthSeen.get(id)||0)>=depth)return;depthSeen.set(id,depth);for(const e of g.pre.get(id)){ancestors.add(e.from);walk(e.from,depth-1);}}walk(selected,scope==='all'?g.byId.size:Number(scope));
   const before=new Set(),after=new Set();function all(id,set,edges,field){for(const edge of edges.get(id))if(!set.has(edge[field])){set.add(edge[field]);all(edge[field],set,edges,field);}}all(selected,before,g.pre,'from');all(selected,after,g.next,'to');
   const graphNodes=[g.order.filter(id=>ancestors.has(id)).map(node),[node(selected)],g.next.get(selected).map(e=>node(e.to))];
   const ids=L.visible(g,chapter,range,selected),layout=L.layout(g,ids);
   const panorama={...layout,nodes:layout.nodes.map(n=>({...n,...node(n.id),relation:n.id===selected?'is-selected':before.has(n.id)?'is-before':after.has(n.id)?'is-after':'is-other',group:g.data.chapters.find(c=>c.id===g.byId.get(n.id).chapter)?.number||null})),edges:layout.edges.map(e=>({...e,onPath:before.has(e.from)&&(before.has(e.to)||e.to===selected)||(after.has(e.from)||e.from===selected)&&after.has(e.to),label:title(e.from)+' → '+title(e.to)+'：'+e.reason}))};
   const n=node(selected),c=D.chapters.find(c=>c.id===n.chapter),report=s&&!s.canContinue?{
    ...s,credit:E.assessmentCredit(g,session),closed:session.closed,limit:session.limit,targets:session.targets.map(title),groups:['weak','shaky','screened','untested','pending'].map(key=>({key,label:labels[key],count:s.order.filter(id=>(s.states[id]||'untested')===key).length})),
    roots:s.roots.map(r=>({...r,title:title(r.id),uncertainTitles:r.uncertain.map(title)})),path:s.path.map(node),soft:s.soft.map(node),evidence:s.order.map(id=>({...node(id),status:s.states[id]||'untested',statusLabel:labels[s.states[id]||'untested'],attempts:(s.attempts[id]||[]).map(a=>{const q=g.bank.get(id).find(q=>q.id===a.qid);return {...a,prompt:q.prompt,chosen:a.choice===null?'暂时不会 / 不确定':q.options[a.choice],answer:q.options[q.answer],explanation:q.explanation};})}))
   }:null;
   if(target!=='chapter'&&!chapter.nodes.some(n=>n.id===target))target='chapter';
   model={kind:'knowledge',title:chapter.title+'知识图谱与诊断',subject,subjectName,chapter,chapters:D.chapters,mode,range,scope,target,selected:n,notice,feedback,searchNote,labels,graphNodes,graphEdges:D.edges,panorama,
    availableNodes:D.nodes.filter(n=>available.has(n.id)||n.id===selected).map(node),relations:g.pre.get(selected).map(e=>({...e,title:title(e.from)})),courseHref:c?studyLink(c,n.id):null,handwritingHref:n.handwriting?'handwriting.html?'+new URLSearchParams({subject,unit:chapter.id,task:n.handwriting.taskId}):null,
    handwritingStatus:n.handwriting?window.GrowingHandwriting.knowledgeStatus(n.handwriting.score):null,
    backHref:'units.html?'+new URLSearchParams({subject,term:chapter.term}),studyHref:studyLink(),summaryHref:'unit-summary.html?'+new URLSearchParams({subject,unit:chapter.id}),
    screen:setup?'setup':s&&running&&s.next?'question':report?'report':'setup',question:s&&running&&!setup?s.next?.question:null,asked:s?.asked.length||0,limit:session?.limit||0,hasSession:!!session,canResume:!!s?.canContinue&&!session.closed,report,targets:chapter.nodes.map(n=>({id:n.id,title:n.title})),
    route:graphFile+'?'+new URLSearchParams({chapter:chapter.id,node:selected,mode,...(mode==='panorama'?{range}:{})})};
   for(const fn of listeners)fn(model);
  }
  const act=fn=>(...args)=>{guard();fn(...args);refresh();};
  const actions={
   mode:act(value=>{if(['graph','panorama','diagnosis'].includes(value))mode=value;feedback='';}),scope:act(value=>{if(['1','2','all'].includes(value))scope=value;}),
   locate:act(id=>{if(!g.byId.has(id))return;selected=id;target=id;if(mode!=='panorama')mode='graph';}),
   prepare:act(id=>{target=chapter.nodes.some(n=>n.id===id)?id:'chapter';mode='diagnosis';running=false;setup=true;}),
   target:act(id=>{target=id==='chapter'||chapter.nodes.some(n=>n.id===id)?id:'chapter';}),
   start:act(()=>{session=E.createAssessment(g,target==='chapter'?chapter.nodes.map(n=>n.id):[target]);running=true;setup=false;feedback='';save();}),
   answer:act(choice=>{const next=state()?.next;if(!next||!running||setup)return;if(choice!==null&&(!Number.isInteger(choice)||choice<0||choice>=next.question.options.length))throw Error('请选择一个答案');session=E.answer(g,session,next.question.id,choice);save();running=!!state().next;feedback='';}),
   undo:act(()=>{if(!session?.answers?.length)return;session=E.undo(g,session);running=true;setup=false;feedback='已撤销上一题，请重新选择。';save();}),
   resume:act(()=>{if(!session)return;running=!session.closed&&!!state().next;setup=false;}),
   continue:act(()=>{if(!session)return;session={...session,closed:false};running=true;setup=false;save();}),
   retry:act(()=>{if(!session)return;session=E.createAssessment(g,session.targets);running=true;setup=false;feedback='';save();}),newTarget:act(()=>{running=false;setup=true;}),
   range:act(value=>{range=value==='year'?'year':'chapter';if(range==='chapter'&&!available.has(selected)){selected=chapter.nodes[0].id;target=selected;}}),
   search:act(query=>{query=String(query).trim();const nodes=model.panorama.nodes,exact=nodes.filter(n=>n.title===query),found=exact.length?exact:nodes.filter(n=>n.title.includes(query));if(query&&found.length===1){selected=found[0].id;target=selected;searchNote='';}else searchNote=!query?'请输入知识点名称。':found.length?'找到多个相关知识点，请在快速定位中选择。':'当前范围没有找到，请尝试切换到全部章节。';}),
   chapter(id){guard();if(D.chapters.some(c=>c.id===id))onNavigate?.(graphFile+'?'+new URLSearchParams({chapter:id,mode,...(mode==='panorama'?{range}:{})}));},refresh:()=>refresh()
  };
  refresh();return {get model(){return model;},subscribe(fn){guard();listeners.add(fn);return ()=>listeners.delete(fn);},actions,destroy(){dead=true;listeners.clear();}};
 }};
})();
