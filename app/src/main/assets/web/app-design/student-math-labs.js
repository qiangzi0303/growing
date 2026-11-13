/* Vue-facing state for the original, offline mathematical models. No learning records are written. */
(()=>{
 'use strict';
 window.GrowingStudentMathLabs={create({params=new URLSearchParams(),active=()=>{}}={}){
  const geometry=params.get('kind')==='geometry',D=window.GrowingMath,M=window.GrowingMathLab,G=window.GrowingGeometryModels;
  const listeners=new Set(),filters={search:'',group:'',level:''},titles=['识别条件','构造与转化','推理依据','结论与边界'];
  let alive=true,current,chapter,values={},progress=0,running=false,frame=0,previous=0,cycle=0,speed=1,animateKey='',feedback='先猜一猜，再用参数验证。',quizHidden=false,answer=null;
  const state={kind:geometry?'geometry':'experiment',chapters:D.chapters,models:geometry?G.models:[],groups:['平行','中点','角平分线','全等','平行与相似','最值','其他'],filters,working:'',message:'',titles};
  const guard=()=>{if(!alive)throw Error('页面已关闭');active();};
  const emit=()=>{if(alive)for(const fn of listeners)fn({...state});};
  function stop(){running=false;cancelAnimationFrame(frame);previous=0;}
  function update(){
   Object.assign(state,{current,chapter,values:{...values},progress,running,speed,animateKey,feedback,quizHidden,answer});
   if(geometry){
    state.filtered=G.models.filter(m=>(!filters.group||m.group===filters.group)&&(!filters.level||(filters.level==='advanced')===m.advanced)&&(!filters.search||[m.id,m.title,m.given,m.result,...m.nodes.map(id=>D.nodes.find(n=>n.id===id)?.title||id)].join(' ').toLowerCase().includes(filters.search.trim().toLowerCase())));
    state.svg=current?geometrySvg(current,progress,G,titles):'';state.title=current?.title||'模型推导';state.route='geometry-models.html'+(current?'#model-'+current.id:'');
    state.lessons=current?.nodes.map(id=>{const n=D.nodes.find(n=>n.id===id),c=D.chapters.find(c=>c.id===n.chapter);return {id,title:c.title+' · '+n.title,href:'math-course.html?'+new URLSearchParams({chapter:n.chapter,node:id})};})||[];
    state.backHref='units.html?subject=math&term=upper';
   }else{
    const result=M.evaluate(current,values);Object.assign(state,{svg:result.svg,stats:result.stats,conclusion:result.conclusion,title:current.name,experiments:M.experiments.filter(e=>e.chapter===chapter.number),route:'math-explore-lab.html?'+new URLSearchParams({chapter:chapter.id,experiment:current.id}),backHref:chapter.number===10?'../fraction-ops/分式作战_一分钟学习版.html':'math-course.html?'+new URLSearchParams({chapter:chapter.id,node:current.nodes[0]})});
   }
   emit();
  }
  function select(id){guard();const next=G.models.find(m=>m.id===Number(id));if(!next)return;stop();current=next;progress=0;state.working='';state.showAnswer=false;state.showSources=false;update();}
  function experiment(id){guard();const next=M.experiments.find(e=>e.id===id);if(!next)return;stop();current=next;chapter=D.chapters.find(c=>c.number===current.chapter);values=M.defaults(current);animateKey=current.controls[0].key;feedback='先猜一猜，再用参数验证。';answer=null;update();}
  function adjust(key,value){const c=current.controls.find(c=>c.key===key);if(!c)return;values[key]=Number(Math.max(c.min,Math.min(c.max,c.min+Math.round((Number(value)-c.min)/c.step)*c.step)).toFixed(6));}
  function tick(now){
   if(!alive||!running)return;
   try{guard();const elapsed=previous?Math.min((now-previous)/1000,.1):0;previous=now;
    if(geometry){progress=Math.min(3,progress+elapsed/2.6);if(progress>=3)stop();}
    else{cycle=(cycle+elapsed*speed/8)%2;const c=current.controls.find(c=>c.key===animateKey);adjust(c.key,c.min+(c.max-c.min)*(cycle<=1?cycle:2-cycle));}
    update();if(running)frame=requestAnimationFrame(tick);
   }catch{stop();}
  }
  const actions={
   select,experiment,
   chapter(id){guard();const c=D.chapters.find(c=>c.id===id);if(c)experiment(M.experiments.find(e=>e.chapter===c.number).id);},
   adjust(key,value){guard();stop();adjust(key,value);update();},
   animate(key){guard();stop();animateKey=key;update();},speed(value){guard();speed=Number(value);update();},
   play(){guard();if(running)stop();else{if(geometry&&progress>=3)progress=0;if(!geometry){const c=current.controls.find(c=>c.key===animateKey);cycle=(values[c.key]-c.min)/(c.max-c.min);}running=true;previous=0;frame=requestAnimationFrame(tick);}update();},
   progress(value){guard();stop();progress=Math.max(0,Math.min(3,Number(value)));update();},
   step(direction=1){guard();stop();if(geometry)progress=Math.max(0,Math.min(3,direction<0?Math.ceil(progress)-1:Math.floor(progress)+1));else{const c=current.controls.find(c=>c.key===animateKey);adjust(c.key,values[c.key]>=c.max?c.min:values[c.key]+c.step);}update();},
   reset(){guard();stop();if(geometry)progress=0;else values=M.defaults(current);update();},
   random(){guard();stop();if(geometry){if(state.filtered.length)select(state.filtered[Math.floor(Math.random()*state.filtered.length)].id);}else{for(const c of current.controls)adjust(c.key,c.min+Math.random()*(c.max-c.min));update();}},
   answer(index){guard();answer=Number(index);feedback=(answer===current.answer?'预测正确。':'再观察一下。')+current.explain;update();},
   quiz(show){guard();quizHidden=!show;update();},
   filter(key,value){guard();if(!(key in filters))return;filters[key]=String(value);update();if(!state.filtered.some(m=>m.id===current?.id)){if(state.filtered.length)select(state.filtered[0].id);else{stop();current=null;update();}}},
   neighbour(delta){guard();const index=G.models.findIndex(m=>m.id===current?.id)+delta;if(!G.models[index])return;Object.assign(filters,{search:'',group:'',level:''});select(G.models[index].id);},
   working(value){guard();state.working=value;emit();},
   async fullscreen(){guard();try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{if(alive){state.message='当前环境不支持全屏，可使用浏览器全屏功能。';emit();}}},
   refresh(){guard();update();}
  };
  function visibility(){if(document.hidden){stop();update();}}
  function hash(){if(geometry){const id=Number(location.hash.replace('#model-',''));if(G.models.some(m=>m.id===id)){Object.assign(filters,{search:'',group:'',level:''});select(id);}}}
  function print(){if(geometry){stop();progress=3;update();}}
  const reduce=window.matchMedia?.('(prefers-reduced-motion:reduce)'),onReduce=()=>{stop();update();};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('hashchange',hash);window.addEventListener('beforeprint',print);reduce?.addEventListener?.('change',onReduce);
  if(geometry)select(Number(location.hash.replace('#model-',''))||G.models[0].id);
  else{chapter=D.chapters.find(c=>c.id===params.get('chapter'))||D.chapters[0];const e=M.experiments.find(e=>e.chapter===chapter.number&&(e.id===params.get('experiment')||e.nodes.includes(params.get('node'))))||M.experiments.find(e=>e.chapter===chapter.number);experiment(e.id);}
  return {get model(){return {...state};},actions,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},beforeLeave(){stop();},destroy(){if(!alive)return;stop();alive=false;listeners.clear();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('hashchange',hash);window.removeEventListener('beforeprint',print);reduce?.removeEventListener?.('change',onReduce);}};
 }};
function geometrySvg(current,progress,G,titles){
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\x27":"&#39;"}[c]));
 const paths=s=>s?s.split(";").map(v=>v.trim().split(/\s+/)):[];
    const d=current.diagram,points=d.points,all=Object.values(points).map(p=>p.slice());
    for(const c of d.circles||[]){const o=points[c.center];all.push([o[0]-c.radius,o[1]-c.radius],[o[0]+c.radius,o[1]+c.radius]);}
    const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),scale=Math.min(520/Math.max(x1-x0,1),260/Math.max(y1-y0,1));
    const xy=p=>[310+(p[0]-(x0+x1)/2)*scale,175-(p[1]-(y0+y1)/2)*scale];
    const path=names=>names.map((n,i)=>(i?'L':'M')+xy(points[n]).join(',')).join(' ');
    const clamp=v=>Math.max(0,Math.min(1,v)),a=clamp(progress),f=clamp(progress-1),h=clamp(progress-2);
    let out=`<title>${esc(current.title)}：${esc(titles[Math.round(progress)])}</title>`;
    for(const names of paths(d.faces)){out+=`<path d="${path(names)} Z" fill="${out.length%2?'#1d92911c':'#e5b23a22'}" opacity="${f}"/>`;}
    for(const c of d.circles||[]){const o=xy(points[c.center]);out+=`<circle cx="${o[0]}" cy="${o[1]}" r="${c.radius*scale}" fill="none" stroke="#7ba791" stroke-width="1.5" stroke-dasharray="5 5" opacity="${a}"/>`;}
    for(const names of paths(d.base))out+=`<path class="edge" d="${path(names)}"/>`;
    const auxiliaries=paths(d.aux);auxiliaries.forEach((names,i)=>{const v=clamp(a*auxiliaries.length-i);out+=`<path class="aux" d="${path(names)}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:${1-v}" opacity="${v?1:0}"/>`;});
    // A rigid rotation follows an exact circle; reflection is shown as folding about its axis.
    if(d.motion&&progress>=1){const mo=d.motion,t=clamp(progress-1);let pp=mo.from.map(n=>points[n]);if(mo.center){const c=points[mo.center];pp=pp.map(p=>G.rot(p,c,mo.angle*t));}else{const u=points[mo.axis[0]],v=points[mo.axis[1]];pp=pp.map(p=>{const q=G.foot(p,u,v),factor=Math.cos(Math.PI*t);return[q[0]+(p[0]-q[0])*factor,q[1]+(p[1]-q[1])*factor];});}const coords=pp.map(xy);out+=coords.length===1?`<circle class="motion" cx="${coords[0][0]}" cy="${coords[0][1]}" r="6"/>`:`<polygon class="motion" points="${coords.map(p=>p.join(',')).join(' ')}"/>`;}
    for(const names of paths(d.aux||d.base))out+=`<path class="trace" d="${path(names)}" opacity="${h*.85}"/>`;
    const baseNames=new Set([...paths(d.base).flat(),...(d.visible||[])]);
    const labelBoxes=[];
    for(const [name,p] of Object.entries(points)){
      const [x,y]=xy(p),opacity=baseNames.has(name)?1:a;
      const candidates=[[8,-9],[8,20],[-20,-10],[-20,20],[12,-24],[-30,-24]];
      const offset=candidates.find(([dx,dy])=>labelBoxes.every(b=>x+dx+18<b.x||x+dx>b.x+b.w||y+dy<b.y-18||y+dy-18>b.y))||candidates[0];
      const tx=x+offset[0],ty=y+offset[1];if(opacity>0)labelBoxes.push({x:tx,y:ty,w:Math.max(18,name.length*11)});
      out+=`<g opacity="${opacity}"><circle class="point" cx="${x}" cy="${y}" r="3"/><text x="${tx}" y="${ty}">${esc(name)}</text></g>`;
    }
 return out;
}
})();
