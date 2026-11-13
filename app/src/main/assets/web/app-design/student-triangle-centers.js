/* Original geometric construction and SVG layers, controlled by Vue/Vant state. */
(()=>{
 'use strict';
 window.GrowingStudentTriangleCenters={create({active:assertActive=()=>{}}={}){
  let alive=true,svg=null,vertex='A',playing=false,frame=null,time=0,speed=1,shape='acute',quizOpen=true,dragging=null,status='';
  const listeners=new Set(),goalsDone=new Set(),answers={};
  const check=()=>{if(!alive)throw Error('学习页面已关闭');assertActive();};
  const SVGNS='http://www.w3.org/2000/svg';
// 顶点坐标（SVG 用户坐标系，固定虚拟画布 1000x700，再按视口缩放）
const VW=1000,VH=700;


const DEFAULT={A:{x:500,y:120},B:{x:200,y:560},C:{x:820,y:520}};
let P={A:{...DEFAULT.A},B:{...DEFAULT.B},C:{...DEFAULT.C}};

const dist=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
function geometry(){
  const {A,B,C}=P;
  const a=dist(B,C), b=dist(A,C), c=dist(A,B); // 对边：a 对 A
  const peri=a+b+c;
  // 重心 Centroid
  const G={x:(A.x+B.x+C.x)/3,y:(A.y+B.y+C.y)/3};
  // 内心 Incenter（边长加权）
  const I={x:(a*A.x+b*B.x+c*C.x)/peri,y:(a*A.y+b*B.y+c*C.y)/peri};
  // 面积（叉积）
  const area2=(B.x-A.x)*(C.y-A.y)-(B.y-A.y)*(C.x-A.x);
  const area=Math.abs(area2)/2;
  // 共线或顶点重合时，外心和垂心没有唯一有限解。
  if(peri<1e-8||area<1e-6*Math.max(a*a,b*b,c*c,1))return null;
  const r=area/(peri/2); // 内切圆半径
  // 外心 Circumcenter
  const d=2*(A.x*(B.y-C.y)+B.x*(C.y-A.y)+C.x*(A.y-B.y));
  const ux=((A.x*A.x+A.y*A.y)*(B.y-C.y)+(B.x*B.x+B.y*B.y)*(C.y-A.y)+(C.x*C.x+C.y*C.y)*(A.y-B.y))/d;
  const uy=((A.x*A.x+A.y*A.y)*(C.x-B.x)+(B.x*B.x+B.y*B.y)*(A.x-C.x)+(C.x*C.x+C.y*C.y)*(B.x-A.x))/d;
  const O={x:ux,y:uy};
  const R=dist(O,A); // 外接圆半径
  // 垂心 Orthocenter： H = A+B+C - 2O
  const H={x:A.x+B.x+C.x-2*O.x,y:A.y+B.y+C.y-2*O.y};
  // 各边中点
  const Ma={x:(B.x+C.x)/2,y:(B.y+C.y)/2}; // 对 A 的边 BC 中点
  const Mb={x:(A.x+C.x)/2,y:(A.y+C.y)/2};
  const Mc={x:(A.x+B.x)/2,y:(A.y+B.y)/2};
  // 垂足（从各顶点到对边）
  const foot=(V,p1,p2)=>{const dx=p2.x-p1.x,dy=p2.y-p1.y;const t=((V.x-p1.x)*dx+(V.y-p1.y)*dy)/(dx*dx+dy*dy);return{x:p1.x+t*dx,y:p1.y+t*dy};};
  const Fa=foot(A,B,C),Fb=foot(B,A,C),Fc=foot(C,A,B);
  // 角平分线与对边交点（内心所在角平分线落点）
  const biFoot=(V,p1,p2,s1,s2)=>{const t=s1/(s1+s2);return{x:p1.x+t*(p2.x-p1.x),y:p1.y+t*(p2.y-p1.y)};};
  const Ta=biFoot(A,B,C,c,b),Tb=biFoot(B,A,C,c,a),Tc=biFoot(C,A,B,b,a);
  return {a,b,c,peri,area,G,I,r,O,R,H,Ma,Mb,Mc,Fa,Fb,Fc,Ta,Tb,Tc};
}

  const CENTERS={
  incenter:{key:'incenter',name:'内心',en:'Incenter',sym:'I',color:'#34D399',on:true,
    desc:'三条<b>角平分线</b>的交点。它到三边的距离相等，因此是三角形<b>内切圆</b>的圆心，永远在三角形内部。',
    formula:'r=\\dfrac{2S}{a+b+c}=\\dfrac{S}{s}'},
  circumcenter:{key:'circumcenter',name:'外心',en:'Circumcenter',sym:'O',color:'#22D3EE',on:false,
    desc:'三条边<b>垂直平分线</b>的交点。它到三个顶点距离相等，是<b>外接圆</b>的圆心。锐角三角形在内部，直角三角形在斜边中点，钝角三角形在外部。',
    formula:'R=\\dfrac{abc}{4S}'},
  centroid:{key:'centroid',name:'重心',en:'Centroid',sym:'G',color:'#FBBF24',on:false,
    desc:'三条<b>中线</b>的交点，是三角形的「平衡点」。它把每条中线按 <b>2:1</b> 分割（顶点到重心 : 重心到中点）。',
    formula:'G=\\dfrac{A+B+C}{3}'},
  orthocenter:{key:'orthocenter',name:'垂心',en:'Orthocenter',sym:'H',color:'#FB7185',on:false,
    desc:'三条<b>高</b>（顶点到对边的垂线）的交点。锐角三角形在内部，直角三角形恰在直角顶点，钝角三角形在外部。',
    formula:'\\vec{H}=\\vec{A}+\\vec{B}+\\vec{C}-2\\vec{O}'},
};
let activeKey='incenter';

/* ====== SVG 工具 ====== */
function el(tag,attrs){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}
function line(p1,p2,o){return el('line',{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,...o});}
function circ(c,r,o){return el('circle',{cx:c.x,cy:c.y,r,...o});}
function txt(p,s,o){const t=el('text',{x:p.x,y:p.y,...o});t.textContent=s;return t;}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild);}
/* META_END */
/* ====== 渲染 ====== */
let showLabels=true,showEuler=false,showMedial=false;
function render(){
  clear(svg);
  
  const g=geometry();
  const {A,B,C}=P;
  // 背景网格
  const grid=el('g',{opacity:'0.12'});
  for(let x=0;x<=VW;x+=50)grid.appendChild(line({x,y:0},{x,y:VH},{stroke:'#67E8F9','stroke-width':1}));
  for(let y=0;y<=VH;y+=50)grid.appendChild(line({x:0,y},{x:VW,y},{stroke:'#67E8F9','stroke-width':1}));
  svg.appendChild(grid);

  // 三角形主体
  const poly=el('polygon',{points:`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`,
    fill:'rgba(251,191,36,0.07)',stroke:'#FDE68A','stroke-width':3,'stroke-linejoin':'round'});
  svg.appendChild(poly);
  if(!g){
    drawVertex('A',A);drawVertex('B',B);drawVertex('C',C);
    svg.appendChild(txt({x:500,y:65},'顶点重合或近乎共线，请拖动顶点恢复三角形',{fill:'#FDE68A','font-size':20,'text-anchor':'middle'}));
    return null;
  }

  // 中点三角形
  if(showMedial){
    svg.appendChild(el('polygon',{points:`${g.Ma.x},${g.Ma.y} ${g.Mb.x},${g.Mb.y} ${g.Mc.x},${g.Mc.y}`,
      fill:'none',stroke:'#A78BFA','stroke-width':2,'stroke-dasharray':'8 5',opacity:0.8}));
  }
  // 欧拉线：外心 O、重心 G、垂心 H 共线
  if(showEuler&&dist(g.O,g.H)>1e-6){
    const dir={x:g.H.x-g.O.x,y:g.H.y-g.O.y};const L=Math.hypot(dir.x,dir.y)||1;
    const ext=600;const p1={x:g.O.x-dir.x/L*ext,y:g.O.y-dir.y/L*ext};const p2={x:g.H.x+dir.x/L*ext,y:g.H.y+dir.y/L*ext};
    svg.appendChild(line(p1,p2,{stroke:'#F8FAFC','stroke-width':2,'stroke-dasharray':'3 7',opacity:0.65}));
    svg.appendChild(txt({x:(g.O.x+g.H.x)/2+10,y:(g.O.y+g.H.y)/2-10},'欧拉线',{fill:'#F8FAFC','font-size':18,opacity:0.8}));
  }
  if(showEuler&&dist(g.O,g.H)<=1e-6)svg.appendChild(txt({x:500,y:65},'等边三角形四心重合，欧拉线方向不唯一',{fill:'#F8FAFC','font-size':20,'text-anchor':'middle'}));

  // 各心专属几何图层
  const o=CENTERS.incenter;
  if(o.on)drawIncenter(g);
  if(CENTERS.circumcenter.on)drawCircum(g);
  if(CENTERS.centroid.on)drawCentroid(g);
  if(CENTERS.orthocenter.on)drawOrtho(g);

  // 心的标记点（后画，叠在最上）
  drawCenterDot(CENTERS.incenter,g.I);
  if(CENTERS.circumcenter.on)drawCenterDot(CENTERS.circumcenter,g.O);
  if(CENTERS.centroid.on)drawCenterDot(CENTERS.centroid,g.G);
  if(CENTERS.orthocenter.on)drawCenterDot(CENTERS.orthocenter,g.H);

  // 顶点
  drawVertex('A',A);drawVertex('B',B);drawVertex('C',C);


  return g;
}

function drawCenterDot(c,p){
  if(!c.on)return;
  const act=activeKey===c.key;
  svg.appendChild(circ(p,act?13:10,{fill:c.color,stroke:'#0F172A','stroke-width':2}));
  if(act)svg.appendChild(circ(p,20,{fill:'none',stroke:c.color,'stroke-width':2,opacity:0.5}));
  svg.appendChild(txt({x:p.x+16,y:p.y-14},c.sym,{fill:c.color,'font-size':24,'font-weight':700}));
}
function drawVertex(name,p){
  svg.appendChild(circ(p,9,{fill:'#FDE68A',stroke:'#0F172A','stroke-width':2,class:'vertex','data-v':name}));
  svg.appendChild(circ(p,Math.max(22,22*1000/Math.max(1,svg.clientWidth||1000)),{fill:'transparent',class:'vertex','data-v':name,style:'cursor:grab',tabindex:0,role:'button','aria-label':'顶点 '+name+'，按方向键移动'}));
  if(showLabels)svg.appendChild(txt({x:p.x+(name==='B'?-28:14),y:p.y+(name==='A'?-14:28)},name,{fill:'#FDE68A','font-size':26,'font-weight':700}));
}
/* RENDER_CORE_END */
/* ====== 各心专属作图 ====== */
function drawIncenter(g){
  const col=CENTERS.incenter.color,dim=activeKey&&activeKey!=='incenter';
  const op=dim?0.3:1;
  // 角平分线
  [[P.A,g.Ta],[P.B,g.Tb],[P.C,g.Tc]].forEach(([v,t])=>
    svg.appendChild(line(v,t,{stroke:col,'stroke-width':1.6,'stroke-dasharray':'6 5',opacity:0.75*op})));
  // 内切圆
  svg.appendChild(circ(g.I,g.r,{fill:'none',stroke:col,'stroke-width':2.2,opacity:op}));
  // 切点连线（到三边的垂直距离 = r）
  if(activeKey==='incenter'){
    // 画 r 半径到一边的垂线段
    const foot=(V,p1,p2)=>{const dx=p2.x-p1.x,dy=p2.y-p1.y;const tt=((V.x-p1.x)*dx+(V.y-p1.y)*dy)/(dx*dx+dy*dy);return{x:p1.x+tt*dx,y:p1.y+tt*dy};};
    const fBC=foot(g.I,P.B,P.C);
    svg.appendChild(line(g.I,fBC,{stroke:col,'stroke-width':2}));
    svg.appendChild(txt({x:(g.I.x+fBC.x)/2+6,y:(g.I.y+fBC.y)/2},'r',{fill:col,'font-size':20,'font-weight':700}));
  }
}
function drawCircum(g){
  const col=CENTERS.circumcenter.color,dim=activeKey&&activeKey!=='circumcenter';
  const op=dim?0.3:1;
  // 外接圆
  svg.appendChild(circ(g.O,g.R,{fill:'none',stroke:col,'stroke-width':2.2,opacity:op}));
  // 垂直平分线（中点 → 外心）
  [[g.Ma,P.B,P.C],[g.Mb,P.A,P.C],[g.Mc,P.A,P.B]].forEach(([m,p,q])=>{
    const dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy),v={x:-dy/L*900,y:dx/L*900};
    svg.appendChild(line({x:m.x-v.x,y:m.y-v.y},{x:m.x+v.x,y:m.y+v.y},{stroke:col,'stroke-width':1.6,'stroke-dasharray':'6 5',opacity:0.75*op}));
  });
  [g.Ma,g.Mb,g.Mc].forEach(m=>svg.appendChild(circ(m,4,{fill:col,opacity:op})));
}
function drawCentroid(g){
  const col=CENTERS.centroid.color,dim=activeKey&&activeKey!=='centroid';
  const op=dim?0.3:1;
  // 三条中线
  [[P.A,g.Ma],[P.B,g.Mb],[P.C,g.Mc]].forEach(([v,m])=>
    svg.appendChild(line(v,m,{stroke:col,'stroke-width':1.8,opacity:0.85*op})));
  [g.Ma,g.Mb,g.Mc].forEach(m=>svg.appendChild(circ(m,4,{fill:col,opacity:op})));
}
function drawOrtho(g){
  const col=CENTERS.orthocenter.color,dim=activeKey&&activeKey!=='orthocenter';
  const op=dim?0.3:1;
  // 三条高（顶点 → 垂足）
  [[P.A,g.Fa,P.B,P.C],[P.B,g.Fb,P.A,P.C],[P.C,g.Fc,P.A,P.B]].forEach(([v,f,p,q])=>{
    svg.appendChild(line(v,f,{stroke:col,'stroke-width':1.8,'stroke-dasharray':'6 5',opacity:0.8*op}));
    svg.appendChild(line(v,g.H,{stroke:col,'stroke-width':1.2,'stroke-dasharray':'4 5',opacity:0.6*op}));
    svg.appendChild(line(p,f,{stroke:'#CBD5E1','stroke-width':1,'stroke-dasharray':'3 6',opacity:0.45*op}));
    svg.appendChild(circ(f,4,{fill:col,opacity:op}));
    // 直角小方块
    const len=Math.hypot(q.x-p.x,q.y-p.y),u={x:(q.x-p.x)/len*10,y:(q.y-p.y)/len*10},w={x:-u.y,y:u.x};
    svg.appendChild(el('polyline',{points:`${f.x+u.x},${f.y+u.y} ${f.x+u.x+w.x},${f.y+u.y+w.y} ${f.x+w.x},${f.y+w.y}`,fill:'none',stroke:col,'stroke-width':1.5,opacity:op}));
  });
}

  const GOALS=['理解四心各自由哪三条线相交得到','分清内心/外心与内切圆/外接圆的关系','掌握重心 2:1 分割中线的性质','发现外心·重心·垂心共线（欧拉线）'];
const QUIZ=[
  {q:'三角形的「重心」是下面哪三条线的交点？',opts:['角平分线','中线','高','垂直平分线'],a:1,
   tip:'重心是三条中线的交点，它把每条中线按 2:1 分割。'},
  {q:'哪一个「心」一定是内切圆的圆心，并且永远在三角形内部？',opts:['外心 O','垂心 H','内心 I','重心 G'],a:2,
   tip:'内心到三边等距，是内切圆圆心，必在内部。'},
  {q:'钝角三角形的外心 O 位于哪里？',opts:['三角形内部','三角形外部','某条边上','某个顶点'],a:1,
   tip:'钝角三角形外心在外部；直角三角形外心恰在斜边中点。'},
  {q:'外心 O、重心 G、垂心 H 三点有什么关系？',opts:['构成等边三角形','永远重合','共线（欧拉线）','互相垂直'],a:2,
   tip:'非等边三角形中三点共线，OG:GH = 1:2；等边三角形中四心重合，欧拉线方向不唯一。'},
];
function triangleType(g){
  const s=[g.a,g.b,g.c].sort((x,y)=>x-y);
  const [p,q,r]=s;const lhs=p*p+q*q,rhs=r*r;const eps=rhs*1e-8;
  let ang=Math.abs(lhs-rhs)<eps?'直角':(lhs>rhs?'锐角':'钝角');
  const eq=Math.abs(g.a-g.b)<2&&Math.abs(g.b-g.c)<2?'等边':((Math.abs(g.a-g.b)<2||Math.abs(g.b-g.c)<2||Math.abs(g.a-g.c)<2)?'等腰':'');
  return (eq?eq+' · ':'')+ang+'三角形';
}

  function snapshot(){const g=geometry();return {title:'三角形的四心',backHref:'math-explore-lab.html?chapter=math-8a-01',points:JSON.parse(JSON.stringify(P)),geometry:g,triangleType:g?triangleType(g):'顶点重合或近乎共线：四心暂不定义',centers:Object.values(CENTERS).map(c=>({...c})),activeKey,info:activeKey?CENTERS[activeKey]:null,goals:GOALS.map((title,i)=>({title,done:goalsDone.has(i)})),vertex,labels:showLabels,euler:showEuler,medial:showMedial,playing,speed,shape,quizOpen,quiz:QUIZ.map((q,i)=>({...q,selected:answers[i]})),status};}
  function emit(){if(!alive)return;const focused=svg?.contains(window.document.activeElement)&&window.document.activeElement?.dataset?.v;if(svg){render();if(focused)svg.querySelector('[tabindex][data-v="'+focused+'"]')?.focus({preventScroll:true});}for(const fn of listeners)fn(snapshot());}
  function stop(){playing=false;if(frame!==null)window.cancelAnimationFrame(frame);frame=null;}
  function demoAt(t){P.A={x:500+Math.sin(t*.9)*120,y:120+Math.sin(t*.7)*60};P.B={...DEFAULT.B};P.C={x:820+Math.sin(t*.6)*90,y:520+Math.sin(t*1.1)*70};}
  function run(){let previous=0;const tick=now=>{if(!alive||!playing)return;try{check();}catch{stop();return;}time+=(previous?Math.min((now-previous)/1000,.1):0)*speed;previous=now;demoAt(time);emit();frame=window.requestAnimationFrame(tick);};frame=window.requestAnimationFrame(tick);}
  function coord(axis,value){check();if(!['x','y'].includes(axis)||!Number.isFinite(Number(value)))return;stop();P[vertex][axis]=Math.max(20,Math.min(axis==='x'?980:680,Number(value)));emit();}
  function pointer(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
  function visibility(){if(window.document.hidden){stop();emit();}}
  window.document.addEventListener('visibilitychange',visibility);
  const actions={attach(board){svg=board;if(svg){svg.setAttribute('viewBox','0 0 1000 700');svg.setAttribute('preserveAspectRatio','xMidYMid meet');render();}},vertex(value){check();if(['A','B','C'].includes(value)){vertex=value;emit();}},coordinate:coord,center(key,on){check();if(!CENTERS[key])return;if(on!==undefined)CENTERS[key].on=!!on;else CENTERS[key].on=true;if(CENTERS[key].on)activeKey=key;else if(activeKey===key)activeKey=null;emit();},goal(i,value){check();if(value)goalsDone.add(i);else goalsDone.delete(i);emit();},option(name,value){check();if(name==='labels')showLabels=!!value;if(name==='euler')showEuler=!!value;if(name==='medial')showMedial=!!value;emit();},speed(value){check();if([.5,1,2].includes(Number(value)))speed=Number(value);emit();},shape(value){check();if(!['acute','right','obtuse','equilateral'].includes(value))return;stop();shape=value;P={A:{...DEFAULT.A},B:{...DEFAULT.B},C:{...DEFAULT.C}};if(value==='right')P={A:{x:300,y:180},B:{x:300,y:540},C:{x:780,y:540}};if(value==='obtuse')P={A:{x:500,y:330},B:{x:260,y:500},C:{x:740,y:500}};if(value==='equilateral')P={A:{x:500,y:520-240*Math.sqrt(3)},B:{x:260,y:520},C:{x:740,y:520}};emit();},reset(){check();stop();shape='acute';P={A:{...DEFAULT.A},B:{...DEFAULT.B},C:{...DEFAULT.C}};status='已重置初始三角形';emit();},random(){check();stop();const rx=()=>120+Math.random()*760,ry=()=>90+Math.random()*520;for(let i=0;i<40;i++){P={A:{x:rx(),y:ry()},B:{x:rx(),y:ry()},C:{x:rx(),y:ry()}};const g=geometry();if(g&&g.area>18000)break;}status='已随机生成三角形';emit();},step(){check();stop();time+=.15*speed;demoAt(time);emit();},play(){check();if(playing)stop();else{playing=true;Object.values(CENTERS).forEach(c=>c.on=true);showEuler=true;run();}emit();},quiz(value){check();quizOpen=!!value;emit();},answer(i,selected){check();if(!QUIZ[i]||answers[i]!==undefined||!Number.isInteger(selected)||selected<0||selected>=QUIZ[i].opts.length)return;answers[i]=selected;status=(selected===QUIZ[i].a?'答对了！':'再巩固一下。')+QUIZ[i].tip;emit();},down(e){if(!svg||!alive)return;check();const name=e.target?.dataset?.v;if(!['A','B','C'].includes(name))return;e.preventDefault();stop();vertex=name;dragging={pointer:e.pointerId,name};svg.setPointerCapture(e.pointerId);emit();},move(e){if(!dragging||e.pointerId!==dragging.pointer||!svg)return;check();e.preventDefault();const p=pointer(e);P[dragging.name]={x:Math.max(20,Math.min(980,p.x)),y:Math.max(20,Math.min(680,p.y))};emit();},up(e){if(dragging&&(!e||e.pointerId===dragging.pointer)){dragging=null;emit();}},key(e){const name=e.target?.dataset?.v;if(!['A','B','C'].includes(name)||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();vertex=name;const amount=e.shiftKey?10:1;coord(['ArrowLeft','ArrowRight'].includes(e.key)?'x':'y',P[name][['ArrowLeft','ArrowRight'].includes(e.key)?'x':'y']+(['ArrowLeft','ArrowUp'].includes(e.key)?-amount:amount));},async fullscreen(){check();try{if(!window.document.fullscreenElement)await window.document.documentElement.requestFullscreen();else await window.document.exitFullscreen();}catch{if(alive){status='当前环境不支持全屏';emit();}}}};
  return {snapshot,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},actions,beforeLeave(){stop();},destroy(){stop();alive=false;svg=null;dragging=null;listeners.clear();window.document.removeEventListener('visibilitychange',visibility);}};
 }};
})();
