/* Vue controls, original vector document format and the existing handwriting grader. */
(()=>{
 'use strict';
 window.GrowingStudentHandwriting={create({params=new URLSearchParams(),storage,active:assertActive=()=>{}}){
  const C=window.GrowingHandwriting,AI=window.GrowingHandwritingAI,listeners=new Set();
  const subject=['math','physics','english'].includes(params.get('subject'))?params.get('subject'):'math';
  const unitId=C.units(subject).includes(params.get('unit'))?params.get('unit'):C.units(subject)[0];
  const course=Object.values(window.GrowingCurriculum[subject].terms).flatMap(t=>t.units).find(u=>u.id===unitId),essay=subject==='english';
  const application=window.GrowingApplicationPractice?.tasks(subject,unitId).find(t=>t.id===params.get('practice'));
  const tasks=[...(application?[application]:[]),...window.GrowingHandwritingTasks.forUnit(subject,unitId)];
  let alive=true,doc,key,page=0,tool='pen',width=4,finger=false,redo=[],stroke=null,canvas=null,job=null,importing=false,blocked=false,dirty=false,saveTimer,status='',saveStatus='';
  const photos=new Map();
  const backHref=application?(subject==='physics'?'physics-course.html':'math-course.html')+'?'+new URLSearchParams({chapter:unitId,node:application.nodeId,practice:'1'})+'#question-'+encodeURIComponent(application.id):course.entry||(subject==='english'?'english-course.html?unit=':subject==='physics'?'physics-course.html?chapter=':'math-course.html?chapter=')+unitId;
  const error=params.has('practice')&&!application?'未找到对应应用题，请返回知识点的应用练习重新选择，原有作答保留。':'';
  const check=()=>{if(!alive)throw Error('学习页面已关闭');assertActive();};
  const currentTask=()=>tasks.find(t=>t.prompt===doc?.prompt&&t.nodes?.length);
  function records(){const result=[];try{for(let i=0;i<storage.length;i++){const id=storage.key(i);if(!C.KEY.test(id))continue;const saved=JSON.parse(storage.getItem(id));if(C.validate(saved)&&saved.subject===subject&&saved.unitId===unitId&&saved.prompt===doc?.prompt&&saved.pages.some((p,j)=>p.length||saved.photos?.[j]))result.push({key:id,at:saved.updatedAt,current:id===key});}}catch{}return result.sort((a,b)=>b.at.localeCompare(a.at));}
  function snapshot(){return {kind:error?'error':'handwriting',records:records(),title:window.GrowingCurriculum[subject].name+'拍照'+(essay?'作文':'解答题'),courseLabel:course.title,guide:essay?'根据本单元主题和写作要求，保留原始字迹与段落。':'根据题目画图、列式，写出推导或证明过程。',backHref,error,key,subject,essay,tasks,task:tasks.find(t=>t.prompt===doc?.prompt)?.id||'custom',prompt:doc?.prompt||'',knowledge:(currentTask()?.nodes||[]).map(id=>C.knowledgeNodes[id]).join('、'),hasOriginal:!!doc?.pages.some((p,i)=>p.length||doc.photos?.[i]),page,pageCount:doc?.pages.length||0,tool,width,finger,blocked,locked:blocked||!!job||importing||!!stroke,busy:!!job,importing,application:!!application,canUndo:!!doc?.pages[page]?.length,canRedo:redo.length>0,status,saveStatus,grades:(doc?.grades||[]).slice().reverse().map(g=>({...g,current:g.revision===doc.revision,details:AI.details(g)}))};}
  const emit=()=>{if(alive)for(const fn of listeners)fn(snapshot());};
  function say(text){if(alive){status=text;emit();}}
  function route(){const q=new URLSearchParams({subject,unit:unitId,id:key.slice(C.PREFIX.length)});if(application)q.set('practice',application.id);window.history.replaceState(null,'','?'+q);}
  function save(){
   clearTimeout(saveTimer);if(!alive||blocked||!doc)return false;
   try{check();if(!C.validate(doc))throw Error('原稿超出保存限制');const raw=JSON.stringify(doc);if(raw.length>900000)throw Error('原稿过大');storage.setItem(key,raw);dirty=false;saveStatus='原稿已保存到当前设备 · '+new Date().toLocaleTimeString();emit();return true;}
   catch{dirty=true;saveStatus='原稿尚未保存，当前原稿仍在页面中。请勿关闭或切换作业，恢复设备存储后点击“立即保存原稿”。';emit();return false;}
  }
  function changed(){C.change(doc);dirty=true;redo=[];save();}
  function loadPhoto(data){if(!photos.has(data))photos.set(data,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{photos.delete(data);reject(Error('照片无法读取，请重新拍摄。'));};image.src=data;}));return photos.get(data);}
  function draw(strokes=doc?.pages[page]){
   if(!canvas||!strokes||!alive)return;C.draw(canvas,strokes);const data=doc.photos?.[page];if(!data)return;
   const revision=doc.revision,index=page,documentKey=key,currentCanvas=canvas;
   loadPhoto(data).then(image=>{check();if(documentKey!==key||revision!==doc.revision||index!==page||canvas!==currentCanvas)return;const ctx=canvas.getContext('2d');ctx.globalCompositeOperation='destination-over';ctx.drawImage(image,0,0,C.WIDTH,C.HEIGHT);ctx.globalCompositeOperation='source-over';}).catch(error=>{if(alive)say(error.message);});
  }
  const locked=()=>blocked||!!job||importing||!!stroke;
  function chooseTask(id){
   if(!alive||job||stroke||importing||dirty&&!save()||application)return;
   check();const task=tasks.find(t=>t.id===id);doc=C.create(subject,unitId,task?.prompt||'');key=C.PREFIX+window.crypto.randomUUID();page=0;redo=[];blocked=false;dirty=true;status='已新建作业，原来的原稿仍然保留。';route();save();draw();emit();
  }
  const pointerDown=()=>{},pointerMove=()=>{},pointerEnd=()=>{};
  function beforeLeave(){if(!alive)return;try{check();if(stroke)pointerEnd({pointerId:stroke.id});else if(dirty)save();}catch{/* A revoked account must not receive a late save. */}}
  function visibility(){if(window.document.hidden)beforeLeave();}
  const beforeUnload=event=>{if(dirty||stroke){event.preventDefault();event.returnValue='';}};
  async function photo(file){
   if(!file||!alive||locked())return;check();
   if(!file.type.startsWith('image/')||file.size>20*1024*1024){say('请选择 20 MB 以内的照片。');return;}
   importing=true;status='正在导入照片…';emit();const documentKey=key,index=page,url=URL.createObjectURL(file);
   try{
    const image=new Image();image.src=url;await image.decode();check();
    const output=window.document.createElement('canvas');output.width=C.WIDTH;output.height=C.HEIGHT;const ctx=output.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,C.WIDTH,C.HEIGHT);
    const scale=Math.min(C.WIDTH/image.naturalWidth,C.HEIGHT/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,(C.WIDTH-w)/2,(C.HEIGHT-h)/2,w,h);
    const remaining=650000;let data;
    for(const quality of [.9,.8,.65,.5]){data=output.toDataURL('image/jpeg',quality);if(data.length<=remaining)break;}
    if(data.length>remaining)throw Error('照片保存空间不足，请减少页数或拍摄更清晰的单页。');
    await loadPhoto(data);check();if(documentKey!==key||index!==page)return;
    if(dirty&&!save())throw Error('请先保存当前原稿，再上传照片。');
    const previous=doc,previousKey=key,previousPage=page;doc=C.create(subject,unitId,previous.prompt);doc.photos=[data];key=C.PREFIX+window.crypto.randomUUID();page=0;dirty=true;
    if(!save()){doc=previous;key=previousKey;page=previousPage;dirty=false;throw Error('照片未保存，历史记录已保留，请释放设备存储后重试。');}
    route();draw();status='照片已保存为新上传记录，可点击“AI批改”。';
   }catch(error){if(alive)status=error.message||'照片导入失败，请重新拍摄。';}
   finally{URL.revokeObjectURL(url);if(alive){importing=false;emit();}}
  }
  async function grade(){
   if(!alive||locked())return;check();
   if(!doc.prompt.trim()||!doc.pages.some((p,i)=>doc.photos?.[i]||p.some(s=>s.tool==='pen'))){say(essay?'请填写作文要求，并上传作文照片。':'请填写完整题目，并上传解答照片。');return;}
   if(!save()){say('请先成功保存原稿，再发送批改。');return;}
   const controller=new AbortController(),revision=doc.revision,documentKey=key;job=controller;status='AI 正在逐页查看作答原稿并批改，请稍候…';emit();const timer=setTimeout(()=>controller.abort(),115000);
   try{
    const task=currentTask(),pages=await Promise.all(doc.pages.map(async(strokes,i)=>AI.pageImage(strokes,C.draw,C.WIDTH,C.HEIGHT,doc.photos?.[i]?await loadPhoto(doc.photos[i]):null)));check();
    const result=await AI.request({subject,unitId,prompt:doc.prompt,pages,...(task?{nodeIds:task.nodes}:{})},controller.signal);check();
    if(controller.signal.aborted||job!==controller||key!==documentKey||doc.revision!==revision)return;
    const g={...result,revision,at:new Date().toISOString()};
    if(!C.grade(g)||task&&!g.needsReview&&!C.matchesKnowledge(g,task))throw Error('知识点评估或分数不完整，本次不计分，请重新批改。');
    doc.grades=[...doc.grades,g].slice(-10);doc.updatedAt=new Date().toISOString();dirty=true;save();status=g.needsReview?'原稿部分内容需要复核，未生成分数。':'作答原稿批改完成，可查看错误订正与关联知识点。';
   }catch(error){if(alive)status=error.name==='AbortError'?'批改已取消或超时，原稿已保留，本次不计分。':error.message;}
   finally{clearTimeout(timer);if(alive&&job===controller){job=null;emit();}}
  }
  const actions={attachCanvas(value){canvas=value;draw();},pointerDown,pointerMove,pointerEnd,photo,grade,save,cancel(){job?.abort();},chooseTask,
   records,openRecord(id){if(!alive||locked()||dirty&&!save())return;check();try{const saved=JSON.parse(storage.getItem(id));if(!C.KEY.test(id)||!C.validate(saved)||saved.subject!==subject||saved.unitId!==unitId||saved.prompt!==doc.prompt)throw Error();doc=saved;key=id;page=0;route();draw();emit();}catch{say('这份记录无法读取，原记录保留。');}},
   setPrompt(value){if(!alive||locked()||application)return;check();C.change(doc);doc.prompt=String(value).slice(0,6000);dirty=true;saveStatus='正在保存…';clearTimeout(saveTimer);saveTimer=setTimeout(save,400);emit();},
   setTool(value){if(!alive||locked()||!['pen','eraser'].includes(value))return;tool=value;emit();},setWidth(value){if([2,4,7].includes(Number(value))){width=Number(value);emit();}},setFinger(value){finger=!!value;emit();},
   undo(){if(!alive||locked()||!doc.pages[page].length)return;check();redo.push(doc.pages[page].pop());C.change(doc);dirty=true;save();draw();emit();},
   redo(){if(!alive||locked()||!redo.length)return;check();const s=redo.at(-1);if(C.count(doc)+s.points.length>C.MAX_POINTS){say('当前原稿笔迹已达上限，请新建下一份作业。');return;}doc.pages[page].push(redo.pop());C.change(doc);dirty=true;save();draw();emit();},
   turn(index){if(!alive||locked())return;page=Math.max(0,Math.min(doc.pages.length-1,index));redo=[];draw();emit();},
   addPage(){if(!alive||locked()||doc.pages.length>=C.MAX_PAGES)return;check();doc.pages.push([]);if(doc.photos)doc.photos.push(null);page=doc.pages.length-1;changed();draw();emit();}
  };
  function destroy(){if(!alive)return;alive=false;job?.abort();job=null;clearTimeout(saveTimer);listeners.clear();photos.clear();canvas=null;window.document.removeEventListener('visibilitychange',visibility);window.removeEventListener('beforeunload',beforeUnload);}
  actions.undo=actions.redo=actions.addPage=actions.setTool=actions.setWidth=actions.setFinger=()=>{};
  const controller={snapshot,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},actions,beforeLeave,destroy};
  if(error)return controller;
  check();doc=C.create(subject,unitId,(application?.prompt||params.get('prompt')||(tasks.find(t=>t.id===params.get('task'))||tasks[0])?.prompt||'').slice(0,6000));key=C.PREFIX+window.crypto.randomUUID();
  const requested=C.PREFIX+params.get('id');
  if(C.KEY.test(requested)){try{check();const saved=JSON.parse(storage.getItem(requested));if(!C.validate(saved)||saved.unitId!==unitId||application&&saved.prompt!==application.prompt)throw Error();doc=saved;key=requested;}catch{blocked=true;status='该原稿无法读取或不属于本题，已停止覆盖。原记录保留，请返回课堂后重新进入。';}}
  else{route();dirty=true;save();}
  window.document.addEventListener('visibilitychange',visibility);window.addEventListener('beforeunload',beforeUnload);return controller;
 }};
})();
